import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
	evaluateStatusConstraintPreflight,
	isExpectedJourneysStatusCheckDefinition,
	migration025c1ForwardHasRequiredGuards,
	migration025c1RollbackOnlyDropsConstraint,
	migrationSqlModifiesJourneyRows,
	statusDefaultIsDraft,
} from '@/lib/journeyNormalization/statusConstraint025c1';
import { isJourneyPublished } from '@/lib/journeyNormalization/published';
import { shouldIncludeJourneyInSitemap } from '@/lib/journeyNormalization/sitemap';
import {
	buildPublicStatusWhereClause,
	isPublicJourneyStatusStrict,
} from '@/lib/journeyNormalization/status';
import {
	normalizeJourneyStatusForWrite,
	validateJourneyStatusForApiWrite,
} from '@/lib/journeyNormalization/write';

const pendingDir = join(process.cwd(), 'database/migrations/pending');

const forwardSql = readFileSync(
	join(pendingDir, '025c1_journey_status_constraints.sql'),
	'utf8'
);
const rollbackSql = readFileSync(
	join(pendingDir, '025c1_journey_status_constraints.rollback.sql'),
	'utf8'
);

function productionShapeRows() {
	return {
		activeIds: Array.from({ length: 24 }, (_, i) => `active-${i}`),
		archivedIds: Array.from({ length: 59 }, (_, i) => `archived-${i}`),
	};
}

describe('PR-J2C2 025C1 status CHECK semantics', () => {
	it('1. draft passes writer normalization', () => {
		expect(normalizeJourneyStatusForWrite('draft')).toBe('draft');
		expect(validateJourneyStatusForApiWrite('draft').ok).toBe(true);
	});

	it('2. active passes writer normalization', () => {
		expect(normalizeJourneyStatusForWrite('active')).toBe('active');
	});

	it('3. archived passes writer normalization', () => {
		expect(normalizeJourneyStatusForWrite('archived')).toBe('archived');
	});

	it('4. inactive is rejected at writer layer (mapped to archived)', () => {
		expect(normalizeJourneyStatusForWrite('inactive')).toBe('archived');
		expect(normalizeJourneyStatusForWrite('inactive')).not.toBe('inactive');
	});

	it('5. empty string defaults to draft, not empty status', () => {
		expect(normalizeJourneyStatusForWrite('', 'draft')).toBe('draft');
	});

	it('6. NULL maps to draft default before DB', () => {
		expect(normalizeJourneyStatusForWrite(null, 'draft')).toBe('draft');
	});

	it('7. status default remains draft in schema expectation', () => {
		expect(statusDefaultIsDraft("'draft'::character varying")).toBe(true);
		expect(statusDefaultIsDraft('draft')).toBe(true);
	});

	it('8. forward migration does not UPDATE or DELETE journeys', () => {
		expect(migrationSqlModifiesJourneyRows(forwardSql)).toBe(false);
	});

	it('9-10. migration guards preserve active/archived counts', () => {
		expect(forwardSql).toContain('active_count <> 24');
		expect(forwardSql).toContain('archived_count <> 59');
		expect(forwardSql).toContain('post-check: row counts changed');
	});

	it('11. rollback only drops constraint and NOT NULL', () => {
		expect(migration025c1RollbackOnlyDropsConstraint(rollbackSql)).toBe(true);
		expect(rollbackSql).toContain('DROP CONSTRAINT journeys_status_check');
		expect(rollbackSql).toContain('DROP NOT NULL');
	});

	it('12. rollback does not modify journey data', () => {
		expect(migrationSqlModifiesJourneyRows(rollbackSql)).toBe(false);
	});

	it('13. forward migration aborts when already applied', () => {
		expect(forwardSql).toContain('025C1_ALREADY_APPLIED');
	});

	it('14. forward migration aborts on mismatched existing constraint', () => {
		expect(forwardSql).toContain('unexpected definition');
		expect(forwardSql).not.toContain('DROP CONSTRAINT IF EXISTS');
	});

	it('15. 025C2 files are not part of this PR', () => {
		expect(() =>
			readFileSync(join(pendingDir, '025c2_journey_optional_field_constraints.sql'), 'utf8')
		).toThrow();
	});

	it('16. public Journey count remains 24 under strict mode', () => {
		const rows = [
			...productionShapeRows().activeIds.map((id) => ({ status: 'active', id })),
			...productionShapeRows().archivedIds.map((id) => ({ status: 'archived', id })),
		];
		expect(rows.filter((r) => isPublicJourneyStatusStrict(r.status))).toHaveLength(24);
	});

	it('17. sitemap inclusion remains 24', () => {
		const rows = [
			...productionShapeRows().activeIds.map((id) => ({ status: 'active', slug: id })),
			...productionShapeRows().archivedIds.map((id) => ({ status: 'archived', slug: id })),
		];
		expect(
			rows.filter((r) => shouldIncludeJourneyInSitemap({ status: r.status, slug: r.slug }))
				.length
		).toBe(24);
	});

	it('18. archived/draft would not be published (Admin can still store them)', () => {
		expect(isJourneyPublished('archived')).toBe(false);
		expect(isJourneyPublished('draft')).toBe(false);
		expect(normalizeJourneyStatusForWrite('archived')).toBe('archived');
		expect(normalizeJourneyStatusForWrite('draft')).toBe('draft');
	});
});

