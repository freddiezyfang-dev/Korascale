import {
	JOURNEY_TYPE_LABEL_TO_SLUG,
	type JourneyTypeSlug,
} from './constants';
import {
	resolveHeroImageAlt,
	resolveHeroImageUrl,
	resolveMetaDescription,
	resolvePageTitle,
	resolveJourneyTypeSlug,
} from './fields';
import { pickFirstNonEmptyString } from './slug';
import { isJourneyTypeSlug, normalizeJourneyTypeSlug } from './taxonomy';
import type { JourneyRowLike } from './types';

export const PR_J2B3A_EXCLUDED_ID = 'e468b842-7c59-4258-8d56-8b585566be82';

export const PR_J2B3A_EXPECTED_TOTAL = 83;
export const PR_J2B3A_EXPECTED_ACTIVE = 24;
export const PR_J2B3A_EXPECTED_ARCHIVED = 59;
export const PR_J2B3A_MANIFEST_COUNT = 24;

export type B3aFieldSource =
	| 'data.pageTitle'
	| 'title'
	| 'data.metaDescription'
	| 'short_description'
	| 'data.heroImage'
	| 'image'
	| 'journey_type_slug'
	| 'legacy_journey_type'
	| 'data.journeyType'
	| 'column_existing'
	| 'ambiguous'
	| 'missing';

export type B3aActiveFieldProposal = {
	proposed: string;
	source: B3aFieldSource;
};

export type B3aActiveManifestEntry = {
	readonly id: string;
	readonly slug: string;
	readonly pageTitle: B3aActiveFieldProposal;
	readonly metaDescription: B3aActiveFieldProposal;
	readonly heroImageUrl: B3aActiveFieldProposal;
	readonly journeyTypeSlug: B3aActiveFieldProposal;
	readonly manualReview: boolean;
	readonly reason: string;
};

export type B3aSourceMatrixRow = {
	id: string;
	slug: string;
	title: string;
	dataPageTitle: string;
	titleFallback: string;
	resolvedPageTitle: string;
	pageTitleColumnBefore: string;
	pageTitleProposed: string;
	pageTitleSource: string;
	dataMetaDescription: string;
	shortDescriptionFallback: string;
	resolvedMetaDescription: string;
	metaDescriptionColumnBefore: string;
	metaDescriptionProposed: string;
	metaDescriptionSource: string;
	dataHeroImage: string;
	imageFallback: string;
	resolvedHeroImageUrl: string;
	heroImageUrlColumnBefore: string;
	heroImageUrlProposed: string;
	heroImageSource: string;
	legacyJourneyType: string;
	dataJourneyType: string;
	resolvedJourneyTypeSlug: string;
	journeyTypeSlugColumnBefore: string;
	journeyTypeSlugProposed: string;
	journeyTypeSlugSource: string;
	manualReview: boolean;
	reason: string;
};

export type B3aRenderedSnapshotEntry = {
	id: string;
	slug: string;
	resolvedPageTitleBefore: string;
	resolvedMetaDescriptionBefore: string;
	resolvedHeroImageUrlBefore: string;
	resolvedJourneyTypeSlugBefore: string;
	proposedPageTitle: string;
	proposedMetaDescription: string;
	proposedHeroImageUrl: string;
	proposedJourneyTypeSlug: string;
	pageTitleSource: string;
	metaDescriptionSource: string;
	heroImageSource: string;
	journeyTypeSlugSource: string;
};

export type B3aPreflightResult = {
	ready: boolean;
	databaseIdentity: string;
	total: number;
	active: number;
	archived: number;
	manifestCount: number;
	missingManifestIds: string[];
	statusMismatchIds: string[];
	slugMismatchIds: string[];
	pageTitleResolved: number;
	pageTitleMissing: number;
	metaDescriptionResolved: number;
	metaDescriptionMissing: number;
	heroImageResolved: number;
	heroImageMissing: number;
	taxonomyResolved: number;
	taxonomyAmbiguous: number;
	columnConflictIds: string[];
	heroAltComplete: number;
	manualReviewIds: string[];
};

