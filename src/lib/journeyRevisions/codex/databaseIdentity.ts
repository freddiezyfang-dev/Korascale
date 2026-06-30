import { maskDatabaseIdentity } from '@/lib/journeyNormalization/statusBackfill';

import type { CodexJourneyEnvironment } from './environment';
import { CodexJourneyGuardError } from './guards';

/** Official Production Neon pooler host (see journey-normalization-migration-ledger). */
export const OFFICIAL_PRODUCTION_NEON_HOSTS = [
	'ep-red-sunset-adgu8hlv-pooler.c-2.us-east-1.aws.neon.tech',
	'ep-red-sunset-adgu8hlv.c-2.us-east-1.aws.neon.tech',
] as const;

export const OFFICIAL_PRODUCTION_DATABASE = 'neondb';

const BLOCKED_NON_PRODUCTION_HOST_PATTERNS = [
	/vercel-storage/i,
	/localhost/i,
	/127\.0\.0\.1/i,
	/::1/,
	/test/i,
	/staging/i,
] as const;

export type ResolvedDatabaseIdentity = {
	host: string;
	database: string;
	masked: string;
	isOfficialProduction: boolean;
};

function getConnectionString(): string {
	return process.env.NEON_POSTGRES_URL ?? process.env.POSTGRES_URL ?? '';
}

export function resolveDatabaseIdentity(connectionString?: string): ResolvedDatabaseIdentity {
	const raw = connectionString ?? getConnectionString();
	const masked = maskDatabaseIdentity(raw || undefined);
	if (!raw) {
		return {
			host: 'unknown',
			database: 'unknown',
			masked: 'missing',
			isOfficialProduction: false,
		};
	}
	try {
		const url = new URL(raw);
		const host = url.hostname || 'unknown';
		const database = url.pathname.replace(/^\//, '') || 'unknown';
		const isOfficialProduction =
			OFFICIAL_PRODUCTION_NEON_HOSTS.includes(
				host as (typeof OFFICIAL_PRODUCTION_NEON_HOSTS)[number]
			) && database === OFFICIAL_PRODUCTION_DATABASE;
		return {
			host,
			database,
			masked: maskProductionHost(host, database),
			isOfficialProduction,
		};
	} catch {
		return {
			host: 'invalid',
			database: 'invalid',
			masked: 'invalid-connection-string',
			isOfficialProduction: false,
		};
	}
}

/** Mask host for safe output — never include credentials. */
export function maskProductionHost(host: string, database: string): string {
	if (!host || host === 'unknown') return `${host}/${database}`;
	const parts = host.split('.');
	const prefix = parts[0] ?? host;
	const suffix = parts.includes('neon') ? '…neon.tech' : '…';
	return `${prefix.slice(0, Math.min(prefix.length, 14))}${suffix}/${database}`;
}

function isBlockedNonProductionHost(host: string): boolean {
	return BLOCKED_NON_PRODUCTION_HOST_PATTERNS.some((pattern) => pattern.test(host));
}

export function assertDatabaseIdentityMatchesEnvironment(
	environment: CodexJourneyEnvironment,
	identity: ResolvedDatabaseIdentity = resolveDatabaseIdentity()
): void {
	if (!identity.host || identity.host === 'unknown' || identity.masked === 'missing') {
		throw new CodexJourneyGuardError(
			'Database is not configured for Codex journey revision commands.',
			'DATABASE_IDENTITY_MISSING'
		);
	}

	if (environment === 'production') {
		if (!identity.isOfficialProduction) {
			throw new CodexJourneyGuardError(
				`Production commands require official Production database identity; got ${identity.masked}.`,
				'PRODUCTION_DATABASE_MISMATCH'
			);
		}
		return;
	}

	if (identity.isOfficialProduction) {
		throw new CodexJourneyGuardError(
			`${environment} commands must not target Production database (${identity.masked}).`,
			'PRODUCTION_DATABASE_FORBIDDEN'
		);
	}

	if (environment === 'local' && isBlockedNonProductionHost(identity.host) === false) {
		// local may use neon preview branches — only block official production (handled above)
	}

	if (identity.database !== OFFICIAL_PRODUCTION_DATABASE && environment === 'preview') {
		// preview branches may use non-neondb names — allow unless official production host
	}
}
