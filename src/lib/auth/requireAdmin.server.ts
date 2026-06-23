import type { NextRequest } from 'next/server';

import { assertSameOriginForCookieWrite } from './csrf.server';
import { forbiddenResponse, unauthenticatedResponse } from './authErrors';
import { getAuthenticatedUser } from './session.server';
import type { AuthUser } from './authTypes';

export async function requireAuthenticatedUser(): Promise<AuthUser> {
	const user = await getAuthenticatedUser();
	if (!user) {
		throw new AuthGuardError(unauthenticatedResponse());
	}
	return user;
}

export async function requireAdmin(): Promise<AuthUser> {
	const user = await requireAuthenticatedUser();
	if (!user.isAdmin) {
		throw new AuthGuardError(forbiddenResponse());
	}
	return user;
}

export class AuthGuardError extends Error {
	constructor(public readonly response: Response) {
		super('AUTH_GUARD');
		this.name = 'AuthGuardError';
	}
}

export type AdminWriteGuardResult =
	| { ok: true; user: AuthUser }
	| { ok: false; response: Response };

export async function enforceAdminWrite(request: NextRequest): Promise<AdminWriteGuardResult> {
	const originError = assertSameOriginForCookieWrite(request);
	if (originError) {
		return { ok: false, response: originError };
	}

	try {
		const user = await requireAdmin();
		return { ok: true, user };
	} catch (error) {
		if (error instanceof AuthGuardError) {
			return { ok: false, response: error.response };
		}
		throw error;
	}
}

export async function enforceAdminRead(): Promise<AdminWriteGuardResult> {
	try {
		const user = await requireAdmin();
		return { ok: true, user };
	} catch (error) {
		if (error instanceof AuthGuardError) {
			return { ok: false, response: error.response };
		}
		throw error;
	}
}
