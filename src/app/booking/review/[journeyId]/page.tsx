import { redirect } from 'next/navigation';

import { legacyBookingSlugToJourneyPath } from '@/lib/legacyBookingRedirects';

type BookingReviewJourneyPageProps = {
  params: Promise<{ journeyId: string }>;
};

export default async function BookingReviewJourneyRedirectPage({
  params,
}: BookingReviewJourneyPageProps) {
  const { journeyId } = await params;
  redirect(legacyBookingSlugToJourneyPath(journeyId));
}
