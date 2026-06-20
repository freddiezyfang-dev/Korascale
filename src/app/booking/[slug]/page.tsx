import { redirect } from 'next/navigation';

import { legacyBookingSlugToJourneyPath } from '@/lib/legacyBookingRedirects';

type BookingSlugPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BookingSlugRedirectPage({ params }: BookingSlugPageProps) {
  const { slug } = await params;
  redirect(legacyBookingSlugToJourneyPath(slug));
}
