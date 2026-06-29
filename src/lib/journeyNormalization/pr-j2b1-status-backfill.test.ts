import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
	PR_J2B1_EXPECTED_ACTIVE,
	PR_J2B1_EXPECTED_INACTIVE,
	PR_J2B1_EXPECTED_TOTAL,
	PR_J2B1_STATUS_MANIFEST_COUNT,
	PR_J2B1_STATUS_MANIFEST_IDS,
	PR_J2B1_STATUS_MANUAL_REVIEW_IDS,
	isPrJ2b1StatusManualReviewId,
} from '@/lib/journeyNormalization/prJ2b1StatusManifest';
import {
	buildStatusBackfillPreview,
	compareManifestIdSets,
	evaluatePrJ2b1RollbackPreflight,
	evaluateStatusPreflight,
	extractUuidManifestFromCsv,
	extractUuidManifestFromSql,
	extractUuidManifestFromTs,
	findDuplicateManifestIds,
	manifestIdChecksum,
	migrationSqlModifiesOnlyStatus,
	migrationSqlUsesManifestOnly,
	rollbackSqlPreservesNonManifestArchived,
	rollbackSqlUsesManifestOnly,
	simulatePrJ2b1Rollback,
	type StatusOnlyRow,
} from '@/lib/journeyNormalization/statusBackfill';
import { shouldIncludeJourneyInSitemap } from '@/lib/journeyNormalization/sitemap';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';

const pendingDir = join(process.cwd(), 'database/migrations/pending');
const auditsDir = join(process.cwd(), 'docs/audits');
const manifestTsPath = join(
	process.cwd(),
	'src/lib/journeyNormalization/prJ2b1StatusManifest.ts'
);
const E468 = 'e468b842-7c59-4258-8d56-8b585566be82';
const EXTRA_ARCHIVED_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

function makeProductionLikeRows(): JourneyRowLike[] {
	const rows: JourneyRowLike[] = [];
	for (let i = 0; i < PR_J2B1_EXPECTED_ACTIVE; i += 1) {
		rows.push({
			id: `active-${i}`,
			slug: `active-journey-${i}`,
			status: 'active',
			title: `Active ${i}`,
		});
	}
	for (const id of PR_J2B1_STATUS_MANIFEST_IDS) {
		rows.push({
			id,
			slug: `inactive-${id.slice(0, 8)}`,
			status: 'inactive',
			title: `Inactive ${id.slice(0, 8)}`,
		});
	}
	return rows;
}

function makePostB1Rows(extraArchived = false): StatusOnlyRow[] {
	const rows: StatusOnlyRow[] = [];
	for (let i = 0; i < PR_J2B1_EXPECTED_ACTIVE; i += 1) {
		rows.push({ id: `active-${i}`, status: 'active' });
	}
	for (const id of PR_J2B1_STATUS_MANIFEST_IDS) {
		rows.push({ id, status: 'archived' });
	}
	if (extraArchived) {
		rows.push({ id: EXTRA_ARCHIVED_ID, status: 'archived' });
	}
	return rows;
}

describe('PR-J2B1 manifest', () => {
	it('contains exactly 59 IDs with no duplicates', () => {
		expect(PR_J2B1_STATUS_MANIFEST_COUNT).toBe(59);
		expect(findDuplicateManifestIds(PR_J2B1_STATUS_MANIFEST_IDS)).toEqual([]);
	});

	it('marks e468b842 as manual review in preview only', () => {
		const rows = makeProductionLikeRows();
		const preview = buildStatusBackfillPreview(rows);
		const e468 = preview.find((row) => row.id === E468);
		expect(e468?.manualReview).toBe(true);
		expect(e468?.proposedStatus).toBe('archived');
		expect(isPrJ2b1StatusManualReviewId(E468)).toBe(true);
		expect(PR_J2B1_STATUS_MANUAL_REVIEW_IDS).toContain(E468);
	});
});

describe('PR-J2B1 manifest consistency across artifacts', () => {
	const canonical = [...PR_J2B1_STATUS_MANIFEST_IDS].map((id) => id.toLowerCase()).sort();
	const forwardSql = readFileSync(
		join(pendingDir, '025b1_journey_status_backfill.sql'),
		'utf8'
	);
	const rollbackSql = readFileSync(
		join(pendingDir, '025b1_journey_status_backfill.rollback.sql'),
		'utf8'
	);
	const previewCsv = readFileSync(
		join(auditsDir, 'pr-j2b1-status-preview.csv'),
		'utf8'
	);
	const manifestTs = readFileSync(manifestTsPath, 'utf8');

	it('keeps identical 59-ID sets in TS, forward SQL, rollback SQL, and preview CSV', () => {
		const fromForward = extractUuidManifestFromSql(forwardSql);
		const fromRollback = extractUuidManifestFromSql(rollbackSql);
		const fromCsv = extractUuidManifestFromCsv(previewCsv);
		const fromTs = extractUuidManifestFromTs(manifestTs);

		for (const [label, ids] of [
			['forward SQL', fromForward],
			['rollback SQL', fromRollback],
			['preview CSV', fromCsv],
			['manifest TS', fromTs],
		] as const) {
			expect(ids, label).toHaveLength(59);
			expect(findDuplicateManifestIds(ids), label).toEqual([]);
			expect(compareManifestIdSets(ids, canonical).equal, label).toBe(true);
		}

		expect(manifestIdChecksum(fromForward)).toBe(manifestIdChecksum(canonical));
		expect(manifestIdChecksum(fromRollback)).toBe(manifestIdChecksum(canonical));
		expect(manifestIdChecksum(fromCsv)).toBe(manifestIdChecksum(canonical));
		expect(canonical).toContain(E468);
	});
});

