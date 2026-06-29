import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	buildB3aActiveManifestEntry,
	buildB3aRenderedSnapshotEntry,
	buildB3aSourceMatrixRow,
	compareB3aManifestRows,
	compareB3aProposedValues,
	evaluateB3aPreflight,
	extractB3aManifestFromForwardSql,
	extractB3aManifestFromPreviewCsv,
	extractB3aManifestFromRollbackB3aSql,
	extractB3aManifestFromSnapshotJson,
	extractB3aRollbackOldFromSql,
	findB3aColumnConflictIds,
	forwardMigrationExpectsTwentyFourUpdatedRows,
	manifestToParsedRows,
	migrationSqlModifiesOnlyB3aMetadata,
	PR_J2B3A_EXCLUDED_ID,
	PR_J2B3A_MANIFEST_COUNT,
	rollbackWouldAbortOnAdminEdit,
} from '@/lib/journeyNormalization/activeMetadataBackfill';
import {
	PR_J2B3A_ACTIVE_MANIFEST,
	PR_J2B3A_ACTIVE_MANIFEST_IDS,
} from '@/lib/journeyNormalization/prJ2b3aActiveManifest';
import { shouldIncludeJourneyInSitemap } from '@/lib/journeyNormalization/sitemap';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';

const pendingDir = join(process.cwd(), 'database/migrations/pending');
const auditsDir = join(process.cwd(), 'docs/audits');

beforeEach(() => {
	vi.stubEnv('JOURNEY_NORMALIZATION_COLUMNS', '1');
});

function row(partial: JourneyRowLike): JourneyRowLike {
	return partial;
}

describe('PR-J2B3A manifest', () => {
	it('contains exactly 24 active entries with unique IDs', () => {
		expect(PR_J2B3A_ACTIVE_MANIFEST).toHaveLength(PR_J2B3A_MANIFEST_COUNT);
		expect(new Set(PR_J2B3A_ACTIVE_MANIFEST_IDS).size).toBe(24);
		expect(PR_J2B3A_ACTIVE_MANIFEST_IDS).not.toContain(PR_J2B3A_EXCLUDED_ID);
		expect(PR_J2B3A_ACTIVE_MANIFEST.every((e) => !e.manualReview)).toBe(true);
	});

	it('uses B2 canonical slugs without trailing hyphen', () => {
		for (const entry of PR_J2B3A_ACTIVE_MANIFEST) {
			expect(entry.slug).not.toMatch(/-$/);
		}
		expect(
			PR_J2B3A_ACTIVE_MANIFEST.some(
				(e) =>
					e.slug ===
					'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour'
			)
		).toBe(true);
	});
});

