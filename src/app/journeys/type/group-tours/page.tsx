import type { Metadata } from 'next';
import GroupToursLandingClient from './GroupToursLandingClient';
import { buildJourneyTypeUrl } from '@/lib/journeySeo.server';

export const metadata: Metadata = {
	title: 'Group Tours | Korascale Journeys',
	description:
		'Structured group travel in China: coordinated delivery, project-based execution, and consistent service for institutions and inbound cohorts.',
	alternates: {
		canonical: buildJourneyTypeUrl('group-tours'),
	},
};

export default function GroupToursTypePage() {
	return <GroupToursLandingClient />;
}
