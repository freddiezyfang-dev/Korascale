import type { JourneyRevisionFieldError } from './types';
import { JOURNEY_REVISION_ERROR_CODES } from './errors';
import type { JourneyRevisionOperation, JourneyRevisionSnapshot } from './types';

export function validateOperationStatusSemantics(input: {
	operation: JourneyRevisionOperation;
	source: JourneyRevisionSnapshot | null;
	proposed: JourneyRevisionSnapshot;
}): JourneyRevisionFieldError[] {
	const { operation, source, proposed } = input;
	const errors: JourneyRevisionFieldError[] = [];
	const proposedStatus = String(proposed.status ?? '').toLowerCase();

	if (operation === 'create') {
		if (proposedStatus === 'archived') {
			errors.push({
				field: 'status',
				code: JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
				message: 'create operation cannot set status to archived.',
			});
		}
		return errors;
	}

	if (operation === 'update') {
		if (proposedStatus === 'archived') {
			errors.push({
				field: 'status',
				code: JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
				message: 'update operation cannot archive a Journey. Use archive operation.',
			});
		}
		return errors;
	}

	if (operation === 'archive') {
		if (proposedStatus !== 'archived') {
			errors.push({
				field: 'status',
				code: JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
				message: 'archive operation must set status to archived.',
			});
		}
		if (source && proposed.slug !== source.slug) {
			errors.push({
				field: 'slug',
				code: JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
				message: 'archive operation must not change slug.',
			});
		}
		return errors;
	}

	if (operation === 'restore') {
		if (proposedStatus === 'archived') {
			errors.push({
				field: 'status',
				code: JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
				message: 'restore operation cannot set status to archived.',
			});
		}
		if (source && String(source.status).toLowerCase() !== 'archived') {
			errors.push({
				field: 'operation',
				code: JOURNEY_REVISION_ERROR_CODES.VALIDATION_FAILED,
				message: 'restore requires source Journey status archived.',
			});
		}
	}

	return errors;
}
