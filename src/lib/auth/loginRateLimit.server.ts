import { createHash } from 'node:crypto';

import type { NextRequest } from 'next/server';

import { query } from '@/lib/db';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const BLOCK_MS = 30 * 60 * 1000;

export type RateLimitCheckResult =
	| { allowed: true }
	| { allowed: false; reason: 'blocked' | 'misconfigured' };

export function getRateLimitPepper(): string | null {
	const pepper = process.env.ADMIN_AUTH_RATE_LIMIT_PEPPER?.trim();
	if (pepper) return pepper;

	if (process.env.NODE_ENV === 'test') {
		return 'test-rate-limit-pepper';
	}

	const isDeployed = Boolean(process.env.VERCEL_ENV);
	if (!isDeployed && process.env.NODE_ENV !== 'production') {
		return (
			process.env.ADMIN_AUTH_RATE_LIMIT_PEPPER_DEV?.trim() ||
			'dev-rate-limit-pepper-not-for-production'
		);
	}

	return null;
}

export function assertRateLimitConfigured(): RateLimitCheckResult {
	if (getRateLimitPepper()) {
		return { allowed: true };
	}
	return { allowed: false, reason: 'misconfigured' };
}

export function hashRateLimitValue(value: string, pepper: string): string {
	return createHash('sha256').update(`${pepper}:${value}`).digest('hex');
}

export function normalizeLoginIdentifier(email: string): string {
	return email.trim().toLowerCase();
}

export function getClientIp(request: NextRequest): string {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		const first = forwarded.split(',')[0]?.trim();
		if (first) return first;
	}

	const realIp = request.headers.get('x-real-ip')?.trim();
	if (realIp) return realIp;

	return 'unknown';
}

export async function isLoginRateLimited(
	email: string,
	clientIp: string
): Promise<RateLimitCheckResult> {
	const config = assertRateLimitConfigured();
	if (!config.allowed) return config;

	const pepper = getRateLimitPepper()!;
	const identifierHash = hashRateLimitValue(normalizeLoginIdentifier(email), pepper);
	const ipHash = hashRateLimitValue(clientIp, pepper);

	const { rows } = await query<{ blocked_until: string | null }>(
		`
    SELECT blocked_until
    FROM admin_login_attempts
    WHERE identifier_hash = $1 AND ip_hash = $2
    LIMIT 1
  `,
		[identifierHash, ipHash]
	);

	if (rows.length === 0) return { allowed: true };

	const blockedUntil = rows[0].blocked_until;
	if (blockedUntil && new Date(blockedUntil).getTime() > Date.now()) {
		return { allowed: false, reason: 'blocked' };
	}

	return { allowed: true };
}

export async function recordFailedLoginAttempt(email: string, clientIp: string): Promise<void> {
	const pepper = getRateLimitPepper();
	if (!pepper) return;

	const identifierHash = hashRateLimitValue(normalizeLoginIdentifier(email), pepper);
	const ipHash = hashRateLimitValue(clientIp, pepper);
	const now = new Date();

	const { rows } = await query<{
		failed_count: number;
		window_started_at: string;
	}>(
		`
    SELECT failed_count, window_started_at
    FROM admin_login_attempts
    WHERE identifier_hash = $1 AND ip_hash = $2
    LIMIT 1
  `,
		[identifierHash, ipHash]
	);

	if (rows.length === 0) {
		await query(
			`
      INSERT INTO admin_login_attempts (identifier_hash, ip_hash, failed_count, window_started_at, updated_at)
      VALUES ($1, $2, 1, $3, $3)
    `,
			[identifierHash, ipHash, now.toISOString()]
		);
		return;
	}

	const row = rows[0];
	const windowStartedAt = new Date(row.window_started_at);
	const windowExpired = now.getTime() - windowStartedAt.getTime() > WINDOW_MS;
	const failedCount = windowExpired ? 1 : row.failed_count + 1;
	const windowStart = windowExpired ? now : windowStartedAt;
	const blockedUntil =
		failedCount >= MAX_FAILURES ? new Date(now.getTime() + BLOCK_MS) : null;

	await query(
		`
    UPDATE admin_login_attempts
    SET failed_count = $3,
        window_started_at = $4,
        blocked_until = $5,
        updated_at = $6
    WHERE identifier_hash = $1 AND ip_hash = $2
  `,
		[
			identifierHash,
			ipHash,
			failedCount,
			windowStart.toISOString(),
			blockedUntil?.toISOString() ?? null,
			now.toISOString(),
		]
	);
}

export async function clearLoginAttempts(email: string, clientIp: string): Promise<void> {
	const pepper = getRateLimitPepper();
	if (!pepper) return;

	const identifierHash = hashRateLimitValue(normalizeLoginIdentifier(email), pepper);
	const ipHash = hashRateLimitValue(clientIp, pepper);

	await query(`DELETE FROM admin_login_attempts WHERE identifier_hash = $1 AND ip_hash = $2`, [
		identifierHash,
		ipHash,
	]);
}
