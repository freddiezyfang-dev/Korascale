import {
	PR_J2B2_EXPECTED_ACTIVE,
	PR_J2B2_EXPECTED_ARCHIVED,
	PR_J2B2_EXPECTED_ACTIVE_IN_MANIFEST,
	PR_J2B2_EXPECTED_ARCHIVED_IN_MANIFEST,
	PR_J2B2_EXPECTED_TOTAL,
	PR_J2B2_ACTIVE_ENTRY,
	PR_J2B2_SLUG_MANIFEST,
	PR_J2B2_SLUG_MANIFEST_COUNT,
	type PrJ2b2SlugManifestEntry,
} from './prJ2b2SlugManifest';
import {
	getJourneySlugRedirect,
	isRedirectingOldSlug,
} from './redirects';
import {
	isPublicJourneyStatusCompat,
} from './status';
import {
	isValidCanonicalSlug,
	normalizeJourneySlug,
	stripJourneySlugPathPrefix,
} from './slug';
import {
	resolveCanonicalJourneySlug,
	shouldIncludeJourneyInSitemap,
} from './sitemap';
import { maskDatabaseIdentity, findDuplicateManifestIds } from './statusBackfill';
import type { JourneyRowLike } from './types';

export type SlugBackfillPreviewRow = {
	id: string;
	status: string;
	currentSlug: string;
	proposedSlug: string;
	collision: boolean;
	publicBefore: boolean;
	publicAfter: boolean;
	oldUrlStatus: string;
	newUrlStatus: string;
	canonicalUrl: string;
	sitemapIncluded: boolean;
	redirectRequired: boolean;
	manualReview: boolean;
	reason: string;
};

export type SlugPreflightResult = {
	ready: boolean;
	databaseIdentity: string;
	total: number;
	active: number;
	archived: number;
	manifestCount: number;
	missingManifestIds: string[];
	slugMismatchIds: string[];
	statusMismatchIds: string[];
	newSlugCollisionIds: string[];
	duplicateManifestIds: string[];
	activeOldUrlStatus: string | null;
	activeNewUrlStatus: string | null;
	sitemapCanonicalIncluded: boolean;
	activeRedirectConfigured: boolean;
};

export type SlugOnlyRow = { id: string; slug: string; status: string };

function normalizeStatus(status: unknown): string {
	return String(status ?? '').trim().toLowerCase();
}

export function getArchivedRedirectStrategy(entry: PrJ2b2SlugManifestEntry): string {
	if (entry.redirectRequired || isRedirectingOldSlug(entry.oldSlug)) {
		return 'permanent_redirect_active_only';
	}
	return 'no_public_redirect_archived_db_only';
}

export function buildSlugBackfillPreview(rows: JourneyRowLike[]): SlugBackfillPreviewRow[] {
	const rowById = new Map(rows.map((row) => [String(row.id ?? ''), row]));
	const allSlugs = new Set(
		rows.map((row) => stripJourneySlugPathPrefix(String(row.slug ?? ''))).filter(Boolean)
	);

	return PR_J2B2_SLUG_MANIFEST.map((entry) => {
		const row = rowById.get(entry.id);
		const currentSlug = stripJourneySlugPathPrefix(String(row?.slug ?? entry.oldSlug));
		const collision =
			allSlugs.has(entry.newSlug) && currentSlug !== entry.newSlug;
		const publicBefore = row ? isPublicJourneyStatusCompat(row.status) : entry.status === 'active';
		const publicAfter = publicBefore;
		const canonicalSlug = entry.newSlug;
		const sitemapIncluded = row
			? shouldIncludeJourneyInSitemap({ slug: currentSlug, status: row.status })
			: entry.status === 'active';

		return {
			id: entry.id,
			status: entry.status,
			currentSlug,
			proposedSlug: entry.newSlug,
			collision,
			publicBefore,
			publicAfter,
			oldUrlStatus: entry.status === 'active' ? '308' : '404',
			newUrlStatus: entry.status === 'active' ? '200' : '404',
			canonicalUrl: `/journeys/${canonicalSlug}`,
			sitemapIncluded,
			redirectRequired: entry.redirectRequired,
			manualReview: entry.manualReview,
			reason: entry.reason,
		};
	});
}