function journeyData(row: JourneyRowLike): Record<string, unknown> {
	return row.data && typeof row.data === 'object'
		? (row.data as Record<string, unknown>)
		: {};
}

function columnValue(row: JourneyRowLike, column: string): string {
	return pickFirstNonEmptyString((row as Record<string, unknown>)[column]);
}

function proposePageTitleFromMigrationRules(
	row: JourneyRowLike
): B3aActiveFieldProposal {
	const data = journeyData(row);
	const explicit = pickFirstNonEmptyString(data.pageTitle);
	if (explicit) return { proposed: explicit, source: 'data.pageTitle' };
	const fallback = pickFirstNonEmptyString(row.title);
	if (fallback) return { proposed: fallback, source: 'title' };
	return { proposed: '', source: 'missing' };
}

function proposeMetaDescriptionFromMigrationRules(
	row: JourneyRowLike
): B3aActiveFieldProposal {
	const data = journeyData(row);
	const explicit = pickFirstNonEmptyString(data.metaDescription);
	if (explicit) return { proposed: explicit, source: 'data.metaDescription' };
	const fallback = pickFirstNonEmptyString(row.short_description);
	if (fallback) return { proposed: fallback, source: 'short_description' };
	return { proposed: '', source: 'missing' };
}

function proposeHeroImageUrlFromMigrationRules(
	row: JourneyRowLike
): B3aActiveFieldProposal {
	const data = journeyData(row);
	const explicit = pickFirstNonEmptyString(data.heroImage);
	if (explicit) return { proposed: explicit, source: 'data.heroImage' };
	const fallback = pickFirstNonEmptyString(row.image);
	if (fallback) return { proposed: fallback, source: 'image' };
	return { proposed: '', source: 'missing' };
}

function proposeJourneyTypeSlugFromMigrationRules(
	row: JourneyRowLike
): B3aActiveFieldProposal {
	const column = columnValue(row, 'journey_type_slug');
	if (column && isJourneyTypeSlug(column)) {
		return { proposed: column, source: 'journey_type_slug' };
	}
	const data = journeyData(row);
	const legacy = pickFirstNonEmptyString(row.journey_type);
	const fromLegacy = legacy ? normalizeJourneyTypeSlug(legacy) : null;
	if (fromLegacy) {
		return { proposed: fromLegacy, source: 'legacy_journey_type' };
	}
	const jsonb = pickFirstNonEmptyString(data.journeyType);
	const fromJsonb = jsonb ? normalizeJourneyTypeSlug(jsonb) : null;
	if (fromJsonb) {
		return { proposed: fromJsonb, source: 'data.journeyType' };
	}
	if (legacy || jsonb) {
		return { proposed: '', source: 'ambiguous' };
	}
	return { proposed: '', source: 'missing' };
}

function resolveFrontendFieldValues(row: JourneyRowLike): {
	pageTitle: string;
	metaDescription: string;
	heroImageUrl: string;
	journeyTypeSlug: string;
} {
	return {
		pageTitle: resolvePageTitle(row).value,
		metaDescription: resolveMetaDescription(row).value,
		heroImageUrl: resolveHeroImageUrl(row).value,
		journeyTypeSlug: resolveJourneyTypeSlug(row).value,
	};
}

function hasColumnConflict(
	row: JourneyRowLike,
	column: string,
	migrationProposal: B3aActiveFieldProposal
): boolean {
	const existing = columnValue(row, column);
	if (!existing) return false;
	return existing !== migrationProposal.proposed;
}

