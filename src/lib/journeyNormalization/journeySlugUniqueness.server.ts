import { query } from '@/lib/db';
import {
	JOURNEY_SLUG_CONFLICT_ERROR,
	buildJourneySlugConflictBody,
	isJourneySlugUniquenessViolation,
	type JourneySlugConflictBody,
	type JourneySlugConflictFieldError,
} from './journeySlugConflictConstants';
import { normalizeJourneySlugForComparison } from './slug';
import type { JourneyPublishCandidate } from './journeyPublishIntegrity';

export {
	JOURNEY_SLUG_CONFLICT_ERROR,
	buildJourneySlugConflictBody,
	isJourneySlugUniquenessViolation,
	type JourneySlugConflictBody,
	type JourneySlugConflictFieldError,
};

export async function findJourneySlugConflict(
	comparisonSlug: string,
	excludeJourneyId?: string
): Promise<boolean> {
	if (!comparisonSlug) return false;
	const { rows } = await query('SELECT id, slug FROM journeys');
	for (const row of rows) {
		if (excludeJourneyId && String(row.id) === String(excludeJourneyId)) continue;
		const otherComparison = normalizeJourneySlugForComparison(row.slug);
		if (otherComparison === comparisonSlug) return true;
	}
	return false;
}

export function resolveCandidateComparisonSlug(candidate: JourneyPublishCandidate): string | null {
	return normalizeJourneySlugForComparison(candidate.slug);
}

export async function runJourneySlugUniquenessPreCheck(
	candidate: JourneyPublishCandidate
): Promise<{ conflict: boolean; comparisonSlug: string | null }> {
	const comparisonSlug = resolveCandidateComparisonSlug(candidate);
	if (!comparisonSlug) {
		return { conflict: false, comparisonSlug: null };
	}
	const conflict = await findJourneySlugConflict(comparisonSlug, candidate.id);
	return { conflict, comparisonSlug };
}
