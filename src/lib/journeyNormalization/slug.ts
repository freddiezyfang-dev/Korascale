import { JOURNEY_SLUG_RESERVED_SEGMENTS } from './constants';
import type { JourneyRowLike, SlugIssueCode, SlugProposal } from './types';

export function pickFirstNonEmptyString(...values: unknown[]): string {
	for (const value of values) {
		if (typeof value === 'string' && value.trim()) return value.trim();
	}
	return '';
}

/** Strip `/journeys/` prefix and outer slashes for canonical slug comparison. */
export function stripJourneySlugPathPrefix(slug: string): string {
	return slug.replace(/^\/journeys\//i, '').replace(/^\/+|\/+$/g, '').trim();
}

export function normalizeJourneySlug(raw: unknown): string | null {
	if (raw == null) return null;
	const stripped = stripJourneySlugPathPrefix(String(raw));
	if (!stripped) return null;
	return stripped
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function detectSlugIssues(
	slug: string | null,
	options?: { duplicateCount?: number }
): SlugIssueCode[] {
	const issues: SlugIssueCode[] = [];
	if (slug == null) {
		issues.push('null');
		return issues;
	}
	if (slug === '') {
		issues.push('empty');
		return issues;
	}
	if (typeof slug === 'string' && slug !== slug.trim()) issues.push('trim');
	if (/^\/journeys\//i.test(slug) || slug.startsWith('/')) issues.push('path_prefix');
	if (/[A-Z]/.test(slug)) issues.push('uppercase');
	if (/[^\x00-\x7F]/.test(slug)) issues.push('non_ascii');
	if (/--/.test(slug)) issues.push('double_hyphen');
	if (slug.endsWith('-')) issues.push('trailing_hyphen');
	if (slug.startsWith('-')) issues.push('leading_hyphen');
	const firstSegment = stripJourneySlugPathPrefix(slug).split('/')[0];
	if (JOURNEY_SLUG_RESERVED_SEGMENTS.includes(firstSegment as (typeof JOURNEY_SLUG_RESERVED_SEGMENTS)[number])) {
		issues.push('reserved');
	}
	if ((options?.duplicateCount ?? 0) > 1) issues.push('duplicate');
	return issues;
}

export function isValidCanonicalSlug(slug: string | null, issues: SlugIssueCode[] = []): boolean {
	if (!slug) return false;
	if (issues.length > 0) return false;
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function proposeJourneySlug(
	row: JourneyRowLike,
	options?: { duplicateCount?: number; takenSlugs?: Set<string>; proposedSlugCounts?: Map<string, number> }
): SlugProposal {
	const currentRaw = row.slug == null ? null : String(row.slug);
	const current = currentRaw ? stripJourneySlugPathPrefix(currentRaw) : null;
	const issues = detectSlugIssues(currentRaw, options);

	let proposed = current ? normalizeJourneySlug(current) : null;
	let manualReviewRequired = false;
	const reasons: string[] = [];

	if (issues.includes('path_prefix')) {
		manualReviewRequired = true;
		reasons.push('Slug contains /journeys/ path prefix');
	}

	if (issues.includes('trailing_hyphen') && proposed) {
		reasons.push('Remove trailing hyphen for canonical slug');
	}

	const proposedCollisions = proposed ? options?.proposedSlugCounts?.get(proposed) ?? 0 : 0;
	if (
		proposed &&
		proposedCollisions > 1 &&
		proposed !== current
	) {
		manualReviewRequired = true;
		reasons.push('Normalized slug collides with another journey');
	} else if (proposed && options?.takenSlugs?.has(proposed) && proposed !== current) {
		manualReviewRequired = true;
		reasons.push('Normalized slug collides with another journey');
	}

	if (!proposed) {
		manualReviewRequired = true;
		reasons.push('Cannot derive canonical slug');
	}

	const redirectRequired = Boolean(current && proposed && current !== proposed);

	if (issues.includes('duplicate')) {
		manualReviewRequired = true;
		reasons.push('Duplicate slug detected');
	}

	if (issues.includes('reserved')) {
		manualReviewRequired = true;
		reasons.push('Slug conflicts with reserved route segment');
	}

	return {
		current,
		proposed,
		issues,
		redirectRequired,
		manualReviewRequired,
		reason: reasons.join('; ') || 'No slug changes required',
	};
}

export function assertCanonicalSlugUnique(
	slug: string,
	slugToIds: Map<string, string[]>
): { unique: boolean; collisionIds: string[] } {
	const ids = slugToIds.get(slug) ?? [];
	return { unique: ids.length <= 1, collisionIds: ids };
}
