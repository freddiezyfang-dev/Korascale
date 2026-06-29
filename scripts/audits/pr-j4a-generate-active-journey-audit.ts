/**
 * PR-J4A: 24 Active Journey Content & SEO Audit (read-only).
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/audits/pr-j4a-generate-active-journey-audit.ts
 *
 * No apply/update/DB write paths.
 */
import fs from 'fs';
import path from 'path';

import {
	buildCannibalizationGroups,
	buildMatrixRow,
	buildSnapshots,
	BATCH0_FACT_CHECK_SLUGS,
	cannibalGroupsToCsv,
	EXPECTED_ACTIVE_COUNT,
	fetchActiveJourneyRows,
	fetchProductionPageAudit,
	matrixToCsv,
	normalizeCompare,
	productionAuditToCsv,
	selectBatch1Candidates,
	SITE_URL,
	validateAuditOutputs,
	type MatrixRow,
} from './pr-j4a-audit-core';

const OUT_DIR = path.join(process.cwd(), 'docs/audits');

function ensureOutDir() {
	fs.mkdirSync(OUT_DIR, { recursive: true });
}

function writeBatch1Recommendation(batch1: MatrixRow[], matrix: MatrixRow[]) {
	const lines: string[] = [
		'# PR-J4A Batch 1 Recommendation',
		'',
		`Generated against Production baseline (${EXPECTED_ACTIVE_COUNT} active public Journeys).`,
		'',
		'Batch 1 is executed only after Batch 0 fact-check corrections are resolved through the Journey Revision system.',
		'',
		'## Selected 6 Journeys',
		'',
	];

	for (const [index, row] of batch1.entries()) {
		lines.push(
			`### ${index + 1}. \`${row.slug}\``,
			'',
			`- **Title:** ${row.title}`,
			`- **Type:** ${row.journey_type_slug}`,
			`- **Primary intent:** ${row.primary_search_intent}`,
			`- **Score:** ${row.total_score}/100 (current quality: ${row.current_quality_score}/95; commercial proxy: ${row.commercial_value_score}/5; optimization opportunity: ${row.optimization_opportunity})`,
			'',
			'**Selection rationale**',
			`- Clear search intent and high commercial proxy (${row.primary_query_concept}).`,
			`- Serves as a rewrite template for ${row.primary_search_intent.replace(/_/g, ' ').toLowerCase()} pages.`,
			'',
			'**Current main issues**',
			`- ${row.route_clarity_notes.split('.')[0] || 'See matrix'}.`,
			`- Title/meta actions: title=${row.title_action}, page_title=${row.page_title_action}, meta=${row.meta_description_action}.`,
			`- ${row.internal_linking_notes}`,
			'',
			'**Post-rewrite content role**',
			`- Anchor page for ${row.destination_intent || row.destination_entities.join(', ') || 'its region'}.`,
			`- Differentiate from: ${row.suggested_journey_links || 'peer routes in matrix'}.`,
			'',
			'**Suggested scope**',
			`- Rewrite abstract marketing copy; align H1/page title/duration.`,
			`- Add ${row.faq_directions.split(';').slice(0, 3).join('; ')}.`,
			`- Wire 2–4 Inspiration links and 1–3 non-competing Journey links.`,
			'',
		);
	}

	const exploreCount = batch1.filter((r) => r.journey_type_slug === 'explore-together').length;
	const deepCount = batch1.filter((r) => r.journey_type_slug === 'deep-discovery').length;
	lines.push(
		'## Coverage check',
		'',
		`- Explore Together: ${exploreCount}`,
		`- Deep Discovery: ${deepCount}`,
		`- Batch 0 excluded from Batch 1: ${BATCH0_FACT_CHECK_SLUGS.length}`,
		`- Remaining ${matrix.length - batch1.length - BATCH0_FACT_CHECK_SLUGS.length} active Journeys scheduled for Batch 2 / differentiation / merge review per priority band.`,
		''
	);

	fs.writeFileSync(path.join(OUT_DIR, 'pr-j4a-batch1-recommendation.md'), lines.join('\n'));
}

