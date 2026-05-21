import { cache } from 'react';
import { fetchJourneyBySlugFromDb } from '@/lib/journeyDetailQuery.server';
import { fetchActiveJourneysForListFromDb } from '@/lib/journeyListQuery.server';
import type { Journey } from '@/types';

type JourneyRecord = Journey & {
  name?: string;
  link?: string;
  destination?: string;
};

function pickNonEmptyString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return '';
}

/** Strip optional journeys/ prefix from stored slug or path segment. */
function normalizeSlugSegment(value: string): string {
  return value.replace(/^journeys\//i, '').replace(/^\/+/, '').trim();
}

function slugFromPath(path: unknown): string {
  if (typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  const match = trimmed.match(/\/journeys\/([^/?#]+)/i);
  if (match?.[1]) return normalizeSlugSegment(match[1]);

  if (!trimmed.includes('/')) return normalizeSlugSegment(trimmed);

  return '';
}

function resolveJourneyTitle(journey: JourneyRecord): string {
  return pickNonEmptyString(journey.title, journey.name, journey.pageTitle);
}

function resolveJourneySlug(journey: JourneyRecord): string {
  const fromFields = pickNonEmptyString(journey.slug, slugFromPath(journey.link));
  if (fromFields) return normalizeSlugSegment(fromFields);

  const title = resolveJourneyTitle(journey);
  if (!title) return '';

  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveJourneyLink(journey: JourneyRecord, slug: string): string | undefined {
  const existingLink = pickNonEmptyString(journey.link);
  if (existingLink.startsWith('/journeys/')) return existingLink;
  if (existingLink) return existingLink;

  if (!slug) return undefined;
  return `/journeys/${slug}`;
}

/** Normalize list/card fields after Server → Client serialization. */
export function normalizeJourneyForClient(journey: Journey): Journey {
  const raw = journey as JourneyRecord;
  const title = resolveJourneyTitle(raw);
  const slug = resolveJourneySlug({ ...raw, title });
  const link = resolveJourneyLink(raw, slug);

  const createdAt =
    journey.createdAt instanceof Date
      ? journey.createdAt
      : new Date(journey.createdAt as unknown as string);
  const updatedAt =
    journey.updatedAt instanceof Date
      ? journey.updatedAt
      : new Date(journey.updatedAt as unknown as string);

  return {
    ...journey,
    title,
    slug,
    pageTitle: pickNonEmptyString(journey.pageTitle, title),
    description: pickNonEmptyString(journey.description) || '',
    shortDescription:
      pickNonEmptyString(journey.shortDescription, journey.description) ||
      journey.shortDescription ||
      '',
    ...(link ? { link } : {}),
    createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
    updatedAt: Number.isNaN(updatedAt.getTime()) ? new Date() : updatedAt,
  } as Journey;
}

export function normalizeJourneysForClient(journeys: Journey[]): Journey[] {
  return journeys.map(normalizeJourneyForClient);
}

/** Active journeys for list/grid SSR — direct DB, no HTTP self-call. */
export async function getActiveJourneysForList(): Promise<Journey[]> {
  try {
    const journeys = await fetchActiveJourneysForListFromDb();
    return normalizeJourneysForClient(journeys);
  } catch (error) {
    console.error('[journeyServer] getActiveJourneysForList failed:', error);
    return [];
  }
}

/** Journey detail for SSR + generateMetadata (deduped per request via cache). */
export const getJourneyBySlugForPage = cache(async (slug: string): Promise<Journey | null> => {
  try {
    const journey = await fetchJourneyBySlugFromDb(slug);
    return journey ? normalizeJourneyForClient(journey) : null;
  } catch (error) {
    console.error('[journeyServer] getJourneyBySlugForPage failed:', error);
    return null;
  }
});
