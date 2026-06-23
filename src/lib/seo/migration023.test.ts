import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const migrationSql = fs.readFileSync(
	path.join(process.cwd(), 'database/migrations/023_add_articles_cta_config.sql'),
	'utf8'
);

describe('articles cta_config migration 023', () => {
	it('adds cta_config JSONB with default empty object', () => {
		expect(migrationSql).toMatch(/ADD COLUMN IF NOT EXISTS cta_config JSONB/i);
		expect(migrationSql).toMatch(/DEFAULT\s+'\{\}'::jsonb/i);
		expect(migrationSql).toMatch(/NOT NULL/i);
	});

	it('does not modify article row content', () => {
		expect(migrationSql).not.toMatch(/\bUPDATE\s+articles\b/i);
		expect(migrationSql).not.toMatch(/\bDELETE\s+FROM\s+articles\b/i);
	});
});
