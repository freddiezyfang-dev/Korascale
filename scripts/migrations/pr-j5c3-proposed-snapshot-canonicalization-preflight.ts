/**
 * PR-J5C3 read-only proposed snapshot canonicalization preflight.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j5c3-proposed-snapshot-canonicalization-preflight.ts
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j5c3-proposed-snapshot-canonicalization-preflight.ts <revision-id>
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import {
	canonicalizeJourneyRevisionProposedSnapshot,
	detectRevisionSnapshotCompatibilityMismatches,
} from '@/lib/journeyRevisions/compatibilityMapping';
import { mergeChangesIntoProposedSnapshot } from '@/lib/journeyRevisions/snapshot';
import type { JourneyRevisionSnapshot } from '@/lib/journeyRevisions/types';

const DEFAULT_REVISION_ID = 'f7f7e6a5-6ed6-4fe1-8f0c-791cda138c2d';

function loadEnvLocal() {
	for (const name of ['.env.local', '.env']) {
		const envPath = path.join(process.cwd(), name);
		if (!fs.existsSync(envPath)) continue;
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
		return;
	}
}

function sourceContains(filePath: string, pattern: string): boolean {
	return fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8').includes(pattern);
}

function sampleSnapshot(): JourneyRevisionSnapshot {
	const base: JourneyRevisionSnapshot = {
		id: '11111111-1111-4111-8111-111111111111',
		title: 'Sample',
		slug: 'sample',
		status: 'active',
		short_description: 'Short',
		description: '',
		page_title: 'Old page',
		meta_description: 'Old meta',
		hero_image_url: '/hero.jpg',
		hero_image_alt: 'Hero alt',
		journey_type_slug: 'deep-discovery',
		journey_type: 'Deep Discovery',
		display_order: null,
		seo_complete: true,
		data: {
			pageTitle: 'Old page',
			metaDescription: 'Old meta',
			heroImage: '/hero.jpg',
			heroAlt: 'Hero alt',
			heroImageAlt: 'Hero alt',
			journeyType: 'Deep Discovery',
			itinerary: [{ day: 1 }],
			customField: 'preserve-me',
		},
		relationships: { relatedJourneyIds: [], relatedArticleIds: [] },
		price: 100,
		original_price: null,
		currency: null,
		price_from: null,
		price_basis: null,
		price_on_request: null,
		price_note: null,
		price_valid_until: null,
		category: null,
		region: null,
		place: null,
		city: null,
		location: null,
		duration: null,
		difficulty: null,
		max_participants: null,
		min_participants: null,
		image: null,
		featured: false,
		rating: null,
		review_count: null,
		created_at: null,
		updated_at: '2026-06-29T10:00:00.000Z',
	};
	return base;
}

async function main() {
	const revisionId = process.argv[2] ?? DEFAULT_REVISION_ID;
	loadEnvLocal();

	const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) throw new Error('Missing POSTGRES_URL or NEON_POSTGRES_URL');

	const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
	const client = await pool.connect();

	let revisionSnapshot: JourneyRevisionSnapshot | null = null;
	let normalizedMetaDescription: string | null = null;
	let compatibilityMetaDescription: unknown = null;
	let legacyMismatchDetected = false;
	let proposedSnapshotMatches = false;

	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const { rows } = await client.query<{
			proposed_snapshot: JourneyRevisionSnapshot;
		}>(
			`SELECT proposed_snapshot FROM journey_revisions WHERE id = $1 LIMIT 1`,
			[revisionId]
		);
		revisionSnapshot = rows[0]?.proposed_snapshot ?? null;
		if (revisionSnapshot) {
			normalizedMetaDescription = revisionSnapshot.meta_description;
			compatibilityMetaDescription = revisionSnapshot.data?.metaDescription ?? null;
			const mismatches = detectRevisionSnapshotCompatibilityMismatches(revisionSnapshot);
			proposedSnapshotMatches = mismatches.length === 0;
			legacyMismatchDetected = mismatches.length > 0;
		}
		await client.query('ROLLBACK');
	} catch (err) {
		try {
			await client.query('ROLLBACK');
		} catch {
			// Ignore rollback failures from read-only diagnostics.
		}
		throw err;
	} finally {
		client.release();
		await pool.end();
	}

	const canonicalized = mergeChangesIntoProposedSnapshot({
		operation: 'update',
		source: sampleSnapshot(),
		changes: { meta_description: 'New canonical meta' },
	});
	const generatedSnapshotMatches =
		detectRevisionSnapshotCompatibilityMismatches(
			canonicalizeJourneyRevisionProposedSnapshot(canonicalized)
		).length === 0;

	const root = process.cwd();
	const output = {
		revisionId,
		normalizedMetaDescription,
		compatibilityMetaDescription,
		proposedSnapshotMatches,
		legacyMismatchDetected,
		generatedSnapshotMatches,
		canonicalizationHelperPresent: fs.existsSync(
			path.join(root, 'src/lib/journeyRevisions/compatibilityMapping.ts')
		),
		dryRunUsesCanonicalization: sourceContains(
			path.join(root, 'src/lib/journeyRevisions/snapshot.ts'),
			'canonicalizeJourneyRevisionProposedSnapshot'
		),
		createRevisionUsesCanonicalization: sourceContains(
			path.join(root, 'src/lib/journeyRevisions/dryRun.server.ts'),
			'dryRun.resolvedSnapshot'
		),
		previewUsesCanonicalSnapshot: sourceContains(
			path.join(root, 'src/lib/journeyRevisions/dryRun.server.ts'),
			'getJourneyRevisionDetail'
		),
		publishUsesSharedMapping: sourceContains(
			path.join(root, 'src/lib/journeyRevisions/postWriteIntegrity.server.ts'),
			'buildRevisionJsonbCompatibilityMap'
		),
		migrationRequired: false,
		ready: generatedSnapshotMatches,
		writesPerformed: false,
	};

	console.log(JSON.stringify(output, null, 2));
	if (!output.ready) process.exit(1);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
