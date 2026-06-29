/**
 * Generate PR-J2B4 seo_complete artifacts from Production DB (read-only).
 * Usage: npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2b4-generate-seo-complete-artifacts.ts
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import {
	buildB4SeoCompleteManifestEntry,
	type B4SeoCompleteManifestEntry,
} from '@/lib/journeyNormalization/activeSeoCompleteBackfill';
import { PR_J2B3A_ACTIVE_MANIFEST } from '@/lib/journeyNormalization/prJ2b3aActiveManifest';
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

function sqlEscape(value: string): string {
	return value.replace(/'/g, "''");
}

function csvEscape(v: unknown): string {
	const s = v == null ? '' : String(v);
	if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
	return s;
}

function buildManifestTs(manifest: B4SeoCompleteManifestEntry[]): string {
	const entries = manifest
		.map(
			(entry) => `\t{
\t\tid: '${entry.id}',
\t\tslug: ${JSON.stringify(entry.slug)},
\t\tseoComplete: { proposed: true, source: 'evaluator_pass' },
\t\teligible: ${entry.eligible},
\t\tmissing: ${JSON.stringify(entry.missing)},
\t\tmanualReview: ${entry.manualReview},
\t\treason: ${JSON.stringify(entry.reason)},
\t}`
		)
		.join(',\n');

	return `/** Approved PR-J2B4 active seo_complete manifest — 24 active journeys. */
import type { B4SeoCompleteManifestEntry } from './activeSeoCompleteBackfill';

export const PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST: readonly B4SeoCompleteManifestEntry[] = [
${entries}
] as const;

export const PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST_IDS =
	PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST.map((e) => e.id);

