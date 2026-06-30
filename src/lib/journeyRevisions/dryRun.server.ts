import { query } from '@/lib/db';

import { JourneyRevisionError, JOURNEY_REVISION_ERROR_CODES } from './errors';
import {
	getJourneyRowById,
	insertJourneyRevision,
	journeyRevisionsTableExists,
	supersedePendingJourneyRevisions,
} from './repository.server';
import { rowToJourneyRevisionSnapshot, serializeJourneyUpdatedAt } from './snapshot';
import { allowedActionsForStatus } from './stateMachine';
import type {
	JourneyRevisionCreateResult,
	JourneyRevisionDetail,
	JourneyRevisionDryRunRequest,
	JourneyRevisionDryRunResult,
	JourneyRevisionReviewMetadata,
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
	if (journeyId) {
		await supersedePendingJourneyRevisions(journeyId);
	}

	const sourceSnapshot =
		journeyId && params.request.operation !== 'create'
			? rowToJourneyRevisionSnapshot((await getJourneyRowById(journeyId))!)
			: null;

	const reviewMetadata: JourneyRevisionReviewMetadata = params.request.reviewMetadata ?? {};

	const revisionId = await insertJourneyRevision({
		journeyId,
		operation: params.request.operation,
		sourceUpdatedAt: params.request.sourceUpdatedAt ?? null,
		sourceSnapshot,
		proposedSnapshot: dryRun.resolvedSnapshot,
		changeSummary: dryRun.changeSummary,
		validationReport: dryRun.validationReport,
		reviewMetadata,
		createdBy: params.createdBy,
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

	if (revision.journeyId && revision.sourceUpdatedAt) {
		const journey = await getJourneyRowById(revision.journeyId);
		if (!journey) {
			hasSourceConflict = true;
			sourceConflictMessage = 'Source Journey no longer exists.';
		} else {
			const live = serializeJourneyUpdatedAt(journey.updated_at as string | Date);
			hasSourceConflict = live !== revision.sourceUpdatedAt;
			if (hasSourceConflict) {
				sourceConflictMessage =
					'The Journey changed after this revision was created. Create a new revision from the latest version.';
			}
		}
	}

	return {
		revision,
		allowedActions: allowedActionsForStatus(revision.status),
		hasSourceConflict,
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
