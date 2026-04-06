import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import JourneyTypePageClient from './JourneyTypePageClient';
import {
  isValidJourneyTypeSlug,
  journeyTypeFromSlug,
  JOURNEY_TYPE_SLUGS,
} from '@/config/journeyTypeRoutes';

type PageProps = {
  params: Promise<{ type: string }>;
};

const getJourneyTypeMetaLabel = cache((slug: string) => journeyTypeFromSlug(slug));
const isValidJourneyTypeSlugCached = cache((slug: string) => isValidJourneyTypeSlug(slug));

/** 构建时预渲染四个固定类型页，跳转时优先命中静态 HTML */
export function generateStaticParams() {
  return JOURNEY_TYPE_SLUGS.map((type) => ({ type }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params;
  const label = getJourneyTypeMetaLabel(type);
  if (!label) {
    return { title: 'Journeys | Korascale' };
  }
  return {
    title: `${label} | Korascale Journeys`,
    description: `Discover ${label} journeys across China with Korascale.`,
  };
}

export default async function JourneyTypePage({ params }: PageProps) {
  const { type } = await params;

  if (!isValidJourneyTypeSlugCached(type)) {
    notFound();
  }

  return <JourneyTypePageClient typeSlug={type} />;
}
