import { LEGACY_INACTIVE_STATUS } from './constants';
import {
	PR_J2B1_EXPECTED_ACTIVE,
	PR_J2B1_EXPECTED_ARCHIVED_BEFORE,
	PR_J2B1_EXPECTED_INACTIVE,
	PR_J2B1_EXPECTED_TOTAL,
	PR_J2B1_STATUS_MANIFEST_COUNT,
	PR_J2B1_STATUS_MANIFEST_IDS,
	isPrJ2b1StatusManualReviewId,
} from './prJ2b1StatusManifest';
import { stripJourneySlugPathPrefix } from './slug';
import {
	isPublicJourneyStatusCompat,
	proposeJourneyStatus,
} from './status';
import type { JourneyRowLike } from './types';

export type StatusBackfillPreviewRow = {
	id: string;
	slug: string;
	title: string;
	currentStatus: string;
	proposedStatus: string;
	publicBefore: boolean;
	publicAfter: boolean;
	manualReview: boolean;
	reason: string;
};

export type StatusPreflightResult = {
	ready: boolean;
	databaseIdentity: string;
	total: number;
	active: number;
	inactive: number;
	archived: number;
	nullStatus: number;
	illegalStatus: number;
	manifestCount: number;
	missingManifestIds: string[];
	statusMismatchManifestIds: string[];
	activeIdsInManifest: string[];
	duplicateManifestIds: string[];
	publicJourneyCount: number;
	activeIds: string[];
};

const LEGAL_LEGACY_STATUSES = new Set([
	'active',
	LEGACY_INACTIVE_STATUS,
	'archived',
	'draft',
]);

function pickTitle(row: JourneyRowLike): string {
	return typeof row.title === 'string' ? row.title.trim() : '';
}

function normalizeStatus(status: unknown): string | null {
	if (status == null) return null;
	const value = String(status).trim().toLowerCase();
	return value || null;
}

