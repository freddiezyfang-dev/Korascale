import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const migrationPath = path.join(
	process.cwd(),
	'database',
	'migrations',
	'019_create_article_revisions_table.sql'
);
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

describe('article revisions migration 019', () => {
	it('constrains status to the supported revision lifecycle values', () => {
		expect(migrationSql).toMatch(/status\s+VARCHAR\(20\)\s+NOT NULL\s+DEFAULT\s+'pending'/i);
		expect(migrationSql).toMatch(/CONSTRAINT\s+article_revisions_status_check/i);
		expect(migrationSql).toMatch(
			/CHECK\s*\(\s*status\s+IN\s*\(\s*'pending'\s*,\s*'published'\s*,\s*'rejected'\s*,\s*'superseded'\s*\)\s*\)/i
		);
	});

	it('keeps the migration scoped to revision storage', () => {
		expect(migrationSql).toMatch(
			/article_id\s+UUID\s+NOT NULL\s+REFERENCES\s+articles\s*\(\s*id\s*\)\s+ON\s+DELETE\s+CASCADE/i
		);
		expect(migrationSql).not.toMatch(/\b(?:INSERT|UPDATE|TRUNCATE|DELETE)\s+(?:FROM\s+)?articles\b/i);
		expect(migrationSql).not.toMatch(/\bALTER\s+TABLE\s+articles\b/i);
		expect(migrationSql).not.toMatch(/\bDROP\b/i);
		expect(migrationSql).not.toMatch(/\bTRUNCATE\b/i);
		expect(migrationSql).not.toMatch(/\bDELETE\s+FROM\b/i);
	});
});
