import { withTransaction } from '@/lib/db';

import { JourneyRevisionError, JOURNEY_REVISION_ERROR_CODES } from './errors';
import {
	getJourneyRowById,
	getRevisionSourceTimestampMatch,
	insertJourneyRevision,
	insertJourneyRevisionFromLockedJourney,
	journeyRevisionsTableExists,
	listJourneyRevisions,
	lockJourneyForUpdate,
	mapJourneyRevisionRow,
	supersedePendingJourneyRevisions,
} from './repository.server';
import { readCanonicalJourneyUpdatedAt } from './concurrencyTimestamp';
import { rowToJourneyRevisionSnapshot } from './snapshot';
import { serializeSourceTimestamp } from './timestamps';
import { allowedActionsForStatus } from './stateMachine';
import type {
	JourneyRevisionCreateResult,
	JourneyRevisionDetail,
	JourneyRevisionDryRunRequest,
	JourneyRevisionDryRunResult,
	JourneyRevisionListItem,
	JourneyRevisionReviewMetadata,
	ListJourneyRevisionsParams,
} from './types';
import { runJourneyRevisionValidation } from './validation';

async function ensureRevisionInfrastructure() {
	const exists = await journeyRevisionsTableExists();
	if (!exists) {
		throw new JourneyRevisionError(
			'Journey revision table is not available. Migration 027 must be applied in a future deployment.',
			JOURNEY_REVISION_ERROR_CODES.INVALID_REQUEST,
			503
		);
	}
}

export async function dryRunJourneyRevision(
	request: JourneyRevisionDryRunRequest
): Promise<JourneyRevisionDryRunResult> {
	await ensureRevisionInfrastructure();

	const journeyRow =
		request.journeyId && request.operation !== 'create'
			? await getJourneyRowById(request.journeyId)
			: null;

	const result = await runJourneyRevisionValidation(request, {
		journeyRow,
		runQuery: async (text, params = []) => {
			const { query } = await import('@/lib/db');
			const res = await query(text, params);
			return { rows: res.rows as Record<string, unknown>[] };
		},
	});

	return {
		valid: result.valid,
		operation: request.operation,
		journeyId: journeyRow ? String(journeyRow.id) : null,
		sourceUpdatedAtMatched: result.sourceUpdatedAtMatched,
		errors: result.report.errors,
		warnings: result.report.warnings,
		changeSummary: result.changeSummary,
		validationReport: result.report,
		resolvedSnapshot: result.proposed,
	};
}

export async function createJourneyRevision(params: {
	request: JourneyRevisionDryRunRequest;
	createdBy: string;
}): Promise<JourneyRevisionCreateResult> {
	await ensureRevisionInfrastructure();

	const dryRun = await dryRunJourneyRevision(params.request);
	if (!dryRun.valid) {
		throw new JourneyRevisionError(
			'Revision validation failed.',
			JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
			422,
			dryRun.errors
		);
	}

	const journeyId = dryRun.journeyId;
	const reviewMetadata: JourneyRevisionReviewMetadata = params.request.reviewMetadata ?? {};

	const revisionId = await withTransaction(async (client) => {
		if (journeyId) {
			await supersedePendingJourneyRevisions(journeyId, client);
		}

		if (journeyId && params.request.operation !== 'create') {
			const lockedJourney = await lockJourneyForUpdate(journeyId, client);
			if (!lockedJourney) {
				throw new JourneyRevisionError(
					'Source Journey no longer exists.',
					JOURNEY_REVISION_ERROR_CODES.JOURNEY_NOT_FOUND,
					404
				);
			}

			const dbCanonical = readCanonicalJourneyUpdatedAt(lockedJourney);
			if (!dbCanonical) {
				throw new JourneyRevisionError(
					'Unable to resolve Journey concurrency token.',
					JOURNEY_REVISION_ERROR_CODES.SOURCE_CHANGED,
					409
				);
			}

			if (params.request.sourceUpdatedAt) {
				const requestToken = serializeSourceTimestamp(
					params.request.sourceUpdatedAt,
					'sourceUpdatedAt'
				);
				if (requestToken !== dbCanonical) {
					throw new JourneyRevisionError(
						'The Journey changed after this revision baseline. Re-read the Journey and dry-run again.',
						JOURNEY_REVISION_ERROR_CODES.SOURCE_CHANGED,
						409
					);
				}
			}

			if (dryRun.resolvedSnapshot.updated_at !== dbCanonical) {
				throw new JourneyRevisionError(
					'The Journey changed after validation. Re-read the Journey and dry-run again.',
					JOURNEY_REVISION_ERROR_CODES.SOURCE_CHANGED,
					409
				);
			}

			const sourceSnapshot = rowToJourneyRevisionSnapshot(lockedJourney);

			return insertJourneyRevisionFromLockedJourney({
				journeyId,
				operation: params.request.operation,
				sourceSnapshot,
				proposedSnapshot: dryRun.resolvedSnapshot,
				changeSummary: dryRun.changeSummary,
				validationReport: dryRun.validationReport,
				reviewMetadata,
				createdBy: params.createdBy,
				client,
			});
		}

		return insertJourneyRevision({
			journeyId,
			operation: params.request.operation,
			sourceUpdatedAt: null,
			sourceSnapshot: null,
			proposedSnapshot: dryRun.resolvedSnapshot,
			changeSummary: dryRun.changeSummary,
			validationReport: dryRun.validationReport,
			reviewMetadata,
			createdBy: params.createdBy,
			client,
		});
	});

	return {
		revisionId,
		operation: params.request.operation,
		journeyId,
		status: 'pending_review',
		validationSummary: dryRun.validationReport,
		previewPath: `/admin/journey-revisions/${revisionId}/preview`,
	};
}

