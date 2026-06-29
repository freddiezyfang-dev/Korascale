/**
 * Server-only public journey list queries (direct DB). Do not import from Client Components.
 * Admin compatibility mapping lives in journeyAdminCompatMapper.server.ts.
 */
import { query } from '@/lib/db';
import { JOURNEY_TYPE_LABELS } from '@/lib/journeyNormalization/constants';
import {
	resolvePublicNormalizedHeroImageAlt,
	resolvePublicNormalizedHeroImageUrl,
	resolvePublicNormalizedJourneyTypeSlug,
	resolvePublicNormalizedMetaDescription,
	resolvePublicNormalizedPageTitle,
} from '@/lib/journeyNormalization/publicNormalizedFields';
import { buildPublicStatusWhereClause } from '@/lib/journeyNormalization/status';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';
import { buildJourneyFromRow, normalizeAvailableDates } from '@/lib/journeyRowBuild.server';
import type { Journey } from '@/types';

export { normalizeAvailableDates } from '@/lib/journeyRowBuild.server';

export const PUBLIC_JOURNEY_NORMALIZED_SELECT_COLUMNS = `
            page_title, meta_description, hero_image_url, hero_image_alt, journey_type_slug,
          `;

export type JourneyListFields = 'full' | 'minimal' | 'list';

/** Public runtime mapper — normalized columns only (PR-J3A). */
export function mapJourneyRowToPublicJourney(row: Record<string, unknown>): Journey {
	const typed = row as JourneyRowLike;
	const typeSlug = resolvePublicNormalizedJourneyTypeSlug(typed).value;
	return buildJourneyFromRow(row, {
		pageTitle: resolvePublicNormalizedPageTitle(typed).value,
		metaDescription: resolvePublicNormalizedMetaDescription(typed).value,
		heroImageUrl: resolvePublicNormalizedHeroImageUrl(typed).value,
		heroImageAlt: resolvePublicNormalizedHeroImageAlt(typed).value,
		journeyTypeLabel: typeSlug ? JOURNEY_TYPE_LABELS[typeSlug] : undefined,
	});
}

export async function queryJourneyRows(options?: {
	includeAll?: boolean;
	fields?: JourneyListFields;
}): Promise<Record<string, unknown>[]> {
	const includeAll = options?.includeAll ?? false;
	const fields = options?.fields ?? 'list';
	const minimalFields = fields === 'minimal';
	const listFields = fields === 'list';

	const statusCondition = includeAll ? '' : `WHERE ${buildPublicStatusWhereClause()}`;

	const limit = listFields ? 500 : 1000;

	const selectClause = minimalFields
		? `
          SELECT id, slug, title
          FROM journeys
        `
		: listFields
			? `
          SELECT
            id, title, slug, description, short_description,
            price, original_price, category, journey_type, region, place, city, location,
            duration, difficulty, max_participants, min_participants,
            image, status, featured, rating, review_count,
            ${PUBLIC_JOURNEY_NORMALIZED_SELECT_COLUMNS}
            (data - 'itinerary') as data, created_at, updated_at
          FROM journeys
        `
			: `
          SELECT
            id, title, slug, description, short_description,
            price, original_price, category, journey_type, region, place, city, location,
            duration, difficulty, max_participants, min_participants,
            image, status, featured, rating, review_count,
            ${PUBLIC_JOURNEY_NORMALIZED_SELECT_COLUMNS}
            data, created_at, updated_at
          FROM journeys
        `;

	const result = await query(`
    ${selectClause}
    ${statusCondition}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);

	return result.rows as Record<string, unknown>[];
}

/** Active journeys for public list pages (SSR). */
export async function fetchActiveJourneysForListFromDb(): Promise<Journey[]> {
	const rows = await queryJourneyRows({ includeAll: false, fields: 'list' });
	return rows.map(mapJourneyRowToPublicJourney);
}

/** Active journeys for a journey type label (SSR type pages). */
export async function fetchActiveJourneysByTypeFromDb(
	journeyTypeLabel: string
): Promise<Journey[]> {
	const rows = await queryJourneyRows({ includeAll: false, fields: 'list' });
	return rows
		.map(mapJourneyRowToPublicJourney)
		.filter((journey) => journey.journeyType === journeyTypeLabel);
}
