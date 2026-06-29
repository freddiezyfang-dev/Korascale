import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
	PR_J2B2_ACTIVE_ENTRY,
	PR_J2B2_SLUG_MANIFEST,
	PR_J2B2_SLUG_MANIFEST_COUNT,
} from '@/lib/journeyNormalization/prJ2b2SlugManifest';
import {
	assertActiveSlugCompatBeforeMigration,
	buildSlugBackfillPreview,
	compareSlugManifestMappings,
	extractSlugManifestFromCsv,
	extractSlugManifestFromSql,
	getArchivedRedirectStrategy,
	migrationSqlModifiesOnlySlug,
	simulatePrJ2b2SlugRollback,
} from '@/lib/journeyNormalization/slugBackfill';
import {
	getJourneySlugDbLookupCandidates,
	getJourneySlugRedirect,
	isRedirectingOldSlug,
} from '@/lib/journeyNormalization/redirects';
import { shouldIncludeJourneyInSitemap } from '@/lib/journeyNormalization/sitemap';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';

const pendingDir = join(process.cwd(), 'database/migrations/pending');
const auditsDir = join(process.cwd(), 'docs/audits');
const manifestTsPath = join(
	process.cwd(),
	'src/lib/journeyNormalization/prJ2b2SlugManifest.ts'
);

function makeProductionLikeRows(): JourneyRowLike[] {
	const rows: JourneyRowLike[] = [];
	for (let i = 0; i < 24; i += 1) {
		rows.push({
			id: `active-${i}`,
			slug: `active-journey-${i}`,
			status: 'active',
		});
	}
	for (let i = 0; i < 59; i += 1) {
		rows.push({
			id: `archived-${i}`,
			slug: `archived-journey-${i}`,
			status: 'archived',
		});
	}
	for (const entry of PR_J2B2_SLUG_MANIFEST) {
		const idx = entry.status === 'active' ? 0 : 1;
		rows[idx] = { id: entry.id, slug: entry.oldSlug, status: entry.status };
	}
	return rows;
}

describe('PR-J2B2 manifest', () => {
	it('contains exactly 4 entries with 1 active and 3 archived', () => {
		expect(PR_J2B2_SLUG_MANIFEST_COUNT).toBe(4);
		expect(PR_J2B2_SLUG_MANIFEST.filter((e) => e.status === 'active')).toHaveLength(1);
		expect(PR_J2B2_SLUG_MANIFEST.filter((e) => e.status === 'archived')).toHaveLength(3);
	});

	it('keeps unique old/new slug mappings', () => {
		const oldSlugs = new Set(PR_J2B2_SLUG_MANIFEST.map((e) => e.oldSlug));
		const newSlugs = new Set(PR_J2B2_SLUG_MANIFEST.map((e) => e.newSlug));
		expect(oldSlugs.size).toBe(4);
		expect(newSlugs.size).toBe(4);
	});
});

describe('PR-J2B2 manifest consistency across artifacts', () => {
	const canonical = PR_J2B2_SLUG_MANIFEST.map((entry) => ({
		id: entry.id,
		oldSlug: entry.oldSlug,
		newSlug: entry.newSlug,
		status: entry.status,
	})).sort((a, b) => a.id.localeCompare(b.id));

	const forwardSql = readFileSync(
		join(pendingDir, '025b2_journey_slug_normalization.sql'),
		'utf8'
	);
	const rollbackSql = readFileSync(
		join(pendingDir, '025b2_journey_slug_normalization.rollback.sql'),
		'utf8'
	);
	const previewCsv = readFileSync(join(auditsDir, 'pr-j2b2-slug-preview.csv'), 'utf8');
	const manifestTs = readFileSync(manifestTsPath, 'utf8');

	it('matches TS, forward SQL, rollback SQL, and preview CSV mappings', () => {
		const fromForward = extractSlugManifestFromSql(forwardSql);
		const fromRollback = extractSlugManifestFromSql(rollbackSql);
		const fromCsv = extractSlugManifestFromCsv(previewCsv);
		expect(fromForward).toHaveLength(4);
		expect(fromRollback).toHaveLength(4);
		expect(fromCsv).toHaveLength(4);
		expect(compareSlugManifestMappings(canonical, fromForward)).toBe(true);
		expect(compareSlugManifestMappings(canonical, fromRollback)).toBe(true);
		expect(
			compareSlugManifestMappings(
				canonical.map(({ id, oldSlug, newSlug }) => ({ id, oldSlug, newSlug, status: '' })),
				fromCsv
			)
		).toBe(true);
		expect(manifestTs).toContain(PR_J2B2_ACTIVE_ENTRY.id);
	});
});

