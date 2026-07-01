import type { PoolClient } from 'pg';

import { query } from '@/lib/db';

import {
	journeyRevisionSourceMatchSql,
	journeySourceUpdatedAtTimestamptzSql,
	journeyUpdatedAtTokenSql,
	revisionSourceUpdatedAtTokenSql,
} from './concurrencyTimestamp';
import { serializeSourceTimestamp, serializeTimestamp } from './timestamps';
import type {
	JourneyRevisionOperation,
	JourneyRevisionRecord,
	JourneyRevisionReviewMetadata,
	JourneyRevisionSnapshot,
	JourneyRevisionStatus,
	JourneyRevisionValidationReport,
	ListJourneyRevisionsParams,
} from './types';

const JOURNEY_ROW_SELECT = `*, ${journeyUpdatedAtTokenSql('updated_at')} AS journey_revision_source_updated_at`;

export type JourneyRevisionRow = {
	id: string;
	journey_id: string | null;
	operation: JourneyRevisionOperation;
	status: JourneyRevisionStatus;
	schema_version: number;
	source_updated_at: Date | string | null;
	source_snapshot: JourneyRevisionSnapshot | null;
	proposed_snapshot: JourneyRevisionSnapshot;
	change_summary: string[] | unknown;
	validation_report: JourneyRevisionValidationReport | unknown;
	review_metadata: JourneyRevisionReviewMetadata | unknown;
	created_by: string;
	published_by: string | null;
	created_at: Date | string;
	updated_at: Date | string;
	published_at: Date | string | null;
	rejected_at: Date | string | null;
	source_updated_at_token?: string | null;
};

export function mapJourneyRevisionRow(row: JourneyRevisionRow): JourneyRevisionRecord {
	return {
		id: String(row.id),
		journeyId: row.journey_id ? String(row.journey_id) : null,
		operation: row.operation,
		status: row.status,
		schemaVersion: Number(row.schema_version ?? 1),
		sourceUpdatedAt: serializeSourceTimestamp(
			row.source_updated_at_token ?? row.source_updated_at,
			'source_updated_at'
		),
		sourceSnapshot: row.source_snapshot ?? null,
		proposedSnapshot: row.proposed_snapshot,
		changeSummary: Array.isArray(row.change_summary) ? (row.change_summary as string[]) : [],
		validationReport: (row.validation_report as JourneyRevisionValidationReport) ?? {
			errors: [],
			warnings: [],
		},
		reviewMetadata: (row.review_metadata as JourneyRevisionReviewMetadata) ?? {},
		createdBy: String(row.created_by),
		publishedBy: row.published_by ? String(row.published_by) : null,
		createdAt: serializeTimestamp(row.created_at, 'created_at') ?? '',
		updatedAt: serializeTimestamp(row.updated_at, 'updated_at') ?? '',
		publishedAt: serializeTimestamp(row.published_at, 'published_at'),
		rejectedAt: serializeTimestamp(row.rejected_at, 'rejected_at'),
	};
}

export async function journeyRevisionsTableExists(client?: PoolClient): Promise<boolean> {
	const sql = `
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'journey_revisions'
    ) AS exists
  `;
	if (client) {
		const { rows } = await client.query<{ exists: boolean }>(sql);
		return rows[0]?.exists === true;
	}
	const { rows } = await query<{ exists: boolean }>(sql);
	return rows[0]?.exists === true;
}

export async function getJourneyRowById(
	id: string,
	client?: PoolClient
): Promise<Record<string, unknown> | null> {
	const sql = `SELECT ${JOURNEY_ROW_SELECT} FROM journeys WHERE id = $1 LIMIT 1`;
	if (client) {
		const { rows } = await client.query(sql, [id]);
		return rows[0] ?? null;
	}
	const { rows } = await query(sql, [id]);
	return rows[0] ?? null;
}

export async function findJourneyRowByNormalizedSlug(
	slug: string,
	client?: PoolClient
): Promise<Record<string, unknown> | null> {
	const { normalizeJourneySlugForComparison } = await import('@/lib/journeyNormalization/slug');
	const normalized = normalizeJourneySlugForComparison(slug);
	if (!normalized) return null;
	const sql = `SELECT ${JOURNEY_ROW_SELECT} FROM journeys`;
	const rows = client ? (await client.query(sql)).rows : (await query(sql)).rows;
	return (
		rows.find(
			(row) => normalizeJourneySlugForComparison((row as { slug: string }).slug) === normalized
		) ?? null
	);
}

export async function getJourneyRevisionById(
	id: string,
	client?: PoolClient
): Promise<JourneyRevisionRecord | null> {
	const sql = `SELECT *, ${revisionSourceUpdatedAtTokenSql('source_updated_at')} AS source_updated_at_token FROM journey_revisions WHERE id = $1 LIMIT 1`;
	const rows = client
		? (await client.query<JourneyRevisionRow>(sql, [id])).rows
		: (await query<JourneyRevisionRow>(sql, [id])).rows;
	if (rows.length === 0) return null;
	return mapJourneyRevisionRow(rows[0]);
}

