/**
 * PR-J2C0 constraint preflight — read-only.
 *
 * Validates production data against proposed 025C1 / 025C2 CHECK constraints.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2c-constraint-preflight.ts
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import {
	evaluateOptionalFieldConstraintReadiness,
	evaluateStatusConstraintReadiness,
} from '@/lib/journeyNormalization/constraintReadiness';
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

async function fetchRows(): Promise<JourneyRowLike[]> {
	const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) throw new Error('Missing POSTGRES_URL');

	const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
	const client = await pool.connect();
	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const result = await client.query(`
      SELECT id, slug, status, journey_type_slug, currency, price_basis,
             price_from, seo_complete, page_title, meta_description,
             hero_image_url, hero_image_alt
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
	const status = evaluateStatusConstraintReadiness(rows);
	const optional = evaluateOptionalFieldConstraintReadiness(rows);

	const activePriceFilled = rows.filter(
		(r) =>
			String(r.status).toLowerCase() === 'active' &&
			r.price_from != null &&
			String(r.price_from).trim() !== ''
	).length;
	const activeCurrencyFilled = rows.filter(
		(r) =>
			String(r.status).toLowerCase() === 'active' &&
			r.currency != null &&
			String(r.currency).trim() !== ''
	).length;
	const activeBasisFilled = rows.filter(
		(r) =>
			String(r.status).toLowerCase() === 'active' &&
			r.price_basis != null &&
			String(r.price_basis).trim() !== ''
	).length;

	const result = {
		phase: 'PR-J2C0',
		readOnly: true,
		migrations: {
			'025C1': { executed: false, ready: status.ready },
			'025C2': { executed: false, ready: optional.ready },
		},
		rowCounts: {
			total: rows.length,
			active: status.active,
			archived: rows.filter((r) => String(r.status).toLowerCase() === 'archived').length,
		},
		status025C1: status,
		optional025C2: optional,
		priceFrozen: {
			activePriceFromFilled: activePriceFilled,
			activeCurrencyFilled: activeCurrencyFilled,
			activePriceBasisFilled: activeBasisFilled,
		},
		fieldsExplicitlyNoNotNull: [
			'page_title',
			'meta_description',
			'hero_image_url',
			'hero_image_alt',
			'seo_complete',
			'journey_type_slug',
		],
		ready: status.ready && optional.ready,
	};

	console.log(JSON.stringify(result, null, 2));
	if (!result.ready) process.exit(1);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