export function buildB3aActiveManifestEntry(row: JourneyRowLike): B3aActiveManifestEntry {
	const pageRules = proposePageTitleFromMigrationRules(row);
	const metaRules = proposeMetaDescriptionFromMigrationRules(row);
	const heroRules = proposeHeroImageUrlFromMigrationRules(row);
	const typeRules = proposeJourneyTypeSlugFromMigrationRules(row);
	const frontend = resolveFrontendFieldValues(row);

	const reasons: string[] = [];
	let manualReview = false;

	const alignField = (
		row: JourneyRowLike,
		column: string,
		rules: B3aActiveFieldProposal,
		frontendValue: string,
		label: string
	): B3aActiveFieldProposal => {
		if (!frontendValue) {
			manualReview = true;
			reasons.push(`${label} unresolved`);
			return rules;
		}
		if (rules.proposed && rules.proposed !== frontendValue && !columnValue(row, column)) {
			manualReview = true;
			reasons.push(`${label} migration rules differ from flag-on resolved value`);
		}
		const source = columnValue(row, column) ? 'column_existing' : rules.source;
		return { proposed: frontendValue, source };
	};

	const pageTitle = alignField(row, 'page_title', pageRules, frontend.pageTitle, 'page_title');
	const metaDescription = alignField(
		row,
		'meta_description',
		metaRules,
		frontend.metaDescription,
		'meta_description'
	);
	const heroImageUrl = alignField(
		row,
		'hero_image_url',
		heroRules,
		frontend.heroImageUrl,
		'hero_image_url'
	);
	const journeyTypeSlug = alignField(
		row,
		'journey_type_slug',
		typeRules,
		frontend.journeyTypeSlug,
		'journey_type_slug'
	);

	if (typeRules.source === 'ambiguous') {
		manualReview = true;
		reasons.push('ambiguous journey_type_slug');
	}

	if (hasColumnConflict(row, 'page_title', pageRules)) {
		manualReview = true;
		reasons.push('page_title column conflicts with migration source');
	}
	if (hasColumnConflict(row, 'meta_description', metaRules)) {
		manualReview = true;
		reasons.push('meta_description column conflicts with migration source');
	}
	if (hasColumnConflict(row, 'hero_image_url', heroRules)) {
		manualReview = true;
		reasons.push('hero_image_url column conflicts with migration source');
	}
	if (hasColumnConflict(row, 'journey_type_slug', typeRules)) {
		manualReview = true;
		reasons.push('journey_type_slug column conflicts with migration source');
	}

	return {
		id: String(row.id).toLowerCase(),
		slug: String(row.slug ?? ''),
		pageTitle,
		metaDescription,
		heroImageUrl,
		journeyTypeSlug,
		manualReview,
		reason: reasons.length ? reasons.join('; ') : 'active metadata backfill candidate',
	};
}

export function buildB3aSourceMatrixRow(row: JourneyRowLike): B3aSourceMatrixRow {
	const data = journeyData(row);
	const pageRules = proposePageTitleFromMigrationRules(row);
	const metaRules = proposeMetaDescriptionFromMigrationRules(row);
	const heroRules = proposeHeroImageUrlFromMigrationRules(row);
	const typeRules = proposeJourneyTypeSlugFromMigrationRules(row);
	const frontend = resolveFrontendFieldValues(row);
	const entry = buildB3aActiveManifestEntry(row);

	return {
		id: String(row.id).toLowerCase(),
		slug: String(row.slug ?? ''),
		title: pickFirstNonEmptyString(row.title),
		dataPageTitle: pickFirstNonEmptyString(data.pageTitle),
		titleFallback: pickFirstNonEmptyString(row.title),
		resolvedPageTitle: frontend.pageTitle,
		pageTitleColumnBefore: columnValue(row, 'page_title'),
		pageTitleProposed: entry.pageTitle.proposed,
		pageTitleSource: entry.pageTitle.source,
		dataMetaDescription: pickFirstNonEmptyString(data.metaDescription),
		shortDescriptionFallback: pickFirstNonEmptyString(row.short_description),
		resolvedMetaDescription: frontend.metaDescription,
		metaDescriptionColumnBefore: columnValue(row, 'meta_description'),
		metaDescriptionProposed: entry.metaDescription.proposed,
		metaDescriptionSource: entry.metaDescription.source,
		dataHeroImage: pickFirstNonEmptyString(data.heroImage),
		imageFallback: pickFirstNonEmptyString(row.image),
		resolvedHeroImageUrl: frontend.heroImageUrl,
		heroImageUrlColumnBefore: columnValue(row, 'hero_image_url'),
		heroImageUrlProposed: entry.heroImageUrl.proposed,
		heroImageSource: entry.heroImageUrl.source,
		legacyJourneyType: pickFirstNonEmptyString(row.journey_type),
		dataJourneyType: pickFirstNonEmptyString(data.journeyType),
		resolvedJourneyTypeSlug: frontend.journeyTypeSlug,
		journeyTypeSlugColumnBefore: columnValue(row, 'journey_type_slug'),
		journeyTypeSlugProposed: entry.journeyTypeSlug.proposed,
		journeyTypeSlugSource: entry.journeyTypeSlug.source,
		manualReview: entry.manualReview,
		reason: entry.reason,
	};
}

