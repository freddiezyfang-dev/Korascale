/**
 * Generate PR-J2B3A artifacts from Production DB (read-only).
 * Usage: npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2b3a-generate-artifacts.ts
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import {
	buildB3aActiveManifestEntry,
	buildB3aRenderedSnapshotEntry,
	buildB3aSourceMatrixRow,
	countB3aProposedUpdates,
	sqlEscape,
	summarizeB3aSourceStats,
	PR_J2B3A_EXCLUDED_ID,
} from '@/lib/journeyNormalization/activeMetadataBackfill';
import type { B3aActiveManifestEntry } from '@/lib/journeyNormalization/activeMetadataBackfill';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';

function loadEnvLocal() {
	const envPath = path.join(process.cwd(), '.env.local');
	if (!fs.existsSync(envPath)) return;
	for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const idx = trimmed.indexOf('=');
		if (idx === -1) continue;
		const key = trimmed.slice(0, idx).trim();
		let value = trimmed.slice(idx + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (!(key in process.env)) process.env[key] = value;
	}
}

function csvEscape(v: unknown): string {
	const s = v == null ? '' : String(v);
	if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
	return s;
}

function nullableColumn(value: string): string | null {
	return value ? value : null;
}

function buildManifestTs(manifest: B3aActiveManifestEntry[]): string {
	const entries = manifest
		.map((entry) => {
			const field = (f: { proposed: string; source: string }) =>
				`{ proposed: ${JSON.stringify(f.proposed)}, source: '${f.source}' }`;
			return `\t{
\t\tid: '${entry.id}',
\t\tslug: ${JSON.stringify(entry.slug)},
\t\tpageTitle: ${field(entry.pageTitle)},
\t\tmetaDescription: ${field(entry.metaDescription)},
\t\theroImageUrl: ${field(entry.heroImageUrl)},
\t\tjourneyTypeSlug: ${field(entry.journeyTypeSlug)},
\t\tmanualReview: ${entry.manualReview},
\t\treason: ${JSON.stringify(entry.reason)},
\t}`;
		})
		.join(',\n');

	const lines = [
		'/** Approved PR-J2B3A active metadata manifest — 24 active journeys. */',
		"import type { B3aActiveManifestEntry } from './activeMetadataBackfill';",
		'',
		'export const PR_J2B3A_ACTIVE_MANIFEST: readonly B3aActiveManifestEntry[] = [',
		entries,
		'] as const;',
		'',
		'export const PR_J2B3A_ACTIVE_MANIFEST_IDS = PR_J2B3A_ACTIVE_MANIFEST.map((e) => e.id);',
		'',
		'export function assertPrJ2b3aManifestIntegrity(): void {',
		'\tif (PR_J2B3A_ACTIVE_MANIFEST.length !== 24) {',
		"\t\tthrow new Error(`Manifest count ${PR_J2B3A_ACTIVE_MANIFEST.length} != 24`);",
		'\t}',
		'\tconst ids = new Set(PR_J2B3A_ACTIVE_MANIFEST_IDS);',
		"\tif (ids.size !== 24) throw new Error('Manifest contains duplicate IDs');",
		`\tif (ids.has('${PR_J2B3A_EXCLUDED_ID}')) {`,
		"\t\tthrow new Error('Manifest must not include e468b842');",
		'\t}',
		'}',
		'',
		'assertPrJ2b3aManifestIntegrity();',
	];
	return `${lines.join('\n')}\n`;
}

