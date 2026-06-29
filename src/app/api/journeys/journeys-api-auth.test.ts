import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/articleAccess.server', () => ({
	isAuthenticatedAdmin: vi.fn(),
}));

vi.mock('@/lib/journeyListQuery.server', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/lib/journeyListQuery.server')>();
	return {
		...actual,
		queryJourneyRows: vi.fn(),
	};
});

import { isAuthenticatedAdmin } from '@/lib/auth/articleAccess.server';
import { queryJourneyRows } from '@/lib/journeyListQuery.server';

import { GET } from './route';

const activeRow = {
	id: 'active-1',
	slug: 'active-journey',
	status: 'active',
	title: 'Active Journey',
	short_description: 'Visible short copy',
	page_title: 'Active Page Title',
	meta_description: 'SEO meta only',
	hero_image_url: '/hero.jpg',
	hero_image_alt: 'Hero alt',
	journey_type_slug: 'deep-discovery',
	data: {
		pageTitle: 'JSONB Page Title',
		metaDescription: 'JSONB meta leak',
		itinerary: [],
	},
};

const archivedRow = {
	id: 'archived-1',
	slug: 'archived-journey',
	status: 'archived',
	title: 'Archived Journey',
	short_description: 'Archived short',
	page_title: 'Archived Page',
	meta_description: 'Archived meta',
	hero_image_url: '/archived-hero.jpg',
	hero_image_alt: 'Archived alt',
	journey_type_slug: 'deep-discovery',
	data: {
		pageTitle: 'Archived JSONB Title',
		metaDescription: 'Archived JSONB meta',
		secretItinerary: [{ day: 1 }],
	},
};

function getRequest(search = '') {
	return new NextRequest(`http://localhost:3000/api/journeys${search}`, {
		method: 'GET',
	});
}

describe('journeys API includeAll auth (PR-J3A)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.NEON_POSTGRES_URL = 'postgres://test';
		vi.mocked(queryJourneyRows).mockResolvedValue([activeRow, archivedRow]);
	});

	it('1. anonymous default returns only active journeys', async () => {
		vi.mocked(isAuthenticatedAdmin).mockResolvedValue(false);
		vi.mocked(queryJourneyRows).mockResolvedValue([activeRow]);

		const response = await GET(getRequest());
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.journeys).toHaveLength(1);
		expect(body.journeys[0].slug).toBe('active-journey');
		expect(queryJourneyRows).toHaveBeenCalledWith(
			expect.objectContaining({ includeAll: false })
		);
	});

	it('2. anonymous includeAll=true does not return archived', async () => {
		vi.mocked(isAuthenticatedAdmin).mockResolvedValue(false);

		const response = await GET(getRequest('?includeAll=true'));
		expect(response.status).toBe(403);
		const body = await response.json();
		expect(body.error).toBe('FORBIDDEN');
		expect(queryJourneyRows).not.toHaveBeenCalled();
	});

	it('3. authenticated Admin includeAll=true can return archived', async () => {
		vi.mocked(isAuthenticatedAdmin).mockResolvedValue(true);

		const response = await GET(getRequest('?includeAll=true'));
		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.journeys).toHaveLength(2);
		expect(body.journeys.map((j: { slug: string }) => j.slug)).toEqual(
			expect.arrayContaining(['active-journey', 'archived-journey'])
		);
		expect(queryJourneyRows).toHaveBeenCalledWith(
			expect.objectContaining({ includeAll: true })
		);
	});

	it('4. public API does not leak archived normalized or JSONB content', async () => {
		vi.mocked(isAuthenticatedAdmin).mockResolvedValue(false);
		vi.mocked(queryJourneyRows).mockResolvedValue([activeRow]);

		const response = await GET(getRequest());
		const body = await response.json();
		const slugs = body.journeys.map((j: { slug: string }) => j.slug);
		expect(slugs).not.toContain('archived-journey');
		for (const journey of body.journeys) {
			expect(journey.pageTitle).toBe('Active Page Title');
			expect(journey.metaDescription).toBe('SEO meta only');
			expect(journey.pageTitle).not.toBe('JSONB Page Title');
			expect(journey.metaDescription).not.toBe('JSONB meta leak');
		}
	});
});
