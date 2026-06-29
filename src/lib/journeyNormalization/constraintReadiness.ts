import { ISO4217_CURRENCIES, JOURNEY_STATUSES, JOURNEY_TYPES, PRICE_BASIS_VALUES } from './constants';
import type { JourneyRowLike } from './types';

export const E468B842_JOURNEY_ID = 'e468b842-7c59-4258-8d56-8b585566be82';

export const EXPECTED_ACTIVE_JOURNEY_COUNT = 24;
export const EXPECTED_EXPLORE_TOGETHER_COUNT = 8;
export const EXPECTED_DEEP_DISCOVERY_COUNT = 16;

const STATUS_SET = new Set<string>(JOURNEY_STATUSES);
const TYPE_SET = new Set<string>(JOURNEY_TYPES);
const CURRENCY_SET = new Set<string>(ISO4217_CURRENCIES);
const PRICE_BASIS_SET = new Set<string>(PRICE_BASIS_VALUES);

export type ConstraintViolation = {
	field: string;
	id?: string;
	slug?: string;
	value: unknown;
	reason: string;
};

export function evaluateStatusConstraintReadiness(rows: JourneyRowLike[]): {
	ready: boolean;
	nullStatus: number;
	inactive: number;
	illegal: number;
	active: number;
	violations: ConstraintViolation[];
} {
	const violations: ConstraintViolation[] = [];
	let nullStatus = 0;
	let inactive = 0;
	let illegal = 0;
	let active = 0;

	for (const row of rows) {
		const status = row.status;
		if (status == null) {
			nullStatus++;
			violations.push({
				field: 'status',
				id: String(row.id ?? ''),
				slug: String(row.slug ?? ''),
				value: status,
				reason: 'NULL status',
			});
			continue;
		}
		const normalized = String(status).trim().toLowerCase();
		if (normalized === 'inactive') {
			inactive++;
			violations.push({
				field: 'status',
				id: String(row.id ?? ''),
				slug: String(row.slug ?? ''),
				value: status,
				reason: 'legacy inactive',
			});
			continue;
		}
		if (!STATUS_SET.has(normalized)) {
			illegal++;
			violations.push({
				field: 'status',
				id: String(row.id ?? ''),
				slug: String(row.slug ?? ''),
				value: status,
				reason: 'illegal status',
			});
			continue;
		}
		if (normalized === 'active') active++;
	}

	const ready =
		nullStatus === 0 &&
		inactive === 0 &&
		illegal === 0 &&
		active === EXPECTED_ACTIVE_JOURNEY_COUNT;

	return { ready, nullStatus, inactive, illegal, active, violations };
}

export function evaluateOptionalFieldConstraintReadiness(rows: JourneyRowLike[]): {
	ready: boolean;
	illegalType: number;
	illegalCurrency: number;
	illegalPriceBasis: number;
	typeNull: number;
	e468b842Safe: boolean;
	violations: ConstraintViolation[];
} {
	const violations: ConstraintViolation[] = [];
	let illegalType = 0;
	let illegalCurrency = 0;
	let illegalPriceBasis = 0;
	let typeNull = 0;

	for (const row of rows) {
		const id = String(row.id ?? '');
		const slug = String(row.slug ?? '');

		const typeSlug = row.journey_type_slug;
		if (typeSlug == null || String(typeSlug).trim() === '') {
			typeNull++;
		} else {
			const normalized = String(typeSlug).trim();
			if (!TYPE_SET.has(normalized)) {
				illegalType++;
				violations.push({
					field: 'journey_type_slug',
					id,
					slug,
					value: typeSlug,
					reason: 'illegal journey_type_slug',
				});
			}
		}

		const currency = row.currency;
		if (currency != null && String(currency).trim() !== '') {
			const normalized = String(currency).trim().toUpperCase();
			if (!CURRENCY_SET.has(normalized)) {
				illegalCurrency++;
				violations.push({
					field: 'currency',
					id,
					slug,
					value: currency,
					reason: 'illegal currency',
				});
			}
		}

		const priceBasis = row.price_basis;
		if (priceBasis != null && String(priceBasis).trim() !== '') {
			const normalized = String(priceBasis).trim();
			if (!PRICE_BASIS_SET.has(normalized)) {
				illegalPriceBasis++;
				violations.push({
					field: 'price_basis',
					id,
					slug,
					value: priceBasis,
					reason: 'illegal price_basis',
				});
			}
		}
	}

	const e468 = rows.find((row) => String(row.id).toLowerCase() === E468B842_JOURNEY_ID);
	const e468b842Safe =
		!e468 ||
		(e468.journey_type_slug == null &&
			!violations.some((v) => v.id?.toLowerCase() === E468B842_JOURNEY_ID));

	const ready = illegalType === 0 && illegalCurrency === 0 && illegalPriceBasis === 0 && e468b842Safe;

	return {
		ready,
		illegalType,
		illegalCurrency,
		illegalPriceBasis,
		typeNull,
		e468b842Safe,
		violations,
	};
}

export function countPublicJourneysByMode(
	rows: JourneyRowLike[],
	mode: 'strict' | 'compat'
): {
	total: number;
	exploreTogether: number;
	deepDiscovery: number;
} {
	const isPublic =
		mode === 'strict'
			? (status: unknown) => String(status).trim().toLowerCase() === 'active'
			: (status: unknown) => {
					if (status == null) return true;
					return String(status).trim().toLowerCase() === 'active';
				};

	const publicRows = rows.filter((row) => isPublic(row.status));
	const exploreTogether = publicRows.filter(
		(row) => String(row.journey_type_slug ?? '') === 'explore-together'
	).length;
	const deepDiscovery = publicRows.filter(
		(row) => String(row.journey_type_slug ?? '') === 'deep-discovery'
	).length;

	return { total: publicRows.length, exploreTogether, deepDiscovery };
}
