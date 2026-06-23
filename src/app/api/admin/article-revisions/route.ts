import { NextRequest, NextResponse } from 'next/server';

import { enforceAdminRead } from '@/lib/auth/requireAdmin.server';
import {
	countPendingRevisionsByArticle,
	listArticleRevisions,
} from '@/lib/seo/revisionAdmin.server';
import type { ArticleRevisionStatus } from '@/lib/seo/types';

import { revisionAdminErrorResponse } from './_lib/responses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_STATUSES = new Set<ArticleRevisionStatus>([
	'pending',
	'published',
	'rejected',
	'superseded',
]);

export async function GET(request: NextRequest) {
	const guard = await enforceAdminRead();
	if (!guard.ok) return guard.response;

	try {
		const { searchParams } = new URL(request.url);
		const statusParam = searchParams.get('status') ?? 'pending';
		const status = VALID_STATUSES.has(statusParam as ArticleRevisionStatus)
			? (statusParam as ArticleRevisionStatus)
			: 'pending';
		const articleId = searchParams.get('articleId') ?? undefined;
		const slug = searchParams.get('slug') ?? undefined;
		const sort = searchParams.get('sort') === 'createdAtDesc' ? 'createdAtDesc' : 'createdAt';
		const includeCounts = searchParams.get('includeCounts') === '1';

		const revisions = await listArticleRevisions({ status, articleId, slug, sort });
		const pendingCounts = includeCounts ? await countPendingRevisionsByArticle() : undefined;

		return NextResponse.json({
			ok: true,
			revisions,
			...(pendingCounts ? { pendingCountsByArticle: pendingCounts } : {}),
		});
	} catch (error) {
		return revisionAdminErrorResponse(error);
	}
}
