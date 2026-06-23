import { mapArticleToEditableFields, valuesEqual } from './mapArticle';
import { serializeArticleUpdatedAt } from './sourceTimestamp';
import type { ArticleRevisionRecord } from './types';
import type { Article } from '@/types/article';

export type RevisionSourceConflict = {
	hasConflict: boolean;
	reason?: 'article_id' | 'source_slug' | 'updated_at' | 'snapshot';
	message?: string;
};

export function getRevisionSourceUpdatedAtIso(revision: ArticleRevisionRecord): string | null {
	if (!revision.sourceUpdatedAt) return null;
	try {
		return serializeArticleUpdatedAt(revision.sourceUpdatedAt);
	} catch {
		return null;
	}
}

export function detectRevisionSourceConflict(
	revision: ArticleRevisionRecord,
	article: Article
): RevisionSourceConflict {
	if (article.id !== revision.articleId) {
		return {
			hasConflict: true,
			reason: 'article_id',
			message: 'Revision article_id does not match the live article.',
		};
	}

	if (article.slug !== revision.sourceSlug) {
		return {
			hasConflict: true,
			reason: 'source_slug',
			message: 'Revision source_slug does not match the live article slug.',
		};
	}

	const storedUpdatedAt = getRevisionSourceUpdatedAtIso(revision);
	const liveUpdatedAt = serializeArticleUpdatedAt(article.updatedAt);

	if (storedUpdatedAt) {
		if (storedUpdatedAt !== liveUpdatedAt) {
			return {
				hasConflict: true,
				reason: 'updated_at',
				message:
					'The live article was modified after this revision was created. Re-export and submit a new revision.',
			};
		}
		return { hasConflict: false };
	}

	const liveEditable = mapArticleToEditableFields(article);
	const snapshot = revision.sourceSnapshot as Record<string, unknown>;
	if (!valuesEqual(liveEditable, snapshot)) {
		return {
			hasConflict: true,
			reason: 'snapshot',
			message:
				'The live article content no longer matches the revision source snapshot. Re-export and submit a new revision.',
		};
	}

	return { hasConflict: false };
}
