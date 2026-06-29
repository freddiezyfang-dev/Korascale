import { NextResponse } from 'next/server';

import { buildJourneySlugConflictBody } from './journeySlugConflictConstants';

export function journeySlugConflictJsonResponse() {
	return NextResponse.json(buildJourneySlugConflictBody(), { status: 409 });
}
