import {
	buildJourneyDualWritePayload,
	isJourneyExpandedColumnsEnabled,
	mergeExpandedColumnSql,
} from './write';

export type HeroAltApplyEvaluation = {
	approvedAlt: string;
	jsonbHeroAlt: string;
	jsonbHeroImageAlt: string;
	columnHeroImageAlt: string;
	jsonbMatches: boolean;
	columnMatches: boolean;
	skip: boolean;
	updateJsonb: boolean;
	updateColumn: boolean;
};

export function normalizeHeroAltValue(value: unknown): string {
	if (value == null) return '';
	return String(value).trim();
}

/** Target-aware skip: JSONB and column are evaluated independently when flag is on. */
export function evaluateHeroAltApplyTargets(input: {
	approvedAlt: string;
	dataHeroAlt: unknown;
	dataHeroImageAlt: unknown;
	columnHeroImageAlt: unknown;
	expandedColumnsEnabled?: boolean;
}): HeroAltApplyEvaluation {
	const approvedAlt = normalizeHeroAltValue(input.approvedAlt);
	const jsonbHeroAlt = normalizeHeroAltValue(input.dataHeroAlt);
	const jsonbHeroImageAlt = normalizeHeroAltValue(input.dataHeroImageAlt);
	const columnHeroImageAlt = normalizeHeroAltValue(input.columnHeroImageAlt);
	const expandedColumnsEnabled =
		input.expandedColumnsEnabled ?? isJourneyExpandedColumnsEnabled();

	const jsonbMatches =
		jsonbHeroAlt === approvedAlt && jsonbHeroImageAlt === approvedAlt;
	const columnMatches =
		!expandedColumnsEnabled || columnHeroImageAlt === approvedAlt;
	const skip = jsonbMatches && columnMatches;

	return {
		approvedAlt,
		jsonbHeroAlt,
		jsonbHeroImageAlt,
		columnHeroImageAlt,
		jsonbMatches,
		columnMatches,
		skip,
		updateJsonb: !jsonbMatches,
		updateColumn: expandedColumnsEnabled && !columnMatches,
	};
}

export type HeroAltApplyUpdatePlan = {
	evaluation: HeroAltApplyEvaluation;
	sql: string;
	values: unknown[];
	reason: string;
};

export function buildHeroAltApplyUpdatePlan(input: {
	existingData: Record<string, unknown>;
	approvedAlt: string;
	columnHeroImageAlt?: unknown;
	expandedColumnsEnabled?: boolean;
	paramIndexStart?: number;
}): HeroAltApplyUpdatePlan | null {
	const evaluation = evaluateHeroAltApplyTargets({
		approvedAlt: input.approvedAlt,
		dataHeroAlt: input.existingData.heroAlt,
		dataHeroImageAlt: input.existingData.heroImageAlt,
		columnHeroImageAlt: input.columnHeroImageAlt,
		expandedColumnsEnabled: input.expandedColumnsEnabled,
	});

	if (evaluation.skip) return null;

	const dualWrite = buildJourneyDualWritePayload({
		heroAlt: evaluation.approvedAlt,
	});

	const updateFields: string[] = ['updated_at = NOW()'];
	const updateValues: unknown[] = [];
	let paramIndex = input.paramIndexStart ?? 1;

	if (evaluation.updateJsonb) {
		const mergedData = { ...input.existingData, ...dualWrite.jsonb };
		updateFields.unshift(`data = $${paramIndex++}`);
		updateValues.push(JSON.stringify(mergedData));
	}

	if (evaluation.updateColumn) {
		const expandedMerge = mergeExpandedColumnSql(
			dualWrite.expandedColumns,
			paramIndex
		);
		updateFields.push(...expandedMerge.fields);
		updateValues.push(...expandedMerge.values);
		paramIndex = expandedMerge.nextIndex;
	}

	const reasons: string[] = [];
	if (evaluation.updateJsonb) reasons.push('jsonb');
	if (evaluation.updateColumn) reasons.push('column');

	return {
		evaluation,
		sql: `UPDATE journeys SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
		values: updateValues,
		reason: reasons.join('+'),
	};
}

export type HeroAltApplySummary = {
	jsonbMatched: number;
	columnMatched: number;
	columnMissing: number;
	wouldUpdate: number;
	skipped: number;
	updatedJsonb: number;
	updatedColumn: number;
	missing: number;
};

export function createHeroAltApplySummary(): HeroAltApplySummary {
	return {
		jsonbMatched: 0,
		columnMatched: 0,
		columnMissing: 0,
		wouldUpdate: 0,
		skipped: 0,
		updatedJsonb: 0,
		updatedColumn: 0,
		missing: 0,
	};
}

export function recordHeroAltApplyEvaluation(
	summary: HeroAltApplySummary,
	evaluation: HeroAltApplyEvaluation
): void {
	if (evaluation.jsonbMatches) summary.jsonbMatched++;
	if (evaluation.columnMatches) summary.columnMatched++;
	if (evaluation.updateColumn) summary.columnMissing++;
	if (evaluation.skip) summary.skipped++;
	else summary.wouldUpdate++;
}
