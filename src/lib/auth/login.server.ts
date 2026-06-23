import { verifyPassword } from './password.server';
import {
	clearLoginAttempts,
	isLoginRateLimited,
	recordFailedLoginAttempt,
} from './loginRateLimit.server';
import {
	clearSessionCookie,
	createAdminSession,
	getUserByEmail,
	revokeSessionByToken,
	setSessionCookie,
	readSessionTokenFromCookies,
	toAuthUser,
} from './session.server';
import type { AuthUser } from './authTypes';

export type LoginResult =
	| { success: true; user: AuthUser }
	| { success: false; reason: 'invalid_credentials' | 'rate_limited' | 'misconfigured' };

export async function loginWithEmailPassword(
	email: string,
	password: string,
	clientIp: string
): Promise<LoginResult> {
	const rateLimit = await isLoginRateLimited(email, clientIp);
	if (!rateLimit.allowed) {
		if (rateLimit.reason === 'misconfigured') {
			return { success: false, reason: 'misconfigured' };
		}
		return { success: false, reason: 'rate_limited' };
	}

	const user = await getUserByEmail(email);
	if (!user || !verifyPassword(password, user.password_hash)) {
		await recordFailedLoginAttempt(email, clientIp);
		return { success: false, reason: 'invalid_credentials' };
	}

	const authUser = toAuthUser(user);
	if (!authUser.isAdmin) {
		await recordFailedLoginAttempt(email, clientIp);
		return { success: false, reason: 'invalid_credentials' };
	}

	await clearLoginAttempts(email, clientIp);
	const token = await createAdminSession(user.id);
	await setSessionCookie(token);
	return { success: true, user: authUser };
}

export async function logoutCurrentSession(): Promise<void> {
	const token = await readSessionTokenFromCookies();
	await revokeSessionByToken(token);
	await clearSessionCookie();
}
