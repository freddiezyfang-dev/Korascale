/**
 * PR-J3B read-only publish integrity preflight.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j3b-publish-integrity-preflight.ts
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import {
	evaluateJourneyContentCompleteness,
	resolveCanonicalPublishSlug,
	validateJourneyPublishReadiness,
	type JourneyPublishCandidate,
} from '@/lib/journeyNormalization/journeyPublishIntegrity';
import { publishCandidateFromDbRow } from '@/lib/journeyNormalization/journeyPublishIntegrity.server';
import type { JourneyRowLike } from '@/lib/journeyNormalization/types';

const RUNTIME_WRITERS = [
	'src/app/api/journeys/route.ts',
	'src/app/api/journeys/[id]/route.ts',
];

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

function runtimeWritersUseCentralGate(): boolean {
	const mutationUsesGate = fs
		.readFileSync(
			path.join(process.cwd(), 'src/lib/journeyNormalization/journeyAdminMutation.server.ts'),
			'utf8'
		)
		.includes('buildCreatePublishCandidate');
	return RUNTIME_WRITERS.every((file) => {
		const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
		return (
			source.includes('runJourneyPublishIntegrityGate') &&
			source.includes('journeyPublishIntegrity') &&
			source.includes('journeyAdminMutation')
		);
	}) && mutationUsesGate;
}

function clientSeoCompleteIgnored(): boolean {
	const mutationSource = fs.readFileSync(
		path.join(process.cwd(), 'src/lib/journeyNormalization/journeyAdminMutation.server.ts'),
		'utf8'
	);
	const routesPass = RUNTIME_WRITERS.every((file) => {
		const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
		return source.includes('publishGate.seoComplete');
	});
	return (
		mutationSource.includes('seo_complete') &&
		mutationSource.includes('STRIPPED_MUTATION_KEYS') &&
		routesPass
	);
}

async function main() {
	const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) throw new Error('Missing POSTGRES_URL');

	const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
	const client = await pool.connect();
	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const result = await client.query(`
      SELECT id, slug, status, title, short_description, page_title, meta_description,
             hero_image_url, hero_image_alt, journey_type_slug, seo_complete
      FROM journeys
      ORDER BY slug
    `);
		await client.query('ROLLBACK');

		const rows = result.rows as JourneyRowLike[];
		const activeRows = rows.filter((r) => String(r.status).trim().toLowerCase() === 'active');
		const archivedRows = rows.filter((r) => String(r.status).trim().toLowerCase() === 'archived');

		const slugOwners = new Map<string, string[]>();
		for (const row of rows) {
			const canonical = resolveCanonicalPublishSlug(row.slug);
			if (!canonical) continue;
			const list = slugOwners.get(canonical) ?? [];
			list.push(String(row.id));
			slugOwners.set(canonical, list);
		}

		const slugConflictIds = [
			...new Set(
				[...slugOwners.entries()]
					.filter(([, ids]) => ids.length > 1)
					.flatMap(([, ids]) => ids)
			),
		];

		const invalidActiveIds: string[] = [];
		const missingFieldById: Record<string, string[]> = {};
		const invalidSlugIds: string[] = [];
		const invalidJourneyTypeIds: string[] = [];
		let activeContentComplete = 0;
		let activePublishReady = 0;
		let activeSeoCompleteTrue = 0;

		for (const row of activeRows) {
			const candidate = publishCandidateFromDbRow(row as Record<string, unknown>);
			const content = evaluateJourneyContentCompleteness(candidate);
			const canonical = resolveCanonicalPublishSlug(candidate.slug);
			const slugConflict = canonical
				? (slugOwners.get(canonical)?.length ?? 0) > 1
				: false;
			const readiness = validateJourneyPublishReadiness(candidate, { slugConflict });

			if (content.contentComplete) activeContentComplete += 1;
			if (readiness.publishReady) activePublishReady += 1;
			if (row.seo_complete === true) activeSeoCompleteTrue += 1;

			if (!readiness.publishReady) {
				invalidActiveIds.push(String(row.id));
				missingFieldById[String(row.id)] = readiness.errors.map((e) => e.field);
			}
			if (readiness.errors.some((e) => e.field === 'slug' && e.code !== 'SLUG_CONFLICT')) {
				invalidSlugIds.push(String(row.id));
			}
			if (readiness.errors.some((e) => e.code === 'INVALID_JOURNEY_TYPE')) {
				invalidJourneyTypeIds.push(String(row.id));
			}
		}

		const runtimeWritersAudited = RUNTIME_WRITERS.length;
		const runtimeWritersUsingCentralGate = runtimeWritersUseCentralGate()
			? RUNTIME_WRITERS.length
			: 0;

		const output = {
			phase: 'PR-J3B',
			readOnly: true,
			total: rows.length,
			active: activeRows.length,
			archived: archivedRows.length,
			activeContentComplete,
			activePublishReady,
			activeSeoCompleteTrue,
			invalidActiveIds,
			missingFieldById,
			invalidSlugIds,
			slugConflictIds,
			invalidJourneyTypeIds,
			runtimeWritersAudited,
			runtimeWritersUsingCentralGate,
			clientSeoCompleteIgnored: clientSeoCompleteIgnored(),
			ready:
				activeRows.length === 24 &&
				activeContentComplete === 24 &&
				activePublishReady === 24 &&
				invalidActiveIds.length === 0 &&
				slugConflictIds.length === 0 &&
				runtimeWritersUsingCentralGate === runtimeWritersAudited &&
				clientSeoCompleteIgnored(),
		};

		console.log(JSON.stringify(output, null, 2));
		if (!output.ready) process.exit(1);
	} finally {
		client.release();
		await pool.end();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
