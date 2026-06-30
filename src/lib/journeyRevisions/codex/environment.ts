import { CodexJourneyGuardError } from './guards';

export type CodexJourneyEnvironment = 'local' | 'preview' | 'production';

export function resolveCodexEnvironment(value?: string): CodexJourneyEnvironment {
	const normalized = String(value ?? process.env.CODEX_JOURNEY_ENVIRONMENT ?? 'local')
		.trim()
		.toLowerCase();
	if (normalized === 'production' || normalized === 'prod') return 'production';
	if (normalized === 'preview' || normalized === 'staging' || normalized === 'stage') {
		return 'preview';
	}
	return 'local';
}

/** Only strict string `true` authorizes create / publish / reject. */
export function isCodexWriteEnabled(): boolean {
	return process.env.CODEX_JOURNEY_REVISION_WRITE_ENABLED === 'true';
}

/**
 * Production: JOURNEY_REVISION_ACTOR required (no fallback).
 * Non-production: JOURNEY_REVISION_ACTOR, else explicit test actor for authorized dev use.
 */
export function getCodexActorIdentity(environment: CodexJourneyEnvironment): string {
	if (environment === 'production') {
		const actor = process.env.JOURNEY_REVISION_ACTOR?.trim();
		if (!actor) {
			throw new CodexJourneyGuardError(
				'Production write commands require JOURNEY_REVISION_ACTOR.',
				'PRODUCTION_ACTOR_REQUIRED'
			);
		}
		return actor;
	}

	const actor = (
		process.env.JOURNEY_REVISION_ACTOR ??
		process.env.JOURNEY_REVISION_CREATED_BY ??
		'codex-test'
	).trim();
	if (!actor) {
		throw new CodexJourneyGuardError(
			'JOURNEY_REVISION_ACTOR or JOURNEY_REVISION_CREATED_BY must not be empty.',
			'ACTOR_REQUIRED'
		);
	}
	return actor;
}

export function getApiBaseUrl(): string {
	return (process.env.JOURNEY_REVISION_API_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
}
