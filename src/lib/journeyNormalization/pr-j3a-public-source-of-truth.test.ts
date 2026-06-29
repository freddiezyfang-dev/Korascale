import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	resolveAdminCompatHeroImageUrl,
	resolveAdminCompatMetaDescription,
	resolveAdminCompatPageTitle,
} from '@/lib/journeyNormalization/adminCompatFields';
import { mapJourneyRowToAdminCompatJourney } from '@/lib/journeyAdminCompatMapper.server';
import { mapJourneyRowToPublicJourney } from '@/lib/journeyListQuery.server';
import { evaluatePublicSourcePreflight } from '@/lib/journeyNormalization/publicSourcePreflight';
import {
	JourneyPublicNormalizedFieldIntegrityError,
	resolvePublicNormalizedHeroImageUrl,
	resolvePublicNormalizedMetaDescription,
	resolvePublicNormalizedPageTitle,
} from '@/lib/journeyNormalization/publicNormalizedFields';
import { isJourneyPublished } from '@/lib/journeyNormalization/published';
import { shouldIncludeJourneyInSitemap } from '@/lib/journeyNormalization/sitemap';
import { buildPublicStatusWhereClause } from '@/lib/journeyNormalization/status';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';
import {
	getJourneyExcerpt,
	getJourneySeoMetaDescription,
} from '@/lib/journeySeo.server';
import type { Journey } from '@/types';

const E468B842 = 'e468b842-7c59-4258-8d56-8b585566be82';

function activeRow(overrides: Partial<JourneyRowLike> = {}): JourneyRowLike {
	const baseData = {
		pageTitle: 'JSONB Page Title',
		metaDescription: 'JSONB meta',
		heroImage: '/jsonb-hero.jpg',
		heroAlt: 'JSONB alt',
		journeyType: 'Explore Together',
		itinerary: [{ day: 1, title: 'Day 1' }],
	};
	const { data: overrideData, ...rest } = overrides;
	return {
		id: 'active-1',
		slug: 'sample-active',
		status: 'active',
		title: 'Legacy Title',
		short_description: 'Legacy short',
		image: '/legacy-image.jpg',
		journey_type: 'Deep Discovery',
		page_title: 'Column Page Title',
		meta_description: 'Column meta',
		hero_image_url: '/column-hero.jpg',
		hero_image_alt: 'Column alt',
		journey_type_slug: 'deep-discovery',
		data: {
			...baseData,
			...(overrideData && typeof overrideData === 'object' ? overrideData : {}),
		},
		...rest,
	};
}

