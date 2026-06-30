import { NextResponse } from 'next/server';

import { JourneyRevisionError } from '@/lib/journeyRevisions/errors';

export function journeyRevisionErrorResponse(error: unknown) {
	if (error instanceof JourneyRevisionError) {
		return NextResponse.json(
			{
				ok: false,
				error: error.code,
				message: error.message,
				fields: error.fields.length ? error.fields : undefined,
			},
			{ status: error.status }
		);
	}

	console.error('[journey-revisions]', error);
	return NextResponse.json(
		{ ok: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
		{ status: 500 }
	);
}
