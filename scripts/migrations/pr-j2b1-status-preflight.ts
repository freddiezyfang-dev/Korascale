/**
 * PR-J2B1 read-only status backfill preflight.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2b1-status-preflight.ts
 *
 * Does NOT execute UPDATE/INSERT/DELETE. No --apply mode.
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import {
	buildStatusBackfillPreview,
	evaluateStatusPreflight,
	maskDatabaseIdentity,
} from '@/lib/journeyNormalization/statusBackfill';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';

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
	const preflight = evaluateStatusPreflight(rows, {
		databaseIdentity: maskDatabaseIdentity(connectionString),
	});

	const preview = buildStatusBackfillPreview(rows);
	const outDir = path.join(process.cwd(), 'docs/audits');
	fs.mkdirSync(outDir, { recursive: true });
	const csvPath = path.join(outDir, 'pr-j2b1-status-preview.csv');
	const header = [
		'id',
		'slug',
		'title',
		'current_status',
		'proposed_status',
		'public_before',
		'public_after',
		'manual_review',
		'reason',
	];
	const lines = [
		header.join(','),
		...preview.map((row) =>
			[
				row.id,
				row.slug,
				row.title,
				row.currentStatus,
				row.proposedStatus,
				row.publicBefore,
				row.publicAfter,
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
				inactive: preflight.inactive,
				archived: preflight.archived,
				manifestCount: preflight.manifestCount,
				missingIds: preflight.missingManifestIds,
				statusMismatchIds: preflight.statusMismatchManifestIds,
				duplicateIds: preflight.duplicateManifestIds,
				publicJourneyCount: preflight.publicJourneyCount,
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
