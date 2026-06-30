import type { PoolClient } from 'pg';

import { normalizeJourneySlugForComparison } from '@/lib/journeyNormalization/slug';
import { runJourneyPublishIntegrityGate } from '@/lib/journeyNormalization/journeyPublishIntegrityGate.server';
import { publishCandidateFromCreatePayload } from '@/lib/journeyNormalization/journeyPublishIntegrity.server';
import { findJourneySlugConflict } from '@/lib/journeyNormalization/journeySlugUniqueness.server';
import { normalizeJourneyStatusForWrite } from '@/lib/journeyNormalization/write';

import { CLIENT_PROTECTED_CHANGE_KEYS, sanitizeClientChanges } from './allowlist';
import { JOURNEY_REVISION_ERROR_CODES } from './errors';
import { validateOperationStatusSemantics } from './operationRules';
import {
	compareProtectedPriceValues,
	detectProtectedPricePathsInChanges,
} from './priceProtection';
import { defaultProposedStatusForOperation, isValidRevisionOperation } from './stateMachine';
import {
	computeChangeSummary,
	mergeChangesIntoProposedSnapshot,
	rowToJourneyRevisionSnapshot,
	serializeJourneyUpdatedAt,
} from './snapshot';
import type {
	JourneyRevisionDryRunRequest,
	JourneyRevisionFieldError,
	JourneyRevisionOperation,
	JourneyRevisionSnapshot,
	JourneyRevisionValidationReport,
	JourneyRevisionWarning,
} from './types';

type DbRow = Record<string, unknown>;

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SILENT_STRIP_KEYS = new Set([
	'id',
	'created_at',
	'createdAt',
	'updated_at',
	'updatedAt',
	'seo_complete',
	'seoComplete',
]);

export type ValidationContext = {
	journeyRow: DbRow | null;
	runQuery: (text: string, params?: unknown[]) => Promise<{ rows: DbRow[] }>;
};

function isUuid(value: string): boolean {
	return UUID_RE.test(value.trim());
}

export function detectProtectedClientFieldAttempts(
	rawChanges: Record<string, unknown>
): JourneyRevisionFieldError[] {
	const errors: JourneyRevisionFieldError[] = [];
	const rejectKeys = new Set([
		...CLIENT_PROTECTED_CHANGE_KEYS,
		...SILENT_STRIP_KEYS,
	]);

	for (const key of Object.keys(rawChanges)) {
		if (SILENT_STRIP_KEYS.has(key)) continue;
		if (!rejectKeys.has(key)) continue;
		if (key === 'published_by' || key === 'publishedBy' || key === 'published_at' || key === 'publishedAt') {
			errors.push({
				field: key,
				code: JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
				message: `Protected field "${key}" cannot be set by client.`,
			});
			continue;
		}
		if (CLIENT_PROTECTED_CHANGE_KEYS.has(key)) {
			errors.push({
				field: key,
				code: JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
				message: `Protected field "${key}" cannot be set by client.`,
			});
		}
	}

	return errors;
}

/** @deprecated use detectProtectedPricePathsInChanges */
export function detectLockedFieldChangeAttempts(
	changes: Record<string, unknown>,
	source: JourneyRevisionSnapshot | null = null
): JourneyRevisionFieldError[] {
	return detectProtectedPricePathsInChanges(changes, source);
}

/** @deprecated use compareProtectedPriceValues */
export function priceFieldsChanged(
	source: JourneyRevisionSnapshot | null,
	proposed: JourneyRevisionSnapshot
): JourneyRevisionFieldError[] {
	return compareProtectedPriceValues(source, proposed);
}

function extractRelatedTripSlugs(data: Record<string, unknown>): string[] {
	const trips = Array.isArray(data.relatedTrips) ? data.relatedTrips : [];
	const slugs: string[] = [];
	for (const trip of trips) {
		if (!trip || typeof trip !== 'object') continue;
		const slug = (trip as Record<string, unknown>).slug;
		if (typeof slug === 'string' && slug.trim()) slugs.push(slug.trim());
	}
	return slugs;
}

