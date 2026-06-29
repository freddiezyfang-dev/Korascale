/**
 * PR-J2B2 read-only slug normalization preflight.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2b2-slug-preflight.ts
 *
 * Does NOT execute UPDATE/INSERT/DELETE. No --apply mode.
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import { PR_J2B2_ACTIVE_ENTRY } from '@/lib/journeyNormalization/prJ2b2SlugManifest';
import {
	buildSlugBackfillPreview,
	evaluateSlugPreflight,
	maskDatabaseIdentity,
} from '@/lib/journeyNormalization/slugBackfill';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';

const SITE_URL = 'https://www.korascale.com';

function loadEnvLocal() {
	const envPath = path.join(process.cwd(), '.env.local');
	if (!fs.existsSync(envPath)) return;
	const content = fs.readFileSync(envPath, 'utf8');
	for (const line of content.split(/\r?\n/)) {
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

async function fetchHeadStatus(url: string): Promise<string> {
	try {
		const response = await fetch(url, { redirect: 'manual' });
		return String(response.status);
	} catch {
		return 'error';
	}
}

async function sitemapIncludesCanonical(canonicalSlug: string): Promise<boolean> {
	try {
		const response = await fetch(`${SITE_URL}/sitemap.xml`);
		const body = await response.text();
		return body.includes(`/journeys/${canonicalSlug}</loc>`);
	} catch {
		return false;
	}
}

loadEnvLocal();

async function fetchJourneyRows(): Promise<JourneyRowLike[]> {
	const connectionString =
		process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) {
		throw new Error('Missing POSTGRES_URL / NEON_POSTGRES_URL');
	}

	const pool = new Pool({
		connectionString,
		ssl: { rejectUnauthorized: false },
	});
	const client = await pool.connect();
	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const result = await client.query(`
      SELECT j.id, j.slug, j.status, j.title
      FROM journeys j
      ORDER BY j.slug
    `);
		await client.query('ROLLBACK');
		return result.rows as JourneyRowLike[];
	} finally {
		client.release();
		await pool.end();
	}
}

async function main() {
	const connectionString =
		process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	const rows = await fetchJourneyRows();

	const activeOldUrlStatus = await fetchHeadStatus(
		`${SITE_URL}/journeys/${PR_J2B2_ACTIVE_ENTRY.oldSlug}`
	);
	const activeNewUrlStatus = await fetchHeadStatus(
		`${SITE_URL}/journeys/${PR_J2B2_ACTIVE_ENTRY.newSlug}`
	);
	const sitemapCanonicalIncluded = await sitemapIncludesCanonical(
		PR_J2B2_ACTIVE_ENTRY.newSlug
	);

	const preflight = evaluateSlugPreflight(rows, {
		databaseIdentity: maskDatabaseIdentity(connectionString),
		activeOldUrlStatus,
		activeNewUrlStatus,
		sitemapCanonicalIncluded,
	});

	const preview = buildSlugBackfillPreview(rows);
	const outDir = path.join(process.cwd(), 'docs/audits');
	fs.mkdirSync(outDir, { recursive: true });
	const csvPath = path.join(outDir, 'pr-j2b2-slug-preview.csv');
	const header = [
		'id',
		'status',
		'current_slug',
		'proposed_slug',
		'collision',
		'public_before',
		'public_after',
		'old_url_status',
		'new_url_status',
		'canonical_url',
		'sitemap_included',
		'redirect_required',
		'manual_review',
		'reason',
	];
	const lines = [
		header.join(','),
		...preview.map((row) =>
			[
				row.id,
				row.status,
				row.currentSlug,
				row.proposedSlug,
				row.collision,
				row.publicBefore,
				row.publicAfter,
				row.oldUrlStatus,
				row.newUrlStatus,
				row.canonicalUrl,
				row.sitemapIncluded,
				row.redirectRequired,
				row.manualReview,
				row.reason,
			]
				.map(csvEscape)
				.join(',')
		),
	];
	fs.writeFileSync(csvPath, `${lines.join('\n')}\n`);

	console.log(
		JSON.stringify(
			{
				ready: preflight.ready,
				databaseIdentity: preflight.databaseIdentity,
				total: preflight.total,
				active: preflight.active,
				archived: preflight.archived,
				manifestCount: preflight.manifestCount,
				missingIds: preflight.missingManifestIds,
				slugMismatchIds: preflight.slugMismatchIds,
				statusMismatchIds: preflight.statusMismatchIds,
				newSlugCollisionIds: preflight.newSlugCollisionIds,
				activeOldUrlStatus: preflight.activeOldUrlStatus,
				activeNewUrlStatus: preflight.activeNewUrlStatus,
				sitemapCanonicalIncluded: preflight.sitemapCanonicalIncluded,
				activeRedirectConfigured: preflight.activeRedirectConfigured,
				previewRows: preview.length,
				csvPath,
			},
			null,
			2
		)
	);

	if (!preflight.ready) {
		process.exitCode = 1;
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
