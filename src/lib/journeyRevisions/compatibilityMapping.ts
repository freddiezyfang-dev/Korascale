import { JOURNEY_TYPE_LABELS } from '@/lib/journeyNormalization/constants';
import { journeyTypeLabelToSlug } from '@/lib/journeyNormalization/write';

import type { JourneyRevisionSnapshot } from './types';

export const REVISION_COMPATIBILITY_SYNC_KEYS = [
	'data.pageTitle',
	'data.metaDescription',
	'data.heroImage',
	'data.heroAlt',
	'data.heroImageAlt',
	'data.journeyType',
] as const;

function pickStr(...vals: unknown[]): string {
	for (const v of vals) {
		if (typeof v === 'string' && v.trim()) return v.trim();
	}
	return '';
}

function deepCloneJson<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

export function journeyTypeCompatibilityLabel(snapshot: JourneyRevisionSnapshot): string {
	const slug =
		pickStr(snapshot.journey_type_slug) ||
		journeyTypeLabelToSlug(snapshot.journey_type) ||
		'';
	return (
		(slug ? JOURNEY_TYPE_LABELS[slug as keyof typeof JOURNEY_TYPE_LABELS] : undefined) ||
		pickStr(snapshot.journey_type)
	);
}

export function buildRevisionJsonbCompatibilityMap(
	snapshot: JourneyRevisionSnapshot
): Record<string, string> {
	const journeyType = journeyTypeCompatibilityLabel(snapshot);
	return {
		pageTitle: snapshot.page_title,
		metaDescription: snapshot.meta_description,
		heroImage: snapshot.hero_image_url,
		heroAlt: snapshot.hero_image_alt,
		heroImageAlt: snapshot.hero_image_alt,
		journeyType,
	};
}

export function canonicalizeJourneyRevisionProposedSnapshot(
	snapshot: JourneyRevisionSnapshot
): JourneyRevisionSnapshot {
	const next = deepCloneJson(snapshot);
	next.journey_type = journeyTypeCompatibilityLabel(next);
	next.data = {
		...next.data,
		...buildRevisionJsonbCompatibilityMap(next),
	};
	return next;
}

export function detectRevisionSnapshotCompatibilityMismatches(
	snapshot: JourneyRevisionSnapshot
): Array<{ field: string; expected: string; actual: unknown }> {
	const expected = buildRevisionJsonbCompatibilityMap(snapshot);
	const data = snapshot.data ?? {};
	const mismatches: Array<{ field: string; expected: string; actual: unknown }> = [];
	for (const [key, expectedValue] of Object.entries(expected)) {
		if (data[key] !== expectedValue) {
			mismatches.push({
				field: `data.${key}`,
				expected: expectedValue,
				actual: data[key] ?? null,
			});
		}
	}
	return mismatches;
}