describe('PR-J2B3A source rules', () => {
	it('uses data.pageTitle explicit source', () => {
		const entry = buildB3aActiveManifestEntry(
			row({
				id: 'a',
				status: 'active',
				title: 'Fallback Title',
				data: { pageTitle: 'Explicit Page Title' },
			})
		);
		expect(entry.pageTitle.proposed).toBe('Explicit Page Title');
		expect(entry.pageTitle.source).toBe('data.pageTitle');
	});

	it('falls back to title for page_title', () => {
		const entry = buildB3aActiveManifestEntry(
			row({ id: 'a', status: 'active', title: 'Title Fallback', data: {} })
		);
		expect(entry.pageTitle.proposed).toBe('Title Fallback');
		expect(entry.pageTitle.source).toBe('title');
	});

	it('uses short_description fallback for meta_description', () => {
		const entry = buildB3aActiveManifestEntry(
			row({
				id: 'a',
				status: 'active',
				title: 'T',
				short_description: 'Short meta',
				data: { heroImage: 'https://example.com/h.jpg' },
				journey_type: 'Explore Together',
			})
		);
		expect(entry.metaDescription.proposed).toBe('Short meta');
		expect(entry.metaDescription.source).toBe('short_description');
	});

	it('uses data.metaDescription when explicit', () => {
		const entry = buildB3aActiveManifestEntry(
			row({
				id: 'a',
				status: 'active',
				title: 'T',
				short_description: 'Short',
				data: {
					metaDescription: 'Explicit meta',
					heroImage: 'https://example.com/h.jpg',
				},
				journey_type: 'Deep Discovery',
			})
		);
		expect(entry.metaDescription.proposed).toBe('Explicit meta');
		expect(entry.metaDescription.source).toBe('data.metaDescription');
	});

	it('uses data.heroImage and image fallback', () => {
		const explicit = buildB3aActiveManifestEntry(
			row({
				id: 'a',
				status: 'active',
				title: 'T',
				short_description: 'S',
				data: { heroImage: 'https://example.com/jsonb.jpg' },
				journey_type: 'Explore Together',
			})
		);
		expect(explicit.heroImageUrl.source).toBe('data.heroImage');

		const fallback = buildB3aActiveManifestEntry(
			row({
				id: 'b',
				status: 'active',
				title: 'T',
				short_description: 'S',
				image: 'https://example.com/legacy.jpg',
				journey_type: 'Explore Together',
			})
		);
		expect(fallback.heroImageUrl.proposed).toBe('https://example.com/legacy.jpg');
		expect(fallback.heroImageUrl.source).toBe('image');
	});

	it('normalizes legacy journey_type to slug', () => {
		const entry = buildB3aActiveManifestEntry(
			row({
				id: 'a',
				status: 'active',
				title: 'T',
				short_description: 'S',
				data: { heroImage: 'https://example.com/h.jpg' },
				journey_type: 'Deep Discovery',
			})
		);
		expect(entry.journeyTypeSlug.proposed).toBe('deep-discovery');
		expect(entry.journeyTypeSlug.source).toBe('legacy_journey_type');
	});

	it('marks ambiguous journey type for manual review', () => {
		const entry = buildB3aActiveManifestEntry(
			row({
				id: 'a',
				status: 'active',
				title: 'T',
				short_description: 'S',
				data: { heroImage: 'https://example.com/h.jpg', journeyType: 'Unknown Type' },
				journey_type: 'Unknown Type',
			})
		);
		expect(entry.manualReview).toBe(true);
		expect(entry.journeyTypeSlug.source).toBe('ambiguous');
	});

	it('treats empty strings as invalid sources', () => {
		const entry = buildB3aActiveManifestEntry(
			row({
				id: 'a',
				status: 'active',
				title: '   ',
				short_description: '',
				data: { pageTitle: '', metaDescription: '  ', heroImage: '' },
				image: '',
				journey_type: '',
			})
		);
		expect(entry.manualReview).toBe(true);
	});

	it('does not overwrite existing non-empty normalized columns', () => {
		const rows = [
			row({
				id: PR_J2B3A_ACTIVE_MANIFEST[0].id,
				status: 'active',
				page_title: 'Different Column Value',
				title: 'T',
				short_description: 'S',
				data: { pageTitle: 'JSONB', heroImage: 'https://example.com/h.jpg' },
				journey_type: 'Explore Together',
			}),
		];
		const conflicts = findB3aColumnConflictIds(rows, PR_J2B3A_ACTIVE_MANIFEST.slice(0, 1));
		expect(conflicts).toContain(PR_J2B3A_ACTIVE_MANIFEST[0].id);
	});

	it('keeps rendered values equivalent to proposed column values', () => {
		const sample = row({
			id: 'a',
			status: 'active',
			title: 'Title',
			short_description: 'Meta',
			data: { pageTitle: 'Title', heroImage: 'https://example.com/h.jpg' },
			journey_type: 'Explore Together',
		});
		const snapshot = buildB3aRenderedSnapshotEntry(sample);
		expect(snapshot.proposedPageTitle).toBe(snapshot.resolvedPageTitleBefore);
		expect(snapshot.proposedMetaDescription).toBe(snapshot.resolvedMetaDescriptionBefore);
		expect(snapshot.proposedHeroImageUrl).toBe(snapshot.resolvedHeroImageUrlBefore);
		expect(snapshot.proposedJourneyTypeSlug).toBe(snapshot.resolvedJourneyTypeSlugBefore);
	});
});