function writeSummary(input: {
	matrix: MatrixRow[];
	batch1: MatrixRow[];
	groups: ReturnType<typeof buildCannibalizationGroups>;
	production: Awaited<ReturnType<typeof fetchProductionPageAudit>>[];
	generatedAt: string;
}) {
	const { matrix, batch1, groups, production, generatedAt } = input;
	const avg =
		matrix.reduce((sum, r) => sum + r.total_score, 0) / Math.max(matrix.length, 1);
	const bands = {
		P0: matrix.filter((r) => r.priority_band === 'P0').length,
		P1: matrix.filter((r) => r.priority_band === 'P1').length,
		P2: matrix.filter((r) => r.priority_band === 'P2').length,
		P3: matrix.filter((r) => r.priority_band === 'P3').length,
	};
	const duplicateTitles = production.filter((p) => p.duplicate_title).length;
	const duplicateMetas = production.filter((p) => p.duplicate_meta).length;
	const duplicateMetaRewriteGroups = groups.filter((g) => g.group_theme.includes('Duplicate meta')).length;
	const mergeReviewGroups = groups.filter((g) => g.recommended_action === 'MERGE_REVIEW').length;
	const missingFaq = matrix.filter((r) => r.faq_count === 0).length;
	const missingRelated = matrix.filter(
		(r) => r.related_article_count === 0 && r.related_journey_count === 0
	).length;
	const keepForNow = matrix
		.filter((r) => r.priority_band === 'P2' && r.total_score >= 58)
		.map((r) => r.slug);
	const factCheck = matrix.filter((r) => r.fact_check_flags).map((r) => r.slug);
	const batch0 = BATCH0_FACT_CHECK_SLUGS.map((slug) => matrix.find((r) => r.slug === slug)).filter(
		(Boolean)
	) as MatrixRow[];

	const lines = [
		'# PR-J4A Active Journey Content & SEO Audit Summary',
		'',
		`- Generated: ${generatedAt}`,
		`- Site: ${SITE_URL}`,
		`- Active Journeys audited: ${matrix.length}`,
		'',
		'## Score overview',
		'',
		`- Average total score: ${avg.toFixed(1)}/100`,
		'- The score is a composite of technical foundation, content proxy signals, and commercial-value proxy. It does not mean the content has reached mature SEO quality.',
		'- FAQ coverage, structured highlights, contextual links, and content differentiation remain systemic gaps.',
		'- Commercial value is a proxy only; revenue, traffic, ranking, CTR, and conversion data are unavailable.',
		`- P0: ${bands.P0} | P1: ${bands.P1} | P2: ${bands.P2} | P3: ${bands.P3}`,
		'',
		'## Technical / content signals',
		'',
		`- Duplicate HTML titles (production): ${duplicateTitles}`,
		`- Duplicate meta descriptions (production): ${duplicateMetas}`,
		`- Duplicate meta rewrite groups: ${duplicateMetaRewriteGroups}`,
		`- Product cannibalization / differentiation groups: ${groups.length - duplicateMetaRewriteGroups}`,
		`- Merge-review groups: ${mergeReviewGroups}`,
		`- Missing FAQ in DB: ${missingFaq}/${matrix.length}`,
		`- Weak contextual internal linking / missing related content: ${missingRelated}/${matrix.length}`,
		'',
		'## Execution order',
		'',
		'1. Batch 0: 2 factual corrections requiring source-of-truth confirmation.',
		'2. Batch 1: 6 template-style content restructures.',
		'3. Batch 2: other retained active pages.',
		'4. P3: differentiation / merge review.',
		'',
		'## Batch 0 — FACT_CHECK_REQUIRED',
		'',
		...batch0.map(
			(r, i) =>
				`${i + 1}. \`${r.slug}\` — title / slug / page_title / itinerary duration inconsistency; do not modify until true route duration is confirmed.`
		),
		'',
		'Batch 0 must be resolved later using current itinerary days, original product design, backend history, and operator confirmation. This audit does not guess the correct duration.',
		'',
		'## Batch 1 (6 recommended)',
		'',
		...batch1.map((r, i) => `${i + 1}. \`${r.slug}\` — ${r.primary_search_intent}, score ${r.total_score}`),
		'',
		'## Batch 2 retained active pages (P2, score ≥ 58 — defer until Batch 1 templates exist)',
		'',
		...(keepForNow.length ? keepForNow.map((s) => `- \`${s}\``) : ['- None flagged as stable-high by proxy.']),
		'',
		'## FACT_CHECK_REQUIRED slugs',
		'',
		...(factCheck.length ? factCheck.map((s) => `- \`${s}\``) : ['- None beyond standard seasonal/altitude notes.']),
		'',
		'## Duplicate meta vs merge review',
		'',
		'- Duplicate meta descriptions default to REWRITE.',
		'- MERGE_REVIEW is reserved for cases where primary search intent, destination/route, itinerary content, and product differentiation all substantially overlap.',
		'- Repeated text such as "Beijing begins, Beijing ends" or "Chengdu begins, Chengdu ends" is not enough to recommend merging Journeys.',
		'',
		'## Internal linking terminology',
		'',
		'- All 24 active Journeys have public list, type-page, or sitemap entry points.',
		'- This audit therefore uses weak contextual internal linking, missing related content, and insufficient destination/article connections rather than a blanket orphan label.',
		'- Only a page with no internal site entry point should be marked orphan.',
		'',
		'## Output artifacts',
		'',
		'- `pr-j4a-active-journey-source-snapshot.json`',
		'- `pr-j4a-active-journey-content-seo-matrix.csv`',
		'- `pr-j4a-production-page-audit.csv`',
		'- `pr-j4a-journey-cannibalization-groups.csv`',
		'- `pr-j4a-batch1-recommendation.md`',
		'- `pr-j4a-active-journey-audit-summary.md`',
		'',
		'## Boundaries',
		'',
		'- No Journey rows modified.',
		'- No Revision submitted.',
		'- No Production deploy.',
		'- Search volume / CTR / ranking: unavailable (not in repo).',
		'- Commercial scores are content/commercial proxies, not revenue, traffic, or conversion data.',
		'',
	];

	fs.writeFileSync(path.join(OUT_DIR, 'pr-j4a-active-journey-audit-summary.md'), lines.join('\n'));
}

