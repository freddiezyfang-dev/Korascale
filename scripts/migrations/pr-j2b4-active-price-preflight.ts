/**
 * PR-J2B4 read-only active price_from preflight.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2b4-active-price-preflight.ts
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import {
	countB4ProposedUpdates,
	evaluateB4Preflight,
	maskDatabaseIdentity,
} from '@/lib/journeyNormalization/activePriceBackfill';
import { PR_J2B4_ACTIVE_MANIFEST } from '@/lib/journeyNormalization/prJ2b4ActiveManifest';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';

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
process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';

async function fetchRows(): Promise<JourneyRowLike[]> {
	const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) throw new Error('Missing POSTGRES_URL');

	const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
	const client = await pool.connect();
	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const result = await client.query(`
      SELECT j.id, j.slug, j.status, j.title, j.price, j.price_from,
             j.currency, j.price_basis, j.price_on_request
      FROM journeys j
      ORDER BY j.slug
    `);
		await client.query('ROLLBACK');
		return result.rows as JourneyRowLike[];
	} finally {
		client.release();
		await pool.end();
	}
}

async function main() {
	const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	const rows = await fetchRows();
	const result = evaluateB4Preflight(rows, PR_J2B4_ACTIVE_MANIFEST, {
		databaseIdentity: maskDatabaseIdentity(connectionString ?? ''),
	});
	const proposedUpdates = countB4ProposedUpdates(rows, PR_J2B4_ACTIVE_MANIFEST);

	console.log(JSON.stringify({ ...result, proposedUpdates }, null, 2));
	if (!result.ready) process.exit(1);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
