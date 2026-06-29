import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

import {
	buildCannibalizationGroups,
	buildContentNotes,
	buildSnapshots,
	BATCH0_FACT_CHECK_SLUGS,
	BATCH1_RECOMMENDED_SLUGS,
	classifyPrimarySearchIntent,
	EXPECTED_ACTIVE_COUNT,
	mapRowToSnapshot,
	scoreJourney,
	SEARCH_INTENTS,
	selectBatch1Candidates,
	validateAuditOutputs,
	auditMetaActions,
	buildMatrixRow,
	type DbRow,
	type JourneySnapshot,
	type MatrixRow,
} from '../../../scripts/audits/pr-j4a-audit-core';

function sampleRow(overrides: Partial<DbRow> = {}): DbRow {
	return {
		id: 'sample-id-1',
		slug: 'beijing-to-mutianyu-great-wall-day-tour',
		status: 'active',
		title: 'Beijing to Mutianyu Great Wall Day Tour',
		short_description: 'Beijing begins, Beijing ends',
		page_title: 'Beijing to Mutianyu Great Wall Day Tour',
		meta_description: 'Private Mutianyu Great Wall day tour from Beijing with flexible pacing.',
		hero_image_url: '/images/hero.jpg',
		hero_image_alt: 'Mutianyu Great Wall',
		journey_type_slug: 'explore-together',
		seo_complete: true,
		display_order: 1,
		duration: '1 day',
		region: 'North China',
		city: 'Beijing',
		data: {
			itinerary: [{ day: 1, title: 'Mutianyu Great Wall', description: 'Full day at the wall with private guide and transfers.' }],
			highlights: ['Mutianyu Great Wall'],
			relatedTrips: [],
		},
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		...overrides,
	};
}

