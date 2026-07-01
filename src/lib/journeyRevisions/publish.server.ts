import { withTransaction } from '@/lib/db';
import {
	buildJourneyCreateMutation,
	buildJourneyUpdateMutation,
	sanitizeJourneyCreateBody,
	sanitizeJourneyUpdateBody,
} from '@/lib/journeyNormalization/journeyAdminMutation.server';
import { runJourneyPublishIntegrityGate } from '@/lib/journeyNormalization/journeyPublishIntegrityGate.server';

import { JourneyRevisionError, JOURNEY_REVISION_ERROR_CODES } from './errors';
import {
	getJourneyRevisionDetail,
} from './dryRun.server';
import { journeyRevisionSourceMatchSql } from './concurrencyTimestamp';
import { verifyRevisionPublishPostWriteIntegrity } from './postWriteIntegrity.server';
import {
	journeyRevisionsTableExists,
	lockJourneyForUpdate,
	lockJourneyRevisionForUpdate,
	markJourneyRevisionPublished,
	readJourneyRowById,
} from './repository.server';
import { REVISION_PUBLISH_MUTATION_OPTIONS } from './revisionPublishMutation.server';
import { deepCloneJson, snapshotToMutationBody } from './snapshot';
import { assertRevisionPublishable } from './stateMachine';
import { validateResolvedProposedSnapshot, withClientQuery } from './validation';

