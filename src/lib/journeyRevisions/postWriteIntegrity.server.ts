import { normalizeJourneyStatusForRead } from '@/lib/journeyNormalization/write';
import { compareProtectedPriceValues } from '@/lib/journeyRevisions/priceProtection';
import { rowToJourneyRevisionSnapshot } from '@/lib/journeyRevisions/snapshot';
import type { JourneyRevisionOperation, JourneyRevisionSnapshot } from '@/lib/journeyRevisions/types';

export type PostWriteIntegrityFailure = {
	field: string;
	code: string;
	message: string;
};

const JSONB_COMPATIBILITY_KEYS = [
	'pageTitle',
	'metaDescription',
	'heroImage',
	'heroAlt',
	'heroImageAlt',
	'journeyType',
] as const;

const PRESERVED_JSONB_COLLECTION_KEYS = [
	'itinerary',
	'images',
	'gallery',
	'faqs',
	'faq',
] as const;

function pickStr(...vals: unknown[]): string {
	for (const v of vals) {
		if (typeof v === 'string' && v.trim()) return v.trim();
	}
	return '';
}

function columnString(row: Record<string, unknown>, key: string): string {
	const value = row[key];
	return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

function jsonbString(data: Record<string, unknown>, key: string): string {
	const value = data[key];
	return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
}

export function buildRevisionNormalizedColumnExpectations(
	proposed: JourneyRevisionSnapshot,
	seoComplete: boolean
): Record<string, unknown> {
	return {
		title: proposed.title,
		slug: proposed.slug,
		status: proposed.status,
		short_description: proposed.short_description,
		page_title: proposed.page_title,
		meta_description: proposed.meta_description,
		hero_image_url: proposed.hero_image_url,
		hero_image_alt: proposed.hero_image_alt,
		journey_type_slug: proposed.journey_type_slug,
		display_order: proposed.display_order,
		seo_complete: seoComplete,
	};
}

export function buildRevisionJsonbCompatibilityExpectations(
	proposed: JourneyRevisionSnapshot
): Record<string, string> {
	return {
		pageTitle: proposed.page_title,
		metaDescription: proposed.meta_description,
		heroImage: proposed.hero_image_url,
		heroAlt: proposed.hero_image_alt,
		heroImageAlt: proposed.hero_image_alt,
		journeyType: proposed.journey_type,
	};
}

function verifyNormalizedColumns(
	row: Record<string, unknown>,
	expected: Record<string, unknown>
): PostWriteIntegrityFailure[] {
	const failures: PostWriteIntegrityFailure[] = [];
	for (const [column, expectedValue] of Object.entries(expected)) {
		const actual = row[column];
		if (column === 'display_order') {
			const expectedNum = expectedValue == null ? null : Number(expectedValue);
			const actualNum = actual == null ? null : Number(actual);
			if (expectedNum !== actualNum) {
				failures.push({
					field: column,
					code: 'COLUMN_MISMATCH',
					message: `Normalized column ${column} does not match proposed snapshot.`,
				});
			}
			continue;
		}
		if (column === 'seo_complete') {
			if (Boolean(actual) !== Boolean(expectedValue)) {
				failures.push({
					field: column,
					code: 'COLUMN_MISMATCH',
					message: `Normalized column ${column} does not match server-computed value.`,
				});
			}
			continue;
		}
		if (column === 'status') {
			const actualStatus = normalizeJourneyStatusForRead(actual);
			const expectedStatus = normalizeJourneyStatusForRead(expectedValue);
			if (actualStatus !== expectedStatus) {
				failures.push({
					field: column,
					code: 'COLUMN_MISMATCH',
					message: `Normalized column ${column} does not match proposed snapshot.`,
				});
			}
			continue;
		}
		if (columnString(row, column) !== pickStr(expectedValue)) {
			failures.push({
				field: column,
				code: 'COLUMN_MISMATCH',
				message: `Normalized column ${column} does not match proposed snapshot.`,
			});
		}
	}
	return failures;
}

function verifyJsonbCompatibility(
	data: Record<string, unknown>,
	expected: Record<string, string>
): PostWriteIntegrityFailure[] {
	const failures: PostWriteIntegrityFailure[] = [];
	for (const key of JSONB_COMPATIBILITY_KEYS) {
		const expectedValue = expected[key];
		if (expectedValue === undefined) continue;
		if (jsonbString(data, key) !== expectedValue) {
			failures.push({
				field: `data.${key}`,
				code: 'JSONB_COMPAT_MISMATCH',
				message: `Compatibility JSONB key ${key} does not match normalized column value.`,
			});
		}
	}
	return failures;
}

function verifyPreservedJsonbCollections(
	preData: Record<string, unknown>,
	postData: Record<string, unknown>,
	proposed: JourneyRevisionSnapshot,
	operation: JourneyRevisionOperation
): PostWriteIntegrityFailure[] {
	if (operation === 'create') return [];
	const failures: PostWriteIntegrityFailure[] = [];
	for (const key of PRESERVED_JSONB_COLLECTION_KEYS) {
		const proposedValue = proposed.data[key];
		const source = proposedValue !== undefined ? proposedValue : preData[key];
		const actual = postData[key];
		if (JSON.stringify(source ?? null) !== JSON.stringify(actual ?? null)) {
			failures.push({
				field: `data.${key}`,
				code: 'JSONB_PRESERVATION_FAILED',
				message: `JSONB collection ${key} was not preserved after publish.`,
			});
		}
	}
	return failures;
}

function verifyUnknownJsonbKeysPreserved(
	preData: Record<string, unknown>,
	postData: Record<string, unknown>,
	proposed: JourneyRevisionSnapshot,
	operation: JourneyRevisionOperation
): PostWriteIntegrityFailure[] {
	if (operation === 'create') return [];
	const failures: PostWriteIntegrityFailure[] = [];
	const compatibilityKeys = new Set<string>([
		...JSONB_COMPATIBILITY_KEYS,
		...PRESERVED_JSONB_COLLECTION_KEYS,
		'relatedJourneyIds',
		'relatedJourneys',
		'relatedArticles',
		'related_articles',
	]);
	for (const key of Object.keys(preData)) {
		if (compatibilityKeys.has(key)) continue;
		if (key in proposed.data && proposed.data[key] !== preData[key]) continue;
		if (JSON.stringify(preData[key]) !== JSON.stringify(postData[key])) {
			failures.push({
				field: `data.${key}`,
				code: 'JSONB_UNKNOWN_KEY_LOST',
				message: `Unexpected JSONB key ${key} changed or was lost after publish.`,
			});
		}
	}
	return failures;
}

function verifyRelationshipsPreserved(
	preData: Record<string, unknown>,
	postData: Record<string, unknown>,
	proposed: JourneyRevisionSnapshot,
	operation: JourneyRevisionOperation
): PostWriteIntegrityFailure[] {
	if (operation === 'create') return [];
	const failures: PostWriteIntegrityFailure[] = [];
	const relationshipKeys = [
		'relatedJourneyIds',
		'relatedJourneys',
		'relatedArticles',
		'related_articles',
	] as const;
	for (const key of relationshipKeys) {
		const expected = proposed.data[key] ?? preData[key];
		if (JSON.stringify(expected ?? null) !== JSON.stringify(postData[key] ?? null)) {
			failures.push({
				field: `data.${key}`,
				code: 'RELATIONSHIP_PRESERVATION_FAILED',
				message: `Relationship field ${key} was not preserved after publish.`,
			});
		}
	}
	return failures;
}

export function verifyRevisionPublishPostWriteIntegrity(params: {
	operation: JourneyRevisionOperation;
	preWriteRow: Record<string, unknown> | null;
	postWriteRow: Record<string, unknown>;
	proposed: JourneyRevisionSnapshot;
	seoComplete: boolean;
}): PostWriteIntegrityFailure[] {
	const { operation, preWriteRow, postWriteRow, proposed, seoComplete } = params;
	const failures: PostWriteIntegrityFailure[] = [];

	const postSnapshot = rowToJourneyRevisionSnapshot(postWriteRow);
	const preSnapshot = preWriteRow ? rowToJourneyRevisionSnapshot(preWriteRow) : null;

	failures.push(
		...verifyNormalizedColumns(
			postWriteRow,
			buildRevisionNormalizedColumnExpectations(proposed, seoComplete)
		)
	);

	const postData =
		postWriteRow.data && typeof postWriteRow.data === 'object'
			? (postWriteRow.data as Record<string, unknown>)
			: {};
	const preData =
		preWriteRow?.data && typeof preWriteRow.data === 'object'
			? (preWriteRow.data as Record<string, unknown>)
			: {};

	failures.push(
		...verifyJsonbCompatibility(postData, buildRevisionJsonbCompatibilityExpectations(proposed))
	);
	failures.push(...verifyPreservedJsonbCollections(preData, postData, proposed, operation));
	failures.push(...verifyRelationshipsPreserved(preData, postData, proposed, operation));
	failures.push(...verifyUnknownJsonbKeysPreserved(preData, postData, proposed, operation));

	const priceErrors = compareProtectedPriceValues(preSnapshot, postSnapshot);
	for (const err of priceErrors) {
		failures.push({ field: err.field, code: 'PRICE_FIELD_CHANGED', message: err.message });
	}

	if (operation !== 'create' && preWriteRow) {
		if (String(postWriteRow.id) !== String(preWriteRow.id)) {
			failures.push({
				field: 'id',
				code: 'IDENTITY_CHANGED',
				message: 'Journey id must not change on update publish.',
			});
		}
		const preCreated = preWriteRow.created_at;
		const postCreated = postWriteRow.created_at;
		if (preCreated != null && postCreated != null && String(preCreated) !== String(postCreated)) {
			failures.push({
				field: 'created_at',
				code: 'CREATED_AT_CHANGED',
				message: 'Journey created_at must not change on publish.',
			});
		}
	}

	if ('published_by' in postWriteRow || 'published_at' in postWriteRow) {
		failures.push({
			field: 'revision_metadata',
			code: 'REVISION_METADATA_LEAK',
			message: 'Revision publish metadata must not be written to journeys row.',
		});
	}

	return failures;
}
