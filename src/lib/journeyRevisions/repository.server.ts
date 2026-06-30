import type { PoolClient } from 'pg';

import { query } from '@/lib/db';

import type {
	JourneyRevisionOperation,
	JourneyRevisionRecord,
	JourneyRevisionReviewMetadata,
	JourneyRevisionSnapshot,
	JourneyRevisionStatus,
	JourneyRevisionValidationReport,
} from './types';

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
};

export function mapJourneyRevisionRow(row: JourneyRevisionRow): JourneyRevisionRecord {
	return {
		id: String(row.id),
		journeyId: row.journey_id ? String(row.journey_id) : null,
		operation: row.operation,
		status: row.status,
		schemaVersion: Number(row.schema_version ?? 1),
		sourceUpdatedAt: row.source_updated_at
			? new Date(String(row.source_updated_at)).toISOString()
			: null,
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
		createdAt: new Date(String(row.created_at)).toISOString(),
		updatedAt: new Date(String(row.updated_at)).toISOString(),
		publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : null,
		rejectedAt: row.rejected_at ? new Date(String(row.rejected_at)).toISOString() : null,
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
	const sql = `SELECT * FROM journeys WHERE id = $1 LIMIT 1`;
	if (client) {
		const { rows } = await client.query(sql, [id]);
		return rows[0] ?? null;
	}
	const { rows } = await query(sql, [id]);
	return rows[0] ?? null;
}

export async function getJourneyRevisionById(
	id: string,
	client?: PoolClient
): Promise<JourneyRevisionRecord | null> {
	const sql = `SELECT * FROM journey_revisions WHERE id = $1 LIMIT 1`;
	const rows = client
		? (await client.query<JourneyRevisionRow>(sql, [id])).rows
		: (await query<JourneyRevisionRow>(sql, [id])).rows;
	if (rows.length === 0) return null;
	return mapJourneyRevisionRow(rows[0]);
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
		params.sourceUpdatedAt ? new Date(params.sourceUpdatedAt) : null,
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
		`SELECT * FROM journey_revisions WHERE id = $1 FOR UPDATE`,
		[id]
	);
	if (rows.length === 0) return null;
	return mapJourneyRevisionRow(rows[0]);
}

export async function lockJourneyForUpdate(
	id: string,
	client: PoolClient
): Promise<Record<string, unknown> | null> {
	const { rows } = await client.query(`SELECT * FROM journeys WHERE id = $1 FOR UPDATE`, [id]);
	return rows[0] ?? null;
}
