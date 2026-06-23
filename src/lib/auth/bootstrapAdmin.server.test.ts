import { describe, expect, it } from 'vitest';

import {
	bootstrapAdminUser,
	normalizeAdminEmail,
	validateAdminPassword,
} from './bootstrapAdmin.server';

describe('bootstrapAdmin.server', () => {
	it('normalizes email', () => {
		expect(normalizeAdminEmail(' Admin@KoraScale.com ')).toBe('admin@korascale.com');
	});

	it('rejects short passwords', () => {
		expect(validateAdminPassword('short')).toMatch(/12/);
	});

	it('rejects blank passwords', () => {
		expect(validateAdminPassword('   ')).toMatch(/empty/i);
	});
});

describe('bootstrapAdmin.server database writes', () => {
	it('creates admin when user does not exist', async () => {
		const queries: string[] = [];
		const pool = {
			connect: async () => ({
				query: async (sql: string, _params?: unknown[]) => {
					queries.push(sql);
					if (sql.includes('SELECT id FROM users')) {
						return { rows: [] };
					}
					return { rows: [] };
				},
				release: () => undefined,
			}),
		};

		const result = await bootstrapAdminUser(
			pool as never,
			'admin@korascale.com',
			'secure-password-123'
		);
		expect(result.action).toBe('created');
		expect(result.role).toBe('admin');
		expect(queries.some((sql) => sql.includes('INSERT INTO users'))).toBe(true);
		expect(JSON.stringify(queries)).not.toMatch(/secure-password-123/);
	});

	it('updates password_hash and role for existing user', async () => {
		const queries: string[] = [];
		const pool = {
			connect: async () => ({
				query: async (sql: string) => {
					queries.push(sql);
					if (sql.includes('SELECT id FROM users')) {
						return { rows: [{ id: 'existing-id' }] };
					}
					return { rows: [] };
				},
				release: () => undefined,
			}),
		};

		const result = await bootstrapAdminUser(
			pool as never,
			'admin@korascale.com',
			'another-secure-password-99'
		);
		expect(result.action).toBe('updated');
		expect(queries.some((sql) => sql.includes('UPDATE users'))).toBe(true);
	});
});
