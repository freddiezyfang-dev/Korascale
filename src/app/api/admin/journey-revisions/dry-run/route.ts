import { NextRequest, NextResponse } from 'next/server';

import { enforceAdminWrite } from '@/lib/auth/requireAdmin.server';
import { dryRunJourneyRevision } from '@/lib/journeyRevisions/dryRun.server';
import { isValidRevisionOperation } from '@/lib/journeyRevisions/stateMachine';
import type { JourneyRevisionDryRunRequest } from '@/lib/journeyRevisions/types';

import { journeyRevisionErrorResponse } from '../_lib/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseDryRunBody(body: Record<string, unknown>): JourneyRevisionDryRunRequest {
	const operation = body.operation;
	if (!isValidRevisionOperation(operation)) {
		throw new Error('Invalid operation');
	}
	return {
		operation,
		journeyId: typeof body.journeyId === 'string' ? body.journeyId : undefined,
		sourceUpdatedAt:
			typeof body.sourceUpdatedAt === 'string' ? body.sourceUpdatedAt : undefined,
		changes:
			body.changes && typeof body.changes === 'object' && !Array.isArray(body.changes)
				? (body.changes as Record<string, unknown>)
				: {},
		reviewMetadata:
			body.reviewMetadata && typeof body.reviewMetadata === 'object'
				? (body.reviewMetadata as JourneyRevisionDryRunRequest['reviewMetadata'])
				: undefined,
	};
}

export async function POST(request: NextRequest) {
	const guard = await enforceAdminWrite(request);
	if (!guard.ok) return guard.response;

	try {
		const body = (await request.json()) as Record<string, unknown>;
		const parsed = parseDryRunBody(body);
		const result = await dryRunJourneyRevision(parsed);
		return NextResponse.json({ ok: true, ...result });
	} catch (error) {
		if (error instanceof Error && error.message === 'Invalid operation') {
			return NextResponse.json(
				{ ok: false, error: 'JOURNEY_REVISION_INVALID_REQUEST', message: 'Invalid operation.' },
				{ status: 400 }
			);
		}
		return journeyRevisionErrorResponse(error);
	}
}
