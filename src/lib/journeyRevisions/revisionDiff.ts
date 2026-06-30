import type { JourneyRevisionSnapshot } from './types';

export type JourneyRevisionFieldChange = {
	field: string;
	before: unknown;
	after: unknown;
};

export const JOURNEY_REVISION_DIFF_SCALAR_KEYS = [
	'title',
	'slug',
	'status',
	'short_description',
	'description',
	'page_title',
	'meta_description',
	'hero_image_url',
	'hero_image_alt',
	'journey_type_slug',
	'journey_type',
	'category',
	'region',
	'place',
	'city',
	'location',
	'duration',
	'difficulty',
	'max_participants',
	'min_participants',
	'featured',
	'display_order',
] as const;

export const JOURNEY_REVISION_DIFF_DATA_KEYS = [
	'itinerary',
	'gallery',
	'faqs',
	'faq',
	'relatedTrips',
	'relatedJourneyIds',
	'relatedArticles',
	'overview',
] as const;

function valuesEqual(a: unknown, b: unknown): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

function previewValue(value: unknown): string {
	if (value == null || value === '') return '(empty)';
	if (typeof value === 'string') {
		return value.length > 80 ? `"${value.slice(0, 77)}..."` : `"${value}"`;
	}
	if (Array.isArray(value)) return `[${value.length} items]`;
	if (typeof value === 'object') {
		const serialized = JSON.stringify(value);
		return serialized.length > 80 ? `${serialized.slice(0, 77)}...` : serialized;
	}
	return String(value);
}

export function computeJourneyRevisionFieldChanges(
	before: JourneyRevisionSnapshot | null,
	after: JourneyRevisionSnapshot
): JourneyRevisionFieldChange[] {
	const changes: JourneyRevisionFieldChange[] = [];

	for (const key of JOURNEY_REVISION_DIFF_SCALAR_KEYS) {
		const beforeValue = before ? before[key as keyof JourneyRevisionSnapshot] : null;
		const afterValue = after[key as keyof JourneyRevisionSnapshot];
		if (!valuesEqual(beforeValue, afterValue)) {
			changes.push({ field: key, before: beforeValue, after: afterValue });
		}
	}

	for (const key of JOURNEY_REVISION_DIFF_DATA_KEYS) {
		const beforeValue = before?.data?.[key];
		const afterValue = after.data?.[key];
		if (!valuesEqual(beforeValue, afterValue)) {
			changes.push({ field: `data.${key}`, before: beforeValue, after: afterValue });
		}
	}

	if (!before) {
		changes.unshift({
			field: 'operation',
			before: null,
			after: 'create',
		});
	}

	return changes;
}

export function formatJourneyRevisionChangeSummary(changes: JourneyRevisionFieldChange[]): string[] {
	return changes.map(
		(change) =>
			`${change.field}: ${previewValue(change.before)} → ${previewValue(change.after)}`
	);
}
