import { journeyAPI } from '@/lib/databaseClient';
import type { Journey } from '@/types';

/** Normalize dates after Server → Client serialization (ISO strings → Date). */
export function normalizeJourneyForClient(journey: Journey): Journey {
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
    createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
    updatedAt: Number.isNaN(updatedAt.getTime()) ? new Date() : updatedAt,
  };
}

export function normalizeJourneysForClient(journeys: Journey[]): Journey[] {
  return journeys.map(normalizeJourneyForClient);
}

/** Active journeys for list/grid SSR (lightweight fields, no full itinerary). */
export async function getActiveJourneysForList(): Promise<Journey[]> {
  try {
    const journeys = await journeyAPI.getAll(2, false, false, 'list');
    return normalizeJourneysForClient(journeys);
  } catch (error) {
    console.error('[journeyServer] getActiveJourneysForList failed:', error);
    return [];
  }
}
