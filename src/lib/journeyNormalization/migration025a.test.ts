import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationsDir = join(process.cwd(), 'database/migrations');
const pendingDir = join(migrationsDir, 'pending');

function stripSqlComments(sql: string): string {
	return sql
		.split('\n')
		.filter((line) => !line.trim().startsWith('--'))
		.join('\n');
}

describe('migration 025a expand', () => {
	it('only adds nullable columns without UPDATE', () => {
		const sql = readFileSync(
			join(migrationsDir, '025a_journey_normalization_expand.sql'),
			'utf8'
		);
		expect(sql).toContain('ADD COLUMN IF NOT EXISTS');
		expect(sql).toContain('seo_complete');
		expect(sql).not.toMatch(/\bUPDATE\s+journeys\b/i);
		expect(sql).not.toContain('journeys_status_check');
		expect(sql).not.toContain('NOT NULL DEFAULT false');
	});

	it('documents prerequisite and abort conditions', () => {
		const sql = readFileSync(
			join(migrationsDir, '025a_journey_normalization_expand.sql'),
			'utf8'
		);
		expect(sql).toContain('PREREQUISITE');
		expect(sql).toContain('ABORT');
		expect(sql).toContain('ROLLBACK');
	});
});

describe('migration 025b1 status backfill (pending/)', () => {
	it('uses manifest-scoped inactive to archived update only', () => {
		const sql = readFileSync(
			join(pendingDir, '025b1_journey_status_backfill.sql'),
			'utf8'
		);
		expect(sql).toContain('Manifest target IDs');
		expect(sql).toContain("status = 'inactive'");
		expect(sql).toContain("SET status = 'archived'");
		expect(stripSqlComments(sql)).not.toMatch(/\bslug\s*=/i);
	});

	it('rollback restores manifest IDs only and preserves non-manifest archived rows', () => {
		const sql = readFileSync(
			join(pendingDir, '025b1_journey_status_backfill.rollback.sql'),
			'utf8'
		);
		expect(sql).toContain('pr_j2b1_manifest');
		expect(sql).toContain('non_manifest_archived_before');
		expect(sql).not.toContain('expected 0 archived');
	});
});

describe('migration 025b backfill (pending/)', () => {
	it('includes row count guards and skips manual review id', () => {
		const sql = readFileSync(
			join(pendingDir, '025b_journey_normalization_backfill.sql'),
			'utf8'
		);
		expect(sql).toContain("status = 'inactive'");
		expect(sql).toContain('e468b842-7c59-4258-8d56-8b585566be82');
	});

	it('does not add constraints or auto-set seo_complete', () => {
		const sql = readFileSync(
			join(pendingDir, '025b_journey_normalization_backfill.sql'),
			'utf8'
		);
		expect(sql).not.toContain('ADD CONSTRAINT journeys_status_check');
		expect(stripSqlComments(sql)).not.toMatch(/\bseo_complete\s*=/i);
	});
});

describe('migration 025c constraints (pending/)', () => {
	it('adds CHECK constraints only', () => {
		const sql = readFileSync(
			join(pendingDir, '025c_journey_normalization_constraints.sql'),
			'utf8'
		);
		expect(sql).toContain('journeys_status_check');
		expect(sql).not.toMatch(/\bUPDATE\s+journeys\b/i);
	});
});