export function assertPrJ2b4SeoCompleteManifestIntegrity(): void {
\tif (PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST.length !== 24) {
\t\tthrow new Error(\`Manifest count \${PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST.length} != 24\`);
\t}
\tconst ids = new Set(PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST_IDS);
\tif (ids.size !== 24) throw new Error('Manifest contains duplicate IDs');
\tif (ids.has('e468b842-7c59-4258-8d56-8b585566be82')) {
\t\tthrow new Error('Manifest must not include e468b842');
\t}
\tif (PR_J2B4_ACTIVE_SEO_COMPLETE_MANIFEST.some((e) => !e.eligible || e.manualReview)) {
\t\tthrow new Error('Manifest contains ineligible entries');
\t}
}

assertPrJ2b4SeoCompleteManifestIntegrity();
`;
}

function buildForwardSql(manifest: B4SeoCompleteManifestEntry[]): string {
	const values = manifest
		.map((e) => `  ('${e.id}'::uuid, '${sqlEscape(e.slug)}')`)
		.join(',\n');

	return `-- PR-J2B4: Active Journey seo_complete backfill ONLY (24 active)
-- DO NOT EXECUTE until docs/audits/pr-j2b4-active-seo-complete-preview.csv is approved.
--
-- SCOPE: seo_complete = true for active manifest only (admin quality marker)
-- DOES NOT modify: price_from, currency, price_basis, price_on_request, metadata, status, slug, JSONB
-- seo_complete does NOT gate list inclusion, detail 200, sitemap, canonical, or indexability
--
-- ROLLBACK: 025b4_active_journey_seo_complete_backfill.rollback.sql

BEGIN;

CREATE TEMP TABLE pr_j2b4_manifest (
  id uuid PRIMARY KEY,
  expected_slug text NOT NULL
);

INSERT INTO pr_j2b4_manifest (id, expected_slug) VALUES
${values};

CREATE TEMP TABLE pr_j2b4_snapshot AS
  SELECT j.id, j.slug, j.status, j.title, j.short_description, j.data,
         j.page_title, j.meta_description, j.hero_image_url, j.hero_image_alt, j.journey_type_slug,
         j.price, j.price_from, j.currency, j.price_basis, j.price_on_request, j.seo_complete
  FROM journeys j
  WHERE j.id IN (SELECT id FROM pr_j2b4_manifest);

CREATE TEMP TABLE pr_j2b4_external_slug_snapshot AS
  SELECT j.id, j.slug FROM journeys j
  WHERE j.id NOT IN (SELECT id FROM pr_j2b4_manifest);

DO $$
DECLARE
  total_count INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  manifest_count INTEGER;
  manifest_missing INTEGER;
  status_mismatch INTEGER;
  slug_mismatch INTEGER;
  seo_already_true INTEGER;
  incomplete_row INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM journeys;
  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  SELECT COUNT(*) INTO manifest_count FROM pr_j2b4_manifest;

  IF total_count <> 83 THEN RAISE EXCEPTION 'ABORT: expected 83 journeys, found %', total_count; END IF;
  IF active_count <> 24 THEN RAISE EXCEPTION 'ABORT: expected 24 active, found %', active_count; END IF;
  IF archived_count <> 59 THEN RAISE EXCEPTION 'ABORT: expected 59 archived, found %', archived_count; END IF;
  IF manifest_count <> 24 THEN RAISE EXCEPTION 'ABORT: expected manifest count 24, found %', manifest_count; END IF;

  SELECT COUNT(*) INTO manifest_missing
  FROM pr_j2b4_manifest m LEFT JOIN journeys j ON j.id = m.id WHERE j.id IS NULL;
  IF manifest_missing <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest IDs missing', manifest_missing; END IF;

  SELECT COUNT(*) INTO status_mismatch
  FROM pr_j2b4_manifest m JOIN journeys j ON j.id = m.id WHERE j.status <> 'active';
  IF status_mismatch <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows not active', status_mismatch; END IF;

  SELECT COUNT(*) INTO slug_mismatch
  FROM pr_j2b4_manifest m JOIN journeys j ON j.id = m.id WHERE j.slug <> m.expected_slug;
  IF slug_mismatch <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest slug mismatch', slug_mismatch; END IF;

  SELECT COUNT(*) INTO seo_already_true
  FROM pr_j2b4_manifest m JOIN journeys j ON j.id = m.id WHERE j.seo_complete IS TRUE;
  IF seo_already_true <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows already seo_complete', seo_already_true; END IF;

  SELECT COUNT(*) INTO incomplete_row
  FROM pr_j2b4_manifest m
  JOIN journeys j ON j.id = m.id
  WHERE BTRIM(COALESCE(j.title, '')) = ''
     OR BTRIM(COALESCE(j.page_title, '')) = ''
     OR BTRIM(COALESCE(j.meta_description, '')) = ''
     OR BTRIM(COALESCE(j.short_description, '')) = ''
     OR BTRIM(COALESCE(j.hero_image_url, '')) = ''
     OR BTRIM(COALESCE(j.hero_image_alt, '')) = ''
     OR BTRIM(COALESCE(j.journey_type_slug, '')) = ''
     OR j.slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$';
  IF incomplete_row <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows fail seo_complete prerequisites', incomplete_row; END IF;
END $$;

DO $$
DECLARE
  updated_rows INTEGER;
  not_true_after INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  slug_changed INTEGER;
  non_target_changed INTEGER;
  seo_complete_true INTEGER;
BEGIN
  UPDATE journeys j
  SET seo_complete = TRUE
  FROM pr_j2b4_manifest m
  WHERE j.id = m.id
    AND (j.seo_complete IS DISTINCT FROM TRUE);

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 24 THEN
    RAISE EXCEPTION 'ABORT: expected 24 updated rows, found %', updated_rows;
  END IF;

  SELECT COUNT(*) INTO not_true_after
  FROM pr_j2b4_manifest m JOIN journeys j ON j.id = m.id
  WHERE j.seo_complete IS DISTINCT FROM TRUE;
  IF not_true_after <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows not seo_complete after update', not_true_after; END IF;

  SELECT COUNT(*) INTO seo_complete_true
  FROM pr_j2b4_manifest m JOIN journeys j ON j.id = m.id
  WHERE j.seo_complete IS TRUE;
  IF seo_complete_true <> 24 THEN
    RAISE EXCEPTION 'ABORT: expected 24/24 seo_complete=true after update';
  END IF;

  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  IF active_count <> 24 OR archived_count <> 59 THEN
    RAISE EXCEPTION 'ABORT: status counts changed after seo_complete update';
  END IF;

  SELECT COUNT(*) INTO slug_changed
  FROM pr_j2b4_external_slug_snapshot s JOIN journeys j ON j.id = s.id
  WHERE j.slug IS DISTINCT FROM s.slug;
  IF slug_changed <> 0 THEN RAISE EXCEPTION 'ABORT: manifest-external slug changed'; END IF;

  SELECT COUNT(*) INTO non_target_changed
  FROM pr_j2b4_snapshot s JOIN journeys j ON j.id = s.id
  WHERE j.status IS DISTINCT FROM s.status
     OR j.slug IS DISTINCT FROM s.slug
     OR j.title IS DISTINCT FROM s.title
     OR j.short_description IS DISTINCT FROM s.short_description
     OR j.data IS DISTINCT FROM s.data
     OR j.page_title IS DISTINCT FROM s.page_title
     OR j.meta_description IS DISTINCT FROM s.meta_description
     OR j.hero_image_url IS DISTINCT FROM s.hero_image_url
     OR j.hero_image_alt IS DISTINCT FROM s.hero_image_alt
     OR j.journey_type_slug IS DISTINCT FROM s.journey_type_slug
     OR j.price IS DISTINCT FROM s.price
     OR j.price_from IS DISTINCT FROM s.price_from
     OR j.currency IS DISTINCT FROM s.currency
     OR j.price_basis IS DISTINCT FROM s.price_basis
     OR j.price_on_request IS DISTINCT FROM s.price_on_request;
  IF non_target_changed <> 0 THEN
    RAISE EXCEPTION 'ABORT: % manifest rows changed non-target fields', non_target_changed;
  END IF;
END $$;

COMMIT;
`;
}

function buildRollbackSql(manifest: B4SeoCompleteManifestEntry[]): string {
	const rollbackValues = manifest.map((e) => `  ('${e.id}'::uuid, NULL)`).join(',\n');

	return `-- Rollback 025B4 — restore ONLY the 24 active manifest seo_complete values to NULL.
-- Does NOT modify manifest-external journeys.

BEGIN;

CREATE TEMP TABLE pr_j2b4_rollback (
  id uuid PRIMARY KEY,
  old_seo_complete boolean
);

INSERT INTO pr_j2b4_rollback (id, old_seo_complete) VALUES
${rollbackValues};

CREATE TEMP TABLE pr_j2b4_external_slug_snapshot AS
  SELECT j.id, j.slug FROM journeys j
  WHERE j.id NOT IN (SELECT id FROM pr_j2b4_rollback);

DO $$
DECLARE
  manifest_count INTEGER;
  admin_edit_count INTEGER;
  updated_rows INTEGER;
BEGIN
  SELECT COUNT(*) INTO manifest_count FROM pr_j2b4_rollback;
  IF manifest_count <> 24 THEN RAISE EXCEPTION 'ABORT: rollback manifest count %', manifest_count; END IF;

  SELECT COUNT(*) INTO admin_edit_count
  FROM pr_j2b4_rollback r
  JOIN journeys j ON j.id = r.id
  WHERE j.seo_complete IS DISTINCT FROM TRUE;
  IF admin_edit_count <> 0 THEN
    RAISE EXCEPTION 'ABORT: % manifest rows changed since B4 — rollback refused', admin_edit_count;
  END IF;

  UPDATE journeys j
  SET seo_complete = r.old_seo_complete
  FROM pr_j2b4_rollback r
  WHERE j.id = r.id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 24 THEN RAISE EXCEPTION 'ABORT: expected 24 rollback rows, found %', updated_rows; END IF;
END $$;

COMMIT;
`;
}

loadEnvLocal();
process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';

async function main() {
	const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) throw new Error('Missing POSTGRES_URL');

	const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
	const client = await pool.connect();
	let rows: JourneyRowLike[];
	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const result = await client.query(`
      SELECT j.id, j.slug, j.status, j.title, j.short_description, j.image, j.journey_type,
             j.page_title, j.meta_description, j.hero_image_url, j.hero_image_alt, j.journey_type_slug,
             j.seo_complete, j.data
      FROM journeys j
      ORDER BY j.slug
    `);
		await client.query('ROLLBACK');
		rows = result.rows as JourneyRowLike[];
	} finally {
		client.release();
		await pool.end();
	}

	const b3aIds = new Set(PR_J2B3A_ACTIVE_MANIFEST.map((e) => e.id));
	const manifest = rows
		.filter((r) => b3aIds.has(String(r.id)))
		.sort((a, b) => String(a.slug).localeCompare(String(b.slug)))
		.map((row) => {
			const entry = buildB4SeoCompleteManifestEntry(row);
			const b3a = PR_J2B3A_ACTIVE_MANIFEST.find((e) => e.id === entry.id);
			if (b3a) entry.slug = b3a.slug;
			return entry;
		});

	if (manifest.length !== 24) throw new Error(`Expected 24 manifest rows, got ${manifest.length}`);
	if (manifest.some((e) => e.manualReview)) {
		throw new Error(
			`Ineligible: ${manifest.filter((e) => e.manualReview).map((e) => `${e.slug}:${e.missing.join(',')}`).join('; ')}`
		);
	}

	const previewCsv = [
		'id,slug,eligible,missing,seo_complete_proposed,manual_review,reason',
		...manifest.map((e) =>
			[e.id, e.slug, e.eligible, e.missing.join('|'), true, e.manualReview, e.reason]
				.map(csvEscape)
				.join(',')
		),
	].join('\n') + '\n';

	const root = process.cwd();
	fs.writeFileSync(
		path.join(root, 'src/lib/journeyNormalization/prJ2b4ActiveSeoCompleteManifest.ts'),
		buildManifestTs(manifest)
	);
	fs.writeFileSync(
		path.join(root, 'database/migrations/pending/025b4_active_journey_seo_complete_backfill.sql'),
		buildForwardSql(manifest)
	);
	fs.writeFileSync(
		path.join(
			root,
			'database/migrations/pending/025b4_active_journey_seo_complete_backfill.rollback.sql'
		),
		buildRollbackSql(manifest)
	);
	fs.writeFileSync(
		path.join(root, 'docs/audits/pr-j2b4-active-seo-complete-preview.csv'),
		previewCsv
	);

	console.log(JSON.stringify({ manifest: manifest.length, eligible: manifest.filter((e) => e.eligible).length }, null, 2));
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
