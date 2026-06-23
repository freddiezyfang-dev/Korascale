import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/lib/auth/requireAdmin.server', () => ({
  enforceAdminRead: vi.fn(),
}));

import { enforceAdminRead } from '@/lib/auth/requireAdmin.server';
import { query } from '@/lib/db';

import { GET } from './route';

const adminUser = {
  id: 'admin-1',
  email: 'admin@korascale.com',
  name: 'Admin',
  role: 'admin',
  isAdmin: true,
};

function guardResponse(status: number) {
  return new Response(
    JSON.stringify({ ok: false, error: status === 401 ? 'UNAUTHENTICATED' : 'FORBIDDEN' }),
    { status }
  );
}

describe('GET /api/users email lookup (PR-SEC-1A)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEON_POSTGRES_URL = 'postgres://test';
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('returns 401 for anonymous lookup without querying database', async () => {
    vi.mocked(enforceAdminRead).mockResolvedValue({
      ok: false,
      response: guardResponse(401),
    });

    const response = await GET(
      new Request('http://localhost/api/users?email=admin@korascale.com') as never
    );

    expect(response.status).toBe(401);
    expect(query).not.toHaveBeenCalled();
    const body = await response.json();
    expect(JSON.stringify(body)).not.toMatch(/password_hash|role/i);
  });

  it('returns 403 for non-admin lookup without querying database', async () => {
    vi.mocked(enforceAdminRead).mockResolvedValue({
      ok: false,
      response: guardResponse(403),
    });

    const response = await GET(
      new Request('http://localhost/api/users?email=admin@korascale.com') as never
    );

    expect(response.status).toBe(403);
    expect(query).not.toHaveBeenCalled();
  });

  it('allows admin lookup and never returns password_hash', async () => {
    vi.mocked(enforceAdminRead).mockResolvedValue({ ok: true, user: adminUser });
    vi.mocked(query).mockResolvedValueOnce({
      rows: [
        {
          id: '1',
          email: 'admin@korascale.com',
          name: 'Admin',
          role: 'admin',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          password_hash: 'scrypt$hidden$hash',
        },
      ],
    } as never);

    const response = await GET(
      new Request('http://localhost/api/users?email=admin@korascale.com') as never
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user.email).toBe('admin@korascale.com');
    expect(JSON.stringify(body)).not.toMatch(/password_hash|scrypt/i);
  });
});
