import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CANONICAL_ARTICLE_CATEGORIES } from '@/lib/articleCategories';
import type { Article } from '@/types/article';

import { serializeArticleUpdatedAt } from './sourceTimestamp';
import type { ArticleRevisionRecord } from './types';

const ARTICLE_ID = '11111111-1111-4111-8111-111111111111';
const REVISION_ID = '14b4a364-a0ae-4811-9f45-3bdf2cf4ac99';
const JOURNEY_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_ARTICLE_ID = '33333333-3333-4333-8333-333333333333';
const UPDATED_AT = '2026-06-17T08:20:28.796Z';

const mockQuery = vi.fn();
const mockWithTransaction = vi.fn();
const mockGetRevisionById = vi.fn();
const mockGetArticleById = vi.fn();

vi.mock('@/lib/db', () => ({
	query: (...args: unknown[]) => mockQuery(...args),
	withTransaction: (fn: (client: unknown) => Promise<unknown>) => mockWithTransaction(fn),
}));

vi.mock('./articleRevisionQuery.server', () => ({
	getArticleRevisionById: (...args: unknown[]) => mockGetRevisionById(...args),
	getArticleByIdForSeo: (...args: unknown[]) => mockGetArticleById(...args),
	mapArticleRevisionRow: (row: Record<string, unknown>) => ({
		id: String(row.id),
		articleId: String(row.article_id),
		sourceSlug: String(row.source_slug),
		sourceSnapshot: row.source_snapshot ?? {},
		proposedContent: row.proposed_content ?? {},
		reviewMetadata: row.review_metadata ?? { changeSummary: '', factCheckItems: [] },
		sourceUpdatedAt: row.source_updated_at
			? new Date(serializeArticleUpdatedAt(row.source_updated_at))
			: null,
		status: row.status,
		createdBy: String(row.created_by),
		createdAt: new Date(String(row.created_at)),
		updatedAt: new Date(String(row.updated_at)),
		publishedAt: row.published_at ? new Date(String(row.published_at)) : null,
	}),
}));

const baseArticle: Article = {
	id: ARTICLE_ID,
	slug: 'chengdu-guide',
	title: 'Live Title',
	author: 'KoraScale',
	coverImage: '/cover.jpg',
	heroImage: '/hero.jpg',
	category: CANONICAL_ARTICLE_CATEGORIES[0],
	content: undefined,
	contentBlocks: [{ id: '1', type: 'paragraph', text: 'Live body.' }],
	excerpt: 'Live excerpt',
	relatedJourneyIds: [],
	recommendedItems: [],
	tags: ['china'],
	faqs: [],
	ctaConfig: { mode: 'auto' },
	status: 'active',
	featured: true,
	displayOrder: 5,
	pageTitle: 'Live Page Title',
	metaDescription: 'Live meta',
	createdAt: new Date(UPDATED_AT),
	updatedAt: new Date(UPDATED_AT),
};

function buildRevision(overrides: Partial<ArticleRevisionRecord> = {}): ArticleRevisionRecord {
	return {
		id: REVISION_ID,
		articleId: ARTICLE_ID,
		sourceSlug: 'chengdu-guide',
		sourceSnapshot: {
			title: 'Live Title',
			pageTitle: 'Live Page Title',
			metaDescription: 'Live meta',
			excerpt: 'Live excerpt',
			category: CANONICAL_ARTICLE_CATEGORIES[0],
			tags: ['china'],
			content: null,
			contentBlocks: [{ id: '1', type: 'paragraph', text: 'Live body.' }],
			faqs: [],
			ctaConfig: { mode: 'auto' },
			relatedArticles: [],
			relatedJourneys: [],
		},
		proposedContent: {
			title: 'Revised Title',
			pageTitle: 'Revised Page Title',
			metaDescription: 'Revised meta description for SEO.',
			excerpt: 'Revised excerpt',
			category: CANONICAL_ARTICLE_CATEGORIES[0],
			tags: ['china', 'chengdu'],
			content: null,
			contentBlocks: [{ id: '1', type: 'paragraph', text: 'Revised body.' }],
			faqs: [],
			ctaConfig: { mode: 'auto' },
			relatedArticles: [],
			relatedJourneys: [],
		},
		reviewMetadata: {
			changeSummary: 'SEO refresh',
			factCheckItems: [{ item: 'Verify facts', resolved: true }],
		},
		sourceUpdatedAt: new Date(UPDATED_AT),
		status: 'pending',
		createdBy: 'codex',
		createdAt: new Date(UPDATED_AT),
		updatedAt: new Date(UPDATED_AT),
		publishedAt: null,
		...overrides,
	};
}

