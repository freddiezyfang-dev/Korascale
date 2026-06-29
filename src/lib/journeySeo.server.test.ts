import { describe, expect, it } from 'vitest';
import {
  buildJourneyBreadcrumbJsonLd,
  buildJourneyDetailUrl,
  buildJourneyTripJsonLd,
  buildJourneyTypeUrl,
  getJourneyDisplayTitle,
  getJourneyExcerpt,
  getJourneySeoMetaDescription,
  resolveJourneyCardHref,
  resolveJourneyTypeSlug,
} from '@/lib/journeySeo.server';
import type { Journey } from '@/types';

const sampleJourney = {
  id: 'j-1',
  title: 'Beijing City Tour',
  pageTitle: 'Beijing City Imperial Tour',
  slug: 'beijing-city-tour',
  shortDescription: 'Explore imperial Beijing in one day.',
  description: 'Long description',
  duration: '1 Day',
  price: 299,
  journeyType: 'Explore Together',
  itinerary: [{ day: 1, title: 'Imperial sights', description: 'Visit the Forbidden City.' }],
} as Journey;

describe('journeySeo.server', () => {
  it('uses page title for display title', () => {
    expect(getJourneyDisplayTitle(sampleJourney)).toBe('Beijing City Imperial Tour');
  });

  it('builds canonical detail URL', () => {
    expect(buildJourneyDetailUrl('beijing-city-tour')).toBe(
      'https://www.korascale.com/journeys/beijing-city-tour'
    );
  });

  it('builds type canonical URL', () => {
    expect(buildJourneyTypeUrl('explore-together')).toBe(
      'https://www.korascale.com/journeys/type/explore-together'
    );
  });

  it('maps journey type label to slug', () => {
    expect(resolveJourneyTypeSlug(sampleJourney)).toBe('explore-together');
  });

  it('uses short description for visible excerpt, not meta description', () => {
    const journey = {
      ...sampleJourney,
      shortDescription: 'Visible short copy',
      metaDescription: 'SEO meta only',
    } as Journey;
    expect(getJourneyExcerpt(journey)).toBe('Visible short copy');
    expect(getJourneySeoMetaDescription(journey)).toBe('SEO meta only');
  });

  it('builds Trip JSON-LD with SEO meta description', () => {
    const journey = {
      ...sampleJourney,
      metaDescription: 'SEO meta for structured data',
    } as Journey;
    const jsonLd = buildJourneyTripJsonLd(journey);
    expect(jsonLd['@type']).toBe('Trip');
    expect(jsonLd.name).toBe(getJourneyDisplayTitle(journey));
    expect(jsonLd.url).toBe(buildJourneyDetailUrl(journey.slug));
    expect(jsonLd.description).toBe(getJourneySeoMetaDescription(journey));
  });

	it('omits offer when price is zero', () => {
		const jsonLd = buildJourneyTripJsonLd({ ...sampleJourney, price: 0 });
		expect(jsonLd.offers).toBeUndefined();
	});

	it('omits offer when currency is not structured', () => {
		const jsonLd = buildJourneyTripJsonLd({ ...sampleJourney, price: 299 });
		expect(jsonLd.offers).toBeUndefined();
	});

  it('builds breadcrumb JSON-LD aligned with visible trail', () => {
    const breadcrumb = buildJourneyBreadcrumbJsonLd(sampleJourney);
    expect(breadcrumb['@type']).toBe('BreadcrumbList');
    expect(breadcrumb.itemListElement).toHaveLength(4);
  });

  it('resolves journey card href from slug', () => {
    expect(resolveJourneyCardHref({ slug: 'beijing-city-tour' })).toBe('/journeys/beijing-city-tour');
  });
});
