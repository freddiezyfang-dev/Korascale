import { describe, expect, it } from 'vitest';

import { serializeArticleUpdatedAt } from './sourceTimestamp';

describe('serializeArticleUpdatedAt', () => {
	it('serializes UTC ISO timestamps without dropping milliseconds', () => {
		expect(serializeArticleUpdatedAt(new Date('2026-06-17T08:20:28.796Z'))).toBe(
			'2026-06-17T08:20:28.796Z'
		);
	});

	it.each([null, undefined, '', 'not-a-date'])('rejects invalid timestamp value %j', (value) => {
		expect(() => serializeArticleUpdatedAt(value)).toThrow(/articles\.updated_at/);
	});
});
