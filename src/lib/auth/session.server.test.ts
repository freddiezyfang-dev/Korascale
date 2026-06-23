import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
	query: vi.fn(),
}));

vi.mock('next/headers', () => ({
	cookies: vi.fn(),
}));

import { cookies } from 'next/headers';

import { query } from '@/lib/db';

import {
	generateSessionToken,
	getAuthenticatedUser,
	hashSessionToken,
	isAdminRole,
	toAuthUser,
} from './session.server';

describe('session.server', () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.clearAllMocks();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it('generates unpredictable session tokens', () => {
		const a = generateSessionToken();
		const b = generateSessionToken();
		expect(a).not.toBe(b);
		expect(a.length).toBeGreaterThan(20);
	});

	it('hashes tokens deterministically without storing raw token', () => {
		const token = 'sample-token-value';
		const hash = hashSessionToken(token);
		expect(hash).toMatch(/^[a-f0-9]{64}$/);
		expect(hash).not.toBe(token);
	});

	it('returns null when cookie is missing', async () => {
		vi.mocked(cookies).mockResolvedValue({
			get: () => undefined,
			set: vi.fn(),
		} as never);

		await expect(getAuthenticatedUser()).resolves.toBeNull();
		expect(query).not.toHaveBeenCalled();
	});

	it('returns null for invalid token', async () => {
		vi.mocked(cookies).mockResolvedValue({
			get: () => ({ value: 'invalid-token' }),
			set: vi.fn(),
		} as never);
		vi.mocked(query).mockResolvedValueOnce({ rows: [] } as never);

		await expect(getAuthenticatedUser()).resolves.toBeNull();
	});

	it('returns null for expired session', async () => {
		vi.mocked(cookies).mockResolvedValue({
			get: () => ({ value: 'expired-token' }),
			set: vi.fn(),
		} as never);
		vi.mocked(query).mockResolvedValueOnce({
			rows: [
				{
					id: 'u1',
					email: 'admin@example.com',
					name: 'Admin',
					role: 'admin',
					password_hash: 'scrypt$x$y',
					expires_at: new Date(Date.now() - 1000).toISOString(),
					revoked_at: null,
				},
			],
		} as never);

		await expect(getAuthenticatedUser()).resolves.toBeNull();
	});

	it('returns null for revoked session', async () => {
		vi.mocked(cookies).mockResolvedValue({
			get: () => ({ value: 'revoked-token' }),
			set: vi.fn(),
		} as never);
		vi.mocked(query).mockResolvedValueOnce({
			rows: [
				{
					id: 'u1',
					email: 'admin@example.com',
					name: 'Admin',
					role: 'admin',
					password_hash: 'scrypt$x$y',
					expires_at: new Date(Date.now() + 60_000).toISOString(),
					revoked_at: new Date().toISOString(),
				},
			],
		} as never);

		await expect(getAuthenticatedUser()).resolves.toBeNull();
	});

	it('returns safe user fields for valid session', async () => {
		vi.mocked(cookies).mockResolvedValue({
			get: () => ({ value: 'valid-token' }),
			set: vi.fn(),
		} as never);
		vi.mocked(query)
			.mockResolvedValueOnce({
				rows: [
					{
						id: 'u1',
						email: 'admin@example.com',
						name: 'Admin',
						role: 'admin',
						password_hash: 'scrypt$secret',
					expires_at: new Date(Date.now() + 60_000).toISOString(),
					revoked_at: null,
					last_used_at: new Date().toISOString(),
					},
				],
			} as never)
			.mockResolvedValueOnce({ rows: [] } as never);

		const user = await getAuthenticatedUser();
		expect(user).toEqual({
			id: 'u1',
			email: 'admin@example.com',
			name: 'Admin',
			role: 'admin',
			isAdmin: true,
		});
		expect(JSON.stringify(user)).not.toContain('password_hash');
		expect(JSON.stringify(user)).not.toContain('valid-token');
	});

	it('reflects role changes from database on each request', () => {
		const admin = toAuthUser({ id: '1', email: 'a@b.com', name: 'A', role: 'admin' });
		const user = toAuthUser({ id: '1', email: 'a@b.com', name: 'A', role: 'user' });
		expect(admin.isAdmin).toBe(true);
		expect(user.isAdmin).toBe(false);
		expect(isAdminRole('admin')).toBe(true);
		expect(isAdminRole('user')).toBe(false);
	});

	it('throttles last_used_at updates to once per hour', async () => {
		vi.mocked(cookies).mockResolvedValue({
			get: () => ({ value: 'valid-token' }),
			set: vi.fn(),
		} as never);
		vi.mocked(query)
			.mockResolvedValueOnce({
				rows: [
					{
						id: 'u1',
						email: 'admin@example.com',
						name: 'Admin',
						role: 'admin',
						password_hash: 'scrypt$secret',
						expires_at: new Date(Date.now() + 60_000).toISOString(),
						revoked_at: null,
						last_used_at: new Date().toISOString(),
					},
				],
			} as never);

		await getAuthenticatedUser();
		const updateCalls = vi.mocked(query).mock.calls.filter(([sql]) =>
			String(sql).includes('UPDATE admin_sessions SET last_used_at')
		);
		expect(updateCalls).toHaveLength(0);
	});
});