function extractRelatedArticleIds(
	relationships: JourneyRevisionSnapshot['relationships'],
	data: Record<string, unknown>
): string[] {
	const ids = new Set<string>();
	for (const id of relationships.relatedArticleIds) {
		if (typeof id === 'string' && id.trim()) ids.add(id.trim());
	}
	for (const id of [
		...(Array.isArray(data.relatedArticles) ? data.relatedArticles : []),
		...(Array.isArray(data.related_articles) ? data.related_articles : []),
	]) {
		if (typeof id === 'string' && id.trim()) ids.add(id.trim());
	}
	return [...ids];
}

async function findJourneyRowBySlugComparison(
	slug: string,
	runQuery: ValidationContext['runQuery']
): Promise<DbRow | null> {
	const normalized = normalizeJourneySlugForComparison(slug);
	if (!normalized) return null;
	const { rows } = await runQuery(`SELECT id, slug, status FROM journeys`);
	return (
		rows.find((row) => normalizeJourneySlugForComparison(row.slug) === normalized) ?? null
	);
}

export async function validateRelationships(
	proposed: JourneyRevisionSnapshot,
	journeyId: string | null,
	runQuery: ValidationContext['runQuery']
): Promise<{ errors: JourneyRevisionFieldError[]; warnings: JourneyRevisionWarning[] }> {
	const errors: JourneyRevisionFieldError[] = [];
	const warnings: JourneyRevisionWarning[] = [];
	const { relatedJourneyIds } = proposed.relationships;
	const relatedArticleIds = extractRelatedArticleIds(proposed.relationships, proposed.data);
	const relatedTripSlugs = extractRelatedTripSlugs(proposed.data);
	const proposedSlugNorm = normalizeJourneySlugForComparison(proposed.slug);

	const journeySet = new Set(relatedJourneyIds);
	if (journeySet.size !== relatedJourneyIds.length) {
		errors.push({
			field: 'relationships.relatedJourneyIds',
			code: JOURNEY_REVISION_ERROR_CODES.RELATIONSHIP_INVALID,
			message: 'Duplicate related Journey IDs are not allowed.',
		});
	}

	const articleSet = new Set(relatedArticleIds);
	if (articleSet.size !== relatedArticleIds.length) {
		errors.push({
			field: 'relationships.relatedArticleIds',
			code: JOURNEY_REVISION_ERROR_CODES.RELATIONSHIP_INVALID,
			message: 'Duplicate related Article IDs are not allowed.',
		});
	}

	const tripSlugNorms = new Set<string>();
	for (const slug of relatedTripSlugs) {
		const norm = normalizeJourneySlugForComparison(slug);
		if (!norm) {
			errors.push({
				field: 'data.relatedTrips',
				code: JOURNEY_REVISION_ERROR_CODES.RELATIONSHIP_INVALID,
				message: 'relatedTrips entries must include a non-empty slug.',
			});
			continue;
		}
		if (tripSlugNorms.has(norm)) {
			errors.push({
				field: 'data.relatedTrips',
				code: JOURNEY_REVISION_ERROR_CODES.RELATIONSHIP_INVALID,
				message: `Duplicate relatedTrips slug "${slug}" after normalization.`,
			});
			continue;
		}
		tripSlugNorms.add(norm);

		if (proposedSlugNorm && norm === proposedSlugNorm) {
			errors.push({
				field: 'data.relatedTrips',
				code: JOURNEY_REVISION_ERROR_CODES.RELATIONSHIP_INVALID,
				message: 'A Journey cannot reference itself in relatedTrips.',
			});
		}

		const row = await findJourneyRowBySlugComparison(slug, runQuery);
		if (!row) {
			errors.push({
				field: 'data.relatedTrips',
				code: JOURNEY_REVISION_ERROR_CODES.RELATIONSHIP_INVALID,
				message: `Related Journey slug "${slug}" does not exist.`,
			});
			continue;
		}
		const status = String(row.status ?? '').toLowerCase();
		if (status === 'archived') {
			warnings.push({
				code: 'ARCHIVED_RELATED_JOURNEY',
				message: `Related Journey slug "${slug}" is archived.`,
				field: 'data.relatedTrips',
			});
		}
	}

	if (journeyId && relatedJourneyIds.includes(journeyId)) {
		errors.push({
			field: 'relationships.relatedJourneyIds',
			code: JOURNEY_REVISION_ERROR_CODES.RELATIONSHIP_INVALID,
			message: 'A Journey cannot reference itself.',
		});
	}

	for (const id of relatedJourneyIds) {
		if (!isUuid(id)) {
			errors.push({
				field: 'relationships.relatedJourneyIds',
				code: JOURNEY_REVISION_ERROR_CODES.RELATIONSHIP_INVALID,
				message: `Related Journey id "${id}" is not a valid UUID.`,
			});
			continue;
		}
		const { rows } = await runQuery('SELECT id, status FROM journeys WHERE id = $1 LIMIT 1', [id]);
		if (rows.length === 0) {
			errors.push({
				field: 'relationships.relatedJourneyIds',
				code: JOURNEY_REVISION_ERROR_CODES.RELATIONSHIP_INVALID,
				message: `Related Journey id ${id} does not exist.`,
			});
			continue;
		}
		const status = String(rows[0].status ?? '').toLowerCase();
		if (status === 'archived') {
			warnings.push({
				code: 'ARCHIVED_RELATED_JOURNEY',
				message: `Related Journey ${id} is archived.`,
				field: 'relationships.relatedJourneyIds',
			});
		}
	}

	for (const id of relatedArticleIds) {
		if (!isUuid(id)) {
			errors.push({
				field: 'relationships.relatedArticleIds',
				code: JOURNEY_REVISION_ERROR_CODES.RELATIONSHIP_INVALID,
				message: `Related Article id "${id}" is not a valid UUID.`,
			});
			continue;
		}
		const { rows } = await runQuery('SELECT id FROM articles WHERE id = $1 LIMIT 1', [id]);
		if (rows.length === 0) {
			errors.push({
				field: 'relationships.relatedArticleIds',
				code: JOURNEY_REVISION_ERROR_CODES.RELATIONSHIP_INVALID,
				message: `Related Article id ${id} does not exist.`,
			});
		}
	}

	return { errors, warnings };
}

