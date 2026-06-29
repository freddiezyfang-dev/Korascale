import {
	resolveAdminCompatHeroImageAlt,
	resolveAdminCompatHeroImageUrl,
	resolveAdminCompatJourneyTypeSlug,
	resolveAdminCompatMetaDescription,
	resolveAdminCompatPageTitle,
} from './adminCompatFields';
import type { JourneyRowLike } from './types';

export type { JourneyFieldReadSource, ResolvedJourneyField } from './fieldsLegacyTypes';

/** @deprecated Public runtime must use publicNormalizedFields.ts (PR-J3A). */
export const resolvePageTitle = resolveAdminCompatPageTitle;

/** @deprecated Public runtime must use publicNormalizedFields.ts (PR-J3A). */
export const resolveMetaDescription = resolveAdminCompatMetaDescription;

/** @deprecated Public runtime must use publicNormalizedFields.ts (PR-J3A). */
export const resolveHeroImageUrl = resolveAdminCompatHeroImageUrl;

/** @deprecated Public runtime must use publicNormalizedFields.ts (PR-J3A). */
export const resolveHeroImageAlt = resolveAdminCompatHeroImageAlt;

/** @deprecated Public runtime must use publicNormalizedFields.ts (PR-J3A). */
export const resolveJourneyTypeSlug = resolveAdminCompatJourneyTypeSlug;

export const JOURNEY_SOURCE_OF_TRUTH_MATRIX = {
	pageTitle: {
		read: 'PUBLIC: page_title column only | ADMIN: page_title → data.pageTitle → title',
		write: 'dual-write: column + data.pageTitle when JOURNEY_NORMALIZATION_COLUMNS=1',
		legacyFallback: 'title (admin compat only)',
		futureRemoval: 'data.pageTitle after admin cutover',
	},
	metaDescription: {
		read: 'PUBLIC: meta_description column only | ADMIN: column → JSONB → short_description',
		write: 'dual-write when flag on',
		legacyFallback: 'short_description (admin compat only)',
		futureRemoval: 'data.metaDescription',
	},
	heroImageUrl: {
		read: 'PUBLIC: hero_image_url column only | ADMIN: column → data.heroImage → image',
		write: 'dual-write when flag on',
		legacyFallback: 'image (admin compat only)',
		futureRemoval: 'data.heroImage',
	},
	heroImageAlt: {
		read: 'PUBLIC: hero_image_alt column only | ADMIN: column → data.heroAlt',
		write: 'dual-write when flag on',
		legacyFallback: 'none',
		futureRemoval: 'data.heroAlt',
	},
	journeyTypeSlug: {
		read: 'PUBLIC: journey_type_slug column only | ADMIN: column → journey_type → data.journeyType',
		write: 'dual-write when flag on',
		legacyFallback: 'journey_type display label (admin compat only)',
		futureRemoval: 'journey_type label after route cutover',
	},
	price: {
		read: 'price_from + currency + price_basis (flag on) → price + data.*',
		write: 'manual only; never guess currency/basis',
		legacyFallback: 'price column + JSONB',
		futureRemoval: 'data.price currency fields',
	},
	status: {
		read: 'status column (inactive read as archived in UI)',
		write: 'archived (reject new inactive)',
		legacyFallback: 'inactive until 025B',
		futureRemoval: 'inactive vocabulary',
	},
} as const;

export type { JourneyRowLike };
