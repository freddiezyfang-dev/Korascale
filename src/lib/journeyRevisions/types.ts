export const JOURNEY_REVISION_OPERATIONS = ['create', 'update', 'archive', 'restore'] as const;
export type JourneyRevisionOperation = (typeof JOURNEY_REVISION_OPERATIONS)[number];

export const JOURNEY_REVISION_STATUSES = [
	'draft',
	'pending_review',
	'published',
	'rejected',
	'superseded',
] as const;
export type JourneyRevisionStatus = (typeof JOURNEY_REVISION_STATUSES)[number];

export const JOURNEY_REVISION_SCHEMA_VERSION = 1;

export type JourneyRevisionRelationships = {
	relatedJourneyIds: string[];
	relatedArticleIds: string[];
};

export type JourneyRevisionPriceFields = {
	price: number | null;
	original_price: number | null;
	currency: string | null;
	price_from: number | null;
	price_basis: string | null;
	price_on_request: boolean | null;
	price_note: string | null;
	price_valid_until: string | null;
};

export type JourneyRevisionSnapshot = JourneyRevisionPriceFields & {
	id: string | null;
	title: string;
	slug: string;
	status: string;
	short_description: string;
	description: string;
	page_title: string;
	meta_description: string;
	hero_image_url: string;
	hero_image_alt: string;
	journey_type_slug: string;
	journey_type: string;
	display_order: number | null;
	seo_complete: boolean;
	data: Record<string, unknown>;
	relationships: JourneyRevisionRelationships;
	category: string | null;
	region: string | null;
	place: string | null;
	city: string | null;
	location: string | null;
	duration: string | null;
	difficulty: string | null;
	max_participants: number | null;
	min_participants: number | null;
	image: string | null;
	featured: boolean;
	rating: number | null;
	review_count: number | null;
	created_at: string | null;
	updated_at: string | null;
};

export type JourneyRevisionFieldError = {
	field: string;
	code: string;
	message: string;
};

export type JourneyRevisionWarning = {
	code: string;
	message: string;
	field?: string;
};

export type JourneyRevisionValidationReport = {
	errors: JourneyRevisionFieldError[];
	warnings: JourneyRevisionWarning[];
};

export type JourneyRevisionReviewMetadata = {
	changeSummary?: string[];
	factCheckItems?: Array<Record<string, unknown>>;
	rejectionReason?: string;
};

export type JourneyRevisionRecord = {
	id: string;
	journeyId: string | null;
	operation: JourneyRevisionOperation;
	status: JourneyRevisionStatus;
	schemaVersion: number;
	sourceUpdatedAt: string | null;
	sourceSnapshot: JourneyRevisionSnapshot | null;
	proposedSnapshot: JourneyRevisionSnapshot;
	changeSummary: string[];
	validationReport: JourneyRevisionValidationReport;
	reviewMetadata: JourneyRevisionReviewMetadata;
	createdBy: string;
	publishedBy: string | null;
	createdAt: string;
	updatedAt: string;
	publishedAt: string | null;
	rejectedAt: string | null;
};

export type JourneyRevisionDryRunRequest = {
	operation: JourneyRevisionOperation;
	journeyId?: string;
	sourceUpdatedAt?: string;
	changes?: Record<string, unknown>;
	reviewMetadata?: JourneyRevisionReviewMetadata;
};

export type JourneyRevisionDryRunResult = {
	valid: boolean;
	operation: JourneyRevisionOperation;
	journeyId: string | null;
	sourceUpdatedAtMatched: boolean;
	errors: JourneyRevisionFieldError[];
	warnings: JourneyRevisionWarning[];
	changeSummary: string[];
	validationReport: JourneyRevisionValidationReport;
	resolvedSnapshot: JourneyRevisionSnapshot;
};

export type JourneyRevisionCreateResult = {
	revisionId: string;
	operation: JourneyRevisionOperation;
	journeyId: string | null;
	status: JourneyRevisionStatus;
	validationSummary: JourneyRevisionValidationReport;
	previewPath: string;
};

export type JourneyRevisionDetail = {
	revision: JourneyRevisionRecord;
	allowedActions: string[];
	hasSourceConflict: boolean;
	sourceConflictMessage?: string;
};

export const LOCKED_PRICE_SNAPSHOT_KEYS = [
	'price',
	'original_price',
	'currency',
	'price_from',
	'price_basis',
	'price_on_request',
	'price_note',
	'price_valid_until',
] as const;

export const STRIPPED_REVISION_CHANGE_KEYS = new Set([
	'seo_complete',
	'seoComplete',
	'role',
	'isAdmin',
	'id',
	'created_at',
	'createdAt',
	'updated_at',
	'updatedAt',
	...LOCKED_PRICE_SNAPSHOT_KEYS,
]);
