import { evaluatePriceCompleteness } from './price';
import { proposeJourneySlug, stripJourneySlugPathPrefix } from './slug';
import { evaluateJourneySeoCompleteness } from './seo';
import { proposeJourneyStatus } from './status';
import { proposeJourneyType } from './taxonomy';
import type { JourneyRowLike, NormalizationPreviewRow } from './types';

export function buildNormalizationPreviewRow(
	row: JourneyRowLike,
	options?: { duplicateCount?: number; takenSlugs?: Set<string>; proposedSlugCounts?: Map<string, number> }
): NormalizationPreviewRow {
	const id = String(row.id ?? '');
	const status = proposeJourneyStatus(row);
	const type = proposeJourneyType(row);
	const slug = proposeJourneySlug(row, options);
	const seo = evaluateJourneySeoCompleteness(row);
	const price = evaluatePriceCompleteness(row);

	const manualReviewRequired =
		status.confidence === 'manual_review' ||
		type.confidence === 'manual_review' ||
		slug.manualReviewRequired;

	const reasons = [
		status.confidence === 'manual_review' ? status.reason : '',
		type.confidence === 'manual_review' ? type.evidence : '',
		slug.manualReviewRequired ? slug.reason : '',
		price.manualReviewRequired ? price.proposedAction : '',
	].filter(Boolean);

	return {
		id,
		currentSlug: slug.current ?? stripJourneySlugPathPrefix(String(row.slug ?? '')),
		proposedSlug: slug.proposed ?? '',
		currentStatus: status.current ?? 'NULL',
		proposedStatus: status.proposed ?? 'MANUAL_REVIEW',
		currentType: type.current ?? '',
		proposedType: type.proposed ?? 'MANUAL_REVIEW',
		seoComplete: seo.complete,
		priceComplete: !price.manualReviewRequired,
		redirectRequired: slug.redirectRequired,
		manualReviewRequired,
		reason: reasons.join(' | ') || 'No changes',
	};
}

export function buildSlugDuplicateMap(rows: JourneyRowLike[]): Map<string, number> {
	const counts = new Map<string, number>();
	for (const row of rows) {
		const slug = stripJourneySlugPathPrefix(String(row.slug ?? ''));
		if (!slug) continue;
		counts.set(slug, (counts.get(slug) ?? 0) + 1);
	}
	return counts;
}
