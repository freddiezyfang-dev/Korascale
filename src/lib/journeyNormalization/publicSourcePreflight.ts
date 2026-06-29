/**
 * PR-J3A legacy vs normalized column comparison for read-only preflight.
 */
import { JOURNEY_TYPE_LABEL_TO_SLUG } from './constants';
import { pickFirstNonEmptyString } from './slug';
import { isJourneyTypeSlug } from './taxonomy';
import { isPublicNormalizedFieldComplete } from './publicNormalizedFields';
import { buildPublicStatusWhereClause } from './status';
import type { JourneyRowLike } from './types';

export type FieldMismatch = {
	id: string;
	slug: string;
	field: string;
	normalized: string;
	legacy: string;
};

function legacyPageTitle(row: JourneyRowLike): string {
	const data = (row.data as Record<string, unknown>) || {};
	return (
		pickFirstNonEmptyString(data.pageTitle) || pickFirstNonEmptyString(row.title) || ''
	);
}

function legacyMetaDescription(row: JourneyRowLike): string {
	const data = (row.data as Record<string, unknown>) || {};
	return (
		pickFirstNonEmptyString(data.metaDescription) ||
		pickFirstNonEmptyString(row.short_description) ||
		''
	);
}

function legacyHeroImageUrl(row: JourneyRowLike): string {
	const data = (row.data as Record<string, unknown>) || {};
	return (
		pickFirstNonEmptyString(data.heroImage) || pickFirstNonEmptyString(row.image) || ''
	);
}

function legacyHeroImageAlt(row: JourneyRowLike): string {
	const data = (row.data as Record<string, unknown>) || {};
	return pickFirstNonEmptyString(data.heroAlt, data.heroImageAlt, data.hero_alt) || '';
}

function legacyJourneyTypeSlug(row: JourneyRowLike): string {
	const data = (row.data as Record<string, unknown>) || {};
	const label = pickFirstNonEmptyString(row.journey_type, data.journeyType);
	const fromLabel = label ? JOURNEY_TYPE_LABEL_TO_SLUG[label] : undefined;
	if (fromLabel) return fromLabel;
	const jsonbLabel = pickFirstNonEmptyString(data.journeyType);
	return jsonbLabel ? JOURNEY_TYPE_LABEL_TO_SLUG[jsonbLabel] ?? '' : '';
}

function columnValue(row: JourneyRowLike, column: string): string {
	return pickFirstNonEmptyString((row as Record<string, unknown>)[column]);
}

/** Visible UI excerpt — short_description chain only (never meta_description). */
export function resolveVisibleExcerpt(row: JourneyRowLike): string {
	const data = (row.data as Record<string, unknown>) || {};
	const overview = data.overview as Record<string, unknown> | undefined;
	const overviewDescription = overview?.description
		? String(overview.description).trim()
		: '';
	return (
		pickFirstNonEmptyString(row.short_description, overviewDescription, row.description) || ''
	);
}

/** SEO metadata description — normalized column only for public cutover. */
export function resolveSeoMetaDescriptionColumn(row: JourneyRowLike): string {
	return pickFirstNonEmptyString(row.meta_description) || '';
}

function compareField(
	row: JourneyRowLike,
	field: string,
	column: string,
	legacy: string
): FieldMismatch | null {
	const normalized = columnValue(row, column);
	if (normalized === legacy) return null;
	return {
		id: String(row.id ?? ''),
		slug: String(row.slug ?? ''),
		field,
		normalized,
		legacy,
	};
}

export type PublicSourcePreflightResult = {
	total: number;
	active: number;
	archived: number;
	activeNormalizedComplete: number;
	pageTitleMismatchIds: string[];
	metaDescriptionMismatchIds: string[];
	heroImageUrlMismatchIds: string[];
	heroImageAltMismatchIds: string[];
	journeyTypeMismatchIds: string[];
	visibleExcerptMismatchIds: string[];
	seoMetaMismatchIds: string[];
	publicFlagIndependent: boolean;
	publicStrictStatusReady: boolean;
	seoCompleteNotUsedForPublic: boolean;
	ready: boolean;
	mismatches: FieldMismatch[];
};

export function evaluatePublicSourcePreflight(rows: JourneyRowLike[]): PublicSourcePreflightResult {
	const activeRows = rows.filter((r) => String(r.status).trim().toLowerCase() === 'active');
	const archivedRows = rows.filter((r) => String(r.status).trim().toLowerCase() === 'archived');
	const mismatches: FieldMismatch[] = [];

	for (const row of activeRows) {
		for (const mismatch of [
			compareField(row, 'page_title', 'page_title', legacyPageTitle(row)),
			compareField(row, 'meta_description', 'meta_description', legacyMetaDescription(row)),
			compareField(row, 'hero_image_url', 'hero_image_url', legacyHeroImageUrl(row)),
			compareField(row, 'hero_image_alt', 'hero_image_alt', legacyHeroImageAlt(row)),
			compareField(
				row,
				'journey_type_slug',
				'journey_type_slug',
				legacyJourneyTypeSlug(row)
			),
		]) {
			if (mismatch) mismatches.push(mismatch);
		}
	}

	const activeNormalizedComplete = activeRows.filter(isPublicNormalizedFieldComplete).length;
	const publicStrictStatusReady = buildPublicStatusWhereClause() === "status = 'active'";

	const visibleExcerptMismatchIds = activeRows
		.filter((row) => {
			const visible = resolveVisibleExcerpt(row);
			const metaFirstVisible =
				pickFirstNonEmptyString(row.meta_description) || visible;
			return visible !== metaFirstVisible;
		})
		.map((row) => String(row.id ?? ''));

	const seoMetaMismatchIds = [
		...new Set(mismatches.filter((m) => m.field === 'meta_description').map((m) => m.id)),
	];

	return {
		total: rows.length,
		active: activeRows.length,
		archived: archivedRows.length,
		activeNormalizedComplete,
		pageTitleMismatchIds: [
			...new Set(mismatches.filter((m) => m.field === 'page_title').map((m) => m.id)),
		],
		metaDescriptionMismatchIds: [
			...new Set(mismatches.filter((m) => m.field === 'meta_description').map((m) => m.id)),
		],
		heroImageUrlMismatchIds: [
			...new Set(mismatches.filter((m) => m.field === 'hero_image_url').map((m) => m.id)),
		],
		heroImageAltMismatchIds: [
			...new Set(mismatches.filter((m) => m.field === 'hero_image_alt').map((m) => m.id)),
		],
		journeyTypeMismatchIds: [
			...new Set(mismatches.filter((m) => m.field === 'journey_type_slug').map((m) => m.id)),
		],
		visibleExcerptMismatchIds,
		seoMetaMismatchIds,
		publicFlagIndependent: true,
		publicStrictStatusReady,
		seoCompleteNotUsedForPublic: true,
		ready:
			activeRows.length === 24 &&
			activeNormalizedComplete === 24 &&
			mismatches.length === 0 &&
			visibleExcerptMismatchIds.length === 0 &&
			seoMetaMismatchIds.length === 0 &&
			publicStrictStatusReady,
		mismatches,
	};
}