describe('PR-J3A public normalized resolver', () => {
	const originalFlag = process.env.JOURNEY_NORMALIZATION_COLUMNS;

	afterEach(() => {
		if (originalFlag === undefined) delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		else process.env.JOURNEY_NORMALIZATION_COLUMNS = originalFlag;
	});

	it('1. reads page_title column only', () => {
		expect(resolvePublicNormalizedPageTitle(activeRow()).value).toBe('Column Page Title');
		expect(resolvePublicNormalizedPageTitle(activeRow()).source).toBe('column');
	});

	it('2. prefers column when JSONB conflicts', () => {
		expect(resolvePublicNormalizedPageTitle(activeRow()).value).toBe('Column Page Title');
		expect(resolvePublicNormalizedPageTitle(activeRow()).value).not.toBe('JSONB Page Title');
	});

	it('3. does not read data.pageTitle on public path', () => {
		const row = activeRow({ page_title: 'Only Column' });
		expect(resolvePublicNormalizedPageTitle(row).path).toBe('page_title');
	});

	it('4. does not use legacy meta fallback on public path', () => {
		expect(resolvePublicNormalizedMetaDescription(activeRow()).value).toBe('Column meta');
		expect(resolvePublicNormalizedMetaDescription(activeRow()).value).not.toBe('JSONB meta');
	});

	it('5. does not use legacy hero fallback on public path', () => {
		expect(resolvePublicNormalizedHeroImageUrl(activeRow()).value).toBe('/column-hero.jpg');
	});

	it('6. does not use legacy journey_type fallback on public mapper', () => {
		const journey = mapJourneyRowToPublicJourney(activeRow() as Record<string, unknown>);
		expect(journey.journeyType).toBe('Deep Discovery');
	});

	it('7. admin compat prefers column', () => {
		process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';
		expect(resolveAdminCompatPageTitle(activeRow()).source).toBe('column');
	});

	it('8. admin compat falls back to JSONB when column empty', () => {
		process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';
		const row = activeRow({ page_title: '' });
		expect(resolveAdminCompatPageTitle(row).source).toBe('jsonb');
	});

	it('9. archived row readable via admin compat mapper', () => {
		process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';
		const row = activeRow({
			id: E468B842,
			status: 'archived',
			journey_type_slug: null,
			page_title: null,
		});
		const journey = mapJourneyRowToAdminCompatJourney(row as Record<string, unknown>);
		expect(journey.status).toBe('archived');
		expect(resolveAdminCompatPageTitle(row).source).toBe('jsonb');
	});

	for (const flagValue of ['1', '0', undefined] as const) {
		it(`10-12. public output identical when flag=${String(flagValue)}`, () => {
			if (flagValue === undefined) delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
			else process.env.JOURNEY_NORMALIZATION_COLUMNS = flagValue;
			const journey = mapJourneyRowToPublicJourney(activeRow() as Record<string, unknown>);
			expect(journey.pageTitle).toBe('Column Page Title');
			expect(journey.metaDescription).toBe('Column meta');
			expect(journey.heroImage).toBe('/column-hero.jpg');
		});
	}

	it('13-15. seo_complete does not control public visibility', () => {
		expect(
			shouldIncludeJourneyInSitemap({
				status: 'active',
				slug: 'x',
				seo_complete: false,
			} as JourneyRowLike)
		).toBe(true);
		expect(isJourneyPublished('active')).toBe(true);
		expect(
			shouldIncludeJourneyInSitemap({
				status: 'archived',
				slug: 'x',
				seo_complete: true,
			} as JourneyRowLike)
		).toBe(false);
	});

	it('16-19. public counts remain 24 / 8 / 16 under strict mode', () => {
		const rows: JourneyRowLike[] = [
			...Array.from({ length: 8 }, (_, i) =>
				activeRow({
					id: `e-${i}`,
					slug: `e-${i}`,
					journey_type: 'Explore Together',
					journey_type_slug: 'explore-together',
					data: { journeyType: 'Explore Together' },
				})
			),
			...Array.from({ length: 16 }, (_, i) =>
				activeRow({
					id: `d-${i}`,
					slug: `d-${i}`,
					journey_type: 'Deep Discovery',
					journey_type_slug: 'deep-discovery',
					data: { journeyType: 'Deep Discovery' },
				})
			),
			...Array.from({ length: 59 }, (_, i) =>
				activeRow({ id: `a-${i}`, slug: `a-${i}`, status: 'archived' })
			),
		];
		const evaluation = evaluatePublicSourcePreflight(rows);
		expect(evaluation.active).toBe(24);
		expect(
			rows.filter((r) => shouldIncludeJourneyInSitemap({ status: r.status, slug: r.slug })).length
		).toBe(24);
		const explore = rows.filter(
			(r) => r.status === 'active' && r.journey_type_slug === 'explore-together'
		).length;
		const deep = rows.filter(
			(r) => r.status === 'active' && r.journey_type_slug === 'deep-discovery'
		).length;
		expect(explore).toBe(8);
		expect(deep).toBe(16);
	});

	it('20-21. archived/draft not published', () => {
		expect(isJourneyPublished('archived')).toBe(false);
		expect(isJourneyPublished('draft')).toBe(false);
	});

	it('22-24. public mapper surfaces normalized SEO fields', () => {
		const journey = mapJourneyRowToPublicJourney(activeRow() as Record<string, unknown>);
		expect(journey.pageTitle).toBe('Column Page Title');
		expect(journey.metaDescription).toBe('Column meta');
		expect(journey.heroImage).toBe('/column-hero.jpg');
	});

	it('25. admin compat still dual-reads JSONB when column missing', () => {
		process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';
		const row = activeRow({ meta_description: null });
		expect(resolveAdminCompatMetaDescription(row).source).toBe('jsonb');
	});

	it('26. JSONB itinerary preserved on public journey object', () => {
		const journey = mapJourneyRowToPublicJourney(activeRow() as Record<string, unknown>);
		expect(Array.isArray(journey.itinerary)).toBe(true);
		expect(journey.itinerary?.length).toBe(1);
	});

	it('27. mismatch audit detects column vs legacy drift', () => {
		const rows = [
			activeRow({ id: 'bad', slug: 'bad', page_title: 'Column', data: { pageTitle: 'Different' } }),
		];
		const result = evaluatePublicSourcePreflight(rows);
		expect(result.pageTitleMismatchIds).toContain('bad');
		expect(result.ready).toBe(false);
	});

	it('28. e468b842 safe for admin compat', () => {
		process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';
		const row = activeRow({
			id: E468B842,
			status: 'archived',
			journey_type_slug: null,
			page_title: null,
		});
		expect(() => mapJourneyRowToAdminCompatJourney(row as Record<string, unknown>)).not.toThrow();
	});

	it('29. strict public SQL unchanged', () => {
		expect(buildPublicStatusWhereClause()).toBe("status = 'active'");
	});

	it('30. no 025C2 or price normalization in public mapper module', () => {
		const source = mapJourneyRowToPublicJourney.toString();
		expect(source).not.toContain('currency');
		expect(source).not.toContain('price_basis');
	});

	it('excerpt: visible copy uses shortDescription, SEO meta uses metaDescription', () => {
		const journey = {
			shortDescription: 'Visible short copy',
			metaDescription: 'SEO meta only',
		} as Journey;
		expect(getJourneyExcerpt(journey)).toBe('Visible short copy');
		expect(getJourneySeoMetaDescription(journey)).toBe('SEO meta only');
	});

	it('integrity: active missing normalized field throws on public detail mapper', () => {
		expect(() =>
			mapJourneyRowToPublicJourney(
				activeRow({ page_title: null }) as Record<string, unknown>
			)
		).toThrow(JourneyPublicNormalizedFieldIntegrityError);
	});

	it('integrity: active missing normalized field throws on public list mapper', () => {
		const rows = [activeRow({ hero_image_url: null })];
		expect(() =>
			rows.map((row) => mapJourneyRowToPublicJourney(row as Record<string, unknown>))
		).toThrow(JourneyPublicNormalizedFieldIntegrityError);
	});

	it('integrity: active missing field does not fall back to JSONB on public mapper', () => {
		expect(() =>
			mapJourneyRowToPublicJourney(
				activeRow({
					meta_description: null,
					data: { metaDescription: 'JSONB meta fallback' },
				}) as Record<string, unknown>
			)
		).toThrow(JourneyPublicNormalizedFieldIntegrityError);
	});

	it('integrity: archived missing normalized fields still opens via admin compat', () => {
		expect(() =>
			mapJourneyRowToAdminCompatJourney(
				activeRow({
					id: E468B842,
					status: 'archived',
					page_title: null,
					meta_description: null,
					journey_type_slug: null,
				}) as Record<string, unknown>
			)
		).not.toThrow();
	});
});
