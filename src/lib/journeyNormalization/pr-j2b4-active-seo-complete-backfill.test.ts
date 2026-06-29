import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	buildB4SeoCompleteManifestEntry,
	evaluateActiveSeoCompleteEligibility,
	evaluateB4SeoCompletePreflight,
	forwardMigrationExpectsTwentyFourUpdatedRows,
	migrationSqlModifiesOnlyB4SeoComplete,
	PR_J2B4_EXCLUDED_ID,
	PR_J2B4_MANIFEST_COUNT,
} from '@/lib/journeyNormalization/activeSeoCompleteBackfill';
import {
	PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST,
	PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST_IDS,
} from '@/lib/journeyNormalization/prJ2b4ActiveSeoCompleteManifest';
import { PR_J2B3A_ACTIVE_MANIFEST_IDS } from '@/lib/journeyNormalization/prJ2b3aActiveManifest';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';

const pendingDir = join(process.cwd(), 'database/migrations/pending');

function stripSqlComments(sql: string): string {
	return sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n');
}

beforeEach(() => {
	vi.stubEnv('JOURNEY_NORMALIZATION_COLUMNS', '1');
});

function row(partial: JourneyRowLike & Record<string, unknown>): JourneyRowLike {
	return partial;
}

describe('PR-J2B4 seo_complete manifest', () => {
	it('contains exactly 24 eligible active entries aligned with B3A IDs', () => {
		expect(PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST).toHaveLength(PR_J2B4_MANIFEST_COUNT);
		expect(new Set(PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST_IDS).size).toBe(24);
		expect(PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST_IDS).not.toContain(PR_J2B4_EXCLUDED_ID);
		expect([...PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST_IDS].sort()).toEqual(
			[...PR_J2B3A_ACTIVE_MANIFEST_IDS].sort()
		);
		expect(PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST.every((e) => e.eligible && !e.manualReview)).toBe(
			true
		);
	});
});

describe('PR-J2B4 eligibility', () => {
	it('requires journey_type_slug and hero alt', () => {
		const eligible = evaluateActiveSeoCompleteEligibility(
			row({
				status: 'active',
				slug: 'beijing-city-tour',
				title: 'Title',
				short_description: 'Excerpt',
				page_title: 'Page',
				meta_description: 'Meta',
				hero_image_url: 'https://example.com/h.jpg',
				hero_image_alt: 'Alt text',
				journey_type_slug: 'explore-together',
				data: {},
			})
		);
		expect(eligible.eligible).toBe(true);

		const missingType = evaluateActiveSeoCompleteEligibility(
			row({
				status: 'active',
				slug: 'beijing-city-tour',
				title: 'Title',
				short_description: 'Excerpt',
				page_title: 'Page',
				meta_description: 'Meta',
				hero_image_url: 'https://example.com/h.jpg',
				hero_image_alt: 'Alt',
				data: {},
			})
		);
		expect(missingType.eligible).toBe(false);
		expect(missingType.missing).toContain('journey_type_slug');
	});
});

describe('PR-J2B4 SQL safety', () => {
	const sql = readFileSync(
		join(pendingDir, '025b4_active_journey_seo_complete_backfill.sql'),
		'utf8'
	);
	const rollback = readFileSync(
		join(pendingDir, '025b4_active_journey_seo_complete_backfill.rollback.sql'),
		'utf8'
	);

	it('modifies only seo_complete in forward migration', () => {
		expect(migrationSqlModifiesOnlyB4SeoComplete(sql)).toBe(true);
		expect(forwardMigrationExpectsTwentyFourUpdatedRows(sql)).toBe(true);
		expect(sql).toContain('seo_complete = TRUE');
	});

	it('does not modify price or metadata fields', () => {
		const executable = stripSqlComments(sql);
		expect(executable).not.toMatch(/\bprice_from\s*=/i);
		expect(executable).not.toMatch(/\bpage_title\s*=/i);
		expect(executable).not.toMatch(/\bSET\s+status\s*=/i);
	});

	it('rollback restores exact pre-migration NULL values', () => {
		expect(rollback).toContain('old_seo_complete boolean');
		expect(rollback).not.toContain('old_seo_complete boolean NOT NULL');
		expect(rollback).toMatch(/::uuid, NULL\)/);
		expect(rollback).not.toContain('FALSE');
	});

	it('rollback refuses admin edits', () => {
		expect(rollback).toContain('changed since B4');
	});
});

describe('PR-J2B4 preflight', () => {
	it('is ready when all 24 active rows pass eligibility', () => {
		const rows = PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST.map((entry) =>
			row({
				id: entry.id,
				slug: entry.slug,
				status: 'active',
				title: 'Title',
				short_description: 'Excerpt',
				page_title: 'Page',
				meta_description: 'Meta',
				hero_image_url: 'https://example.com/h.jpg',
				hero_image_alt: 'Alt',
				journey_type_slug: 'explore-together',
				seo_complete: false,
				data: {},
			})
		);
		const archived = Array.from({ length: 59 }, (_, i) =>
			row({ id: `arch-${i}`, status: 'archived', slug: `arch-${i}` })
		);
		const result = evaluateB4SeoCompletePreflight(
			[...rows, ...archived],
			PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST,
			{ databaseIdentity: 'test' }
		);
		expect(result.ready).toBe(true);
		expect(result.eligibleCount).toBe(24);
	});
});
