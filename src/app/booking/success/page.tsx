import { redirect } from 'next/navigation';

export default function BookingSuccessRedirectPage() {
  redirect('/journeys');
}
