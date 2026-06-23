import { createHash, randomBytes } from 'node:crypto';

import { cookies } from 'next/headers';

import { query } from '@/lib/db';

import type { AuthUser, DbUserRow } from './authTypes';

export const ADMIN_SESSION_COOKIE = 'admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateSessionToken(): string {
	return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export function isAdminRole(role: string | null | undefined): boolean {
	return role === 'admin';
}

export function toAuthUser(row: Pick<DbUserRow, 'id' | 'email' | 'name' | 'role'>): AuthUser {
	const role = row.role ?? 'user';
	return {
		id: row.id,
		email: row.email,
		name: row.name ?? row.email.split('@')[0],
		role,
		isAdmin: isAdminRole(role),
	};
}

export function getSessionCookieOptions(maxAgeSeconds: number) {
	const isProduction = process.env.NODE_ENV === 'production';
	return {
		httpOnly: true,
		secure: isProduction,
		sameSite: 'lax' as const,
		path: '/',
		maxAge: maxAgeSeconds,
	};
}

export async function createAdminSession(userId: string): Promise<string> {
	const token = generateSessionToken();
	const tokenHash = hashSessionToken(token);
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

	await query(
		`
    INSERT INTO admin_sessions (user_id, token_hash, expires_at)
    VALUES ($1, $2, $3)
  `,
		[userId, tokenHash, expiresAt.toISOString()]
	);

	return token;
}

export async function revokeSessionByToken(token: string | undefined | null): Promise<void> {
	if (!token) return;
	const tokenHash = hashSessionToken(token);
	await query(
		`
    UPDATE admin_sessions
    SET revoked_at = NOW(), last_used_at = NOW()
    WHERE token_hash = $1 AND revoked_at IS NULL
  `,
		[tokenHash]
	);
}

export async function readSessionTokenFromCookies(): Promise<string | undefined> {
	const cookieStore = await cookies();
	return cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
}

export async function setSessionCookie(token: string): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.set(
		ADMIN_SESSION_COOKIE,
		token,
		getSessionCookieOptions(Math.floor(SESSION_TTL_MS / 1000))
	);
}

export async function clearSessionCookie(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.set(ADMIN_SESSION_COOKIE, '', {
		...getSessionCookieOptions(0),
		maxAge: 0,
	});
}

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
	const token = await readSessionTokenFromCookies();
	if (!token) return null;

	const tokenHash = hashSessionToken(token);
	const { rows } = await query<
		DbUserRow & { expires_at: string; revoked_at: string | null; last_used_at: string }
	>(
		`
    SELECT u.id, u.email, u.name, u.role, u.password_hash,
           s.expires_at, s.revoked_at, s.last_used_at
    FROM admin_sessions s
    INNER JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = $1
    LIMIT 1
  `,
		[tokenHash]
	);

	if (rows.length === 0) return null;

	const row = rows[0];
	if (row.revoked_at) return null;
	if (new Date(row.expires_at).getTime() <= Date.now()) return null;

	const lastUsedAt = row.last_used_at ? new Date(row.last_used_at).getTime() : 0;
	const oneHourAgo = Date.now() - 60 * 60 * 1000;
	if (lastUsedAt < oneHourAgo) {
		await query(`UPDATE admin_sessions SET last_used_at = NOW() WHERE token_hash = $1`, [
			tokenHash,
		]);
	}

	return toAuthUser(row);
}

export async function getUserByEmail(email: string): Promise<DbUserRow | null> {
	const normalized = email.trim().toLowerCase();
	const { rows } = await query<DbUserRow>(
		`
    SELECT id, email, name, role, password_hash
    FROM users
    WHERE LOWER(email) = $1
    LIMIT 1
  `,
		[normalized]
	);
	return rows[0] ?? null;
}