describe('PR-J2C2 preflight evaluation', () => {
	const baseInput = {
		databaseIdentity: 'masked/neondb',
		total: 83,
		active: 24,
		archived: 59,
		draft: 0,
		inactive: 0,
		nullStatus: 0,
		illegalStatuses: 0,
		statusDefault: "'draft'::character varying",
		statusNullable: true,
		existingConstraint: false,
		existingConstraintDefinition: null,
		publicStrictModeReady: buildPublicStatusWhereClause() === "status = 'active'",
		allWritersReady: true,
	};

	it('ready=true when baseline matches', () => {
		const result = evaluateStatusConstraintPreflight(baseInput);
		expect(result.ready).toBe(true);
		expect(result.alreadyApplied).toBe(false);
	});

	it('noActionRequired when constraint already applied', () => {
		const result = evaluateStatusConstraintPreflight({
			...baseInput,
			statusNullable: false,
			existingConstraint: true,
			existingConstraintDefinition:
				"CHECK ((status)::text = ANY (ARRAY['draft'::text, 'active'::text, 'archived'::text]))",
		});
		expect(result.alreadyApplied).toBe(true);
		expect(result.noActionRequired).toBe(true);
		expect(result.ready).toBe(false);
	});

	it('ready=false when illegal statuses exist', () => {
		const result = evaluateStatusConstraintPreflight({
			...baseInput,
			illegalStatuses: 1,
		});
		expect(result.ready).toBe(false);
		expect(result.blockers.length).toBeGreaterThan(0);
	});

	it('recognizes canonical CHECK definitions', () => {
		expect(
			isExpectedJourneysStatusCheckDefinition(
				"CHECK (status IN ('draft', 'active', 'archived'))"
			)
		).toBe(true);
	});
});

describe('PR-J2C2 safety gates', () => {
	it('forward migration has required guards and fixed constraint name', () => {
		const executable = forwardSql
			.split('\n')
			.filter((line) => !line.trim().startsWith('--'))
			.join('\n');
		expect(migration025c1ForwardHasRequiredGuards(forwardSql)).toBe(true);
		expect(forwardSql).toContain('journeys_status_check');
		expect(executable).not.toMatch(/\b025c2\b/i);
		expect(executable).not.toContain('journey_type_slug');
		expect(executable).not.toContain('currency');
		expect(executable).not.toContain('price_basis');
	});
});