export async function listJourneyRevisions(
	params: ListJourneyRevisionsParams = {},
	client?: PoolClient
): Promise<
	Array<
		JourneyRevisionRow & {
			journey_title: string | null;
			journey_slug: string | null;
			journey_updated_at: string | null;
			source_timestamp_matches: boolean | null;
		}
	>
> {
	const status = params.status ?? 'pending_review';
	const conditions = ['jr.status = $1'];
	const values: unknown[] = [status];
	let paramIndex = 2;

	if (params.journeyId) {
		conditions.push(`jr.journey_id = $${paramIndex++}`);
		values.push(params.journeyId);
	}

	if (params.slug?.trim()) {
		conditions.push(
			`(LOWER(BTRIM(j.slug)) = LOWER(BTRIM($${paramIndex})) OR LOWER(BTRIM(jr.proposed_snapshot->>'slug')) = LOWER(BTRIM($${paramIndex})))`
		);
		values.push(params.slug.trim());
		paramIndex++;
	}

	const order =
		params.sort === 'createdAtDesc' ? 'jr.created_at DESC' : 'jr.created_at ASC';

	const sql = `
    SELECT
      jr.*,
      ${revisionSourceUpdatedAtTokenSql('jr.source_updated_at')} AS source_updated_at_token,
      j.title AS journey_title,
      j.slug AS journey_slug,
      ${journeyUpdatedAtTokenSql('j.updated_at')} AS journey_updated_at,
      CASE
        WHEN jr.source_updated_at IS NULL OR j.updated_at IS NULL THEN NULL
        ELSE ${journeyRevisionSourceMatchSql('j.updated_at', 'jr.source_updated_at')}
      END AS source_timestamp_matches
    FROM journey_revisions jr
    LEFT JOIN journeys j ON j.id = jr.journey_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${order}
  `;

	const rows = client
		? (await client.query(sql, values)).rows
		: (await query(sql, values)).rows;

	return rows as Array<
		JourneyRevisionRow & {
			journey_title: string | null;
			journey_slug: string | null;
			journey_updated_at: string | null;
			source_timestamp_matches: boolean | null;
		}
	>;
}

export async function supersedePendingJourneyRevisions(
	journeyId: string,
	client?: PoolClient
): Promise<string[]> {
	const pendingSql = `
    SELECT id FROM journey_revisions
    WHERE journey_id = $1 AND status = 'pending_review'
  `;
	const pendingRows = client
		? (await client.query<{ id: string }>(pendingSql, [journeyId])).rows
		: (await query<{ id: string }>(pendingSql, [journeyId])).rows;
	if (pendingRows.length === 0) return [];

	const ids = pendingRows.map((r) => String(r.id));
	const updateSql = `
    UPDATE journey_revisions
    SET status = 'superseded', updated_at = NOW()
    WHERE journey_id = $1 AND status = 'pending_review'
  `;
	if (client) await client.query(updateSql, [journeyId]);
	else await query(updateSql, [journeyId]);
	return ids;
}

export async function getRevisionSourceTimestampMatch(
	revisionId: string,
	client?: PoolClient
): Promise<boolean | null> {
	const sql = `
    SELECT CASE
      WHEN jr.source_updated_at IS NULL OR j.updated_at IS NULL THEN NULL
      ELSE ${journeyRevisionSourceMatchSql('j.updated_at', 'jr.source_updated_at')}
    END AS source_timestamp_matches
    FROM journey_revisions jr
    LEFT JOIN journeys j ON j.id = jr.journey_id
    WHERE jr.id = $1
    LIMIT 1
  `;
	const rows = client
		? (await client.query<{ source_timestamp_matches: boolean | null }>(sql, [revisionId])).rows
		: (await query<{ source_timestamp_matches: boolean | null }>(sql, [revisionId])).rows;
	const value = rows[0]?.source_timestamp_matches;
	return typeof value === 'boolean' ? value : null;
}

