import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const migrationPath = path.join(
	root,
	'database/migrations/021_create_admin_sessions.sql'
);

describe('migration 021_create_admin_sessions', () => {
	const sql = readFileSync(migrationPath, 'utf8');

	it('creates admin_sessions with token_hash only (no raw token column)', () => {
		expect(sql).toContain('CREATE TABLE IF NOT EXISTS admin_sessions');
		expect(sql).toContain('token_hash');
		expect(sql).not.toMatch(/raw_token|session_token[^_]/i);
	});

	it('indexes user_id and enforces unique token_hash', () => {
		expect(sql).toContain('idx_admin_sessions_user_id');
		expect(sql).toContain('token_hash VARCHAR(64) NOT NULL UNIQUE');
	});

	it('references users with cascade delete', () => {
		expect(sql).toContain('REFERENCES users(id) ON DELETE CASCADE');
	});

	it('does not modify articles content', () => {
		expect(sql).not.toContain('articles');
	});
});
