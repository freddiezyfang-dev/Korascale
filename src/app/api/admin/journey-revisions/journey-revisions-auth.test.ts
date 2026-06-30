import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/requireAdmin.server', () => ({
	enforceAdminRead: vi.fn(),
	enforceAdminWrite: vi.fn(),
}));

vi.mock('@/lib/journeyRevisions/dryRun.server', () => ({
	dryRunJourneyRevision: vi.fn(),
	createJourneyRevision: vi.fn(),
	getJourneyRevisionDetail: vi.fn(),
	rejectJourneyRevision: vi.fn(),
	listJourneyRevisionsForAdmin: vi.fn(),
}));

vi.mock('@/lib/journeyRevisions/publish.server', () => ({
	publishJourneyRevision: vi.fn(),
}));

import { enforceAdminRead, enforceAdminWrite } from '@/lib/auth/requireAdmin.server';
import {
	createJourneyRevision,
	dryRunJourneyRevision,
	getJourneyRevisionDetail,
	listJourneyRevisionsForAdmin,
	rejectJourneyRevision,
} from '@/lib/journeyRevisions/dryRun.server';
import { publishJourneyRevision } from '@/lib/journeyRevisions/publish.server';

import { POST as dryRunRoute } from './dry-run/route';
import { GET as listRevisions, POST as createRoute } from './route';
import { GET as getRoute } from './[id]/route';
import { POST as publishRoute } from './[id]/publish/route';
import { POST as rejectRoute } from './[id]/reject/route';

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

