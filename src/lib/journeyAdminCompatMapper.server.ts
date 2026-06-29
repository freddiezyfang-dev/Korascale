/**
 * Admin/API compatibility mapper — column first, legacy JSONB fallbacks allowed.
 * Do not import from public page runtime paths.
 */
import {
	resolveAdminCompatHeroImageAlt,
	resolveAdminCompatHeroImageUrl,
	resolveAdminCompatJourneyTypeSlug,
	resolveAdminCompatMetaDescription,
	resolveAdminCompatPageTitle,
} from '@/lib/journeyNormalization/adminCompatFields';
import { JOURNEY_TYPE_LABELS } from '@/lib/journeyNormalization/constants';
import { buildJourneyFromRow } from '@/lib/journeyRowBuild.server';
import type { Journey } from '@/types';

export function mapJourneyRowToAdminCompatJourney(row: Record<string, unknown>): Journey {
	const typeSlug = resolveAdminCompatJourneyTypeSlug(row).value;
	return buildJourneyFromRow(row, {
		pageTitle: resolveAdminCompatPageTitle(row).value,
		metaDescription: resolveAdminCompatMetaDescription(row).value,
		heroImageUrl: resolveAdminCompatHeroImageUrl(row).value,
		heroImageAlt: resolveAdminCompatHeroImageAlt(row).value,
		journeyTypeLabel: typeSlug ? JOURNEY_TYPE_LABELS[typeSlug] : undefined,
	});
}

/** @deprecated Use mapJourneyRowToAdminCompatJourney or mapJourneyRowToPublicJourney. */
export const mapJourneyRowToJourney = mapJourneyRowToAdminCompatJourney;