describe('PR-J2B3A manifest consistency across artifacts', () => {
	const tsRows = manifestToParsedRows(PR_J2B3A_ACTIVE_MANIFEST);
	const forwardSql = readFileSync(
		join(pendingDir, '025b3a_active_journey_metadata_backfill.sql'),
		'utf8'
	);
	const rollbackSql = readFileSync(
		join(pendingDir, '025b3a_active_journey_metadata_backfill.rollback.sql'),
		'utf8'
	);
	const previewCsv = readFileSync(join(auditsDir, 'pr-j2b3a-active-preview.csv'), 'utf8');
	const snapshotJson = readFileSync(
		join(auditsDir, 'pr-j2b3a-rendered-value-snapshot.json'),
		'utf8'
	);
	const forwardRows = extractB3aManifestFromForwardSql(forwardSql);
	const rollbackB3aRows = extractB3aManifestFromRollbackB3aSql(rollbackSql);
	const rollbackOldRows = extractB3aRollbackOldFromSql(rollbackSql);
	const previewRows = extractB3aManifestFromPreviewCsv(previewCsv);
	const snapshotRows = extractB3aManifestFromSnapshotJson(snapshotJson);

	it('has exactly 24 unique active IDs across all five artifacts', () => {
		for (const rows of [
			tsRows,
			forwardRows,
			rollbackB3aRows,
			previewRows,
			snapshotRows,
		]) {
			expect(rows).toHaveLength(24);
			expect(new Set(rows.map((r) => r.id)).size).toBe(24);
			expect(rows.map((r) => r.id)).not.toContain(PR_J2B3A_EXCLUDED_ID);
		}
		expect(new Set(rollbackOldRows.map((r) => r.id)).size).toBe(24);
	});

	it('matches canonical slugs and proposed values across TS, SQL, CSV, snapshot', () => {
		expect(compareB3aManifestRows(tsRows, forwardRows)).toBe(true);
		expect(compareB3aManifestRows(tsRows, previewRows)).toBe(true);
		expect(compareB3aManifestRows(tsRows, snapshotRows)).toBe(true);
		expect(compareB3aProposedValues(tsRows, rollbackB3aRows)).toBe(true);
		for (const entry of PR_J2B3A_ACTIVE_MANIFEST) {
			expect(entry.slug).not.toMatch(/-$/);
		}
	});

	it('records pre-migration NULL rollback values for all four columns', () => {
		expect(rollbackOldRows).toHaveLength(24);
		for (const row of rollbackOldRows) {
			expect(row.oldPageTitle).toBeNull();
			expect(row.oldMetaDescription).toBeNull();
			expect(row.oldHeroImageUrl).toBeNull();
			expect(row.oldJourneyTypeSlug).toBeNull();
		}
	});
});

describe('PR-J2B3A migration SQL', () => {
	const migration = readFileSync(
		join(pendingDir, '025b3a_active_journey_metadata_backfill.sql'),
		'utf8'
	);
	const rollback = readFileSync(
		join(pendingDir, '025b3a_active_journey_metadata_backfill.rollback.sql'),
		'utf8'
	);

	it('modifies only B3A metadata columns in forward migration', () => {
		expect(migrationSqlModifiesOnlyB3aMetadata(migration)).toBe(true);
		expect(migration).toContain('pr_j2b3a_manifest');
	});

	it('uses exact rollback with pre-migration column values', () => {
		expect(rollback).toContain('pr_j2b3a_rollback');
		expect(rollback).toContain('pr_j2b3a_b3a_values');
		expect(rollback).toContain('admin may have edited');
		expect(rollback).not.toContain('updated_at');
	});

	it('aborts rollback when admin edited a field after B3A', () => {
		const b3aRows = manifestToParsedRows(PR_J2B3A_ACTIVE_MANIFEST);
		const adminEdited = b3aRows.map((row, index) =>
			index === 0 ? { ...row, pageTitle: 'Admin changed title' } : row
		);
		expect(rollbackWouldAbortOnAdminEdit(b3aRows, adminEdited)).toBe(true);
		expect(rollbackWouldAbortOnAdminEdit(b3aRows, b3aRows)).toBe(false);
	});

	it('does not SET JSONB, slug, status, or price fields', () => {
		expect(migrationSqlModifiesOnlyB3aMetadata(migration)).toBe(true);
		expect(migration).not.toMatch(/\bSET\s+slug/i);
		expect(migration).not.toMatch(/\bSET\s+status/i);
	});

	it('expects 24 updated rows (not 96) and 24/24 filled columns after update', () => {
		expect(forwardMigrationExpectsTwentyFourUpdatedRows(migration)).toBe(true);
		expect(migration).toContain('expected 24 updated rows');
		expect(migration).not.toContain('expected 96 updated rows');
		expect(migration).toContain('expected 24/24 filled metadata columns after update');
		expect(migration).toContain('hero_image_alt_filled');
	});

	it('does not include updated_at in non-target field checks', () => {
		expect(migration).not.toContain('updated_at IS DISTINCT FROM');
	});
});

