import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CANONICAL_ARTICLE_CATEGORIES } from '@/lib/articleCategories';
import type { Article } from '@/types/article';

import { submitSeoRevision } from './revisionSubmit';

const ARTICLE_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_UUID = '22222222-2222-4222-8222-222222222222';
const UPDATED_AT = '2026-06-17T08:20:28.796Z';

const mockArticle: Article = {
	id: ARTICLE_ID,
	slug: 'sample-article',
	title: 'Original Title',
	author: 'KoraScale',
	coverImage: '/cover.jpg',
	category: CANONICAL_ARTICLE_CATEGORIES[0],
	content: undefined,
	contentBlocks: [{ id: '1', type: 'paragraph', text: 'Original body.' }],
	excerpt: 'Original excerpt',
	relatedJourneyIds: [],
	recommendedItems: [],
	tags: ['china'],
	faqs: [],
	ctaConfig: { mode: 'auto' },
	status: 'active',
	pageTitle: 'Original Page Title',
	metaDescription: 'Original meta description.',
	createdAt: new Date(UPDATED_AT),
	updatedAt: new Date(UPDATED_AT),
};

const mockGetArticleById = vi.fn();
const mockGetArticleBySlug = vi.fn();
const mockSupersede = vi.fn();
const mockInsert = vi.fn();

vi.mock('./articleRevisionQuery.server', () => ({
	getArticleByIdForSeo: (...args: unknown[]) => mockGetArticleById(...args),
	getArticleBySlugForSeo: (...args: unknown[]) => mockGetArticleBySlug(...args),
	supersedePendingRevisions: (...args: unknown[]) => mockSupersede(...args),
	insertArticleRevision: (...args: unknown[]) => mockInsert(...args),
}));

function buildRevision(overrides: Record<string, unknown> = {}) {
	return {
		sourceArticleId: ARTICLE_ID,
		sourceSlug: 'sample-article',
		sourceUpdatedAt: UPDATED_AT,
		title: 'Revised Title',
		pageTitle: 'Revised Page Title',
		metaDescription: 'Revised meta description for SEO testing.',
		excerpt: 'Revised excerpt text.',
		category: CANONICAL_ARTICLE_CATEGORIES[0],
		tags: ['china', 'planning'],
		content: null,
		contentBlocks: [{ id: '1', type: 'paragraph', text: 'Revised body copy.' }],
		faqs: [{ question: 'Why revise?', answer: 'SEO improvements.' }],
		ctaConfig: { mode: 'auto' },
		relatedArticles: [OTHER_UUID],
		relatedJourneys: [OTHER_UUID],
		changeSummary: 'Updated title, body, and metadata.',
		factCheckItems: [
			{ item: 'Verify visa policy', resolved: false },
			{ item: 'Check route names', resolved: true },
		],
		...overrides,
	};
}

