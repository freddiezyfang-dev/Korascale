/**
 * PR-J3C read-only slug uniqueness audit + constraint readiness preflight.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j3c-slug-uniqueness-preflight.ts
 *
 * No --apply flag. Does not modify database rows or schema.
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import {
	isValidCanonicalSlug,
	normalizeJourneySlugForComparison,
	detectSlugIssues,
	JOURNEY_SLUG_NORMALIZED_UNIQUE_INDEX,
} from '@/lib/journeyNormalization/slug';
import { resolveCanonicalPublishSlug } from '@/lib/journeyNormalization/journeyPublishIntegrity';

const RUNTIME_WRITERS = [
	'src/app/api/journeys/route.ts',
	'src/app/api/journeys/[id]/route.ts',
];

const TARGET_INDEX_DEF =
	'CREATE UNIQUE INDEX journeys_slug_normalized_unique_idx ON journeys (LOWER(BTRIM(slug))) WHERE slug IS NOT NULL AND BTRIM(slug) <> \'\';';

type DuplicateGroup = {
	normalizedSlug: string;
	rowCount: number;
	ids: string[];
	rawSlugs: string[];
	statuses: string[];
};

type JourneyAuditRow = {
	id: string;
	slug: string | null;
	status: string;
};

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

loadEnvLocal();

function runtimeWritersReady(): boolean {
	return RUNTIME_WRITERS.every((file) => {
		const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
		return (
			source.includes('runJourneySlugUniquenessPreCheck') &&
			source.includes('isJourneySlugUniquenessViolation') &&
			source.includes('journeySlugConflictJsonResponse')
		);
	});
}

function dbConflictHandlerReady(): boolean {
	const constantsSource = fs.readFileSync(
		path.join(process.cwd(), 'src/lib/journeyNormalization/journeySlugConflictConstants.ts'),
		'utf8'
	);
	const constantsReady =
		constantsSource.includes('JOURNEY_SLUG_UNIQUENESS_OBJECTS') &&
		constantsSource.includes('journeys_slug_key') &&
		constantsSource.includes('journeys_slug_normalized_unique_idx') &&
		constantsSource.includes('isJourneySlugUniquenessViolation');

	return (
		constantsReady &&
		RUNTIME_WRITERS.every((file) => {
			const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
			return source.includes('isJourneySlugUniquenessViolation');
		})
	);
}

function runtimeWritersAudited(): number {
	return RUNTIME_WRITERS.length;
}

function runtimeWritersHandlingSlugConflict(): number {
	return RUNTIME_WRITERS.filter((file) => {
		const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
		return source.includes('journeySlugConflictJsonResponse');
	}).length;
}

function buildDuplicateGroups(
	rows: JourneyAuditRow[],
	keyFn: (row: JourneyAuditRow) => string | null
): DuplicateGroup[] {
	const groups = new Map<string, JourneyAuditRow[]>();
	for (const row of rows) {
		const key = keyFn(row);
		if (!key) continue;
		const bucket = groups.get(key) ?? [];
		bucket.push(row);
		groups.set(key, bucket);
	}
	return [...groups.entries()]
		.filter(([, members]) => members.length > 1)
		.map(([normalizedSlug, members]) => ({
			normalizedSlug,
			rowCount: members.length,
			ids: members.map((m) => m.id),
			rawSlugs: members.map((m) => m.slug ?? ''),
			statuses: members.map((m) => m.status),
		}));
}

function indexDefinitionMatches(indexDef: string | null): boolean {
	if (!indexDef) return false;
	const normalized = indexDef.toLowerCase().replace(/\s+/g, ' ');
	return (
		normalized.includes('journeys_slug_normalized_unique_idx') &&
		normalized.includes('lower(btrim') &&
		normalized.includes('slug is not null') &&
		normalized.includes('btrim') &&
		normalized.includes("<> ''")
	);
}

async function main() {
	const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) throw new Error('Missing POSTGRES_URL');

	const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
	const client = await pool.connect();
	const blockers: string[] = [];

	try {
		await client.query('BEGIN TRANSACTION READ ONLY');

		const identity = await client.query('SELECT current_database() AS db, inet_server_addr()::text AS host');
		const databaseIdentity = `${identity.rows[0]?.host ?? 'unknown'}/${identity.rows[0]?.db ?? 'unknown'}`;

		const counts = await client.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active,
        COUNT(*) FILTER (WHERE status = 'archived')::int AS archived,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
        COUNT(*) FILTER (WHERE status = 'inactive')::int AS inactive,
        COUNT(*) FILTER (WHERE status IS NULL)::int AS null_status,
        COUNT(*) FILTER (WHERE slug IS NULL)::int AS null_slug,
        COUNT(*) FILTER (WHERE slug IS NOT NULL AND BTRIM(slug) = '')::int AS empty_slug,
        COUNT(*) FILTER (WHERE slug IS NOT NULL AND BTRIM(slug) <> '' AND slug <> BTRIM(slug))::int AS trim_variant_slug,
        COUNT(*) FILTER (WHERE slug IS NOT NULL AND BTRIM(slug) <> '' AND slug <> LOWER(BTRIM(slug)))::int AS case_variant_slug,
        COUNT(*) FILTER (WHERE slug IS NOT NULL AND BTRIM(slug) <> '' AND slug ~ '-$')::int AS trailing_hyphen_slug
      FROM journeys
    `);
		const c = counts.rows[0];

		const rowsResult = await client.query(`
      SELECT id, slug, status
      FROM journeys
      ORDER BY id
    `);
		const rows = rowsResult.rows as JourneyAuditRow[];

		const normalizedDupResult = await client.query(`
      SELECT
        LOWER(BTRIM(slug)) AS normalized_slug,
        COUNT(*)::int AS row_count,
        ARRAY_AGG(id ORDER BY id) AS ids,
        ARRAY_AGG(slug ORDER BY id) AS raw_slugs,
        ARRAY_AGG(status ORDER BY id) AS statuses
      FROM journeys
      WHERE slug IS NOT NULL
        AND BTRIM(slug) <> ''
      GROUP BY LOWER(BTRIM(slug))
      HAVING COUNT(*) > 1
    `);
		const normalizedDuplicateGroups: DuplicateGroup[] = normalizedDupResult.rows.map((row) => ({
			normalizedSlug: row.normalized_slug,
			rowCount: row.row_count,
			ids: row.ids,
			rawSlugs: row.raw_slugs,
			statuses: row.statuses,
		}));

		const exactDuplicateGroups = buildDuplicateGroups(rows, (row) =>
			row.slug == null ? null : row.slug
		);
		const caseVariantCollisionGroups = buildDuplicateGroups(rows, (row) =>
			row.slug == null || String(row.slug).trim() === ''
				? null
				: normalizeJourneySlugForComparison(row.slug)
		).filter((group) => {
			const uniqueRaw = new Set(group.rawSlugs.map((s) => s));
			return uniqueRaw.size > 1 && group.rawSlugs.some((s) => s !== s.toLowerCase());
		});
		const trimVariantCollisionGroups = buildDuplicateGroups(rows, (row) =>
			normalizeJourneySlugForComparison(row.slug)
		).filter((group) => {
			const uniqueRaw = new Set(group.rawSlugs.map((s) => s.trim()));
			return group.rawSlugs.some((s) => s !== s.trim());
		});

		const activeMissingSlugIds = rows
			.filter((row) => row.status === 'active' && normalizeJourneySlugForComparison(row.slug) == null)
			.map((row) => row.id);

		const activeInvalidCanonicalSlugIds = rows
			.filter((row) => {
				if (row.status !== 'active') return false;
				const raw = row.slug == null ? '' : String(row.slug).trim();
				if (!raw) return true;
				const canonical = resolveCanonicalPublishSlug(raw);
				const issues = detectSlugIssues(raw);
				return !canonical || !isValidCanonicalSlug(canonical, issues);
			})
			.map((row) => row.id);

		const archivedInvalidCanonicalSlugIds = rows
			.filter((row) => {
				if (row.status !== 'archived') return false;
				const raw = row.slug == null ? '' : String(row.slug).trim();
				if (!raw) return false;
				const canonical = resolveCanonicalPublishSlug(raw);
				const issues = detectSlugIssues(raw);
				return !canonical || !isValidCanonicalSlug(canonical, issues);
			})
			.map((row) => row.id);

		const slugColumn = await client.query(`
      SELECT data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'journeys'
        AND column_name = 'slug'
    `);

		const existingSlugIndexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'journeys'
        AND indexdef ILIKE '%slug%'
      ORDER BY indexname
    `);

		const existingSlugConstraints = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'journeys'::regclass
        AND pg_get_constraintdef(oid) ILIKE '%slug%'
      ORDER BY conname
    `);

		const targetIndexResult = await client.query(`
      SELECT pi.indexname, pi.indexdef, pgi.indisunique
      FROM pg_indexes pi
      JOIN pg_class pc ON pc.relname = pi.indexname
      JOIN pg_index pgi ON pgi.indexrelid = pc.oid
      WHERE pi.schemaname = 'public'
        AND pi.tablename = 'journeys'
        AND pi.indexname = $1
    `, [JOURNEY_SLUG_NORMALIZED_UNIQUE_INDEX]);

		await client.query('ROLLBACK');

		const targetIndexExists = targetIndexResult.rows.length > 0;
		const targetIndexDefinition = targetIndexResult.rows[0]?.indexdef ?? null;
		const targetIndexDefinitionMatches = indexDefinitionMatches(targetIndexDefinition);
		const alreadyApplied = targetIndexExists && targetIndexDefinitionMatches;
		const noActionRequired = alreadyApplied;

		const writersReady = runtimeWritersReady();
		const conflictHandlerReady = dbConflictHandlerReady();

		if (Number(c.total) !== 83) blockers.push(`total=${c.total}, expected 83`);
		if (Number(c.active) !== 24) blockers.push(`active=${c.active}, expected 24`);
		if (Number(c.archived) !== 59) blockers.push(`archived=${c.archived}, expected 59`);
		if (Number(c.inactive) !== 0) blockers.push(`inactive=${c.inactive}, expected 0`);
		if (Number(c.null_status) !== 0) blockers.push(`null_status=${c.null_status}, expected 0`);
		if (normalizedDuplicateGroups.length > 0) {
			blockers.push(`normalizedDuplicateGroups=${normalizedDuplicateGroups.length}`);
		}
		if (activeMissingSlugIds.length > 0) {
			blockers.push(`activeMissingSlugIds=${activeMissingSlugIds.length}`);
		}
		if (activeInvalidCanonicalSlugIds.length > 0) {
			blockers.push(`activeInvalidCanonicalSlugIds=${activeInvalidCanonicalSlugIds.length}`);
		}
		if (!writersReady) blockers.push('runtimeWritersReady=false');
		if (!conflictHandlerReady) blockers.push('dbConflictHandlerReady=false');

		if (targetIndexExists && !targetIndexDefinitionMatches) {
			blockers.push('targetIndexExists with unexpected definition');
		}

		const ready =
			blockers.length === 0 &&
			(alreadyApplied || !targetIndexExists);

		const report = {
			phase: 'PR-J3C',
			readOnly: true,
			databaseIdentity,
			total: Number(c.total),
			active: Number(c.active),
			archived: Number(c.archived),
			draft: Number(c.draft),
			inactive: Number(c.inactive),
			nullStatus: Number(c.null_status),
			nullSlugCount: Number(c.null_slug),
			emptySlugCount: Number(c.empty_slug),
			whitespaceOnlySlugCount: Number(c.empty_slug),
			trimVariantSlugCount: Number(c.trim_variant_slug),
			caseVariantSlugCount: Number(c.case_variant_slug),
			trailingHyphenSlugCount: Number(c.trailing_hyphen_slug),
			activeMissingSlugIds,
			exactDuplicateGroups,
			normalizedDuplicateGroups,
			caseVariantCollisionGroups,
			trimVariantCollisionGroups,
			activeInvalidCanonicalSlugIds,
			archivedInvalidCanonicalSlugIds,
			slugColumn: slugColumn.rows[0] ?? null,
			existingSlugIndexes: existingSlugIndexes.rows,
			existingSlugConstraints: existingSlugConstraints.rows,
			targetIndexName: JOURNEY_SLUG_NORMALIZED_UNIQUE_INDEX,
			targetIndexDefinition: TARGET_INDEX_DEF,
			targetIndexExists,
			targetIndexDefinitionMatches,
			runtimeWritersAudited: runtimeWritersAudited(),
			runtimeWritersHandlingSlugConflict: runtimeWritersHandlingSlugConflict(),
			runtimeWritersReady: writersReady,
			dbConflictHandlerReady: conflictHandlerReady,
			ready,
			alreadyApplied,
			noActionRequired,
			blockers,
		};

		console.log(JSON.stringify(report, null, 2));
		if (!ready) process.exitCode = 1;
	} finally {
		client.release();
		await pool.end();
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