describe('PR-J2B3A preflight simulation', () => {
	it('passes for production-like manifest when DB rows align', () => {
		const activeRows: JourneyRowLike[] = PR_J2B3A_ACTIVE_MANIFEST.map((entry) => ({
			id: entry.id,
			slug: entry.slug,
			status: 'active',
			title: entry.pageTitle.proposed,
			short_description: entry.metaDescription.proposed,
			image: entry.heroImageUrl.proposed,
			journey_type: 'Explore Together',
			hero_image_alt: 'Alt text',
			data: {
				pageTitle: entry.pageTitle.proposed,
				heroImage: entry.heroImageUrl.proposed,
			},
		}));
		const archivedRows = Array.from({ length: 59 }, (_, i) => ({
			id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
			slug: `archived-${i}`,
			status: 'archived',
		}));
		const result = evaluateB3aPreflight(
			[...activeRows, ...archivedRows],
			PR_J2B3A_ACTIVE_MANIFEST,
			{ databaseIdentity: 'test' }
		);
		expect(result.ready).toBe(true);
		expect(result.columnConflictIds).toHaveLength(0);
	});

	it('aborts when column conflicts exist', () => {
		const activeRows: JourneyRowLike[] = PR_J2B3A_ACTIVE_MANIFEST.map((entry, i) => ({
			id: entry.id,
			slug: entry.slug,
			status: 'active',
			title: entry.pageTitle.proposed,
			short_description: entry.metaDescription.proposed,
			page_title: i === 0 ? 'stale-column' : '',
			data: {
				pageTitle: entry.pageTitle.proposed,
				heroImage: entry.heroImageUrl.proposed,
			},
			journey_type: 'Explore Together',
			hero_image_alt: 'Alt',
		}));
		const archivedRows = Array.from({ length: 59 }, (_, i) => ({
			id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
			status: 'archived',
		}));
		const result = evaluateB3aPreflight(
			[...activeRows, ...archivedRows],
			PR_J2B3A_ACTIVE_MANIFEST,
			{ databaseIdentity: 'test' }
		);
		expect(result.ready).toBe(false);
		expect(result.columnConflictIds.length).toBeGreaterThan(0);
	});
});

describe('PR-J2B3A public surface', () => {
	it('keeps sitemap eligibility for all 24 canonical active slugs', () => {
		for (const entry of PR_J2B3A_ACTIVE_MANIFEST) {
			expect(
				shouldIncludeJourneyInSitemap({ status: 'active', slug: entry.slug })
			).toBe(true);
		}
	});

	it('does not include archived journeys', () => {
		expect(
			shouldIncludeJourneyInSitemap({ status: 'archived', slug: 'any-slug' })
		).toBe(false);
	});
});

describe('PR-J2B3A source matrix from production snapshot', () => {
	it('has 24 rows with full resolution', () => {
		const csv = readFileSync(join(auditsDir, 'pr-j2b3a-active-source-matrix.csv'), 'utf8');
		const rows = csv.trim().split('\n').slice(1);
		expect(rows).toHaveLength(24);
		const manual = rows.filter((line) => line.endsWith(',true,'));
		expect(manual).toHaveLength(0);
	});
});
