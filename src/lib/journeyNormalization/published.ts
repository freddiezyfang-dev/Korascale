import { isPublicJourneyStatusCompat } from './status';
import type { JourneyRowLike } from './types';

/**
 * Whether a Journey is publicly published (list/detail/sitemap).
 * Source of truth: `status` column only — NOT seo_complete.
 */
export function isJourneyPublished(status: unknown): boolean {
	return isPublicJourneyStatusCompat(status);
}

export function isJourneyRowPublished(row: JourneyRowLike): boolean {
	return isJourneyPublished(row.status);
}

/** @deprecated Use isJourneyPublished — kept for transitional imports */
export const isJourneyPublicStatusCompat = isJourneyPublished;
