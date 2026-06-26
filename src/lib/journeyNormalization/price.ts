import { ISO4217_CURRENCIES, PRICE_BASIS_VALUES, type PriceBasis } from './constants';
import { pickFirstNonEmptyString, stripJourneySlugPathPrefix } from './slug';
import type { JourneyRowLike, PriceCompleteness } from './types';

export function isIso4217Currency(value: unknown): value is (typeof ISO4217_CURRENCIES)[number] {
	return (
		typeof value === 'string' &&
		(ISO4217_CURRENCIES as readonly string[]).includes(value.toUpperCase())
	);
}

export function isPriceBasis(value: unknown): value is PriceBasis {
	return (
		typeof value === 'string' &&
		(PRICE_BASIS_VALUES as readonly string[]).includes(value as PriceBasis)
	);
}

export function parseNumericPrice(raw: unknown): number | null {
	if (raw == null || raw === '') return null;
	const num = typeof raw === 'number' ? raw : Number(raw);
	if (!Number.isFinite(num) || num <= 0) return null;
	return num;
}

export function evaluatePriceCompleteness(row: JourneyRowLike): PriceCompleteness {
	const data =
		row.data && typeof row.data === 'object'
			? (row.data as Record<string, unknown>)
			: {};
	const journeyId = String(row.id ?? '');
	const slug = stripJourneySlugPathPrefix(String(row.slug ?? ''));
	const currentPrice = parseNumericPrice(row.price ?? data.price);
	const currencyRaw = pickFirstNonEmptyString(data.currency, data.priceCurrency);
	const currency =
		currencyRaw && isIso4217Currency(currencyRaw) ? currencyRaw.toUpperCase() : null;
	const basisRaw = pickFirstNonEmptyString(data.priceBasis, data.price_basis);
	const priceBasis = basisRaw && isPriceBasis(basisRaw) ? basisRaw : null;
	const priceOnRequest = Boolean(data.priceOnRequest ?? data.price_on_request);

	const missing: string[] = [];
	if (!currentPrice && !priceOnRequest) missing.push('price_or_on_request');
	if (!currency) missing.push('currency');
	if (!priceBasis) missing.push('price_basis');

	let proposedAction = 'keep_compatible_read_path';
	if (missing.includes('currency') && missing.includes('price_basis')) {
		proposedAction = 'manual_review: add currency and price_basis columns after confirmation';
	} else if (missing.length > 0) {
		proposedAction = `manual_review: missing ${missing.join(', ')}`;
	} else {
		proposedAction = 'ready_for_structured_offer';
	}

	return {
		journeyId,
		slug,
		currentPrice,
		currency,
		priceBasis,
		priceOnRequest,
		proposedAction,
		manualReviewRequired: missing.length > 0,
	};
}

export function isPriceDataComplete(evaluation: PriceCompleteness): boolean {
	return !evaluation.manualReviewRequired;
}
