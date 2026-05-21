/**
 * Server-only journey list queries (direct DB). Do not import from Client Components.
 */
import { query } from '@/lib/db';
import { pickFirstValidImagePath, sanitizeImageList, sanitizeImagePath } from '@/lib/imageUtils';
import type { Journey } from '@/types';

export type JourneyListFields = 'full' | 'minimal' | 'list';

export function normalizeAvailableDates(items: unknown[] | undefined): unknown[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const row =
      item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    return {
      ...row,
      enabled: typeof row.enabled === 'boolean' ? row.enabled : true,
    };
  });
}

export function sanitizeJourneyBaseData(baseData: Record<string, unknown>) {
  const safeImages = sanitizeImageList(baseData?.images as string[] | undefined);
  const overview = baseData?.overview as Record<string, unknown> | undefined;
  const safeOverview = overview
    ? {
        ...overview,
        sideImage: sanitizeImagePath(overview.sideImage as string | undefined),
      }
    : undefined;
  const itinerary = baseData?.itinerary;
  const safeItinerary = Array.isArray(itinerary)
    ? itinerary.map((item: Record<string, unknown>) => ({
        ...item,
        image: sanitizeImagePath(item?.image as string | undefined),
      }))
    : [];

  return {
    ...baseData,
    images: safeImages,
    overview: safeOverview,
    itinerary: safeItinerary,
    heroImage: sanitizeImagePath(baseData?.heroImage as string | undefined),
    mainContentImage: sanitizeImagePath(baseData?.mainContentImage as string | undefined),
    availableDates: normalizeAvailableDates(baseData?.availableDates as unknown[] | undefined),
  };
}

/** Map one DB row to Journey (same rules as GET /api/journeys). */
export function mapJourneyRowToJourney(row: Record<string, unknown>): Journey {
  const baseData = sanitizeJourneyBaseData(
    (row.data as Record<string, unknown>) || {}
  ) as Record<string, unknown>;
  const safePrimaryImage = pickFirstValidImagePath(
    row.image as string | undefined,
    baseData.image as string | undefined,
    baseData.heroImage as string | undefined,
    baseData.mainContentImage as string | undefined,
    (baseData.images as string[] | undefined)?.[0]
  );
  const resolvedTitle =
    (row.title as string) ||
    (baseData.title as string) ||
    (baseData.name as string) ||
    (baseData.pageTitle as string) ||
    '';
  const resolvedSlug = (row.slug as string) || (baseData.slug as string) || '';

  return {
    ...baseData,
    id: row.id as string,
    title: resolvedTitle,
    slug: resolvedSlug,
    pageTitle: (baseData.pageTitle as string) || resolvedTitle,
    description: (row.description as string) || '',
    shortDescription: (row.short_description as string) || '',
    price: row.price as number,
    originalPrice: row.original_price as number | undefined,
    category: row.category as Journey['category'],
    journeyType: (row.journey_type as Journey['journeyType']) || undefined,
    region: row.region as Journey['region'],
    place: (row.place as string) || undefined,
    city: row.city as string,
    location: row.location as string,
    duration: row.duration as string,
    difficulty: row.difficulty as Journey['difficulty'],
    maxParticipants: row.max_participants as number,
    minParticipants: row.min_participants as number,
    image: safePrimaryImage,
    status: row.status as Journey['status'],
    featured: row.featured as boolean,
    rating: row.rating as number,
    reviewCount: row.review_count as number,
    destinationCount: baseData.destinationCount as number | undefined,
    maxGuests: baseData.maxGuests as number | undefined,
    heroImage: pickFirstValidImagePath(
      baseData.heroImage as string | undefined,
      row.image as string | undefined,
      safePrimaryImage
    ),
    mainContentImage: sanitizeImagePath(baseData.mainContentImage as string | undefined),
    images: sanitizeImageList(baseData.images as string[] | undefined),
    availableDates: normalizeAvailableDates(baseData.availableDates as unknown[] | undefined),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  } as Journey;
}

export async function queryJourneyRows(options?: {
  includeAll?: boolean;
  fields?: JourneyListFields;
}): Promise<Record<string, unknown>[]> {
  const includeAll = options?.includeAll ?? false;
  const fields = options?.fields ?? 'list';
  const minimalFields = fields === 'minimal';
  const listFields = fields === 'list';

  const statusCondition = includeAll
    ? ''
    : "WHERE status = 'active' OR status IS NULL";

  const limit = listFields ? 500 : 1000;

  const selectClause = minimalFields
    ? `
          SELECT id, slug, title
          FROM journeys
        `
    : listFields
      ? `
          SELECT
            id, title, slug, description, short_description,
            price, original_price, category, journey_type, region, place, city, location,
            duration, difficulty, max_participants, min_participants,
            image, status, featured, rating, review_count,
            (data - 'itinerary') as data, created_at, updated_at
          FROM journeys
        `
      : `
          SELECT
            id, title, slug, description, short_description,
            price, original_price, category, journey_type, region, place, city, location,
            duration, difficulty, max_participants, min_participants,
            image, status, featured, rating, review_count,
            data, created_at, updated_at
          FROM journeys
        `;

  const result = await query(`
    ${selectClause}
    ${statusCondition}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);

  return result.rows as Record<string, unknown>[];
}

/** Active journeys for public list pages (SSR). */
export async function fetchActiveJourneysForListFromDb(): Promise<Journey[]> {
  const rows = await queryJourneyRows({ includeAll: false, fields: 'list' });
  return rows.map(mapJourneyRowToJourney);
}