export async function getJourneyRevisionDetail(id: string): Promise<JourneyRevisionDetail | null> {
	await ensureRevisionInfrastructure();
	const { getJourneyRevisionById } = await import('./repository.server');
	const revision = await getJourneyRevisionById(id);
	if (!revision) return null;

	let hasSourceConflict = false;
	let sourceConflictMessage: string | undefined;
	let sourceTimestampMatches = true;

	if (revision.journeyId && revision.sourceUpdatedAt) {
		const match = await getRevisionSourceTimestampMatch(id);
		if (match === false) {
			hasSourceConflict = true;
			sourceTimestampMatches = false;
			sourceConflictMessage =
				'The Journey changed after this revision was created. Create a new revision from the latest version.';
		} else if (match === null) {
			const journey = await getJourneyRowById(revision.journeyId);
			if (!journey) {
				hasSourceConflict = true;
				sourceTimestampMatches = false;
				sourceConflictMessage = 'Source Journey no longer exists.';
			}
		}
	}

	return {
		revision,
		allowedActions: allowedActionsForStatus(revision.status),
		hasSourceConflict,
		sourceTimestampMatches,
		sourceConflictMessage,
	};
}

export async function rejectJourneyRevision(params: {
	id: string;
	reason?: string;
}): Promise<JourneyRevisionDetail> {
	await ensureRevisionInfrastructure();
	const { getJourneyRevisionById, markJourneyRevisionRejected } = await import(
		'./repository.server'
	);
	const revision = await getJourneyRevisionById(params.id);
	if (!revision) {
		throw new JourneyRevisionError(
			'Revision not found.',
			JOURNEY_REVISION_ERROR_CODES.NOT_FOUND,
			404
		);
	}
	if (revision.status === 'rejected') {
		return (await getJourneyRevisionDetail(params.id))!;
	}
	if (revision.status !== 'pending_review' && revision.status !== 'draft') {
		throw new JourneyRevisionError(
			'Revision cannot be rejected in its current state.',
			JOURNEY_REVISION_ERROR_CODES.INVALID_STATE,
			409
		);
	}

	await markJourneyRevisionRejected({ revisionId: params.id, reason: params.reason });
	const detail = await getJourneyRevisionDetail(params.id);
	if (!detail) {
		throw new JourneyRevisionError(
			'Revision not found after reject.',
			JOURNEY_REVISION_ERROR_CODES.NOT_FOUND,
			404
		);
	}
	return detail;
}

export async function listJourneyRevisionsForAdmin(
	params: ListJourneyRevisionsParams = {}
): Promise<JourneyRevisionListItem[]> {
	await ensureRevisionInfrastructure();
	const rows = await listJourneyRevisions(params);
	return rows.map((row) => {
		const revision = mapJourneyRevisionRow(row);
		const sourceTimestampMatches =
			typeof row.source_timestamp_matches === 'boolean'
				? row.source_timestamp_matches
				: true;
		const hasSourceConflict = !sourceTimestampMatches;
		return {
			id: revision.id,
			journeyId: revision.journeyId,
			operation: revision.operation,
			status: revision.status,
			proposedTitle: revision.proposedSnapshot.title,
			proposedSlug: revision.proposedSnapshot.slug,
			journeyTitle: row.journey_title ? String(row.journey_title) : null,
			journeySlug: row.journey_slug ? String(row.journey_slug) : null,
			createdBy: revision.createdBy,
			createdAt: revision.createdAt,
			updatedAt: revision.updatedAt,
			changeSummary: revision.changeSummary,
			hasSourceConflict,
			sourceTimestampMatches,
			sourceConflictMessage: hasSourceConflict
				? 'The Journey changed after this revision was created. Create a new revision from the latest version.'
				: undefined,
			previewPath: `/admin/journey-revisions/${revision.id}/preview`,
		};
	});
}