export function evaluateSlugPreflight(
	rows: JourneyRowLike[],
	options?: {
		databaseIdentity?: string;
		activeOldUrlStatus?: string | null;
		activeNewUrlStatus?: string | null;
		sitemapCanonicalIncluded?: boolean;
	}
): SlugPreflightResult {
	const rowById = new Map(rows.map((row) => [String(row.id ?? ''), row]));
	const allSlugs = rows.map((row) => ({
		id: String(row.id ?? ''),
		slug: stripJourneySlugPathPrefix(String(row.slug ?? '')),
	}));

	const missingManifestIds = PR_J2B2_SLUG_MANIFEST.filter((entry) => !rowById.has(entry.id)).map(
		(entry) => entry.id
	);
	const slugMismatchIds = PR_J2B2_SLUG_MANIFEST.filter((entry) => {
		const row = rowById.get(entry.id);
		if (!row) return false;
		return stripJourneySlugPathPrefix(String(row.slug ?? '')) !== entry.oldSlug;
	}).map((entry) => entry.id);
	const statusMismatchIds = PR_J2B2_SLUG_MANIFEST.filter((entry) => {
		const row = rowById.get(entry.id);
		return row != null && normalizeStatus(row.status) !== entry.status;
	}).map((entry) => entry.id);

	const newSlugCollisionIds = PR_J2B2_SLUG_MANIFEST.filter((entry) => {
		const occupant = allSlugs.find(
			(row) => row.slug === entry.newSlug && row.id !== entry.id
		);
		return Boolean(occupant);
	}).map((entry) => entry.id);

	const total = rows.length;
	const active = rows.filter((row) => normalizeStatus(row.status) === 'active').length;
	const archived = rows.filter((row) => normalizeStatus(row.status) === 'archived').length;
	const duplicateManifestIds = findDuplicateManifestIds(
		PR_J2B2_SLUG_MANIFEST.map((entry) => entry.id)
	);

	const activeRedirectConfigured = Boolean(
		getJourneySlugRedirect(PR_J2B2_ACTIVE_ENTRY.oldSlug) === PR_J2B2_ACTIVE_ENTRY.newSlug
	);

	const ready =
		total === PR_J2B2_EXPECTED_TOTAL &&
		active === PR_J2B2_EXPECTED_ACTIVE &&
		archived === PR_J2B2_EXPECTED_ARCHIVED &&
		PR_J2B2_SLUG_MANIFEST_COUNT === 4 &&
		PR_J2B2_SLUG_MANIFEST.filter((e) => e.status === 'active').length ===
			PR_J2B2_EXPECTED_ACTIVE_IN_MANIFEST &&
		PR_J2B2_SLUG_MANIFEST.filter((e) => e.status === 'archived').length ===
			PR_J2B2_EXPECTED_ARCHIVED_IN_MANIFEST &&
		missingManifestIds.length === 0 &&
		slugMismatchIds.length === 0 &&
		statusMismatchIds.length === 0 &&
		newSlugCollisionIds.length === 0 &&
		duplicateManifestIds.length === 0 &&
		activeRedirectConfigured &&
		(options?.activeOldUrlStatus ?? null) === '308' &&
		(options?.activeNewUrlStatus ?? null) === '200' &&
		(options?.sitemapCanonicalIncluded ?? false) === true;

	return {
		ready,
		databaseIdentity: options?.databaseIdentity ?? 'unknown',
		total,
		active,
		archived,
		manifestCount: PR_J2B2_SLUG_MANIFEST_COUNT,
		missingManifestIds,
		slugMismatchIds,
		statusMismatchIds,
		newSlugCollisionIds,
		duplicateManifestIds,
		activeOldUrlStatus: options?.activeOldUrlStatus ?? null,
		activeNewUrlStatus: options?.activeNewUrlStatus ?? null,
		sitemapCanonicalIncluded: options?.sitemapCanonicalIncluded ?? false,
		activeRedirectConfigured,
	};
}

export type ParsedSlugManifestRow = {
	id: string;
	oldSlug: string;
	newSlug: string;
	status: string;
};