export function validateJsonbPreservation(
	source: JourneyRevisionSnapshot | null,
	proposed: JourneyRevisionSnapshot
): JourneyRevisionFieldError[] {
	if (!source) return [];
	const errors: JourneyRevisionFieldError[] = [];
	for (const key of Object.keys(source.data)) {
		if (!(key in proposed.data) && source.data[key] !== undefined) {
			errors.push({
				field: `data.${key}`,
				code: JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
				message: `JSONB key "${key}" would be lost in proposed snapshot.`,
			});
		}
	}
	return errors;
}

export function validateOperationAgainstJourneyState(
	operation: JourneyRevisionOperation,
	journeyRow: DbRow | null
): JourneyRevisionFieldError[] {
	const errors: JourneyRevisionFieldError[] = [];
	const status = journeyRow ? String(journeyRow.status ?? '').toLowerCase() : null;

	if (operation === 'create') {
		if (journeyRow) {
			errors.push({
				field: 'journeyId',
				code: JOURNEY_REVISION_ERROR_CODES.INVALID_REQUEST,
				message: 'create operation must not include an existing journeyId.',
			});
		}
		return errors;
	}

	if (!journeyRow) {
		errors.push({
			field: 'journeyId',
			code: JOURNEY_REVISION_ERROR_CODES.JOURNEY_NOT_FOUND,
			message: 'Journey not found.',
		});
		return errors;
	}

	if (operation === 'restore' && status !== 'archived') {
		errors.push({
			field: 'operation',
			code: JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
			message: 'restore operation requires an archived Journey.',
		});
	}

	if (operation === 'archive' && status === 'archived') {
		errors.push({
			field: 'operation',
			code: JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
			message: 'Journey is already archived.',
		});
	}

	return errors;
}