export async function insertJourneyRevision(params: {
	journeyId: string | null;
	operation: JourneyRevisionOperation;
	sourceUpdatedAt: string | null;
	sourceSnapshot: JourneyRevisionSnapshot | null;
	proposedSnapshot: JourneyRevisionSnapshot;
	changeSummary: string[];
	validationReport: JourneyRevisionValidationReport;
	reviewMetadata: JourneyRevisionReviewMetadata;
	createdBy: string;
	client?: PoolClient;
}): Promise<string> {
	const sql = `
    INSERT INTO journey_revisions (
      journey_id, operation, status, schema_version,
      source_updated_at, source_snapshot, proposed_snapshot,
      change_summary, validation_report, review_metadata, created_by
    ) VALUES (
      $1, $2, 'pending_review', 1,
      $3, $4::jsonb, $5::jsonb,
      $6::jsonb, $7::jsonb, $8::jsonb, $9
    )
    RETURNING id
  `;
	const values = [
		params.journeyId,
		params.operation,
		params.sourceUpdatedAt
			? serializeSourceTimestamp(params.sourceUpdatedAt, 'sourceUpdatedAt')
			: null,
		params.sourceSnapshot ? JSON.stringify(params.sourceSnapshot) : null,
		JSON.stringify(params.proposedSnapshot),
		JSON.stringify(params.changeSummary),
		JSON.stringify(params.validationReport),
		JSON.stringify(params.reviewMetadata),
		params.createdBy,
	];

	if (params.client) {
		const { rows } = await params.client.query<{ id: string }>(sql, values);
		return String(rows[0]?.id ?? '');
	}
	const { rows } = await query<{ id: string }>(sql, values);
	return String(rows[0]?.id ?? '');
}

export async function insertJourneyRevisionFromLockedJourney(params: {
	journeyId: string;
	operation: JourneyRevisionOperation;
	sourceSnapshot: JourneyRevisionSnapshot;
	proposedSnapshot: JourneyRevisionSnapshot;
	changeSummary: string[];
	validationReport: JourneyRevisionValidationReport;
	reviewMetadata: JourneyRevisionReviewMetadata;
	createdBy: string;
	client: PoolClient;
}): Promise<string> {
	const sql = `
    INSERT INTO journey_revisions (
      journey_id, operation, status, schema_version,
      source_updated_at, source_snapshot, proposed_snapshot,
      change_summary, validation_report, review_metadata, created_by
    )
    SELECT
      $1, $2, 'pending_review', 1,
      ${journeySourceUpdatedAtTimestamptzSql('j.updated_at')},
      $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8
    FROM journeys j
    WHERE j.id = $1
    RETURNING id
  `;
	const values = [
		params.journeyId,
		params.operation,
		JSON.stringify(params.sourceSnapshot),
		JSON.stringify(params.proposedSnapshot),
		JSON.stringify(params.changeSummary),
		JSON.stringify(params.validationReport),
		JSON.stringify(params.reviewMetadata),
		params.createdBy,
	];
	const { rows } = await params.client.query<{ id: string }>(sql, values);
	const id = String(rows[0]?.id ?? '');
	if (!id) {
		throw new Error('Failed to insert Journey revision from locked Journey row.');
	}
	return id;
}

export async function markJourneyRevisionPublished(params: {
	revisionId: string;
	publishedBy: string;
	journeyId?: string | null;
	client: PoolClient;
}): Promise<void> {
	await params.client.query(
		`
    UPDATE journey_revisions
    SET status = 'published',
        published_at = NOW(),
        published_by = $2,
        journey_id = COALESCE($3, journey_id),
        updated_at = NOW()
    WHERE id = $1 AND status = 'pending_review'
  `,
		[params.revisionId, params.publishedBy, params.journeyId ?? null]
	);
}

export async function markJourneyRevisionRejected(params: {
	revisionId: string;
	reason?: string;
	client?: PoolClient;
}): Promise<void> {
	const sql = `
    UPDATE journey_revisions
    SET status = 'rejected',
        rejected_at = NOW(),
        updated_at = NOW(),
        review_metadata = COALESCE(review_metadata, '{}'::jsonb) || $2::jsonb
    WHERE id = $1 AND status IN ('pending_review', 'draft')
  `;
	const metadata = JSON.stringify(
		params.reason ? { rejectionReason: params.reason } : {}
	);
	if (params.client) {
		await params.client.query(sql, [params.revisionId, metadata]);
	} else {
		await query(sql, [params.revisionId, metadata]);
	}
}

export async function lockJourneyRevisionForUpdate(
	id: string,
	client: PoolClient
): Promise<JourneyRevisionRecord | null> {
	const { rows } = await client.query<JourneyRevisionRow>(
		`
      SELECT *, ${revisionSourceUpdatedAtTokenSql('source_updated_at')} AS source_updated_at_token
      FROM journey_revisions
      WHERE id = $1
      FOR UPDATE
    `,
		[id]
	);
	if (rows.length === 0) return null;
	return mapJourneyRevisionRow(rows[0]);
}

export async function lockJourneyForUpdate(
	id: string,
	client: PoolClient
): Promise<Record<string, unknown> | null> {
	const { rows } = await client.query(
		`SELECT ${JOURNEY_ROW_SELECT} FROM journeys WHERE id = $1 FOR UPDATE`,
		[id]
	);
	return rows[0] ?? null;
}

export async function readJourneyRowById(
	id: string,
	client: PoolClient
): Promise<Record<string, unknown> | null> {
	const { rows } = await client.query(
		`SELECT ${JOURNEY_ROW_SELECT} FROM journeys WHERE id = $1`,
		[id]
	);
	return rows[0] ?? null;
}