describe('journey-revisions admin API auth', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('POST /api/admin/journey-revisions/dry-run', () => {
		it('anonymous returns 401 without handler', async () => {
			vi.mocked(enforceAdminWrite).mockResolvedValue({ ok: false, response: unauth(401) });
			const response = await dryRunRoute(
				writeRequest('POST', 'http://localhost:3001/api/admin/journey-revisions/dry-run', {
					operation: 'create',
					changes: {},
				})
			);
			expect(response.status).toBe(401);
			expect(dryRunJourneyRevision).not.toHaveBeenCalled();
		});

		it('non-admin returns 403 without handler', async () => {
			vi.mocked(enforceAdminWrite).mockResolvedValue({ ok: false, response: unauth(403) });
			const response = await dryRunRoute(
				writeRequest('POST', 'http://localhost:3001/api/admin/journey-revisions/dry-run', {
					operation: 'create',
					changes: {},
				})
			);
			expect(response.status).toBe(403);
			expect(dryRunJourneyRevision).not.toHaveBeenCalled();
		});

		it('admin enters handler', async () => {
			vi.mocked(enforceAdminWrite).mockResolvedValue({
				ok: true,
				user: { id: '1', email: 'a@b.com', name: 'A', role: 'admin', isAdmin: true },
			});
			vi.mocked(dryRunJourneyRevision).mockResolvedValue({
				valid: true,
				operation: 'create',
				journeyId: null,
				sourceUpdatedAtMatched: true,
				errors: [],
				warnings: [],
				changeSummary: [],
				validationReport: { errors: [], warnings: [] },
				resolvedSnapshot: {},
			} as never);
			const response = await dryRunRoute(
				writeRequest('POST', 'http://localhost:3001/api/admin/journey-revisions/dry-run', {
					operation: 'create',
					changes: { slug: 'x', title: 'X' },
				})
			);
			expect(response.status).toBe(200);
			expect(dryRunJourneyRevision).toHaveBeenCalled();
		});
	});

	describe('GET /api/admin/journey-revisions', () => {
		it('anonymous returns 401', async () => {
			vi.mocked(enforceAdminRead).mockResolvedValue({ ok: false, response: unauth(401) });
			const response = await listRevisions(
				new NextRequest('http://localhost:3001/api/admin/journey-revisions')
			);
			expect(response.status).toBe(401);
			expect(listJourneyRevisionsForAdmin).not.toHaveBeenCalled();
		});

		it('non-admin returns 403', async () => {
			vi.mocked(enforceAdminRead).mockResolvedValue({ ok: false, response: unauth(403) });
			const response = await listRevisions(
				new NextRequest('http://localhost:3001/api/admin/journey-revisions')
			);
			expect(response.status).toBe(403);
			expect(listJourneyRevisionsForAdmin).not.toHaveBeenCalled();
		});

		it('admin enters handler', async () => {
			vi.mocked(enforceAdminRead).mockResolvedValue({
				ok: true,
				user: { id: '1', email: 'a@b.com', name: 'A', role: 'admin', isAdmin: true },
			});
			vi.mocked(listJourneyRevisionsForAdmin).mockResolvedValue([]);
			const response = await listRevisions(
				new NextRequest('http://localhost:3001/api/admin/journey-revisions?status=pending_review')
			);
			expect(response.status).toBe(200);
			expect(listJourneyRevisionsForAdmin).toHaveBeenCalled();
		});
	});

	describe('POST /api/admin/journey-revisions', () => {
		it('anonymous returns 401', async () => {
			vi.mocked(enforceAdminWrite).mockResolvedValue({ ok: false, response: unauth(401) });
			const response = await createRoute(
				writeRequest('POST', 'http://localhost:3001/api/admin/journey-revisions', {
					operation: 'create',
					changes: {},
				})
			);
			expect(response.status).toBe(401);
			expect(createJourneyRevision).not.toHaveBeenCalled();
		});

		it('non-admin returns 403', async () => {
			vi.mocked(enforceAdminWrite).mockResolvedValue({ ok: false, response: unauth(403) });
			const response = await createRoute(
				writeRequest('POST', 'http://localhost:3001/api/admin/journey-revisions', {
					operation: 'create',
					changes: {},
				})
			);
			expect(response.status).toBe(403);
			expect(createJourneyRevision).not.toHaveBeenCalled();
		});

		it('admin enters handler', async () => {
			vi.mocked(enforceAdminWrite).mockResolvedValue({
				ok: true,
				user: { id: '1', email: 'a@b.com', name: 'A', role: 'admin', isAdmin: true },
			});
			vi.mocked(createJourneyRevision).mockResolvedValue({
				revisionId: 'rev-1',
				operation: 'create',
				journeyId: null,
				status: 'pending_review',
				validationSummary: { errors: [], warnings: [] },
				previewPath: '/admin/journey-revisions/rev-1/preview',
			});
			const response = await createRoute(
				writeRequest('POST', 'http://localhost:3001/api/admin/journey-revisions', {
					operation: 'create',
					changes: { slug: 'x', title: 'X' },
				})
			);
			expect(response.status).toBe(200);
			expect(createJourneyRevision).toHaveBeenCalled();
		});
	});

	describe('GET /api/admin/journey-revisions/[id]', () => {
		it('anonymous returns 401', async () => {
			vi.mocked(enforceAdminRead).mockResolvedValue({ ok: false, response: unauth(401) });
			const response = await getRoute(
				new NextRequest('http://localhost:3001/api/admin/journey-revisions/x'),
				{ params: Promise.resolve({ id: 'x' }) }
			);
			expect(response.status).toBe(401);
			expect(getJourneyRevisionDetail).not.toHaveBeenCalled();
		});

		it('non-admin returns 403', async () => {
			vi.mocked(enforceAdminRead).mockResolvedValue({ ok: false, response: unauth(403) });
			const response = await getRoute(
				new NextRequest('http://localhost:3001/api/admin/journey-revisions/x'),
				{ params: Promise.resolve({ id: 'x' }) }
			);
			expect(response.status).toBe(403);
			expect(getJourneyRevisionDetail).not.toHaveBeenCalled();
		});

		it('admin enters handler', async () => {
			vi.mocked(enforceAdminRead).mockResolvedValue({
				ok: true,
				user: { id: '1', email: 'a@b.com', name: 'A', role: 'admin', isAdmin: true },
			});
			vi.mocked(getJourneyRevisionDetail).mockResolvedValue({
				revision: { id: 'x' },
				allowedActions: ['read'],
				hasSourceConflict: false,
			} as never);
			const response = await getRoute(
				new NextRequest('http://localhost:3001/api/admin/journey-revisions/x'),
				{ params: Promise.resolve({ id: 'x' }) }
			);
			expect(response.status).toBe(200);
			expect(getJourneyRevisionDetail).toHaveBeenCalled();
		});
	});

	describe('POST /api/admin/journey-revisions/[id]/publish', () => {
		it('anonymous returns 401', async () => {
			vi.mocked(enforceAdminWrite).mockResolvedValue({ ok: false, response: unauth(401) });
			const response = await publishRoute(
				writeRequest('POST', 'http://localhost:3001/api/admin/journey-revisions/x/publish'),
				{ params: Promise.resolve({ id: 'x' }) }
			);
			expect(response.status).toBe(401);
			expect(publishJourneyRevision).not.toHaveBeenCalled();
		});

		it('non-admin returns 403', async () => {
			vi.mocked(enforceAdminWrite).mockResolvedValue({ ok: false, response: unauth(403) });
			const response = await publishRoute(
				writeRequest('POST', 'http://localhost:3001/api/admin/journey-revisions/x/publish'),
				{ params: Promise.resolve({ id: 'x' }) }
			);
			expect(response.status).toBe(403);
			expect(publishJourneyRevision).not.toHaveBeenCalled();
		});

		it('admin enters handler', async () => {
			vi.mocked(enforceAdminWrite).mockResolvedValue({
				ok: true,
				user: { id: '1', email: 'a@b.com', name: 'A', role: 'admin', isAdmin: true },
			});
			vi.mocked(publishJourneyRevision).mockResolvedValue({
				revision: { id: 'x' },
				allowedActions: ['read'],
				hasSourceConflict: false,
			} as never);
			const response = await publishRoute(
				writeRequest('POST', 'http://localhost:3001/api/admin/journey-revisions/x/publish'),
				{ params: Promise.resolve({ id: 'x' }) }
			);
			expect(response.status).toBe(200);
			expect(publishJourneyRevision).toHaveBeenCalled();
		});
	});

	describe('POST /api/admin/journey-revisions/[id]/reject', () => {
		it('anonymous returns 401', async () => {
			vi.mocked(enforceAdminWrite).mockResolvedValue({ ok: false, response: unauth(401) });
			const response = await rejectRoute(
				writeRequest('POST', 'http://localhost:3001/api/admin/journey-revisions/x/reject'),
				{ params: Promise.resolve({ id: 'x' }) }
			);
			expect(response.status).toBe(401);
			expect(rejectJourneyRevision).not.toHaveBeenCalled();
		});

		it('non-admin returns 403', async () => {
			vi.mocked(enforceAdminWrite).mockResolvedValue({ ok: false, response: unauth(403) });
			const response = await rejectRoute(
				writeRequest('POST', 'http://localhost:3001/api/admin/journey-revisions/x/reject'),
				{ params: Promise.resolve({ id: 'x' }) }
			);
			expect(response.status).toBe(403);
			expect(rejectJourneyRevision).not.toHaveBeenCalled();
		});

		it('admin enters handler', async () => {
			vi.mocked(enforceAdminWrite).mockResolvedValue({
				ok: true,
				user: { id: '1', email: 'a@b.com', name: 'A', role: 'admin', isAdmin: true },
			});
			vi.mocked(rejectJourneyRevision).mockResolvedValue({
				revision: { id: 'x' },
				allowedActions: ['read'],
				hasSourceConflict: false,
			} as never);
			const response = await rejectRoute(
				writeRequest('POST', 'http://localhost:3001/api/admin/journey-revisions/x/reject'),
				{ params: Promise.resolve({ id: 'x' }) }
			);
			expect(response.status).toBe(200);
			expect(rejectJourneyRevision).toHaveBeenCalled();
		});
	});
});
