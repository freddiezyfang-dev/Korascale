import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./session.server', () => ({
	getAuthenticatedUser: vi.fn(),
}));

import { getAuthenticatedUser } from './session.server';

import { enforceAdminWrite, requireAdmin } from './requireAdmin.server';

const adminUser = {
	id: 'admin-1',
	email: 'admin@example.com',
	name: 'Admin',
	role: 'admin',
	isAdmin: true,
};

const regularUser = {
	id: 'user-1',
	email: 'user@example.com',
	name: 'User',
	role: 'user',
	isAdmin: false,
};

function writeRequest(origin = 'http://localhost:3001') {
	return new NextRequest('http://localhost:3001/api/articles', {
		method: 'POST',
		headers: {
			origin,
			host: 'localhost:3001',
		},
	});
}

describe('requireAdmin.server', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv('NODE_ENV', 'development');
	});

	it('requireAdmin returns 401 when unauthenticated', async () => {
		vi.mocked(getAuthenticatedUser).mockResolvedValue(null);
		await expect(requireAdmin()).rejects.toMatchObject({
			response: expect.objectContaining({ status: 401 }),
		});
	});

	it('requireAdmin returns 403 for non-admin user', async () => {
		vi.mocked(getAuthenticatedUser).mockResolvedValue(regularUser);
		await expect(requireAdmin()).rejects.toMatchObject({
			response: expect.objectContaining({ status: 403 }),
		});
	});

	it('requireAdmin succeeds for admin user', async () => {
		vi.mocked(getAuthenticatedUser).mockResolvedValue(adminUser);
		await expect(requireAdmin()).resolves.toEqual(adminUser);
	});

	it('enforceAdminWrite blocks invalid origin before auth', async () => {
		const result = await enforceAdminWrite(writeRequest('https://evil.example'));
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.response.status).toBe(403);
			const body = await result.response.json();
			expect(body.error).toBe('INVALID_ORIGIN');
		}
		expect(getAuthenticatedUser).not.toHaveBeenCalled();
	});

	it('enforceAdminWrite returns 401 for anonymous user', async () => {
		vi.mocked(getAuthenticatedUser).mockResolvedValue(null);
		const result = await enforceAdminWrite(writeRequest());
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.response.status).toBe(401);
		}
	});

	it('enforceAdminWrite returns 403 for regular user', async () => {
		vi.mocked(getAuthenticatedUser).mockResolvedValue(regularUser);
		const result = await enforceAdminWrite(writeRequest());
		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.response.status).toBe(403);
		}
	});

	it('enforceAdminWrite succeeds for admin with valid origin', async () => {
		vi.mocked(getAuthenticatedUser).mockResolvedValue(adminUser);
		const result = await enforceAdminWrite(writeRequest());
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.user).toEqual(adminUser);
		}
	});
});
