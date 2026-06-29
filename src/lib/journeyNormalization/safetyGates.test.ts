import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { buildPublicStatusWhereClause } from '@/lib/journeyNormalization/status';
import {
	assertJourneySqlSafeForCurrentSchema,
	buildJourneyDualWritePayload,
	buildJourneyInsertSql,
	findExpandedColumnReferencesInSql,
	isJourneyExpandedColumnsEnabled,
	mergeExpandedColumnSql,
} from '@/lib/journeyNormalization/write';
import { resolveAdminCompatPageTitle } from '@/lib/journeyNormalization/adminCompatFields';
import { migrationSqlModifiesOnlyB3aMetadata } from '@/lib/journeyNormalization/activeMetadataBackfill';
import { migrationSqlModifiesOnlyB4SeoComplete } from '@/lib/journeyNormalization/activeSeoCompleteBackfill';
import { migrationSqlModifiesOnlySlug } from '@/lib/journeyNormalization/slugBackfill';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';

const migrationsDir = join(process.cwd(), 'database/migrations');
const pendingDir = join(migrationsDir, 'pending');

function stripSqlComments(sql: string): string {
	return sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n');
}

const JOURNEY_PUBLIC_SELECT_SQL = `
  SELECT
    id, title, slug, description, short_description,
    price, original_price, category, journey_type, region, place, city, location,
    duration, difficulty, max_participants, min_participants,
    image, status, featured, rating, review_count,
    (data - 'itinerary') as data, created_at, updated_at
  FROM journeys
  WHERE ${buildPublicStatusWhereClause()}
`;

describe('safety gate 1: migrations are manual-only', () => {
	it('init-database.js only runs 001_create_tables.sql', () => {
		const initScript = readFileSync(join(process.cwd(), 'scripts/init-database.js'), 'utf8');
		expect(initScript).toContain('001_create_tables.sql');
		expect(initScript).not.toContain('pending/');
		expect(initScript).not.toMatch(/readdir|glob|025b|025c/i);
	});

	it('run-migration.js requires explicit filename (no directory scan)', () => {
		const runScript = readFileSync(join(process.cwd(), 'scripts/run-migration.js'), 'utf8');
		expect(runScript).toContain('migrationFileName');
		expect(runScript).not.toContain('pending/');
		expect(runScript).not.toMatch(/readdir|glob/i);
	});

	it('025b and 025c live under pending/ not auto-discovered root', () => {
		expect(() =>
			readFileSync(join(migrationsDir, '025b_journey_normalization_backfill.sql'), 'utf8')
		).toThrow();
		expect(() =>
			readFileSync(join(migrationsDir, '025c_journey_normalization_constraints.sql'), 'utf8')
		).toThrow();
		expect(readFileSync(join(pendingDir, '025b_journey_normalization_backfill.sql'), 'utf8')).toContain(
			'025B'
		);
	});
});

