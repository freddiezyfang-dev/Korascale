import { JOURNEY_TYPE_LABELS, type JourneyTypeSlug } from './constants';
import { isJourneyTypeSlug } from './taxonomy';
import { pickFirstNonEmptyString } from './slug';
import type { JourneyRowLike } from './types';

export type PublicNormalizedFieldName =
	| 'page_title'
	| 'meta_description'
	| 'hero_image_url'
	| 'hero_image_alt'
	| 'journey_type_slug';

export const PUBLIC_NORMALIZED_JOURNEY_COLUMNS = [
	'page_title',
	'meta_description',
	'hero_image_url',
	'hero_image_alt',
	'journey_type_slug',
] as const;

export type ResolvedPublicNormalizedField<T> = {
	value: T;
	source: 'column';
	path: string;
};

/** Thrown when an active public Journey row is missing a required normalized column value. */
export class JourneyPublicNormalizedFieldIntegrityError extends Error {
	readonly code = 'JOURNEY_PUBLIC_NORMALIZED_FIELD_INTEGRITY';

	constructor(
		readonly journeyId: string,
		readonly slug: string,
		readonly field: PublicNormalizedFieldName
	) {
		super(
			`[Journey public data integrity] active journey missing normalized column ${field} (id=${journeyId}, slug=${slug})`
		);
		this.name = 'JourneyPublicNormalizedFieldIntegrityError';
	}

	toDiagnostic(): Record<string, string> {
		return {
			code: this.code,
			journeyId: this.journeyId,
			slug: this.slug,
			field: this.field,
			message: this.message,
		};
	}
}

function readNormalizedColumn(row: JourneyRowLike, column: PublicNormalizedFieldName): string {
	return pickFirstNonEmptyString((row as Record<string, unknown>)[column]);
}

function assertActivePublicColumn(
	row: JourneyRowLike,
	column: PublicNormalizedFieldName,
	value: string
): void {
	if (value) return;
	const status = String(row.status ?? '').trim().toLowerCase();
	if (status !== 'active') return;
	const journeyId = String(row.id ?? 'unknown');
	const slug = String(row.slug ?? 'unknown');
	const error = new JourneyPublicNormalizedFieldIntegrityError(journeyId, slug, column);
	console.error('[Journey public data integrity]', error.toDiagnostic());
	throw error;
}

export function resolvePublicNormalizedPageTitle(
	row: JourneyRowLike
): ResolvedPublicNormalizedField<string> {
	const value = readNormalizedColumn(row, 'page_title');
	assertActivePublicColumn(row, 'page_title', value);
	return { value, source: 'column', path: 'page_title' };
}

export function resolvePublicNormalizedMetaDescription(
	row: JourneyRowLike
): ResolvedPublicNormalizedField<string> {
	const value = readNormalizedColumn(row, 'meta_description');
	assertActivePublicColumn(row, 'meta_description', value);
	return { value, source: 'column', path: 'meta_description' };
}

export function resolvePublicNormalizedHeroImageUrl(
	row: JourneyRowLike
): ResolvedPublicNormalizedField<string> {
	const value = readNormalizedColumn(row, 'hero_image_url');
	assertActivePublicColumn(row, 'hero_image_url', value);
	return { value, source: 'column', path: 'hero_image_url' };
}

export function resolvePublicNormalizedHeroImageAlt(
	row: JourneyRowLike
): ResolvedPublicNormalizedField<string> {
	const value = readNormalizedColumn(row, 'hero_image_alt');
	assertActivePublicColumn(row, 'hero_image_alt', value);
	return { value, source: 'column', path: 'hero_image_alt' };
}

export function resolvePublicNormalizedJourneyTypeSlug(
	row: JourneyRowLike
): ResolvedPublicNormalizedField<JourneyTypeSlug | ''> {
	const raw = readNormalizedColumn(row, 'journey_type_slug');
	if (raw && isJourneyTypeSlug(raw)) {
		return { value: raw, source: 'column', path: 'journey_type_slug' };
	}
	assertActivePublicColumn(row, 'journey_type_slug', '');
	return { value: '', source: 'column', path: 'journey_type_slug' };
}

export function resolvePublicNormalizedJourneyTypeLabel(row: JourneyRowLike): string {
	const slug = resolvePublicNormalizedJourneyTypeSlug(row).value;
	if (!slug) return '';
	return JOURNEY_TYPE_LABELS[slug] ?? '';
}

export function isPublicNormalizedFieldComplete(row: JourneyRowLike): boolean {
	for (const column of PUBLIC_NORMALIZED_JOURNEY_COLUMNS) {
		if (column === 'journey_type_slug') {
			const raw = readNormalizedColumn(row, column);
			if (!raw || !isJourneyTypeSlug(raw)) return false;
			continue;
		}
		if (!readNormalizedColumn(row, column)) return false;
	}
	return true;
}
