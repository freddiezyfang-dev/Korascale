import {
	JOURNEY_TYPE_LABEL_TO_SLUG,
	type JourneyTypeSlug,
} from './constants';
import { isJourneyTypeSlug } from './taxonomy';
import { pickFirstNonEmptyString } from './slug';
import { isJourneyExpandedColumnsEnabled } from './write';
import type { JourneyRowLike } from './types';

export type JourneyFieldReadSource =
	| 'column'
	| 'jsonb'
	| 'legacy_column'
	| 'fallback'
	| 'missing';

export type ResolvedJourneyField<T> = {
	value: T;
	source: JourneyFieldReadSource;
	path: string;
};

function readExpandedColumn(row: JourneyRowLike, column: string): string {
	if (!isJourneyExpandedColumnsEnabled()) return '';
	return pickFirstNonEmptyString((row as Record<string, unknown>)[column]);
}

/** Read priority: expanded columns only when JOURNEY_NORMALIZATION_COLUMNS=1 and post-025A. */
export function resolvePageTitle(row: JourneyRowLike): ResolvedJourneyField<string> {
	const data = (row.data as Record<string, unknown>) || {};
	const column = readExpandedColumn(row, 'page_title');
	if (column) return { value: column, source: 'column', path: 'page_title' };
	const jsonb = pickFirstNonEmptyString(data.pageTitle);
	if (jsonb) return { value: jsonb, source: 'jsonb', path: 'data.pageTitle' };
	const title = pickFirstNonEmptyString(row.title);
	if (title) return { value: title, source: 'legacy_column', path: 'title' };
	return { value: '', source: 'missing', path: '' };
}

export function resolveMetaDescription(row: JourneyRowLike): ResolvedJourneyField<string> {
	const data = (row.data as Record<string, unknown>) || {};
	const column = readExpandedColumn(row, 'meta_description');
	if (column) return { value: column, source: 'column', path: 'meta_description' };
	const jsonb = pickFirstNonEmptyString(data.metaDescription);
	if (jsonb) return { value: jsonb, source: 'jsonb', path: 'data.metaDescription' };
	const short = pickFirstNonEmptyString(row.short_description);
	if (short) return { value: short, source: 'legacy_column', path: 'short_description' };
	return { value: '', source: 'missing', path: '' };
}

export function resolveHeroImageUrl(row: JourneyRowLike): ResolvedJourneyField<string> {
	const data = (row.data as Record<string, unknown>) || {};
	const column = readExpandedColumn(row, 'hero_image_url');
	if (column) return { value: column, source: 'column', path: 'hero_image_url' };
	const jsonb = pickFirstNonEmptyString(data.heroImage);
	if (jsonb) return { value: jsonb, source: 'jsonb', path: 'data.heroImage' };
	const image = pickFirstNonEmptyString(row.image);
	if (image) return { value: image, source: 'legacy_column', path: 'image' };
	return { value: '', source: 'missing', path: '' };
}

export function resolveHeroImageAlt(row: JourneyRowLike): ResolvedJourneyField<string> {
	const data = (row.data as Record<string, unknown>) || {};
	const column = readExpandedColumn(row, 'hero_image_alt');
	if (column) return { value: column, source: 'column', path: 'hero_image_alt' };
	const jsonb = pickFirstNonEmptyString(data.heroAlt, data.heroImageAlt, data.hero_alt);
	if (jsonb) return { value: jsonb, source: 'jsonb', path: 'data.heroAlt' };
	return { value: '', source: 'missing', path: '' };
}

export function resolveJourneyTypeSlug(row: JourneyRowLike): ResolvedJourneyField<JourneyTypeSlug | ''> {
	const data = (row.data as Record<string, unknown>) || {};
	const column = readExpandedColumn(row, 'journey_type_slug');
	if (column && isJourneyTypeSlug(column)) {
		return { value: column, source: 'column', path: 'journey_type_slug' };
	}
	const label = pickFirstNonEmptyString(row.journey_type, data.journeyType);
	const fromLabel = label ? JOURNEY_TYPE_LABEL_TO_SLUG[label] : undefined;
	if (fromLabel) {
		return { value: fromLabel, source: 'legacy_column', path: 'journey_type' };
	}
	const jsonbLabel = pickFirstNonEmptyString(data.journeyType);
	const fromJsonb = jsonbLabel ? JOURNEY_TYPE_LABEL_TO_SLUG[jsonbLabel] : undefined;
	if (fromJsonb) return { value: fromJsonb, source: 'jsonb', path: 'data.journeyType' };
	return { value: '', source: 'missing', path: '' };
}

export const JOURNEY_SOURCE_OF_TRUTH_MATRIX = {
	pageTitle: {
		read: 'page_title (flag on) → data.pageTitle → title',
		write: 'dual-write: column + data.pageTitle when JOURNEY_NORMALIZATION_COLUMNS=1',
		legacyFallback: 'title',
		futureRemoval: 'data.pageTitle after admin/API cutover',
	},
	metaDescription: {
		read: 'meta_description (flag on) → data.metaDescription → short_description',
		write: 'dual-write when flag on',
		legacyFallback: 'short_description',
		futureRemoval: 'data.metaDescription',
	},
	heroImageUrl: {
		read: 'hero_image_url (flag on) → data.heroImage → image',
		write: 'dual-write when flag on',
		legacyFallback: 'image',
		futureRemoval: 'data.heroImage',
	},
	heroImageAlt: {
		read: 'hero_image_alt (flag on) → data.heroAlt / heroImageAlt',
		write: 'dual-write when flag on',
		legacyFallback: 'none',
		futureRemoval: 'data.heroAlt',
	},
	journeyTypeSlug: {
		read: 'journey_type_slug (flag on) → journey_type label → data.journeyType',
		write: 'dual-write when flag on',
		legacyFallback: 'journey_type display label',
		futureRemoval: 'journey_type label after route cutover',
	},
	price: {
		read: 'price_from + currency + price_basis (flag on) → price + data.*',
		write: 'manual only; never guess currency/basis',
		legacyFallback: 'price column + JSONB',
		futureRemoval: 'data.price currency fields',
	},
	status: {
		read: 'status column (inactive read as archived in UI)',
		write: 'archived (reject new inactive)',
		legacyFallback: 'inactive until 025B',
		futureRemoval: 'inactive vocabulary',
	},
} as const;
