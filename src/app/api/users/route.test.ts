import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

import { POST } from './route';
import { query } from '@/lib/db';
import { PUBLIC_REGISTRATION_FORBIDDEN_MESSAGE } from '@/lib/auth/publicRegistration';

function createPostRequest(body: unknown) {
  return new Request('http://localhost/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/users registration guard (PR-C5)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NEON_POSTGRES_URL = 'postgres://test';
    delete process.env.PUBLIC_REGISTRATION_ENABLED;
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns 403 for anonymous new-user registration when public registration is disabled', async () => {
    const response = await POST(
      createPostRequest({
        email: 'new-user@example.com',
        name: 'New User',
      }) as never
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe(PUBLIC_REGISTRATION_FORBIDDEN_MESSAGE);
    expect(body.error).not.toMatch(/already exists|duplicate|postgres|stack/i);
    expect(JSON.stringify(body)).not.toMatch(/stack|trace|NEON|POSTGRES/i);
    expect(query).not.toHaveBeenCalled();
  });

  it('does not insert a user record when registration is disabled', async () => {
    await POST(
      createPostRequest({
        email: 'another-new@example.com',
        name: 'Another User',
      }) as never
    );

    expect(query).not.toHaveBeenCalled();
  });

  it('returns 403 for anonymous update of an existing user and performs no database writes', async () => {
    const response = await POST(
      createPostRequest({
        email: 'existing@example.com',
        name: 'Existing Updated',
        role: 'admin',
      }) as never
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe(PUBLIC_REGISTRATION_FORBIDDEN_MESSAGE);
    expect(query).not.toHaveBeenCalled();
  });

  it('does not allow anonymous UPDATE even when public registration is enabled', async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = 'true';
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{ id: 'existing-id', email: 'existing@example.com', name: 'Existing' }],
    } as never);

    const response = await POST(
      createPostRequest({
        email: 'existing@example.com',
        name: 'Existing Updated',
        role: 'admin',
      }) as never
    );

    expect(response.status).toBe(403);
    expect(query).toHaveBeenCalledTimes(1);
    const sqlCalls = vi.mocked(query).mock.calls.map(([sql]) => String(sql));
    expect(sqlCalls.some((sql) => sql.includes('UPDATE users'))).toBe(false);
    expect(sqlCalls.some((sql) => sql.includes('INSERT INTO users'))).toBe(false);
  });

  it('allows new-user creation only when PUBLIC_REGISTRATION_ENABLED=true', async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = 'true';
    vi.mocked(query)
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    const response = await POST(
      createPostRequest({
        email: 'enabled@example.com',
        name: 'Enabled User',
      }) as never
    );

    expect(response.status).toBe(200);
    const sqlCalls = vi.mocked(query).mock.calls.map(([sql]) => String(sql));
    expect(sqlCalls.some((sql) => sql.includes('INSERT INTO users'))).toBe(true);
    expect(sqlCalls.some((sql) => sql.includes('UPDATE users'))).toBe(false);
  });

  it('ignores client-supplied role and always inserts role=user when registration is enabled', async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = 'true';
    vi.mocked(query)
      .mockResolvedValueOnce({ rows: [] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    await POST(
      createPostRequest({
        email: 'role-probe@example.com',
        name: 'Role Probe',
        role: 'admin',
        isAdmin: true,
      }) as never
    );

    const insertCall = vi.mocked(query).mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO users')
    );
    expect(insertCall?.[1]).toEqual([
      expect.any(String),
      'role-probe@example.com',
      'Role Probe',
      'user',
    ]);
  });

  it('does not leak database configuration details in 403 responses', async () => {
    const response = await POST(
      createPostRequest({
        email: 'probe@example.com',
        name: 'Probe',
      }) as never
    );

    const text = await response.text();
    expect(text).not.toMatch(/NEON|POSTGRES|relation|constraint|duplicate key/i);
  });
});

describe('POST /api/users validation (PR-C5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEON_POSTGRES_URL = 'postgres://test';
  });

  it('returns 400 when email is missing without querying existence', async () => {
    const response = await POST(createPostRequest({ name: 'No Email' }) as never);

    expect(response.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
    const body = await response.json();
    expect(body.error).toBe('Email is required');
    expect(body.error).not.toMatch(/not found|already exists/i);
  });
});
