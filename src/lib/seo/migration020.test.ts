import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const migrationPath = path.join(
	process.cwd(),
	'database',
	'migrations',
	'020_add_article_revision_review_metadata.sql'
);
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

describe('article revisions migration 020', () => {
	it('adds review_metadata JSONB with NOT NULL default', () => {
		expect(migrationSql).toMatch(
			/ADD COLUMN IF NOT EXISTS review_metadata JSONB NOT NULL DEFAULT '\{\}'::jsonb/i
		);
	});

	it('only alters article_revisions and avoids destructive statements', () => {
		expect(migrationSql).toMatch(/\bALTER TABLE article_revisions\b/i);
		expect(migrationSql).not.toMatch(/\bALTER TABLE articles\b/i);
		expect(migrationSql).not.toMatch(/\bDROP\b/i);
		expect(migrationSql).not.toMatch(/\bTRUNCATE\b/i);
		expect(migrationSql).not.toMatch(/\bDELETE\s+FROM\b/i);
		expect(migrationSql).not.toMatch(/\bUPDATE\s+articles\b/i);
	});
});
