/**
 * Generate PR-J2 manual review CSVs (read-only).
 * Usage: npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2-generate-review-csvs.ts
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import { evaluatePriceCompleteness } from '@/lib/journeyNormalization/price';
import { evaluateJourneySeoCompleteness } from '@/lib/journeyNormalization/seo';
import { resolveHeroImageAlt, resolveHeroImageUrl } from '@/lib/journeyNormalization/fields';
import { isPublicJourneyStatusCompat } from '@/lib/journeyNormalization/status';
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

function csvEscape(v: unknown): string {
	const s = v == null ? '' : String(v);
	if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
	return s;
}

loadEnvLocal();

async function main() {
	const connectionString =
		process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) throw new Error('Missing POSTGRES_URL');

	const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
	const client = await pool.connect();
	let rows: JourneyRowLike[] = [];
	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const result = await client.query(`
      SELECT id, slug, status, title, price, image, data
      FROM journeys
      ORDER BY title ASC
    `);
		await client.query('ROLLBACK');
		rows = result.rows as JourneyRowLike[];
	} finally {
		client.release();
		await pool.end();
	}

	const activeRows = rows.filter((row) => isPublicJourneyStatusCompat(row.status));
	const outDir = path.join(process.cwd(), 'docs/audits');
	fs.mkdirSync(outDir, { recursive: true });

	const heroLines = [
		[
			'id',
			'slug',
			'journey_title',
			'hero_image_url',
			'current_alt',
			'proposed_alt',
			'reviewer_decision',
			'notes',
		].join(','),
		...activeRows.map((row) => {
			const hero = resolveHeroImageUrl(row);
			const alt = resolveHeroImageAlt(row);
			return [
				row.id,
				row.slug,
				row.title,
				hero.value,
				alt.value,
				'',
				'',
				alt.value ? 'has_alt' : 'needs_manual_alt',
			]
				.map(csvEscape)
				.join(',');
		}),
	];
	fs.writeFileSync(
		path.join(outDir, 'pr-j2-hero-alt-manual-review.csv'),
		`${heroLines.join('\n')}\n`
	);

	const priceLines = [
		[
			'id',
			'slug',
			'journey_title',
			'current_price',
			'currency',
			'price_basis',
			'price_on_request',
			'price_note',
			'reviewer_decision',
			'notes',
		].join(','),
		...rows.map((row) => {
			const price = evaluatePriceCompleteness(row);
			const data = (row.data as Record<string, unknown>) || {};
			return [
				row.id,
				row.slug,
				row.title,
				price.currentPrice ?? '',
				price.currency ?? '',
				price.priceBasis ?? '',
				price.priceOnRequest,
				typeof data.priceDetails === 'string' ? data.priceDetails : '',
				'',
				price.manualReviewRequired ? 'manual_review_required' : 'ready',
			]
				.map(csvEscape)
				.join(',');
		}),
	];
	fs.writeFileSync(
		path.join(outDir, 'pr-j2-price-manual-review.csv'),
		`${priceLines.join('\n')}\n`
	);

	console.log(`Active journeys for hero alt review: ${activeRows.length}`);
	console.log(`Price review rows: ${rows.length}`);
	console.log('Wrote pr-j2-hero-alt-manual-review.csv');
	console.log('Wrote pr-j2-price-manual-review.csv');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
