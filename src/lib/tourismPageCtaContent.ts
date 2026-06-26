import type { JourneyType } from '@/types';
import { JOURNEY_TYPE_CARD_IMAGE } from '@/lib/journeyTypeCardImages';
import {
	CANONICAL_CATEGORY_TO_HERO_IMAGE,
	getCanonicalCategoryBySlug,
	type CanonicalArticleCategory,
} from '@/lib/articleCategories';

export const TOURISM_CTA_FALLBACK_IMAGE = '/images/guilin.jpg';
export const DESTINATIONS_LIST_IMAGE = '/images/hero/slide6.jpeg';

export type TourismCtaCopy = {
	title: string;
	description: string;
	buttonLabel: string;
};

export const JOURNEYS_LIST_CTA: TourismCtaCopy = {
	title: 'Find the journey that matches the way you travel',
	description:
		'Explore China through a route shaped around your time, interests and preferred pace.',
	buttonLabel: 'Plan Your Journey',
};

export const JOURNEY_TYPE_CTA: Record<
	Exclude<JourneyType, 'Group Tours'>,
	TourismCtaCopy & { image: string }
> = {
	'Explore Together': {
		title: 'Turn a few days into a meaningful introduction to China',
		description:
			'Choose a focused city experience or short escape, privately arranged around your schedule.',
		buttonLabel: 'Plan a Short Journey',
		image: JOURNEY_TYPE_CARD_IMAGE['Explore Together'],
	},
	'Deep Discovery': {
		title: 'Go deeper into one region, one route and one rhythm',
		description:
			'Build a multi-day journey that gives each destination the time and context it deserves.',
		buttonLabel: 'Design Your Journey',
		image: JOURNEY_TYPE_CARD_IMAGE['Deep Discovery'],
	},
	'Signature Journeys': {
		title: 'Shape a private journey around what matters most',
		description:
			'Combine distinctive places, considered pacing and a higher level of personal support.',
		buttonLabel: 'Start Planning',
		image: JOURNEY_TYPE_CARD_IMAGE['Signature Journeys'],
	},
};

export const JOURNEY_DETAIL_CTA: TourismCtaCopy = {
	title: 'Make this journey your own',
	description:
		'Adjust the route, pace, accommodation and experiences around your travel dates and interests.',
	buttonLabel: 'Customize This Journey',
};

export const DESTINATIONS_LIST_CTA: TourismCtaCopy = {
	title: 'Choose where your journey through China begins',
	description:
		'Explore regions, cities and landscapes, then shape them into a route that fits the way you travel.',
	buttonLabel: 'Explore Destinations',
};

export const DESTINATION_DETAIL_CTA: TourismCtaCopy = {
	title: 'Build your journey around this destination',
	description:
		'Combine the places, experiences and travel pace that make this region worth exploring in depth.',
	buttonLabel: 'Plan This Destination',
};

export const INSPIRATIONS_LIST_CTA: TourismCtaCopy = {
	title: 'Turn inspiration into a journey through China',
	description:
		'Use our stories, route ideas and local perspectives as the starting point for your own journey.',
	buttonLabel: 'Start Planning',
};

export const INSPIRATION_CATEGORY_CTA: Partial<
	Record<
		CanonicalArticleCategory,
		TourismCtaCopy & { image: string }
	>
> = {
	'China Travel Planning': {
		title: 'Turn practical planning into a journey that works',
		description:
			'Bring routes, timing and travel decisions together around the way you want to experience China.',
		buttonLabel: 'Plan Your Journey',
		image: CANONICAL_CATEGORY_TO_HERO_IMAGE['China Travel Planning'],
	},
	'Destinations & Route Strategy': {
		title: 'Turn a route idea into a journey through China',
		description:
			'Combine destinations in an order that makes sense for your time, pace and interests.',
		buttonLabel: 'Design Your Route',
		image: CANONICAL_CATEGORY_TO_HERO_IMAGE['Destinations & Route Strategy'],
	},
	'Culture, Dining & Local Experiences': {
		title: 'Bring these experiences into your China journey',
		description:
			'Use local culture, food and everyday encounters to shape a journey with more depth and meaning.',
		buttonLabel: 'Build Your Journey',
		image: CANONICAL_CATEGORY_TO_HERO_IMAGE['Culture, Dining & Local Experiences'],
	},
};

export const INSPIRATION_ARTICLE_CTA: TourismCtaCopy = {
	title: 'Build this idea into your China journey',
	description:
		'Use this perspective as the starting point for a route shaped around your time, pace and interests.',
	buttonLabel: 'Plan Around This Idea',
};

export function getInspirationCategoryCta(categorySlug: string) {
	const category = getCanonicalCategoryBySlug(categorySlug);
	if (!category) return null;
	if (category === 'Business Travel & Bleisure in China') return null;
	return INSPIRATION_CATEGORY_CTA[category] ?? null;
}
