export const JOURNEY_TIMESTAMP_SEMANTIC = 'opaque_wall_clock' as const;

export const JOURNEY_CONCURRENCY_TOKEN_PRECISION = 'milliseconds' as const;

export const CANONICAL_ENCODING_ZONE = 'UTC' as const;

const CANONICAL_UTC_FORMAT = `YYYY-MM-DD"T"HH24:MI:SS.MS"Z"`;

/** DB timestamptz value for revision source_updated_at — no JS Date involved. */
export function journeySourceUpdatedAtTimestamptzSql(columnRef = 'updated_at'): string {
	return `date_trunc('milliseconds', ${columnRef}) AT TIME ZONE '${CANONICAL_ENCODING_ZONE}'`;
}

export function journeyUpdatedAtTokenSql(columnRef = 'updated_at'): string {
	return `to_char((${journeySourceUpdatedAtTimestamptzSql(columnRef)}) AT TIME ZONE '${CANONICAL_ENCODING_ZONE}', '${CANONICAL_UTC_FORMAT}')`;
}

export function revisionSourceUpdatedAtTokenSql(columnRef = 'source_updated_at'): string {
	return `to_char(date_trunc('milliseconds', ${columnRef}) AT TIME ZONE '${CANONICAL_ENCODING_ZONE}', '${CANONICAL_UTC_FORMAT}')`;
}

export function journeyRevisionSourceMatchSql(
	journeyUpdatedAtRef = 'j.updated_at',
	revisionSourceUpdatedAtRef = 'jr.source_updated_at'
): string {
	return `${journeySourceUpdatedAtTimestamptzSql(journeyUpdatedAtRef)} = date_trunc('milliseconds', ${revisionSourceUpdatedAtRef})`;
}

export function readCanonicalJourneyUpdatedAt(row: Record<string, unknown>): string | null {
	const token = row.journey_revision_source_updated_at;
	return typeof token === 'string' && token.trim() ? token.trim() : null;
}
