import { JOURNEY_TYPES, type JourneyTypeSlug } from './constants';
import {
	detectSlugIssues,
	isValidCanonicalSlug,
	normalizeJourneySlug,
	stripJourneySlugPathPrefix,
} from './slug';
import type { JourneyWriteStatus } from './write';

export const JOURNEY_PUBLISH_INTEGRITY_ERROR = 'JOURNEY_PUBLISH_INTEGRITY_FAILED';

export type JourneyPublishIntegrityErrorCode =
	| 'REQUIRED'
	| 'INVALID_SLUG_FORMAT'
	| 'SLUG_CONFLICT'
	| 'INVALID_JOURNEY_TYPE';

export type JourneyPublishIntegrityFieldError = {
	field: string;
	code: JourneyPublishIntegrityErrorCode;
	message: string;
};

export type JourneyPublishCandidate = {
	id?: string;
	title: string;
	slug: string;
	short_description: string;
	page_title: string;
	meta_description: string;
	hero_image_url: string;
	hero_image_alt: string;
	journey_type_slug: string;
	status: JourneyWriteStatus;
};

export type JourneyPublishReadinessContext = {
	slugConflict?: boolean;
};

export type JourneyPublishIntegrityResult = {
	contentComplete: boolean;
	publishReady: boolean;
	errors: JourneyPublishIntegrityFieldError[];
};

function trimValue(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function requireField(
	errors: JourneyPublishIntegrityFieldError[],
	field: string,
	value: string,
	label: string
): boolean {
	if (value) return true;
	errors.push({
		field,
		code: 'REQUIRED',
		message: `${label} is required before publishing.`,
	});
	return false;
}

function validateSlugFormat(
	errors: JourneyPublishIntegrityFieldError[],
	rawSlug: string,
	canonicalSlug: string | null
): boolean {
	const issues = detectSlugIssues(rawSlug);
	if (issues.includes('leading_hyphen')) {
		errors.push({
			field: 'slug',
			code: 'INVALID_SLUG_FORMAT',
			message: 'Slug cannot start with a hyphen.',
		});
	}
	if (issues.includes('trailing_hyphen')) {
		errors.push({
			field: 'slug',
			code: 'INVALID_SLUG_FORMAT',
			message: 'Slug cannot end with a hyphen.',
		});
	}
	if (issues.includes('double_hyphen')) {
		errors.push({
			field: 'slug',
			code: 'INVALID_SLUG_FORMAT',
			message: 'Slug cannot contain consecutive hyphens.',
		});
	}
	if (issues.includes('uppercase')) {
		errors.push({
			field: 'slug',
			code: 'INVALID_SLUG_FORMAT',
			message: 'Slug must be lowercase.',
		});
	}
	if (!canonicalSlug || !isValidCanonicalSlug(canonicalSlug, issues)) {
		if (!errors.some((e) => e.field === 'slug')) {
			errors.push({
				field: 'slug',
				code: 'INVALID_SLUG_FORMAT',
				message: 'Slug must use lowercase letters, numbers, and single hyphens only.',
			});
		}
		return false;
	}
	return true;
}

function validateJourneyTypeSlug(
	errors: JourneyPublishIntegrityFieldError[],
	journeyTypeSlug: string
): boolean {
	if (!journeyTypeSlug) {
		errors.push({
			field: 'journey_type_slug',
			code: 'REQUIRED',
			message: 'Journey type is required before publishing.',
		});
		return false;
	}
	if (!(JOURNEY_TYPES as readonly string[]).includes(journeyTypeSlug)) {
		errors.push({
			field: 'journey_type_slug',
			code: 'INVALID_JOURNEY_TYPE',
			message: 'Journey type must be one of the canonical journey type slugs.',
		});
		return false;
	}
	return true;
}

export function resolveCanonicalPublishSlug(rawSlug: unknown): string | null {
	if (rawSlug == null) return null;
	const stripped = stripJourneySlugPathPrefix(String(rawSlug));
	return normalizeJourneySlug(stripped);
}

/** Pure content completeness — normalized columns only, no legacy JSONB fallback. */
export function evaluateJourneyContentCompleteness(
	candidate: JourneyPublishCandidate
): JourneyPublishIntegrityResult {
	const errors: JourneyPublishIntegrityFieldError[] = [];

	requireField(errors, 'title', trimValue(candidate.title), 'Title');
	requireField(errors, 'short_description', trimValue(candidate.short_description), 'Short description');
	requireField(errors, 'page_title', trimValue(candidate.page_title), 'Page title');
	requireField(errors, 'meta_description', trimValue(candidate.meta_description), 'Meta description');
	requireField(errors, 'hero_image_url', trimValue(candidate.hero_image_url), 'Hero image URL');
	requireField(errors, 'hero_image_alt', trimValue(candidate.hero_image_alt), 'Hero image alt text');

	const rawSlug = trimValue(candidate.slug);
	const canonicalSlug = resolveCanonicalPublishSlug(rawSlug);
	if (!rawSlug) {
		requireField(errors, 'slug', '', 'Slug');
	} else {
		validateSlugFormat(errors, rawSlug, canonicalSlug);
	}

	validateJourneyTypeSlug(errors, trimValue(candidate.journey_type_slug));

	const contentComplete = errors.length === 0;
	return {
		contentComplete,
		publishReady: contentComplete,
		errors,
	};
}

export function validateJourneyPublishReadiness(
	candidate: JourneyPublishCandidate,
	context: JourneyPublishReadinessContext = {}
): JourneyPublishIntegrityResult {
	const base = evaluateJourneyContentCompleteness(candidate);
	if (candidate.status !== 'active') {
		return base;
	}

	if (context.slugConflict) {
		base.errors.push({
			field: 'slug',
			code: 'SLUG_CONFLICT',
			message: 'Slug is already used by another Journey.',
		});
	}

	const publishReady = base.contentComplete && !context.slugConflict;
	return {
		contentComplete: base.contentComplete,
		publishReady,
		errors: base.errors,
	};
}

export function isJourneyTypeSlugValue(value: unknown): value is JourneyTypeSlug {
	return typeof value === 'string' && (JOURNEY_TYPES as readonly string[]).includes(value);
}
