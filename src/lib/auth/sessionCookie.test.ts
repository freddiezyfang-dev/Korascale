import { describe, expect, it, vi } from 'vitest';

import { getSessionCookieOptions } from './session.server';

describe('session cookie options', () => {
	it('sets HttpOnly, SameSite=Lax, Path=/ and Secure in production', () => {
		vi.stubEnv('NODE_ENV', 'production');
		const options = getSessionCookieOptions(3600);
		expect(options.httpOnly).toBe(true);
		expect(options.sameSite).toBe('lax');
		expect(options.path).toBe('/');
		expect(options.secure).toBe(true);
		vi.unstubAllEnvs();
	});

	it('does not include role or admin in cookie name constant', async () => {
		const { ADMIN_SESSION_COOKIE } = await import('./session.server');
		expect(ADMIN_SESSION_COOKIE).toBe('admin_session');
		expect(ADMIN_SESSION_COOKIE).not.toMatch(/role|isadmin/i);
	});
});
