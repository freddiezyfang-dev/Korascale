import { NextRequest, NextResponse } from 'next/server';

import { enforceAdminRead } from '@/lib/auth/requireAdmin.server';
import { getJourneyRevisionDetail } from '@/lib/journeyRevisions/dryRun.server';

import { journeyRevisionErrorResponse } from '../_lib/responses';

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
		const detail = await getJourneyRevisionDetail(id);
		if (!detail) {
			return NextResponse.json(
				{ ok: false, error: 'JOURNEY_REVISION_NOT_FOUND', message: 'Revision not found.' },
				{ status: 404 }
			);
		}
		return NextResponse.json({ ok: true, ...detail });
	} catch (error) {
		return journeyRevisionErrorResponse(error);
	}
}
