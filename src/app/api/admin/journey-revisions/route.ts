import { NextRequest, NextResponse } from 'next/server';

import { enforceAdminRead, enforceAdminWrite } from '@/lib/auth/requireAdmin.server';
import { createJourneyRevision, listJourneyRevisionsForAdmin } from '@/lib/journeyRevisions/dryRun.server';
import { isValidRevisionOperation, isValidRevisionStatus } from '@/lib/journeyRevisions/stateMachine';
import type { JourneyRevisionDryRunRequest, JourneyRevisionStatus } from '@/lib/journeyRevisions/types';

import { journeyRevisionErrorResponse } from './_lib/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LIST_STATUSES = new Set<JourneyRevisionStatus>([
	'draft',
	'pending_review',
	'published',
	'rejected',
	'superseded',
]);

export async function GET(request: NextRequest) {
	const guard = await enforceAdminRead();
	if (!guard.ok) return guard.response;

	try {
		const { searchParams } = new URL(request.url);
		const statusParam = searchParams.get('status') ?? 'pending_review';
		const status = LIST_STATUSES.has(statusParam as JourneyRevisionStatus)
			? (statusParam as JourneyRevisionStatus)
			: 'pending_review';
		const journeyId = searchParams.get('journeyId') ?? undefined;
		const slug = searchParams.get('slug') ?? undefined;
		const sort = searchParams.get('sort') === 'createdAtDesc' ? 'createdAtDesc' : 'createdAt';

		const revisions = await listJourneyRevisionsForAdmin({ status, journeyId, slug, sort });
		return NextResponse.json({ ok: true, revisions });
	} catch (error) {
		return journeyRevisionErrorResponse(error);
	}
}

export async function POST(request: NextRequest) {
	const guard = await enforceAdminWrite(request);
	if (!guard.ok) return guard.response;

	try {
		const body = (await request.json()) as Record<string, unknown>;
		const operation = body.operation;
		if (!isValidRevisionOperation(operation)) {
			return NextResponse.json(
				{ ok: false, error: 'JOURNEY_REVISION_INVALID_REQUEST', message: 'Invalid operation.' },
				{ status: 400 }
			);
		}

		const parsed: JourneyRevisionDryRunRequest = {
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

		const result = await createJourneyRevision({
			request: parsed,
			createdBy: guard.user.email || guard.user.id,
		});

		return NextResponse.json({ ok: true, ...result });
	} catch (error) {
		return journeyRevisionErrorResponse(error);
	}
}
