import type { Metadata } from 'next';

import { parsePlanYourJourneyQuery } from '@/lib/inquiries/planYourJourneyQuery';

import { PlanYourJourneyClient } from './PlanYourJourneyClient';

const SITE_URL = 'https://www.korascale.com';
const CANONICAL = `${SITE_URL}/plan-your-journey`;

export const metadata: Metadata = {
  title: 'Plan Your Journey | KoraScale',
  description:
    'Share your travel dates, group size, and destinations. Our China travel experts will help plan your personalized journey.',
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    title: 'Plan Your Journey | KoraScale',
    description:
      'Share your travel dates, group size, and destinations. Our China travel experts will help plan your personalized journey.',
    url: CANONICAL,
  },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PlanYourJourneyPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const queryContext = parsePlanYourJourneyQuery(params);

  return <PlanYourJourneyClient queryContext={queryContext} />;
}
