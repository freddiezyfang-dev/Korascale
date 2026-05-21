import type { Metadata } from 'next';
import { getActiveJourneysForList } from '@/lib/journeyServer';
import JourneysPageClient from './JourneysPageClient';

const SITE_URL = 'https://www.korascale.com';

export const metadata: Metadata = {
  title: 'Journeys | Korascale',
  description:
    'Explore private journeys across China, from day trips and cultural discoveries to multi-day routes designed with local insight and seamless coordination.',
  alternates: {
    canonical: `${SITE_URL}/journeys`,
  },
};

export default async function JourneysPage() {
  const initialJourneys = await getActiveJourneysForList();
  return <JourneysPageClient initialJourneys={initialJourneys} />;
}
