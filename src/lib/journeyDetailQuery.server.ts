/**
 * Server-only journey detail queries (direct DB). Do not import from Client Components.
 */
import { query } from '@/lib/db';
import { JOURNEY_TYPE_SLUGS } from '@/config/journeyTypeRoutes';
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

  const result = await query(
    `
      SELECT *
      FROM journeys
      WHERE slug = $1
        AND (status = 'active' OR status IS NULL)
      LIMIT 1
    `,
    [trimmed]
  );

  if (result.rows.length === 0) return null;

  return mapJourneyRowToJourney(result.rows[0] as Record<string, unknown>);
}

/** Slugs for generateStaticParams — no HTTP, active/null only. */
export async function fetchActiveJourneySlugsForStaticParams(): Promise<
  { slug: string[] }[]
> {
  const result = await query(`
    SELECT slug
    FROM journeys
    WHERE status = 'active' OR status IS NULL
    ORDER BY created_at DESC
    LIMIT 500
  `);

  const params: { slug: string[] }[] = [];

  for (const row of result.rows) {
    const slug = (row.slug as string)?.trim();
    if (!slug) continue;
    params.push({
      slug: slug.split('/').filter(Boolean),
    });
  }

  return params;
}

/** Flat slugs for sitemap entries (active/null only). */
export async function fetchActiveJourneySitemapSlugs(): Promise<string[]> {
  const result = await query(`
    SELECT slug
    FROM journeys
    WHERE status = 'active' OR status IS NULL
    ORDER BY created_at DESC
    LIMIT 500
  `);

  const slugs: string[] = [];
  for (const row of result.rows) {
    const slug = (row.slug as string)?.trim();
    if (slug) slugs.push(slug);
  }
  return slugs;
}
