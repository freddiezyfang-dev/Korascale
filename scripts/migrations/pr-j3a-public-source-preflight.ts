/**
 * PR-J3A read-only public source preflight — compares active normalized columns vs legacy.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j3a-public-source-preflight.ts
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import { evaluatePublicSourcePreflight } from '@/lib/journeyNormalization/publicSourcePreflight';
import { buildPublicStatusWhereClause } from '@/lib/journeyNormalization/status';
import { maskDatabaseIdentity } from '@/lib/journeyNormalization/statusConstraint025c1';
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

async function main() {
	const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) throw new Error('Missing POSTGRES_URL');

	const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
	const client = await pool.connect();
	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const result = await client.query(`
      SELECT id, slug, status, title, short_description, image, journey_type,
             page_title, meta_description, hero_image_url, hero_image_alt, journey_type_slug,
             seo_complete, data
      FROM journeys
      ORDER BY slug
    `);
		await client.query('ROLLBACK');

		const rows = result.rows as JourneyRowLike[];
		const evaluation = evaluatePublicSourcePreflight(rows);

		const output = {
			phase: 'PR-J3A',
			readOnly: true,
			databaseIdentity: maskDatabaseIdentity(connectionString),
			publicStrictSql: buildPublicStatusWhereClause(),
			...evaluation,
		};

		console.log(JSON.stringify(output, null, 2));
		if (!output.ready) process.exit(1);
	} finally {
		client.release();
		await pool.end();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