export function maskDatabaseIdentity(connectionString: string | undefined): string {
	if (!connectionString) return 'missing';
	try {
		const url = new URL(connectionString);
		const host = url.hostname || 'unknown-host';
		const db = url.pathname.replace(/^\//, '') || 'unknown-db';
		return `${host}/${db}`;
	} catch {
		return 'invalid-connection-string';
	}
}

export function findDuplicateManifestIds(ids: readonly string[]): string[] {
	const seen = new Set<string>();
	const duplicates = new Set<string>();
	for (const id of ids) {
		if (seen.has(id)) duplicates.add(id);
		seen.add(id);
	}
	return [...duplicates];
}

export function buildStatusBackfillPreview(rows: JourneyRowLike[]): StatusBackfillPreviewRow[] {
	const manifestSet = new Set<string>(PR_J2B1_STATUS_MANIFEST_IDS);
	return rows
		.filter((row) => manifestSet.has(String(row.id ?? '')))
		.map((row) => {
			const id = String(row.id ?? '');
			const proposal = proposeJourneyStatus(row);
			const manualReview = isPrJ2b1StatusManualReviewId(id);
			return {
				id,
				slug: stripJourneySlugPathPrefix(String(row.slug ?? '')),
				title: pickTitle(row),
				currentStatus: String(row.status ?? ''),
				proposedStatus: proposal.proposed ?? 'archived',
				publicBefore: isPublicJourneyStatusCompat(row.status),
				publicAfter: false,
				manualReview,
				reason: manualReview
					? 'Status-only in 025B1; slug/type remain MANUAL_REVIEW'
					: proposal.reason,
			};
		})
		.sort((a, b) => a.slug.localeCompare(b.slug));
}

export function evaluateStatusPreflight(
	rows: JourneyRowLike[],
	options?: { databaseIdentity?: string }
): StatusPreflightResult {
	const rowById = new Map(rows.map((row) => [String(row.id ?? ''), row]));

	const missingManifestIds = PR_J2B1_STATUS_MANIFEST_IDS.filter((id) => !rowById.has(id));
	const statusMismatchManifestIds = PR_J2B1_STATUS_MANIFEST_IDS.filter((id) => {
		const row = rowById.get(id);
		return !row || normalizeStatus(row.status) !== LEGACY_INACTIVE_STATUS;
	});
	const activeIdsInManifest = PR_J2B1_STATUS_MANIFEST_IDS.filter((id) => {
		const row = rowById.get(id);
		return row != null && normalizeStatus(row.status) === 'active';
	});

	const total = rows.length;
	const active = rows.filter((row) => normalizeStatus(row.status) === 'active').length;
	const inactive = rows.filter(
		(row) => normalizeStatus(row.status) === LEGACY_INACTIVE_STATUS
	).length;
	const archived = rows.filter((row) => normalizeStatus(row.status) === 'archived').length;
	const nullStatus = rows.filter((row) => normalizeStatus(row.status) == null).length;
	const illegalStatus = rows.filter((row) => {
		const status = normalizeStatus(row.status);
		return status != null && !LEGAL_LEGACY_STATUSES.has(status);
	}).length;

	const publicJourneyCount = rows.filter((row) =>
		isPublicJourneyStatusCompat(row.status)
	).length;
	const activeIds = rows
		.filter((row) => normalizeStatus(row.status) === 'active')
		.map((row) => String(row.id ?? ''))
		.sort();

	const duplicateManifestIds = findDuplicateManifestIds(PR_J2B1_STATUS_MANIFEST_IDS);

	const ready =
		total === PR_J2B1_EXPECTED_TOTAL &&
		active === PR_J2B1_EXPECTED_ACTIVE &&
		inactive === PR_J2B1_EXPECTED_INACTIVE &&
		archived === PR_J2B1_EXPECTED_ARCHIVED_BEFORE &&
		nullStatus === 0 &&
		illegalStatus === 0 &&
		PR_J2B1_STATUS_MANIFEST_COUNT === PR_J2B1_EXPECTED_INACTIVE &&
		missingManifestIds.length === 0 &&
		statusMismatchManifestIds.length === 0 &&
		activeIdsInManifest.length === 0 &&
		duplicateManifestIds.length === 0 &&
		publicJourneyCount === PR_J2B1_EXPECTED_ACTIVE;

	return {
		ready,
		databaseIdentity: options?.databaseIdentity ?? 'unknown',
		total,
		active,
		inactive,
		archived,
		nullStatus,
		illegalStatus,
		manifestCount: PR_J2B1_STATUS_MANIFEST_COUNT,
		missingManifestIds,
		statusMismatchManifestIds,
		activeIdsInManifest,
		duplicateManifestIds,
		publicJourneyCount,
		activeIds,
	};
}

export function migrationSqlUsesManifestOnly(sql: string): boolean {
	const stripped = sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n');
	const hasManifestIn =
		PR_J2B1_STATUS_MANIFEST_IDS.every((id) => stripped.includes(id)) &&
		/Manifest target IDs/i.test(sql);
	const updateUsesBothConditions =
		/status\s*=\s*'inactive'/i.test(stripped) &&
		/\bid\s+IN\s*\(/i.test(stripped);
	return hasManifestIn && updateUsesBothConditions;
}

export function rollbackSqlUsesManifestOnly(sql: string): boolean {
	const stripped = sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n');
	if (/UPDATE journeys[\s\S]*WHERE status = 'archived'\s*;/i.test(stripped)) {
		return false;
	}
	return (
		PR_J2B1_STATUS_MANIFEST_IDS.every((id) => sql.includes(id)) &&
		/pr_j2b1_manifest|id IN \(/i.test(sql) &&
		/SET status = 'inactive'/i.test(stripped)
	);
}

export function migrationSqlModifiesOnlyStatus(sql: string): boolean {
	const stripped = sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n');
	const forbidden = [
		/\bslug\s*=/i,
		/\bjourney_type\s*=/i,
		/\bjourney_type_slug\s*=/i,
		/\bpage_title\s*=/i,
		/\bmeta_description\s*=/i,
		/\bhero_image_/i,
		/\bseo_complete\s*=/i,
		/\bprice_/i,
		/\bdata\s*=/i,
		/\btitle\s*=/i,
		/\bshort_description\s*=/i,
	];
	return !forbidden.some((pattern) => pattern.test(stripped));
}

const UUID_IN_SQL_PATTERN =
	/'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'::uuid/gi;

export function extractUuidManifestFromSql(sql: string): string[] {
	const ids = new Set<string>();
	for (const match of sql.matchAll(UUID_IN_SQL_PATTERN)) {
		ids.add(match[1].toLowerCase());
	}
	return [...ids].sort();
}

export function extractUuidManifestFromTs(source: string): string[] {
	const ids = new Set<string>();
	const uuidPattern =
		/'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'/gi;
	for (const match of source.matchAll(uuidPattern)) {
		ids.add(match[1].toLowerCase());
	}
	return [...ids].sort();
}

export function extractUuidManifestFromCsv(csv: string): string[] {
	return csv
		.trim()
		.split('\n')
		.slice(1)
		.map((line) => line.split(',')[0]?.trim().toLowerCase())
		.filter((value): value is string => Boolean(value))
		.sort();
}

export function manifestIdChecksum(ids: readonly string[]): string {
	return [...ids].map((id) => id.toLowerCase()).sort().join(',');
}

export function compareManifestIdSets(
	left: readonly string[],
	right: readonly string[]
): { equal: boolean; leftOnly: string[]; rightOnly: string[] } {
	const leftSet = new Set(left.map((id) => id.toLowerCase()));
	const rightSet = new Set(right.map((id) => id.toLowerCase()));
	const leftOnly = [...leftSet].filter((id) => !rightSet.has(id)).sort();
	const rightOnly = [...rightSet].filter((id) => !leftSet.has(id)).sort();
	return { equal: leftOnly.length === 0 && rightOnly.length === 0, leftOnly, rightOnly };
}

export type StatusOnlyRow = { id: string; status: string };

export function evaluatePrJ2b1RollbackPreflight(rows: StatusOnlyRow[]): {
	ok: boolean;
	manifestCount: number;
	missingManifestIds: string[];
	manifestNotArchivedIds: string[];
	manifestActiveIds: string[];
	nonManifestArchivedIds: string[];
	nonManifestArchivedChecksum: string;
	activeIdChecksum: string;
} {
	const rowById = new Map(rows.map((row) => [row.id.toLowerCase(), row.status]));
	const missingManifestIds = PR_J2B1_STATUS_MANIFEST_IDS.filter(
		(id) => !rowById.has(id.toLowerCase())
	);
	const manifestNotArchivedIds = PR_J2B1_STATUS_MANIFEST_IDS.filter(
		(id) => rowById.get(id.toLowerCase()) !== 'archived'
	);
	const manifestActiveIds = PR_J2B1_STATUS_MANIFEST_IDS.filter(
		(id) => rowById.get(id.toLowerCase()) === 'active'
	);
	const manifestSet = new Set<string>(PR_J2B1_STATUS_MANIFEST_IDS);
	const nonManifestArchivedIds = rows
		.filter((row) => row.status === 'archived' && !manifestSet.has(row.id.toLowerCase()))
		.map((row) => row.id.toLowerCase())
		.sort();
	const activeIds = rows
		.filter((row) => row.status === 'active')
		.map((row) => row.id.toLowerCase())
		.sort();

	const ok =
		PR_J2B1_STATUS_MANIFEST_COUNT === PR_J2B1_EXPECTED_INACTIVE &&
		findDuplicateManifestIds(PR_J2B1_STATUS_MANIFEST_IDS).length === 0 &&
		missingManifestIds.length === 0 &&
		manifestNotArchivedIds.length === 0 &&
		manifestActiveIds.length === 0;

	return {
		ok,
		manifestCount: PR_J2B1_STATUS_MANIFEST_COUNT,
		missingManifestIds,
		manifestNotArchivedIds,
		manifestActiveIds,
		nonManifestArchivedIds,
		nonManifestArchivedChecksum: manifestIdChecksum(nonManifestArchivedIds),
		activeIdChecksum: manifestIdChecksum(activeIds),
	};
}

/** Mirrors 025b1 rollback SQL semantics for unit tests (status-only). */
export function simulatePrJ2b1Rollback(rows: StatusOnlyRow[]): {
	rows: StatusOnlyRow[];
	updatedCount: number;
} {
	const manifestSet = new Set<string>(
		PR_J2B1_STATUS_MANIFEST_IDS.map((id) => id.toLowerCase())
	);
	let updatedCount = 0;
	const nextRows = rows.map((row) => {
		const id = row.id.toLowerCase();
		if (manifestSet.has(id) && row.status === 'archived') {
			updatedCount += 1;
			return { ...row, id, status: 'inactive' };
		}
		return { ...row, id };
	});
	return { rows: nextRows, updatedCount };
}

export function rollbackSqlPreservesNonManifestArchived(sql: string): boolean {
	const stripped = sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n');
	return (
		rollbackSqlUsesManifestOnly(sql) &&
		/non_manifest_archived/i.test(sql) &&
		/active_before_checksum|active_after_checksum/i.test(sql) &&
		!/\barchived_count\s*<>\s*0\b/i.test(stripped) &&
		!/\btotal_count\s*<>\s*83\b/i.test(stripped) &&
		!/\bexpected 0 archived\b/i.test(stripped)
	);
}