describe('submitSeoRevision', () => {
	beforeEach(() => {
		mockGetArticleById.mockReset();
		mockGetArticleBySlug.mockReset();
		mockSupersede.mockReset();
		mockInsert.mockReset();
		mockGetArticleById.mockResolvedValue(mockArticle);
		mockSupersede.mockResolvedValue([]);
		mockInsert.mockResolvedValue('rev-123');
	});

	it('dry-run validates and summarizes without database writes', async () => {
		const result = await submitSeoRevision({
			fileContent: buildRevision(),
			dryRun: true,
			createdBy: 'codex',
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.summary.status).toBe('dry-run');
			expect(result.summary.fieldChanges.length).toBeGreaterThan(0);
			expect(result.summary.unresolvedFactCheckCount).toBe(1);
		}
		expect(mockInsert).not.toHaveBeenCalled();
		expect(mockSupersede).not.toHaveBeenCalled();
	});

	it('makes the same millisecond conflict decision for dry-run and submit without writes', async () => {
		const conflictingRevision = buildRevision({
			sourceUpdatedAt: '2026-06-17T08:20:28.000Z',
		});
		const dryRunResult = await submitSeoRevision({
			fileContent: conflictingRevision,
			dryRun: true,
			createdBy: 'codex',
		});
		const submitResult = await submitSeoRevision({
			fileContent: conflictingRevision,
			dryRun: false,
			createdBy: 'codex',
		});

		expect(dryRunResult.success).toBe(false);
		expect(submitResult.success).toBe(false);
		if (!dryRunResult.success && !submitResult.success) {
			expect(dryRunResult.error).toBe(submitResult.error);
			expect(dryRunResult.error).toContain('sourceUpdatedAt conflict');
			expect(dryRunResult.error).toContain('Revision timestamp 2026-06-17T08:20:28.000Z');
			expect(dryRunResult.error).toContain('database timestamp 2026-06-17T08:20:28.796Z');
			expect(dryRunResult.error).toContain('Re-export');
		}
		expect(mockInsert).not.toHaveBeenCalled();
		expect(mockSupersede).not.toHaveBeenCalled();
	});

	it('rejects sourceArticleId mismatches before writes', async () => {
		mockGetArticleById.mockResolvedValue({ ...mockArticle, id: OTHER_UUID });
		const result = await submitSeoRevision({
			fileContent: buildRevision(),
			dryRun: false,
			createdBy: 'codex',
		});

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toContain('sourceArticleId mismatch');
		expect(mockInsert).not.toHaveBeenCalled();
		expect(mockSupersede).not.toHaveBeenCalled();
	});

	it('rejects sourceSlug mismatches before writes', async () => {
		mockGetArticleById.mockResolvedValue({ ...mockArticle, slug: 'different-slug' });
		const result = await submitSeoRevision({
			fileContent: buildRevision(),
			dryRun: true,
			createdBy: 'codex',
		});

		expect(result.success).toBe(false);
		if (!result.success) expect(result.error).toContain('sourceSlug mismatch');
		expect(mockInsert).not.toHaveBeenCalled();
		expect(mockSupersede).not.toHaveBeenCalled();
	});

	it('creates pending revision without modifying articles table helpers', async () => {
		const result = await submitSeoRevision({
			fileContent: buildRevision(),
			dryRun: false,
			createdBy: 'codex',
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.summary.status).toBe('pending');
			expect(result.summary.revisionId).toBe('rev-123');
		}
		expect(mockInsert).toHaveBeenCalledOnce();
		expect(mockSupersede).toHaveBeenCalledWith(ARTICLE_ID, 'codex');

		const insertArgs = mockInsert.mock.calls[0][0];
		expect(insertArgs.reviewMetadata).toEqual({
			changeSummary: 'Updated title, body, and metadata.',
			factCheckItems: [
				{ item: 'Verify visa policy', resolved: false },
				{ item: 'Check route names', resolved: true },
			],
		});
		expect(insertArgs.proposedContent).not.toHaveProperty('changeSummary');
		expect(insertArgs.proposedContent).not.toHaveProperty('factCheckItems');
		expect(insertArgs.sourceSnapshot).not.toHaveProperty('changeSummary');
		expect(insertArgs.sourceSnapshot).not.toHaveProperty('factCheckItems');
	});

	it('persists empty factCheckItems arrays in review_metadata', async () => {
		const result = await submitSeoRevision({
			fileContent: buildRevision({ factCheckItems: [] }),
			dryRun: false,
			createdBy: 'codex',
		});

		expect(result.success).toBe(true);
		expect(mockInsert).toHaveBeenCalledWith(
			expect.objectContaining({
				reviewMetadata: {
					changeSummary: 'Updated title, body, and metadata.',
					factCheckItems: [],
				},
			})
		);
	});

	it('dry-run does not pass review_metadata to insert', async () => {
		await submitSeoRevision({
			fileContent: buildRevision(),
			dryRun: true,
			createdBy: 'codex',
		});
		expect(mockInsert).not.toHaveBeenCalled();
	});

	it('supersedes existing pending revisions before creating a new one', async () => {
		mockSupersede.mockResolvedValue(['old-rev-1', 'old-rev-2']);

		const result = await submitSeoRevision({
			fileContent: buildRevision(),
			dryRun: false,
			createdBy: 'codex',
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.summary.supersededRevisionIds).toEqual(['old-rev-1', 'old-rev-2']);
		}
	});

	it('warns about unresolved factCheckItems in summary', async () => {
		const result = await submitSeoRevision({
			fileContent: buildRevision(),
			dryRun: true,
			createdBy: 'codex',
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.summary.warnings.some((warning) => warning.includes('unresolved'))).toBe(
				true
			);
		}
	});
});
