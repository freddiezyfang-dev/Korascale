import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./password.server', () => ({
	verifyPassword: vi.fn(),
}));

vi.mock('./loginRateLimit.server', () => ({
	isLoginRateLimited: vi.fn(),
	recordFailedLoginAttempt: vi.fn(),
	clearLoginAttempts: vi.fn(),
}));

vi.mock('./session.server', () => ({
	clearSessionCookie: vi.fn(),
	createAdminSession: vi.fn(),
	getUserByEmail: vi.fn(),
	readSessionTokenFromCookies: vi.fn(),
	revokeSessionByToken: vi.fn(),
	setSessionCookie: vi.fn(),
	toAuthUser: vi.fn((row: { id: string; email: string; name: string | null; role: string | null }) => ({
		id: row.id,
		email: row.email,
		name: row.name ?? row.email,
		role: row.role ?? 'user',
		isAdmin: row.role === 'admin',
	})),
}));

import {
	clearLoginAttempts,
	isLoginRateLimited,
	recordFailedLoginAttempt,
} from './loginRateLimit.server';
import { verifyPassword } from './password.server';
import {
	clearSessionCookie,
	createAdminSession,
	getUserByEmail,
	readSessionTokenFromCookies,
	revokeSessionByToken,
	setSessionCookie,
} from './session.server';

import { loginWithEmailPassword, logoutCurrentSession } from './login.server';

const clientIp = '127.0.0.1';

describe('login.server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(isLoginRateLimited).mockResolvedValue({ allowed: true });
	});

	it('rejects unknown user and records failed attempt', async () => {
		vi.mocked(getUserByEmail).mockResolvedValue(null);
		await expect(loginWithEmailPassword('a@b.com', 'pw', clientIp)).resolves.toEqual({
			success: false,
			reason: 'invalid_credentials',
		});
		expect(recordFailedLoginAttempt).toHaveBeenCalledWith('a@b.com', clientIp);
	});

	it('rejects wrong password', async () => {
		vi.mocked(getUserByEmail).mockResolvedValue({
			id: '1',
			email: 'admin@example.com',
			name: 'Admin',
			role: 'admin',
			password_hash: 'scrypt$x$y',
		});
		vi.mocked(verifyPassword).mockReturnValue(false);
		await expect(loginWithEmailPassword('admin@example.com', 'wrong', clientIp)).resolves.toEqual({
			success: false,
			reason: 'invalid_credentials',
		});
	});

	it('rejects non-admin with same error as bad password', async () => {
		vi.mocked(getUserByEmail).mockResolvedValue({
			id: '2',
			email: 'user@example.com',
			name: 'User',
			role: 'user',
			password_hash: 'scrypt$x$y',
		});
		vi.mocked(verifyPassword).mockReturnValue(true);
		await expect(loginWithEmailPassword('user@example.com', 'pw', clientIp)).resolves.toEqual({
			success: false,
			reason: 'invalid_credentials',
		});
		expect(createAdminSession).not.toHaveBeenCalled();
	});

	it('returns rate_limited when blocked', async () => {
		vi.mocked(isLoginRateLimited).mockResolvedValue({ allowed: false, reason: 'blocked' });
		await expect(loginWithEmailPassword('admin@example.com', 'pw', clientIp)).resolves.toEqual({
			success: false,
			reason: 'rate_limited',
		});
		expect(getUserByEmail).not.toHaveBeenCalled();
	});

	it('creates session and cookie for valid admin', async () => {
		vi.mocked(getUserByEmail).mockResolvedValue({
			id: '1',
			email: 'admin@example.com',
			name: 'Admin',
			role: 'admin',
			password_hash: 'scrypt$x$y',
		});
		vi.mocked(verifyPassword).mockReturnValue(true);
		vi.mocked(createAdminSession).mockResolvedValue('session-token');

		const result = await loginWithEmailPassword('admin@example.com', 'pw', clientIp);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.user.isAdmin).toBe(true);
			expect(JSON.stringify(result.user)).not.toContain('password_hash');
		}
		expect(clearLoginAttempts).toHaveBeenCalledWith('admin@example.com', clientIp);
		expect(setSessionCookie).toHaveBeenCalledWith('session-token');
	});

	it('logout revokes session and clears cookie', async () => {
		vi.mocked(readSessionTokenFromCookies).mockResolvedValue('token');
		await logoutCurrentSession();
		expect(revokeSessionByToken).toHaveBeenCalledWith('token');
		expect(clearSessionCookie).toHaveBeenCalled();
	});
});