function buildForwardSql(manifest: B3aActiveManifestEntry[]): string {
	const values = manifest
		.map(
			(e) =>
				`  ('${e.id}'::uuid, '${sqlEscape(e.slug)}', '${sqlEscape(e.pageTitle.proposed)}', '${sqlEscape(e.metaDescription.proposed)}', '${sqlEscape(e.heroImageUrl.proposed)}', '${sqlEscape(e.journeyTypeSlug.proposed)}')`
		)
		.join(',\n');

	return `-- PR-J2B3A: Active Journey metadata & taxonomy backfill ONLY (24 active)
-- DO NOT EXECUTE until docs/audits/pr-j2b3a-active-preview.csv is approved.
--
-- SCOPE: page_title, meta_description, hero_image_url, journey_type_slug for active manifest only
-- DOES NOT modify: status, slug, title, short_description, JSONB, hero_image_alt, price, seo_complete
-- updated_at: maintained by update_journeys_updated_at trigger (001_create_tables.sql)
--
-- ROLLBACK: 025b3a_active_journey_metadata_backfill.rollback.sql

BEGIN;

CREATE TEMP TABLE pr_j2b3a_manifest (
  id uuid PRIMARY KEY,
  expected_slug text NOT NULL,
  page_title_proposed text NOT NULL,
  meta_description_proposed text NOT NULL,
  hero_image_url_proposed text NOT NULL,
  journey_type_slug_proposed text NOT NULL
);

INSERT INTO pr_j2b3a_manifest (id, expected_slug, page_title_proposed, meta_description_proposed, hero_image_url_proposed, journey_type_slug_proposed) VALUES
${values};

CREATE TEMP TABLE pr_j2b3a_snapshot AS
  SELECT j.id, j.slug, j.status, j.title, j.short_description, j.data,
         j.page_title, j.meta_description, j.hero_image_url, j.hero_image_alt, j.journey_type_slug,
         j.price_from, j.seo_complete
  FROM journeys j
  WHERE j.id IN (SELECT id FROM pr_j2b3a_manifest);

CREATE TEMP TABLE pr_j2b3a_external_slug_snapshot AS
  SELECT j.id, j.slug FROM journeys j
  WHERE j.id NOT IN (SELECT id FROM pr_j2b3a_manifest);

DO $$
DECLARE
  total_count INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  manifest_count INTEGER;
  manifest_missing INTEGER;
  status_mismatch INTEGER;
  slug_mismatch INTEGER;
  empty_proposed INTEGER;
  column_conflict INTEGER;
  hero_alt_missing INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM journeys;
  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  SELECT COUNT(*) INTO manifest_count FROM pr_j2b3a_manifest;

  IF total_count <> 83 THEN RAISE EXCEPTION 'ABORT: expected 83 journeys, found %', total_count; END IF;
  IF active_count <> 24 THEN RAISE EXCEPTION 'ABORT: expected 24 active, found %', active_count; END IF;
  IF archived_count <> 59 THEN RAISE EXCEPTION 'ABORT: expected 59 archived, found %', archived_count; END IF;
  IF manifest_count <> 24 THEN RAISE EXCEPTION 'ABORT: expected manifest count 24, found %', manifest_count; END IF;

  SELECT COUNT(*) INTO manifest_missing
  FROM pr_j2b3a_manifest m LEFT JOIN journeys j ON j.id = m.id WHERE j.id IS NULL;
  IF manifest_missing <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest IDs missing', manifest_missing; END IF;

  SELECT COUNT(*) INTO status_mismatch
  FROM pr_j2b3a_manifest m JOIN journeys j ON j.id = m.id WHERE j.status <> 'active';
  IF status_mismatch <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows not active', status_mismatch; END IF;

  SELECT COUNT(*) INTO slug_mismatch
  FROM pr_j2b3a_manifest m JOIN journeys j ON j.id = m.id WHERE j.slug <> m.expected_slug;
  IF slug_mismatch <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest slug mismatch', slug_mismatch; END IF;

  SELECT COUNT(*) INTO empty_proposed
  FROM pr_j2b3a_manifest m
  WHERE BTRIM(m.page_title_proposed) = ''
     OR BTRIM(m.meta_description_proposed) = ''
     OR BTRIM(m.hero_image_url_proposed) = ''
     OR BTRIM(m.journey_type_slug_proposed) = '';
  IF empty_proposed <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows have empty proposed values', empty_proposed; END IF;

  SELECT COUNT(*) INTO column_conflict
  FROM pr_j2b3a_manifest m
  JOIN journeys j ON j.id = m.id
  WHERE (BTRIM(COALESCE(j.page_title, '')) <> '' AND BTRIM(j.page_title) <> m.page_title_proposed)
     OR (BTRIM(COALESCE(j.meta_description, '')) <> '' AND BTRIM(j.meta_description) <> m.meta_description_proposed)
     OR (BTRIM(COALESCE(j.hero_image_url, '')) <> '' AND BTRIM(j.hero_image_url) <> m.hero_image_url_proposed)
     OR (BTRIM(COALESCE(j.journey_type_slug, '')) <> '' AND BTRIM(j.journey_type_slug) <> m.journey_type_slug_proposed);
  IF column_conflict <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows have column conflicts', column_conflict; END IF;

  SELECT COUNT(*) INTO hero_alt_missing
  FROM pr_j2b3a_manifest m
  JOIN journeys j ON j.id = m.id
  WHERE BTRIM(COALESCE(j.hero_image_alt, '')) = '';
  IF hero_alt_missing <> 0 THEN RAISE EXCEPTION 'ABORT: % active manifest rows missing hero_image_alt', hero_alt_missing; END IF;
END $$;

DO $$
DECLARE
  updated_rows INTEGER;
  empty_after INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  slug_changed INTEGER;
  non_target_changed INTEGER;
BEGIN
  UPDATE journeys j
  SET
    page_title = CASE WHEN BTRIM(COALESCE(j.page_title, '')) = '' THEN m.page_title_proposed ELSE j.page_title END,
    meta_description = CASE WHEN BTRIM(COALESCE(j.meta_description, '')) = '' THEN m.meta_description_proposed ELSE j.meta_description END,
    hero_image_url = CASE WHEN BTRIM(COALESCE(j.hero_image_url, '')) = '' THEN m.hero_image_url_proposed ELSE j.hero_image_url END,
    journey_type_slug = CASE WHEN BTRIM(COALESCE(j.journey_type_slug, '')) = '' THEN m.journey_type_slug_proposed ELSE j.journey_type_slug END
  FROM pr_j2b3a_manifest m
  WHERE j.id = m.id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 24 THEN
    RAISE EXCEPTION 'ABORT: expected 24 updated rows, found %', updated_rows;
  END IF;

  SELECT COUNT(*) INTO empty_after
  FROM pr_j2b3a_manifest m JOIN journeys j ON j.id = m.id
  WHERE BTRIM(COALESCE(j.page_title, '')) = ''
     OR BTRIM(COALESCE(j.meta_description, '')) = ''
     OR BTRIM(COALESCE(j.hero_image_url, '')) = ''
     OR BTRIM(COALESCE(j.journey_type_slug, '')) = '';
  IF empty_after <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows still have empty normalized columns', empty_after; END IF;

  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  IF active_count <> 24 OR archived_count <> 59 THEN
    RAISE EXCEPTION 'ABORT: status counts changed after metadata update';
  END IF;

  SELECT COUNT(*) INTO slug_changed
  FROM pr_j2b3a_external_slug_snapshot s JOIN journeys j ON j.id = s.id
  WHERE j.slug IS DISTINCT FROM s.slug;
  IF slug_changed <> 0 THEN RAISE EXCEPTION 'ABORT: manifest-external slug changed'; END IF;

  SELECT COUNT(*) INTO non_target_changed
  FROM pr_j2b3a_snapshot s JOIN journeys j ON j.id = s.id
  WHERE j.status IS DISTINCT FROM s.status
     OR j.slug IS DISTINCT FROM s.slug
     OR j.title IS DISTINCT FROM s.title
     OR j.short_description IS DISTINCT FROM s.short_description
     OR j.data IS DISTINCT FROM s.data
     OR j.hero_image_alt IS DISTINCT FROM s.hero_image_alt
     OR j.price_from IS DISTINCT FROM s.price_from
     OR j.seo_complete IS DISTINCT FROM s.seo_complete;
  IF non_target_changed <> 0 THEN
    RAISE EXCEPTION 'ABORT: % manifest rows changed non-target fields', non_target_changed;
  END IF;
END $$;

COMMIT;
`;
}

