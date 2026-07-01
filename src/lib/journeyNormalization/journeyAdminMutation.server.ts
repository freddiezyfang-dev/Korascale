import { query } from '@/lib/db';
import { normalizeAvailableDates } from '@/lib/journeyListQuery.server';
import type { Journey } from '@/types';
import {
	assertJourneySqlSafeForCurrentSchema,
	buildJourneyDualWritePayload,
	buildJourneyInsertSql,
	mergeExpandedColumnSql,
	normalizeJourneyStatusForWrite,
	type JourneyWriteStatus,
	type NormalizedColumnWritePolicy,
} from './write';
import {
	mergePublishCandidateWithUpdates,
	publishCandidateFromCreatePayload,
	publishCandidateFromDbRow,
	type JourneyDbRow,
} from './journeyPublishIntegrity.server';
import type { JourneyPublishCandidate } from './journeyPublishIntegrity';

const STRIPPED_MUTATION_KEYS = new Set([
	'id',
	'createdAt',
	'updatedAt',
	'seo_complete',
	'seoComplete',
	'role',
	'isAdmin',
]);

const JOURNEY_CREATE_SCALAR_KEYS = [
	'title',
	'slug',
	'description',
	'shortDescription',
	'price',
	'originalPrice',
	'category',
	'journeyType',
	'region',
	'place',
	'city',
	'location',
	'duration',
	'difficulty',
	'maxParticipants',
	'minParticipants',
	'image',
	'status',
	'featured',
	'rating',
	'reviewCount',
	'pageTitle',
	'metaDescription',
	'heroImage',
	'heroAlt',
	'heroImageAlt',
	'displayOrder',
] as const;

const JOURNEY_JSONB_KEYS = [
	'itinerary',
	'overview',
	'includes',
	'excludes',
	'modules',
	'heroStats',
	'images',
	'availableExperiences',
	'availableAccommodations',
	'experiences',
	'accommodations',
	'highlights',
	'included',
	'excluded',
	'requirements',
	'bestTimeToVisit',
	'tags',
	'navigation',
	'extensions',
	'hotels',
	'mainContentImage',
	'priceDetails',
	'standardInclusionsList',
	'availableDates',
	'standardInclusions',
	'offers',
	'destinationCount',
	'maxGuests',
	'relatedTrips',
] as const;

export type JourneySanitizedCreateBody = Partial<Journey> &
	Record<string, unknown> & {
		normalizedStatus: JourneyWriteStatus;
	};

export type JourneySanitizedUpdateBody = Partial<Journey> & Record<string, unknown>;

export type JourneyMutationOptions = {
	normalizedColumnWritePolicy?: NormalizedColumnWritePolicy;
};

export type JourneyCreateMutation = {
	publishCandidate: JourneyPublishCandidate;
	insertSql: string;
	insertParams: unknown[];
};

export type JourneyUpdateMutation = {
	publishCandidate: JourneyPublishCandidate;
	updateSql: string;
	updateValues: unknown[];
	hasUpdates: boolean;
};

function asRecord(raw: unknown): Record<string, unknown> {
	if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
		return {};
	}
	return raw as Record<string, unknown>;
}

function pickAllowedFields(
	raw: Record<string, unknown>,
	allowlist: readonly string[]
): Record<string, unknown> {
	const picked: Record<string, unknown> = {};
	for (const key of allowlist) {
		if (!(key in raw)) continue;
		if (STRIPPED_MUTATION_KEYS.has(key)) continue;
		picked[key] = raw[key];
	}
	return picked;
}

export function sanitizeJourneyCreateBody(raw: unknown): JourneySanitizedCreateBody {
	const body = asRecord(raw);
	for (const key of STRIPPED_MUTATION_KEYS) {
		delete body[key];
	}

	const picked = pickAllowedFields(body, [
		...JOURNEY_CREATE_SCALAR_KEYS,
		...JOURNEY_JSONB_KEYS,
	]) as JourneySanitizedCreateBody;

	const normalizedStatus = normalizeJourneyStatusForWrite(picked.status, 'draft');
	picked.status = normalizedStatus;
	picked.normalizedStatus = normalizedStatus;
	return picked;
}

export function sanitizeJourneyUpdateBody(raw: unknown): JourneySanitizedUpdateBody {
	const body = asRecord(raw);
	for (const key of STRIPPED_MUTATION_KEYS) {
		delete body[key];
	}

	return pickAllowedFields(body, [
		...JOURNEY_CREATE_SCALAR_KEYS,
		...JOURNEY_JSONB_KEYS,
	]) as JourneySanitizedUpdateBody;
}

