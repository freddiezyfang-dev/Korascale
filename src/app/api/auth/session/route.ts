import { NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/lib/auth/session.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
	const user = await getAuthenticatedUser();
	if (!user) {
		return NextResponse.json({
			ok: true,
			authenticated: false,
			user: null,
		});
	}

	return NextResponse.json({
		ok: true,
		authenticated: true,
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			isAdmin: user.isAdmin,
		},
	});
}
