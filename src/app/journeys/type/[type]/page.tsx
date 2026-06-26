import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import JourneyTypePageClient from './JourneyTypePageClient';
import JourneyTypeServerProductList from './JourneyTypeServerProductList';
import {
  isValidJourneyTypeSlug,
  journeyTypeFromSlug,
  JOURNEY_TYPE_SLUGS,
  type JourneyTypeUrlSlug,
} from '@/config/journeyTypeRoutes';
import { getActiveJourneysByType } from '@/lib/journeyServer';
import { buildJourneyTypeUrl } from '@/lib/journeySeo.server';

type PageProps = {
  params: Promise<{ type: string }>;
};

const getJourneyTypeMetaLabel = cache((slug: string) => journeyTypeFromSlug(slug));
const isValidJourneyTypeSlugCached = cache((slug: string) => isValidJourneyTypeSlug(slug));

const TYPE_DESCRIPTIONS: Record<JourneyTypeUrlSlug, string> = {
  'explore-together':
    'Discover Explore Together journeys across China with Korascale.',
  'deep-discovery':
    'Discover Deep Discovery journeys across China with Korascale.',
  'signature-journeys':
    'Discover Signature Journeys across China with Korascale.',
  'group-tours':
    'Structured group travel in China: coordinated delivery, project-based execution, and consistent service for institutions and inbound cohorts.',
};

/** 构建时预渲染三个动态类型页；group-tours 由专用 route 提供 */
export function generateStaticParams() {
  return JOURNEY_TYPE_SLUGS.filter((type) => type !== 'group-tours').map((type) => ({ type }));
}

export const dynamic = 'force-dynamic';

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params;
  const label = getJourneyTypeMetaLabel(type);
  if (!label) {
    return { title: 'Journeys | Korascale' };
  }

  const canonical = buildJourneyTypeUrl(type);
  const description = TYPE_DESCRIPTIONS[type as JourneyTypeUrlSlug] ?? `Discover ${label} journeys across China with Korascale.`;

  const metadata: Metadata = {
    title: `${label} | Korascale Journeys`,
    description,
    alternates: { canonical },
  };

  if (type === 'signature-journeys') {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}

export default async function JourneyTypePage({ params }: PageProps) {
  const { type } = await params;

  if (!isValidJourneyTypeSlugCached(type)) {
    notFound();
  }

  if (type === 'group-tours') {
    notFound();
  }

  const journeyType = getJourneyTypeMetaLabel(type);
  if (!journeyType) {
    notFound();
  }

  const initialJourneys = await getActiveJourneysByType(journeyType);

  return (
    <>
      <JourneyTypeServerProductList journeys={initialJourneys} heading={`${journeyType} journeys`} />
      <JourneyTypePageClient typeSlug={type} initialJourneys={initialJourneys} />
    </>
  );
}
