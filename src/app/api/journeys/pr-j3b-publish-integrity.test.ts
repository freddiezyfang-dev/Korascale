import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/requireAdmin.server', () => ({
	enforceAdminWrite: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
	query: vi.fn(),
}));

import { enforceAdminWrite } from '@/lib/auth/requireAdmin.server';
import { query } from '@/lib/db';
import { AUTH_ERROR } from '@/lib/auth/authErrors';
import { JOURNEY_PUBLISH_INTEGRITY_ERROR } from '@/lib/journeyNormalization/journeyPublishIntegrity';

import { POST } from './route';
import { PUT } from './[id]/route';

const adminUser = { id: 'admin-1', email: 'admin@example.com', isAdmin: true };

const existingRow = {
	id: 'journey-1',
	title: 'Active Journey',
	slug: 'active-journey',
	short_description: 'Short copy',
	page_title: 'Page title',
	meta_description: 'Meta description',
	hero_image_url: '/hero.jpg',
	hero_image_alt: 'Hero alt',
	journey_type_slug: 'deep-discovery',
	status: 'active',
	data: {},
};

function postRequest(body: unknown) {
	return new NextRequest('http://localhost:3000/api/journeys', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

function putRequest(body: unknown) {
	return new NextRequest('http://localhost:3000/api/journeys/journey-1', {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
}

function unauthorizedGuard() {
	return {
		ok: false,
		response: new Response(JSON.stringify({ ok: false, error: AUTH_ERROR.UNAUTHENTICATED }), {
			status: 401,
		}),
	} as never;
}

function forbiddenGuard() {
	return {
		ok: false,
		response: new Response(JSON.stringify({ ok: false, error: AUTH_ERROR.FORBIDDEN }), {
			status: 403,
		}),
	} as never;
}

describe('PR-J3B journeys API publish gate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(enforceAdminWrite).mockResolvedValue({ ok: true, user: adminUser } as never);
		vi.mocked(query).mockImplementation(async (sql: string) => {
			if (sql.includes('SELECT * FROM journeys WHERE id')) {
				return { rows: [existingRow] } as never;
			}
			if (sql === 'SELECT id, slug FROM journeys') {
				return { rows: [{ id: 'journey-1', slug: 'active-journey' }] } as never;
			}
			if (sql.includes('INSERT INTO journeys')) {
				return {
					rows: [{ id: 'new-id', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
				} as never;
			}
			if (sql.includes('UPDATE journeys')) {
				throw new Error('UPDATE should not run when publish gate rejects');
			}
			return { rows: [] } as never;
		});
	});

	it('rejects anonymous POST before any DB read', async () => {
		vi.mocked(enforceAdminWrite).mockResolvedValue(unauthorizedGuard());
		const response = await POST(postRequest({ title: 'X', slug: 'x', status: 'active' }));
		expect(response.status).toBe(401);
		expect(vi.mocked(query)).not.toHaveBeenCalled();
	});

	it('rejects non-admin POST before any DB read', async () => {
		vi.mocked(enforceAdminWrite).mockResolvedValue(forbiddenGuard());
		const response = await POST(postRequest({ title: 'X', slug: 'x', status: 'active' }));
		expect(response.status).toBe(403);
		expect(vi.mocked(query)).not.toHaveBeenCalled();
	});

	it('rejects anonymous PUT before publish gate can probe integrity', async () => {
		vi.mocked(enforceAdminWrite).mockResolvedValue(unauthorizedGuard());
		const response = await PUT(putRequest({ metaDescription: '' }), {
			params: Promise.resolve({ id: 'journey-1' }),
		});
		expect(response.status).toBe(401);
		expect(vi.mocked(query)).not.toHaveBeenCalled();
	});

	it('rejects non-admin PUT before publish gate can probe integrity', async () => {
		vi.mocked(enforceAdminWrite).mockResolvedValue(forbiddenGuard());
		const response = await PUT(putRequest({ metaDescription: '' }), {
			params: Promise.resolve({ id: 'journey-1' }),
		});
		expect(response.status).toBe(403);
		expect(vi.mocked(query)).not.toHaveBeenCalled();
	});

	it('create active incomplete returns 422 before INSERT', async () => {
		const response = await POST(
			postRequest({
				title: 'Incomplete',
				slug: 'incomplete-journey',
				status: 'active',
			})
		);
		expect(response.status).toBe(422);
		const body = await response.json();
		expect(body.error).toBe(JOURNEY_PUBLISH_INTEGRITY_ERROR);
		expect(body.message).toBe('This Journey is not ready to publish.');
		expect(vi.mocked(query).mock.calls.some(([sql]) => String(sql).includes('INSERT INTO'))).toBe(
			false
		);
	});

	it('create draft incomplete succeeds', async () => {
		const response = await POST(
			postRequest({
				title: 'Draft',
				slug: 'draft-journey',
				status: 'draft',
				shortDescription: '',
			})
		);
		expect(response.status).toBe(200);
		expect(vi.mocked(query).mock.calls.some(([sql]) => String(sql).includes('INSERT INTO'))).toBe(
			true
		);
	});

	it('rejects active publish integrity failure before UPDATE', async () => {
		const response = await PUT(putRequest({ metaDescription: '' }), {
			params: Promise.resolve({ id: 'journey-1' }),
		});
		expect(response.status).toBe(422);
		const body = await response.json();
		expect(body.error).toBe(JOURNEY_PUBLISH_INTEGRITY_ERROR);
		expect(body.fields.some((f: { field: string }) => f.field === 'meta_description')).toBe(true);
	});

	it('edit active complete saves successfully', async () => {
		vi.mocked(query).mockImplementation(async (sql: string) => {
			if (sql.includes('SELECT * FROM journeys WHERE id')) {
				return { rows: [existingRow] } as never;
			}
			if (sql === 'SELECT id, slug FROM journeys') {
				return { rows: [{ id: 'journey-1', slug: 'active-journey' }] } as never;
			}
			if (sql.includes('UPDATE journeys')) {
				return { rows: [{ id: 'journey-1', updated_at: new Date().toISOString() }] } as never;
			}
			if (sql.includes('SELECT data FROM journeys')) {
				return { rows: [{ data: {} }] } as never;
			}
			return { rows: [] } as never;
		});

		const response = await PUT(putRequest({ title: 'Updated Title' }), {
			params: Promise.resolve({ id: 'journey-1' }),
		});
		expect(response.status).toBe(200);
	});

	it('allows active to archived with cleared fields', async () => {
		vi.mocked(query).mockImplementation(async (sql: string) => {
			if (sql.includes('SELECT * FROM journeys WHERE id')) {
				return { rows: [existingRow] } as never;
			}
			if (sql === 'SELECT id, slug FROM journeys') {
				return { rows: [{ id: 'journey-1', slug: 'active-journey' }] } as never;
			}
			if (sql.includes('UPDATE journeys')) {
				return { rows: [{ id: 'journey-1', updated_at: new Date().toISOString() }] } as never;
			}
			if (sql.includes('SELECT data FROM journeys')) {
				return { rows: [{ data: {} }] } as never;
			}
			return { rows: [] } as never;
		});

		const response = await PUT(
			putRequest({ status: 'archived', metaDescription: '', pageTitle: '' }),
			{ params: Promise.resolve({ id: 'journey-1' }) }
		);
		expect(response.status).toBe(200);
	});

	it('ignores client seo_complete in POST body', async () => {
		const response = await POST(
			postRequest({
				title: 'Draft',
				slug: 'draft-journey',
				status: 'draft',
				seo_complete: true,
				isAdmin: true,
			})
		);
		expect(response.status).toBe(200);
		const insertCall = vi.mocked(query).mock.calls.find(([sql]) =>
			String(sql).includes('INSERT INTO')
		);
		expect(insertCall).toBeDefined();
	});
});
