import type { JourneyType } from '@/types';

/** URL 段 → 与站点一致的旅程类型 slug */
export const JOURNEY_TYPE_SLUGS = [
  'explore-together',
  'deep-discovery',
  'signature-journeys',
  'group-tours',
] as const;

export type JourneyTypeUrlSlug = (typeof JOURNEY_TYPE_SLUGS)[number];

export const JourneyTypeToSlug: Record<JourneyType, JourneyTypeUrlSlug> = {
  'Explore Together': 'explore-together',
  'Deep Discovery': 'deep-discovery',
  'Signature Journeys': 'signature-journeys',
  'Group Tours': 'group-tours',
};

export const SlugToJourneyType: Record<JourneyTypeUrlSlug, JourneyType> = {
  'explore-together': 'Explore Together',
  'deep-discovery': 'Deep Discovery',
  'signature-journeys': 'Signature Journeys',
  'group-tours': 'Group Tours',
};

export function isValidJourneyTypeSlug(slug: string): slug is JourneyTypeUrlSlug {
  return (JOURNEY_TYPE_SLUGS as readonly string[]).includes(slug);
}

export function journeyTypeFromSlug(slug: string): JourneyType | undefined {
  return isValidJourneyTypeSlug(slug) ? SlugToJourneyType[slug] : undefined;
}
