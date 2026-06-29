export const JOURNEY_SLUG_CONFLICT_ERROR = 'JOURNEY_SLUG_CONFLICT';

export const JOURNEY_SLUG_KEY = 'journeys_slug_key';
export const JOURNEY_SLUG_NORMALIZED_UNIQUE_INDEX = 'journeys_slug_normalized_unique_idx';

export const JOURNEY_SLUG_UNIQUENESS_OBJECTS = new Set<string>([
	JOURNEY_SLUG_KEY,
	JOURNEY_SLUG_NORMALIZED_UNIQUE_INDEX,
]);

export type JourneySlugConflictFieldError = {
	field: 'slug';
	code: 'SLUG_CONFLICT';
	message: string;
};

export type JourneySlugConflictBody = {
	error: typeof JOURNEY_SLUG_CONFLICT_ERROR;
	message: string;
	fields: JourneySlugConflictFieldError[];
};

export function buildJourneySlugConflictBody(): JourneySlugConflictBody {
	return {
		error: JOURNEY_SLUG_CONFLICT_ERROR,
		message: 'This Journey slug is already in use.',
		fields: [
			{
				field: 'slug',
				code: 'SLUG_CONFLICT',
				message: 'Choose a different Journey slug.',
			},
		],
	};
}

type PgErrorLike = {
	code?: string;
	constraint?: string;
};

export function isJourneySlugUniquenessViolation(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const pgError = error as PgErrorLike;
	return pgError.code === '23505' && JOURNEY_SLUG_UNIQUENESS_OBJECTS.has(pgError.constraint ?? '');
}

/** @deprecated Use isJourneySlugUniquenessViolation */
export const isJourneySlugNormalizedUniqueViolation = isJourneySlugUniquenessViolation;
