import type { Metadata } from 'next';
import GroupToursLandingClient from './GroupToursLandingClient';

export const metadata: Metadata = {
	title: 'Group Tours | Korascale Journeys',
	description:
		'Structured group travel in China: coordinated delivery, project-based execution, and consistent service for institutions and inbound cohorts.',
};

export default function GroupToursTypePage() {
	return <GroupToursLandingClient />;
}
