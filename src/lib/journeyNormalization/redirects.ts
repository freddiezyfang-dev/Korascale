/**
 * Version-controlled permanent redirects for known Journey slug fixes.
 * Next.js `permanent: true` → HTTP 308 (Permanent Redirect).
 */
export const JOURNEY_SLUG_REDIRECTS: Readonly<Record<string, string>> = {
	'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-':
		'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour',
};

export function getJourneySlugRedirect(sourceSlug: string): string | null {
	const normalized = sourceSlug.replace(/^\/journeys\//i, '').replace(/^\/+|\/+$/g, '').trim();
	return JOURNEY_SLUG_REDIRECTS[normalized] ?? null;
}

export function buildJourneySlugRedirectConfig(): Array<{
	source: string;
	destination: string;
	permanent: true;
}> {
	return Object.entries(JOURNEY_SLUG_REDIRECTS).map(([from, to]) => ({
		source: `/journeys/${from}`,
		destination: `/journeys/${to}`,
		permanent: true,
	}));
}

export function isRedirectingOldSlug(slug: string): boolean {
	const normalized = slug.replace(/^\/journeys\//i, '').replace(/^\/+|\/+$/g, '').trim();
	return normalized in JOURNEY_SLUG_REDIRECTS;
}

/**
 * DB lookup for canonical request only: try canonical slug, then legacy DB row slug.
 * Legacy slug requests must redirect (308) before reaching DB lookup.
 */
export function getJourneySlugDbLookupCandidates(requestedSlug: string): string[] {
	const normalized = requestedSlug.replace(/^\/journeys\//i, '').replace(/^\/+|\/+$/g, '').trim();
	if (!normalized) return [];

	// Legacy slug in URL → do not serve 200; redirect layer handles this first.
	if (isRedirectingOldSlug(normalized)) {
		return [];
	}

	const candidates = new Set<string>([normalized]);
	for (const [legacySlug, canonicalSlug] of Object.entries(JOURNEY_SLUG_REDIRECTS)) {
		if (canonicalSlug === normalized) {
			candidates.add(legacySlug);
		}
	}
	return [...candidates];
}

/** @deprecated Use getJourneySlugDbLookupCandidates */
export const getJourneySlugLookupCandidates = getJourneySlugDbLookupCandidates;
