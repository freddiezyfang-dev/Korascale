import { NextRequest, NextResponse } from 'next/server';

import { enforceAdminRead, enforceAdminWrite } from '@/lib/auth/requireAdmin.server';
import {
	getArticleRevisionDetail,
	updatePendingArticleRevision,
} from '@/lib/seo/revisionAdmin.server';

import { revisionAdminErrorResponse } from '../_lib/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const guard = await enforceAdminRead();
	if (!guard.ok) return guard.response;

	try {
		const { id } = await context.params;
		const detail = await getArticleRevisionDetail(id);
		if (!detail) {
			return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
		}
		return NextResponse.json({ ok: true, ...detail });
	} catch (error) {
		return revisionAdminErrorResponse(error);
	}
}

export async function PUT(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const guard = await enforceAdminWrite(request);
	if (!guard.ok) return guard.response;

	try {
		const { id } = await context.params;
		const body = (await request.json()) as Record<string, unknown>;
		const detail = await updatePendingArticleRevision(id, body);
		return NextResponse.json({ ok: true, ...detail });
	} catch (error) {
		return revisionAdminErrorResponse(error);
	}
}
