export const JOURNEY_REVISION_ERROR_CODES = {
	NOT_FOUND: 'JOURNEY_REVISION_NOT_FOUND',
	INVALID_STATE: 'JOURNEY_REVISION_INVALID_STATE',
	SOURCE_CHANGED: 'JOURNEY_REVISION_SOURCE_CHANGED',
	VALIDATION_FAILED: 'JOURNEY_REVISION_VALIDATION_FAILED',
	PRICE_FIELDS_LOCKED: 'JOURNEY_REVISION_PRICE_FIELDS_LOCKED',
	RELATIONSHIP_INVALID: 'JOURNEY_REVISION_RELATIONSHIP_INVALID',
	ALREADY_PUBLISHED: 'JOURNEY_REVISION_ALREADY_PUBLISHED',
	SLUG_CONFLICT: 'JOURNEY_SLUG_CONFLICT',
	PUBLISH_INTEGRITY_FAILED: 'JOURNEY_PUBLISH_INTEGRITY_FAILED',
	JOURNEY_NOT_FOUND: 'JOURNEY_NOT_FOUND',
	INVALID_REQUEST: 'JOURNEY_REVISION_INVALID_REQUEST',
} as const;

export type JourneyRevisionErrorCode =
	(typeof JOURNEY_REVISION_ERROR_CODES)[keyof typeof JOURNEY_REVISION_ERROR_CODES];

export class JourneyRevisionError extends Error {
	constructor(
		message: string,
		public readonly code: JourneyRevisionErrorCode | string,
		public readonly status: number,
		public readonly fields: Array<{ field: string; code: string; message: string }> = []
	) {
		super(message);
		this.name = 'JourneyRevisionError';
	}
}

export function journeyRevisionErrorResponse(error: JourneyRevisionError) {
	return {
		ok: false as const,
		error: error.code,
		message: error.message,
		fields: error.fields.length ? error.fields : undefined,
	};
}
