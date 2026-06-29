import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
	query: vi.fn(),
}));

import { query } from '@/lib/db';
import {
	buildCreatePublishCandidate,
	buildJourneyCreateMutation,
	buildUpdatePublishCandidate,
	sanitizeJourneyCreateBody,
	sanitizeJourneyUpdateBody,
} from '@/lib/journeyNormalization/journeyAdminMutation.server';
import { evaluateJourneyContentCompleteness } from '@/lib/journeyNormalization/journeyPublishIntegrity';

describe('PR-J3B journey admin mutation object', () => {
	const originalFlag = process.env.JOURNEY_NORMALIZATION_COLUMNS;

	beforeEach(() => {
		process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';
	});

	afterEach(() => {
		if (originalFlag === undefined) delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		else process.env.JOURNEY_NORMALIZATION_COLUMNS = originalFlag;
	});

	it('strips client seo_complete and internal auth fields', () => {
		const body = sanitizeJourneyCreateBody({
			title: 'Draft',
			slug: 'draft-journey',
			status: 'draft',
			seo_complete: true,
			seoComplete: true,
			id: 'client-id',
			role: 'admin',
			isAdmin: true,
		});

		expect(body.title).toBe('Draft');
		expect(body.normalizedStatus).toBe('draft');
		expect((body as Record<string, unknown>).seo_complete).toBeUndefined();
		expect((body as Record<string, unknown>).seoComplete).toBeUndefined();
		expect((body as Record<string, unknown>).id).toBeUndefined();
		expect((body as Record<string, unknown>).role).toBeUndefined();
		expect((body as Record<string, unknown>).isAdmin).toBeUndefined();
	});

	it('does not allow disallowed fields into sanitized update body', () => {
		const body = sanitizeJourneyUpdateBody({
			status: 'archived',
			seo_complete: true,
			unknownField: 'ignored',
			isAdmin: true,
		});

		expect(body.status).toBe('archived');
		expect((body as Record<string, unknown>).unknownField).toBeUndefined();
		expect((body as Record<string, unknown>).seo_complete).toBeUndefined();
	});

	it('gate candidate matches create mutation publish fields', () => {
		const body = sanitizeJourneyCreateBody({
			title: 'Sample',
			slug: 'sample-journey',
			shortDescription: 'Short',
			pageTitle: 'Page',
			metaDescription: 'Meta',
			heroImage: '/hero.jpg',
			heroAlt: 'Alt',
			journeyType: 'Deep Discovery',
			status: 'active',
		});

		const candidate = buildCreatePublishCandidate(body);
		const mutation = buildJourneyCreateMutation(body, true);

		expect(candidate.title).toBe('Sample');
		expect(candidate.slug).toBe('sample-journey');
		expect(candidate.status).toBe('active');
		expect(mutation.publishCandidate).toEqual(candidate);
		expect(evaluateJourneyContentCompleteness(candidate).contentComplete).toBe(true);
	});

	it('server seo_complete enters SQL params, not client value', () => {
		const body = sanitizeJourneyCreateBody({
			title: 'Draft',
			slug: 'draft-journey',
			status: 'draft',
			seo_complete: true,
		});
		const mutation = buildJourneyCreateMutation(body, false);
		expect(mutation.insertSql.toLowerCase()).toContain('seo_complete');
		expect(mutation.insertParams.includes(false)).toBe(true);
	});

	it('PUT status-only merges with existing row for gate candidate', () => {
		const existingRow = {
			id: 'journey-1',
			title: 'Active Journey',
			slug: 'active-journey',
			short_description: 'Short copy',
			page_title: 'Page title',
			meta_description: 'Meta description',
			hero_image_url: '/hero.jpg',
			hero_image_alt: 'Hero alt',
			journey_type_slug: 'deep-discovery',
			status: 'draft',
		};

		const candidate = buildUpdatePublishCandidate(existingRow, { status: 'active' });
		expect(candidate.status).toBe('active');
		expect(candidate.page_title).toBe('Page title');
		expect(candidate.meta_description).toBe('Meta description');
	});

	it('422 path performs zero INSERT calls', async () => {
		const body = sanitizeJourneyCreateBody({
			title: 'Incomplete',
			slug: 'incomplete-journey',
			status: 'active',
		});
		const candidate = buildCreatePublishCandidate(body);
		expect(evaluateJourneyContentCompleteness(candidate).contentComplete).toBe(false);
		expect(vi.mocked(query)).not.toHaveBeenCalled();
		buildJourneyCreateMutation(body, false);
		expect(vi.mocked(query)).not.toHaveBeenCalled();
	});
});
