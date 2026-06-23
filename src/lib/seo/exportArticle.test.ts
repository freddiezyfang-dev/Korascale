import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CANONICAL_ARTICLE_CATEGORIES } from '@/lib/articleCategories';
import type { Article } from '@/types/article';

import { exportArticleBySlug } from './exportArticle';
import { buildSeoArticleExport, mapDbRowToArticle } from './mapArticle';

const mockGetArticleBySlug = vi.fn();

vi.mock('./articleRevisionQuery.server', () => ({
	getArticleBySlugForSeo: (...args: unknown[]) => mockGetArticleBySlug(...args),
}));

vi.mock('node:fs/promises', () => ({
	default: {
		mkdir: vi.fn().mockResolvedValue(undefined),
		writeFile: vi.fn().mockResolvedValue(undefined),
	},
}));

const sampleArticle: Article = {
	id: '11111111-1111-4111-8111-111111111111',
	slug: 'sample-article',
	title: 'Sample Article',
	author: 'KoraScale',
	coverImage: '/cover.jpg',
	category: CANONICAL_ARTICLE_CATEGORIES[0],
	content: undefined,
	contentBlocks: [{ id: '1', type: 'paragraph', text: 'Body text.' }],
	excerpt: 'Excerpt',
	relatedJourneyIds: ['22222222-2222-4222-8222-222222222222'],
	recommendedItems: [{ type: 'article', id: '33333333-3333-4333-8333-333333333333' }],
	tags: ['china'],
	faqs: [],
	ctaConfig: { mode: 'auto' },
	status: 'active',
	pageTitle: 'Sample Page Title',
	metaDescription: 'Sample meta description.',
	createdAt: new Date('2026-06-01T12:00:00.000Z'),
	updatedAt: new Date('2026-06-01T12:00:00.000Z'),
};

describe('exportArticleBySlug', () => {
	beforeEach(() => {
		mockGetArticleBySlug.mockReset();
	});

	it('exports a readable article payload', async () => {
		mockGetArticleBySlug.mockResolvedValue(sampleArticle);

		const result = await exportArticleBySlug('sample-article', '/tmp/source');

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.exportData.sourceSlug).toBe('sample-article');
			expect(result.exportData.sourceArticleId).toBe(sampleArticle.id);
			expect(result.exportData.relatedJourneys).toContain(
				'22222222-2222-4222-8222-222222222222'
			);
			expect(result.exportData.relatedArticles).toContain(
				'33333333-3333-4333-8333-333333333333'
			);
			expect(result.outputPath).toContain('sample-article.json');
		}
	});

	it('fails clearly when slug does not exist', async () => {
		mockGetArticleBySlug.mockResolvedValue(null);

		const result = await exportArticleBySlug('missing-slug', '/tmp/source');
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error).toContain('not found');
		}
	});

	it('preserves database milliseconds in sourceUpdatedAt', () => {
		const article = mapDbRowToArticle({
			id: sampleArticle.id,
			slug: sampleArticle.slug,
			title: sampleArticle.title,
			category: sampleArticle.category,
			status: sampleArticle.status,
			updated_at: new Date('2026-06-17T08:20:28.796Z'),
		});

		const exportData = buildSeoArticleExport(article);

		expect(exportData.sourceUpdatedAt).toBe('2026-06-17T08:20:28.796Z');
		expect(exportData.sourceUpdatedAt).not.toBe('2026-06-17T08:20:28.000Z');
	});
});