export function validateSourceUpdatedAt(
	operation: JourneyRevisionOperation,
	sourceUpdatedAt: string | undefined,
	journeyRow: DbRow | null
): { matched: boolean; errors: JourneyRevisionFieldError[] } {
	if (operation === 'create') {
		return { matched: true, errors: [] };
	}
	if (!sourceUpdatedAt?.trim()) {
		return {
			matched: false,
			errors: [
				{
					field: 'sourceUpdatedAt',
					code: JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
					message: 'sourceUpdatedAt is required for this operation.',
				},
			],
		};
	}
	if (!journeyRow?.updated_at) {
		return { matched: false, errors: [] };
	}
	const live = serializeJourneyUpdatedAt(journeyRow.updated_at as string | Date);
	const matched = live === new Date(sourceUpdatedAt).toISOString();
	if (!matched) {
		return {
			matched: false,
			errors: [
				{
					field: 'sourceUpdatedAt',
					code: JOURNEY_REVISION_ERROR_CODES.SOURCE_CHANGED,
					message:
						'The Journey changed after this revision baseline. Re-read the Journey and dry-run again.',
				},
			],
		};
	}
	return { matched: true, errors: [] };
}

export async function validateSlugUniqueness(
	proposed: JourneyRevisionSnapshot,
	excludeJourneyId: string | null,
	_runQuery: ValidationContext['runQuery']
): Promise<JourneyRevisionFieldError[]> {
	if (!proposed.slug.trim()) {
		return [
			{
				field: 'slug',
				code: 'REQUIRED',
				message: 'Slug is required.',
			},
		];
	}

	const conflict = await findJourneySlugConflict(proposed.slug, excludeJourneyId ?? undefined);
	if (conflict) {
		return [
			{
				field: 'slug',
				code: JOURNEY_REVISION_ERROR_CODES.SLUG_CONFLICT,
				message: 'This Journey slug is already in use.',
			},
		];
	}

	return [];
}

export async function validatePublishGateForSnapshot(
	proposed: JourneyRevisionSnapshot,
	excludeJourneyId: string | null
): Promise<{ errors: JourneyRevisionFieldError[]; seoComplete: boolean }> {
	const status = normalizeJourneyStatusForWrite(proposed.status, 'draft');
	if (status !== 'active') {
		return { errors: [], seoComplete: false };
	}

	const body = {
		title: proposed.title,
		slug: proposed.slug,
		shortDescription: proposed.short_description,
		pageTitle: proposed.page_title,
		metaDescription: proposed.meta_description,
		heroImage: proposed.hero_image_url,
		heroAlt: proposed.hero_image_alt,
		journeyType: proposed.journey_type,
		status: 'active' as const,
	};

	const candidate = publishCandidateFromCreatePayload(
		body as Partial<import('@/types').Journey> & Record<string, unknown>,
		'active'
	);
	if (excludeJourneyId) candidate.id = excludeJourneyId;

	const gate = await runJourneyPublishIntegrityGate(candidate);
	if (!gate.ok) {
		return {
			errors: gate.body.fields.map((f) => ({
				field: f.field,
				code: f.code,
				message: f.message,
			})),
			seoComplete: false,
		};
	}

	return { errors: [], seoComplete: gate.seoComplete };
}

export async function validateResolvedProposedSnapshot(input: {
	operation: JourneyRevisionOperation;
	journeyRow: DbRow | null;
	sourceUpdatedAt: string | null | undefined;
	proposed: JourneyRevisionSnapshot;
	runQuery: ValidationContext['runQuery'];
}): Promise<{
	valid: boolean;
	report: JourneyRevisionValidationReport;
}> {
	const errors: JourneyRevisionFieldError[] = [];
	const warnings: JourneyRevisionWarning[] = [];

	errors.push(...validateOperationAgainstJourneyState(input.operation, input.journeyRow));
	const source =
		input.journeyRow && input.operation !== 'create'
			? rowToJourneyRevisionSnapshot(input.journeyRow)
			: null;

	const sourceCheck = validateSourceUpdatedAt(
		input.operation,
		input.sourceUpdatedAt ?? undefined,
		input.journeyRow
	);
	errors.push(...sourceCheck.errors);
	errors.push(...validateOperationStatusSemantics({ operation: input.operation, source, proposed: input.proposed }));
	errors.push(...compareProtectedPriceValues(source, input.proposed));
	errors.push(...validateJsonbPreservation(source, input.proposed));

	const rel = await validateRelationships(
		input.proposed,
		input.journeyRow ? String(input.journeyRow.id) : null,
		input.runQuery
	);
	errors.push(...rel.errors);
	warnings.push(...rel.warnings);

	errors.push(
		...(await validateSlugUniqueness(
			input.proposed,
			input.journeyRow ? String(input.journeyRow.id) : null,
			input.runQuery
		))
	);

	const gate = await validatePublishGateForSnapshot(
		input.proposed,
		input.journeyRow ? String(input.journeyRow.id) : null
	);
	errors.push(...gate.errors);

	return {
		valid: errors.length === 0,
		report: { errors, warnings },
	};
}

