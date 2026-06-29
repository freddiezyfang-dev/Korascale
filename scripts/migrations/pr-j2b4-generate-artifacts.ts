/**
 * Generate PR-J2B4 artifacts from Production DB (read-only).
 * Usage: npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2b4-generate-artifacts.ts
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import {
	buildB4ActiveManifestEntry,
	countB4ProposedUpdates,
	sqlEscape,
	type B4ActiveManifestEntry,
} from '@/lib/journeyNormalization/activePriceBackfill';
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

function csvEscape(v: unknown): string {
	const s = v == null ? '' : String(v);
	if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
	return s;
}

function buildManifestTs(manifest: B4ActiveManifestEntry[]): string {
	const entries = manifest
		.map((entry) => {
			const proposed =
				entry.priceFrom.proposed == null ? 'null' : String(entry.priceFrom.proposed);
			return `\t{
\t\tid: '${entry.id}',
\t\tslug: ${JSON.stringify(entry.slug)},
\t\tpriceFrom: { proposed: ${proposed}, source: '${entry.priceFrom.source}' },
\t\tlegacyPrice: ${entry.legacyPrice == null ? 'null' : entry.legacyPrice},
\t\tmanualReview: ${entry.manualReview},
\t\treason: ${JSON.stringify(entry.reason)},
\t}`;
		})
		.join(',\n');

	return `/** Approved PR-J2B4 active price_from manifest — 24 active journeys. */
import type { B4ActiveManifestEntry } from './activePriceBackfill';

export const PR_J2B4_ACTIVE_MANIFEST: readonly B4ActiveManifestEntry[] = [
${entries}
] as const;

export const PR_J2B4_ACTIVE_MANIFEST_IDS = PR_J2B4_ACTIVE_MANIFEST.map((e) => e.id);

