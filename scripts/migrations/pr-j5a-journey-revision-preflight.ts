/**
 * PR-J5A read-only Journey revision infrastructure preflight.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j5a-journey-revision-preflight.ts
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

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

const MIGRATION_PATH = path.join(
	process.cwd(),
	'database/migrations/pending/027_journey_revisions.sql'
);
const ROLLBACK_PATH = path.join(
	process.cwd(),
	'database/migrations/pending/027_journey_revisions.rollback.sql'
);

const EXPECTED_TABLE_MARKERS = [
	'CREATE TABLE IF NOT EXISTS journey_revisions',
	'journey_revisions_operation_check',
	'journey_revisions_status_check',
	'journey_revisions_journey_id_check',
	'journey_revisions_status_idx',
	'journey_revisions_journey_pending_review_idx',
	'ON DELETE RESTRICT',
	'update_journey_revisions_updated_at',
];

function readMigrationMarkers(filePath: string): boolean {
	if (!fs.existsSync(filePath)) return false;
	const sql = fs.readFileSync(filePath, 'utf8');
	return EXPECTED_TABLE_MARKERS.every((marker) => sql.includes(marker));
}

function authReuseReady(): boolean {
	const adminPath = path.join(process.cwd(), 'src/lib/auth/requireAdmin.server.ts');
	const source = fs.readFileSync(adminPath, 'utf8');
	return (
		source.includes('requireAdmin') &&
		source.includes('enforceAdminWrite') &&
		source.includes('enforceAdminRead')
	);
}

function publishGateReady(): boolean {
	const gatePath = path.join(
		process.cwd(),
		'src/lib/journeyNormalization/journeyPublishIntegrityGate.server.ts'
	);
	const revisionValidation = path.join(process.cwd(), 'src/lib/journeyRevisions/validation.ts');
	return (
		fs.existsSync(gatePath) &&
		fs.readFileSync(revisionValidation, 'utf8').includes('runJourneyPublishIntegrityGate')
	);
}

function slugUniquenessReady(): boolean {
	const pathFile = path.join(
		process.cwd(),
		'src/lib/journeyNormalization/journeySlugUniqueness.server.ts'
	);
	return fs.existsSync(pathFile);
}

function priceFieldsFrozen(): boolean {
	const validation = fs.readFileSync(
		path.join(process.cwd(), 'src/lib/journeyRevisions/validation.ts'),
		'utf8'
	);
	const priceProtection = fs.readFileSync(
		path.join(process.cwd(), 'src/lib/journeyRevisions/priceProtection.ts'),
		'utf8'
	);
	const types = fs.readFileSync(
		path.join(process.cwd(), 'src/lib/journeyRevisions/types.ts'),
		'utf8'
	);
	const errors = fs.readFileSync(
		path.join(process.cwd(), 'src/lib/journeyRevisions/errors.ts'),
		'utf8'
	);
	const migration = fs.readFileSync(MIGRATION_PATH, 'utf8');
	return (
		errors.includes('JOURNEY_REVISION_PRICE_FIELDS_LOCKED') &&
		types.includes('LOCKED_PRICE_SNAPSHOT_KEYS') &&
		validation.includes('compareProtectedPriceValues') &&
		priceProtection.includes('data.availableDates') &&
		priceProtection.includes("'pricing'") &&
		!migration.match(/\bprice_basis\s*=/i) &&
		!migration.includes('025c2')
	);
}

function nestedPriceProtectionReady(): boolean {
	return (
		fs.existsSync(path.join(process.cwd(), 'docs/audits/pr-j5a-journey-price-protection.md')) &&
		fs.existsSync(path.join(process.cwd(), 'src/lib/journeyRevisions/priceProtection.ts'))
	);
}

function authRouteCoverageComplete(): boolean {
	const authTest = path.join(
		process.cwd(),
		'src/app/api/admin/journey-revisions/journey-revisions-auth.test.ts'
	);
	if (!fs.existsSync(authTest)) return false;
	const source = fs.readFileSync(authTest, 'utf8');
	return (
		source.includes('dry-run') &&
		source.includes('journey-revisions') &&
		source.includes('publish') &&
		source.includes('reject') &&
		source.includes('anonymous returns 401')
	);
}

function createPublishLinkageReady(): boolean {
	const publish = fs.readFileSync(
		path.join(process.cwd(), 'src/lib/journeyRevisions/publish.server.ts'),
		'utf8'
	);
	const repo = fs.readFileSync(
		path.join(process.cwd(), 'src/lib/journeyRevisions/repository.server.ts'),
		'utf8'
	);
	const migration = fs.readFileSync(MIGRATION_PATH, 'utf8');
	return (
		publish.includes('publishedJourneyId') &&
		repo.includes('COALESCE($3, journey_id)') &&
		migration.includes("operation = 'create' AND status = 'published' AND journey_id IS NOT NULL")
	);
}

function createSupersedeSafetyReady(): boolean {
	const dryRun = fs.readFileSync(
		path.join(process.cwd(), 'src/lib/journeyRevisions/dryRun.server.ts'),
		'utf8'
	);
	const repo = fs.readFileSync(
		path.join(process.cwd(), 'src/lib/journeyRevisions/repository.server.ts'),
		'utf8'
	);
	return (
		dryRun.includes('if (journeyId)') &&
		repo.includes('WHERE journey_id = $1 AND status = \'pending_review\'')
	);
}

function rollbackDestructiveGuardReady(): boolean {
	const rollback = fs.readFileSync(ROLLBACK_PATH, 'utf8');
	return (
		rollback.includes('row_count > 0') &&
		!rollback.includes('CASCADE') &&
		!rollback.includes('article_revisions')
	);
}

function relationshipSchemaResolved(): boolean {
	return fs.existsSync(
		path.join(process.cwd(), 'docs/audits/pr-j5a-journey-relationship-schema.md')
	);
}

function journeyRevisionModulesReady(): boolean {
	const dir = path.join(process.cwd(), 'src/lib/journeyRevisions');
	const required = [
		'types.ts',
		'errors.ts',
		'snapshot.ts',
		'validation.ts',
		'stateMachine.ts',
		'repository.server.ts',
		'dryRun.server.ts',
		'publish.server.ts',
		'priceProtection.ts',
		'allowlist.ts',
		'operationRules.ts',
	];
	return required.every((file) => fs.existsSync(path.join(dir, file)));
}

async function main() {
	const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) throw new Error('Missing POSTGRES_URL');

	const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
	const client = await pool.connect();

	let databaseIdentity = 'unknown';
	let journeysTableExists = false;
	let journeyRevisionTableExists = false;
	let articleRevisionSystemDetected = false;
	let tableDefinitionConsistent: boolean | null = null;

	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const idRes = await client.query(`SELECT current_database() AS db, inet_server_addr()::text AS host`);
		databaseIdentity = `${idRes.rows[0]?.host ?? 'local'}/${idRes.rows[0]?.db}`;

		const journeysRes = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'journeys'
      ) AS exists
    `);
		journeysTableExists = journeysRes.rows[0]?.exists === true;

		const revRes = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'journey_revisions'
      ) AS exists
    `);
		journeyRevisionTableExists = revRes.rows[0]?.exists === true;

		const articleRevRes = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'article_revisions'
      ) AS exists
    `);
		articleRevisionSystemDetected = articleRevRes.rows[0]?.exists === true;

		if (journeyRevisionTableExists) {
			const cols = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'journey_revisions'
      `);
			const names = new Set(cols.rows.map((r) => String(r.column_name)));
			tableDefinitionConsistent = [
				'operation',
				'proposed_snapshot',
				'source_snapshot',
				'source_updated_at',
				'change_summary',
				'validation_report',
				'review_metadata',
				'published_by',
				'rejected_at',
			].every((c) => names.has(c));
		}

		await client.query('ROLLBACK');
	} finally {
		client.release();
		await pool.end();
	}

	const migrationDefinitionValid = readMigrationMarkers(MIGRATION_PATH);
	const rollbackDefinitionValid =
		fs.existsSync(ROLLBACK_PATH) &&
		fs.readFileSync(ROLLBACK_PATH, 'utf8').includes('journey_revisions');

	const blockers: string[] = [];
	if (!journeysTableExists) blockers.push('journeys table missing');
	if (!migrationDefinitionValid) blockers.push('027 migration definition incomplete');
	if (!rollbackDefinitionValid) blockers.push('027 rollback definition missing/invalid');
	if (!authReuseReady()) blockers.push('admin auth helpers not ready');
	if (!publishGateReady()) blockers.push('J3B publish gate not wired');
	if (!slugUniquenessReady()) blockers.push('J3C slug uniqueness module missing');
	if (!priceFieldsFrozen()) blockers.push('price protection not implemented');
	if (!nestedPriceProtectionReady()) blockers.push('nested price protection audit missing');
	if (!relationshipSchemaResolved()) blockers.push('relationship schema audit missing');
	if (!journeyRevisionModulesReady()) blockers.push('journeyRevisions modules incomplete');
	if (!authRouteCoverageComplete()) blockers.push('auth route coverage incomplete');
	if (!createPublishLinkageReady()) blockers.push('create publish linkage not ready');
	if (!createSupersedeSafetyReady()) blockers.push('create supersede safety not ready');
	if (!rollbackDestructiveGuardReady()) blockers.push('rollback destructive guard incomplete');

	if (journeyRevisionTableExists && tableDefinitionConsistent === false) {
		blockers.push('journey_revisions table exists but schema differs from J5A');
	}

	const alreadyApplied = journeyRevisionTableExists && tableDefinitionConsistent === true;
	const ready = blockers.length === 0 && (alreadyApplied || !journeyRevisionTableExists);
	const noActionRequired = alreadyApplied && blockers.length === 0;

	const output = {
		phase: 'PR-J5A',
		readOnly: true,
		databaseIdentity,
		journeysTableExists,
		journeyRevisionTableExists,
		articleRevisionSystemDetected,
		authReuseReady: authReuseReady(),
		authRouteCoverageComplete: authRouteCoverageComplete(),
		publishGateReady: publishGateReady(),
		slugUniquenessReady: slugUniquenessReady(),
		priceFieldsFrozen: priceFieldsFrozen(),
		nestedPriceProtectionReady: nestedPriceProtectionReady(),
		relationshipSchemaResolved: relationshipSchemaResolved(),
		createPublishLinkageReady: createPublishLinkageReady(),
		createSupersedeSafetyReady: createSupersedeSafetyReady(),
		rollbackDestructiveGuardReady: rollbackDestructiveGuardReady(),
		migrationDefinitionValid,
		rollbackDefinitionValid,
		journeyRevisionModulesReady: journeyRevisionModulesReady(),
		tableDefinitionConsistent,
		ready,
		alreadyApplied,
		noActionRequired,
		blockers,
	};

	console.log(JSON.stringify(output, null, 2));
	if (!ready) process.exit(1);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
