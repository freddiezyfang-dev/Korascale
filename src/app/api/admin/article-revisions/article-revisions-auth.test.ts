import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/requireAdmin.server', () => ({
	enforceAdminRead: vi.fn(),
	enforceAdminWrite: vi.fn(),
}));

vi.mock('@/lib/seo/revisionAdmin.server', () => ({
	listArticleRevisions: vi.fn(),
	getArticleRevisionDetail: vi.fn(),
	updatePendingArticleRevision: vi.fn(),
	rejectArticleRevision: vi.fn(),
	publishArticleRevision: vi.fn(),
	countPendingRevisionsByArticle: vi.fn(),
}));

import { enforceAdminRead, enforceAdminWrite } from '@/lib/auth/requireAdmin.server';
import {
	getArticleRevisionDetail,
	listArticleRevisions,
	publishArticleRevision,
	updatePendingArticleRevision,
} from '@/lib/seo/revisionAdmin.server';

import { GET as listRevisions } from './route';
import { GET as getRevision, PUT as putRevision } from './[id]/route';
import { POST as publishRevision } from './[id]/publish/route';

function unauth(status: number) {
	return new Response(JSON.stringify({ ok: false, error: status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN' }), {
		status,
	});
}

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

describe('article-revisions admin API auth', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('anonymous list returns 401', async () => {
		vi.mocked(enforceAdminRead).mockResolvedValue({
			ok: false,
			response: unauth(401),
		});
		const response = await listRevisions(
			new NextRequest('http://localhost:3001/api/admin/article-revisions')
		);
		expect(response.status).toBe(401);
		expect(listArticleRevisions).not.toHaveBeenCalled();
	});

	it('non-admin list returns 403', async () => {
		vi.mocked(enforceAdminRead).mockResolvedValue({
			ok: false,
			response: unauth(403),
		});
		const response = await listRevisions(
			new NextRequest('http://localhost:3001/api/admin/article-revisions')
		);
		expect(response.status).toBe(403);
	});

	it('admin can list revisions', async () => {
		vi.mocked(enforceAdminRead).mockResolvedValue({
			ok: true,
			user: { id: '1', email: 'a@b.com', name: 'A', role: 'admin', isAdmin: true },
		});
		vi.mocked(listArticleRevisions).mockResolvedValue([]);
		const response = await listRevisions(
			new NextRequest('http://localhost:3001/api/admin/article-revisions')
		);
		expect(response.status).toBe(200);
	});

	it('anonymous publish returns 401', async () => {
		vi.mocked(enforceAdminWrite).mockResolvedValue({
			ok: false,
			response: unauth(401),
		});
		const response = await publishRevision(
			writeRequest('POST', 'http://localhost:3001/api/admin/article-revisions/x/publish'),
			{ params: Promise.resolve({ id: 'x' }) }
		);
		expect(response.status).toBe(401);
		expect(publishArticleRevision).not.toHaveBeenCalled();
	});

	it('invalid origin write returns 403 from guard', async () => {
		vi.mocked(enforceAdminWrite).mockResolvedValue({
			ok: false,
			response: unauth(403),
		});
		const response = await putRevision(
			writeRequest('PUT', 'http://localhost:3001/api/admin/article-revisions/x', { title: 'x' }),
			{ params: Promise.resolve({ id: 'x' }) }
		);
		expect(response.status).toBe(403);
		expect(updatePendingArticleRevision).not.toHaveBeenCalled();
	});

	it('admin can read revision detail', async () => {
		vi.mocked(enforceAdminRead).mockResolvedValue({
			ok: true,
			user: { id: '1', email: 'a@b.com', name: 'A', role: 'admin', isAdmin: true },
		});
		vi.mocked(getArticleRevisionDetail).mockResolvedValue({
			revision: { id: 'x' },
		} as never);
		const response = await getRevision(
			new NextRequest('http://localhost:3001/api/admin/article-revisions/x'),
			{ params: Promise.resolve({ id: 'x' }) }
		);
		expect(response.status).toBe(200);
	});
});
