import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
	query: vi.fn(),
}));

import { query } from '@/lib/db';

import {
	clearLoginAttempts,
	getRateLimitPepper,
	hashRateLimitValue,
	isLoginRateLimited,
	recordFailedLoginAttempt,
} from './loginRateLimit.server';

describe('loginRateLimit.server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv('NODE_ENV', 'test');
	});

	it('hashes identifiers with pepper without storing plaintext', () => {
		const pepper = getRateLimitPepper();
		expect(pepper).toBeTruthy();
		const hash = hashRateLimitValue('admin@example.com', pepper!);
		expect(hash).toMatch(/^[a-f0-9]{64}$/);
		expect(hash).not.toContain('admin@example.com');
	});

	it('allows login when no attempt record exists', async () => {
		vi.mocked(query).mockResolvedValueOnce({ rows: [] } as never);
		await expect(isLoginRateLimited('admin@example.com', '127.0.0.1')).resolves.toEqual({
			allowed: true,
		});
	});

	it('blocks when blocked_until is in the future', async () => {
		vi.mocked(query).mockResolvedValueOnce({
			rows: [{ blocked_until: new Date(Date.now() + 60_000).toISOString() }],
		} as never);
		await expect(isLoginRateLimited('admin@example.com', '127.0.0.1')).resolves.toEqual({
			allowed: false,
			reason: 'blocked',
		});
	});

	it('records failed attempts and blocks after threshold', async () => {
		vi.mocked(query)
			.mockResolvedValueOnce({
				rows: [{ failed_count: 4, window_started_at: new Date().toISOString() }],
			} as never)
			.mockResolvedValueOnce({ rows: [] } as never);

		await recordFailedLoginAttempt('admin@example.com', '127.0.0.1');
		const updateCall = vi.mocked(query).mock.calls.find(([sql]) => sql.includes('UPDATE admin_login_attempts'));
		expect(updateCall).toBeTruthy();
		expect(String(updateCall?.[1]?.[4])).not.toBeNull();
	});

	it('clears attempts after successful login', async () => {
		vi.mocked(query).mockResolvedValueOnce({ rows: [] } as never);
		await clearLoginAttempts('admin@example.com', '127.0.0.1');
		expect(query).toHaveBeenCalledWith(
			expect.stringContaining('DELETE FROM admin_login_attempts'),
			expect.any(Array)
		);
	});

	it('fails closed in production without pepper', () => {
		vi.stubEnv('NODE_ENV', 'production');
		vi.stubEnv('VERCEL_ENV', 'production');
		delete process.env.ADMIN_AUTH_RATE_LIMIT_PEPPER;
		expect(getRateLimitPepper()).toBeNull();
	});

	it('fails closed on Vercel preview without pepper', () => {
		vi.unstubAllEnvs();
		vi.stubEnv('NODE_ENV', 'production');
		vi.stubEnv('VERCEL_ENV', 'preview');
		delete process.env.ADMIN_AUTH_RATE_LIMIT_PEPPER;
		expect(getRateLimitPepper()).toBeNull();
	});
});
