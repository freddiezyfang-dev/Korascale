import { NextRequest, NextResponse } from 'next/server';

import { invalidCredentialsResponse } from '@/lib/auth/authErrors';
import { assertSameOriginForCookieWrite } from '@/lib/auth/csrf.server';
import { getClientIp } from '@/lib/auth/loginRateLimit.server';
import { loginWithEmailPassword } from '@/lib/auth/login.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	const originError = assertSameOriginForCookieWrite(request);
	if (originError) return originError;

	try {
		const body = (await request.json()) as { email?: string; password?: string; role?: string };
		const email = typeof body.email === 'string' ? body.email : '';
		const password = typeof body.password === 'string' ? body.password : '';

		if (!email.trim() || !password) {
			return invalidCredentialsResponse();
		}

		const clientIp = getClientIp(request);
		const result = await loginWithEmailPassword(email, password, clientIp);
		if (!result.success) {
			if (result.reason === 'misconfigured') {
				return NextResponse.json({ ok: false, error: 'SERVICE_UNAVAILABLE' }, { status: 503 });
			}
			return invalidCredentialsResponse();
		}

		return NextResponse.json({
			ok: true,
			authenticated: true,
			user: {
				id: result.user.id,
				email: result.user.email,
				name: result.user.name,
				isAdmin: result.user.isAdmin,
			},
		});
	} catch {
		return invalidCredentialsResponse();
	}
}
