/**
 * Journey sitemap helpers (server-only).
 */
import { JOURNEY_TYPE_SLUGS } from '@/config/journeyTypeRoutes';

export const SITE_URL = 'https://www.korascale.com';

/** Public static paths included in sitemap (allowlist). */
export const SITEMAP_STATIC_PATHS = [
  '',
  '/journeys',
  '/destinations',
  '/inspirations',
  '/solutions',
  '/solutions/healthcare-access-china',
  '/solutions/corporate-travel',
  ...JOURNEY_TYPE_SLUGS.map((type) => `/journeys/type/${type}`),
] as const;

/** Build pathname for a journey detail URL from DB slug. */
export function buildJourneyDetailPath(slug: string): string {
  const normalized = slug.replace(/^journeys\//i, '').replace(/^\/+/, '').trim();
  if (!normalized) return '/journeys';
  const segments = normalized.split('/').filter(Boolean).map((segment) =>
    encodeURIComponent(segment)
  );
  return `/journeys/${segments.join('/')}`;
}