describe('PR-J4A active journey audit core', () => {
	it('1. maps DB row to snapshot with itinerary counts', () => {
		const snapshot = mapRowToSnapshot(sampleRow(), 0);
		expect(snapshot.itinerary_day_count).toBe(1);
		expect(snapshot.status).toBe('active');
		expect(snapshot.cta_presence).toBe(true);
	});

	it('2. classifies day tour intent from slug', () => {
		const snapshot = mapRowToSnapshot(sampleRow(), 0);
		expect(classifyPrimarySearchIntent(snapshot)).toBe('DAY_TOUR');
	});

	it('3. flags abstract copy for rewrite', () => {
		const abstract = mapRowToSnapshot(
			sampleRow({
				title: 'Navigating the Monumental Scale of Dynastic History',
				meta_description: 'Navigating the Monumental Scale of Dynastic History and the Avant-Garde Ambition of a Modern Metropolis.',
				short_description: 'Navigating the Monumental Scale of Dynastic History and the Avant-Garde Ambition of a Modern Metropolis.',
			}),
			0
		);
		const meta = auditMetaActions(abstract, [abstract]);
		expect(meta.title_action).toBe('REWRITE');
		expect(meta.meta_description_action).toBe('REWRITE');
	});

	it('4. score subtotals equal total_score', () => {
		const snapshot = mapRowToSnapshot(sampleRow(), 0);
		const meta = auditMetaActions(snapshot, [snapshot]);
		const notes = buildContentNotes(snapshot);
		const score = scoreJourney(snapshot, meta, notes, undefined, 'DAY_TOUR');
		const subtotal =
			score.search_intent_score +
			score.title_meta_score +
			score.content_score +
			score.route_trust_score +
			score.technical_score +
			score.internal_link_score +
			score.conversion_score +
			score.commercial_value_score;
		expect(subtotal).toBe(score.total_score);
		expect(score.total_score).toBeGreaterThanOrEqual(0);
		expect(score.total_score).toBeLessThanOrEqual(100);
		expect(score.current_quality_score).toBe(score.total_score - score.commercial_value_score);
		expect(score.score_evidence).toContain('current_quality=');
		expect(score.score_evidence).toContain('commercial_value_proxy=');
		expect(score.score_evidence).toContain('optimization_opportunity=');
	});

	it('5. keeps duplicate meta rewrite separate from merge review', () => {
		const a = mapRowToSnapshot(sampleRow({ id: 'a', slug: 'badaling-great-wall-day-tour' }), 0);
		const b = mapRowToSnapshot(
			sampleRow({
				id: 'b',
				slug: 'beijing-to-mutianyu-great-wall-day-tour',
				meta_description: 'Private Mutianyu Great Wall day tour from Beijing with flexible pacing.',
			}),
			0
		);
		const meta = auditMetaActions(a, [a, b]);
		expect(meta.meta_description_action).toBe('REWRITE');

		const groups = buildCannibalizationGroups([a, b]);
		const duplicateMetaGroup = groups.find((g) => g.group_theme.includes('Duplicate meta'));
		expect(duplicateMetaGroup?.recommended_action).toBe('REWRITE');
	});

	it('6. builds cannibalization group for Great Wall tours', () => {
		const a = mapRowToSnapshot(sampleRow({ id: 'a', slug: 'badaling-great-wall-day-tour' }), 0);
		const b = mapRowToSnapshot(
			sampleRow({ id: 'b', slug: 'beijing-to-mutianyu-great-wall-day-tour' }),
			0
		);
		const groups = buildCannibalizationGroups([a, b]);
		expect(groups.some((g) => g.group_theme.includes('Great Wall'))).toBe(true);
	});

	it('7. validates generated artifacts when present', () => {
		const snapshotPath = path.join(
			process.cwd(),
			'docs/audits/pr-j4a-active-journey-source-snapshot.json'
		);
		const matrixPath = path.join(
			process.cwd(),
			'docs/audits/pr-j4a-active-journey-content-seo-matrix.csv'
		);
		const productionPath = path.join(
			process.cwd(),
			'docs/audits/pr-j4a-production-page-audit.csv'
		);
		if (!fs.existsSync(snapshotPath) || !fs.existsSync(matrixPath)) {
			expect(SEARCH_INTENTS.length).toBeGreaterThan(0);
			return;
		}

		const snapshotJson = JSON.parse(fs.readFileSync(snapshotPath, 'utf8')) as {
			journeys: JourneySnapshot[];
		};
		const matrixLines = fs.readFileSync(matrixPath, 'utf8').trim().split('\n');
		expect(snapshotJson.journeys.length).toBe(EXPECTED_ACTIVE_COUNT);
		expect(matrixLines.length - 1).toBe(EXPECTED_ACTIVE_COUNT);

		const snapshots = snapshotJson.journeys;
		const matrix: MatrixRow[] = snapshots.map((s) =>
			buildMatrixRow(s, snapshots, undefined, buildCannibalizationGroups(snapshots), [])
		);
		const batch1 = selectBatch1Candidates(matrix);
		expect(batch1.map((r) => r.slug)).toEqual([...BATCH1_RECOMMENDED_SLUGS]);
		expect(matrix.filter((r) => r.batch_wave === 'Batch 0 fact check required').map((r) => r.slug).sort()).toEqual(
			[...BATCH0_FACT_CHECK_SLUGS].sort()
		);
		const productionCount = fs.existsSync(productionPath)
			? fs.readFileSync(productionPath, 'utf8').trim().split('\n').length - 1
			: 0;
		const errors = validateAuditOutputs({
			snapshots,
			matrix,
			batch1,
			groups: buildCannibalizationGroups(snapshots),
			production: Array.from({ length: productionCount }, (_, i) => ({
				id: `prod-${i}`,
				slug: 'sample',
				url: 'https://example.com',
				http_status: 200,
				canonical: '',
				robots: '',
				html_title: '',
				meta_description: '',
				h1: '',
				h1_count: 1,
				og_title: '',
				og_description: '',
				og_image: '',
				json_ld_types: 'Trip',
				json_ld_trip_name: '',
				json_ld_trip_description: '',
				json_ld_trip_image: '',
				visible_word_count: 0,
				faq_markup_present: false,
				faq_count_dom: 0,
				breadcrumb_markup_present: true,
				cta_link_present: true,
				broken_internal_links: '',
				missing_images: '',
				duplicate_title: false,
				duplicate_meta: false,
				duplicate_h1: false,
				canonical_mismatch: false,
				hero_dom_note: '',
				notes: '',
			})),
		});
		expect(errors).toEqual([]);
		const generatedText = [
			fs.readFileSync(matrixPath, 'utf8'),
			fs.existsSync(path.join(process.cwd(), 'docs/audits/pr-j4a-active-journey-audit-summary.md'))
				? fs.readFileSync(path.join(process.cwd(), 'docs/audits/pr-j4a-active-journey-audit-summary.md'), 'utf8')
				: '',
			fs.existsSync(path.join(process.cwd(), 'docs/audits/pr-j4a-batch1-recommendation.md'))
				? fs.readFileSync(path.join(process.cwd(), 'docs/audits/pr-j4a-batch1-recommendation.md'), 'utf8')
				: '',
		].join('\n');
		expect(generatedText).not.toMatch(/Orphan risk/i);
	});

	it('8. primary search intent values are from allowed set', () => {
		for (const intent of SEARCH_INTENTS) {
			expect(typeof intent).toBe('string');
		}
	});
});

describe('PR-J4A strict read-only guards', () => {
	it('9. audit script has no apply/update/migration write paths', () => {
		const script = fs.readFileSync(
			path.join(process.cwd(), 'scripts/audits/pr-j4a-generate-active-journey-audit.ts'),
			'utf8'
		);
		const core = fs.readFileSync(
			path.join(process.cwd(), 'scripts/audits/pr-j4a-audit-core.ts'),
			'utf8'
		);
		expect(script).not.toMatch(/\bUPDATE\b|\bALTER\b|\bINSERT\b/);
		expect(core).not.toMatch(/\bUPDATE\b|\bALTER\b|\bINSERT\b/);
		expect(core).toMatch(/BEGIN TRANSACTION READ ONLY/);
		expect(core).not.toMatch(/seo_complete\s*=\s*true/i);
	});
});
