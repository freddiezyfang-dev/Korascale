import { beforeEach, describe, expect, it, vi } from 'vitest';

import { exportContentCatalog } from './exportCatalog';

const mockQuery = vi.fn();

vi.mock('@/lib/db', () => ({
	query: (...args: unknown[]) => mockQuery(...args),
}));

vi.mock('node:fs/promises', () => ({
	default: {
		mkdir: vi.fn().mockResolvedValue(undefined),
		writeFile: vi.fn().mockResolvedValue(undefined),
	},
}));

describe('exportContentCatalog', () => {
	beforeEach(() => {
		mockQuery.mockReset();
		mockQuery
			.mockResolvedValueOnce({
				rows: [
					{
						id: '11111111-1111-4111-8111-111111111111',
						slug: 'sample',
						title: 'Sample',
						category: 'China Travel Planning',
					},
				],
			})
			.mockResolvedValueOnce({
				rows: [
					{
						id: '22222222-2222-4222-8222-222222222222',
						slug: 'journey-one',
						title: 'Journey One',
						journey_type: 'Deep Discovery',
					},
				],
			});
	});

	it('exports active articles and journeys without sensitive fields', async () => {
		const catalog = await exportContentCatalog('/tmp/catalog.json');
		expect(catalog.activeArticles).toHaveLength(1);
		expect(catalog.activeJourneys).toHaveLength(1);
		expect(catalog.activeArticles[0]).toEqual({
			id: '11111111-1111-4111-8111-111111111111',
			slug: 'sample',
			title: 'Sample',
			category: 'China Travel Planning',
		});
		expect(catalog.activeJourneys[0].type).toBe('Deep Discovery');
		expect(mockQuery).toHaveBeenCalledTimes(2);
		const articleSql = String(mockQuery.mock.calls[0][0]);
		expect(articleSql).toContain('SELECT');
		expect(articleSql).not.toMatch(/UPDATE|INSERT|DELETE/i);
	});
});
