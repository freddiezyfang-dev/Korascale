import { maskDatabaseIdentity } from './statusBackfill';
import type { JourneyRowLike } from './types';

export const PR_J2B4_EXCLUDED_ID = 'e468b842-7c59-4258-8d56-8b585566be82';
export const PR_J2B4_MANIFEST_COUNT = 24;
export const PR_J2B4_EXPECTED_TOTAL = 83;
export const PR_J2B4_EXPECTED_ACTIVE = 24;
export const PR_J2B4_EXPECTED_ARCHIVED = 59;

export type B4PriceSource = 'price_column' | 'existing_price_from' | 'unresolved';

export type B4ActiveManifestEntry = {
	id: string;
	slug: string;
	priceFrom: { proposed: number | null; source: B4PriceSource };
	legacyPrice: number | null;
	manualReview: boolean;
	reason: string;
};

export type B4PreflightResult = {
	ready: boolean;
	databaseIdentity: string;
	total: number;
	active: number;
	archived: number;
	manifestCount: number;
	missingManifestIds: string[];
	statusMismatchIds: string[];
	slugMismatchIds: string[];
	priceFromResolved: number;
	priceFromMissing: number;
	legacyPriceMissing: number;
	columnConflictIds: string[];
	manualReviewIds: string[];
};

function toNumber(value: unknown): number | null {
	if (value == null || value === '') return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

function columnValue(row: JourneyRowLike, column: keyof JourneyRowLike): unknown {
	return row[column];
}

export function resolveB4PriceFrom(row: JourneyRowLike): {
	proposed: number | null;
	source: B4PriceSource;
} {
	const existing = toNumber(columnValue(row, 'price_from'));
	if (existing != null && existing > 0) {
		return { proposed: existing, source: 'existing_price_from' };
	}
	const legacy = toNumber(columnValue(row, 'price'));
	if (legacy != null && legacy > 0) {
		return { proposed: legacy, source: 'price_column' };
	}
	return { proposed: null, source: 'unresolved' };
}

export function buildB4ActiveManifestEntry(row: JourneyRowLike): B4ActiveManifestEntry {
	const status = String(row.status ?? '').trim().toLowerCase();
	const priceFrom = resolveB4PriceFrom(row);
	const legacyPrice = toNumber(columnValue(row, 'price'));
	const manualReview =
		status !== 'active' ||
		priceFrom.proposed == null ||
		priceFrom.proposed <= 0 ||
		String(row.id).toLowerCase() === PR_J2B4_EXCLUDED_ID;

	return {
		id: String(row.id ?? ''),
		slug: String(row.slug ?? ''),
		priceFrom,
		legacyPrice,
		manualReview,
		reason: manualReview ? 'manual review required' : 'active price_from backfill candidate',
	};
}

export function findB4ColumnConflictIds(
	rows: JourneyRowLike[],
	manifest: readonly B4ActiveManifestEntry[]
): string[] {
	const rowById = new Map(rows.map((r) => [String(r.id).toLowerCase(), r]));
	return manifest
		.filter((entry) => {
			const row = rowById.get(entry.id.toLowerCase());
			if (!row) return false;
			const existing = toNumber(columnValue(row, 'price_from'));
			if (existing == null || existing <= 0) return false;
			return existing !== entry.priceFrom.proposed;
		})
		.map((entry) => entry.id);
}

export function countB4ProposedUpdates(
	rows: JourneyRowLike[],
	manifest: readonly B4ActiveManifestEntry[]
): number {
	const rowById = new Map(rows.map((r) => [String(r.id).toLowerCase(), r]));
	return manifest.filter((entry) => {
		const row = rowById.get(entry.id.toLowerCase());
		if (!row || entry.manualReview) return false;
		const existing = toNumber(columnValue(row, 'price_from'));
		return existing == null || existing <= 0;
	}).length;
}

export function evaluateB4Preflight(
	rows: JourneyRowLike[],
	manifest: readonly B4ActiveManifestEntry[],
	options: { databaseIdentity: string }
): B4PreflightResult {
	const activeRows = rows.filter((r) => String(r.status) === 'active');
	const rowById = new Map(rows.map((r) => [String(r.id).toLowerCase(), r]));
	const manifestIds = new Set(manifest.map((e) => e.id));

	const missingManifestIds = manifest
		.filter((e) => !rowById.has(e.id.toLowerCase()))
		.map((e) => e.id);
	const statusMismatchIds = manifest
		.filter((e) => rowById.get(e.id.toLowerCase()) && String(rowById.get(e.id.toLowerCase())!.status) !== 'active')
		.map((e) => e.id);
	const slugMismatchIds = manifest
		.filter((e) => rowById.get(e.id.toLowerCase()) && String(rowById.get(e.id.toLowerCase())!.slug) !== e.slug)
		.map((e) => e.id);

	const priceFromResolved = manifest.filter((e) => e.priceFrom.proposed != null && e.priceFrom.proposed > 0).length;
	const legacyPriceMissing = manifest.filter((e) => e.legacyPrice == null || e.legacyPrice <= 0).length;
	const manualReviewIds = manifest.filter((e) => e.manualReview).map((e) => e.id);
	const columnConflictIds = findB4ColumnConflictIds(rows, manifest);

	const ready =
		rows.length === PR_J2B4_EXPECTED_TOTAL &&
		activeRows.length === PR_J2B4_EXPECTED_ACTIVE &&
		rows.filter((r) => String(r.status) === 'archived').length === PR_J2B4_EXPECTED_ARCHIVED &&
		manifest.length === PR_J2B4_MANIFEST_COUNT &&
		missingManifestIds.length === 0 &&
		statusMismatchIds.length === 0 &&
		slugMismatchIds.length === 0 &&
		priceFromResolved === PR_J2B4_MANIFEST_COUNT &&
		legacyPriceMissing === 0 &&
		columnConflictIds.length === 0 &&
		manualReviewIds.length === 0 &&
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
		priceFromResolved,
		priceFromMissing: manifest.length - priceFromResolved,
		legacyPriceMissing,
		columnConflictIds,
		manualReviewIds,
	};
}

export function migrationSqlModifiesOnlyB4Price(sql: string): boolean {
	const stripped = sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n');
	const updateBlocks = [...stripped.matchAll(/UPDATE\s+journeys[\s\S]*?SET\s+([\s\S]*?)\s+FROM/gi)];
	if (updateBlocks.length === 0) return false;
	const forbiddenAssignments =
		/\b(?:status|slug|title|page_title|meta_description|hero_image|journey_type_slug|seo_complete|currency|price_basis|price_on_request|data)\s*=/i;
	return updateBlocks.every((block) => {
		const setClause = block[1];
		if (forbiddenAssignments.test(setClause)) return false;
		return /\bprice_from\s*=/i.test(setClause);
	});
}

export function forwardMigrationExpectsTwentyFourUpdatedRows(sql: string): boolean {
	return /updated_rows\s*<>\s*24/i.test(sql);
}

export function sqlEscape(value: string): string {
	return value.replace(/'/g, "''");
}

export { maskDatabaseIdentity };
