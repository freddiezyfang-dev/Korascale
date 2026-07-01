import { JOURNEY_TYPE_LABELS } from '@/lib/journeyNormalization/constants';
import { journeyTypeLabelToSlug } from '@/lib/journeyNormalization/write';

import { sanitizeClientChanges } from './allowlist';
import {
	buildRevisionJsonbCompatibilityMap,
	canonicalizeJourneyRevisionProposedSnapshot,
} from './compatibilityMapping';
import { readCanonicalJourneyUpdatedAt } from './concurrencyTimestamp';
import { serializeTimestamp } from './timestamps';
import type { JourneyRevisionRelationships, JourneyRevisionSnapshot } from './types';
import { LOCKED_PRICE_SNAPSHOT_KEYS } from './types';

type DbRow = Record<string, unknown>;

function pickStr(...vals: unknown[]): string {
	for (const v of vals) {
		if (typeof v === 'string' && v.trim()) return v.trim();
	}
	return '';
}

function pickNum(val: unknown): number | null {
	if (val == null || val === '') return null;
	const n = Number(val);
	return Number.isFinite(n) ? n : null;
}

function pickBool(val: unknown, fallback = false): boolean {
	if (typeof val === 'boolean') return val;
	return fallback;
}

function toIso(val: unknown): string | null {
	try {
		return serializeTimestamp(val as Date | string | null | undefined);
	} catch {
		return null;
	}
}

export function deepCloneJson<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

export function extractRelationshipsFromData(
	data: Record<string, unknown>,
	journeyId?: string | null
): JourneyRevisionRelationships {
	const relatedJourneyIds = new Set<string>();
	const relatedArticleIds = new Set<string>();

	for (const id of [
		...(Array.isArray(data.relatedJourneyIds) ? data.relatedJourneyIds : []),
		...(Array.isArray(data.relatedJourneys) ? data.relatedJourneys : []),
	]) {
		if (typeof id === 'string' && id.trim()) relatedJourneyIds.add(id.trim());
	}

	for (const id of [
		...(Array.isArray(data.relatedArticles) ? data.relatedArticles : []),
		...(Array.isArray(data.related_articles) ? data.related_articles : []),
	]) {
		if (typeof id === 'string' && id.trim()) relatedArticleIds.add(id.trim());
	}

	if (journeyId) relatedJourneyIds.delete(journeyId);

	return {
		relatedJourneyIds: [...relatedJourneyIds],
		relatedArticleIds: [...relatedArticleIds],
	};
}

export function rowToJourneyRevisionSnapshot(row: DbRow): JourneyRevisionSnapshot {
	const data = deepCloneJson((row.data as Record<string, unknown>) || {});
	const journeyTypeSlug =
		pickStr(row.journey_type_slug, data.journeyTypeSlug) ||
		journeyTypeLabelToSlug(row.journey_type) ||
		'';
	const journeyTypeLabel =
		pickStr(row.journey_type, data.journeyType) ||
		(journeyTypeSlug ? JOURNEY_TYPE_LABELS[journeyTypeSlug as keyof typeof JOURNEY_TYPE_LABELS] : '') ||
		'';

	const id = row.id != null ? String(row.id) : null;

	return canonicalizeJourneyRevisionProposedSnapshot({
		id,
		title: pickStr(row.title, data.title),
		slug: pickStr(row.slug, data.slug),
		status: pickStr(row.status, data.status) || 'draft',
		short_description: pickStr(row.short_description, data.shortDescription),
		description: pickStr(row.description, data.description),
		page_title: pickStr(row.page_title, data.pageTitle, row.title),
		meta_description: pickStr(row.meta_description, data.metaDescription),
		hero_image_url: pickStr(row.hero_image_url, data.heroImage, row.image),
		hero_image_alt: pickStr(row.hero_image_alt, data.heroAlt, data.heroImageAlt),
		journey_type_slug: journeyTypeSlug,
		journey_type: journeyTypeLabel,
		display_order: pickNum(row.display_order),
		seo_complete: row.seo_complete === true,
		data,
		relationships: extractRelationshipsFromData(data, id),
		price: pickNum(row.price),
		original_price: pickNum(row.original_price),
		currency: pickStr(row.currency) || null,
		price_from: pickNum(row.price_from),
		price_basis: pickStr(row.price_basis) || null,
		price_on_request: typeof row.price_on_request === 'boolean' ? row.price_on_request : null,
		price_note: pickStr(row.price_note) || null,
		price_valid_until: toIso(row.price_valid_until),
		category: pickStr(row.category, data.category) || null,
		region: pickStr(row.region, data.region) || null,
		place: pickStr(row.place, data.place) || null,
		city: pickStr(row.city, data.city) || null,
		location: pickStr(row.location, data.location) || null,
		duration: pickStr(row.duration, data.duration) || null,
		difficulty: pickStr(row.difficulty, data.difficulty) || null,
		max_participants: pickNum(row.max_participants),
		min_participants: pickNum(row.min_participants),
		image: pickStr(row.image, data.image) || null,
		featured: pickBool(row.featured, false),
		rating: pickNum(row.rating),
		review_count: pickNum(row.review_count),
		created_at: toIso(row.created_at),
		updated_at: readCanonicalJourneyUpdatedAt(row) ?? toIso(row.updated_at),
	});
}

