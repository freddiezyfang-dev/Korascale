import { JourneyTypeToSlug, type JourneyTypeUrlSlug } from '@/config/journeyTypeRoutes';
import { resolveCanonicalJourneySlug } from '@/lib/journeyNormalization/sitemap';
import { pickFirstValidImagePath } from '@/lib/imageUtils';
import type { Journey } from '@/types';

export const SITE_URL = 'https://www.korascale.com';

export type JourneyBreadcrumbItem = {
  label: string;
  href?: string;
};

export function getJourneyDisplayTitle(journey: Journey): string {
  return journey.pageTitle?.trim() || journey.title?.trim() || journey.slug;
}

export function getJourneyExcerpt(journey: Journey): string {
  const overviewDescription =
    journey.overview &&
    typeof journey.overview === 'object' &&
    'description' in journey.overview
      ? String((journey.overview as { description?: string }).description || '').trim()
      : '';

  return (
    journey.shortDescription?.trim() ||
    overviewDescription ||
    journey.description?.trim() ||
    ''
  );
}

/** SEO metadata / JSON-LD only — uses normalized meta_description, not visible card copy. */
export function getJourneySeoMetaDescription(journey: Journey): string {
  return journey.metaDescription?.trim() || '';
}

export function buildJourneyDetailUrl(slug: string): string {
  const normalized = resolveCanonicalJourneySlug(slug);
  return `${SITE_URL}/journeys/${normalized}`;
}

export function buildJourneyTypeUrl(typeSlug: JourneyTypeUrlSlug | string): string {
  return `${SITE_URL}/journeys/type/${typeSlug}`;
}

export function resolveJourneyTypeSlug(journey: Journey): JourneyTypeUrlSlug | null {
  if (!journey.journeyType) return null;
  return JourneyTypeToSlug[journey.journeyType] ?? null;
}

export function buildJourneyBreadcrumbItems(journey: Journey): JourneyBreadcrumbItem[] {
  const typeSlug = resolveJourneyTypeSlug(journey);
  const items: JourneyBreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Journeys', href: '/journeys' },
  ];

  if (journey.journeyType && typeSlug) {
    items.push({
      label: journey.journeyType,
      href: `/journeys/type/${typeSlug}`,
    });
  }

  items.push({ label: getJourneyDisplayTitle(journey) });
  return items;
}

export function buildJourneyBreadcrumbJsonLd(journey: Journey) {
  const items = buildJourneyBreadcrumbItems(journey);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const isLast = index === items.length - 1;
      const itemUrl = isLast
        ? buildJourneyDetailUrl(journey.slug)
        : `${SITE_URL}${item.href ?? ''}`;
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: itemUrl,
      };
    }),
  };
}

export function buildJourneyTripJsonLd(journey: Journey) {
  const title = getJourneyDisplayTitle(journey);
  const description = getJourneySeoMetaDescription(journey);
  const url = buildJourneyDetailUrl(journey.slug);
  const heroImage = pickFirstValidImagePath(journey.heroImage, journey.image, journey.mainContentImage, journey.images?.[0]);
  const imageUrl = heroImage
    ? heroImage.startsWith('http')
      ? heroImage
      : `${SITE_URL}${heroImage.startsWith('/') ? '' : '/'}${heroImage}`
    : undefined;

  const durationMatch = journey.duration?.match(/\d+/);
  const durationDays = durationMatch ? parseInt(durationMatch[0], 10) : undefined;

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Trip',
    name: title,
    description,
    url,
  };

  if (imageUrl) {
    jsonLd.image = [imageUrl];
  }

  if (durationDays && durationDays > 0) {
    jsonLd.duration = `P${durationDays}D`;
  }

  if (journey.itinerary?.length) {
    jsonLd.itinerary = {
      '@type': 'ItemList',
      numberOfItems: journey.itinerary.length,
      itemListElement: journey.itinerary.slice(0, 12).map((day, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: day.title || `Day ${day.day ?? index + 1}`,
      })),
    };
  }

  if (typeof journey.price === 'number' && journey.price > 0) {
    const currency =
      typeof (journey as Journey & { currency?: string }).currency === 'string'
        ? (journey as Journey & { currency?: string }).currency?.toUpperCase()
        : undefined;
    if (currency === 'USD' || currency === 'CNY' || currency === 'EUR') {
      jsonLd.offers = {
        '@type': 'Offer',
        price: journey.price,
        priceCurrency: currency,
        url,
      };
    }
  }

  return jsonLd;
}

export function getRelatedTripsForJourney(journey: Journey) {
  return (journey.relatedTrips ?? []).filter((trip) => trip.slug?.trim() && trip.title?.trim());
}

export function resolveJourneyCardHref(
  journey: Pick<Journey, 'slug'> & { link?: string | null }
): string {
  const slug = journey.slug?.trim();
  if (slug) {
    const segment = resolveCanonicalJourneySlug(slug);
    return segment ? `/journeys/${segment}` : '/journeys';
  }
  const link = typeof journey.link === 'string' ? journey.link.trim() : '';
  if (link.startsWith('/journeys/')) return link;
  if (link) return link;
  return '/journeys';
}