describe('PR-J2B1 preflight', () => {
	it('is ready when production-like counts match manifest', () => {
		const rows = makeProductionLikeRows();
		const result = evaluateStatusPreflight(rows);
		expect(result.ready).toBe(true);
		expect(result.inactive).toBe(PR_J2B1_EXPECTED_INACTIVE);
		expect(result.active).toBe(PR_J2B1_EXPECTED_ACTIVE);
		expect(result.archived).toBe(0);
		expect(result.publicJourneyCount).toBe(24);
	});

	it('aborts when row counts mismatch', () => {
		const rows = makeProductionLikeRows().slice(0, 10);
		const result = evaluateStatusPreflight(rows);
		expect(result.ready).toBe(false);
	});
});

describe('PR-J2B1 migration SQL', () => {
	const migration = readFileSync(
		join(pendingDir, '025b1_journey_status_backfill.sql'),
		'utf8'
	);
	const rollback = readFileSync(
		join(pendingDir, '025b1_journey_status_backfill.rollback.sql'),
		'utf8'
	);

	it('updates only status using manifest + inactive guard', () => {
		expect(migrationSqlUsesManifestOnly(migration)).toBe(true);
		expect(migrationSqlModifiesOnlyStatus(migration)).toBe(true);
		expect(migration).not.toContain('updated_at = NOW()');
	});

	it('uses manifest-scoped rollback without global archived=0 guard', () => {
		expect(rollbackSqlUsesManifestOnly(rollback)).toBe(true);
		expect(rollbackSqlPreservesNonManifestArchived(rollback)).toBe(true);
		expect(rollback).toContain('non_manifest_archived_before');
		expect(rollback).not.toContain('expected 0 archived');
		expect(rollback).not.toContain('total_count <> 83');
	});
});

describe('PR-J2B1 rollback simulation', () => {
	it('succeeds when a non-manifest archived journey exists after B1', () => {
		const before = makePostB1Rows(true);
		const preflight = evaluatePrJ2b1RollbackPreflight(before);
		expect(preflight.ok).toBe(true);
		expect(preflight.nonManifestArchivedIds).toEqual([EXTRA_ARCHIVED_ID]);
		expect(preflight.nonManifestArchivedChecksum).toBe(EXTRA_ARCHIVED_ID);

		const { rows: after, updatedCount } = simulatePrJ2b1Rollback(before);
		expect(updatedCount).toBe(59);
		expect(after.find((row) => row.id === EXTRA_ARCHIVED_ID)?.status).toBe('archived');
		for (const id of PR_J2B1_STATUS_MANIFEST_IDS) {
			expect(after.find((row) => row.id === id)?.status).toBe('inactive');
		}

		const activeBefore = manifestIdChecksum(
			before.filter((row) => row.status === 'active').map((row) => row.id)
		);
		const activeAfter = manifestIdChecksum(
			after.filter((row) => row.status === 'active').map((row) => row.id)
		);
		expect(activeAfter).toBe(activeBefore);

		const nonManifestBefore = manifestIdChecksum(
			before
				.filter(
					(row) =>
						row.status === 'archived' &&
						!(PR_J2B1_STATUS_MANIFEST_IDS as readonly string[]).includes(row.id)
				)
				.map((row) => row.id)
		);
		const nonManifestAfter = manifestIdChecksum(
			after
				.filter(
					(row) =>
						row.status === 'archived' &&
						!(PR_J2B1_STATUS_MANIFEST_IDS as readonly string[]).includes(row.id)
				)
				.map((row) => row.id)
		);
		expect(nonManifestAfter).toBe(nonManifestBefore);
	});
});

describe('PR-J2B1 public surface unchanged', () => {
	it('keeps list/detail/sitemap eligibility at active 24', () => {
		const rows = makeProductionLikeRows();
		const publicCount = rows.filter((row) => shouldIncludeJourneyInSitemap(row)).length;
		expect(publicCount).toBe(PR_J2B1_EXPECTED_ACTIVE);
		expect(rows.length).toBe(PR_J2B1_EXPECTED_TOTAL);
	});
});
