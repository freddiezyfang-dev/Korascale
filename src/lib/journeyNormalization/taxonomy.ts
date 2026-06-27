import {
	JOURNEY_TYPE_LABEL_TO_SLUG,
	JOURNEY_TYPE_LABELS,
	JOURNEY_TYPES,
	type JourneyTypeSlug,
} from './constants';
import type { JourneyRowLike, TypeProposal } from './types';

export function isJourneyTypeSlug(value: unknown): value is JourneyTypeSlug {
	return typeof value === 'string' && (JOURNEY_TYPES as readonly string[]).includes(value);
}

export function normalizeJourneyTypeSlug(raw: unknown): JourneyTypeSlug | null {
	if (typeof raw !== 'string') return null;
	const trimmed = raw.trim();
	if (!trimmed) return null;

	if (isJourneyTypeSlug(trimmed)) return trimmed;

	const underscored = trimmed.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
	if (isJourneyTypeSlug(underscored)) return underscored;

	const fromLabel = JOURNEY_TYPE_LABEL_TO_SLUG[trimmed];
	if (fromLabel) return fromLabel;

	return null;
}

export function journeyTypeSlugToLabel(slug: JourneyTypeSlug): string {
	return JOURNEY_TYPE_LABELS[slug];
}

export function validateJourneyType(value: unknown): {
	valid: boolean;
	slug: JourneyTypeSlug | null;
	issue?: string;
} {
	const slug = normalizeJourneyTypeSlug(value);
	if (slug) return { valid: true, slug };

	if (value == null || String(value).trim() === '') {
		return { valid: false, slug: null, issue: 'null_type' };
	}

	return { valid: false, slug: null, issue: `illegal_type:${String(value).trim()}` };
}

export function proposeJourneyType(row: JourneyRowLike): TypeProposal {
	const data =
		row.data && typeof row.data === 'object'
			? (row.data as Record<string, unknown>)
			: {};
	const currentRaw =
		(typeof row.journey_type === 'string' && row.journey_type.trim()) ||
		(typeof data.journeyType === 'string' && data.journeyType.trim()) ||
		null;

	if (!currentRaw) {
		return {
			current: null,
			proposed: null,
			confidence: 'manual_review',
			evidence: 'Missing journey_type in column and JSONB',
		};
	}

	const fromLabel = JOURNEY_TYPE_LABEL_TO_SLUG[currentRaw];
	if (fromLabel) {
		return {
			current: currentRaw,
			proposed: fromLabel,
			confidence: 'high',
			evidence: `Known label maps to ${fromLabel}`,
		};
	}

	const fromSlug = normalizeJourneyTypeSlug(currentRaw);
	if (fromSlug) {
		return {
			current: currentRaw,
			proposed: fromSlug,
			confidence: 'high',
			evidence: `Normalized slug value ${fromSlug}`,
		};
	}

	return {
		current: currentRaw,
		proposed: null,
		confidence: 'manual_review',
		evidence: `Unrecognized journey type: ${currentRaw}`,
	};
}

export { JOURNEY_TYPES };