export function buildCreatePublishCandidate(body: JourneySanitizedCreateBody): JourneyPublishCandidate {
	return publishCandidateFromCreatePayload(body, body.normalizedStatus);
}

export function buildUpdatePublishCandidate(
	existingRow: JourneyDbRow,
	body: JourneySanitizedUpdateBody
): JourneyPublishCandidate {
	return mergePublishCandidateWithUpdates(
		publishCandidateFromDbRow(existingRow),
		body
	);
}

function buildCreateJsonbData(body: JourneySanitizedCreateBody): Record<string, unknown> {
	const dualWrite = buildJourneyDualWritePayload({
		pageTitle: body.pageTitle as string | undefined,
		metaDescription: body.metaDescription as string | undefined,
		heroImage: body.heroImage as string | undefined,
		heroAlt:
			(body.heroAlt as string | undefined) ?? (body.heroImageAlt as string | undefined),
		journeyType: body.journeyType as string | undefined,
		shortDescription: body.shortDescription as string | undefined,
	});

	return {
		itinerary: body.itinerary || [],
		overview: body.overview || {},
		includes: body.includes || '',
		excludes: body.excludes || '',
		modules: body.modules || [],
		heroStats: body.heroStats || {},
		images: body.images || [],
		availableExperiences: body.availableExperiences || [],
		availableAccommodations: body.availableAccommodations || [],
		experiences: body.experiences || [],
		accommodations: body.accommodations || [],
		highlights: body.highlights || [],
		included: body.included || [],
		excluded: body.excluded || [],
		requirements: body.requirements || [],
		bestTimeToVisit: body.bestTimeToVisit || [],
		tags: body.tags || [],
		navigation: body.navigation || [],
		extensions: body.extensions || [],
		hotels: body.hotels || [],
		heroImage: body.heroImage || undefined,
		mainContentImage: body.mainContentImage || undefined,
		priceDetails: body.priceDetails ?? undefined,
		standardInclusionsList: body.standardInclusionsList ?? undefined,
		availableDates: normalizeAvailableDates(body.availableDates as unknown[] | undefined),
		pageTitle: body.pageTitle,
		metaDescription: body.metaDescription,
		...dualWrite.jsonb,
	};
}

export function buildJourneyCreateMutation(
	body: JourneySanitizedCreateBody,
	seoComplete: boolean,
	options: JourneyMutationOptions = {}
): JourneyCreateMutation {
	const columnPolicy = options.normalizedColumnWritePolicy ?? 'env-flag';
	const dualWrite = buildJourneyDualWritePayload({
		pageTitle: body.pageTitle as string | undefined,
		metaDescription: body.metaDescription as string | undefined,
		heroImage: body.heroImage as string | undefined,
		heroAlt:
			(body.heroAlt as string | undefined) ?? (body.heroImageAlt as string | undefined),
		journeyType: body.journeyType as string | undefined,
		shortDescription: body.shortDescription as string | undefined,
	});

	const jsonbData = buildCreateJsonbData(body);
	const dualWriteWithSeo = {
		...dualWrite,
		expandedColumns: {
			...dualWrite.expandedColumns,
			seo_complete: seoComplete,
			...(body.displayOrder !== undefined ? { display_order: body.displayOrder } : {}),
		},
	};

	const { sql: insertSql, expandedValues } = buildJourneyInsertSql(
		dualWriteWithSeo.expandedColumns,
		columnPolicy
	);
	if (columnPolicy === 'env-flag') {
		assertJourneySqlSafeForCurrentSchema(insertSql);
	}

	const insertParams = [
		JSON.stringify(jsonbData),
		body.title,
		body.slug,
		body.description || null,
		body.shortDescription || null,
		body.price || 0,
		body.originalPrice || null,
		body.category || null,
		body.journeyType || null,
		body.region || null,
		body.place || null,
		body.city || null,
		body.location || null,
		body.duration || null,
		body.difficulty || 'Easy',
		body.maxParticipants || 12,
		body.minParticipants || 2,
		body.image || null,
		body.normalizedStatus,
		body.featured || false,
		body.rating || 0,
		body.reviewCount || 0,
		...expandedValues,
	];

	return {
		publishCandidate: buildCreatePublishCandidate(body),
		insertSql,
		insertParams,
	};
}

