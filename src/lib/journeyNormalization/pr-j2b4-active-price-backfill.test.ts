import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	buildB4ActiveManifestEntry,
	evaluateB4Preflight,
	forwardMigrationExpectsTwentyFourUpdatedRows,
	migrationSqlModifiesOnlyB4Price,
	PR_J2B4_EXCLUDED_ID,
	PR_J2B4_MANIFEST_COUNT,
} from '@/lib/journeyNormalization/activePriceBackfill';
import {
	PR_J2B4_ACTIVE_MANIFEST,
	PR_J2B4_ACTIVE_MANIFEST_IDS,
} from '@/lib/journeyNormalization/prJ2b4ActiveManifest';
import { PR_J2B3A_ACTIVE_MANIFEST_IDS } from '@/lib/journeyNormalization/prJ2b3aActiveManifest';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';

const pendingDir = join(process.cwd(), 'database/migrations/pending');

beforeEach(() => {
	vi.stubEnv('JOURNEY_NORMALIZATION_COLUMNS', '1');
});

function row(partial: JourneyRowLike): JourneyRowLike {
	return partial;
}

describe('PR-J2B4 manifest', () => {
	it('contains exactly 24 active entries aligned with B3A IDs', () => {
		expect(PR_J2B4_ACTIVE_MANIFEST).toHaveLength(PR_J2B4_MANIFEST_COUNT);
		expect(new Set(PR_J2B4_ACTIVE_MANIFEST_IDS).size).toBe(24);
		expect(PR_J2B4_ACTIVE_MANIFEST_IDS).not.toContain(PR_J2B4_EXCLUDED_ID);
		expect([...PR_J2B4_ACTIVE_MANIFEST_IDS].sort()).toEqual([...PR_J2B3A_ACTIVE_MANIFEST_IDS].sort());
		expect(PR_J2B4_ACTIVE_MANIFEST.every((e) => !e.manualReview)).toBe(true);
	});
});

describe('PR-J2B4 source rules', () => {
	it('copies legacy price when price_from is empty', () => {
		const entry = buildB4ActiveManifestEntry(
			row({ id: 'a', status: 'active', slug: 'test', price: 217, price_from: null })
		);
		expect(entry.priceFrom.proposed).toBe(217);
		expect(entry.priceFrom.source).toBe('price_column');
	});

	it('keeps existing price_from when already set', () => {
		const entry = buildB4ActiveManifestEntry(
			row({ id: 'a', status: 'active', slug: 'test', price: 217, price_from: 199 })
		);
		expect(entry.priceFrom.proposed).toBe(199);
		expect(entry.priceFrom.source).toBe('existing_price_from');
	});
});

describe('PR-J2B4 SQL safety', () => {
	const sql = readFileSync(join(pendingDir, '025b4_active_journey_price_backfill.sql'), 'utf8');
	const rollback = readFileSync(
		join(pendingDir, '025b4_active_journey_price_backfill.rollback.sql'),
		'utf8'
	);

	it('modifies only price_from in forward migration', () => {
		expect(migrationSqlModifiesOnlyB4Price(sql)).toBe(true);
		expect(forwardMigrationExpectsTwentyFourUpdatedRows(sql)).toBe(true);
	});

	it('does not auto-fill currency, price_basis, or price_on_request', () => {
		expect(sql).not.toMatch(/\bcurrency\s*=/i);
		expect(sql).not.toMatch(/\bprice_basis\s*=/i);
		expect(sql).not.toMatch(/\bprice_on_request\s*=/i);
	});

	it('rollback refuses admin edits', () => {
		expect(rollback).toContain('changed since B4');
	});
});

describe('PR-J2B4 preflight', () => {
	it('is ready when manifest matches 24 active rows with legacy price', () => {
		const rows = PR_J2B4_ACTIVE_MANIFEST.map((entry) =>
			row({
				id: entry.id,
				slug: entry.slug,
				status: 'active',
				price: entry.legacyPrice,
				price_from: null,
			})
		);
		const archived = Array.from({ length: 59 }, (_, i) =>
			row({ id: `arch-${i}`, status: 'archived', slug: `arch-${i}` })
		);
		const result = evaluateB4Preflight([...rows, ...archived], PR_J2B4_ACTIVE_MANIFEST, {
			databaseIdentity: 'test',
		});
		expect(result.ready).toBe(true);
		expect(result.priceFromResolved).toBe(24);
	});
});
