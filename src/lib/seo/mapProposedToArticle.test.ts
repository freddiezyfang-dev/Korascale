import { describe, expect, it } from 'vitest';

import { CANONICAL_ARTICLE_CATEGORIES } from '@/lib/articleCategories';

import { mapProposedToArticleColumns } from './mapProposedToArticle';

describe('mapProposedToArticleColumns', () => {
	it('stores blocks and nulls legacy content when contentBlocks exist', () => {
		const columns = mapProposedToArticleColumns({
			title: 'T',
			pageTitle: 'PT',
			metaDescription: 'MD',
			excerpt: 'E',
			category: CANONICAL_ARTICLE_CATEGORIES[0],
			tags: [],
			content: '<p>legacy</p>',
			contentBlocks: [{ id: '1', type: 'paragraph', text: 'block' }],
			faqs: [],
			ctaConfig: { mode: 'auto' },
			relatedArticles: [],
			relatedJourneys: [],
		});

		expect(columns.content).toBeNull();
		expect(JSON.parse(columns.content_blocks)).toHaveLength(1);
	});

	it('stores legacy content and empty blocks when no contentBlocks', () => {
		const columns = mapProposedToArticleColumns({
			title: 'T',
			pageTitle: 'PT',
			metaDescription: 'MD',
			excerpt: 'E',
			category: CANONICAL_ARTICLE_CATEGORIES[0],
			tags: [],
			content: '<p>legacy</p>',
			contentBlocks: [],
			faqs: [],
			ctaConfig: { mode: 'auto' },
			relatedArticles: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'],
			relatedJourneys: ['bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],
		});

		expect(columns.content).toBe('<p>legacy</p>');
		expect(JSON.parse(columns.content_blocks)).toEqual([]);
		expect(JSON.parse(columns.related_journey_ids)).toEqual([
			'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
		]);
		expect(JSON.parse(columns.recommended_items)).toEqual([
			{ type: 'article', id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
		]);
	});
});
