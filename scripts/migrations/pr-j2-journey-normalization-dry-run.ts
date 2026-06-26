/**
 * PR-J2 read-only migration preview generator.
 * Usage: npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2-journey-normalization-dry-run.ts
 *
 * Does NOT execute UPDATE/INSERT/DELETE.
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import {
	buildNormalizationPreviewRow,
	buildSlugDuplicateMap,
} from '@/lib/journeyNormalization/preview';
import { normalizeJourneySlug } from '@/lib/journeyNormalization/slug';
import { evaluatePriceCompleteness } from '@/lib/journeyNormalization/price';
import { evaluateJourneySeoCompleteness } from '@/lib/journeyNormalization/seo';
import {
	mapRowToJourneySitemapEntry,
	reconcileSitemapCounts,
} from '@/lib/journeyNormalization/sitemap';
import { isPublicJourneyStatusCompat } from '@/lib/journeyNormalization/status';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';

function loadEnvLocal() {
	const envPath = path.join(process.cwd(), '.env.local');
	if (!fs.existsSync(envPath)) return;
	const content = fs.readFileSync(envPath, 'utf8');
	for (const line of content.split(/\r?\n/)) {
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

async function fetchJourneyRows(): Promise<JourneyRowLike[]> {
	const connectionString =
		process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) {
		throw new Error('Missing POSTGRES_URL / NEON_POSTGRES_URL');
	}

	const pool = new Pool({
		connectionString,
		ssl: { rejectUnauthorized: false },
	});
	const client = await pool.connect();
	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const result = await client.query(`
      SELECT
        j.id, j.slug, j.status, j.journey_type, j.title,
        j.short_description, j.description, j.price, j.image,
        j.created_at, j.updated_at, j.data
      FROM journeys j
      ORDER BY j.created_at DESC
    `);
		await client.query('ROLLBACK');
		return result.rows as JourneyRowLike[];
	} finally {
		client.release();
		await pool.end();
	}
}

async function main() {
	const rows = await fetchJourneyRows();
	const duplicateMap = buildSlugDuplicateMap(rows);
	const proposedSlugCounts = new Map<string, number>();
	for (const row of rows) {
		const proposed = normalizeJourneySlug(row.slug);
		if (!proposed) continue;
		proposedSlugCounts.set(proposed, (proposedSlugCounts.get(proposed) ?? 0) + 1);
	}

	const previewRows = rows.map((row) => {
		const slugKey = String(row.slug ?? '').replace(/^\/journeys\//i, '').trim();
		const proposed = normalizeJourneySlug(row.slug);
		return buildNormalizationPreviewRow(row, {
			duplicateCount: duplicateMap.get(slugKey) ?? 0,
			proposedSlugCounts,
			takenSlugs: proposed && (proposedSlugCounts.get(proposed) ?? 0) > 1
				? new Set([proposed])
				: undefined,
		});
	});

	const activeRows = rows.filter((row) => isPublicJourneyStatusCompat(row.status));
	const seoEvaluations = activeRows.map((row) => evaluateJourneySeoCompleteness(row));
	const seoCompleteCount = seoEvaluations.filter((item) => item.complete).length;
	const priceRows = rows.map((row) => evaluatePriceCompleteness(row));
	const priceCompleteActive = activeRows.filter((row) => {
		const evaluation = evaluatePriceCompleteness(row);
		return !evaluation.manualReviewRequired;
	}).length;

	const sitemapEntries = activeRows
		.map((row) =>
			mapRowToJourneySitemapEntry({
				slug: String(row.slug ?? ''),
				status: row.status,
				updated_at: row.updated_at as string | Date,
			})
		)
		.filter(Boolean) as NonNullable<ReturnType<typeof mapRowToJourneySitemapEntry>>[];

	const sitemapReconcile = reconcileSitemapCounts(sitemapEntries, activeRows.length);

	const statusNullCount = rows.filter((row) => row.status == null).length;
	const statusOther = rows.filter((row) => {
		const s = row.status == null ? null : String(row.status).trim().toLowerCase();
		return s != null && !['active', 'inactive', 'draft', 'archived'].includes(s);
	}).length;

	const slugAnomalies = previewRows.filter((row) => row.currentSlug !== row.proposedSlug || row.redirectRequired).length;
	const typeManual = previewRows.filter((row) => row.proposedType === 'MANUAL_REVIEW').length;
	const statusManual = previewRows.filter((row) => row.proposedStatus === 'MANUAL_REVIEW').length;
	const manualReview = previewRows.filter((row) => row.manualReviewRequired);

	const outDir = path.join(process.cwd(), 'docs/audits');
	fs.mkdirSync(outDir, { recursive: true });

	const csvPath = path.join(outDir, 'pr-j2-journey-normalization-preview.csv');
	const csvHeader = [
		'id',
		'current_slug',
		'proposed_slug',
		'current_status',
		'proposed_status',
		'current_type',
		'proposed_type',
		'seo_complete',
		'price_complete',
		'redirect_required',
		'manual_review_required',
		'reason',
	];
	const csvLines = [
		csvHeader.join(','),
		...previewRows.map((row) =>
			[
				row.id,
				row.currentSlug,
				row.proposedSlug,
				row.currentStatus,
				row.proposedStatus,
				row.currentType,
				row.proposedType,
				row.seoComplete,
				row.priceComplete,
				row.redirectRequired,
				row.manualReviewRequired,
				row.reason,
			]
				.map(csvEscape)
				.join(',')
		),
	];
	fs.writeFileSync(csvPath, `${csvLines.join('\n')}\n`);

	const jsonPath = path.join(outDir, 'pr-j2-journey-normalization-preview.json');
	fs.writeFileSync(
		jsonPath,
		JSON.stringify(
			{
				generatedAt: new Date().toISOString(),
				journeyTotal: rows.length,
				activeCount: activeRows.length,
				statusNullCount,
				statusOtherCount: statusOther,
				slugAnomalyCount: slugAnomalies,
				typeManualReviewCount: typeManual,
				statusManualReviewCount: statusManual,
				seoCompleteActive: seoCompleteCount,
				seoCompleteActiveTotal: activeRows.length,
				priceCompleteActive,
				sitemapReconcile,
				manualReviewIds: manualReview.map((row) => row.id),
				rows: previewRows,
			},
			null,
			2
		)
	);

	const priceCsvPath = path.join(outDir, 'pr-j2-price-completion.csv');
	const priceCsvLines = [
		[
			'journey_id',
			'slug',
			'current_price',
			'currency',
			'price_basis',
			'price_on_request',
			'proposed_action',
			'manual_review_required',
		].join(','),
		...priceRows.map((row) =>
			[
				row.journeyId,
				row.slug,
				row.currentPrice ?? '',
				row.currency ?? '',
				row.priceBasis ?? '',
				row.priceOnRequest,
				row.proposedAction,
				row.manualReviewRequired,
			]
				.map(csvEscape)
				.join(',')
		),
	];
	fs.writeFileSync(priceCsvPath, `${priceCsvLines.join('\n')}\n`);

	const mdPath = path.join(outDir, 'pr-j2-journey-normalization-preview.md');
	const md = `# PR-J2 Journey Normalization Preview

Generated: ${new Date().toISOString()}

**Stage A only — no production UPDATE was executed.**

## Summary

| Metric | Count |
|--------|------:|
| Journey total | ${rows.length} |
| Active (compat query) | ${activeRows.length} |
| Status NULL | ${statusNullCount} |
| Status illegal/other | ${statusOther} |
| Slug anomalies (change or redirect) | ${slugAnomalies} |
| Type MANUAL_REVIEW | ${typeManual} |
| Status MANUAL_REVIEW | ${statusManual} |
| SEO-complete active (quality marker) | ${seoCompleteCount} / ${activeRows.length} |
| Price-complete active | ${priceCompleteActive} / ${activeRows.length} |
| Manual review rows | ${manualReview.length} |

## Sitemap reconciliation

| Metric | Count |
|--------|------:|
| Active | ${sitemapReconcile.active} |
| Valid canonical slug | ${sitemapReconcile.validCanonicalSlug} |
| Sitemap Journey detail URLs | ${sitemapReconcile.sitemapJourneyDetailUrls} |
| Missing | ${sitemapReconcile.missing} |
| Redirect URLs in sitemap | ${sitemapReconcile.redirectUrlsInSitemap} |
| Duplicate URLs | ${sitemapReconcile.duplicateUrls} |

## Schema map

| Logical field | Current DB column | JSONB path | Proposed source |
|---------------|-------------------|------------|-----------------|
| id | \`id\` | — | column |
| slug | \`slug\` | \`data.slug\` (legacy) | column (normalized) |
| status | \`status\` | — | column (\`draft/active/archived\`) |
| journey type | \`journey_type\` (label) | \`data.journeyType\` | column \`journey_type_slug\` + label compat |
| name / H1 | \`title\` | \`data.name\` | column \`title\` |
| page title | — | \`data.pageTitle\` | column \`page_title\` |
| meta description | \`short_description\` (fallback) | \`data.metaDescription\` | column \`meta_description\` |
| excerpt | \`short_description\` | \`data.shortDescription\` | column \`short_description\` |
| hero image | \`image\` | \`data.heroImage\` | column \`hero_image_url\` |
| hero alt | — | \`data.heroAlt\` / \`heroImageAlt\` | column \`hero_image_alt\` |
| price | \`price\` | \`data.price\` | column \`price_from\` + \`price_on_request\` |
| currency | — | \`data.currency\` | column \`currency\` (manual backfill) |
| price basis | — | \`data.priceBasis\` | column \`price_basis\` (manual backfill) |
| updated_at | \`updated_at\` | — | column (sitemap lastModified) |
| seo_complete | — | — | column \`seo_complete\` (admin quality marker, NOT indexability) |

## Trailing-hyphen active slug

| Current | Proposed | Redirect |
|---------|----------|----------|
| \`beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-\` | \`beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour\` | permanent via \`next.config.ts\` + DB slug update in migration 025 |

## Manual review required (${manualReview.length})

${manualReview.length === 0 ? '_None_' : manualReview.map((row) => `- \`${row.id}\` — ${row.reason}`).join('\n')}

## Migration files

- \`database/migrations/025a_journey_normalization_expand.sql\`
- \`database/migrations/pending/025b_journey_normalization_backfill.sql\`
- \`database/migrations/pending/025c_journey_normalization_constraints.sql\`

Run migration only after approving this preview.
`;

	fs.writeFileSync(mdPath, md);

	console.log(`Wrote ${mdPath}`);
	console.log(`Wrote ${csvPath}`);
	console.log(`Wrote ${jsonPath}`);
	console.log(`Wrote ${priceCsvPath}`);
	console.log(
		JSON.stringify(
			{
				journeyTotal: rows.length,
				activeCount: activeRows.length,
				seoCompleteActive: seoCompleteCount,
				manualReview: manualReview.length,
			},
			null,
			2
		)
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
