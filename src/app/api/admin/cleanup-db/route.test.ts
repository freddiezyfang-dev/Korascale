import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/requireAdmin.server', () => ({
	enforceAdminRead: vi.fn(),
	enforceAdminWrite: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
	query: vi.fn(),
}));

import { enforceAdminRead } from '@/lib/auth/requireAdmin.server';
import { query } from '@/lib/db';

import { GET } from './route';

const adminUser = {
	id: 'admin-1',
	email: 'admin@example.com',
	name: 'Admin',
	role: 'admin',
	isAdmin: true,
};

function guardResponse(status: number) {
	return new Response(JSON.stringify({ ok: false, error: status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN' }), {
		status,
	});
}

describe('GET /api/admin/cleanup-db', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns 401 for anonymous access without querying database', async () => {
		vi.mocked(enforceAdminRead).mockResolvedValue({
			ok: false,
			response: guardResponse(401),
		});
		const response = await GET();
		expect(response.status).toBe(401);
		expect(query).not.toHaveBeenCalled();
	});

	it('returns 403 for non-admin access without querying database', async () => {
		vi.mocked(enforceAdminRead).mockResolvedValue({
			ok: false,
			response: guardResponse(403),
		});
		const response = await GET();
		expect(response.status).toBe(403);
		expect(query).not.toHaveBeenCalled();
	});

	it('allows admin access and runs diagnostic query', async () => {
		vi.mocked(enforceAdminRead).mockResolvedValue({ ok: true, user: adminUser });
		vi.mocked(query).mockResolvedValueOnce({ rows: [] } as never);
		const response = await GET();
		expect(response.status).toBe(200);
		expect(query).toHaveBeenCalled();
	});
});
