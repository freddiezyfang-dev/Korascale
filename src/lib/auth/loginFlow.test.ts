import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
	query: vi.fn(),
}));

vi.mock('next/headers', () => ({
	cookies: vi.fn(),
}));

import { cookies } from 'next/headers';

import { query } from '@/lib/db';

import { ADMIN_SESSION_COOKIE, createAdminSession, hashSessionToken } from './session.server';
import { POST as loginPost } from '@/app/api/auth/login/route';
import { POST as logoutPost } from '@/app/api/auth/logout/route';
import { GET as sessionGet } from '@/app/api/auth/session/route';
import { hashPassword } from './password.server';

const adminRow = {
	id: 'admin-uuid',
	email: 'admin@korascale.com',
	name: 'Admin',
	role: 'admin',
	password_hash: '',
};

function jsonRequest(body: unknown, origin = 'http://localhost:3001') {
	return new NextRequest('http://localhost:3001/api/auth/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			origin,
			host: 'localhost:3001',
			'x-forwarded-for': '127.0.0.1',
		},
		body: JSON.stringify(body),
	});
}

describe('admin auth login flow (PR-SEC-1A)', () => {
	const cookieJar = new Map<string, string>();
	let rawSessionToken = '';

	beforeEach(async () => {
		vi.clearAllMocks();
		vi.stubEnv('NODE_ENV', 'development');
		cookieJar.clear();
		rawSessionToken = '';

		const password = 'integration-test-password-12';
		adminRow.password_hash = hashPassword(password);

		vi.mocked(cookies).mockImplementation(async () => ({
			get: (name: string) => {
				const value = cookieJar.get(name);
				return value ? { name, value } : undefined;
			},
			set: (name: string, value: string, options?: { maxAge?: number }) => {
				if (options?.maxAge === 0 || !value) {
					cookieJar.delete(name);
					return;
				}
				cookieJar.set(name, value);
				if (name === ADMIN_SESSION_COOKIE) {
					rawSessionToken = value;
				}
			},
		}) as never);

		vi.mocked(query).mockImplementation(async (sql: string, _params?: unknown[]) => {
			if (sql.includes('FROM admin_login_attempts') && sql.includes('SELECT blocked_until')) {
				return { rows: [] } as never;
			}
			if (sql.includes('DELETE FROM admin_login_attempts')) {
				return { rows: [] } as never;
			}
			if (sql.includes('INSERT INTO admin_login_attempts')) {
				return { rows: [] } as never;
			}
			if (sql.includes('UPDATE admin_login_attempts')) {
				return { rows: [] } as never;
			}
			if (sql.includes('FROM users') && sql.includes('LOWER(email)')) {
				return { rows: [adminRow] } as never;
			}
			if (sql.includes('INSERT INTO admin_sessions')) {
				return { rows: [] } as never;
			}
			if (sql.includes('INNER JOIN users u ON u.id = s.user_id')) {
				return {
					rows: [
						{
							...adminRow,
							expires_at: new Date(Date.now() + 60_000).toISOString(),
							revoked_at: null,
							last_used_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
						},
					],
				} as never;
			}
			if (sql.includes('UPDATE admin_sessions SET last_used_at')) {
				return { rows: [] } as never;
			}
			if (sql.includes('UPDATE admin_sessions') && sql.includes('revoked_at')) {
				return { rows: [] } as never;
			}
			if (sql.includes('UPDATE admin_sessions SET revoked_at')) {
				return { rows: [] } as never;
			}
			return { rows: [] } as never;
		});
	});

	it('logs in, restores session from HttpOnly cookie, and logs out', async () => {
		const loginResponse = await loginPost(
			jsonRequest({ email: 'admin@korascale.com', password: 'integration-test-password-12' })
		);
		expect(loginResponse.status).toBe(200);
		const loginBody = await loginResponse.json();
		expect(loginBody.authenticated).toBe(true);
		expect(loginBody.user.isAdmin).toBe(true);
		expect(JSON.stringify(loginBody)).not.toMatch(/token|password_hash/i);
		expect(cookieJar.has(ADMIN_SESSION_COOKIE)).toBe(true);
		expect(rawSessionToken.length).toBeGreaterThan(20);

		const sessionResponse = await sessionGet();
		const sessionBody = await sessionResponse.json();
		expect(sessionBody.authenticated).toBe(true);
		expect(sessionBody.user.isAdmin).toBe(true);

		const logoutResponse = await logoutPost(
			new NextRequest('http://localhost:3001/api/auth/logout', {
				method: 'POST',
				headers: { origin: 'http://localhost:3001', host: 'localhost:3001' },
			})
		);
		expect(logoutResponse.status).toBe(200);
		expect(cookieJar.has(ADMIN_SESSION_COOKIE)).toBe(false);

		const sessionAfterLogout = await sessionGet();
		const afterBody = await sessionAfterLogout.json();
		expect(afterBody.authenticated).toBe(false);
	});

	it('stores only token hash in database when creating session', async () => {
		const token = await createAdminSession('admin-uuid');
		const insertCall = vi
			.mocked(query)
			.mock.calls.find(([sql]) => sql.includes('INSERT INTO admin_sessions'));
		expect(insertCall).toBeTruthy();
		const tokenHash = insertCall?.[1]?.[1];
		expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
		expect(tokenHash).not.toBe(token);
		expect(hashSessionToken(token)).toBe(tokenHash);
	});
});
