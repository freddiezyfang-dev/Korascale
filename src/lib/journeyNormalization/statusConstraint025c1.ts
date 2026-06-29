/** PR-J2C2 / 025C1 — Journey status constraint readiness (status only). */

export const JOURNEYS_STATUS_CHECK_NAME = 'journeys_status_check';

export const EXPECTED_JOURNEY_TOTAL = 83;
export const EXPECTED_ACTIVE_COUNT = 24;
export const EXPECTED_ARCHIVED_COUNT = 59;
export const EXPECTED_DRAFT_COUNT = 0;

export const CANONICAL_JOURNEY_STATUSES = ['draft', 'active', 'archived'] as const;

export const EXPECTED_STATUS_COLUMN_DEFAULT = 'draft';

export function normalizeConstraintDefinition(def: string): string {
	return def.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Accepts PostgreSQL-normalized CHECK definitions for status IN (draft, active, archived). */
export function isExpectedJourneysStatusCheckDefinition(def: string | null | undefined): boolean {
	if (!def) return false;
	const normalized = normalizeConstraintDefinition(def);
	if (!normalized.startsWith('check')) return false;
	if (!normalized.includes('status')) return false;
	for (const status of CANONICAL_JOURNEY_STATUSES) {
		if (!normalized.includes(status)) return false;
	}
	return true;
}

export function migrationSqlModifiesJourneyRows(sql: string): boolean {
	const stripped = sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n');
	return /\bUPDATE\s+journeys\b/i.test(stripped) || /\bDELETE\s+FROM\s+journeys\b/i.test(stripped);
}

export function migration025c1ForwardHasRequiredGuards(sql: string): boolean {
	return (
		sql.includes('journeys_status_check') &&
		sql.includes("SET NOT NULL") &&
		sql.includes("CHECK (status IN ('draft', 'active', 'archived'))") &&
		!migrationSqlModifiesJourneyRows(sql)
	);
}

export function migration025c1RollbackOnlyDropsConstraint(sql: string): boolean {
	const stripped = sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n');
	return (
		stripped.includes('DROP CONSTRAINT') &&
		stripped.includes('DROP NOT NULL') &&
		!migrationSqlModifiesJourneyRows(sql)
	);
}

export type StatusConstraintPreflightInput = {
	databaseIdentity: string;
	total: number;
	active: number;
	archived: number;
	draft: number;
	inactive: number;
	nullStatus: number;
	illegalStatuses: number;
	statusDefault: string | null;
	statusNullable: boolean;
	existingConstraint: boolean;
	existingConstraintDefinition: string | null;
	publicStrictModeReady: boolean;
	allWritersReady: boolean;
};

export type StatusConstraintPreflightResult = StatusConstraintPreflightInput & {
	ready: boolean;
	alreadyApplied: boolean;
	noActionRequired: boolean;
	blockers: string[];
};

export function evaluateStatusConstraintPreflight(
	input: StatusConstraintPreflightInput
): StatusConstraintPreflightResult {
	const blockers: string[] = [];

	const constraintMatches = isExpectedJourneysStatusCheckDefinition(
		input.existingConstraintDefinition
	);
	const alreadyApplied =
		!input.statusNullable && input.existingConstraint && constraintMatches;

	if (alreadyApplied) {
		return {
			...input,
			ready: false,
			alreadyApplied: true,
			noActionRequired: true,
			blockers: [],
		};
	}

	if (input.total !== EXPECTED_JOURNEY_TOTAL) {
		blockers.push(`total=${input.total}, expected ${EXPECTED_JOURNEY_TOTAL}`);
	}
	if (input.active !== EXPECTED_ACTIVE_COUNT) {
		blockers.push(`active=${input.active}, expected ${EXPECTED_ACTIVE_COUNT}`);
	}
	if (input.archived !== EXPECTED_ARCHIVED_COUNT) {
		blockers.push(`archived=${input.archived}, expected ${EXPECTED_ARCHIVED_COUNT}`);
	}
	if (input.draft !== EXPECTED_DRAFT_COUNT) {
		blockers.push(`draft=${input.draft}, expected ${EXPECTED_DRAFT_COUNT}`);
	}
	if (input.inactive !== 0) blockers.push(`inactive=${input.inactive}, expected 0`);
	if (input.nullStatus !== 0) blockers.push(`nullStatus=${input.nullStatus}, expected 0`);
	if (input.illegalStatuses !== 0) {
		blockers.push(`illegalStatuses=${input.illegalStatuses}, expected 0`);
	}
	if (!input.publicStrictModeReady) {
		blockers.push('public strict mode not deployed (expected status = active only)');
	}
	if (!input.allWritersReady) {
		blockers.push('journey writers may still emit inactive or NULL status');
	}
	if (!statusDefaultIsDraft(input.statusDefault)) {
		blockers.push(`status default is not draft: ${input.statusDefault ?? 'NULL'}`);
	}
	if (input.existingConstraint && !constraintMatches) {
		blockers.push(
			`journeys_status_check exists with unexpected definition: ${input.existingConstraintDefinition}`
		);
	}
	if (!input.statusNullable && !input.existingConstraint) {
		blockers.push('status is NOT NULL but journeys_status_check is missing');
	}

	return {
		...input,
		ready: blockers.length === 0,
		alreadyApplied: false,
		noActionRequired: false,
		blockers,
	};
}

export function statusDefaultIsDraft(columnDefault: string | null | undefined): boolean {
	if (columnDefault == null) return false;
	const normalized = columnDefault.toLowerCase();
	return normalized.includes('draft');
}

export function maskDatabaseIdentity(connectionString: string | undefined): string {
	if (!connectionString) return 'unknown';
	try {
		const url = new URL(connectionString.replace(/^postgres(ql)?:\/\//, 'https://'));
		const host = url.hostname;
		const db = url.pathname.replace(/^\//, '') || 'unknown';
		return `${host}/${db}`;
	} catch {
		return 'masked';
	}
}
