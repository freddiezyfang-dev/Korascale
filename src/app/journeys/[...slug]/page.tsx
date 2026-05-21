import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import ClientJourneyPage from './ClientJourneyPage';
import {
  fetchActiveJourneySlugsForStaticParams,
  normalizeSlugFromParams,
} from '@/lib/journeyDetailQuery.server';
import { getJourneyBySlugForPage } from '@/lib/journeyServer';
import { pickFirstValidImagePath } from '@/lib/imageUtils';
import type { Journey } from '@/types';

const SITE_URL = 'https://www.korascale.com';

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

  const journey = await getJourneyBySlugForPage(slugParts.normalizedSlug);
  if (!journey) {
    return { title: 'Journey Not Found | Korascale' };
  }

  const displayTitle = journey.pageTitle || journey.title || slugParts.normalizedSlug;
  const canonicalSlug = journey.slug || slugParts.normalizedSlug;
  const canonical = `${SITE_URL}/journeys/${canonicalSlug}`;
  const rawDescription =
    (journey as Journey & { metaDescription?: string }).metaDescription ||
    journey.shortDescription ||
    journey.description ||
    '';
  const description = rawDescription
    ? truncateMetaDescription(rawDescription)
    : `Discover ${displayTitle} with Korascale.`;

  const ogImage = pickFirstValidImagePath(
    journey.heroImage,
    journey.image,
    journey.mainContentImage,
    journey.images?.[0]
  );

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
    redirect(typeRedirect);
  }

  const journey = await getJourneyBySlugForPage(slugParts.normalizedSlug);
  if (!journey) {
    notFound();
  }

  return <ClientJourneyPage initialJourney={journey} />;
}