export function emptyCreateSnapshot(): JourneyRevisionSnapshot {
	return {
		id: null,
		title: '',
		slug: '',
		status: 'draft',
		short_description: '',
		description: '',
		page_title: '',
		meta_description: '',
		hero_image_url: '',
		hero_image_alt: '',
		journey_type_slug: '',
		journey_type: '',
		display_order: null,
		seo_complete: false,
		data: {},
		relationships: { relatedJourneyIds: [], relatedArticleIds: [] },
		price: null,
		original_price: null,
		currency: null,
		price_from: null,
		price_basis: null,
		price_on_request: null,
		price_note: null,
		price_valid_until: null,
		category: null,
		region: null,
		place: null,
		city: null,
		location: null,
		duration: null,
		difficulty: null,
		max_participants: null,
		min_participants: null,
		image: null,
		featured: false,
		rating: null,
		review_count: null,
		created_at: null,
		updated_at: null,
	};
}

function mergeDataPreservingUnknown(
	base: Record<string, unknown>,
	patch: Record<string, unknown>
): Record<string, unknown> {
	return { ...base, ...patch };
}

function applyRelationshipsToData(
	data: Record<string, unknown>,
	relationships: JourneyRevisionRelationships,
	syncIds: boolean
): Record<string, unknown> {
	if (!syncIds) return data;
	const next = { ...data };
	if (relationships.relatedJourneyIds.length) {
		next.relatedJourneyIds = relationships.relatedJourneyIds;
	}
	if (relationships.relatedArticleIds.length) {
		next.relatedArticles = relationships.relatedArticleIds;
	}
	return next;
}

export function extractPriceFields(snapshot: JourneyRevisionSnapshot): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const key of LOCKED_PRICE_SNAPSHOT_KEYS as readonly string[]) {
		out[key] = snapshot[key as keyof JourneyRevisionSnapshot];
	}
	return out;
}

