import { describe, expect, it } from 'vitest';

import { CANONICAL_ARTICLE_CATEGORIES } from '@/lib/articleCategories';
import type { Article } from '@/types/article';

import { detectRevisionSourceConflict } from './revisionConflict';
import type { ArticleRevisionRecord } from './types';

const UPDATED_AT = '2026-06-17T08:20:28.796Z';

function buildRevision(overrides: Partial<ArticleRevisionRecord> = {}): ArticleRevisionRecord {
	return {
		id: 'rev-1',
		articleId: 'article-1',
		sourceSlug: 'sample-slug',
		sourceSnapshot: {
			title: 'Live',
			pageTitle: 'Live page',
			metaDescription: 'Live meta',
			excerpt: 'Live excerpt',
			category: CANONICAL_ARTICLE_CATEGORIES[0],
			tags: ['a'],
			content: null,
			contentBlocks: [{ id: '1', type: 'paragraph', text: 'Body' }],
			faqs: [],
			ctaConfig: { mode: 'auto' },
			relatedArticles: [],
			relatedJourneys: [],
		},
		proposedContent: {},
		reviewMetadata: { changeSummary: '', factCheckItems: [] },
		sourceUpdatedAt: new Date(UPDATED_AT),
		status: 'pending',
		createdBy: 'codex',
		createdAt: new Date(UPDATED_AT),
		updatedAt: new Date(UPDATED_AT),
		publishedAt: null,
		...overrides,
	};
}

function buildArticle(overrides: Partial<Article> = {}): Article {
	return {
		id: 'article-1',
		slug: 'sample-slug',
		title: 'Live',
		author: 'Author',
		coverImage: '/c.jpg',
		category: CANONICAL_ARTICLE_CATEGORIES[0],
		contentBlocks: [{ id: '1', type: 'paragraph', text: 'Body' }],
		excerpt: 'Live excerpt',
		pageTitle: 'Live page',
		metaDescription: 'Live meta',
		tags: ['a'],
		faqs: [],
		ctaConfig: { mode: 'auto' },
		relatedJourneyIds: [],
		status: 'active',
		createdAt: new Date(UPDATED_AT),
		updatedAt: new Date(UPDATED_AT),
		...overrides,
	};
}

describe('detectRevisionSourceConflict', () => {
	it('uses source_updated_at millisecond comparison when column is set', () => {
		const revision = buildRevision({ sourceUpdatedAt: new Date(UPDATED_AT) });
		const article = buildArticle({ updatedAt: new Date('2026-06-18T00:00:00.000Z') });
		const result = detectRevisionSourceConflict(revision, article);
		expect(result.hasConflict).toBe(true);
		expect(result.reason).toBe('updated_at');
	});

	it('allows publish when source_updated_at matches live article', () => {
		const revision = buildRevision({ sourceUpdatedAt: new Date(UPDATED_AT) });
		const article = buildArticle({ updatedAt: new Date(UPDATED_AT) });
		expect(detectRevisionSourceConflict(revision, article).hasConflict).toBe(false);
	});

	it('falls back to snapshot comparison for legacy revisions without source_updated_at', () => {
		const revision = buildRevision({ sourceUpdatedAt: null });
		const article = buildArticle({ title: 'Changed after submit' });
		const result = detectRevisionSourceConflict(revision, article);
		expect(result.hasConflict).toBe(true);
		expect(result.reason).toBe('snapshot');
	});
});