describe('revisionAdmin.server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetArticleById.mockResolvedValue(baseArticle);
		mockWithTransaction.mockImplementation(async (fn) => {
			const client = {
				query: mockQuery,
			};
			return fn(client);
		});
	});

	it('rejects PUT attempts to modify sourceUpdatedAt', async () => {
		const { updatePendingArticleRevision, RevisionAdminError } = await import(
			'./revisionAdmin.server'
		);
		mockGetRevisionById.mockResolvedValue(buildRevision());

		await expect(
			updatePendingArticleRevision(REVISION_ID, { sourceUpdatedAt: '2026-06-18T00:00:00.000Z' })
		).rejects.toMatchObject({
			code: 'FORBIDDEN_FIELD',
			status: 400,
		});
		expect(mockQuery).not.toHaveBeenCalled();
	});

	it('updatePendingArticleRevision does not modify articles table', async () => {
		const { updatePendingArticleRevision } = await import('./revisionAdmin.server');
		mockGetRevisionById.mockResolvedValue(buildRevision());

		mockQuery.mockResolvedValue({ rows: [] });

		await updatePendingArticleRevision(REVISION_ID, { title: 'Edited Revision Title' });

		const sqlCalls = mockQuery.mock.calls.map((call) => String(call[0]));
		expect(sqlCalls.some((sql) => sql.includes('UPDATE articles'))).toBe(false);
		expect(sqlCalls.some((sql) => sql.includes('UPDATE article_revisions'))).toBe(true);
	});

	it('rejects editing non-pending revision with 409', async () => {
		const { updatePendingArticleRevision, RevisionAdminError } = await import(
			'./revisionAdmin.server'
		);
		mockGetRevisionById.mockResolvedValue(buildRevision({ status: 'published' }));

		await expect(updatePendingArticleRevision(REVISION_ID, { title: 'Nope' })).rejects.toMatchObject({
			code: 'REVISION_NOT_PENDING',
			status: 409,
		});
		expect(mockQuery).not.toHaveBeenCalled();
	});

	it('reject does not modify articles', async () => {
		const { rejectArticleRevision } = await import('./revisionAdmin.server');
		mockGetRevisionById
			.mockResolvedValueOnce(buildRevision())
			.mockResolvedValueOnce(buildRevision({ status: 'rejected' }));

		await rejectArticleRevision(REVISION_ID);

		const sql = String(mockQuery.mock.calls[0]?.[0] ?? '');
		expect(sql).toContain('article_revisions');
		expect(sql).not.toContain('articles');
	});

	it('reject is idempotent for already rejected revision', async () => {
		const { rejectArticleRevision } = await import('./revisionAdmin.server');
		const rejected = buildRevision({ status: 'rejected' });
		mockGetRevisionById.mockResolvedValue(rejected);

		const result = await rejectArticleRevision(REVISION_ID);
		expect(result.status).toBe('rejected');
		expect(mockQuery).not.toHaveBeenCalled();
	});

	it('publish returns REVISION_SOURCE_CONFLICT when article changed', async () => {
		const { publishArticleRevision } = await import('./revisionAdmin.server');
		const revision = buildRevision();
		mockQuery.mockImplementation(async (sql: string) => {
			if (sql.includes('article_revisions') && sql.includes('FOR UPDATE')) {
				return { rows: [revisionRow(revision)] };
			}
			if (sql.includes('articles') && sql.includes('FOR UPDATE')) {
				return {
					rows: [
						{
							...articleRowFromRevision(revision),
							title: 'Someone edited the live article',
							updated_at: new Date('2026-06-18T00:00:00.000Z'),
						},
					],
				};
			}
			return { rows: [] };
		});
		mockGetArticleById.mockResolvedValue({
			...baseArticle,
			title: 'Someone edited the live article',
			updatedAt: new Date('2026-06-18T00:00:00.000Z'),
		});

		await expect(publishArticleRevision(REVISION_ID)).rejects.toMatchObject({
			code: 'REVISION_SOURCE_CONFLICT',
			status: 409,
		});
	});

	it('blocks publish with unresolved fact checks', async () => {
		const { publishArticleRevision } = await import('./revisionAdmin.server');
		const revision = buildRevision({
			reviewMetadata: {
				changeSummary: 'x',
				factCheckItems: [{ item: 'Unresolved', resolved: false }],
			},
			sourceUpdatedAt: new Date(UPDATED_AT),
		});
		mockQuery.mockImplementation(async (sql: string) => {
			if (sql.includes('article_revisions') && sql.includes('FOR UPDATE')) {
				return { rows: [revisionRow(revision)] };
			}
			if (sql.includes('articles') && sql.includes('FOR UPDATE')) {
				return { rows: [articleRowFromRevision(revision)] };
			}
			return { rows: [] };
		});

		await expect(publishArticleRevision(REVISION_ID)).rejects.toMatchObject({
			code: 'UNRESOLVED_FACT_CHECKS',
			status: 400,
		});
	});

	it('publish updates allowed article fields inside a transaction', async () => {
		const { publishArticleRevision } = await import('./revisionAdmin.server');
		const revision = buildRevision({
			proposedContent: {
				...buildRevision().proposedContent,
				relatedJourneys: [JOURNEY_ID],
				relatedArticles: [OTHER_ARTICLE_ID],
			},
		});

		mockQuery.mockImplementation(async (sql: string) => {
			if (sql.includes('article_revisions') && sql.includes('FOR UPDATE')) {
				return { rows: [revisionRow(revision)] };
			}
			if (sql.includes('articles') && sql.includes('FOR UPDATE')) {
				return { rows: [articleRowFromRevision(revision)] };
			}
			if (sql.includes('SELECT 1 FROM articles WHERE id')) {
				return { rows: [{ '?column?': 1 }] };
			}
			if (sql.includes('SELECT 1 FROM journeys WHERE id')) {
				return { rows: [{ '?column?': 1 }] };
			}
			if (sql.includes('UPDATE articles')) {
				return { rowCount: 1, rows: [] };
			}
			if (sql.includes("status = 'published'")) {
				return { rowCount: 1, rows: [] };
			}
			if (sql.includes("status = 'superseded'")) {
				return { rowCount: 0, rows: [] };
			}
			return { rows: [] };
		});

		mockGetRevisionById.mockResolvedValue({
			...revision,
			status: 'published',
			publishedAt: new Date(),
		});
		mockGetArticleById.mockResolvedValue(baseArticle);

		await publishArticleRevision(REVISION_ID);

		expect(mockWithTransaction).toHaveBeenCalled();
		const updateArticleCall = mockQuery.mock.calls.find((call) =>
			String(call[0]).includes('UPDATE articles')
		);
		expect(updateArticleCall).toBeTruthy();
		const sql = String(updateArticleCall?.[0] ?? '');
		expect(sql).toContain('title = $2');
		expect(sql).not.toContain('slug =');
		expect(sql).not.toContain('author =');
		expect(sql).not.toContain('cover_image');
	});

	it('publish marks revision published and does not update article when already published', async () => {
		const { publishArticleRevision } = await import('./revisionAdmin.server');
		const revision = buildRevision({ status: 'published' });
		mockQuery.mockImplementation(async (sql: string) => {
			if (sql.includes('article_revisions') && sql.includes('FOR UPDATE')) {
				return { rows: [revisionRow(revision)] };
			}
			return { rows: [] };
		});

		await expect(publishArticleRevision(REVISION_ID)).rejects.toMatchObject({
			code: 'REVISION_ALREADY_PUBLISHED',
			status: 409,
		});
	});
});

