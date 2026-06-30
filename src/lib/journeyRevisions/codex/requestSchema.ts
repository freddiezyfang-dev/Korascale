import { CLIENT_PROTECTED_CHANGE_KEYS } from '../allowlist';
import { JOURNEY_REVISION_OPERATIONS } from '../types';
import type { JourneyRevisionOperation } from '../types';

export type CodexJourneyRevisionRequest = {
	operation: JourneyRevisionOperation;
	journeyId?: string;
	sourceUpdatedAt?: string;
	changes?: Record<string, unknown>;
	changeSummary?: string[];
	reviewMetadata?: {
		changeSummary?: string[];
		factCheckItems?: Array<Record<string, unknown>>;
	};
};

export function parseCodexRequest(raw: unknown): {
	ok: true;
	request: CodexJourneyRevisionRequest;
} | {
	ok: false;
	errors: string[];
} {
	const errors: string[] = [];
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return { ok: false, errors: ['Request must be a JSON object.'] };
	}
	const body = raw as Record<string, unknown>;
	const operation = body.operation;
	if (
		typeof operation !== 'string' ||
		!JOURNEY_REVISION_OPERATIONS.includes(operation as JourneyRevisionOperation)
	) {
		errors.push('operation must be create|update|archive|restore.');
	}

	if (body.changes != null && (typeof body.changes !== 'object' || Array.isArray(body.changes))) {
		errors.push('changes must be an object when provided.');
	}

	const changes = (body.changes ?? {}) as Record<string, unknown>;
	for (const key of Object.keys(changes)) {
		if (CLIENT_PROTECTED_CHANGE_KEYS.has(key)) {
			errors.push(`Protected field "${key}" must not appear in changes.`);
		}
	}

	let changeSummary = normalizeChangeSummary(body);
	if (changeSummary.length === 0 && operation === 'archive') {
		changeSummary = ['Archive journey (status → archived)'];
	}
	if (changeSummary.length === 0 && operation === 'restore') {
		changeSummary = ['Restore journey (status → draft)'];
	}
	if (changeSummary.length === 0) {
		errors.push('changeSummary must list concrete edits.');
	}
	if (changeSummary.some(isVagueChangeSummary)) {
		errors.push('changeSummary must be specific, not abstract marketing language.');
	}

	if (errors.length > 0) return { ok: false, errors };

	return {
		ok: true,
		request: {
			operation: operation as JourneyRevisionOperation,
			journeyId: typeof body.journeyId === 'string' ? body.journeyId : undefined,
			sourceUpdatedAt:
				typeof body.sourceUpdatedAt === 'string' ? body.sourceUpdatedAt : undefined,
			changes,
			changeSummary,
			reviewMetadata:
				body.reviewMetadata && typeof body.reviewMetadata === 'object'
					? (body.reviewMetadata as CodexJourneyRevisionRequest['reviewMetadata'])
					: { changeSummary, factCheckItems: [] },
		},
	};
}

function normalizeChangeSummary(body: Record<string, unknown>): string[] {
	if (Array.isArray(body.changeSummary)) {
		return body.changeSummary.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
	}
	const review = body.reviewMetadata;
	if (review && typeof review === 'object' && Array.isArray((review as Record<string, unknown>).changeSummary)) {
		return ((review as Record<string, unknown>).changeSummary as unknown[]).filter(
			(v): v is string => typeof v === 'string' && v.trim().length > 0
		);
	}
	return [];
}

const VAGUE_SUMMARY_PATTERNS = [
	/^improved seo$/i,
	/^enhanced user experience$/i,
	/^optimized content$/i,
	/^better content$/i,
];

function isVagueChangeSummary(line: string): boolean {
	return VAGUE_SUMMARY_PATTERNS.some((pattern) => pattern.test(line.trim()));
}