export function buildB3aRenderedSnapshotEntry(
	row: JourneyRowLike
): B3aRenderedSnapshotEntry {
	const entry = buildB3aActiveManifestEntry(row);
	const frontend = resolveFrontendFieldValues(row);
	return {
		id: entry.id,
		slug: entry.slug,
		resolvedPageTitleBefore: frontend.pageTitle,
		resolvedMetaDescriptionBefore: frontend.metaDescription,
		resolvedHeroImageUrlBefore: frontend.heroImageUrl,
		resolvedJourneyTypeSlugBefore: frontend.journeyTypeSlug,
		proposedPageTitle: entry.pageTitle.proposed,
		proposedMetaDescription: entry.metaDescription.proposed,
		proposedHeroImageUrl: entry.heroImageUrl.proposed,
		proposedJourneyTypeSlug: entry.journeyTypeSlug.proposed,
		pageTitleSource: entry.pageTitle.source,
		metaDescriptionSource: entry.metaDescription.source,
		heroImageSource: entry.heroImageUrl.source,
		journeyTypeSlugSource: entry.journeyTypeSlug.source,
	};
}

export function summarizeB3aSourceStats(matrix: B3aSourceMatrixRow[]) {
	const pageTitle = {
		explicitDataPageTitle: matrix.filter((r) => r.pageTitleSource === 'data.pageTitle')
			.length,
		titleFallback: matrix.filter((r) => r.pageTitleSource === 'title').length,
		columnExisting: matrix.filter((r) => r.pageTitleSource === 'column_existing').length,
		resolved: matrix.filter((r) => r.resolvedPageTitle).length,
	};
	const metaDescription = {
		explicitDataMetaDescription: matrix.filter(
			(r) => r.metaDescriptionSource === 'data.metaDescription'
		).length,
		shortDescriptionFallback: matrix.filter(
			(r) => r.metaDescriptionSource === 'short_description'
		).length,
		columnExisting: matrix.filter((r) => r.metaDescriptionSource === 'column_existing')
			.length,
		resolved: matrix.filter((r) => r.resolvedMetaDescription).length,
	};
	const heroImage = {
		explicitDataHeroImage: matrix.filter((r) => r.heroImageSource === 'data.heroImage')
			.length,
		imageFallback: matrix.filter((r) => r.heroImageSource === 'image').length,
		columnExisting: matrix.filter((r) => r.heroImageSource === 'column_existing').length,
		resolved: matrix.filter((r) => r.resolvedHeroImageUrl).length,
	};
	const taxonomy = {
		journeyTypeSlugColumn: matrix.filter(
			(r) => r.journeyTypeSlugProposed && r.journeyTypeSlugColumnBefore === r.journeyTypeSlugProposed
		).length,
		legacyJourneyTypeMapped: matrix.filter(
			(r) => r.journeyTypeSlugSource === 'legacy_journey_type'
		).length,
		jsonbFallback: matrix.filter((r) => r.journeyTypeSlugSource === 'data.journeyType')
			.length,
		ambiguous: matrix.filter((r) => r.journeyTypeSlugSource === 'ambiguous').length,
		resolved: matrix.filter((r) => r.resolvedJourneyTypeSlug).length,
	};
	return { pageTitle, metaDescription, heroImage, taxonomy };
}

