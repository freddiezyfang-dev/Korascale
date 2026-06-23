import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const migrationPath = path.join(
	root,
	'database/migrations/022_create_admin_login_attempts.sql'
);

describe('migration 022_create_admin_login_attempts', () => {
	const sql = readFileSync(migrationPath, 'utf8');

	it('stores hashed identifiers only', () => {
		expect(sql).toContain('identifier_hash');
		expect(sql).toContain('ip_hash');
		expect(sql).not.toContain('ip_address');
		expect(sql).not.toContain('password');
	});

	it('uses composite primary key', () => {
		expect(sql).toContain('PRIMARY KEY (identifier_hash, ip_hash)');
	});

	it('does not modify articles', () => {
		expect(sql).not.toContain('articles');
	});
});