export function mergeChangesIntoProposedSnapshot(input: {
	operation: 'create' | 'update' | 'archive' | 'restore';
	source: JourneyRevisionSnapshot | null;
	changes: Record<string, unknown>;
}): JourneyRevisionSnapshot {
	const { operation, source } = input;
	const { sanitized: changes } = sanitizeClientChanges(input.changes);
	const base =
		operation === 'create'
			? emptyCreateSnapshot()
			: deepCloneJson(source ?? emptyCreateSnapshot());

	const dataPatch =
		changes.data && typeof changes.data === 'object' && !Array.isArray(changes.data)
			? (changes.data as Record<string, unknown>)
			: {};

	const scalarPatch = { ...changes };
	delete scalarPatch.data;
	delete scalarPatch.relationships;

	const merged: JourneyRevisionSnapshot = {
		...base,
		...scalarPatch,
		data: mergeDataPreservingUnknown(base.data, dataPatch),
	};

	const syncRelationshipIds = 'relationships' in changes;
	if (syncRelationshipIds && changes.relationships && typeof changes.relationships === 'object') {
		const rel = changes.relationships as JourneyRevisionRelationships;
		merged.relationships = {
			relatedJourneyIds: Array.isArray(rel.relatedJourneyIds)
				? rel.relatedJourneyIds
				: base.relationships.relatedJourneyIds,
			relatedArticleIds: Array.isArray(rel.relatedArticleIds)
				? rel.relatedArticleIds
				: base.relationships.relatedArticleIds,
		};
	}

	merged.data = applyRelationshipsToData(merged.data, merged.relationships, syncRelationshipIds);

	if (operation === 'archive' && source) {
		return canonicalizeJourneyRevisionProposedSnapshot({
			...deepCloneJson(source),
			status: 'archived',
			data: deepCloneJson(source.data),
			relationships: deepCloneJson(source.relationships),
			seo_complete: false,
		});
	}

	if (operation === 'restore' && source) {
		const requestedStatus =
			typeof changes.status === 'string' && changes.status.trim()
				? String(changes.status).trim()
				: 'draft';
		return canonicalizeJourneyRevisionProposedSnapshot({
			...deepCloneJson(source),
			status: requestedStatus === 'active' ? 'active' : 'draft',
			data: deepCloneJson(source.data),
			relationships: deepCloneJson(source.relationships),
			seo_complete: false,
		});
	}

	if (operation === 'create') {
		merged.price = null;
		merged.original_price = null;
		merged.currency = null;
		merged.price_from = null;
		merged.price_basis = null;
		merged.price_on_request = null;
		merged.price_note = null;
		merged.price_valid_until = null;
	}

	merged.seo_complete = false;
	return canonicalizeJourneyRevisionProposedSnapshot(merged);
}

export function snapshotToMutationBody(snapshot: JourneyRevisionSnapshot): Record<string, unknown> {
	return {
		title: snapshot.title,
		slug: snapshot.slug,
		description: snapshot.description,
		shortDescription: snapshot.short_description,
		...buildRevisionJsonbCompatibilityMap(snapshot),
		status: snapshot.status,
		category: snapshot.category,
		region: snapshot.region,
		place: snapshot.place,
		city: snapshot.city,
		location: snapshot.location,
		duration: snapshot.duration,
		difficulty: snapshot.difficulty,
		maxParticipants: snapshot.max_participants,
		minParticipants: snapshot.min_participants,
		image: snapshot.image,
		featured: snapshot.featured,
		rating: snapshot.rating,
		reviewCount: snapshot.review_count,
		displayOrder: snapshot.display_order,
		price: snapshot.price ?? 0,
		originalPrice: snapshot.original_price,
		...snapshot.data,
	};
}

export function serializeJourneyUpdatedAt(value: Date | string): string {
	const serialized = serializeTimestamp(value, 'journey.updated_at');
	if (!serialized) throw new Error('journey.updated_at is required.');
	return serialized;
}

export function computeChangeSummary(
	source: JourneyRevisionSnapshot | null,
	proposed: JourneyRevisionSnapshot
): string[] {
	if (!source) {
		return proposed.title ? [`Create Journey "${proposed.title}"`] : ['Create new Journey'];
	}
	const changes: string[] = [];
	if (source.status !== proposed.status) {
		changes.push(`status: ${source.status} → ${proposed.status}`);
	}
	if (source.title !== proposed.title) changes.push('title updated');
	if (source.slug !== proposed.slug) changes.push('slug updated');
	if (source.page_title !== proposed.page_title) changes.push('page_title updated');
	if (source.meta_description !== proposed.meta_description) changes.push('meta_description updated');
	if (JSON.stringify(source.data.itinerary) !== JSON.stringify(proposed.data.itinerary)) {
		changes.push('itinerary updated');
	}
	if (changes.length === 0) changes.push('No material field changes detected');
	return changes;
}
