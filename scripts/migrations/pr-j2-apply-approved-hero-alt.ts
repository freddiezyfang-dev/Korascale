/**
 * Apply approved hero alt text from pr-j2-hero-alt-manual-review.csv.
 *
 * Uses target-aware dual-write (JSONB + hero_image_alt column when flag on).
 * Does not skip column sync when JSONB already matches.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2-apply-approved-hero-alt.ts
 *   JOURNEY_NORMALIZATION_COLUMNS=1 npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j2-apply-approved-hero-alt.ts --apply
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import {
	buildHeroAltApplyUpdatePlan,
	createHeroAltApplySummary,
	evaluateHeroAltApplyTargets,
	recordHeroAltApplyEvaluation,
} from '@/lib/journeyNormalization/heroAltApply';
import {
	assertJourneySqlSafeForCurrentSchema,
	isJourneyExpandedColumnsEnabled,
} from '@/lib/journeyNormalization/write';

type CsvRow = {
	id: string;
	slug: string;
	proposed_alt: string;
	reviewer_decision: string;
};

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

function parseCsv(content: string): CsvRow[] {
	const lines = content.split(/\r?\n/).filter((line) => line.trim());
	if (lines.length < 2) return [];
	const header = lines[0].split(',');
	const idx = (name: string) => header.indexOf(name);

	return lines.slice(1).map((line) => {
		const cols = parseCsvLine(line);
		return {
			id: cols[idx('id')] ?? '',
			slug: cols[idx('slug')] ?? '',
			proposed_alt: cols[idx('proposed_alt')] ?? '',
			reviewer_decision: cols[idx('reviewer_decision')] ?? '',
		};
	});
}

function parseCsvLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (inQuotes) {
			if (ch === '"') {
				if (line[i + 1] === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = false;
				}
			} else {
				current += ch;
			}
		} else if (ch === '"') {
			inQuotes = true;
		} else if (ch === ',') {
			result.push(current);
			current = '';
		} else {
			current += ch;
		}
	}
	result.push(current);
	return result;
}

function redactConnectionTarget(connectionString: string | undefined) {
	if (!connectionString) return null;
	try {
		const url = new URL(connectionString);
		return {
			host: url.hostname,
			database: url.pathname.replace(/^\//, ''),
			user: url.username || '(none)',
			isPooler: url.hostname.includes('-pooler'),
		};
	} catch {
		return { error: 'invalid connection string' };
	}
}

loadEnvLocal();

async function main() {
	const apply = process.argv.includes('--apply');
	const csvPath = path.join(
		process.cwd(),
		'docs/audits/pr-j2-hero-alt-manual-review.csv'
	);
	if (!fs.existsSync(csvPath)) {
		throw new Error(`Missing CSV: ${csvPath}`);
	}

	const rows = parseCsv(fs.readFileSync(csvPath, 'utf8')).filter(
		(row) =>
			row.id &&
			row.proposed_alt.trim() &&
			row.reviewer_decision.trim().toLowerCase() === 'approved'
	);

	if (rows.length === 0) {
		throw new Error('No approved rows found in CSV');
	}

	const connectionString =
		process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) {
		throw new Error('Missing POSTGRES_URL / NEON_POSTGRES_URL');
	}

	const pool = new Pool({
		connectionString,
		ssl: { rejectUnauthorized: false },
	});

	const summary = createHeroAltApplySummary();
	const expandedColumnsEnabled = isJourneyExpandedColumnsEnabled();
	const envSource = process.env.NEON_POSTGRES_URL
		? 'NEON_POSTGRES_URL'
		: 'POSTGRES_URL';

	try {
		const identity = await pool.query(`
			SELECT
				current_database() AS database_name,
				current_user AS database_user,
				inet_server_addr() AS server_address
		`);
		const columnCheck = await pool.query(`
			SELECT EXISTS (
				SELECT 1
				FROM information_schema.columns
				WHERE table_name = 'journeys'
					AND column_name = 'hero_image_alt'
			) AS column_exists
		`);
		const heroImageAltColumnExists = Boolean(
			columnCheck.rows[0]?.column_exists
		);

		if (expandedColumnsEnabled && !heroImageAltColumnExists) {
			throw new Error(
				'JOURNEY_NORMALIZATION_COLUMNS=1 but hero_image_alt column is missing. Run 025A first.'
			);
		}

		console.log(
			`Mode: ${apply ? 'APPLY' : 'DRY-RUN'} | rows: ${rows.length} | env: ${envSource} | target: ${JSON.stringify(redactConnectionTarget(connectionString))} | db: ${JSON.stringify(identity.rows[0])} | JOURNEY_NORMALIZATION_COLUMNS=${process.env.JOURNEY_NORMALIZATION_COLUMNS ?? 'off'} | hero_image_alt column: ${heroImageAltColumnExists ? 'yes' : 'no'}`
		);

		for (const row of rows) {
			const selectSql = heroImageAltColumnExists
				? 'SELECT id, slug, data, hero_image_alt FROM journeys WHERE id = $1'
				: 'SELECT id, slug, data FROM journeys WHERE id = $1';

			const { rows: dbRows } = await pool.query(selectSql, [row.id]);
			if (dbRows.length === 0) {
				console.log(`MISSING ${row.slug} (${row.id})`);
				summary.missing++;
				continue;
			}

			const dbRow = dbRows[0];
			const existingData = (dbRow.data as Record<string, unknown>) || {};
			const plan = buildHeroAltApplyUpdatePlan({
				existingData,
				columnHeroImageAlt: heroImageAltColumnExists
					? dbRow.hero_image_alt
					: undefined,
				approvedAlt: row.proposed_alt.trim(),
				expandedColumnsEnabled,
			});

			if (!plan) {
				const evaluation = evaluateHeroAltApplyTargets({
					approvedAlt: row.proposed_alt.trim(),
					dataHeroAlt: existingData.heroAlt,
					dataHeroImageAlt: existingData.heroImageAlt,
					columnHeroImageAlt: heroImageAltColumnExists
						? dbRow.hero_image_alt
						: undefined,
					expandedColumnsEnabled,
				});
				recordHeroAltApplyEvaluation(summary, evaluation);
				console.log(`SKIP (fully synced) ${row.slug}`);
				continue;
			}

			recordHeroAltApplyEvaluation(summary, plan.evaluation);

			const sql = `${plan.sql}`.replace(
				/WHERE id = \$\d+$/,
				`WHERE id = $${plan.values.length + 1}`
			);
			const values = [...plan.values, row.id];
			assertJourneySqlSafeForCurrentSchema(sql);

			console.log(
				`${apply ? 'UPDATE' : 'WOULD UPDATE'} ${row.slug} [${plan.reason}] jsonb=${plan.evaluation.jsonbMatches ? 'matched' : 'missing'} column=${plan.evaluation.columnMatches ? 'matched' : 'missing'}`
			);

			if (apply) {
				await pool.query(sql, values);
				if (plan.evaluation.updateJsonb) summary.updatedJsonb++;
				if (plan.evaluation.updateColumn) summary.updatedColumn++;
			}
		}
	} finally {
		await pool.end();
	}

	console.log(
		`Done. jsonbMatched=${summary.jsonbMatched} columnMatched=${summary.columnMatched} columnMissing=${summary.columnMissing} wouldUpdate=${summary.wouldUpdate} skipped=${summary.skipped} missing=${summary.missing}`
	);
	if (apply) {
		console.log(
			`Applied. updatedJsonb=${summary.updatedJsonb} updatedColumn=${summary.updatedColumn} errors=0`
		);
	} else {
		console.log('Re-run with --apply to write changes.');
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