export async function buildJourneyUpdateMutation(
	journeyId: string,
	existingRow: JourneyDbRow,
	body: JourneySanitizedUpdateBody,
	seoComplete: boolean,
	options: JourneyMutationOptions = {}
): Promise<JourneyUpdateMutation> {
	const columnPolicy = options.normalizedColumnWritePolicy ?? 'env-flag';
	const updateFields: string[] = [];
	const updateValues: unknown[] = [];
	let paramIndex = 1;
	const jsonbUpdates: Record<string, unknown> = {};

	if (body.title !== undefined) {
		updateFields.push(`title = $${paramIndex++}`);
		updateValues.push(body.title);
	}
	if (body.slug !== undefined) {
		updateFields.push(`slug = $${paramIndex++}`);
		updateValues.push(body.slug);
	}
	if (body.description !== undefined) {
		updateFields.push(`description = $${paramIndex++}`);
		updateValues.push(body.description);
	}
	if (body.shortDescription !== undefined) {
		updateFields.push(`short_description = $${paramIndex++}`);
		updateValues.push(body.shortDescription);
	}
	if (body.price !== undefined) {
		updateFields.push(`price = $${paramIndex++}`);
		updateValues.push(body.price);
	}
	if (body.originalPrice !== undefined) {
		updateFields.push(`original_price = $${paramIndex++}`);
		updateValues.push(body.originalPrice);
	}
	if (body.category !== undefined) {
		updateFields.push(`category = $${paramIndex++}`);
		updateValues.push(body.category);
	}
	if (body.journeyType !== undefined) {
		updateFields.push(`journey_type = $${paramIndex++}`);
		updateValues.push(body.journeyType);
	}
	if (body.location !== undefined) {
		updateFields.push(`location = $${paramIndex++}`);
		updateValues.push(body.location);
	}
	if (body.city !== undefined) {
		updateFields.push(`city = $${paramIndex++}`);
		updateValues.push(body.city);
	}
	if (body.region !== undefined) {
		updateFields.push(`region = $${paramIndex++}`);
		updateValues.push(body.region);
	}
	if (body.place !== undefined) {
		try {
			const { rows: columnCheck } = await query(`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'journeys' AND column_name = 'place'
        `);
			if (columnCheck.length > 0) {
				updateFields.push(`place = $${paramIndex++}`);
				updateValues.push(body.place);
			} else {
				jsonbUpdates.place = body.place;
			}
		} catch {
			jsonbUpdates.place = body.place;
		}
	}
	if (body.duration !== undefined) {
		updateFields.push(`duration = $${paramIndex++}`);
		updateValues.push(body.duration);
	}
	if (body.difficulty !== undefined) {
		updateFields.push(`difficulty = $${paramIndex++}`);
		updateValues.push(body.difficulty);
	}
	if (body.maxParticipants !== undefined) {
		updateFields.push(`max_participants = $${paramIndex++}`);
		updateValues.push(body.maxParticipants);
	}
	if (body.minParticipants !== undefined) {
		updateFields.push(`min_participants = $${paramIndex++}`);
		updateValues.push(body.minParticipants);
	}
	if (body.image !== undefined) {
		updateFields.push(`image = $${paramIndex++}`);
		updateValues.push(body.image);
	}
	if (body.status !== undefined) {
		updateFields.push(`status = $${paramIndex++}`);
		updateValues.push(normalizeJourneyStatusForWrite(body.status));
	}
	if (body.featured !== undefined) {
		updateFields.push(`featured = $${paramIndex++}`);
		updateValues.push(body.featured);
	}
	if (body.rating !== undefined) {
		updateFields.push(`rating = $${paramIndex++}`);
		updateValues.push(body.rating);
	}
	if (body.reviewCount !== undefined) {
		updateFields.push(`review_count = $${paramIndex++}`);
		updateValues.push(body.reviewCount);
	}

	if (body.itinerary !== undefined) jsonbUpdates.itinerary = body.itinerary;
	if (body.overview !== undefined) jsonbUpdates.overview = body.overview;
	if (body.includes !== undefined) jsonbUpdates.includes = body.includes;
	if (body.excludes !== undefined) jsonbUpdates.excludes = body.excludes;
	if (body.images !== undefined) jsonbUpdates.images = body.images;
	if (body.highlights !== undefined) jsonbUpdates.highlights = body.highlights;
	if (body.experiences !== undefined) jsonbUpdates.experiences = body.experiences;
	if (body.accommodations !== undefined) jsonbUpdates.accommodations = body.accommodations;
	if (body.availableExperiences !== undefined) {
		jsonbUpdates.availableExperiences = body.availableExperiences;
	}
	if (body.availableAccommodations !== undefined) {
		jsonbUpdates.availableAccommodations = body.availableAccommodations;
	}
	if (body.availableDates !== undefined) {
		jsonbUpdates.availableDates = normalizeAvailableDates(body.availableDates as unknown[]);
	}
	if (body.included !== undefined) jsonbUpdates.included = body.included;
	if (body.excluded !== undefined) jsonbUpdates.excluded = body.excluded;
	if (body.heroStats !== undefined) jsonbUpdates.heroStats = body.heroStats;
	if (body.navigation !== undefined) jsonbUpdates.navigation = body.navigation;
	if (body.pageTitle !== undefined) jsonbUpdates.pageTitle = body.pageTitle;
	if (body.metaDescription !== undefined) jsonbUpdates.metaDescription = body.metaDescription;
	if (body.heroImage !== undefined) jsonbUpdates.heroImage = body.heroImage;
	if (body.heroAlt !== undefined) {
		jsonbUpdates.heroAlt = body.heroAlt;
		jsonbUpdates.heroImageAlt = body.heroAlt;
	}
	if (body.mainContentImage !== undefined) jsonbUpdates.mainContentImage = body.mainContentImage;
	if (body.destinationCount !== undefined) jsonbUpdates.destinationCount = body.destinationCount;
	if (body.maxGuests !== undefined) jsonbUpdates.maxGuests = body.maxGuests;
	if (body.modules !== undefined) jsonbUpdates.modules = body.modules;
	if (body.relatedTrips !== undefined) jsonbUpdates.relatedTrips = body.relatedTrips;
	if (body.offers !== undefined) jsonbUpdates.offers = body.offers;
	if (body.standardInclusions !== undefined) {
		jsonbUpdates.standardInclusions = body.standardInclusions;
	}
	if (body.standardInclusionsList !== undefined) {
		jsonbUpdates.standardInclusionsList = body.standardInclusionsList;
	}
	if (body.priceDetails !== undefined) jsonbUpdates.priceDetails = body.priceDetails;
	if (body.extensions !== undefined) jsonbUpdates.extensions = body.extensions;
	if (body.hotels !== undefined) jsonbUpdates.hotels = body.hotels;

	const dualWrite = buildJourneyDualWritePayload({
		pageTitle: body.pageTitle as string | undefined,
		metaDescription: body.metaDescription as string | undefined,
		heroImage: body.heroImage as string | undefined,
		heroAlt:
			(body.heroAlt as string | undefined) ?? (body.heroImageAlt as string | undefined),
		journeyType: body.journeyType as string | undefined,
		shortDescription: body.shortDescription as string | undefined,
	});
	Object.assign(jsonbUpdates, dualWrite.jsonb);

	if (Object.keys(jsonbUpdates).length > 0) {
		try {
			const { rows } = await query('SELECT data FROM journeys WHERE id = $1', [journeyId]);
			const existingData = (rows[0]?.data as Record<string, unknown>) || {};
			const mergedData = {
				...existingData,
				...jsonbUpdates,
				standardInclusions:
					jsonbUpdates.standardInclusions !== undefined
						? jsonbUpdates.standardInclusions
						: existingData.standardInclusions,
				offers: jsonbUpdates.offers !== undefined ? jsonbUpdates.offers : existingData.offers,
				maxGuests:
					jsonbUpdates.maxGuests !== undefined ? jsonbUpdates.maxGuests : existingData.maxGuests,
			};
			updateFields.push(`data = $${paramIndex++}`);
			updateValues.push(JSON.stringify(mergedData));
		} catch {
			updateFields.push(`data = $${paramIndex++}`);
			updateValues.push(JSON.stringify(jsonbUpdates));
		}
	}

	const expandedMerge = mergeExpandedColumnSql(
		{
			...dualWrite.expandedColumns,
			seo_complete: seoComplete,
			...(body.displayOrder !== undefined ? { display_order: body.displayOrder } : {}),
		},
		paramIndex,
		columnPolicy
	);
	updateFields.push(...expandedMerge.fields);
	updateValues.push(...expandedMerge.values);
	paramIndex = expandedMerge.nextIndex;

	const hasUpdates = updateFields.length > 0;
	if (hasUpdates) {
		updateFields.push(`updated_at = NOW()`);
	}

	const updateSql = hasUpdates
		? `
      UPDATE journeys
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, updated_at
    `
		: '';

	if (columnPolicy === 'env-flag' && updateSql) {
		assertJourneySqlSafeForCurrentSchema(updateSql);
	}

	return {
		publishCandidate: buildUpdatePublishCandidate(existingRow, body),
		updateSql,
		updateValues: hasUpdates ? [...updateValues, journeyId] : updateValues,
		hasUpdates,
	};
}