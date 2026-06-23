import type { SeoEditableArticleFields, SeoFieldChange } from './types';
import { stableSerialize, valuesEqual } from './mapArticle';

export const SEO_EDITABLE_FIELD_KEYS: (keyof SeoEditableArticleFields)[] = [
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
];

export function computeFieldChanges(
	before: SeoEditableArticleFields,
	after: SeoEditableArticleFields
): SeoFieldChange[] {
	const changes: SeoFieldChange[] = [];
	for (const field of SEO_EDITABLE_FIELD_KEYS) {
		const beforeValue = before[field];
		const afterValue = after[field];
		if (!valuesEqual(beforeValue, afterValue)) {
			changes.push({ field, before: beforeValue, after: afterValue });
		}
	}
	return changes;
}

export function formatFieldChangeSummary(changes: SeoFieldChange[]): string[] {
	return changes.map((change) => {
		const beforePreview = previewValue(change.before);
		const afterPreview = previewValue(change.after);
		return `${change.field}: ${beforePreview} → ${afterPreview}`;
	});
}

function previewValue(value: unknown): string {
	if (value == null) return '(empty)';
	if (typeof value === 'string') {
		return value.length > 80 ? `"${value.slice(0, 77)}..."` : `"${value}"`;
	}
	if (Array.isArray(value)) {
		return `[${value.length} items]`;
	}
	const serialized = stableSerialize(value);
	return serialized.length > 80 ? `${serialized.slice(0, 77)}...` : serialized;
}

export function countUnresolvedFactCheckItems(
	items: { resolved: boolean }[] | undefined
): number {
	return items?.filter((item) => !item.resolved).length ?? 0;
}
