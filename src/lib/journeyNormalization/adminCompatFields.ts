import {
	JOURNEY_TYPE_LABEL_TO_SLUG,
	type JourneyTypeSlug,
} from './constants';
import { isJourneyTypeSlug } from './taxonomy';
import { pickFirstNonEmptyString } from './slug';
import { isJourneyExpandedColumnsEnabled } from './write';
import type { JourneyRowLike } from './types';

export type AdminCompatFieldReadSource =
	| 'column'
	| 'jsonb'
	| 'legacy_column'
	| 'missing';

export type ResolvedAdminCompatField<T> = {
	value: T;
	source: AdminCompatFieldReadSource;
	path: string;
};

function readExpandedColumn(row: JourneyRowLike, column: string): string {
	if (!isJourneyExpandedColumnsEnabled()) return '';
	return pickFirstNonEmptyString((row as Record<string, unknown>)[column]);
}

/** Admin/API: column first, then legacy JSONB / relational fallbacks. */
export function resolveAdminCompatPageTitle(row: JourneyRowLike): ResolvedAdminCompatField<string> {
	const data = (row.data as Record<string, unknown>) || {};
	const column = readExpandedColumn(row, 'page_title');
	if (column) return { value: column, source: 'column', path: 'page_title' };
	const jsonb = pickFirstNonEmptyString(data.pageTitle);
	if (jsonb) return { value: jsonb, source: 'jsonb', path: 'data.pageTitle' };
	const title = pickFirstNonEmptyString(row.title);
	if (title) return { value: title, source: 'legacy_column', path: 'title' };
	return { value: '', source: 'missing', path: '' };
}

export function resolveAdminCompatMetaDescription(
	row: JourneyRowLike
): ResolvedAdminCompatField<string> {
	const data = (row.data as Record<string, unknown>) || {};
	const column = readExpandedColumn(row, 'meta_description');
	if (column) return { value: column, source: 'column', path: 'meta_description' };
	const jsonb = pickFirstNonEmptyString(data.metaDescription);
	if (jsonb) return { value: jsonb, source: 'jsonb', path: 'data.metaDescription' };
	const short = pickFirstNonEmptyString(row.short_description);
	if (short) return { value: short, source: 'legacy_column', path: 'short_description' };
	return { value: '', source: 'missing', path: '' };
}

export function resolveAdminCompatHeroImageUrl(row: JourneyRowLike): ResolvedAdminCompatField<string> {
	const data = (row.data as Record<string, unknown>) || {};
	const column = readExpandedColumn(row, 'hero_image_url');
	if (column) return { value: column, source: 'column', path: 'hero_image_url' };
	const jsonb = pickFirstNonEmptyString(data.heroImage);
	if (jsonb) return { value: jsonb, source: 'jsonb', path: 'data.heroImage' };
	const image = pickFirstNonEmptyString(row.image);
	if (image) return { value: image, source: 'legacy_column', path: 'image' };
	return { value: '', source: 'missing', path: '' };
}

export function resolveAdminCompatHeroImageAlt(row: JourneyRowLike): ResolvedAdminCompatField<string> {
	const data = (row.data as Record<string, unknown>) || {};
	const column = readExpandedColumn(row, 'hero_image_alt');
	if (column) return { value: column, source: 'column', path: 'hero_image_alt' };
	const jsonb = pickFirstNonEmptyString(data.heroAlt, data.heroImageAlt, data.hero_alt);
	if (jsonb) return { value: jsonb, source: 'jsonb', path: 'data.heroAlt' };
	return { value: '', source: 'missing', path: '' };
}

export function resolveAdminCompatJourneyTypeSlug(
	row: JourneyRowLike
): ResolvedAdminCompatField<JourneyTypeSlug | ''> {
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
