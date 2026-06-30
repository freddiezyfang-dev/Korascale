import { NextRequest, NextResponse } from 'next/server';

import { enforceAdminWrite } from '@/lib/auth/requireAdmin.server';
import { publishJourneyRevision } from '@/lib/journeyRevisions/publish.server';

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
		const detail = await publishJourneyRevision({
			revisionId: id,
			publishedBy: guard.user.email || guard.user.id,
		});
		return NextResponse.json({ ok: true, ...detail });
	} catch (error) {
		return journeyRevisionErrorResponse(error);
	}
}
