import { assertDatabaseIdentityMatchesEnvironment, resolveDatabaseIdentity } from './databaseIdentity';
import type { CodexJourneyEnvironment } from './environment';
import { getCodexActorIdentity, isCodexWriteEnabled } from './environment';

export class CodexJourneyGuardError extends Error {
	constructor(
		message: string,
		public readonly code: string
	) {
		super(message);
		this.name = 'CodexJourneyGuardError';
	}
}

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertUuid(value: string, field: string): void {
	if (!UUID_RE.test(value.trim())) {
		throw new CodexJourneyGuardError(`Invalid UUID for ${field}.`, 'INVALID_UUID');
	}
}

export function assertRevisionConfirmMatch(revisionId: string, confirmId: string): void {
	assertUuid(revisionId, 'revision');
	assertUuid(confirmId, 'confirm');
	if (revisionId.trim() !== confirmId.trim()) {
		throw new CodexJourneyGuardError(
			'--revision and --confirm must be the same revision ID.',
			'REVISION_CONFIRM_MISMATCH'
		);
	}
}

export function assertWriteCommandAllowed(command: 'create' | 'publish' | 'reject'): void {
	if (!isCodexWriteEnabled()) {
		throw new CodexJourneyGuardError(
			`Write command "${command}" requires CODEX_JOURNEY_REVISION_WRITE_ENABLED=true.`,
			'CODEX_WRITE_NOT_ENABLED'
		);
	}
}

export function assertProductionConfirmed(confirmProduction?: boolean): void {
	if (confirmProduction !== true) {
		throw new CodexJourneyGuardError(
			'Production write commands require --confirm-production.',
			'PRODUCTION_CONFIRM_REQUIRED'
		);
	}
}

export type CodexWriteGuardInput = {
	command: 'create' | 'publish' | 'reject';
	environment: CodexJourneyEnvironment;
	confirmProduction?: boolean;
	revisionId?: string;
	confirmId?: string;
};

/** Fail-closed gate for all Codex write commands. */
export function assertCodexWriteAllowed(input: CodexWriteGuardInput): string {
	assertWriteCommandAllowed(input.command);
	assertDatabaseIdentityMatchesEnvironment(
		input.environment,
		resolveDatabaseIdentity()
	);

	if (input.environment === 'production') {
		assertProductionConfirmed(input.confirmProduction);
		getCodexActorIdentity('production');
	}

	if (input.command === 'publish' || input.command === 'reject') {
		if (!input.revisionId || !input.confirmId) {
			throw new CodexJourneyGuardError(
				`${input.command} requires --revision and --confirm with the same revision ID.`,
				'REVISION_CONFIRM_REQUIRED'
			);
		}
		assertRevisionConfirmMatch(input.revisionId, input.confirmId);
	}

	return getCodexActorIdentity(input.environment);
}

/** @deprecated Use assertCodexWriteAllowed — kept for tests migrating from publish-only guard. */
export function assertProductionPublishAllowed(input: {
	environment: CodexJourneyEnvironment;
	revisionId: string;
	confirmId: string;
	confirmProduction?: boolean;
}): void {
	assertCodexWriteAllowed({
		command: 'publish',
		environment: input.environment,
		confirmProduction: input.confirmProduction,
		revisionId: input.revisionId,
		confirmId: input.confirmId,
	});
}

export function assertNoDirectJourneySql(sql: string): void {
	const normalized = sql.trim().toLowerCase();
	if (/\b(update|insert|delete|alter|drop|truncate)\b[\s\S]*\bjourneys\b/.test(normalized)) {
		throw new CodexJourneyGuardError(
			'Direct SQL writes to journeys are forbidden for Codex.',
			'DIRECT_JOURNEY_WRITE_FORBIDDEN'
		);
	}
}

const FORBIDDEN_OPERATOR_IMPORTS = [
	'@/lib/databaseClient',
	'databaseClient',
	'withTransaction',
	'insertJourneyRevision',
	'markJourneyRevisionPublished',
	'markJourneyRevisionRejected',
	'supersedePendingJourneyRevisions',
	'buildJourneyCreateMutation',
	'buildJourneyUpdateMutation',
] as const;

export function scanCodexModuleForForbiddenPatterns(source: string, label: string): string[] {
	const violations: string[] = [];
	for (const pattern of FORBIDDEN_OPERATOR_IMPORTS) {
		if (source.includes(pattern)) {
			violations.push(`${label}: forbidden reference "${pattern}"`);
		}
	}
	if (/\bUPDATE\s+journeys\b/i.test(source) || /\bINSERT\s+INTO\s+journeys\b/i.test(source)) {
		violations.push(`${label}: direct journeys SQL`);
	}
	return violations;
}
