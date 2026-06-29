import { isValidCanonicalSlug, normalizeJourneySlug } from './slug';
import {
	resolveAdminCompatHeroImageAlt,
	resolveAdminCompatHeroImageUrl,
	resolveAdminCompatMetaDescription,
	resolveAdminCompatPageTitle,
} from './adminCompatFields';
import { pickFirstNonEmptyString } from './slug';
import type { JourneyRowLike, SeoCompletenessEvaluation, SeoFieldSources } from './types';

export function extractJourneyData(row: JourneyRowLike): Record<string, unknown> {
	return row.data && typeof row.data === 'object'
		? (row.data as Record<string, unknown>)
		: {};
}

export function extractSeoFieldSources(row: JourneyRowLike): SeoFieldSources {
	const data = extractJourneyData(row);
	const pageTitle = resolveAdminCompatPageTitle(row);
	const meta = resolveAdminCompatMetaDescription(row);
	const heroUrl = resolveAdminCompatHeroImageUrl(row);
	const heroAlt = resolveAdminCompatHeroImageAlt(row);
	const name = pickFirstNonEmptyString(row.title, data.name, pageTitle.value);
	const excerpt = pickFirstNonEmptyString(
		row.short_description,
		data.shortDescription,
		data.excerpt
	);

	return {
		name: {
			value: name,
			source: row.title ? 'column:title' : data.name ? 'jsonb:name' : 'fallback',
		},
		pageTitle: {
			value: pageTitle.value,
			source: pageTitle.path || 'fallback',
		},
		metaDescription: {
			value: meta.value,
			source: meta.path || 'fallback',
		},
		excerpt: {
			value: excerpt,
			source: row.short_description
				? 'column:short_description'
				: data.shortDescription
					? 'jsonb:shortDescription'
					: 'fallback',
		},
		heroImageUrl: {
			value: heroUrl.value,
			source: heroUrl.path || 'fallback',
		},
		heroImageAlt: {
			value: heroAlt.value,
			source: heroAlt.path || 'missing',
		},
	};
}

/**
 * Admin quality marker — evaluates SEO field completeness only.
 * Does NOT gate published state, sitemap, list, or detail 200 responses.
 */
export function evaluateJourneySeoCompleteness(
	row: JourneyRowLike
): SeoCompletenessEvaluation {
	const fields = extractSeoFieldSources(row);
	const slug = normalizeJourneySlug(row.slug);
	const missing: string[] = [];

	if (!fields.name.value) missing.push('name');
	if (!fields.pageTitle.value) missing.push('page_title');
	if (!fields.metaDescription.value) missing.push('meta_description');
	if (!fields.excerpt.value) missing.push('excerpt');
	if (!fields.heroImageUrl.value) missing.push('hero_image');
	if (!fields.heroImageAlt.value) missing.push('hero_alt');
	if (!slug || !isValidCanonicalSlug(slug)) missing.push('slug_invalid');

	return {
		complete: missing.length === 0,
		missing,
		fields,
	};
}

/** @deprecated Use evaluateJourneySeoCompleteness */
export function evaluateJourneySeoReady(row: JourneyRowLike): SeoCompletenessEvaluation {
	return evaluateJourneySeoCompleteness(row);
}

export const PROPOSED_SEO_COLUMN_SOURCES = {
	name: 'column:title (H1)',
	page_title: 'column:page_title backfilled from jsonb.pageTitle',
	meta_description: 'column:meta_description backfilled from jsonb.metaDescription',
	excerpt: 'column:short_description',
	hero_image_url: 'column:hero_image_url backfilled from jsonb.heroImage || column:image',
	hero_image_alt: 'column:hero_image_alt backfilled from jsonb.heroAlt',
	seo_complete:
		'column:seo_complete — admin quality marker only, NOT indexability',
} as const;
