import { NextRequest, NextResponse } from 'next/server';

import { enforceAdminWrite } from '@/lib/auth/requireAdmin.server';
import { rejectArticleRevision } from '@/lib/seo/revisionAdmin.server';

import { revisionAdminErrorResponse } from '../../_lib/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const guard = await enforceAdminWrite(_request);
	if (!guard.ok) return guard.response;

	try {
		const { id } = await context.params;
		const revision = await rejectArticleRevision(id);
		return NextResponse.json({ ok: true, revision });
	} catch (error) {
		return revisionAdminErrorResponse(error);
	}
}
