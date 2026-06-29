import { NextResponse } from 'next/server';

import type { JourneyPublishGateResult } from './journeyPublishIntegrityGate.server';

export function journeyPublishIntegrityJsonResponse(
	gate: Extract<JourneyPublishGateResult, { ok: false }>
) {
	return NextResponse.json(gate.body, { status: gate.status });
}
