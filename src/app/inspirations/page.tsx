import type { Metadata } from 'next';
import { getPublishedFeaturedArticles } from '@/lib/articleQuery.server';
import InspirationsPageView from './InspirationsPageView';

const SITE_URL = 'https://www.korascale.com';
const PAGE_URL = `${SITE_URL}/inspirations`;

const PAGE_TITLE = 'China Travel Insights & Inspirations | KoraScale';
const PAGE_DESCRIPTION =
	'Explore China travel planning, route strategy, culture, and business travel insights from KoraScale — your knowledge hub for logic-first itineraries and destination inspiration.';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: PAGE_TITLE,
	description: PAGE_DESCRIPTION,
	alternates: { canonical: PAGE_URL },
	openGraph: {
		title: PAGE_TITLE,
		description: PAGE_DESCRIPTION,
		url: PAGE_URL,
		type: 'website',
	},
	twitter: {
		card: 'summary_large_image',
		title: PAGE_TITLE,
		description: PAGE_DESCRIPTION,
	},
};

export default async function InspirationsPage() {
	const featuredArticles = await getPublishedFeaturedArticles(10);

	return <InspirationsPageView featuredArticles={featuredArticles} />;
}
