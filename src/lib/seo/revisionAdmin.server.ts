/**
 * Admin article revision review, edit, reject, and publish (server-only).
 */
import type { PoolClient } from 'pg';

import { query, withTransaction } from '@/lib/db';

import {
	getArticleByIdForSeo,
	getArticleRevisionById,
	mapArticleRevisionRow,
	type ArticleRevisionRow,
} from './articleRevisionQuery.server';
import { mapDbRowToArticle } from './mapArticle';
import { mapProposedToArticleColumns } from './mapProposedToArticle';
import { detectRevisionSourceConflict } from './revisionConflict';
import { countUnresolvedFactCheckItems } from './revisionDiff';
import { assertProposedContentIsPublishableOnly } from './reviewMetadata';
import {
	validateReviewMetadataUpdate,
	validateSeoEditableFields,
} from './schema';
import type {
	ArticleRevisionRecord,
	ArticleRevisionStatus,
	SeoEditableArticleFields,
	SeoRevisionReviewMetadata,
} from './types';

export class RevisionAdminError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly status: number
	) {
		super(message);
		this.name = 'RevisionAdminError';
	}
}

export type RevisionListItem = {
	id: string;
	articleId: string;
	sourceSlug: string;
	status: ArticleRevisionStatus;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	changeSummary: string;
	unresolvedFactCheckCount: number;
	articleTitle: string | null;
	hasSourceConflict: boolean;
};

export type RevisionDetail = {
	revision: ArticleRevisionRecord;
	article: {
		id: string;
		slug: string;
		title: string;
		updatedAt: string;
		status: string;
	};
	proposedContent: SeoEditableArticleFields;
	sourceSnapshot: SeoEditableArticleFields;
	reviewMetadata: SeoRevisionReviewMetadata;
	hasSourceConflict: boolean;
	sourceConflictMessage?: string;
	unresolvedFactCheckCount: number;
};

export type ListRevisionsParams = {
	status?: ArticleRevisionStatus;
	articleId?: string;
	slug?: string;
	sort?: 'createdAt' | 'createdAtDesc';
};

const FORBIDDEN_PUT_KEYS = new Set([
	'id',
	'revisionId',
	'articleId',
	'article_id',
	'sourceSlug',
	'sourceUpdatedAt',
	'source_updated_at',
	'source_snapshot',
	'sourceSnapshot',
	'created_by',
	'createdBy',
	'created_at',
	'createdAt',
	'status',
	'published_at',
	'publishedAt',
	'role',
	'userId',
]);

async function assertRelatedIdsExist(
	client: PoolClient | null,
	relatedArticles: string[],
	relatedJourneys: string[]
): Promise<void> {
	const run = client
		? (text: string, params: unknown[]) => client.query(text, params)
		: (text: string, params: unknown[]) => query(text, params);

	for (const id of relatedArticles) {
		const { rows } = await run('SELECT 1 FROM articles WHERE id = $1 LIMIT 1', [id]);
		if (rows.length === 0) {
			throw new RevisionAdminError(
				`relatedArticles contains unknown article id: ${id}`,
				'INVALID_RELATED_ARTICLE',
				400
			);
		}
	}

	for (const id of relatedJourneys) {
		const { rows } = await run('SELECT 1 FROM journeys WHERE id = $1 LIMIT 1', [id]);
		if (rows.length === 0) {
			throw new RevisionAdminError(
				`relatedJourneys contains unknown journey id: ${id}`,
				'INVALID_RELATED_JOURNEY',
				400
			);
		}
	}
}

function toEditableSnapshot(snapshot: Record<string, unknown>): SeoEditableArticleFields {
	return snapshot as unknown as SeoEditableArticleFields;
}

function buildRevisionDetail(
	revision: ArticleRevisionRecord,
	article: NonNullable<Awaited<ReturnType<typeof getArticleByIdForSeo>>>
): RevisionDetail {
	const conflict = detectRevisionSourceConflict(revision, article);
	return {
		revision,
		article: {
			id: article.id,
			slug: article.slug,
			title: article.title,
			updatedAt: article.updatedAt.toISOString(),
			status: article.status,
		},
		proposedContent: toEditableSnapshot(revision.proposedContent),
		sourceSnapshot: toEditableSnapshot(revision.sourceSnapshot),
		reviewMetadata: revision.reviewMetadata,
		hasSourceConflict: conflict.hasConflict,
		sourceConflictMessage: conflict.message,
		unresolvedFactCheckCount: countUnresolvedFactCheckItems(revision.reviewMetadata.factCheckItems),
	};
}

