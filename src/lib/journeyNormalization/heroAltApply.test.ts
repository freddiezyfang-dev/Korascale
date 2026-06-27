import { afterEach, describe, expect, it } from 'vitest';

import {
	buildHeroAltApplyUpdatePlan,
	evaluateHeroAltApplyTargets,
} from '@/lib/journeyNormalization/heroAltApply';

describe('evaluateHeroAltApplyTargets', () => {
	const originalFlag = process.env.JOURNEY_NORMALIZATION_COLUMNS;

	afterEach(() => {
		if (originalFlag === undefined) {
			delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		} else {
			process.env.JOURNEY_NORMALIZATION_COLUMNS = originalFlag;
		}
	});

	it('flag off: skips when JSONB heroAlt and heroImageAlt both match', () => {
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		const result = evaluateHeroAltApplyTargets({
			approvedAlt: 'Approved alt',
			dataHeroAlt: 'Approved alt',
			dataHeroImageAlt: 'Approved alt',
			columnHeroImageAlt: null,
		});

		expect(result.skip).toBe(true);
		expect(result.updateJsonb).toBe(false);
		expect(result.updateColumn).toBe(false);
		expect(result.columnMatches).toBe(true);
	});

	it('flag off: updates JSONB when heroImageAlt is missing', () => {
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		const result = evaluateHeroAltApplyTargets({
			approvedAlt: 'Approved alt',
			dataHeroAlt: 'Approved alt',
			dataHeroImageAlt: '',
			columnHeroImageAlt: null,
		});

		expect(result.skip).toBe(false);
		expect(result.updateJsonb).toBe(true);
		expect(result.updateColumn).toBe(false);
	});

	it('flag on: does not skip when JSONB matches but column is empty', () => {
		process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';
		const result = evaluateHeroAltApplyTargets({
			approvedAlt: 'Approved alt',
			dataHeroAlt: 'Approved alt',
			dataHeroImageAlt: 'Approved alt',
			columnHeroImageAlt: null,
			expandedColumnsEnabled: true,
		});

		expect(result.jsonbMatches).toBe(true);
		expect(result.columnMatches).toBe(false);
		expect(result.skip).toBe(false);
		expect(result.updateJsonb).toBe(false);
		expect(result.updateColumn).toBe(true);
	});

	it('flag on: skips only when JSONB and column both match', () => {
		process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';
		const result = evaluateHeroAltApplyTargets({
			approvedAlt: 'Approved alt',
			dataHeroAlt: 'Approved alt',
			dataHeroImageAlt: 'Approved alt',
			columnHeroImageAlt: 'Approved alt',
			expandedColumnsEnabled: true,
		});

		expect(result.skip).toBe(true);
		expect(result.updateJsonb).toBe(false);
		expect(result.updateColumn).toBe(false);
	});
});

describe('buildHeroAltApplyUpdatePlan', () => {
	const originalFlag = process.env.JOURNEY_NORMALIZATION_COLUMNS;

	afterEach(() => {
		if (originalFlag === undefined) {
			delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		} else {
			process.env.JOURNEY_NORMALIZATION_COLUMNS = originalFlag;
		}
	});

	it('flag on with JSONB already synced updates column only', () => {
		process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';
		const plan = buildHeroAltApplyUpdatePlan({
			existingData: {
				heroAlt: 'Approved alt',
				heroImageAlt: 'Approved alt',
				other: 'keep',
			},
			columnHeroImageAlt: null,
			approvedAlt: 'Approved alt',
			expandedColumnsEnabled: true,
		});

		expect(plan).not.toBeNull();
		expect(plan?.reason).toBe('column');
		expect(plan?.sql).toContain('hero_image_alt = $1');
		expect(plan?.sql).not.toContain('data =');
		expect(plan?.values).toEqual(['Approved alt']);
	});

	it('flag off updates JSONB only', () => {
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		const plan = buildHeroAltApplyUpdatePlan({
			existingData: { title: 'Journey' },
			approvedAlt: 'Approved alt',
		});

		expect(plan).not.toBeNull();
		expect(plan?.reason).toBe('jsonb');
		expect(plan?.sql).toContain('data = $1');
		expect(plan?.sql).not.toContain('hero_image_alt');
		const merged = JSON.parse(String(plan?.values[0]));
		expect(merged.heroAlt).toBe('Approved alt');
		expect(merged.heroImageAlt).toBe('Approved alt');
		expect(merged.title).toBe('Journey');
	});
});
