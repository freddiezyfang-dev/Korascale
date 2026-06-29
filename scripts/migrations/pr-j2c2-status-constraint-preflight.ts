/**
 * PR-J2C2 read-only 025C1 status constraint preflight.
 * Does NOT provide --apply. Migration execution is manual and separately authorized.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2c2-status-constraint-preflight.ts
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import {
	evaluateStatusConstraintPreflight,
	maskDatabaseIdentity,
} from '@/lib/journeyNormalization/statusConstraint025c1';
import { buildPublicStatusWhereClause } from '@/lib/journeyNormalization/status';
import {
	normalizeJourneyStatusForWrite,
	validateJourneyStatusForApiWrite,
} from '@/lib/journeyNormalization/write';

function loadEnvLocal() {
	const envPath = path.join(process.cwd(), '.env.local');
	if (!fs.existsSync(envPath)) return;
	for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const idx = trimmed.indexOf('=');
		if (idx === -1) continue;
		const key = trimmed.slice(0, idx).trim();
		let value = trimmed.slice(idx + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (!(key in process.env)) process.env[key] = value;
	}
}

loadEnvLocal();

function writersReady(): boolean {
	try {
		if (normalizeJourneyStatusForWrite('inactive') !== 'archived') return false;
		if (normalizeJourneyStatusForWrite(null, 'draft') !== 'draft') return false;
		if (!validateJourneyStatusForApiWrite('active').ok) return false;
		if (validateJourneyStatusForApiWrite('published').ok) return false;
		return true;
	} catch {
		return false;
	}
}

async function main() {
	const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) throw new Error('Missing POSTGRES_URL');

	const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
	const client = await pool.connect();

	try {
		await client.query('BEGIN TRANSACTION READ ONLY');

		const counts = await client.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active,
        COUNT(*) FILTER (WHERE status = 'archived')::int AS archived,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
        COUNT(*) FILTER (WHERE status = 'inactive')::int AS inactive,
        COUNT(*) FILTER (WHERE status IS NULL)::int AS null_status,
        COUNT(*) FILTER (
          WHERE status IS NOT NULL
            AND status NOT IN ('draft', 'active', 'archived')
        )::int AS illegal_statuses
      FROM journeys
    `);

		const columnMeta = await client.query(`
      SELECT column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'journeys'
        AND column_name = 'status'
    `);

		const constraintMeta = await client.query(`
      SELECT pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'journeys'::regclass
        AND conname = 'journeys_status_check'
    `);

		await client.query('ROLLBACK');

		const row = counts.rows[0] as Record<string, number>;
		const col = columnMeta.rows[0] as { column_default: string | null; is_nullable: string };
		const constraintDef =
			constraintMeta.rows.length > 0
				? (constraintMeta.rows[0] as { definition: string }).definition
				: null;

		const result = evaluateStatusConstraintPreflight({
			databaseIdentity: maskDatabaseIdentity(connectionString),
			total: row.total,
			active: row.active,
			archived: row.archived,
			draft: row.draft,
			inactive: row.inactive,
			nullStatus: row.null_status,
			illegalStatuses: row.illegal_statuses,
			statusDefault: col?.column_default ?? null,
			statusNullable: col?.is_nullable === 'YES',
			existingConstraint: constraintDef != null,
			existingConstraintDefinition: constraintDef,
			publicStrictModeReady: buildPublicStatusWhereClause() === "status = 'active'",
			allWritersReady: writersReady(),
		});

		console.log(JSON.stringify(result, null, 2));

		if (result.noActionRequired) {
			process.exit(0);
		}
		if (!result.ready) {
			process.exit(1);
		}
	} finally {
		client.release();
		await pool.end();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
