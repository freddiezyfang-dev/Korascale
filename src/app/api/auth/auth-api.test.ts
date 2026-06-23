import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/login.server', () => ({
	loginWithEmailPassword: vi.fn(),
	logoutCurrentSession: vi.fn(),
}));

vi.mock('@/lib/auth/session.server', () => ({
	getAuthenticatedUser: vi.fn(),
}));

import { loginWithEmailPassword, logoutCurrentSession } from '@/lib/auth/login.server';
import { getAuthenticatedUser } from '@/lib/auth/session.server';

import { POST as loginPost } from '@/app/api/auth/login/route';
import { POST as logoutPost } from '@/app/api/auth/logout/route';
import { GET as sessionGet } from '@/app/api/auth/session/route';

function jsonRequest(url: string, body: unknown, origin = 'http://localhost:3001') {
	return new NextRequest(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			origin,
			host: 'localhost:3001',
		},
		body: JSON.stringify(body),
	});
}

describe('auth API routes', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv('NODE_ENV', 'development');
	});

	describe('POST /api/auth/login', () => {
		it('returns INVALID_CREDENTIALS for bad login', async () => {
			vi.mocked(loginWithEmailPassword).mockResolvedValue({
				success: false,
				reason: 'invalid_credentials',
			});
			const response = await loginPost(
				jsonRequest('http://localhost:3001/api/auth/login', {
					email: 'admin@example.com',
					password: 'wrong',
				})
			);
			expect(response.status).toBe(401);
			const body = await response.json();
			expect(body.error).toBe('INVALID_CREDENTIALS');
		});

		it('returns safe user payload without token for successful admin login', async () => {
			vi.mocked(loginWithEmailPassword).mockResolvedValue({
				success: true,
				user: {
					id: '1',
					email: 'admin@example.com',
					name: 'Admin',
					role: 'admin',
					isAdmin: true,
				},
			});
			const response = await loginPost(
				jsonRequest('http://localhost:3001/api/auth/login', {
					email: 'admin@example.com',
					password: 'pw',
					role: 'admin',
				})
			);
			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.authenticated).toBe(true);
			expect(body.user.isAdmin).toBe(true);
			expect(JSON.stringify(body)).not.toMatch(/token|password_hash/i);
		});

		it('rejects cross-origin login writes', async () => {
			const response = await loginPost(
				jsonRequest(
					'http://localhost:3001/api/auth/login',
					{ email: 'a@b.com', password: 'x' },
					'https://evil.example'
				)
			);
			expect(response.status).toBe(403);
			expect(loginWithEmailPassword).not.toHaveBeenCalled();
		});
	});

	describe('POST /api/auth/logout', () => {
		it('clears session and returns ok', async () => {
			const response = await logoutPost(
				jsonRequest('http://localhost:3001/api/auth/logout', {})
			);
			expect(response.status).toBe(200);
			expect(logoutCurrentSession).toHaveBeenCalled();
		});
	});

	describe('GET /api/auth/session', () => {
		it('returns unauthenticated when no session', async () => {
			vi.mocked(getAuthenticatedUser).mockResolvedValue(null);
			const response = await sessionGet();
			const body = await response.json();
			expect(body.authenticated).toBe(false);
			expect(body.user).toBeNull();
		});

		it('returns admin flag from database user', async () => {
			vi.mocked(getAuthenticatedUser).mockResolvedValue({
				id: '1',
				email: 'admin@example.com',
				name: 'Admin',
				role: 'admin',
				isAdmin: true,
			});
			const response = await sessionGet();
			const body = await response.json();
			expect(body.authenticated).toBe(true);
			expect(body.user.isAdmin).toBe(true);
		});
	});
});