function articleRowFromRevision(revision: ArticleRevisionRecord) {
	const snap = revision.sourceSnapshot as Record<string, unknown>;
	return {
		id: ARTICLE_ID,
		slug: 'chengdu-guide',
		title: snap.title,
		page_title: snap.pageTitle,
		meta_description: snap.metaDescription,
		excerpt: snap.excerpt,
		category: snap.category,
		tags: snap.tags,
		content: snap.content,
		content_blocks: snap.contentBlocks,
		faqs: snap.faqs,
		cta_config: snap.ctaConfig,
		related_journey_ids: [],
		recommended_items: [],
		status: 'active',
		updated_at: new Date(UPDATED_AT),
	};
}

function revisionRow(revision: ArticleRevisionRecord) {
	return {
		id: revision.id,
		article_id: revision.articleId,
		source_slug: revision.sourceSlug,
		source_snapshot: revision.sourceSnapshot,
		proposed_content: revision.proposedContent,
		review_metadata: revision.reviewMetadata,
		source_updated_at: revision.sourceUpdatedAt
			? serializeArticleUpdatedAt(revision.sourceUpdatedAt)
			: null,
		status: revision.status,
		created_by: revision.createdBy,
		created_at: revision.createdAt,
		updated_at: revision.updatedAt,
		published_at: revision.publishedAt,
	};
}
