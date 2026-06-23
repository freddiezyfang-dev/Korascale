import type { Article } from '@/types/article';

import { getAuthenticatedUser } from './session.server';

export async function isAuthenticatedAdmin(): Promise<boolean> {
	const user = await getAuthenticatedUser();
	return Boolean(user?.isAdmin);
}

export function filterArticlesForPublicRead<T extends { status?: Article['status'] }>(
	articles: T[],
	allowAll: boolean
): T[] {
	if (allowAll) return articles;
	return articles.filter((article) => article.status === 'active');
}