function buildRollbackSql(
	rollbackRows: Array<{
		id: string;
		page_title: string | null;
		meta_description: string | null;
		hero_image_url: string | null;
		journey_type_slug: string | null;
	}>,
	manifest: B3aActiveManifestEntry[]
): string {
	const rollbackValues = rollbackRows
		.map(
			(row) =>
				`  ('${row.id}'::uuid, ${row.page_title == null ? 'NULL' : `'${sqlEscape(row.page_title)}'`}, ${row.meta_description == null ? 'NULL' : `'${sqlEscape(row.meta_description)}'`}, ${row.hero_image_url == null ? 'NULL' : `'${sqlEscape(row.hero_image_url)}'`}, ${row.journey_type_slug == null ? 'NULL' : `'${sqlEscape(row.journey_type_slug)}'`})`
		)
		.join(',\n');

	const b3aValues = manifest
		.map(
			(e) =>
				`  ('${e.id}'::uuid, '${sqlEscape(e.pageTitle.proposed)}', '${sqlEscape(e.metaDescription.proposed)}', '${sqlEscape(e.heroImageUrl.proposed)}', '${sqlEscape(e.journeyTypeSlug.proposed)}')`
		)
		.join(',\n');

	return `-- Rollback 025B3A — restore ONLY the 24 active manifest normalized column values.
-- Does NOT modify manifest-external journeys.

BEGIN;

CREATE TEMP TABLE pr_j2b3a_rollback (
  id uuid PRIMARY KEY,
  old_page_title text,
  old_meta_description text,
  old_hero_image_url text,
  old_journey_type_slug text
);

INSERT INTO pr_j2b3a_rollback (id, old_page_title, old_meta_description, old_hero_image_url, old_journey_type_slug) VALUES
${rollbackValues};

CREATE TEMP TABLE pr_j2b3a_b3a_values (
  id uuid PRIMARY KEY,
  page_title text NOT NULL,
  meta_description text NOT NULL,
  hero_image_url text NOT NULL,
  journey_type_slug text NOT NULL
);

INSERT INTO pr_j2b3a_b3a_values (id, page_title, meta_description, hero_image_url, journey_type_slug) VALUES
${b3aValues};

CREATE TEMP TABLE pr_j2b3a_external_slug_snapshot AS
  SELECT j.id, j.slug FROM journeys j
  WHERE j.id NOT IN (SELECT id FROM pr_j2b3a_rollback);

DO $$
DECLARE
  manifest_count INTEGER;
  value_mismatch INTEGER;
  updated_rows INTEGER;
  external_changed INTEGER;
BEGIN
  SELECT COUNT(*) INTO manifest_count FROM pr_j2b3a_rollback;
  IF manifest_count <> 24 THEN RAISE EXCEPTION 'ABORT rollback: manifest count must be 24'; END IF;

  SELECT COUNT(*) INTO value_mismatch
  FROM pr_j2b3a_b3a_values b
  JOIN journeys j ON j.id = b.id
  WHERE j.page_title IS DISTINCT FROM b.page_title
     OR j.meta_description IS DISTINCT FROM b.meta_description
     OR j.hero_image_url IS DISTINCT FROM b.hero_image_url
     OR j.journey_type_slug IS DISTINCT FROM b.journey_type_slug;
  IF value_mismatch <> 0 THEN
    RAISE EXCEPTION 'ABORT rollback: % manifest rows differ from B3A values (admin may have edited)', value_mismatch;
  END IF;

  UPDATE journeys j
  SET
    page_title = r.old_page_title,
    meta_description = r.old_meta_description,
    hero_image_url = r.old_hero_image_url,
    journey_type_slug = r.old_journey_type_slug
  FROM pr_j2b3a_rollback r
  WHERE j.id = r.id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 24 THEN
    RAISE EXCEPTION 'ABORT rollback: expected 24 updated rows, found %', updated_rows;
  END IF;

  SELECT COUNT(*) INTO external_changed
  FROM pr_j2b3a_external_slug_snapshot s JOIN journeys j ON j.id = s.id
  WHERE j.slug IS DISTINCT FROM s.slug;
  IF external_changed <> 0 THEN RAISE EXCEPTION 'ABORT rollback: manifest-external slug changed'; END IF;
END $$;

COMMIT;
`;
}