describe('safety gate 2: flag off must not reference expanded columns in SQL', () => {
	const originalFlag = process.env.JOURNEY_NORMALIZATION_COLUMNS;

	afterEach(() => {
		if (originalFlag === undefined) {
			delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		} else {
			process.env.JOURNEY_NORMALIZATION_COLUMNS = originalFlag;
		}
	});

	it('public journey list SQL uses legacy columns only', () => {
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		expect(findExpandedColumnReferencesInSql(JOURNEY_PUBLIC_SELECT_SQL)).toEqual([]);
		assertJourneySqlSafeForCurrentSchema(JOURNEY_PUBLIC_SELECT_SQL);
	});

	it('flag off: insert SQL omits expanded columns', () => {
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		const dualWrite = buildJourneyDualWritePayload({
			pageTitle: 'Page',
			metaDescription: 'Meta',
			heroImage: '/hero.jpg',
			heroAlt: 'Alt',
			journeyType: 'Explore Together',
		});
		const { sql } = buildJourneyInsertSql(dualWrite.expandedColumns);
		expect(findExpandedColumnReferencesInSql(sql)).toEqual([]);
		assertJourneySqlSafeForCurrentSchema(sql);
	});

	it('flag off: admin compat resolver reads JSONB when column gated off', () => {
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		const resolved = resolveAdminCompatPageTitle({
			title: 'Column Title',
			data: { pageTitle: 'JSON Title' },
			page_title: 'Expanded Column',
		} as JourneyRowLike);
		expect(resolved.value).toBe('JSON Title');
		expect(resolved.source).toBe('jsonb');
	});

	it('flag on + post-025A: insert SQL includes expanded columns atomically', () => {
		process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';
		const dualWrite = buildJourneyDualWritePayload({
			pageTitle: 'Page',
			metaDescription: 'Meta',
			heroImage: '/hero.jpg',
			heroAlt: 'Alt',
			journeyType: 'Explore Together',
		});
		const { sql, expandedValues } = buildJourneyInsertSql(dualWrite.expandedColumns);
		expect(isJourneyExpandedColumnsEnabled()).toBe(true);
		expect(sql).toContain('page_title');
		expect(sql).toContain('meta_description');
		expect(sql).toContain('hero_image_url');
		expect(sql).toContain('journey_type_slug');
		expect(sql).toContain('$1::jsonb');
		expect(expandedValues.length).toBeGreaterThan(0);
	});
});

describe('safety gate 3: dual-write is single-statement', () => {
	it('mergeExpandedColumnSql adds column assignments to same UPDATE', () => {
		process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';
		const dualWrite = buildJourneyDualWritePayload({
			pageTitle: 'Page',
			metaDescription: 'Meta',
		});
		const merged = mergeExpandedColumnSql(dualWrite.expandedColumns, 5);
		expect(merged.fields).toEqual(['page_title = $5', 'meta_description = $6']);
		expect(merged.values).toEqual(['Page', 'Meta']);
		expect(merged.nextIndex).toBe(7);
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
	});

	it('buildJourneyInsertSql keeps JSONB and columns in one INSERT', () => {
		process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';
		const dualWrite = buildJourneyDualWritePayload({ pageTitle: 'Only Title' });
		const { sql } = buildJourneyInsertSql(dualWrite.expandedColumns);
		expect(sql).toMatch(/INSERT INTO journeys/);
		expect(sql).toContain('page_title');
		expect(sql).toContain('$1::jsonb');
		expect(sql.match(/INSERT INTO journeys/g)?.length).toBe(1);
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
	});
});

describe('safety gate 4d: 025B3A active metadata-only backfill', () => {
	const sql = readFileSync(
		join(pendingDir, '025b3a_active_journey_metadata_backfill.sql'),
		'utf8'
	);

	it('requires manifest table and metadata-only update', () => {
		expect(sql).toContain('pr_j2b3a_manifest');
		expect(migrationSqlModifiesOnlyB3aMetadata(sql)).toBe(true);
	});

	it('does not SET hero_image_alt, seo_complete, slug, or status', () => {
		expect(migrationSqlModifiesOnlyB3aMetadata(sql)).toBe(true);
		expect(sql).not.toMatch(/\bSET\s+slug/i);
		expect(sql).not.toMatch(/\bSET\s+status/i);
	});
});

describe('safety gate 4c: 025B2 slug-only backfill', () => {
	const sql = readFileSync(
		join(pendingDir, '025b2_journey_slug_normalization.sql'),
		'utf8'
	);

	it('requires manifest table and slug-only update', () => {
		expect(sql).toContain('pr_j2b2_manifest');
		expect(sql).toContain('SET slug = m.new_slug');
		expect(sql).not.toContain('SET status');
	});

	it('does not modify status, metadata, or price fields', () => {
		expect(migrationSqlModifiesOnlySlug(sql)).toBe(true);
	});
});

describe('safety gate 4b: 025B1 status-only backfill', () => {
	const sql = readFileSync(
		join(pendingDir, '025b1_journey_status_backfill.sql'),
		'utf8'
	);

	it('requires manifest IDs and inactive guard', () => {
		expect(sql).toContain('Manifest target IDs');
		expect(sql).toContain("WHERE status = 'inactive'");
		expect(sql).toContain('id IN (');
	});

	it('does not modify slug, price, or seo_complete', () => {
		expect(stripSqlComments(sql)).not.toMatch(/\bslug\s*=/i);
		expect(stripSqlComments(sql)).not.toMatch(/\bprice_/i);
		expect(stripSqlComments(sql)).not.toMatch(/\bseo_complete\s*=/i);
	});
});

