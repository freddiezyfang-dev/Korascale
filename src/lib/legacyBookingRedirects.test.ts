import { describe, expect, it } from 'vitest';

import {
  LEGACY_BOOKING_STATIC_REDIRECTS,
  legacyBookingSlugToJourneyPath,
} from './legacyBookingRedirects';

describe('legacy booking redirects (PR-C5)', () => {
  it('maps booking slugs to journey detail paths', () => {
    expect(legacyBookingSlugToJourneyPath('chengdu-city-one-day-deep-dive')).toBe(
      '/journeys/chengdu-city-one-day-deep-dive'
    );
    expect(legacyBookingSlugToJourneyPath('journeys/chengdu-city-one-day-deep-dive')).toBe(
      '/journeys/chengdu-city-one-day-deep-dive'
    );
    expect(legacyBookingSlugToJourneyPath('/journeys/foo/bar')).toBe('/journeys/bar');
  });

  it('falls back to /journeys for empty slugs', () => {
    expect(legacyBookingSlugToJourneyPath('')).toBe('/journeys');
    expect(legacyBookingSlugToJourneyPath('/')).toBe('/journeys');
  });

  it('defines static legacy booking redirect targets', () => {
    expect(LEGACY_BOOKING_STATIC_REDIRECTS['/booking/cart']).toBe('/journeys');
    expect(LEGACY_BOOKING_STATIC_REDIRECTS['/booking/review']).toBe('/journeys');
    expect(LEGACY_BOOKING_STATIC_REDIRECTS['/booking/confirm']).toBe('/journeys');
    expect(LEGACY_BOOKING_STATIC_REDIRECTS['/booking/success']).toBe('/journeys');
    expect(LEGACY_BOOKING_STATIC_REDIRECTS['/booking/accommodation']).toBe('/accommodations');
    expect(LEGACY_BOOKING_STATIC_REDIRECTS['/booking/chengdu-deep-dive']).toBe(
      '/journeys/chengdu-city-one-day-deep-dive'
    );
  });
});
