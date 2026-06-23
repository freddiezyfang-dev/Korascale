import { NextResponse } from 'next/server';

export const AUTH_ERROR = {
	UNAUTHENTICATED: 'UNAUTHENTICATED',
	FORBIDDEN: 'FORBIDDEN',
	INVALID_ORIGIN: 'INVALID_ORIGIN',
	INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR)[keyof typeof AUTH_ERROR];

export function jsonAuthError(code: AuthErrorCode, status: number) {
	return NextResponse.json({ ok: false, error: code }, { status });
}

export function unauthenticatedResponse() {
	return jsonAuthError(AUTH_ERROR.UNAUTHENTICATED, 401);
}

export function forbiddenResponse() {
	return jsonAuthError(AUTH_ERROR.FORBIDDEN, 403);
}

export function invalidOriginResponse() {
	return jsonAuthError(AUTH_ERROR.INVALID_ORIGIN, 403);
}

export function invalidCredentialsResponse() {
	return jsonAuthError(AUTH_ERROR.INVALID_CREDENTIALS, 401);
}
