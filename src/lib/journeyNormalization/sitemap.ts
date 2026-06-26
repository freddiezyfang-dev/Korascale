import { buildJourneyDetailPath } from '@/lib/journeySitemap.server';
import { getJourneySlugRedirect } from './redirects';
import { isValidCanonicalSlug, normalizeJourneySlug } from './slug';
import { isPublicJourneyStatusCompat } from './status';

export type JourneySitemapEntry = {
	slug: string;
	canonicalSlug: string;
	updatedAt: Date;
	urlPath: string;
};

export function resolveCanonicalJourneySlug(rawSlug: string): string {
	const stripped = rawSlug.replace(/^\/journeys\//i, '').replace(/^\/+|\/+$/g, '').trim();
	const redirectTarget = getJourneySlugRedirect(stripped);
	if (redirectTarget) return redirectTarget;
	const normalized = normalizeJourneySlug(stripped);
	return normalized ?? stripped;
}

export function shouldIncludeJourneyInSitemap(row: {
	slug?: unknown;
	status?: unknown;
}): boolean {
	if (!isPublicJourneyStatusCompat(row.status)) return false;
	const rawSlug = typeof row.slug === 'string' ? row.slug.trim() : '';
	if (!rawSlug) return false;
	const canonical = resolveCanonicalJourneySlug(rawSlug);
	return isValidCanonicalSlug(canonical);
}

export function mapRowToJourneySitemapEntry(row: {
	slug: string;
	status?: unknown;
	updated_at: string | Date;
}): JourneySitemapEntry | null {
	if (!shouldIncludeJourneyInSitemap(row)) return null;
	const canonicalSlug = resolveCanonicalJourneySlug(row.slug);
	if (!isValidCanonicalSlug(canonicalSlug)) return null;
	const updatedAt =
		row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at);
	return {
		slug: row.slug,
		canonicalSlug,
		updatedAt,
		urlPath: buildJourneyDetailPath(canonicalSlug),
	};
}

export function reconcileSitemapCounts(entries: JourneySitemapEntry[], activeCount: number) {
	const urls = entries.map((entry) => entry.urlPath);
	const uniqueUrls = new Set(urls);
	return {
		active: activeCount,
		validCanonicalSlug: entries.length,
		sitemapJourneyDetailUrls: uniqueUrls.size,
		missing: Math.max(0, activeCount - uniqueUrls.size),
		redirectUrlsInSitemap: 0,
		duplicateUrls: urls.length - uniqueUrls.size,
	};
}
