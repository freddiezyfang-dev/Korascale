import {
	LEGACY_INACTIVE_STATUS,
	type JourneyCanonicalStatus,
	type JourneyTypeSlug,
	type PriceBasis,
} from './constants';

export type JourneyRowLike = {
	id?: unknown;
	slug?: unknown;
	status?: unknown;
	journey_type?: unknown;
	title?: unknown;
	short_description?: unknown;
	description?: unknown;
	price?: unknown;
	image?: unknown;
	updated_at?: unknown;
	data?: unknown;
};

export type JourneyDataLike = Record<string, unknown>;

export type SlugIssueCode =
	| 'null'
	| 'empty'
	| 'trim'
	| 'uppercase'
	| 'non_ascii'
	| 'double_hyphen'
	| 'trailing_hyphen'
	| 'leading_hyphen'
	| 'duplicate'
	| 'reserved'
	| 'path_prefix';

export type StatusProposal = {
	current: string | null;
	proposed: JourneyCanonicalStatus | null;
	confidence: 'high' | 'manual_review';
	reason: string;
};

export type TypeProposal = {
	current: string | null;
	proposed: JourneyTypeSlug | null;
	confidence: 'high' | 'manual_review';
	evidence: string;
};

export type SlugProposal = {
	current: string | null;
	proposed: string | null;
	issues: SlugIssueCode[];
	redirectRequired: boolean;
	manualReviewRequired: boolean;
	reason: string;
};

export type SeoFieldSources = {
	name: { value: string; source: string };
	pageTitle: { value: string; source: string };
	metaDescription: { value: string; source: string };
	excerpt: { value: string; source: string };
	heroImageUrl: { value: string; source: string };
	heroImageAlt: { value: string; source: string };
};

export type SeoCompletenessEvaluation = {
	complete: boolean;
	missing: string[];
	fields: SeoFieldSources;
};

/** @deprecated Use SeoCompletenessEvaluation */
export type SeoReadyEvaluation = SeoCompletenessEvaluation;

export type PriceCompleteness = {
	journeyId: string;
	slug: string;
	currentPrice: number | null;
	currency: string | null;
	priceBasis: PriceBasis | null;
	priceOnRequest: boolean;
	proposedAction: string;
	manualReviewRequired: boolean;
};

export type NormalizationPreviewRow = {
	id: string;
	currentSlug: string;
	proposedSlug: string;
	currentStatus: string;
	proposedStatus: string;
	currentType: string;
	proposedType: string;
	seoComplete: boolean;
	priceComplete: boolean;
	redirectRequired: boolean;
	manualReviewRequired: boolean;
	reason: string;
};

export { LEGACY_INACTIVE_STATUS };
