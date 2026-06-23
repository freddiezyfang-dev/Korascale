import type { SeoFactCheckItem, SeoRevisionReviewMetadata } from './types';

export const SEO_PROPOSED_CONTENT_KEYS = [
	'title',
	'pageTitle',
	'metaDescription',
	'excerpt',
	'category',
	'tags',
	'content',
	'contentBlocks',
	'faqs',
	'ctaConfig',
	'relatedArticles',
	'relatedJourneys',
	'recommendedSlug',
] as const;

export const SEO_REVIEW_METADATA_KEYS = ['changeSummary', 'factCheckItems'] as const;

const REVIEW_METADATA_FORBIDDEN_KEYS = new Set([
	...SEO_REVIEW_METADATA_KEYS,
	'sourceArticleId',
	'sourceSlug',
	'sourceUpdatedAt',
]);

function normalizeFactCheckItem(raw: unknown): SeoFactCheckItem | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const record = raw as Record<string, unknown>;
	if (typeof record.item !== 'string' || typeof record.resolved !== 'boolean') {
		return null;
	}
	const item = record.item.trim();
	if (!item) return null;
	return {
		item,
		resolved: record.resolved,
		...(record.note != null && String(record.note).trim()
			? { note: String(record.note).trim() }
			: {}),
	};
}

/** Safe read path for legacy rows with review_metadata = {}. */
export function normalizeReviewMetadata(raw: unknown): SeoRevisionReviewMetadata {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return { changeSummary: '', factCheckItems: [] };
	}

	const record = raw as Record<string, unknown>;
	const changeSummary =
		typeof record.changeSummary === 'string' ? record.changeSummary : '';
	const factCheckItems = Array.isArray(record.factCheckItems)
		? record.factCheckItems
				.map(normalizeFactCheckItem)
				.filter((item): item is SeoFactCheckItem => item != null)
		: [];

	return { changeSummary, factCheckItems };
}

export function assertProposedContentIsPublishableOnly(
	proposedContent: Record<string, unknown>
): void {
	for (const key of Object.keys(proposedContent)) {
		if (REVIEW_METADATA_FORBIDDEN_KEYS.has(key)) {
			throw new Error(`proposed_content must not contain review field "${key}".`);
		}
	}
}
