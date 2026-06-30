import type { JourneyRevisionSnapshot } from './types';
import { LOCKED_PRICE_SNAPSHOT_KEYS } from './types';

/** Protected price paths derived from current Journey schema (columns + JSONB). */
export const PROTECTED_DATA_PRICE_KEYS = [
	'price',
	'originalPrice',
	'priceDetails',
	'priceCurrency',
	'currency',
	'priceBasis',
	'price_from',
	'priceFrom',
	'price_on_request',
	'priceOnRequest',
	'price_note',
	'priceNote',
	'price_valid_until',
	'priceValidUntil',
	'pricing',
] as const;

export type ProtectedPriceMap = Record<string, unknown>;

function isEmptyPriceValue(value: unknown): boolean {
	return value == null || value === '' || value === 0;
}

export function extractProtectedPriceValues(snapshot: JourneyRevisionSnapshot): ProtectedPriceMap {
	const out: ProtectedPriceMap = {};

	for (const key of LOCKED_PRICE_SNAPSHOT_KEYS) {
		out[`column.${key}`] = snapshot[key as keyof JourneyRevisionSnapshot];
	}

	const data = snapshot.data ?? {};
	for (const key of PROTECTED_DATA_PRICE_KEYS) {
		if (key in data) {
			out[`data.${key}`] = data[key];
		}
	}

	if (Array.isArray(data.availableDates)) {
		out['data.availableDates'] = data.availableDates.map((row) => {
			const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
			return {
				price: item.price ?? null,
				originalPrice: item.originalPrice ?? null,
			};
		});
	}

	return out;
}

export function snapshotHasNonEmptyProtectedPrices(snapshot: JourneyRevisionSnapshot): boolean {
	const values = extractProtectedPriceValues(snapshot);
	return Object.values(values).some((value) => {
		if (Array.isArray(value)) {
			return value.some(
				(entry) =>
					entry &&
					typeof entry === 'object' &&
					(!isEmptyPriceValue((entry as Record<string, unknown>).price) ||
						!isEmptyPriceValue((entry as Record<string, unknown>).originalPrice))
			);
		}
		if (value && typeof value === 'object') return Object.keys(value as object).length > 0;
		return !isEmptyPriceValue(value);
	});
}

export function protectedPriceValuesEqual(a: ProtectedPriceMap, b: ProtectedPriceMap): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

export function compareProtectedPriceValues(
	source: JourneyRevisionSnapshot | null,
	proposed: JourneyRevisionSnapshot
): Array<{ field: string; code: string; message: string }> {
	if (!source) {
		if (snapshotHasNonEmptyProtectedPrices(proposed)) {
			return [
				{
					field: 'price',
					code: 'JOURNEY_REVISION_PRICE_FIELDS_LOCKED',
					message: 'Create revisions cannot include price values during price normalization freeze.',
				},
			];
		}
		return [];
	}

	const before = extractProtectedPriceValues(source);
	const after = extractProtectedPriceValues(proposed);
	if (protectedPriceValuesEqual(before, after)) return [];

	const errors: Array<{ field: string; code: string; message: string }> = [];
	for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
		if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
			errors.push({
				field: key,
				code: 'JOURNEY_REVISION_PRICE_FIELDS_LOCKED',
				message: `Protected price value changed at ${key}.`,
			});
		}
	}
	return errors;
}

function collectPricePathsInObject(
	prefix: string,
	value: unknown,
	out: string[]
): void {
	if (value == null || typeof value !== 'object') return;

	if (Array.isArray(value)) {
		value.forEach((item, index) => collectPricePathsInObject(`${prefix}[${index}]`, item, out));
		return;
	}

	for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (prefix === 'data' && key === 'relatedTrips') {
			continue;
		}
		if (prefix === 'data' && PROTECTED_DATA_PRICE_KEYS.includes(key as (typeof PROTECTED_DATA_PRICE_KEYS)[number])) {
			out.push(`data.${key}`);
		}
		if (prefix.startsWith('data.availableDates') && (key === 'price' || key === 'originalPrice')) {
			out.push(path);
		}
		collectPricePathsInObject(path, child, out);
	}
}

/** Detect client attempts to set protected price paths inside changes (including full data replacement). */
export function detectProtectedPricePathsInChanges(
	changes: Record<string, unknown>,
	source: JourneyRevisionSnapshot | null
): Array<{ field: string; code: string; message: string }> {
	const errors: Array<{ field: string; code: string; message: string }> = [];

	for (const key of LOCKED_PRICE_SNAPSHOT_KEYS) {
		if (key in changes) {
			errors.push({
				field: key,
				code: 'JOURNEY_REVISION_PRICE_FIELDS_LOCKED',
				message: `Price field "${key}" cannot be modified via revision.`,
			});
		}
	}

	const paths: string[] = [];
	if (changes.data && typeof changes.data === 'object' && !Array.isArray(changes.data)) {
		collectPricePathsInObject('data', changes.data, paths);
	}

	const sourcePrices = source ? extractProtectedPriceValues(source) : {};
	for (const path of paths) {
		errors.push({
			field: path,
			code: 'JOURNEY_REVISION_PRICE_FIELDS_LOCKED',
			message: `Protected price path "${path}" cannot be modified via revision.`,
		});
	}

	if (changes.data && typeof changes.data === 'object' && !Array.isArray(changes.data) && source) {
		const mergedData = { ...source.data, ...(changes.data as Record<string, unknown>) };
		const mergedSnapshot: JourneyRevisionSnapshot = { ...source, data: mergedData };
		errors.push(...compareProtectedPriceValues(source, mergedSnapshot));
	}

	return errors;
}
