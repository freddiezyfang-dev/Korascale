/**
 * PR-J2C1 strict query dry-run — read-only.
 *
 * Compares compat vs strict public journey counts against production DB.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2c-strict-query-dry-run.ts
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import {
	buildPublicStatusWhereClause,
	isPublicJourneyStatusCompat,
	isPublicJourneyStatusStrict,
	JOURNEY_PUBLIC_STATUS_SQL_COMPAT,
	JOURNEY_PUBLIC_STATUS_SQL_STRICT,
} from '@/lib/journeyNormalization/status';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';

const EXPECTED_ACTIVE_JOURNEY_COUNT = 24;
const EXPECTED_EXPLORE_TOGETHER_COUNT = 8;
const EXPECTED_DEEP_DISCOVERY_COUNT = 16;

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

function countPublicJourneys(rows: JourneyRowLike[], mode: 'strict' | 'compat') {
	const isPublic = mode === 'strict' ? isPublicJourneyStatusStrict : isPublicJourneyStatusCompat;
	const publicRows = rows.filter((row) => isPublic(row.status));
	return {
		total: publicRows.length,
		exploreTogether: publicRows.filter(
			(row) => String(row.journey_type_slug ?? '') === 'explore-together'
		).length,
		deepDiscovery: publicRows.filter(
			(row) => String(row.journey_type_slug ?? '') === 'deep-discovery'
		).length,
	};
}

async function fetchRows(): Promise<JourneyRowLike[]> {
	const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) throw new Error('Missing POSTGRES_URL');

	const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
	const client = await pool.connect();
	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const result = await client.query(`
      SELECT id, slug, status, journey_type_slug
      FROM journeys
      ORDER BY slug
    `);
		await client.query('ROLLBACK');
		return result.rows as JourneyRowLike[];
	} finally {
		client.release();
		await pool.end();
	}
}

async function main() {
	const rows = await fetchRows();
	const strict = countPublicJourneys(rows, 'strict');
	const compat = countPublicJourneys(rows, 'compat');
	const nullStatus = rows.filter((r) => r.status == null).length;

	const result = {
		phase: 'PR-J2C1',
		readOnly: true,
		totalRows: rows.length,
		nullStatus,
		sql: {
			defaultPublicWhere: buildPublicStatusWhereClause(),
			strict: JOURNEY_PUBLIC_STATUS_SQL_STRICT,
			compat: JOURNEY_PUBLIC_STATUS_SQL_COMPAT,
		},
		strict,
		compat,
		delta: {
			total: compat.total - strict.total,
			exploreTogether: compat.exploreTogether - strict.exploreTogether,
			deepDiscovery: compat.deepDiscovery - strict.deepDiscovery,
		},
		expected: {
			publicTotal: EXPECTED_ACTIVE_JOURNEY_COUNT,
			exploreTogether: EXPECTED_EXPLORE_TOGETHER_COUNT,
			deepDiscovery: EXPECTED_DEEP_DISCOVERY_COUNT,
		},
		ready:
			nullStatus === 0 &&
			strict.total === EXPECTED_ACTIVE_JOURNEY_COUNT &&
			compat.total === EXPECTED_ACTIVE_JOURNEY_COUNT &&
			strict.exploreTogether === EXPECTED_EXPLORE_TOGETHER_COUNT &&
			strict.deepDiscovery === EXPECTED_DEEP_DISCOVERY_COUNT,
	};

	console.log(JSON.stringify(result, null, 2));
	if (!result.ready) process.exit(1);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
