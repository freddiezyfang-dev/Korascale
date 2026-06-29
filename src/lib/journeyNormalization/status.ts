import {
	JOURNEY_STATUSES,
	LEGACY_INACTIVE_STATUS,
	type JourneyCanonicalStatus,
} from './constants';
import type { JourneyRowLike, StatusProposal } from './types';

export function normalizeStatusValue(raw: unknown): string | null {
	if (raw == null) return null;
	const value = String(raw).trim().toLowerCase();
	return value || null;
}

export function isCanonicalJourneyStatus(value: unknown): value is JourneyCanonicalStatus {
	return (
		typeof value === 'string' &&
		(JOURNEY_STATUSES as readonly string[]).includes(value)
	);
}

/** Stage A compat: matches legacy public queries (`active` or NULL). Audit / dry-run only. */
export function isPublicJourneyStatusCompat(value: unknown): boolean {
	if (value === undefined) return false;
	const normalized = normalizeStatusValue(value);
	return normalized === 'active' || normalized === null;
}

/** Target strict mode: only explicit `active`. */
export function isPublicJourneyStatusStrict(value: unknown): boolean {
	return normalizeStatusValue(value) === 'active';
}

/** @deprecated Public code should use isPublicJourneyStatusStrict (PR-J2C1). */
export const isPublicJourneyStatus = isPublicJourneyStatusStrict;

export function validateJourneyStatus(value: unknown): {
	valid: boolean;
	canonical: JourneyCanonicalStatus | null;
	issue?: string;
} {
	const normalized = normalizeStatusValue(value);
	if (normalized == null) {
		return { valid: false, canonical: null, issue: 'null_status' };
	}
	if (isCanonicalJourneyStatus(normalized)) {
		return { valid: true, canonical: normalized };
	}
	if (normalized === LEGACY_INACTIVE_STATUS) {
		return { valid: false, canonical: null, issue: 'legacy_inactive' };
	}
	return { valid: false, canonical: null, issue: `illegal_status:${normalized}` };
}

export function proposeJourneyStatus(row: JourneyRowLike): StatusProposal {
	const current = row.status == null ? null : String(row.status);
	const normalized = normalizeStatusValue(row.status);

	if (normalized == null) {
		return {
			current,
			proposed: null,
			confidence: 'manual_review',
			reason: 'NULL status — verify list/sitemap/detail visibility before backfill',
		};
	}

	if (normalized === 'active') {
		return {
			current,
			proposed: 'active',
			confidence: 'high',
			reason: 'Already active — must remain publicly accessible',
		};
	}

	if (normalized === LEGACY_INACTIVE_STATUS || normalized === 'archived') {
		return {
			current,
			proposed: 'archived',
			confidence: 'high',
			reason: `Map legacy ${normalized} to archived`,
		};
	}

	if (normalized === 'draft') {
		return {
			current,
			proposed: 'draft',
			confidence: 'high',
			reason: 'Explicit draft',
		};
	}

	return {
		current,
		proposed: null,
		confidence: 'manual_review',
		reason: `Unknown status value: ${normalized}`,
	};
}

/** SQL fragment for stage A (compat with legacy NULL-as-active queries). Audit only. */
export const JOURNEY_PUBLIC_STATUS_SQL_COMPAT = "status = 'active' OR status IS NULL";

/** SQL fragment for strict public queries — default after PR-J2C1. */
export const JOURNEY_PUBLIC_STATUS_SQL_STRICT = "status = 'active'";

export type PublicStatusQueryMode = 'strict' | 'compat';

export function buildPublicStatusWhereClause(options?: {
	strict?: boolean;
	mode?: PublicStatusQueryMode;
}): string {
	const useCompat =
		options?.mode === 'compat' || (options?.strict === false && options?.mode !== 'strict');
	return useCompat ? JOURNEY_PUBLIC_STATUS_SQL_COMPAT : JOURNEY_PUBLIC_STATUS_SQL_STRICT;
}