async function main() {
	ensureOutDir();
	const generatedAt = new Date().toISOString();

	const { active, archived, articles } = await fetchActiveJourneyRows();
	if (active.length !== EXPECTED_ACTIVE_COUNT) {
		throw new Error(`Expected ${EXPECTED_ACTIVE_COUNT} active journeys, got ${active.length}`);
	}

	const snapshots = buildSnapshots(active, articles);
	fs.writeFileSync(
		path.join(OUT_DIR, 'pr-j4a-active-journey-source-snapshot.json'),
		JSON.stringify({ generatedAt, siteUrl: SITE_URL, count: snapshots.length, journeys: snapshots }, null, 2)
	);

	const titleCounts = new Map<string, number>();
	const metaCounts = new Map<string, number>();
	const h1Counts = new Map<string, number>();
	for (const s of snapshots) {
		const t = normalizeCompare(s.page_title.replace(/\| korascale travel/gi, ''));
		const m = normalizeCompare(s.meta_description);
		const h = normalizeCompare(s.h1);
		titleCounts.set(t, (titleCounts.get(t) ?? 0) + 1);
		metaCounts.set(m, (metaCounts.get(m) ?? 0) + 1);
		h1Counts.set(h, (h1Counts.get(h) ?? 0) + 1);
	}
	const duplicateTitles = new Set([...titleCounts.entries()].filter(([, c]) => c > 1).map(([k]) => k));
	const duplicateMetas = new Set([...metaCounts.entries()].filter(([, c]) => c > 1).map(([k]) => k));
	const duplicateH1s = new Set([...h1Counts.entries()].filter(([, c]) => c > 1).map(([k]) => k));

	const production: Awaited<ReturnType<typeof fetchProductionPageAudit>>[] = [];
	for (const snapshot of snapshots) {
		process.stdout.write(`Fetching production page: ${snapshot.slug}\n`);
		production.push(
			await fetchProductionPageAudit(snapshot, duplicateTitles, duplicateMetas, duplicateH1s)
		);
	}

	const pageById = new Map(production.map((p) => [p.id, p]));
	const groups = buildCannibalizationGroups(snapshots);
	const matrix = snapshots.map((snapshot) =>
		buildMatrixRow(snapshot, snapshots, pageById.get(snapshot.id), groups, archived)
	);
	const batch1 = selectBatch1Candidates(matrix);

	const validationErrors = validateAuditOutputs({ snapshots, matrix, batch1, groups, production });
	if (validationErrors.length) {
		throw new Error(`Audit validation failed:\n${validationErrors.join('\n')}`);
	}

	fs.writeFileSync(path.join(OUT_DIR, 'pr-j4a-active-journey-content-seo-matrix.csv'), matrixToCsv(matrix));
	fs.writeFileSync(path.join(OUT_DIR, 'pr-j4a-production-page-audit.csv'), productionAuditToCsv(production));
	fs.writeFileSync(path.join(OUT_DIR, 'pr-j4a-journey-cannibalization-groups.csv'), cannibalGroupsToCsv(groups));
	writeBatch1Recommendation(batch1, matrix);
	writeSummary({ matrix, batch1, groups, production, generatedAt });

	console.log(
		JSON.stringify(
			{
				generatedAt,
				active: snapshots.length,
				averageScore: matrix.reduce((s, r) => s + r.total_score, 0) / matrix.length,
				batch1: batch1.map((r) => r.slug),
				cannibalizationGroups: groups.length,
				outputs: [
					'docs/audits/pr-j4a-active-journey-source-snapshot.json',
					'docs/audits/pr-j4a-active-journey-content-seo-matrix.csv',
					'docs/audits/pr-j4a-production-page-audit.csv',
					'docs/audits/pr-j4a-journey-cannibalization-groups.csv',
					'docs/audits/pr-j4a-batch1-recommendation.md',
					'docs/audits/pr-j4a-active-journey-audit-summary.md',
				],
			},
			null,
			2
		)
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
