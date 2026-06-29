/**
 * Server-only journey detail queries (direct DB). Do not import from Client Components.
 */
import { query } from '@/lib/db';
import { JOURNEY_TYPE_SLUGS } from '@/config/journeyTypeRoutes';
import { getJourneySlugDbLookupCandidates } from '@/lib/journeyNormalization/redirects';
import {
	mapRowToJourneySitemapEntry,
	resolveCanonicalJourneySlug,
	shouldIncludeJourneyInSitemap,
} from '@/lib/journeyNormalization/sitemap';
import { buildPublicStatusWhereClause } from '@/lib/journeyNormalization/status';
import { mapJourneyRowToJourney } from '@/lib/journeyListQuery.server';
import type { Journey } from '@/types';

export type NormalizedJourneySlugParams = {
  slugArray: string[];
  slug: string;
  cleanSlug: string;
  normalizedSlug: string;
  isJourneyTypeSlug: boolean;
  isTypeRoute: boolean;
};

/** Align with ClientJourneyPage slug parsing (last path segment for DB lookup). */
export function normalizeSlugFromParams(
  slugParam: string | string[] | undefined
): NormalizedJourneySlugParams {
  const slugArray = Array.isArray(slugParam)
    ? slugParam
    : slugParam
      ? [slugParam]
      : [];
  const slugRaw = slugArray.join('/');
  const slug = slugRaw.replace(/^\/+|\/+$/g, '').trim() || slugRaw;
  const cleanSlug =
    slug.replace(/^journeys\//i, '').replace(/^\/+/, '').trim() || slug;
  const normalizedSlug =
    (cleanSlug || slug).split('/').filter(Boolean).pop() || cleanSlug || slug;

  const isJourneyTypeSlug =
    (!!slug && (JOURNEY_TYPE_SLUGS as readonly string[]).includes(slug)) ||
    (!!cleanSlug && (JOURNEY_TYPE_SLUGS as readonly string[]).includes(cleanSlug));
  const isTypeRoute =
    (!!slug && (slug.startsWith('type/') || slug === 'type')) ||
    (!!cleanSlug && (cleanSlug.startsWith('type/') || cleanSlug === 'type'));

  return {
    slugArray,
    slug,
    cleanSlug,
    normalizedSlug,
    isJourneyTypeSlug,
    isTypeRoute,
  };
}

export async function fetchJourneyBySlugFromDb(
  slugForQuery: string
): Promise<Journey | null> {
  const trimmed = slugForQuery?.trim();
  if (!trimmed) return null;

  const lookupSlugs = getJourneySlugDbLookupCandidates(trimmed);
  if (lookupSlugs.length === 0) return null;

  const result = await query(
    `
      SELECT *
      FROM journeys
      WHERE slug = ANY($1::text[])
        AND (${buildPublicStatusWhereClause()})
      LIMIT 1
    `,
    [lookupSlugs]
  );

  if (result.rows.length === 0) return null;

  return mapJourneyRowToJourney(result.rows[0] as Record<string, unknown>);
}

/** Slugs for generateStaticParams — active only (strict). */
export async function fetchActiveJourneySlugsForStaticParams(): Promise<
  { slug: string[] }[]
> {
  const result = await query(`
    SELECT slug
    FROM journeys
    WHERE ${buildPublicStatusWhereClause()}
    ORDER BY created_at DESC
    LIMIT 500
  `);

  const params: { slug: string[] }[] = [];

  for (const row of result.rows) {
    const slug = (row.slug as string)?.trim();
    if (!slug || !shouldIncludeJourneyInSitemap(row)) continue;
    const canonical = resolveCanonicalJourneySlug(slug);
    params.push({
      slug: canonical.split('/').filter(Boolean),
    });
  }

  return params;
}

/** Sitemap rows with canonical slug and real updated_at (no build-time fallback). */
export async function fetchActiveJourneySitemapEntries(): Promise<
  Array<{ canonicalSlug: string; updatedAt: Date }>
> {
  const result = await query(`
    SELECT slug, status, updated_at
    FROM journeys
    WHERE ${buildPublicStatusWhereClause()}
    ORDER BY updated_at DESC
    LIMIT 500
  `);

  const entries: Array<{ canonicalSlug: string; updatedAt: Date }> = [];

  for (const row of result.rows) {
    const mapped = mapRowToJourneySitemapEntry({
      slug: row.slug as string,
      status: row.status,
      updated_at: row.updated_at as string | Date,
    });
    if (!mapped) continue;
    entries.push({
      canonicalSlug: mapped.canonicalSlug,
      updatedAt: mapped.updatedAt,
    });
  }

  return entries;
}

/** Flat canonical slugs for sitemap entries (active only). */
export async function fetchActiveJourneySitemapSlugs(): Promise<string[]> {
  const entries = await fetchActiveJourneySitemapEntries();
  return entries.map((entry) => entry.canonicalSlug);
}