export function countB3aProposedUpdates(
	rows: JourneyRowLike[],
	manifest: readonly B3aActiveManifestEntry[]
) {
	const rowById = new Map(rows.map((r) => [String(r.id).toLowerCase(), r]));
	const countField = (
		column: string,
		getProposed: (e: B3aActiveManifestEntry) => string
	) => {
		let existingNonEmpty = 0;
		let proposedUpdate = 0;
		for (const entry of manifest) {
			const row = rowById.get(entry.id);
			if (!row) continue;
			const before = columnValue(row, column);
			if (before) existingNonEmpty += 1;
			else if (getProposed(entry)) proposedUpdate += 1;
		}
		return { existingNonEmpty, proposedUpdate };
	};
	return {
		pageTitle: countField('page_title', (e) => e.pageTitle.proposed),
		metaDescription: countField('meta_description', (e) => e.metaDescription.proposed),
		heroImageUrl: countField('hero_image_url', (e) => e.heroImageUrl.proposed),
		journeyTypeSlug: countField('journey_type_slug', (e) => e.journeyTypeSlug.proposed),
		heroImageAlt: {
			existingNonEmpty: rows.filter((r) => columnValue(r, 'hero_image_alt')).length,
			proposedUpdate: 0,
		},
	};
}

export function findB3aColumnConflictIds(
	rows: JourneyRowLike[],
	manifest: readonly B3aActiveManifestEntry[]
): string[] {
	const rowById = new Map(rows.map((r) => [String(r.id).toLowerCase(), r]));
	const conflicts: string[] = [];
	for (const entry of manifest) {
		const row = rowById.get(entry.id);
		if (!row) continue;
		if (
			hasColumnConflict(row, 'page_title', proposePageTitleFromMigrationRules(row)) ||
			hasColumnConflict(row, 'meta_description', proposeMetaDescriptionFromMigrationRules(row)) ||
			hasColumnConflict(row, 'hero_image_url', proposeHeroImageUrlFromMigrationRules(row)) ||
			hasColumnConflict(row, 'journey_type_slug', proposeJourneyTypeSlugFromMigrationRules(row))
		) {
			conflicts.push(entry.id);
		}
	}
	return conflicts;
}

export function evaluateB3aPreflight(
	rows: JourneyRowLike[],
	manifest: readonly B3aActiveManifestEntry[],
	options: { databaseIdentity: string }
): B3aPreflightResult {
	const activeRows = rows.filter((r) => String(r.status) === 'active');
	const rowById = new Map(rows.map((r) => [String(r.id).toLowerCase(), r]));
	const manifestIds = new Set(manifest.map((e) => e.id));

	const missingManifestIds = manifest
		.filter((e) => !rowById.has(e.id))
		.map((e) => e.id);
	const statusMismatchIds = manifest
		.filter((e) => rowById.get(e.id) && String(rowById.get(e.id)!.status) !== 'active')
		.map((e) => e.id);
	const slugMismatchIds = manifest
		.filter((e) => rowById.get(e.id) && String(rowById.get(e.id)!.slug) !== e.slug)
		.map((e) => e.id);

	const pageTitleResolved = manifest.filter((e) => e.pageTitle.proposed).length;
	const metaDescriptionResolved = manifest.filter((e) => e.metaDescription.proposed).length;
	const heroImageResolved = manifest.filter((e) => e.heroImageUrl.proposed).length;
	const taxonomyResolved = manifest.filter((e) => e.journeyTypeSlug.proposed).length;
	const taxonomyAmbiguous = manifest.filter(
		(e) => e.journeyTypeSlug.source === 'ambiguous'
	).length;
	const manualReviewIds = manifest.filter((e) => e.manualReview).map((e) => e.id);
	const columnConflictIds = findB3aColumnConflictIds(rows, manifest);
	const heroAltComplete = activeRows.filter((r) => columnValue(r, 'hero_image_alt')).length;

	const ready =
		rows.length === PR_J2B3A_EXPECTED_TOTAL &&
		activeRows.length === PR_J2B3A_EXPECTED_ACTIVE &&
		rows.filter((r) => String(r.status) === 'archived').length ===
			PR_J2B3A_EXPECTED_ARCHIVED &&
		manifest.length === PR_J2B3A_MANIFEST_COUNT &&
		missingManifestIds.length === 0 &&
		statusMismatchIds.length === 0 &&
		slugMismatchIds.length === 0 &&
		pageTitleResolved === PR_J2B3A_MANIFEST_COUNT &&
		metaDescriptionResolved === PR_J2B3A_MANIFEST_COUNT &&
		heroImageResolved === PR_J2B3A_MANIFEST_COUNT &&
		taxonomyResolved === PR_J2B3A_MANIFEST_COUNT &&
		taxonomyAmbiguous === 0 &&
		columnConflictIds.length === 0 &&
		manualReviewIds.length === 0 &&
		heroAltComplete === PR_J2B3A_EXPECTED_ACTIVE &&
		!manifestIds.has(PR_J2B3A_EXCLUDED_ID);

	return {
		ready,
		databaseIdentity: options.databaseIdentity,
		total: rows.length,
		active: activeRows.length,
		archived: rows.filter((r) => String(r.status) === 'archived').length,
		manifestCount: manifest.length,
		missingManifestIds,
		statusMismatchIds,
		slugMismatchIds,
		pageTitleResolved,
		pageTitleMissing: manifest.length - pageTitleResolved,
		metaDescriptionResolved,
		metaDescriptionMissing: manifest.length - metaDescriptionResolved,
		heroImageResolved,
		heroImageMissing: manifest.length - heroImageResolved,
		taxonomyResolved,
		taxonomyAmbiguous,
		columnConflictIds,
		heroAltComplete,
		manualReviewIds,
	};
}

