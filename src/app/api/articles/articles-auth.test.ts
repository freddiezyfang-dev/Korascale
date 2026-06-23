import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/requireAdmin.server', () => ({
	enforceAdminWrite: vi.fn(),
	enforceAdminRead: vi.fn(),
}));

vi.mock('@/lib/auth/articleAccess.server', () => ({
	filterArticlesForPublicRead: vi.fn((articles: unknown[]) => articles),
	isAuthenticatedAdmin: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
	query: vi.fn(),
}));

import { filterArticlesForPublicRead } from '@/lib/auth/articleAccess.server';
import { enforceAdminWrite } from '@/lib/auth/requireAdmin.server';
import { query } from '@/lib/db';

import { POST as createArticle } from './route';
import { PUT as updateArticle, DELETE as deleteArticle } from './[id]/route';

const adminUser = {
	id: 'admin-1',
	email: 'admin@example.com',
	name: 'Admin',
	role: 'admin',
	isAdmin: true,
};

function writeRequest(method: string, url: string, body?: unknown) {
	return new NextRequest(url, {
		method,
		headers: {
			'Content-Type': 'application/json',
			origin: 'http://localhost:3001',
			host: 'localhost:3001',
		},
		body: body ? JSON.stringify(body) : undefined,
	});
}

function unauthResponse(status: number) {
	return new Response(JSON.stringify({ ok: false, error: status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN' }), {
		status,
	});
}

describe('articles API auth (PR-SEC-1)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.NEON_POSTGRES_URL = 'postgres://test';
		vi.mocked(filterArticlesForPublicRead).mockImplementation((articles) => articles);
	});

	it('anonymous POST returns 401 and does not write', async () => {
		vi.mocked(enforceAdminWrite).mockResolvedValue({
			ok: false,
			response: unauthResponse(401),
		});
		const response = await createArticle(
			writeRequest('POST', 'http://localhost:3001/api/articles', { title: 'x', slug: 'x' })
		);
		expect(response.status).toBe(401);
		expect(query).not.toHaveBeenCalled();
	});

	it('regular user POST returns 403 and does not write', async () => {
		vi.mocked(enforceAdminWrite).mockResolvedValue({
			ok: false,
			response: unauthResponse(403),
		});
		const response = await createArticle(
			writeRequest('POST', 'http://localhost:3001/api/articles', { title: 'x', slug: 'x' })
		);
		expect(response.status).toBe(403);
		expect(query).not.toHaveBeenCalled();
	});

	it('admin POST proceeds to database layer', async () => {
		vi.mocked(enforceAdminWrite).mockResolvedValue({ ok: true, user: adminUser });
		vi.mocked(query).mockRejectedValue(new Error('stop-after-guard'));
		const response = await createArticle(
			writeRequest('POST', 'http://localhost:3001/api/articles', {
				title: 'Test',
				slug: 'test',
				category: 'guide',
				status: 'draft',
			})
		);
		expect(enforceAdminWrite).toHaveBeenCalled();
		expect(query).toHaveBeenCalled();
		expect(response.status).toBe(500);
	});

	it('anonymous PUT returns 401', async () => {
		vi.mocked(enforceAdminWrite).mockResolvedValue({
			ok: false,
			response: unauthResponse(401),
		});
		const response = await updateArticle(
			writeRequest('PUT', 'http://localhost:3001/api/articles/1', { title: 'x' }),
			{ params: Promise.resolve({ id: '1' }) }
		);
		expect(response.status).toBe(401);
		expect(query).not.toHaveBeenCalled();
	});

	it('regular user PUT returns 403', async () => {
		vi.mocked(enforceAdminWrite).mockResolvedValue({
			ok: false,
			response: unauthResponse(403),
		});
		const response = await updateArticle(
			writeRequest('PUT', 'http://localhost:3001/api/articles/1', { title: 'x' }),
			{ params: Promise.resolve({ id: '1' }) }
		);
		expect(response.status).toBe(403);
	});

	it('admin PUT reaches database', async () => {
		vi.mocked(enforceAdminWrite).mockResolvedValue({ ok: true, user: adminUser });
		vi.mocked(query).mockResolvedValue({ rows: [] } as never);
		const response = await updateArticle(
			writeRequest('PUT', 'http://localhost:3001/api/articles/1', { title: 'x' }),
			{ params: Promise.resolve({ id: '1' }) }
		);
		expect(enforceAdminWrite).toHaveBeenCalled();
		expect(query).toHaveBeenCalled();
		expect([404, 500]).toContain(response.status);
	});

	it('anonymous DELETE returns 401', async () => {
		vi.mocked(enforceAdminWrite).mockResolvedValue({
			ok: false,
			response: unauthResponse(401),
		});
		const response = await deleteArticle(
			writeRequest('DELETE', 'http://localhost:3001/api/articles/1'),
			{ params: Promise.resolve({ id: '1' }) }
		);
		expect(response.status).toBe(401);
	});

	it('regular user DELETE returns 403', async () => {
		vi.mocked(enforceAdminWrite).mockResolvedValue({
			ok: false,
			response: unauthResponse(403),
		});
		const response = await deleteArticle(
			writeRequest('DELETE', 'http://localhost:3001/api/articles/1'),
			{ params: Promise.resolve({ id: '1' }) }
		);
		expect(response.status).toBe(403);
	});

	it('admin DELETE reaches database', async () => {
		vi.mocked(enforceAdminWrite).mockResolvedValue({ ok: true, user: adminUser });
		vi.mocked(query).mockResolvedValueOnce({ rows: [{ id: '1' }] } as never);
		vi.mocked(query).mockResolvedValueOnce({ rows: [] } as never);
		const response = await deleteArticle(
			writeRequest('DELETE', 'http://localhost:3001/api/articles/1'),
			{ params: Promise.resolve({ id: '1' }) }
		);
		expect(query).toHaveBeenCalled();
		expect(response.status).toBe(200);
	});
});
