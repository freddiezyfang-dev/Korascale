/**
 * Shared journey row → Journey object builders (server-only).
 */
import { pickFirstValidImagePath, sanitizeImageList, sanitizeImagePath } from '@/lib/imageUtils';
import type { Journey } from '@/types';

export function normalizeAvailableDates(items: unknown[] | undefined): unknown[] {
	if (!Array.isArray(items)) return [];
	return items.map((item) => {
		const row = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
		return {
			...row,
			enabled: typeof row.enabled === 'boolean' ? row.enabled : true,
		};
	});
}

export function sanitizeJourneyBaseData(baseData: Record<string, unknown>) {
	const safeImages = sanitizeImageList(baseData?.images as string[] | undefined);
	const overview = baseData?.overview as Record<string, unknown> | undefined;
	const safeOverview = overview
		? {
				...overview,
				sideImage: sanitizeImagePath(overview.sideImage as string | undefined),
			}
		: undefined;
	const itinerary = baseData?.itinerary;
	const safeItinerary = Array.isArray(itinerary)
		? itinerary.map((item: Record<string, unknown>) => ({
				...item,
				image: sanitizeImagePath(item?.image as string | undefined),
			}))
		: [];

	return {
		...baseData,
		images: safeImages,
		overview: safeOverview,
		itinerary: safeItinerary,
		heroImage: sanitizeImagePath(baseData?.heroImage as string | undefined),
		mainContentImage: sanitizeImagePath(baseData?.mainContentImage as string | undefined),
		availableDates: normalizeAvailableDates(baseData?.availableDates as unknown[] | undefined),
	};
}

export function buildJourneyFromRow(
	row: Record<string, unknown>,
	seo: {
		pageTitle: string;
		metaDescription: string;
		heroImageUrl: string;
		heroImageAlt: string;
		journeyTypeLabel: string | undefined;
	}
): Journey {
	const baseData = sanitizeJourneyBaseData(
		(row.data as Record<string, unknown>) || {}
	) as Record<string, unknown>;

	const safePrimaryImage = pickFirstValidImagePath(
		seo.heroImageUrl,
		row.image as string | undefined,
		baseData.mainContentImage as string | undefined,
		(baseData.images as string[] | undefined)?.[0]
	);
	const resolvedTitle = (row.title as string) || (baseData.title as string) || seo.pageTitle || '';
	const resolvedSlug = (row.slug as string) || (baseData.slug as string) || '';

	return {
		...baseData,
		id: row.id as string,
		title: resolvedTitle,
		slug: resolvedSlug,
		pageTitle: seo.pageTitle || resolvedTitle,
		metaDescription: seo.metaDescription,
		description: (row.description as string) || '',
		shortDescription: (row.short_description as string) || '',
		price: row.price as number,
		originalPrice: row.original_price as number | undefined,
		category: row.category as Journey['category'],
		journeyType: (seo.journeyTypeLabel as Journey['journeyType']) || undefined,
		region: row.region as Journey['region'],
		place: (row.place as string) || undefined,
		city: row.city as string,
		location: row.location as string,
		duration: row.duration as string,
		difficulty: row.difficulty as Journey['difficulty'],
		maxParticipants: row.max_participants as number,
		minParticipants: row.min_participants as number,
		image: safePrimaryImage,
		status: row.status as Journey['status'],
		featured: row.featured as boolean,
		rating: row.rating as number,
		reviewCount: row.review_count as number,
		destinationCount: baseData.destinationCount as number | undefined,
		maxGuests: baseData.maxGuests as number | undefined,
		heroImage: pickFirstValidImagePath(seo.heroImageUrl, safePrimaryImage),
		heroAlt: seo.heroImageAlt || undefined,
		mainContentImage: sanitizeImagePath(baseData.mainContentImage as string | undefined),
		images: sanitizeImageList(baseData.images as string[] | undefined),
		availableDates: normalizeAvailableDates(baseData.availableDates as unknown[] | undefined),
		createdAt: new Date(row.created_at as string),
		updatedAt: new Date(row.updated_at as string),
	} as Journey;
}
