/**
 * PR-J2B3A read-only active metadata preflight.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2b3a-active-metadata-preflight.ts
 *
 * Does NOT execute UPDATE/INSERT/DELETE. No --apply mode.
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import {
	buildB3aSourceMatrixRow,
	countB3aProposedUpdates,
	evaluateB3aPreflight,
	maskDatabaseIdentity,
	summarizeB3aSourceStats,
} from '@/lib/journeyNormalization/activeMetadataBackfill';
import { PR_J2B3A_ACTIVE_MANIFEST } from '@/lib/journeyNormalization/prJ2b3aActiveManifest';
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
process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';

async function fetchRows(): Promise<JourneyRowLike[]> {
	const connectionString =
		process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) throw new Error('Missing POSTGRES_URL');

	const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
	const client = await pool.connect();
	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const result = await client.query(`
      SELECT j.id, j.slug, j.status, j.title, j.short_description, j.image, j.journey_type,
             j.page_title, j.meta_description, j.hero_image_url, j.hero_image_alt, j.journey_type_slug,
             j.price_from, j.seo_complete, j.data
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
	const connectionString =
		process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	const rows = await fetchRows();
	const activeRows = rows.filter((r) => String(r.status) === 'active');
	const matrix = activeRows.map((row) => buildB3aSourceMatrixRow(row));
	const stats = summarizeB3aSourceStats(matrix);
	const updateCounts = countB3aProposedUpdates(activeRows, PR_J2B3A_ACTIVE_MANIFEST);

	const preflight = evaluateB3aPreflight(rows, PR_J2B3A_ACTIVE_MANIFEST, {
		databaseIdentity: maskDatabaseIdentity(connectionString),
	});

	const outDir = path.join(process.cwd(), 'docs/audits');
	fs.mkdirSync(outDir, { recursive: true });
	const csvPath = path.join(outDir, 'pr-j2b3a-active-preview.csv');
	const header = [
		'id',
		'slug',
		'page_title_proposed',
		'page_title_source',
		'meta_description_proposed',
		'meta_description_source',
		'hero_image_url_proposed',
		'hero_image_source',
		'journey_type_slug_proposed',
		'journey_type_slug_source',
		'manual_review',
		'reason',
	];
	const lines = [
		header.join(','),
		...PR_J2B3A_ACTIVE_MANIFEST.map((entry) =>
			[
				entry.id,
				entry.slug,
				entry.pageTitle.proposed,
				entry.pageTitle.source,
				entry.metaDescription.proposed,
				entry.metaDescription.source,
				entry.heroImageUrl.proposed,
				entry.heroImageUrl.source,
				entry.journeyTypeSlug.proposed,
				entry.journeyTypeSlug.source,
				entry.manualReview,
				entry.reason,
			]
				.map(csvEscape)
				.join(',')
		),
	];
	fs.writeFileSync(csvPath, `${lines.join('\n')}\n`);

	console.log(
		JSON.stringify(
			{
				ready: preflight.ready,
				databaseIdentity: preflight.databaseIdentity,
				total: preflight.total,
				active: preflight.active,
				archived: preflight.archived,
				manifestCount: preflight.manifestCount,
				missingIds: preflight.missingManifestIds,
				statusMismatchIds: preflight.statusMismatchIds,
				slugMismatchIds: preflight.slugMismatchIds,
				pageTitleResolved: preflight.pageTitleResolved,
				pageTitleMissing: preflight.pageTitleMissing,
				metaDescriptionResolved: preflight.metaDescriptionResolved,
				metaDescriptionMissing: preflight.metaDescriptionMissing,
				heroImageResolved: preflight.heroImageResolved,
				heroImageMissing: preflight.heroImageMissing,
				taxonomyResolved: preflight.taxonomyResolved,
				taxonomyAmbiguous: preflight.taxonomyAmbiguous,
				columnConflictIds: preflight.columnConflictIds,
				heroAltComplete: preflight.heroAltComplete,
				manualReviewIds: preflight.manualReviewIds,
				sourceStats: stats,
				updateCounts,
				csvPath,
			},
			null,
			2
		)
	);

	if (!preflight.ready) process.exitCode = 1;
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
