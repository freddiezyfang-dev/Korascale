import { describe, expect, it } from 'vitest';

import {
	computeJourneyRevisionFieldChanges,
	formatJourneyRevisionChangeSummary,
} from '@/lib/journeyRevisions/revisionDiff';
import type { JourneyRevisionSnapshot } from '@/lib/journeyRevisions/types';

function baseSnapshot(overrides: Partial<JourneyRevisionSnapshot> = {}): JourneyRevisionSnapshot {
	return {
		id: 'j-1',
		title: 'Before',
		slug: 'before-slug',
		status: 'active',
		short_description: 'Short',
		description: 'Desc',
		page_title: 'Page',
		meta_description: 'Meta',
		hero_image_url: '/hero.jpg',
		hero_image_alt: 'Hero',
		journey_type_slug: 'deep-discovery',
		journey_type: 'Deep Discovery',
		display_order: null,
		seo_complete: true,
		data: { itinerary: [{ day: 1 }] },
		relationships: { relatedJourneyIds: [], relatedArticleIds: [] },
		price: 100,
		original_price: null,
		currency: null,
		price_from: null,
		price_basis: null,
		price_on_request: null,
		price_note: null,
		price_valid_until: null,
		category: null,
		region: null,
		place: null,
		city: null,
		location: null,
		duration: null,
		difficulty: null,
		max_participants: null,
		min_participants: null,
		image: null,
		featured: false,
		rating: null,
		review_count: null,
		created_at: null,
		updated_at: null,
		...overrides,
	};
}

describe('journey revision diff', () => {
	it('detects scalar and data field changes', () => {
		const before = baseSnapshot();
		const after = baseSnapshot({
			title: 'After',
			data: { itinerary: [{ day: 1 }, { day: 2 }] },
		});
		const changes = computeJourneyRevisionFieldChanges(before, after);
		expect(changes.some((c) => c.field === 'title')).toBe(true);
		expect(changes.some((c) => c.field === 'data.itinerary')).toBe(true);
	});

	it('marks create operation when source is null', () => {
		const after = baseSnapshot({ title: 'New Journey' });
		const changes = computeJourneyRevisionFieldChanges(null, after);
		expect(changes[0]?.field).toBe('operation');
	});

	it('formats change summary lines', () => {
		const summary = formatJourneyRevisionChangeSummary([
			{ field: 'title', before: 'A', after: 'B' },
		]);
		expect(summary[0]).toContain('title');
		expect(summary[0]).toContain('A');
		expect(summary[0]).toContain('B');
	});
});
