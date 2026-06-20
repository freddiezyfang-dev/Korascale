/**
 * Normalize legacy booking path segments to journey detail paths.
 */
export function legacyBookingSlugToJourneyPath(slug: string): string {
  const decoded = decodeURIComponent(slug);
  const normalized = decoded.replace(/^journeys\//i, '').replace(/^\/+/, '').trim();
  if (!normalized) return '/journeys';
  const leaf = normalized.split('/').filter(Boolean).pop() || normalized;
  return `/journeys/${encodeURIComponent(leaf)}`;
}

/** Static legacy booking routes and their redirect targets. */
export const LEGACY_BOOKING_STATIC_REDIRECTS = {
  '/booking/cart': '/journeys',
  '/booking/review': '/journeys',
  '/booking/confirm': '/journeys',
  '/booking/success': '/journeys',
  '/booking/accommodation': '/accommodations',
  '/booking/chengdu-deep-dive': '/journeys/chengdu-city-one-day-deep-dive',
} as const;