export async function listArticleRevisions(params: ListRevisionsParams = {}): Promise<RevisionListItem[]> {
	const status = params.status ?? 'pending';
	const conditions = ['ar.status = $1'];
	const values: unknown[] = [status];
	let paramIndex = 2;

	if (params.articleId) {
		conditions.push(`ar.article_id = $${paramIndex++}`);
		values.push(params.articleId);
	}

	if (params.slug) {
		conditions.push(`ar.source_slug = $${paramIndex++}`);
		values.push(params.slug);
	}

	const order =
		params.sort === 'createdAtDesc' ? 'ar.created_at DESC' : 'ar.created_at ASC';

	const { rows } = await query<
		ArticleRevisionRow & { article_title: string | null; article_updated_at: Date }
	>(
		`
    SELECT ar.*, a.title AS article_title, a.updated_at AS article_updated_at
    FROM article_revisions ar
    LEFT JOIN articles a ON a.id = ar.article_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${order}
  `,
		values
	);

	return Promise.all(
		rows.map(async (row) => {
			const revision = mapArticleRevisionRow(row);
			const article = await getArticleByIdForSeo(revision.articleId);
			const conflict = article
				? detectRevisionSourceConflict(revision, article)
				: { hasConflict: true };

			return {
				id: revision.id,
				articleId: revision.articleId,
				sourceSlug: revision.sourceSlug,
				status: revision.status,
				createdBy: revision.createdBy,
				createdAt: revision.createdAt.toISOString(),
				updatedAt: revision.updatedAt.toISOString(),
				changeSummary: revision.reviewMetadata.changeSummary,
				unresolvedFactCheckCount: countUnresolvedFactCheckItems(
					revision.reviewMetadata.factCheckItems
				),
				articleTitle: row.article_title,
				hasSourceConflict: conflict.hasConflict,
			};
		})
	);
}

export async function getArticleRevisionDetail(id: string): Promise<RevisionDetail | null> {
	const revision = await getArticleRevisionById(id);
	if (!revision) return null;

	const article = await getArticleByIdForSeo(revision.articleId);
	if (!article) {
		throw new RevisionAdminError('Source article no longer exists.', 'ARTICLE_NOT_FOUND', 404);
	}

	return buildRevisionDetail(revision, article);
}

export async function updatePendingArticleRevision(
	id: string,
	body: Record<string, unknown>
): Promise<RevisionDetail> {
	for (const key of Object.keys(body)) {
		if (FORBIDDEN_PUT_KEYS.has(key)) {
			throw new RevisionAdminError(`Field "${key}" cannot be modified.`, 'FORBIDDEN_FIELD', 400);
		}
	}

	const revision = await getArticleRevisionById(id);
	if (!revision) {
		throw new RevisionAdminError('Revision not found.', 'NOT_FOUND', 404);
	}
	if (revision.status !== 'pending') {
		throw new RevisionAdminError(
			'Only pending revisions can be edited.',
			'REVISION_NOT_PENDING',
			409
		);
	}

	const proposedInput: Record<string, unknown> = {};
	const reviewInput: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(body)) {
		if (key === 'changeSummary' || key === 'factCheckItems') {
			reviewInput[key] = value;
		} else {
			proposedInput[key] = value;
		}
	}

	const mergedProposed = { ...revision.proposedContent, ...proposedInput };
	const proposedValidation = validateSeoEditableFields(mergedProposed);
	if (!proposedValidation.success) {
		throw new RevisionAdminError('Invalid proposed content.', 'VALIDATION_ERROR', 400);
	}

	const mergedReview = {
		...revision.reviewMetadata,
		...reviewInput,
	};
	const reviewValidation = validateReviewMetadataUpdate(mergedReview);
	if (!reviewValidation.success) {
		throw new RevisionAdminError('Invalid review metadata.', 'VALIDATION_ERROR', 400);
	}

	assertProposedContentIsPublishableOnly(proposedValidation.data as unknown as Record<string, unknown>);

	await query(
		`
    UPDATE article_revisions
    SET proposed_content = $2::jsonb,
        review_metadata = $3::jsonb,
        updated_at = NOW()
    WHERE id = $1 AND status = 'pending'
  `,
		[
			id,
			JSON.stringify(proposedValidation.data),
			JSON.stringify(reviewValidation.data),
		]
	);

	const updated = await getArticleRevisionDetail(id);
	if (!updated) {
		throw new RevisionAdminError('Revision not found after update.', 'NOT_FOUND', 404);
	}
	return updated;
}

export async function rejectArticleRevision(id: string): Promise<ArticleRevisionRecord> {
	const revision = await getArticleRevisionById(id);
	if (!revision) {
		throw new RevisionAdminError('Revision not found.', 'NOT_FOUND', 404);
	}

	if (revision.status === 'rejected') {
		return revision;
	}

	if (revision.status !== 'pending') {
		throw new RevisionAdminError(
			'Only pending revisions can be rejected.',
			'REVISION_NOT_PENDING',
			409
		);
	}

	await query(
		`
    UPDATE article_revisions
    SET status = 'rejected', updated_at = NOW()
    WHERE id = $1 AND status = 'pending'
  `,
		[id]
	);

	const updated = await getArticleRevisionById(id);
	if (!updated) {
		throw new RevisionAdminError('Revision not found after reject.', 'NOT_FOUND', 404);
	}
	return updated;
}

