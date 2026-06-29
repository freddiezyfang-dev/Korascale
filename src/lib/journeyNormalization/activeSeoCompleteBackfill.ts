import { resolveJourneyTypeSlug } from './fields';
import { evaluateJourneySeoCompleteness } from './seo';
import { isValidCanonicalSlug, normalizeJourneySlug } from './slug';
import { maskDatabaseIdentity } from './statusBackfill';
import { isJourneyTypeSlug } from './taxonomy';
import type { JourneyRowLike } from './types';

export const PR_J2B4_EXCLUDED_ID = 'e468b842-7c59-4258-8d56-8b585566be82';
export const PR_J2B4_MANIFEST_COUNT = 24;
export const PR_J2B4_EXPECTED_TOTAL = 83;
export const PR_J2B4_EXPECTED_ACTIVE = 24;
export const PR_J2B4_EXPECTED_ARCHIVED = 59;

export type B4SeoCompleteManifestEntry = {
	id: string;
	slug: string;
	seoComplete: { proposed: true; source: 'evaluator_pass' };
	eligible: boolean;
	missing: string[];
	manualReview: boolean;
	reason: string;
};

export type B4SeoCompletePreflightResult = {
	ready: boolean;
	databaseIdentity: string;
	total: number;
	active: number;
	archived: number;
	manifestCount: number;
	missingManifestIds: string[];
	statusMismatchIds: string[];
	slugMismatchIds: string[];
	eligibleCount: number;
	ineligibleIds: string[];
	seoCompleteAlreadyTrue: number;
	manualReviewIds: string[];
};

function columnValue(row: JourneyRowLike, column: string): unknown {
	return (row as Record<string, unknown>)[column];
}

function nonEmptyString(value: unknown): boolean {
	return typeof value === 'string' && value.trim() !== '';
}

/**
 * B4 eligibility — extends evaluateJourneySeoCompleteness with active status
 * and journey_type_slug. Does NOT gate public indexability.
 */
export function evaluateActiveSeoCompleteEligibility(row: JourneyRowLike): {
	eligible: boolean;
	missing: string[];
} {
	const missing: string[] = [];

	if (String(row.status ?? '').trim().toLowerCase() !== 'active') {
		missing.push('status_not_active');
	}

	const slug = normalizeJourneySlug(row.slug);
	if (!slug || !isValidCanonicalSlug(slug)) {
		missing.push('slug_invalid');
	}

	if (!nonEmptyString(row.title)) missing.push('title');
	if (!nonEmptyString(columnValue(row, 'page_title'))) missing.push('page_title');
	if (!nonEmptyString(columnValue(row, 'meta_description'))) missing.push('meta_description');
	if (!nonEmptyString(row.short_description)) missing.push('excerpt');

	const seo = evaluateJourneySeoCompleteness(row);
	for (const field of seo.missing) {
		if (!missing.includes(field)) missing.push(field);
	}

	const typeSlug = resolveJourneyTypeSlug(row);
	if (!typeSlug.value || !isJourneyTypeSlug(typeSlug.value)) {
		missing.push('journey_type_slug');
	}

	return { eligible: missing.length === 0, missing };
}

export function buildB4SeoCompleteManifestEntry(row: JourneyRowLike): B4SeoCompleteManifestEntry {
	const eligibility = evaluateActiveSeoCompleteEligibility(row);
	const manualReview =
		!eligibility.eligible || String(row.id).toLowerCase() === PR_J2B4_EXCLUDED_ID;

	return {
		id: String(row.id ?? ''),
		slug: String(row.slug ?? ''),
		seoComplete: { proposed: true, source: 'evaluator_pass' },
		eligible: eligibility.eligible,
		missing: eligibility.missing,
		manualReview,
		reason: manualReview ? 'manual review required' : 'active seo_complete backfill candidate',
	};
}

export function evaluateB4SeoCompletePreflight(
	rows: JourneyRowLike[],
	manifest: readonly B4SeoCompleteManifestEntry[],
	options: { databaseIdentity: string }
): B4SeoCompletePreflightResult {
	const activeRows = rows.filter((r) => String(r.status) === 'active');
	const rowById = new Map(rows.map((r) => [String(r.id).toLowerCase(), r]));
	const manifestIds = new Set(manifest.map((e) => e.id));

	const missingManifestIds = manifest
		.filter((e) => !rowById.has(e.id.toLowerCase()))
		.map((e) => e.id);
	const statusMismatchIds = manifest
		.filter(
			(e) =>
				rowById.get(e.id.toLowerCase()) &&
				String(rowById.get(e.id.toLowerCase())!.status) !== 'active'
		)
		.map((e) => e.id);
	const slugMismatchIds = manifest
		.filter(
			(e) =>
				rowById.get(e.id.toLowerCase()) &&
				String(rowById.get(e.id.toLowerCase())!.slug) !== e.slug
		)
		.map((e) => e.id);

	const eligibleCount = manifest.filter((e) => e.eligible).length;
	const ineligibleIds = manifest.filter((e) => !e.eligible).map((e) => e.id);
	const manualReviewIds = manifest.filter((e) => e.manualReview).map((e) => e.id);
	const seoCompleteAlreadyTrue = activeRows.filter((r) => columnValue(r, 'seo_complete') === true).length;

	const ready =
		rows.length === PR_J2B4_EXPECTED_TOTAL &&
		activeRows.length === PR_J2B4_EXPECTED_ACTIVE &&
		rows.filter((r) => String(r.status) === 'archived').length === PR_J2B4_EXPECTED_ARCHIVED &&
		manifest.length === PR_J2B4_MANIFEST_COUNT &&
		missingManifestIds.length === 0 &&
		statusMismatchIds.length === 0 &&
		slugMismatchIds.length === 0 &&
		eligibleCount === PR_J2B4_MANIFEST_COUNT &&
		manualReviewIds.length === 0 &&
		seoCompleteAlreadyTrue === 0 &&
		!manifestIds.has(PR_J2B4_EXCLUDED_ID);

	return {
		ready,
		databaseIdentity: options.databaseIdentity,
		total: rows.length,
		active: activeRows.length,
		archived: rows.filter((r) => String(r.status) === 'archived').length,
		manifestCount: manifest.length,
		missingManifestIds,
		statusMismatchIds,
		slugMismatchIds,
		eligibleCount,
		ineligibleIds,
		seoCompleteAlreadyTrue,
		manualReviewIds,
	};
}

export function migrationSqlModifiesOnlyB4SeoComplete(sql: string): boolean {
	const stripped = sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n');
	const updateBlocks = [...stripped.matchAll(/UPDATE\s+journeys[\s\S]*?SET\s+([\s\S]*?)\s+FROM/gi)];
	if (updateBlocks.length === 0) return false;
	const forbiddenAssignments =
		/\b(?:status|slug|title|page_title|meta_description|hero_image|journey_type_slug|price_from|currency|price_basis|price_on_request|data)\s*=/i;
	return updateBlocks.every((block) => {
		const setClause = block[1];
		if (forbiddenAssignments.test(setClause)) return false;
		return /\bseo_complete\s*=/i.test(setClause);
	});
}

export function forwardMigrationExpectsTwentyFourUpdatedRows(sql: string): boolean {
	return /updated_rows\s*<>\s*24/i.test(sql);
}

export { maskDatabaseIdentity };