describe('PR-J2B2 active slug compatibility', () => {
	it('redirects old active URL and resolves canonical new slug', () => {
		assertActiveSlugCompatBeforeMigration();
		expect(getJourneySlugRedirect(PR_J2B2_ACTIVE_ENTRY.oldSlug)).toBe(
			PR_J2B2_ACTIVE_ENTRY.newSlug
		);
		expect(isRedirectingOldSlug(PR_J2B2_ACTIVE_ENTRY.oldSlug)).toBe(true);
		expect(
			getJourneySlugDbLookupCandidates(PR_J2B2_ACTIVE_ENTRY.oldSlug)
		).toEqual([]);
		expect(
			getJourneySlugDbLookupCandidates(PR_J2B2_ACTIVE_ENTRY.newSlug)
		).toContain(PR_J2B2_ACTIVE_ENTRY.oldSlug);
	});

	it('includes only canonical slug in sitemap for active trailing-hyphen row', () => {
		const row = {
			status: 'active',
			slug: PR_J2B2_ACTIVE_ENTRY.oldSlug,
		};
		expect(shouldIncludeJourneyInSitemap(row)).toBe(true);
	});
});

describe('PR-J2B2 archived redirect strategy', () => {
	it('does not configure public redirect for archived rows', () => {
		const archived = PR_J2B2_SLUG_MANIFEST.filter((e) => e.status === 'archived');
		for (const entry of archived) {
			expect(getArchivedRedirectStrategy(entry)).toBe('no_public_redirect_archived_db_only');
			expect(isRedirectingOldSlug(entry.oldSlug)).toBe(false);
			expect(shouldIncludeJourneyInSitemap({ status: 'archived', slug: entry.oldSlug })).toBe(
				false
			);
		}
	});
});

describe('PR-J2B2 migration SQL', () => {
	const migration = readFileSync(
		join(pendingDir, '025b2_journey_slug_normalization.sql'),
		'utf8'
	);
	const rollback = readFileSync(
		join(pendingDir, '025b2_journey_slug_normalization.rollback.sql'),
		'utf8'
	);

	it('modifies slug only in forward migration', () => {
		expect(migrationSqlModifiesOnlySlug(migration)).toBe(true);
		expect(migration).not.toContain('updated_at = NOW()');
	});

	it('uses exact manifest rollback without external slug changes', () => {
		expect(rollback).toContain('pr_j2b2_external_slug_snapshot');
		expect(rollback).toContain('manifest-external slug changed');
	});
});

describe('PR-J2B2 preview and rollback simulation', () => {
	it('marks archived rows as non-public before and after', () => {
		const rows = makeProductionLikeRows();
		const preview = buildSlugBackfillPreview(rows);
		expect(preview).toHaveLength(4);
		const archived = preview.filter((row) => row.status === 'archived');
		expect(archived.every((row) => !row.publicBefore && !row.publicAfter)).toBe(true);
		expect(archived.every((row) => row.oldUrlStatus === '404')).toBe(true);
	});

	it('rollback restores only manifest slugs', () => {
		const externalId = 'external-archived-id';
		const rows = [
			...PR_J2B2_SLUG_MANIFEST.map((entry) => ({
				id: entry.id,
				slug: entry.newSlug,
				status: entry.status,
			})),
			{ id: externalId, slug: 'untouched-archived-slug', status: 'archived' },
		];
		const { rows: after, updatedCount } = simulatePrJ2b2SlugRollback(rows);
		expect(updatedCount).toBe(4);
		for (const entry of PR_J2B2_SLUG_MANIFEST) {
			expect(after.find((row) => row.id === entry.id)?.slug).toBe(entry.oldSlug);
		}
		expect(after.find((row) => row.id === externalId)?.slug).toBe('untouched-archived-slug');
	});
});