export function extractSlugManifestFromSql(sql: string): ParsedSlugManifestRow[] {
	const rows: ParsedSlugManifestRow[] = [];
	const seen = new Set<string>();
	const fourField =
		/\('([0-9a-f-]{36})'::uuid,\s*'([^']+)',\s*'([^']+)',\s*'(active|archived)'\)/gi;
	const threeField =
		/\('([0-9a-f-]{36})'::uuid,\s*'([^']+)',\s*'([^']+)'\)/gi;

	for (const match of sql.matchAll(fourField)) {
		const id = match[1].toLowerCase();
		if (seen.has(id)) continue;
		seen.add(id);
		rows.push({
			id,
			oldSlug: match[2],
			newSlug: match[3],
			status: match[4],
		});
	}
	for (const match of sql.matchAll(threeField)) {
		const id = match[1].toLowerCase();
		if (seen.has(id)) continue;
		seen.add(id);
		rows.push({
			id,
			oldSlug: match[2],
			newSlug: match[3],
			status: '',
		});
	}
	return rows.sort((a, b) => a.id.localeCompare(b.id));
}

export function extractSlugManifestFromCsv(csv: string): ParsedSlugManifestRow[] {
	return csv
		.trim()
		.split('\n')
		.slice(1)
		.map((line) => {
			const [id, , currentSlug, proposedSlug, , , , , , , , ,] = line.split(',');
			return {
				id: id.trim().toLowerCase(),
				oldSlug: currentSlug.trim(),
				newSlug: proposedSlug.trim(),
				status: '',
			};
		})
		.sort((a, b) => a.id.localeCompare(b.id));
}

export function compareSlugManifestMappings(
	left: readonly ParsedSlugManifestRow[],
	right: readonly ParsedSlugManifestRow[]
): boolean {
	if (left.length !== right.length) return false;
	const rightById = new Map(right.map((row) => [row.id, row]));
	for (const row of left) {
		const other = rightById.get(row.id);
		if (!other) return false;
		if (row.oldSlug !== other.oldSlug || row.newSlug !== other.newSlug) return false;
	}
	return true;
}

export function migrationSqlModifiesOnlySlug(sql: string): boolean {
	const stripped = sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n');
	const updateSets = [...stripped.matchAll(/UPDATE[\s\S]*?SET\s+([^;]+)/gi)];
	if (!updateSets.some((match) => /\bslug\s*=/i.test(match[1]))) {
		return false;
	}
	const forbiddenInSet = [
		/\bstatus\s*=/i,
		/\bjourney_type\s*=/i,
		/\bpage_title\s*=/i,
		/\bmeta_description\s*=/i,
		/\bhero_image_/i,
		/\bseo_complete\s*=/i,
		/\bprice_/i,
		/\bdata\s*=/i,
		/\btitle\s*=/i,
		/\bupdated_at\s*=/i,
	];
	return updateSets.every((match) =>
		!forbiddenInSet.some((pattern) => pattern.test(match[1]))
	);
}

export function simulatePrJ2b2SlugRollback(rows: SlugOnlyRow[]): {
	rows: SlugOnlyRow[];
	updatedCount: number;
} {
	const manifestById = new Map(PR_J2B2_SLUG_MANIFEST.map((entry) => [entry.id, entry]));
	let updatedCount = 0;
	const next = rows.map((row) => {
		const entry = manifestById.get(row.id);
		if (entry && row.slug === entry.newSlug) {
			updatedCount += 1;
			return { ...row, slug: entry.oldSlug };
		}
		return row;
	});
	return { rows: next, updatedCount };
}

export function assertActiveSlugCompatBeforeMigration(): void {
	const canonical = resolveCanonicalJourneySlug(PR_J2B2_ACTIVE_ENTRY.oldSlug);
	if (canonical !== PR_J2B2_ACTIVE_ENTRY.newSlug) {
		throw new Error('Active canonical slug mismatch');
	}
	if (!isValidCanonicalSlug(PR_J2B2_ACTIVE_ENTRY.newSlug)) {
		throw new Error('Active newSlug is not canonical');
	}
	if (!isRedirectingOldSlug(PR_J2B2_ACTIVE_ENTRY.oldSlug)) {
		throw new Error('Active old slug must be redirecting');
	}
}

export { maskDatabaseIdentity, normalizeJourneySlug };
