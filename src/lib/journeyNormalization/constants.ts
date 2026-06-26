/** Canonical Journey publication statuses (post PR-J2 migration). */
export const JOURNEY_STATUSES = ['draft', 'active', 'archived'] as const;
export type JourneyCanonicalStatus = (typeof JOURNEY_STATUSES)[number];

/** Canonical Journey type URL slugs — single source of truth for routes and queries. */
export const JOURNEY_TYPES = [
	'explore-together',
	'deep-discovery',
	'signature-journeys',
	'group-tours',
] as const;
export type JourneyTypeSlug = (typeof JOURNEY_TYPES)[number];

/** Legacy DB status value retained until migration backfill maps it to `archived`. */
export const LEGACY_INACTIVE_STATUS = 'inactive';

/** Legacy display labels stored in `journeys.journey_type` before slug normalization. */
export const JOURNEY_TYPE_LABELS: Record<JourneyTypeSlug, string> = {
	'explore-together': 'Explore Together',
	'deep-discovery': 'Deep Discovery',
	'signature-journeys': 'Signature Journeys',
	'group-tours': 'Group Tours',
};

export const JOURNEY_TYPE_LABEL_TO_SLUG: Record<string, JourneyTypeSlug> = {
	'Explore Together': 'explore-together',
	'Deep Discovery': 'deep-discovery',
	'Signature Journeys': 'signature-journeys',
	'Group Tours': 'group-tours',
};

export const ISO4217_CURRENCIES = ['USD', 'CNY', 'EUR'] as const;
export type Iso4217Currency = (typeof ISO4217_CURRENCIES)[number];

export const PRICE_BASIS_VALUES = ['per_person', 'per_group'] as const;
export type PriceBasis = (typeof PRICE_BASIS_VALUES)[number];

export const JOURNEY_SLUG_RESERVED_SEGMENTS = ['type', 'api', 'admin'] as const;
