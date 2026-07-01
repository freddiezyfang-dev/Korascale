/**
 * PR-J5C2 read-only Journey Revision dual-write preflight.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j5c2-journey-revision-dual-write-preflight.ts
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import { evaluatePublicSourcePreflight } from '@/lib/journeyNormalization/publicSourcePreflight';
import { buildPublicStatusWhereClause } from '@/lib/journeyNormalization/status';
import { maskDatabaseIdentity } from '@/lib/journeyNormalization/statusConstraint025c1';
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

loadEnvLocal();

function readSource(relativePath: string): string {
	return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function revisionPublishWritesNormalizedColumns(): boolean {
	const publish = readSource('src/lib/journeyRevisions/publish.server.ts');
	const mutation = readSource('src/lib/journeyRevisions/revisionPublishMutation.server.ts');
	return (
		publish.includes('REVISION_PUBLISH_MUTATION_OPTIONS') &&
		mutation.includes("normalizedColumnWritePolicy: 'always'")
	);
}

function revisionPublishDependsOnNormalizationFlag(): boolean {
	const publish = readSource('src/lib/journeyRevisions/publish.server.ts');
	const mutation = readSource('src/lib/journeyRevisions/revisionPublishMutation.server.ts');
	const combined = `${publish}\n${mutation}`;
	if (combined.includes('JOURNEY_NORMALIZATION_COLUMNS')) return true;
	if (combined.includes("normalizedColumnWritePolicy: 'env-flag'")) return true;
	if (combined.includes('isJourneyExpandedColumnsEnabled')) return true;
	return false;
}

function postWriteIntegrityCheckPresent(): boolean {
	const publish = readSource('src/lib/journeyRevisions/publish.server.ts');
	const integrity = readSource('src/lib/journeyRevisions/postWriteIntegrity.server.ts');
	const errors = readSource('src/lib/journeyRevisions/errors.ts');
	return (
		publish.includes('verifyRevisionPublishPostWriteIntegrity') &&
		publish.includes('readJourneyRowById') &&
		integrity.includes('verifyRevisionPublishPostWriteIntegrity') &&
		errors.includes('JOURNEY_REVISION_POST_WRITE_INTEGRITY_FAILED')
	);
}

function seoCompleteServerComputed(): boolean {
	const publish = readSource('src/lib/journeyRevisions/publish.server.ts');
	const integrity = readSource('src/lib/journeyRevisions/postWriteIntegrity.server.ts');
	return (
		publish.includes('runJourneyPublishIntegrityGate') &&
		publish.includes('seoComplete = gate.ok ? gate.seoComplete : false') &&
		!publish.includes('proposed.seo_complete') &&
		integrity.includes('seo_complete')
	);
}

function priceProtectionPresent(): boolean {
	const integrity = readSource('src/lib/journeyRevisions/postWriteIntegrity.server.ts');
	const priceProtection = readSource('src/lib/journeyRevisions/priceProtection.ts');
	return (
		integrity.includes('compareProtectedPriceValues') &&
		integrity.includes('PRICE_FIELD_CHANGED') &&
		priceProtection.includes('LOCKED_PRICE_SNAPSHOT_KEYS')
	);
}

function revisionPublishWritesCompatibilityJson(): boolean {
	const snapshot = readSource('src/lib/journeyRevisions/snapshot.ts');
	const compatibility = readSource('src/lib/journeyRevisions/compatibilityMapping.ts');
	const adminMutation = readSource('src/lib/journeyNormalization/journeyAdminMutation.server.ts');
	const integrity = readSource('src/lib/journeyRevisions/postWriteIntegrity.server.ts');
	return (
		snapshot.includes('buildRevisionJsonbCompatibilityMap(snapshot)') &&
		compatibility.includes('metaDescription: snapshot.meta_description') &&
		adminMutation.includes('jsonbUpdates.metaDescription') &&
		integrity.includes('buildRevisionJsonbCompatibilityMap(proposed)')
	);
}

function docsNoLongerRequireNormalizationFlag(): boolean {
	const paths = [
		'.agents/skills/journey-editor/SKILL.md',
		'docs/workflows/codex-journey-editor-contract.md',
		'docs/workflows/codex-journey-editor-usage.md',
	];
	const forbidden = /need\s+`?JOURNEY_NORMALIZATION_COLUMNS=1`?/i;
	return paths.every((relativePath) => {
		if (!fs.existsSync(path.join(process.cwd(), relativePath))) return false;
		const source = readSource(relativePath);
		return (
			!forbidden.test(source) &&
			source.includes('normalized columns authoritatively')
		);
	});
}

async function main() {
	const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) throw new Error('Missing POSTGRES_URL');

	const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
	const client = await pool.connect();

	let activeJourneyCount = 0;
	let normalizedJsonMismatchIds: string[] = [];

	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const result = await client.query(`
      SELECT id, slug, status, title, short_description, image, journey_type,
             page_title, meta_description, hero_image_url, hero_image_alt, journey_type_slug,
             seo_complete, data
      FROM journeys
      ORDER BY slug
    `);
		await client.query('ROLLBACK');

		const rows = result.rows as JourneyRowLike[];
		const evaluation = evaluatePublicSourcePreflight(rows);
		activeJourneyCount = evaluation.active;
		normalizedJsonMismatchIds = evaluation.metaDescriptionMismatchIds;
	} finally {
		client.release();
		await pool.end();
	}

	const publicSourceIsNormalizedColumns = fs.existsSync(
		path.join(process.cwd(), 'src/lib/journeyNormalization/publicNormalizedFields.ts')
	);

	const checks = {
		publicSourceIsNormalizedColumns,
		revisionPublishWritesNormalizedColumns: revisionPublishWritesNormalizedColumns(),
		revisionPublishWritesCompatibilityJson: revisionPublishWritesCompatibilityJson(),
		revisionPublishDependsOnNormalizationFlag: revisionPublishDependsOnNormalizationFlag(),
		postWriteIntegrityCheckPresent: postWriteIntegrityCheckPresent(),
		seoCompleteServerComputed: seoCompleteServerComputed(),
		priceProtectionPresent: priceProtectionPresent(),
		docsNoLongerRequireNormalizationFlag: docsNoLongerRequireNormalizationFlag(),
		currentActiveJourneyCount: activeJourneyCount,
		currentNormalizedJsonMismatchIds: normalizedJsonMismatchIds,
		migrationRequired: false,
		writesPerformed: false,
	};

	const blockers: string[] = [];
	if (!checks.revisionPublishWritesNormalizedColumns) {
		blockers.push('Revision publish path does not force normalized column writes.');
	}
	if (checks.revisionPublishDependsOnNormalizationFlag) {
		blockers.push('Revision publish path still depends on JOURNEY_NORMALIZATION_COLUMNS.');
	}
	if (!checks.postWriteIntegrityCheckPresent) {
		blockers.push('Post-write integrity verification is missing from publish path.');
	}
	if (!checks.seoCompleteServerComputed) {
		blockers.push('seo_complete is not server-computed on revision publish.');
	}
	if (!checks.priceProtectionPresent) {
		blockers.push('Price protection is missing from post-write integrity.');
	}
	if (!checks.revisionPublishWritesCompatibilityJson) {
		blockers.push('Revision publish does not sync compatibility JSONB keys.');
	}
	if (!checks.docsNoLongerRequireNormalizationFlag) {
		blockers.push('CLI/Skill docs still require JOURNEY_NORMALIZATION_COLUMNS=1.');
	}
	if (checks.currentActiveJourneyCount !== 24) {
		blockers.push(`Expected 24 active journeys, found ${checks.currentActiveJourneyCount}.`);
	}
	if (checks.currentNormalizedJsonMismatchIds.length > 0) {
		blockers.push(
			`Normalized/JSON mismatch ids present: ${checks.currentNormalizedJsonMismatchIds.join(', ')}`
		);
	}

	const output = {
		phase: 'PR-J5C2',
		readOnly: true,
		databaseIdentity: maskDatabaseIdentity(connectionString),
		publicStrictSql: buildPublicStatusWhereClause(),
		...checks,
		ready: blockers.length === 0,
		blockers,
	};

	console.log(JSON.stringify(output, null, 2));
	if (!output.ready) process.exit(1);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
