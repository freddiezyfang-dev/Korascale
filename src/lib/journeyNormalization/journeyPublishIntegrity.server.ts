import { query } from '@/lib/db';
import type { JourneyPublishCandidate } from './journeyPublishIntegrity';
import { resolveCanonicalPublishSlug } from './journeyPublishIntegrity';
import {
	buildJourneyDualWritePayload,
	journeyTypeLabelToSlug,
	normalizeJourneyStatusForWrite,
	type JourneyWriteStatus,
} from './write';
import type { Journey } from '@/types';

export type JourneyDbRow = Record<string, unknown>;

function pickString(row: JourneyDbRow, ...keys: string[]): string {
	for (const key of keys) {
		const value = row[key];
		if (typeof value === 'string' && value.trim()) return value.trim();
	}
	return '';
}

export function publishCandidateFromDbRow(row: JourneyDbRow): JourneyPublishCandidate {
	const status = normalizeJourneyStatusForWrite(row.status, 'draft');
	const journeyTypeSlug =
		pickString(row, 'journey_type_slug') ||
		journeyTypeLabelToSlug(row.journey_type) ||
		'';

	return {
		id: typeof row.id === 'string' ? row.id : String(row.id ?? ''),
		title: pickString(row, 'title'),
		slug: pickString(row, 'slug'),
		short_description: pickString(row, 'short_description'),
		page_title: pickString(row, 'page_title'),
		meta_description: pickString(row, 'meta_description'),
		hero_image_url: pickString(row, 'hero_image_url'),
		hero_image_alt: pickString(row, 'hero_image_alt'),
		journey_type_slug: journeyTypeSlug,
		status,
	};
}

export function mergePublishCandidateWithUpdates(
	existing: JourneyPublishCandidate,
	updates: Partial<Journey> & Record<string, unknown>
): JourneyPublishCandidate {
	const dualWrite = buildJourneyDualWritePayload({
		pageTitle: updates.pageTitle as string | undefined,
		metaDescription: updates.metaDescription as string | undefined,
		heroImage: updates.heroImage as string | undefined,
		heroAlt:
			(updates.heroAlt as string | undefined) ??
			(updates.heroImageAlt as string | undefined),
		journeyType: updates.journeyType as string | undefined,
		shortDescription: updates.shortDescription as string | undefined,
	});

	const merged: JourneyPublishCandidate = { ...existing };

	if (updates.title !== undefined) merged.title = String(updates.title ?? '').trim();
	if ((updates as { slug?: string }).slug !== undefined) {
		merged.slug = String((updates as { slug?: string }).slug ?? '').trim();
	}
	if (updates.shortDescription !== undefined) {
		merged.short_description = String(updates.shortDescription ?? '').trim();
	}
	if (updates.status !== undefined) {
		merged.status = normalizeJourneyStatusForWrite(updates.status, existing.status);
	}

	if (dualWrite.expandedColumns.page_title !== undefined) {
		merged.page_title = String(dualWrite.expandedColumns.page_title ?? '').trim();
	}
	if (dualWrite.expandedColumns.meta_description !== undefined) {
		merged.meta_description = String(dualWrite.expandedColumns.meta_description ?? '').trim();
	}
	if (dualWrite.expandedColumns.hero_image_url !== undefined) {
		merged.hero_image_url = String(dualWrite.expandedColumns.hero_image_url ?? '').trim();
	}
	if (dualWrite.expandedColumns.hero_image_alt !== undefined) {
		merged.hero_image_alt = String(dualWrite.expandedColumns.hero_image_alt ?? '').trim();
	}
	if (dualWrite.expandedColumns.journey_type_slug !== undefined) {
		merged.journey_type_slug = String(dualWrite.expandedColumns.journey_type_slug ?? '').trim();
	} else if (updates.journeyType !== undefined) {
		const slug = journeyTypeLabelToSlug(updates.journeyType);
		if (slug) merged.journey_type_slug = slug;
	}

	return merged;
}

export function publishCandidateFromCreatePayload(
	journey: Partial<Journey> & Record<string, unknown>,
	defaultStatus: JourneyWriteStatus = 'draft'
): JourneyPublishCandidate {
	const dualWrite = buildJourneyDualWritePayload({
		pageTitle: journey.pageTitle as string | undefined,
		metaDescription: journey.metaDescription as string | undefined,
		heroImage: journey.heroImage as string | undefined,
		heroAlt:
			(journey.heroAlt as string | undefined) ??
			(journey.heroImageAlt as string | undefined),
		journeyType: journey.journeyType as string | undefined,
		shortDescription: journey.shortDescription as string | undefined,
	});

	const journeyTypeSlug =
		(dualWrite.expandedColumns.journey_type_slug as string | undefined) ||
		journeyTypeLabelToSlug(journey.journeyType) ||
		'';

	return {
		title: String(journey.title ?? '').trim(),
		slug: String(journey.slug ?? '').trim(),
		short_description: String(journey.shortDescription ?? '').trim(),
		page_title: String(dualWrite.expandedColumns.page_title ?? '').trim(),
		meta_description: String(dualWrite.expandedColumns.meta_description ?? '').trim(),
		hero_image_url: String(dualWrite.expandedColumns.hero_image_url ?? '').trim(),
		hero_image_alt: String(dualWrite.expandedColumns.hero_image_alt ?? '').trim(),
		journey_type_slug: journeyTypeSlug,
		status: normalizeJourneyStatusForWrite(journey.status, defaultStatus),
	};
}

export async function findJourneySlugConflict(
	canonicalSlug: string,
	excludeJourneyId?: string
): Promise<boolean> {
	if (!canonicalSlug) return false;
	const { rows } = await query('SELECT id, slug FROM journeys');
	for (const row of rows) {
		if (excludeJourneyId && String(row.id) === String(excludeJourneyId)) continue;
		const otherCanonical = resolveCanonicalPublishSlug(row.slug);
		if (otherCanonical === canonicalSlug) return true;
	}
	return false;
}

export async function loadJourneyDbRowById(id: string): Promise<JourneyDbRow | null> {
	const { rows } = await query('SELECT * FROM journeys WHERE id = $1', [id]);
	return rows.length > 0 ? (rows[0] as JourneyDbRow) : null;
}

export function resolveCandidateCanonicalSlug(candidate: JourneyPublishCandidate): string | null {
	return resolveCanonicalPublishSlug(candidate.slug);
}
