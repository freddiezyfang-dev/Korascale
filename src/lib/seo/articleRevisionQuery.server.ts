/**
 * Server-only article revision queries. Do not import from Client Components.
 */
import { query } from '@/lib/db';

import { mapDbRowToArticle } from './mapArticle';
import { serializeArticleUpdatedAt } from './sourceTimestamp';
import { assertProposedContentIsPublishableOnly, normalizeReviewMetadata } from './reviewMetadata';
import type { ArticleRevisionRecord, ArticleRevisionStatus } from './types';

export type ArticleRevisionRow = {
	id: string;
	article_id: string;
	source_slug: string;
	source_snapshot: Record<string, unknown>;
	proposed_content: Record<string, unknown>;
	review_metadata?: Record<string, unknown> | null;
	source_updated_at?: Date | string | null;
	status: ArticleRevisionStatus;
	created_by: string;
	created_at: Date;
	updated_at: Date;
	published_at: Date | null;
};

export function mapArticleRevisionRow(row: ArticleRevisionRow): ArticleRevisionRecord {
	return {
		id: String(row.id),
		articleId: String(row.article_id),
		sourceSlug: String(row.source_slug),
		sourceSnapshot: row.source_snapshot ?? {},
		proposedContent: row.proposed_content ?? {},
		reviewMetadata: normalizeReviewMetadata(row.review_metadata),
		sourceUpdatedAt: row.source_updated_at
			? new Date(serializeArticleUpdatedAt(row.source_updated_at))
			: null,
		status: row.status,
		createdBy: String(row.created_by),
		createdAt: new Date(String(row.created_at)),
		updatedAt: new Date(String(row.updated_at)),
		publishedAt: row.published_at ? new Date(String(row.published_at)) : null,
	};
}

export async function getArticleBySlugForSeo(slug: string) {
	const trimmed = decodeURIComponent(slug).trim();
	if (!trimmed) return null;

	const { rows } = await query(
		`
    SELECT *
    FROM articles
    WHERE slug = $1
    LIMIT 1
  `,
		[trimmed]
	);

	if (rows.length === 0) return null;
	return mapDbRowToArticle(rows[0] as Record<string, unknown>);
}

export async function getArticleByIdForSeo(id: string) {
	const { rows } = await query(
		`
    SELECT *
    FROM articles
    WHERE id = $1
    LIMIT 1
  `,
		[id]
	);

	if (rows.length === 0) return null;
	return mapDbRowToArticle(rows[0] as Record<string, unknown>);
}

export async function getArticleRevisionById(id: string): Promise<ArticleRevisionRecord | null> {
	const { rows } = await query<ArticleRevisionRow>(
		`
    SELECT *
    FROM article_revisions
    WHERE id = $1
    LIMIT 1
  `,
		[id]
	);

	if (rows.length === 0) return null;
	return mapArticleRevisionRow(rows[0]);
}

export async function getPendingRevisionsForArticle(articleId: string): Promise<ArticleRevisionRecord[]> {
	const { rows } = await query<ArticleRevisionRow>(
		`
    SELECT *
    FROM article_revisions
    WHERE article_id = $1 AND status = 'pending'
    ORDER BY created_at ASC
  `,
		[articleId]
	);

	return rows.map((row) => mapArticleRevisionRow(row));
}

export async function supersedePendingRevisions(
	articleId: string,
	createdBy: string
): Promise<string[]> {
	const pending = await getPendingRevisionsForArticle(articleId);
	if (pending.length === 0) return [];

	const ids = pending.map((row) => row.id);
	await query(
		`
    UPDATE article_revisions
    SET status = 'superseded', updated_at = NOW()
    WHERE article_id = $1 AND status = 'pending'
  `,
		[articleId]
	);

	console.log(
		`[seo:submit-revision] Superseded ${ids.length} pending revision(s) for article ${articleId} by ${createdBy}`
	);
	return ids;
}

export async function insertArticleRevision(params: {
	articleId: string;
	sourceSlug: string;
	sourceSnapshot: Record<string, unknown>;
	proposedContent: Record<string, unknown>;
	reviewMetadata: Record<string, unknown>;
	sourceUpdatedAt: string;
	createdBy: string;
}): Promise<string> {
	assertProposedContentIsPublishableOnly(params.proposedContent);

	const { rows } = await query<{ id: string }>(
		`
    INSERT INTO article_revisions (
      article_id,
      source_slug,
      source_snapshot,
      proposed_content,
      review_metadata,
      source_updated_at,
      status,
      created_by
    ) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6::timestamp, 'pending', $7)
    RETURNING id
  `,
		[
			params.articleId,
			params.sourceSlug,
			JSON.stringify(params.sourceSnapshot),
			JSON.stringify(params.proposedContent),
			JSON.stringify(params.reviewMetadata),
			new Date(params.sourceUpdatedAt),
			params.createdBy,
		]
	);

	return String(rows[0]?.id ?? '');
}

export async function articleRevisionsTableExists(): Promise<boolean> {
	const { rows } = await query<{ exists: boolean }>(
		`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'article_revisions'
    ) AS exists
  `
	);
	return rows[0]?.exists === true;
}