export async function publishJourneyRevision(params: {
	revisionId: string;
	publishedBy: string;
}): Promise<NonNullable<Awaited<ReturnType<typeof getJourneyRevisionDetail>>>> {
	const tableExists = await journeyRevisionsTableExists();
	if (!tableExists) {
		throw new JourneyRevisionError(
			'Journey revision table is not available.',
			JOURNEY_REVISION_ERROR_CODES.INVALID_REQUEST,
			503
		);
	}

	await withTransaction(async (client) => {
		const locked = await lockJourneyRevisionForUpdate(params.revisionId, client);
		if (!locked) {
			throw new JourneyRevisionError(
				'Revision not found.',
				JOURNEY_REVISION_ERROR_CODES.NOT_FOUND,
				404
			);
		}

		try {
			assertRevisionPublishable(locked.status);
		} catch {
			if (locked.status === 'published') {
				throw new JourneyRevisionError(
					'Revision is already published.',
					JOURNEY_REVISION_ERROR_CODES.ALREADY_PUBLISHED,
					409
				);
			}
			throw new JourneyRevisionError(
				'Revision cannot be published in its current state.',
				JOURNEY_REVISION_ERROR_CODES.INVALID_STATE,
				409
			);
		}

		let journeyRow: Record<string, unknown> | null = null;
		let preWriteRow: Record<string, unknown> | null = null;
		if (locked.journeyId) {
			journeyRow = await lockJourneyForUpdate(locked.journeyId, client);
			if (!journeyRow) {
				throw new JourneyRevisionError(
					'Source Journey no longer exists.',
					JOURNEY_REVISION_ERROR_CODES.JOURNEY_NOT_FOUND,
					404
				);
			}
			preWriteRow = deepCloneJson(journeyRow);

			const matchRes = await client.query<{ source_timestamp_matches: boolean }>(
				`
          SELECT ${journeyRevisionSourceMatchSql('j.updated_at', 'jr.source_updated_at')} AS source_timestamp_matches
          FROM journeys j
          JOIN journey_revisions jr ON jr.id = $2
          WHERE j.id = $1
          LIMIT 1
        `,
				[locked.journeyId, locked.id]
			);
			const sourceTimestampMatches = matchRes.rows[0]?.source_timestamp_matches === true;
			if (locked.sourceUpdatedAt && !sourceTimestampMatches) {
				throw new JourneyRevisionError(
					'The Journey changed after this revision was created. Create a new revision from the latest version.',
					JOURNEY_REVISION_ERROR_CODES.SOURCE_CHANGED,
					409
				);
			}
		}

		const validation = await validateResolvedProposedSnapshot({
			operation: locked.operation,
			journeyRow,
			sourceUpdatedAt: locked.sourceUpdatedAt,
			proposed: locked.proposedSnapshot,
			runQuery: (text, params = []) => withClientQuery(client, text, params),
		});

		if (!validation.valid) {
			throw new JourneyRevisionError(
				'Revision validation failed at publish time.',
				JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
				422,
				validation.report.errors
			);
		}

		const proposed = locked.proposedSnapshot;
		const mutationBody = snapshotToMutationBody(proposed);
		const gate = await runJourneyPublishIntegrityGate({
			id: locked.journeyId ?? undefined,
			title: proposed.title,
			slug: proposed.slug,
			short_description: proposed.short_description,
			page_title: proposed.page_title,
			meta_description: proposed.meta_description,
			hero_image_url: proposed.hero_image_url,
			hero_image_alt: proposed.hero_image_alt,
			journey_type_slug: proposed.journey_type_slug,
			status: proposed.status as 'draft' | 'active' | 'archived',
		});

		const seoComplete = gate.ok ? gate.seoComplete : false;
		if (proposed.status === 'active' && !gate.ok) {
			throw new JourneyRevisionError(
				gate.body.message,
				JOURNEY_REVISION_ERROR_CODES.PUBLISH_INTEGRITY_FAILED,
				422,
				gate.body.fields.map((f) => ({ field: f.field, code: f.code, message: f.message }))
			);
		}

		let publishedJourneyId: string | null = locked.journeyId;

		if (locked.operation === 'create') {
			const body = sanitizeJourneyCreateBody(mutationBody);
			const mutation = buildJourneyCreateMutation(
				body,
				seoComplete,
				REVISION_PUBLISH_MUTATION_OPTIONS
			);
			const insertResult = await client.query(mutation.insertSql, mutation.insertParams);
			const newId = insertResult.rows[0]?.id;
			if (!newId) {
				throw new JourneyRevisionError(
					'Failed to create Journey.',
					JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
					500
				);
			}
			publishedJourneyId = String(newId);
		} else if (locked.journeyId && journeyRow) {
			const body = sanitizeJourneyUpdateBody(mutationBody);
			const mutation = await buildJourneyUpdateMutation(
				locked.journeyId,
				journeyRow,
				body,
				seoComplete,
				REVISION_PUBLISH_MUTATION_OPTIONS
			);
			if (mutation.hasUpdates) {
				await client.query(mutation.updateSql, mutation.updateValues);
			}
		}

		if (!publishedJourneyId) {
			throw new JourneyRevisionError(
				'Publish did not resolve a Journey id.',
				JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
				500
			);
		}

		const postWriteRow = await readJourneyRowById(publishedJourneyId, client);
		if (!postWriteRow) {
			throw new JourneyRevisionError(
				'Journey row missing after publish write.',
				JOURNEY_REVISION_ERROR_CODES.POST_WRITE_INTEGRITY_FAILED,
				500
			);
		}

		const integrityFailures = verifyRevisionPublishPostWriteIntegrity({
			operation: locked.operation,
			preWriteRow,
			postWriteRow,
			proposed,
			seoComplete,
		});
		if (integrityFailures.length > 0) {
			throw new JourneyRevisionError(
				'Journey revision publish failed post-write integrity verification.',
				JOURNEY_REVISION_ERROR_CODES.POST_WRITE_INTEGRITY_FAILED,
				500,
				integrityFailures.map((failure) => ({
					field: failure.field,
					code: failure.code,
					message: failure.message,
				}))
			);
		}

		await markJourneyRevisionPublished({
			revisionId: params.revisionId,
			publishedBy: params.publishedBy,
			journeyId: publishedJourneyId,
			client,
		});

		if (publishedJourneyId) {
			await client.query(
				`
        UPDATE journey_revisions
        SET status = 'superseded', updated_at = NOW()
        WHERE journey_id = $1 AND status = 'pending_review' AND id <> $2
      `,
				[publishedJourneyId, params.revisionId]
			);
		}
	});

	const detail = await getJourneyRevisionDetail(params.revisionId);
	if (!detail) {
		throw new JourneyRevisionError(
			'Revision not found after publish.',
			JOURNEY_REVISION_ERROR_CODES.NOT_FOUND,
			404
		);
	}
	return detail;
}

export { rejectJourneyRevision } from './dryRun.server';