export async function publishArticleRevision(id: string): Promise<RevisionDetail> {
	await withTransaction(async (client) => {
		const { rows: revisionRows } = await client.query<ArticleRevisionRow>(
			`SELECT * FROM article_revisions WHERE id = $1 FOR UPDATE`,
			[id]
		);
		if (revisionRows.length === 0) {
			throw new RevisionAdminError('Revision not found.', 'NOT_FOUND', 404);
		}

		const revision = mapArticleRevisionRow(revisionRows[0]);
		if (revision.status === 'published') {
			throw new RevisionAdminError(
				'Revision is already published.',
				'REVISION_ALREADY_PUBLISHED',
				409
			);
		}
		if (revision.status !== 'pending') {
			throw new RevisionAdminError(
				'Only pending revisions can be published.',
				'REVISION_NOT_PENDING',
				409
			);
		}

		const { rows: articleRows } = await client.query(
			`SELECT * FROM articles WHERE id = $1 FOR UPDATE`,
			[revision.articleId]
		);
		if (articleRows.length === 0) {
			throw new RevisionAdminError('Source article no longer exists.', 'ARTICLE_NOT_FOUND', 404);
		}

		const article = mapDbRowToArticle(articleRows[0] as Record<string, unknown>);
		const conflict = detectRevisionSourceConflict(revision, article);
		if (conflict.hasConflict) {
			throw new RevisionAdminError(
				conflict.message ?? 'Revision source conflict.',
				'REVISION_SOURCE_CONFLICT',
				409
			);
		}

		const unresolved = countUnresolvedFactCheckItems(revision.reviewMetadata.factCheckItems);
		if (unresolved > 0) {
			throw new RevisionAdminError(
				`${unresolved} unresolved fact check item(s) must be resolved before publishing.`,
				'UNRESOLVED_FACT_CHECKS',
				400
			);
		}

		const proposedValidation = validateSeoEditableFields(revision.proposedContent);
		if (!proposedValidation.success) {
			throw new RevisionAdminError('Invalid proposed content.', 'VALIDATION_ERROR', 400);
		}

		await assertRelatedIdsExist(
			client,
			proposedValidation.data.relatedArticles,
			proposedValidation.data.relatedJourneys
		);

		const columns = mapProposedToArticleColumns(proposedValidation.data);

		await client.query(
			`
      UPDATE articles
      SET title = $2,
          page_title = $3,
          meta_description = $4,
          excerpt = $5,
          category = $6,
          tags = $7::jsonb,
          content = $8,
          content_blocks = $9::jsonb,
          faqs = $10::jsonb,
          cta_config = $11::jsonb,
          related_journey_ids = $12::jsonb,
          recommended_items = $13::jsonb,
          updated_at = NOW()
      WHERE id = $1
    `,
			[
				revision.articleId,
				columns.title,
				columns.page_title,
				columns.meta_description,
				columns.excerpt,
				columns.category,
				columns.tags,
				columns.content,
				columns.content_blocks,
				columns.faqs,
				columns.cta_config,
				columns.related_journey_ids,
				columns.recommended_items,
			]
		);

		const { rowCount: publishCount } = await client.query(
			`
      UPDATE article_revisions
      SET status = 'published', published_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND status = 'pending'
    `,
			[id]
		);
		if (publishCount === 0) {
			throw new RevisionAdminError(
				'Revision is no longer pending.',
				'REVISION_NOT_PENDING',
				409
			);
		}

		await client.query(
			`
      UPDATE article_revisions
      SET status = 'superseded', updated_at = NOW()
      WHERE article_id = $1 AND status = 'pending' AND id <> $2
    `,
			[revision.articleId, id]
		);
	});

	const detail = await getArticleRevisionDetail(id);
	if (!detail) {
		throw new RevisionAdminError('Revision not found after publish.', 'NOT_FOUND', 404);
	}
	return detail;
}

export async function countPendingRevisionsByArticle(): Promise<Record<string, number>> {
	const { rows } = await query<{ article_id: string; count: string }>(
		`
    SELECT article_id, COUNT(*)::text AS count
    FROM article_revisions
    WHERE status = 'pending'
    GROUP BY article_id
  `
	);

	return rows.reduce<Record<string, number>>((acc, row) => {
		acc[String(row.article_id)] = Number(row.count);
		return acc;
	}, {});
}
