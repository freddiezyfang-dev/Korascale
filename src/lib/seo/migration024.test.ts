import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const migrationSql = fs.readFileSync(
	path.join(process.cwd(), 'database/migrations/024_add_article_revision_source_updated_at.sql'),
	'utf8'
);
const articlesTableSql = fs.readFileSync(
	path.join(process.cwd(), 'database/migrations/005_create_articles_table.sql'),
	'utf8'
);

describe('article_revisions source_updated_at migration 024', () => {
	it('adds nullable source_updated_at timestamp column', () => {
		expect(migrationSql).toMatch(/ALTER TABLE article_revisions/i);
		expect(migrationSql).toMatch(/source_updated_at TIMESTAMP NULL/i);
	});

	it('uses the same timestamp type as articles.updated_at', () => {
		expect(articlesTableSql).toMatch(/updated_at TIMESTAMP DEFAULT NOW\(\)/i);
		expect(migrationSql).toMatch(/source_updated_at TIMESTAMP NULL/i);
		expect(migrationSql).not.toMatch(/source_updated_at\s+TIMESTAMPTZ/i);
	});

	it('does not modify articles or revision content', () => {
		expect(migrationSql).not.toMatch(/\bUPDATE\b/i);
		expect(migrationSql).not.toMatch(/\bINSERT\b/i);
	});
});
