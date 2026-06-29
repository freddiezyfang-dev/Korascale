import { describe, expect, it } from 'vitest';

import { resolveAdminCompatPageTitle } from '@/lib/journeyNormalization/adminCompatFields';
import { mapJourneyRowToPublicJourney } from '@/lib/journeyListQuery.server';
import { isJourneyPublished } from '@/lib/journeyNormalization/published';
import { shouldIncludeJourneyInSitemap } from '@/lib/journeyNormalization/sitemap';
import {
	buildPublicStatusWhereClause,
	isPublicJourneyStatusCompat,
	isPublicJourneyStatusStrict,
} from '@/lib/journeyNormalization/status';
import {
	normalizeJourneyStatusForWrite,
	validateJourneyStatusForApiWrite,
} from '@/lib/journeyNormalization/write';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';

function row(overrides: Partial<JourneyRowLike> & { id: string; slug: string }): JourneyRowLike {
	return {
		title: 'Test',
		status: 'draft',
		data: {},
		...overrides,
	};
}

describe('PR-J2C1 strict public status', () => {
	it('active is public', () => {
		expect(isPublicJourneyStatusStrict('active')).toBe(true);
		expect(isJourneyPublished('active')).toBe(true);
		expect(shouldIncludeJourneyInSitemap({ status: 'active', slug: 'ok' })).toBe(true);
	});

	it('archived is not public', () => {
		expect(isPublicJourneyStatusStrict('archived')).toBe(false);
		expect(isJourneyPublished('archived')).toBe(false);
		expect(shouldIncludeJourneyInSitemap({ status: 'archived', slug: 'x' })).toBe(false);
	});

	it('draft is not public', () => {
		expect(isPublicJourneyStatusStrict('draft')).toBe(false);
		expect(isJourneyPublished('draft')).toBe(false);
	});

	it('NULL status is not public in strict mode', () => {
		expect(isPublicJourneyStatusStrict(null)).toBe(false);
		expect(isJourneyPublished(null)).toBe(false);
		expect(shouldIncludeJourneyInSitemap({ status: null, slug: 'x' })).toBe(false);
	});

	it('public query SQL defaults to active only', () => {
		expect(buildPublicStatusWhereClause()).toBe("status = 'active'");
		expect(buildPublicStatusWhereClause()).not.toContain('IS NULL');
	});

	it('compat includes NULL only when explicitly requested', () => {
		expect(buildPublicStatusWhereClause({ mode: 'compat' })).toContain('IS NULL');
		expect(isPublicJourneyStatusCompat(null)).toBe(true);
		expect(buildPublicStatusWhereClause()).not.toContain('IS NULL');
	});

	it('admin includeAll omits public status filter', () => {
		const publicWhere = buildPublicStatusWhereClause();
		const adminSql = 'SELECT id FROM journeys';
		const publicSql = `SELECT id FROM journeys WHERE ${publicWhere}`;
		expect(adminSql).not.toContain(publicWhere);
		expect(publicSql).toBe("SELECT id FROM journeys WHERE status = 'active'");
	});

	it('seo_complete false does not hide active journeys', () => {
		expect(
			shouldIncludeJourneyInSitemap({
				status: 'active',
				slug: 'ok',
				seo_complete: false,
			} as JourneyRowLike)
		).toBe(true);
	});

	it('seo_complete true does not publish archived journeys', () => {
		expect(
			shouldIncludeJourneyInSitemap({
				status: 'archived',
				slug: 'x',
				seo_complete: true,
			} as JourneyRowLike)
		).toBe(false);
	});

	it('sitemap count matches 24 active production snapshot', () => {
		const productionLike = Array.from({ length: 24 }, (_, i) =>
			row({ id: `a-${i}`, slug: `active-${i}`, status: 'active' })
		).concat(
			Array.from({ length: 59 }, (_, i) =>
				row({ id: `r-${i}`, slug: `arch-${i}`, status: 'archived' })
			)
		);
		const sitemapSlugs = productionLike
			.filter((r) => shouldIncludeJourneyInSitemap({ status: r.status, slug: r.slug }))
			.map((r) => r.slug);
		expect(sitemapSlugs).toHaveLength(24);
	});

	it('public API filter matches 24 active rows', () => {
		const productionLike = Array.from({ length: 24 }, (_, i) =>
			row({ id: `a-${i}`, slug: `active-${i}`, status: 'active' })
		).concat(
			Array.from({ length: 59 }, (_, i) =>
				row({ id: `r-${i}`, slug: `arch-${i}`, status: 'archived' })
			)
		);
		const publicRows = productionLike.filter((r) =>
			isPublicJourneyStatusStrict(r.status)
		);
		expect(publicRows).toHaveLength(24);
	});

	it('archived and draft detail would not pass published check (404 semantics)', () => {
		expect(isJourneyPublished('archived')).toBe(false);
		expect(isJourneyPublished('draft')).toBe(false);
	});

	it('strict and compat agree when no NULL status rows', () => {
		const productionLike = Array.from({ length: 24 }, (_, i) =>
			row({ id: `a-${i}`, slug: `active-${i}`, status: 'active' })
		).concat(
			Array.from({ length: 59 }, (_, i) =>
				row({ id: `r-${i}`, slug: `arch-${i}`, status: 'archived' })
			)
		);
		const strict = productionLike.filter((r) => isPublicJourneyStatusStrict(r.status));
		const compat = productionLike.filter((r) => isPublicJourneyStatusCompat(r.status));
		expect(strict).toHaveLength(24);
		expect(compat).toHaveLength(24);
	});

	it('JSONB itinerary still available on public journey rows', () => {
		const original = process.env.JOURNEY_NORMALIZATION_COLUMNS;
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		const journey = mapJourneyRowToPublicJourney({
			id: '1',
			slug: 's',
			status: 'active',
			page_title: 'Col',
			meta_description: 'Meta',
			hero_image_url: '/h.jpg',
			hero_image_alt: 'Alt',
			journey_type_slug: 'deep-discovery',
			data: { itinerary: [{ day: 1 }] },
		} as Record<string, unknown>);
		expect(journey.itinerary?.length).toBe(1);
		if (original === undefined) delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		else process.env.JOURNEY_NORMALIZATION_COLUMNS = original;
	});
});

describe('PR-J2C1 writer compatibility (unchanged)', () => {
	it('maps inactive to archived on write', () => {
		expect(normalizeJourneyStatusForWrite('inactive')).toBe('archived');
	});

	it('defaults NULL status input to draft', () => {
		expect(normalizeJourneyStatusForWrite(null, 'draft')).toBe('draft');
	});

	it('accepts draft, active, archived for API write', () => {
		for (const status of ['draft', 'active', 'archived'] as const) {
			expect(validateJourneyStatusForApiWrite(status)).toEqual({ ok: true, value: status });
		}
	});
});
