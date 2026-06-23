import { describe, expect, it } from 'vitest';

import { assertWritableDatabaseEnvironment, parseDatabaseEnvironment } from './dbEnvironment';

describe('dbEnvironment', () => {
	it('parses neon development endpoint', () => {
		const env = parseDatabaseEnvironment(
			'postgres://user:secret@ep-morning-bird-adrx3dvv-pooler.c-2.us-east-1.aws.neon.tech/neondb'
		);
		expect(env?.sanitizedEndpoint).toContain('ep-morning-bird-adrx3dvv');
		expect(env?.isProductionLike).toBe(false);
	});

	it('rejects unknown environment when connection string missing', () => {
		expect(() =>
			assertWritableDatabaseEnvironment({ connectionString: undefined })
		).toThrow(/Unable to identify database environment/);
	});

	it('rejects production-like endpoints without override', () => {
		expect(() =>
			assertWritableDatabaseEnvironment({
				connectionString: 'postgres://user:secret@ep-prod-main-pooler.neon.tech/neondb',
			})
		).toThrow(/production/i);
	});

	it('allows production-like endpoints with explicit override', () => {
		const env = assertWritableDatabaseEnvironment({
			connectionString: 'postgres://user:secret@ep-prod-main-pooler.neon.tech/neondb',
			allowProduction: true,
		});
		expect(env.isProductionLike).toBe(true);
	});
});
