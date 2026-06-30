/** Client-editable change keys for Journey revisions (business fields only). */

export const CLIENT_ALLOWED_TOP_LEVEL_CHANGE_KEYS = new Set([
	'title',
	'slug',
	'status',
	'short_description',
	'description',
	'page_title',
	'meta_description',
	'hero_image_url',
	'hero_image_alt',
	'journey_type_slug',
	'journey_type',
	'category',
	'region',
	'place',
	'city',
	'location',
	'duration',
	'difficulty',
	'max_participants',
	'min_participants',
	'image',
	'featured',
	'rating',
	'review_count',
	'display_order',
	'data',
	'relationships',
	// camelCase aliases accepted from admin payloads
	'shortDescription',
	'pageTitle',
	'metaDescription',
	'heroImage',
	'heroAlt',
	'heroImageAlt',
	'journeyType',
	'maxParticipants',
	'minParticipants',
	'reviewCount',
]);

export const CLIENT_PROTECTED_CHANGE_KEYS = new Set([
	'id',
	'journey_id',
	'journeyId',
	'created_at',
	'createdAt',
	'updated_at',
	'updatedAt',
	'seo_complete',
	'seoComplete',
	'created_by',
	'createdBy',
	'published_by',
	'publishedBy',
	'published_at',
	'publishedAt',
	'rejected_at',
	'rejectedAt',
	'source_snapshot',
	'sourceSnapshot',
	'source_updated_at',
	'sourceUpdatedAt',
	'validation_report',
	'validationReport',
	'change_summary',
	'changeSummary',
	'review_metadata',
	'reviewMetadata',
	'operation',
	'revisionId',
	'revision_id',
	'role',
	'isAdmin',
	'price',
	'original_price',
	'originalPrice',
	'currency',
	'price_from',
	'priceFrom',
	'price_basis',
	'priceBasis',
	'price_on_request',
	'priceOnRequest',
	'price_note',
	'priceNote',
	'price_valid_until',
	'priceValidUntil',
]);

export function sanitizeClientChanges(changes: Record<string, unknown>): {
	sanitized: Record<string, unknown>;
	rejected: string[];
} {
	const sanitized: Record<string, unknown> = {};
	const rejected: string[] = [];

	for (const [key, value] of Object.entries(changes)) {
		if (CLIENT_PROTECTED_CHANGE_KEYS.has(key)) {
			rejected.push(key);
			continue;
		}
		if (!CLIENT_ALLOWED_TOP_LEVEL_CHANGE_KEYS.has(key)) {
			rejected.push(key);
			continue;
		}
		sanitized[key] = value;
	}

	return { sanitized, rejected };
}
