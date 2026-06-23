import { describe, expect, it } from 'vitest';

import { filterArticlesForPublicRead } from './articleAccess.server';

describe('articleAccess.server', () => {
	it('filters non-active articles for public reads', () => {
		const articles = [
			{ id: '1', status: 'active' as const, title: 'A' },
			{ id: '2', status: 'draft' as const, title: 'B' },
			{ id: '3', status: 'inactive' as const, title: 'C' },
		];
		const filtered = filterArticlesForPublicRead(articles, false);
		expect(filtered).toHaveLength(1);
		expect(filtered[0]?.id).toBe('1');
	});
});