describe('safety gate 4c: 025B4 seo_complete-only backfill', () => {
	const sql = readFileSync(
		join(pendingDir, '025b4_active_journey_seo_complete_backfill.sql'),
		'utf8'
	);

	it('requires manifest table and seo_complete-only update', () => {
		expect(sql).toContain('pr_j2b4_manifest');
		expect(sql).toContain('seo_complete = TRUE');
		expect(sql).not.toContain('SET status');
	});

	it('does not modify price or metadata fields', () => {
		expect(migrationSqlModifiesOnlyB4SeoComplete(sql)).toBe(true);
	});
});

describe('safety gate 4: 025B does not write unconfirmed data', () => {
	const sql = readFileSync(
		join(pendingDir, '025b_journey_normalization_backfill.sql'),
		'utf8'
	);

	it('copies price to price_from only', () => {
		expect(sql).toContain('price_from = COALESCE(price_from, NULLIF(price, 0))');
	});

	it('does not auto-fill currency, price_basis, or price_on_request', () => {
		expect(sql).toContain('-- currency and price_basis intentionally remain NULL');
		expect(sql).not.toMatch(/\bcurrency\s*=/i);
		expect(sql).not.toMatch(/\bprice_basis\s*=/i);
		expect(sql).not.toMatch(/\bprice_on_request\s*=/i);
	});

	it('does not backfill hero_image_alt', () => {
		expect(sql).toContain('-- hero_image_alt requires manual editorial review');
		expect(sql).not.toMatch(/\bhero_image_alt\s*=/i);
	});

	it('does not auto-set seo_complete', () => {
		expect(sql).toContain(
			'-- seo_complete remains false until required fields are reviewed manually'
		);
		expect(stripSqlComments(sql)).not.toMatch(/\bseo_complete\s*=/i);
	});

	it('skips manual review journey e468b842 in row-scoped backfills', () => {
		expect(sql).toContain('e468b842-7c59-4258-8d56-8b585566be82');
		const executable = stripSqlComments(sql);
		const rowScopedUpdates = executable.match(
			/UPDATE journeys[\s\S]*?WHERE id <> 'e468b842-7c59-4258-8d56-8b585566be82'/g
		);
		expect(rowScopedUpdates?.length).toBeGreaterThanOrEqual(2);
	});
});

describe('safety gate 5: 025C1 status-only constraints', () => {
	const forwardSql = readFileSync(
		join(pendingDir, '025c1_journey_status_constraints.sql'),
		'utf8'
	);
	const rollbackSql = readFileSync(
		join(pendingDir, '025c1_journey_status_constraints.rollback.sql'),
		'utf8'
	);

	it('forward migration sets NOT NULL and journeys_status_check only', () => {
		const executable = stripSqlComments(forwardSql);
		expect(forwardSql).toContain('journeys_status_check');
		expect(forwardSql).toContain("SET NOT NULL");
		expect(executable).not.toMatch(/\bUPDATE\s+journeys\b/i);
		expect(executable).not.toContain('journey_type_slug');
		expect(executable).not.toContain('currency');
		expect(executable).not.toContain('price_basis');
	});

	it('rollback drops constraint and NOT NULL without row changes', () => {
		expect(rollbackSql).toContain('DROP CONSTRAINT journeys_status_check');
		expect(rollbackSql).toContain('DROP NOT NULL');
		expect(stripSqlComments(rollbackSql)).not.toMatch(/\bUPDATE\s+journeys\b/i);
	});

	it('025C1 lives under pending/ and is not auto-discovered', () => {
		expect(() =>
			readFileSync(join(migrationsDir, '025c1_journey_status_constraints.sql'), 'utf8')
		).toThrow();
	});
});
