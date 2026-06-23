import { describe, expect, it } from 'vitest';

import { CANONICAL_ARTICLE_CATEGORIES } from '@/lib/articleCategories';

import { computeFieldChanges, countUnresolvedFactCheckItems } from './revisionDiff';
import { validateSeoRevisionSubmission } from './schema';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';
const OTHER_UUID = '22222222-2222-4222-8222-222222222222';

function buildValidRevision(overrides: Record<string, unknown> = {}) {
	return {
		sourceArticleId: VALID_UUID,
		sourceSlug: 'sample-article',
		sourceUpdatedAt: '2026-06-01T12:00:00.000Z',
		title: 'Updated Title',
		pageTitle: 'Updated Page Title',
		metaDescription: 'Updated meta description for SEO testing.',
		excerpt: 'Updated excerpt text.',
		category: CANONICAL_ARTICLE_CATEGORIES[0],
		tags: ['china', 'travel'],
		content: null,
		contentBlocks: [{ id: '1', type: 'paragraph', text: 'Updated body copy.' }],
		faqs: [{ question: 'What changed?', answer: 'SEO revision test.' }],
		ctaConfig: { mode: 'auto' },
		relatedArticles: [OTHER_UUID],
		relatedJourneys: [OTHER_UUID],
		changeSummary: 'Improved SEO metadata and body structure.',
		factCheckItems: [{ item: 'Verify opening hours', resolved: true }],
		...overrides,
	};
}

describe('validateSeoRevisionSubmission', () => {
	it('accepts a valid revision payload', () => {
		const result = validateSeoRevisionSubmission(buildValidRevision());
		expect(result.success).toBe(true);
	});

	it('rejects invalid category', () => {
		const result = validateSeoRevisionSubmission(
			buildValidRevision({ category: 'Food Journey' })
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.category).toBeTruthy();
		}
	});

	it('rejects missing required fields', () => {
		const result = validateSeoRevisionSubmission({
			sourceArticleId: VALID_UUID,
			sourceSlug: 'sample-article',
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.title).toBeTruthy();
			expect(result.errors.changeSummary).toBeTruthy();
		}
	});

	it('rejects forbidden fields', () => {
		const result = validateSeoRevisionSubmission(
			buildValidRevision({ status: 'published', author: 'hacker' })
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.status).toBeTruthy();
			expect(result.errors.author).toBeTruthy();
		}
	});

	it('rejects unknown sensitive fields', () => {
		const result = validateSeoRevisionSubmission(
			buildValidRevision({ canonical: 'https://example.com' })
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.canonical).toBeTruthy();
		}
	});

	it('requires content or contentBlocks', () => {
		const result = validateSeoRevisionSubmission(
			buildValidRevision({ content: null, contentBlocks: [] })
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.content).toBeTruthy();
		}
	});

	it('rejects an invalid sourceUpdatedAt timestamp', () => {
		const result = validateSeoRevisionSubmission(
			buildValidRevision({ sourceUpdatedAt: 'not-a-timestamp' })
		);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors.sourceUpdatedAt).toContain('valid ISO 8601');
		}
	});
});

describe('revision diff helpers', () => {
	it('computes field-level changes', () => {
		const before = {
			title: 'Old',
			pageTitle: 'Old Page',
			metaDescription: 'Old meta',
			excerpt: 'Old excerpt',
			category: CANONICAL_ARTICLE_CATEGORIES[0],
			tags: ['a'],
			content: null,
			contentBlocks: [],
			faqs: [],
			ctaConfig: {},
			relatedArticles: [],
			relatedJourneys: [],
		};
		const after = { ...before, title: 'New', tags: ['a', 'b'] };
		const changes = computeFieldChanges(before, after);
		expect(changes.map((change) => change.field)).toEqual(['title', 'tags']);
	});

	it('counts unresolved fact check items', () => {
		expect(
			countUnresolvedFactCheckItems([
				{ resolved: true },
				{ resolved: false },
				{ resolved: false },
			])
		).toBe(2);
	});
});