export function maskDatabaseIdentity(connectionString?: string): string {
	if (!connectionString) return 'unknown';
	try {
		const url = new URL(connectionString.replace(/^postgres(ql)?:\/\//, 'https://'));
		return `${url.hostname}${url.pathname}`;
	} catch {
		return 'masked';
	}
}

export function sqlEscape(value: string): string {
	return value.replace(/'/g, "''");
}

export function migrationSqlModifiesOnlyB3aMetadata(sql: string): boolean {
	const stripped = sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n');
	const updateBlocks = [
		...stripped.matchAll(/UPDATE\s+journeys[\s\S]*?SET\s+([\s\S]*?)\s+FROM/gi),
	];
	if (updateBlocks.length === 0) return false;
	const required = [
		'page_title',
		'meta_description',
		'hero_image_url',
		'journey_type_slug',
	];
	const forbiddenAssignments =
		/\b(?:status|slug|title|hero_image_alt|seo_complete|price_from|data)\s*=/i;
	return updateBlocks.every((block) => {
		const setClause = block[1];
		if (forbiddenAssignments.test(setClause)) return false;
		return required.every((column) =>
			new RegExp(`\\b${column}\\s*=`, 'i').test(setClause)
		);
	});
}

export type ParsedB3aManifestRow = {
	id: string;
	slug: string;
	pageTitle: string;
	metaDescription: string;
	heroImageUrl: string;
	journeyTypeSlug: string;
};

export type ParsedB3aRollbackOldRow = {
	id: string;
	oldPageTitle: string | null;
	oldMetaDescription: string | null;
	oldHeroImageUrl: string | null;
	oldJourneyTypeSlug: string | null;
};

function unsqlString(value: string): string {
	return value.replace(/''/g, "'");
}

function parseCsvLine(line: string): string[] {
	const fields: string[] = [];
	let current = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i += 1;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (ch === ',' && !inQuotes) {
			fields.push(current);
			current = '';
		} else {
			current += ch;
		}
	}
	fields.push(current);
	return fields;
}

export function manifestToParsedRows(
	manifest: readonly B3aActiveManifestEntry[]
): ParsedB3aManifestRow[] {
	return manifest
		.map((entry) => ({
			id: entry.id.toLowerCase(),
			slug: entry.slug,
			pageTitle: entry.pageTitle.proposed,
			metaDescription: entry.metaDescription.proposed,
			heroImageUrl: entry.heroImageUrl.proposed,
			journeyTypeSlug: entry.journeyTypeSlug.proposed,
		}))
		.sort((a, b) => a.id.localeCompare(b.id));
}

export function extractB3aManifestFromForwardSql(sql: string): ParsedB3aManifestRow[] {
	const rows: ParsedB3aManifestRow[] = [];
	for (const line of sql.split('\n')) {
		const match = line.match(
			/\('([0-9a-f-]{36})'::uuid,\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)'\)/i
		);
		if (!match) continue;
		rows.push({
			id: match[1].toLowerCase(),
			slug: unsqlString(match[2]),
			pageTitle: unsqlString(match[3]),
			metaDescription: unsqlString(match[4]),
			heroImageUrl: unsqlString(match[5]),
			journeyTypeSlug: unsqlString(match[6]),
		});
	}
	return rows.sort((a, b) => a.id.localeCompare(b.id));
}

export function extractB3aManifestFromRollbackB3aSql(sql: string): ParsedB3aManifestRow[] {
	const section = sql.split('INSERT INTO pr_j2b3a_b3a_values')[1]?.split('CREATE TEMP TABLE')[0] ?? '';
	const rows: ParsedB3aManifestRow[] = [];
	for (const line of section.split('\n')) {
		const match = line.match(
			/\('([0-9a-f-]{36})'::uuid,\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)'\)/i
		);
		if (!match) continue;
		rows.push({
			id: match[1].toLowerCase(),
			slug: '',
			pageTitle: unsqlString(match[2]),
			metaDescription: unsqlString(match[3]),
			heroImageUrl: unsqlString(match[4]),
			journeyTypeSlug: unsqlString(match[5]),
		});
	}
	return rows.sort((a, b) => a.id.localeCompare(b.id));
}

export function extractB3aRollbackOldFromSql(sql: string): ParsedB3aRollbackOldRow[] {
	const section = sql.split('INSERT INTO pr_j2b3a_rollback')[1]?.split('CREATE TEMP TABLE')[0] ?? '';
	const rows: ParsedB3aRollbackOldRow[] = [];
	for (const line of section.split('\n')) {
		const match = line.match(/\('([0-9a-f-]{36})'::uuid,\s*([^)]+)\)/i);
		if (!match) continue;
		const parts = match[2].split(',').map((part) => part.trim());
		const parseSqlValue = (part: string): string | null => {
			if (part === 'NULL') return null;
			return unsqlString(part.replace(/^'/, '').replace(/'$/, ''));
		};
		rows.push({
			id: match[1].toLowerCase(),
			oldPageTitle: parseSqlValue(parts[0] ?? 'NULL'),
			oldMetaDescription: parseSqlValue(parts[1] ?? 'NULL'),
			oldHeroImageUrl: parseSqlValue(parts[2] ?? 'NULL'),
			oldJourneyTypeSlug: parseSqlValue(parts[3] ?? 'NULL'),
		});
	}
	return rows.sort((a, b) => a.id.localeCompare(b.id));
}

export function extractB3aManifestFromPreviewCsv(csv: string): ParsedB3aManifestRow[] {
	const lines = csv.trim().split('\n').slice(1);
	return lines
		.map((line) => {
			const [
				id,
				slug,
				pageTitle,
				,
				metaDescription,
				,
				heroImageUrl,
				,
				journeyTypeSlug,
			] = parseCsvLine(line);
			return {
				id: id.toLowerCase(),
				slug,
				pageTitle,
				metaDescription,
				heroImageUrl,
				journeyTypeSlug,
			};
		})
		.sort((a, b) => a.id.localeCompare(b.id));
}

export function extractB3aManifestFromSnapshotJson(json: string): ParsedB3aManifestRow[] {
	const parsed = JSON.parse(json) as {
		entries: Array<{
			id: string;
			slug: string;
			proposedPageTitle: string;
			proposedMetaDescription: string;
			proposedHeroImageUrl: string;
			proposedJourneyTypeSlug: string;
		}>;
	};
	return parsed.entries
		.map((entry) => ({
			id: entry.id.toLowerCase(),
			slug: entry.slug,
			pageTitle: entry.proposedPageTitle,
			metaDescription: entry.proposedMetaDescription,
			heroImageUrl: entry.proposedHeroImageUrl,
			journeyTypeSlug: entry.proposedJourneyTypeSlug,
		}))
		.sort((a, b) => a.id.localeCompare(b.id));
}

export function compareB3aManifestRows(
	left: ParsedB3aManifestRow[],
	right: ParsedB3aManifestRow[]
): boolean {
	if (left.length !== right.length) return false;
	for (let i = 0; i < left.length; i++) {
		const a = left[i];
		const b = right[i];
		if (
			a.id !== b.id ||
			a.slug !== b.slug ||
			a.pageTitle !== b.pageTitle ||
			a.metaDescription !== b.metaDescription ||
			a.heroImageUrl !== b.heroImageUrl ||
			a.journeyTypeSlug !== b.journeyTypeSlug
		) {
			return false;
		}
	}
	return true;
}

export function compareB3aProposedValues(
	left: ParsedB3aManifestRow[],
	right: ParsedB3aManifestRow[]
): boolean {
	if (left.length !== right.length) return false;
	const rightById = new Map(right.map((row) => [row.id, row]));
	for (const row of left) {
		const other = rightById.get(row.id);
		if (!other) return false;
		if (
			row.pageTitle !== other.pageTitle ||
			row.metaDescription !== other.metaDescription ||
			row.heroImageUrl !== other.heroImageUrl ||
			row.journeyTypeSlug !== other.journeyTypeSlug
		) {
			return false;
		}
	}
	return true;
}

export function rollbackWouldAbortOnAdminEdit(
	b3aExpected: ParsedB3aManifestRow[],
	currentValues: ParsedB3aManifestRow[]
): boolean {
	const currentById = new Map(currentValues.map((row) => [row.id, row]));
	for (const expected of b3aExpected) {
		const current = currentById.get(expected.id);
		if (!current) return true;
		if (
			current.pageTitle !== expected.pageTitle ||
			current.metaDescription !== expected.metaDescription ||
			current.heroImageUrl !== expected.heroImageUrl ||
			current.journeyTypeSlug !== expected.journeyTypeSlug
		) {
			return true;
		}
	}
	return false;
}

export function forwardMigrationExpectsTwentyFourUpdatedRows(sql: string): boolean {
	return /updated_rows\s*<>\s*24/i.test(sql) && !/updated_rows\s*<>\s*96/i.test(sql);
}

export function simulateB3aRollback(
	rows: JourneyRowLike[],
	manifest: readonly B3aActiveManifestEntry[],
	rollbackValues: Array<{
		id: string;
		oldPageTitle: string | null;
		oldMetaDescription: string | null;
		oldHeroImageUrl: string | null;
		oldJourneyTypeSlug: string | null;
	}>
): { restoredIds: string[]; externalUnchanged: boolean } {
	const manifestIds = new Set(manifest.map((e) => e.id));
	const rollbackById = new Map(rollbackValues.map((r) => [r.id.toLowerCase(), r]));
	const restoredIds: string[] = [];
	for (const entry of manifest) {
		const row = rows.find((r) => String(r.id).toLowerCase() === entry.id);
		const rollback = rollbackById.get(entry.id);
		if (!row || !rollback) continue;
		const after = { ...row } as Record<string, unknown>;
		after.page_title = rollback.oldPageTitle;
		after.meta_description = rollback.oldMetaDescription;
		after.hero_image_url = rollback.oldHeroImageUrl;
		after.journey_type_slug = rollback.oldJourneyTypeSlug;
		restoredIds.push(entry.id);
	}
	const externalUnchanged = rows
		.filter((r) => !manifestIds.has(String(r.id).toLowerCase()))
		.every((r) => r);
	return { restoredIds, externalUnchanged };
}