loadEnvLocal();
process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';

async function main() {
	const connectionString =
		process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) throw new Error('Missing POSTGRES_URL');

	const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
	const client = await pool.connect();
	let rows: JourneyRowLike[];
	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const result = await client.query(`
      SELECT j.id, j.slug, j.status, j.title, j.short_description, j.image, j.journey_type,
             j.page_title, j.meta_description, j.hero_image_url, j.hero_image_alt, j.journey_type_slug,
             j.price_from, j.seo_complete, j.data
      FROM journeys j
      WHERE j.status = 'active'
      ORDER BY j.slug
    `);
		await client.query('ROLLBACK');
		rows = result.rows as JourneyRowLike[];
	} finally {
		client.release();
		await pool.end();
	}

	if (rows.length !== 24) {
		throw new Error(`Expected 24 active rows, found ${rows.length}`);
	}
	if (rows.some((r) => String(r.id).toLowerCase() === PR_J2B3A_EXCLUDED_ID)) {
		throw new Error('e468b842 must not be active');
	}

	const manifest = rows.map((row) => buildB3aActiveManifestEntry(row));
	const manual = manifest.filter((e) => e.manualReview);
	if (manual.length) {
		console.error('MANUAL_REVIEW entries:', manual);
		throw new Error(`${manual.length} manifest entries require manual review`);
	}

	const matrix = rows.map((row) => buildB3aSourceMatrixRow(row));
	const stats = summarizeB3aSourceStats(matrix);
	const updateCounts = countB3aProposedUpdates(rows, manifest);
	const snapshot = rows.map((row) => buildB3aRenderedSnapshotEntry(row));

	const rollbackRows = rows.map((row) => ({
		id: String(row.id).toLowerCase(),
		page_title: nullableColumn(String((row as Record<string, unknown>).page_title ?? '').trim()),
		meta_description: nullableColumn(
			String((row as Record<string, unknown>).meta_description ?? '').trim()
		),
		hero_image_url: nullableColumn(
			String((row as Record<string, unknown>).hero_image_url ?? '').trim()
		),
		journey_type_slug: nullableColumn(
			String((row as Record<string, unknown>).journey_type_slug ?? '').trim()
		),
	}));

	const auditsDir = path.join(process.cwd(), 'docs/audits');
	const libDir = path.join(process.cwd(), 'src/lib/journeyNormalization');
	const pendingDir = path.join(process.cwd(), 'database/migrations/pending');
	fs.mkdirSync(auditsDir, { recursive: true });

	// source matrix CSV
	const matrixHeader = [
		'id','slug','title','data_page_title','title_fallback','resolved_page_title',
		'page_title_column_before','page_title_proposed','page_title_source',
		'data_meta_description','short_description_fallback','resolved_meta_description',
		'meta_description_column_before','meta_description_proposed','meta_description_source',
		'data_hero_image','image_fallback','resolved_hero_image_url',
		'hero_image_url_column_before','hero_image_url_proposed','hero_image_source',
		'legacy_journey_type','data_journey_type','resolved_journey_type_slug',
		'journey_type_slug_column_before','journey_type_slug_proposed','journey_type_slug_source',
		'manual_review','reason',
	];
	const matrixCsv = [
		matrixHeader.join(','),
		...matrix.map((r) =>
			[
				r.id,r.slug,r.title,r.dataPageTitle,r.titleFallback,r.resolvedPageTitle,
				r.pageTitleColumnBefore,r.pageTitleProposed,r.pageTitleSource,
				r.dataMetaDescription,r.shortDescriptionFallback,r.resolvedMetaDescription,
				r.metaDescriptionColumnBefore,r.metaDescriptionProposed,r.metaDescriptionSource,
				r.dataHeroImage,r.imageFallback,r.resolvedHeroImageUrl,
				r.heroImageUrlColumnBefore,r.heroImageUrlProposed,r.heroImageSource,
				r.legacyJourneyType,r.dataJourneyType,r.resolvedJourneyTypeSlug,
				r.journeyTypeSlugColumnBefore,r.journeyTypeSlugProposed,r.journeyTypeSlugSource,
				r.manualReview,r.reason,
			].map(csvEscape).join(',')
		),
	].join('\n') + '\n';
	fs.writeFileSync(path.join(auditsDir, 'pr-j2b3a-active-source-matrix.csv'), matrixCsv);

	// preview CSV
	const previewHeader = [
		'id','slug','page_title_proposed','page_title_source',
		'meta_description_proposed','meta_description_source',
		'hero_image_url_proposed','hero_image_source',
		'journey_type_slug_proposed','journey_type_slug_source',
		'manual_review','reason',
	];
	const previewCsv = [
		previewHeader.join(','),
		...manifest.map((e) =>
			[
				e.id,e.slug,e.pageTitle.proposed,e.pageTitle.source,
				e.metaDescription.proposed,e.metaDescription.source,
				e.heroImageUrl.proposed,e.heroImageUrl.source,
				e.journeyTypeSlug.proposed,e.journeyTypeSlug.source,
				e.manualReview,e.reason,
			].map(csvEscape).join(',')
		),
	].join('\n') + '\n';
	fs.writeFileSync(path.join(auditsDir, 'pr-j2b3a-active-preview.csv'), previewCsv);

	fs.writeFileSync(
		path.join(auditsDir, 'pr-j2b3a-rendered-value-snapshot.json'),
		JSON.stringify({ generatedAt: new Date().toISOString(), entries: snapshot, stats, updateCounts }, null, 2) + '\n'
	);

	fs.writeFileSync(path.join(libDir, 'prJ2b3aActiveManifest.ts'), buildManifestTs(manifest));
	fs.writeFileSync(
		path.join(pendingDir, '025b3a_active_journey_metadata_backfill.sql'),
		buildForwardSql(manifest)
	);
	fs.writeFileSync(
		path.join(pendingDir, '025b3a_active_journey_metadata_backfill.rollback.sql'),
		buildRollbackSql(rollbackRows, manifest)
	);

	console.log(JSON.stringify({ manifestCount: manifest.length, stats, updateCounts }, null, 2));
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
