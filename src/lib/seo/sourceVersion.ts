import type { Article } from '@/types/article';

import { getArticleByIdForSeo, getArticleBySlugForSeo } from './articleRevisionQuery.server';
import { serializeArticleUpdatedAt } from './sourceTimestamp';
import type { SeoRevisionSubmission } from './types';

type ArticleSourceVersion = Pick<
	SeoRevisionSubmission,
	'sourceArticleId' | 'sourceSlug' | 'sourceUpdatedAt'
>;

export class SeoRevisionConflictError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'SeoRevisionConflictError';
	}
}

/**
 * Resolve and validate the live article version for both dry-run and submit.
 * Every identity and timestamp check lives here so both modes make the same
 * optimistic-locking decision before any revision write can occur.
 */
export async function validateArticleSourceVersion(
	source: ArticleSourceVersion
): Promise<Article> {
	const article =
		(await getArticleByIdForSeo(source.sourceArticleId)) ??
		(await getArticleBySlugForSeo(source.sourceSlug));

	if (!article) {
		throw new SeoRevisionConflictError(
			`Article not found for slug "${source.sourceSlug}" (id: ${source.sourceArticleId}). Re-export before submitting.`
		);
	}

	if (article.id !== source.sourceArticleId) {
		throw new SeoRevisionConflictError(
			`sourceArticleId mismatch: Revision references ${source.sourceArticleId}, but the database article id is ${article.id}. Re-export before submitting.`
		);
	}

	if (article.slug !== source.sourceSlug) {
		throw new SeoRevisionConflictError(
			`sourceSlug mismatch: Revision references "${source.sourceSlug}", but the database article slug is "${article.slug}". Re-export before submitting.`
		);
	}

	const revisionUpdatedAt = serializeArticleUpdatedAt(source.sourceUpdatedAt);
	const databaseUpdatedAt = serializeArticleUpdatedAt(article.updatedAt);

	if (revisionUpdatedAt !== databaseUpdatedAt) {
		throw new SeoRevisionConflictError(
			`sourceUpdatedAt conflict: Revision timestamp ${revisionUpdatedAt}; database timestamp ${databaseUpdatedAt}. Re-export before submitting.`
		);
	}

	return article;
}
