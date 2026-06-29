import { describe, expect, it } from 'vitest';

import {
	JOURNEY_SLUG_REDIRECTS,
	buildJourneySlugRedirectConfig,
	getJourneySlugDbLookupCandidates,
	getJourneySlugRedirect,
	isRedirectingOldSlug,
} from '@/lib/journeyNormalization/redirects';
import {
	evaluatePriceCompleteness,
	isIso4217Currency,
	isPriceBasis,
	parseNumericPrice,
} from '@/lib/journeyNormalization/price';
import { resolvePageTitle } from '@/lib/journeyNormalization/fields';
import { isJourneyPublished } from '@/lib/journeyNormalization/published';
import {
	evaluateJourneySeoCompleteness,
	extractSeoFieldSources,
} from '@/lib/journeyNormalization/seo';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';
import {
	normalizeJourneyStatusForRead,
	normalizeJourneyStatusForWrite,
} from '@/lib/journeyNormalization/write';
import {
	assertCanonicalSlugUnique,
	isValidCanonicalSlug,
	normalizeJourneySlug,
	proposeJourneySlug,
} from '@/lib/journeyNormalization/slug';
import {
	mapRowToJourneySitemapEntry,
	reconcileSitemapCounts,
	resolveCanonicalJourneySlug,
	shouldIncludeJourneyInSitemap,
} from '@/lib/journeyNormalization/sitemap';
import {
	buildPublicStatusWhereClause,
	isPublicJourneyStatusCompat,
	isPublicJourneyStatusStrict,
	proposeJourneyStatus,
	validateJourneyStatus,
} from '@/lib/journeyNormalization/status';
import {
	JOURNEY_TYPES,
	isJourneyTypeSlug,
	proposeJourneyType,
	validateJourneyType,
} from '@/lib/journeyNormalization/taxonomy';

describe('journeyNormalization.status', () => {
	it('treats active as public in compat mode', () => {
		expect(isPublicJourneyStatusCompat('active')).toBe(true);
	});

	it('treats NULL as public in compat mode only', () => {
		expect(isPublicJourneyStatusCompat(null)).toBe(true);
		expect(isPublicJourneyStatusStrict(null)).toBe(false);
	});

	it('rejects invalid status values', () => {
		expect(validateJourneyStatus('inactive').issue).toBe('legacy_inactive');
		expect(validateJourneyStatus('published').issue).toBe('illegal_status:published');
	});

	it('maps inactive to archived in proposal', () => {
		expect(proposeJourneyStatus({ status: 'inactive' }).proposed).toBe('archived');
	});

	it('strict is default public status SQL after J2C1', () => {
		expect(buildPublicStatusWhereClause()).toBe("status = 'active'");
		expect(buildPublicStatusWhereClause({ mode: 'compat' })).toBe(
			"status = 'active' OR status IS NULL"
		);
		expect(buildPublicStatusWhereClause({ strict: true })).toBe("status = 'active'");
	});
});

describe('journeyNormalization.taxonomy', () => {
	it('exports canonical JOURNEY_TYPES', () => {
		expect(JOURNEY_TYPES).toEqual([
			'explore-together',
			'deep-discovery',
			'signature-journeys',
			'group-tours',
		]);
	});

	it('maps labels to slugs', () => {
		expect(proposeJourneyType({ journey_type: 'Explore Together' }).proposed).toBe(
			'explore-together'
		);
	});

	it('rejects illegal journey type', () => {
		expect(validateJourneyType('Luxury Escapes').valid).toBe(false);
	});

	it('accepts slug values', () => {
		expect(isJourneyTypeSlug('deep-discovery')).toBe(true);
	});
});

describe('journeyNormalization.slug', () => {
	it('normalizes trailing hyphen slug', () => {
		expect(
			normalizeJourneySlug(
				'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-'
			)
		).toBe(
			'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour'
		);
	});

	it('flags redirect for trailing hyphen active slug', () => {
		const proposal = proposeJourneySlug({
			slug: 'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-',
		});
		expect(proposal.redirectRequired).toBe(true);
	});

	it('checks canonical slug uniqueness', () => {
		const map = new Map([
			['beijing-city-tour', ['a']],
			['duplicate-slug', ['b', 'c']],
		]);
		expect(assertCanonicalSlugUnique('beijing-city-tour', map).unique).toBe(true);
		expect(assertCanonicalSlugUnique('duplicate-slug', map).unique).toBe(false);
	});

	it('validates canonical slug pattern', () => {
		expect(isValidCanonicalSlug('beijing-city-tour')).toBe(true);
		expect(isValidCanonicalSlug('bad-slug-')).toBe(false);
	});
});

describe('journeyNormalization.redirects', () => {
	it('maps known trailing-hyphen slug to canonical destination', () => {
		const from =
			'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-';
		const to = getJourneySlugRedirect(from);
		expect(to).toBe(
			'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour'
		);
	});

	it('builds next.config redirect entries', () => {
		const entries = buildJourneySlugRedirectConfig();
		expect(entries[0]?.permanent).toBe(true);
		expect(entries[0]?.destination).toContain(
			JOURNEY_SLUG_REDIRECTS[
				'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-'
			]
		);
	});

	it('returns lookup candidates for canonical slug only (includes legacy DB row)', () => {
		const canonical =
			'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour';
		const legacy = `${canonical}-`;
		expect(getJourneySlugDbLookupCandidates(canonical)).toContain(legacy);
	});

	it('returns empty candidates for legacy slug (redirect before DB lookup)', () => {
		expect(
			getJourneySlugDbLookupCandidates(
				'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-'
			)
		).toEqual([]);
	});

	it('detects redirecting old slug for sitemap exclusion', () => {
		expect(
			isRedirectingOldSlug(
				'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-'
			)
		).toBe(true);
	});
});

