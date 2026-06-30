import { NextRequest, NextResponse } from 'next/server';

import { enforceAdminWrite } from '@/lib/auth/requireAdmin.server';
import { rejectJourneyRevision } from '@/lib/journeyRevisions/dryRun.server';

import { journeyRevisionErrorResponse } from '../../_lib/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const guard = await enforceAdminWrite(request);
	if (!guard.ok) return guard.response;

	try {
		const { id } = await context.params;
		const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
		const reason = typeof body.reason === 'string' ? body.reason : undefined;
		const detail = await rejectJourneyRevision({ id, reason });
		return NextResponse.json({ ok: true, ...detail });
	} catch (error) {
		return journeyRevisionErrorResponse(error);
	}
}
