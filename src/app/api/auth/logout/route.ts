import { NextRequest, NextResponse } from 'next/server';

import { assertSameOriginForCookieWrite } from '@/lib/auth/csrf.server';
import { logoutCurrentSession } from '@/lib/auth/login.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
	const originError = assertSameOriginForCookieWrite(request);
	if (originError) return originError;

	await logoutCurrentSession();
	return NextResponse.json({ ok: true, authenticated: false });
}