describe('journeyNormalization.seo vs published', () => {
	it('published active journey remains published when seo incomplete', () => {
		const row = {
			status: 'active',
			slug: 'beijing-city-tour',
			title: 'Beijing City Tour',
			short_description: 'Short',
			data: { pageTitle: 'Page', metaDescription: 'Meta', heroImage: '/hero.jpg' },
		};
		expect(isJourneyPublished(row.status)).toBe(true);
		const seo = evaluateJourneySeoCompleteness(row);
		expect(seo.complete).toBe(false);
		expect(seo.missing).toContain('hero_alt');
	});

	it('seo completeness does not require published status', () => {
		const evaluation = evaluateJourneySeoCompleteness({
			status: 'draft',
			slug: 'beijing-city-tour',
			title: 'T',
			short_description: 'E',
			data: {
				pageTitle: 'P',
				metaDescription: 'M',
				heroImage: '/h.jpg',
				heroAlt: 'Alt',
			},
		});
		expect(evaluation.complete).toBe(true);
	});
});

describe('journeyNormalization.write', () => {
	it('maps inactive to archived on write', () => {
		expect(normalizeJourneyStatusForWrite('inactive')).toBe('archived');
	});

	it('reads legacy inactive as archived in admin', () => {
		expect(normalizeJourneyStatusForRead('inactive')).toBe('archived');
	});

	it('rejects new inactive-like unknown statuses', () => {
		expect(() => normalizeJourneyStatusForWrite('published')).toThrow();
	});
});

describe('journeyNormalization.fields', () => {
	it('prefers column page_title over JSONB when flag on', () => {
		process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';
		const resolved = resolvePageTitle({
			title: 'Column Title',
			data: { pageTitle: 'JSON Title' },
			page_title: 'Expanded Column',
		} as JourneyRowLike);
		expect(resolved.value).toBe('Expanded Column');
		expect(resolved.source).toBe('column');
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
	});
});


describe('journeyNormalization.seo', () => {
	it('marks journey seo-incomplete when hero alt missing', () => {
		const evaluation = evaluateJourneySeoCompleteness({
			status: 'active',
			slug: 'beijing-city-tour',
			title: 'Beijing City Tour',
			short_description: 'Short',
			data: {
				pageTitle: 'Beijing City Tour',
				metaDescription: 'Meta',
				heroImage: '/hero.jpg',
			},
		});
		expect(evaluation.complete).toBe(false);
		expect(evaluation.missing).toContain('hero_alt');
	});

	it('extracts SEO field sources from JSONB', () => {
		const fields = extractSeoFieldSources({
			title: 'Title',
			data: { pageTitle: 'Page', metaDescription: 'Meta', heroImage: '/h.jpg', heroAlt: 'Alt' },
		});
		expect(fields.pageTitle.value).toBe('Page');
		expect(fields.heroImageAlt.value).toBe('Alt');
	});
});

describe('journeyNormalization.price', () => {
	it('does not treat zero as a real price', () => {
		expect(parseNumericPrice(0)).toBeNull();
	});

	it('flags missing currency and basis for manual review', () => {
		const result = evaluatePriceCompleteness({
			id: '1',
			slug: 'beijing-city-tour',
			price: 299,
			data: {},
		});
		expect(result.manualReviewRequired).toBe(true);
		expect(result.proposedAction).toContain('currency');
	});

	it('validates ISO4217 currency and price basis enums', () => {
		expect(isIso4217Currency('USD')).toBe(true);
		expect(isIso4217Currency('unknown')).toBe(false);
		expect(isPriceBasis('per_person')).toBe(true);
	});
});

describe('journeyNormalization.sitemap', () => {
	it('maps row to sitemap entry with updated_at', () => {
		const updatedAt = new Date('2026-02-17T04:42:44.000Z');
		const entry = mapRowToJourneySitemapEntry({
			slug: 'beijing-city-tour',
			status: 'active',
			updated_at: updatedAt,
		});
		expect(entry?.updatedAt).toEqual(updatedAt);
		expect(entry?.urlPath).toBe('/journeys/beijing-city-tour');
	});

	it('includes active redirecting slug using canonical sitemap URL', () => {
		expect(
			shouldIncludeJourneyInSitemap({
				status: 'active',
				slug: 'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-',
			})
		).toBe(true);
	});

	it('resolves canonical slug for sitemap URLs', () => {
		expect(
			resolveCanonicalJourneySlug(
				'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-'
			)
		).toBe(
			'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour'
		);
	});

	it('reconciles sitemap counts', () => {
		const entries = [
			{
				slug: 'a',
				canonicalSlug: 'a',
				updatedAt: new Date(),
				urlPath: '/journeys/a',
			},
		];
		expect(reconcileSitemapCounts(entries, 24).missing).toBe(23);
	});
});