export function assertPrJ2b4ManifestIntegrity(): void {
\tif (PR_J2B4_ACTIVE_MANIFEST.length !== 24) {
\t\tthrow new Error(\`Manifest count \${PR_J2B4_ACTIVE_MANIFEST.length} != 24\`);
\t}
\tconst ids = new Set(PR_J2B4_ACTIVE_MANIFEST_IDS);
\tif (ids.size !== 24) throw new Error('Manifest contains duplicate IDs');
\tif (ids.has('e468b842-7c59-4258-8d56-8b585566be82')) {
\t\tthrow new Error('Manifest must not include e468b842');
\t}
}

assertPrJ2b4ManifestIntegrity();
`;
}

function buildForwardSql(manifest: B4ActiveManifestEntry[]): string {
	const values = manifest
		.map(
			(e) =>
				`  ('${e.id}'::uuid, ${JSON.stringify(e.slug)}, ${e.priceFrom.proposed})`
		)
		.join(',\n');

	return `-- PR-J2B4: Active Journey price_from backfill ONLY (24 active)
-- DO NOT EXECUTE until docs/audits/pr-j2b4-active-preview.csv is approved.
--
-- SCOPE: price_from for active manifest only (COALESCE from legacy price column)
-- DOES NOT modify: currency, price_basis, price_on_request, metadata, status, slug, JSONB
-- updated_at: maintained by update_journeys_updated_at trigger (001_create_tables.sql)
--
-- ROLLBACK: 025b4_active_journey_price_backfill.rollback.sql

BEGIN;

CREATE TEMP TABLE pr_j2b4_manifest (
  id uuid PRIMARY KEY,
  expected_slug text NOT NULL,
  price_from_proposed numeric NOT NULL
);

INSERT INTO pr_j2b4_manifest (id, expected_slug, price_from_proposed) VALUES
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
  invalid_proposed INTEGER;
  column_conflict INTEGER;
  legacy_price_missing INTEGER;
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

  SELECT COUNT(*) INTO invalid_proposed
  FROM pr_j2b4_manifest m WHERE m.price_from_proposed IS NULL OR m.price_from_proposed <= 0;
  IF invalid_proposed <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows have invalid proposed price_from', invalid_proposed; END IF;

  SELECT COUNT(*) INTO column_conflict
  FROM pr_j2b4_manifest m
  JOIN journeys j ON j.id = m.id
  WHERE j.price_from IS NOT NULL AND j.price_from > 0 AND j.price_from IS DISTINCT FROM m.price_from_proposed;
  IF column_conflict <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows have price_from conflicts', column_conflict; END IF;

  SELECT COUNT(*) INTO legacy_price_missing
  FROM pr_j2b4_manifest m
  JOIN journeys j ON j.id = m.id
  WHERE j.price IS NULL OR j.price <= 0;
  IF legacy_price_missing <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows missing legacy price', legacy_price_missing; END IF;
END $$;

DO $$
DECLARE
  updated_rows INTEGER;
  empty_after INTEGER;
  active_count INTEGER;
  archived_count INTEGER;
  slug_changed INTEGER;
  non_target_changed INTEGER;
  price_from_filled INTEGER;
BEGIN
  UPDATE journeys j
  SET
    price_from = CASE
      WHEN j.price_from IS NULL OR j.price_from = 0 THEN m.price_from_proposed
      ELSE j.price_from
    END
  FROM pr_j2b4_manifest m
  WHERE j.id = m.id;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 24 THEN
    RAISE EXCEPTION 'ABORT: expected 24 updated rows, found %', updated_rows;
  END IF;

  SELECT COUNT(*) INTO empty_after
  FROM pr_j2b4_manifest m JOIN journeys j ON j.id = m.id
  WHERE j.price_from IS NULL OR j.price_from <= 0;
  IF empty_after <> 0 THEN RAISE EXCEPTION 'ABORT: % manifest rows still have empty price_from', empty_after; END IF;

  SELECT COUNT(*) INTO price_from_filled
  FROM pr_j2b4_manifest m JOIN journeys j ON j.id = m.id
  WHERE j.price_from IS NOT NULL AND j.price_from > 0;
  IF price_from_filled <> 24 THEN
    RAISE EXCEPTION 'ABORT: expected 24/24 filled price_from after update';
  END IF;

  SELECT COUNT(*) INTO active_count FROM journeys WHERE status = 'active';
  SELECT COUNT(*) INTO archived_count FROM journeys WHERE status = 'archived';
  IF active_count <> 24 OR archived_count <> 59 THEN
    RAISE EXCEPTION 'ABORT: status counts changed after price update';
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
     OR j.currency IS DISTINCT FROM s.currency
     OR j.price_basis IS DISTINCT FROM s.price_basis
     OR j.price_on_request IS DISTINCT FROM s.price_on_request
     OR j.seo_complete IS DISTINCT FROM s.seo_complete
     OR j.price IS DISTINCT FROM s.price;
  IF non_target_changed <> 0 THEN
    RAISE EXCEPTION 'ABORT: % manifest rows changed non-target fields', non_target_changed;
  END IF;
END $$;

COMMIT;
`;
}

function buildRollbackSql(manifest: B4ActiveManifestEntry[]): string {
	const rollbackValues = manifest
		.map((e) => `  ('${e.id}'::uuid, NULL)`)
		.join(',\n');
	const b4Values = manifest
		.map((e) => `  ('${e.id}'::uuid, ${e.priceFrom.proposed})`)
		.join(',\n');

	return `-- Rollback 025B4 — restore ONLY the 24 active manifest price_from values to NULL.
-- Does NOT modify manifest-external journeys.

BEGIN;

CREATE TEMP TABLE pr_j2b4_rollback (
  id uuid PRIMARY KEY,
  old_price_from numeric
);

INSERT INTO pr_j2b4_rollback (id, old_price_from) VALUES
${rollbackValues};

CREATE TEMP TABLE pr_j2b4_b4_values (
  id uuid PRIMARY KEY,
  price_from numeric NOT NULL
);

INSERT INTO pr_j2b4_b4_values (id, price_from) VALUES
${b4Values};

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
  JOIN pr_j2b4_b4_values v ON v.id = r.id
  WHERE j.price_from IS DISTINCT FROM v.price_from;
  IF admin_edit_count <> 0 THEN
    RAISE EXCEPTION 'ABORT: % manifest rows changed since B4 — rollback refused', admin_edit_count;
  END IF;

  UPDATE journeys j
  SET price_from = r.old_price_from
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
      SELECT j.id, j.slug, j.status, j.title, j.price, j.price_from
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
			const entry = buildB4ActiveManifestEntry(row);
			const b3a = PR_J2B3A_ACTIVE_MANIFEST.find((e) => e.id === entry.id);
			if (b3a) entry.slug = b3a.slug;
			return entry;
		});

	if (manifest.length !== 24) {
		throw new Error(`Expected 24 manifest rows, got ${manifest.length}`);
	}
	if (manifest.some((e) => e.manualReview)) {
		throw new Error(`Manual review entries: ${manifest.filter((e) => e.manualReview).map((e) => e.id).join(', ')}`);
	}

	const previewCsv = [
		'id,slug,legacy_price,price_from_current,price_from_proposed,source,manual_review,reason',
		...manifest.map((e) =>
			[
				e.id,
				e.slug,
				e.legacyPrice,
				'',
				e.priceFrom.proposed,
				e.priceFrom.source,
				e.manualReview,
				e.reason,
			]
				.map(csvEscape)
				.join(',')
		),
	].join('\n') + '\n';

	const root = process.cwd();
	fs.writeFileSync(path.join(root, 'src/lib/journeyNormalization/prJ2b4ActiveManifest.ts'), buildManifestTs(manifest));
	fs.writeFileSync(
		path.join(root, 'database/migrations/pending/025b4_active_journey_price_backfill.sql'),
		buildForwardSql(manifest)
	);
	fs.writeFileSync(
		path.join(root, 'database/migrations/pending/025b4_active_journey_price_backfill.rollback.sql'),
		buildRollbackSql(manifest)
	);
	fs.writeFileSync(path.join(root, 'docs/audits/pr-j2b4-active-preview.csv'), previewCsv);

	console.log(
		JSON.stringify(
			{
				manifest: manifest.length,
				proposedUpdates: countB4ProposedUpdates(rows, manifest),
				previewCsv: 'docs/audits/pr-j2b4-active-preview.csv',
			},
			null,
			2
		)
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