export async function runJourneyRevisionValidation(
	request: JourneyRevisionDryRunRequest,
	ctx: ValidationContext
): Promise<{
	valid: boolean;
	sourceUpdatedAtMatched: boolean;
	proposed: JourneyRevisionSnapshot;
	source: JourneyRevisionSnapshot | null;
	report: JourneyRevisionValidationReport;
	changeSummary: string[];
}> {
	const errors: JourneyRevisionFieldError[] = [];
	const warnings: JourneyRevisionWarning[] = [];

	if (!isValidRevisionOperation(request.operation)) {
		errors.push({
			field: 'operation',
			code: JOURNEY_REVISION_ERROR_CODES.INVALID_REQUEST,
			message: 'Invalid revision operation.',
		});
	}

	const operation = request.operation;
	const journeyRow = ctx.journeyRow;
	errors.push(...validateOperationAgainstJourneyState(operation, journeyRow));

	const source =
		journeyRow && operation !== 'create' ? rowToJourneyRevisionSnapshot(journeyRow) : null;

	const rawChanges = request.changes ?? {};
	errors.push(...detectProtectedClientFieldAttempts(rawChanges));
	errors.push(...detectProtectedPricePathsInChanges(rawChanges, source));

	const { sanitized: changes } = sanitizeClientChanges(rawChanges);
	if (typeof changes.status === 'string') {
		changes.status = defaultProposedStatusForOperation(operation, changes.status);
	} else if (operation === 'archive') {
		changes.status = 'archived';
	} else if (operation === 'restore') {
		changes.status = defaultProposedStatusForOperation(operation);
	}

	const proposed = mergeChangesIntoProposedSnapshot({ operation, source, changes });

	const sourceCheck = validateSourceUpdatedAt(operation, request.sourceUpdatedAt, journeyRow);
	errors.push(...sourceCheck.errors);

	errors.push(...validateOperationStatusSemantics({ operation, source, proposed }));
	errors.push(...compareProtectedPriceValues(source, proposed));
	errors.push(...validateJsonbPreservation(source, proposed));

	const rel = await validateRelationships(
		proposed,
		journeyRow ? String(journeyRow.id) : null,
		ctx.runQuery
	);
	errors.push(...rel.errors);
	warnings.push(...rel.warnings);

	errors.push(
		...(await validateSlugUniqueness(
			proposed,
			journeyRow ? String(journeyRow.id) : null,
			ctx.runQuery
		))
	);

	const gate = await validatePublishGateForSnapshot(
		proposed,
		journeyRow ? String(journeyRow.id) : null
	);
	errors.push(...gate.errors);

	if (!Array.isArray(proposed.data.faqs) && !Array.isArray(proposed.data.faq)) {
		warnings.push({
			code: 'MISSING_FAQ',
			message: 'No FAQ content in proposed snapshot.',
		});
	}

	const report: JourneyRevisionValidationReport = { errors, warnings };
	const changeSummary =
		request.reviewMetadata?.changeSummary ?? computeChangeSummary(source, proposed);

	return {
		valid: errors.length === 0,
		sourceUpdatedAtMatched: sourceCheck.matched,
		proposed,
		source,
		report,
		changeSummary: Array.isArray(changeSummary) ? changeSummary : [String(changeSummary)],
	};
}

export async function withClientQuery(client: PoolClient | null, text: string, params: unknown[] = []) {
	if (client) {
		const result = await client.query(text, params);
		return { rows: result.rows as DbRow[] };
	}
	const { query } = await import('@/lib/db');
	const result = await query(text, params);
	return { rows: result.rows as DbRow[] };
}
