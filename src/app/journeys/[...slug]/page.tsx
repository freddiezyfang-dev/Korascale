import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound, permanentRedirect } from 'next/navigation';
import ClientJourneyPage from './ClientJourneyPage';
import JourneyDetailClearCacheEffect from './JourneyDetailClearCacheEffect';
import JourneyDetailServerSections from './JourneyDetailServerSections';
import {
  fetchActiveJourneySlugsForStaticParams,
  normalizeSlugFromParams,
} from '@/lib/journeyDetailQuery.server';
import { getJourneyBySlugForPage } from '@/lib/journeyServer';
import { getJourneySlugRedirect } from '@/lib/journeyNormalization/redirects';
import { pickFirstValidImagePath } from '@/lib/imageUtils';
import { buildJourneyDetailUrl, getJourneyDisplayTitle, getJourneySeoMetaDescription } from '@/lib/journeySeo.server';
import type { Journey } from '@/types';

const SITE_URL = 'https://www.korascale.com';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

function truncateMetaDescription(text: string, max = 160): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

function resolveTypeRedirectPath(slugParts: ReturnType<typeof normalizeSlugFromParams>): string | null {
  const { slug, isJourneyTypeSlug, isTypeRoute } = slugParts;
  if (isTypeRoute) {
    const typeValue = slug.replace(/^type\/?/i, '').trim();
    if (typeValue) return `/journeys/type/${typeValue}`;
  }
  if (isJourneyTypeSlug) {
    return `/journeys/type/${slug}`;
  }
  return null;
}

export async function generateStaticParams() {
  try {
    return await fetchActiveJourneySlugsForStaticParams();
  } catch (error) {
    console.error('[Journeys Detail] Failed to generate static params:', error);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: slugParam } = await params;
  const slugParts = normalizeSlugFromParams(slugParam);
  const typeRedirect = resolveTypeRedirectPath(slugParts);

  if (typeRedirect) {
    return {
      title: 'Journeys | Korascale',
      alternates: { canonical: `${SITE_URL}${typeRedirect}` },
    };
  }

  const slugRedirect = getJourneySlugRedirect(slugParts.normalizedSlug);
  if (slugRedirect) {
    permanentRedirect(`/journeys/${slugRedirect}`);
  }

  const journey = await getJourneyBySlugForPage(slugParts.normalizedSlug);
  if (!journey) {
    return { title: 'Journey Not Found | Korascale' };
  }

  const displayTitle = getJourneyDisplayTitle(journey);
  const canonical = buildJourneyDetailUrl(journey.slug || slugParts.normalizedSlug);
  const rawDescription = getJourneySeoMetaDescription(journey);
  const description = rawDescription
    ? truncateMetaDescription(rawDescription)
    : `Discover ${displayTitle} with Korascale.`;

  const ogImage = pickFirstValidImagePath(journey.heroImage, journey.image);

  return {
    title: `${displayTitle} | Korascale`,
    description,
    alternates: { canonical },
    openGraph: {
      title: displayTitle,
      description,
      url: canonical,
      type: 'website',
      ...(ogImage
        ? { images: [{ url: ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}` }] }
        : {}),
    },
  };
}

export default async function DynamicJourneyPage({ params }: PageProps) {
  const { slug: slugParam } = await params;
  const slugParts = normalizeSlugFromParams(slugParam);
  const typeRedirect = resolveTypeRedirectPath(slugParts);

  if (typeRedirect) {
    permanentRedirect(typeRedirect);
  }

  const slugRedirect = getJourneySlugRedirect(slugParts.normalizedSlug);
  if (slugRedirect) {
    permanentRedirect(`/journeys/${slugRedirect}`);
  }

  const journey = await getJourneyBySlugForPage(slugParts.normalizedSlug);
  if (!journey) {
    notFound();
  }

  const normalizedSlug =
    slugParts.normalizedSlug ||
    journey.slug?.replace(/^journeys\//i, '').replace(/^\/+/, '').trim() ||
    '';

  return (
    <>
      <JourneyDetailServerSections journey={journey} />
      <Suspense fallback={null}>
        <JourneyDetailClearCacheEffect normalizedSlug={normalizedSlug} />
      </Suspense>
      <ClientJourneyPage initialJourney={journey} />
    </>
  );
}
