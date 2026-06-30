/**
 * PR-J5C1 read-only preflight: opaque wall-clock UTC concurrency encoding.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j5c1-source-timestamp-precision-preflight.ts
 */
import { loadEnvConfig } from '@next/env';
import pg from 'pg';

import {
	CANONICAL_ENCODING_ZONE,
	JOURNEY_CONCURRENCY_TOKEN_PRECISION,
	JOURNEY_TIMESTAMP_SEMANTIC,
	journeyRevisionSourceMatchSql,
	journeyUpdatedAtTokenSql,
	revisionSourceUpdatedAtTokenSql,
} from '../../src/lib/journeyRevisions/concurrencyTimestamp';
import { getJourneyRevisionDetail } from '../../src/lib/journeyRevisions/dryRun.server';

loadEnvConfig(process.cwd());

const REGRESSION_REVISION_ID =
	process.env.J5C1_REVISION_ID ?? 'c1984a68-3a69-4b1f-ab55-17d12747efc3';

const EXPECTED_JOURNEY_TOKEN = '2026-06-29T08:17:01.919Z';
const EXPECTED_REVISION_TOKEN = '2026-06-29T00:17:01.919Z';

async function main() {
	const connectionString =
		process.env.POSTGRES_URL ?? process.env.NEON_POSTGRES_URL ?? process.env.DATABASE_URL;
	if (!connectionString) {
		console.error('POSTGRES_URL, NEON_POSTGRES_URL, or DATABASE_URL is required');
		process.exit(1);
	}

	const client = new pg.Client({ connectionString });
	await client.connect();

	try {
		const tzResult = await client.query('SHOW TIME ZONE');
		const databaseSessionTimezone =
			tzResult.rows[0]?.TimeZone ?? tzResult.rows[0]?.timezone ?? 'unknown';

		const rowResult = await client.query<{
			revision_id: string;
			journey_id: string;
			journey_slug: string;
			raw_journey_wall_clock: string;
			raw_revision_source_updated_at: string;
			canonical_journey_token: string;
			canonical_revision_token: string;
			db_source_timestamp_matches: boolean;
		}>(
			`
			SELECT
				jr.id AS revision_id,
				jr.journey_id,
				j.slug AS journey_slug,
				j.updated_at::text AS raw_journey_wall_clock,
				jr.source_updated_at::text AS raw_revision_source_updated_at,
				${journeyUpdatedAtTokenSql('j.updated_at')} AS canonical_journey_token,
				${revisionSourceUpdatedAtTokenSql('jr.source_updated_at')} AS canonical_revision_token,
				(${journeyRevisionSourceMatchSql('j.updated_at', 'jr.source_updated_at')}) AS db_source_timestamp_matches
			FROM journey_revisions jr
			INNER JOIN journeys j ON j.id = jr.journey_id
			WHERE jr.id = $1
			`,
			[REGRESSION_REVISION_ID]
		);

		if (rowResult.rowCount === 0) {
			console.error(`Revision not found: ${REGRESSION_REVISION_ID}`);
			process.exit(1);
		}

		const row = rowResult.rows[0]!;

		let domainSourceTimestampMatches: boolean | null = null;
		try {
			const detail = await getJourneyRevisionDetail(REGRESSION_REVISION_ID);
			domainSourceTimestampMatches = detail?.sourceTimestampMatches ?? null;
		} catch (err) {
			console.warn('Domain detail unavailable (non-fatal for SQL-only preflight):', err);
		}

		const legacyRevisionEncodingDetected =
			row.canonical_journey_token !== row.canonical_revision_token;
		const recreateRequired =
			legacyRevisionEncodingDetected && row.db_source_timestamp_matches === false;

		const precisionLossDetected =
			row.raw_journey_wall_clock.includes('.919') &&
			!row.canonical_journey_token.includes('.919');

		const report = {
			revisionId: row.revision_id,
			journeyId: row.journey_id,
			journeySlug: row.journey_slug,
			journeyTimestampSemantic: JOURNEY_TIMESTAMP_SEMANTIC,
			canonicalEncodingZone: CANONICAL_ENCODING_ZONE,
			databaseSessionTimezone,
			legacyTimezoneAssumptionRemoved: true,
			rawJourneyWallClock: row.raw_journey_wall_clock,
			rawRevisionSourceUpdatedAt: row.raw_revision_source_updated_at,
			canonicalJourneyToken: row.canonical_journey_token,
			canonicalRevisionToken: row.canonical_revision_token,
			expectedJourneyToken: EXPECTED_JOURNEY_TOKEN,
			expectedRevisionToken: EXPECTED_REVISION_TOKEN,
			dbSourceTimestampMatches: row.db_source_timestamp_matches,
			domainSourceTimestampMatches,
			legacyRevisionEncodingDetected,
			recreateRequired,
			recreateDecision: recreateRequired ? 'RECREATE_REQUIRED_AFTER_DEPLOYMENT' : null,
			precisionLossDetected,
			precisionPolicy: JOURNEY_CONCURRENCY_TOKEN_PRECISION,
			migrationRequired: false,
			writesPerformed: false,
		};

		console.log(JSON.stringify(report, null, 2));

		const failed =
			row.canonical_journey_token !== EXPECTED_JOURNEY_TOKEN ||
			row.canonical_revision_token !== EXPECTED_REVISION_TOKEN ||
			row.db_source_timestamp_matches !== false ||
			!legacyRevisionEncodingDetected ||
			!recreateRequired ||
			precisionLossDetected ||
			(domainSourceTimestampMatches !== null && domainSourceTimestampMatches !== false);

		if (failed) {
			process.exit(1);
		}
	} finally {
		await client.end();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
