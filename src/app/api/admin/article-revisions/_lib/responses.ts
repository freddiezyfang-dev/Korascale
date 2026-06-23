import { NextResponse } from 'next/server';

import { RevisionAdminError } from '@/lib/seo/revisionAdmin.server';

export function revisionAdminErrorResponse(error: unknown) {
	if (error instanceof RevisionAdminError) {
		return NextResponse.json(
			{ ok: false, error: error.code, message: error.message },
			{ status: error.status }
		);
	}

	console.error('[article-revisions]', error);
	return NextResponse.json(
		{ ok: false, error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
		{ status: 500 }
	);
}
