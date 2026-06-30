import { JOURNEY_REVISION_ERROR_CODES } from '../errors';
import { computeJourneyRevisionFieldChanges } from '../revisionDiff';
import type { JourneyRevisionFieldError, JourneyRevisionOperation, JourneyRevisionSnapshot } from '../types';

export function detectNoOpUpdate(
	operation: JourneyRevisionOperation,
	source: JourneyRevisionSnapshot | null,
	proposed: JourneyRevisionSnapshot
): JourneyRevisionFieldError[] {
	if (operation !== 'update' || !source) return [];

	const fieldChanges = computeJourneyRevisionFieldChanges(source, proposed);
	const relationshipsChanged =
		JSON.stringify(source.relationships) !== JSON.stringify(proposed.relationships);

	if (fieldChanges.length === 0 && !relationshipsChanged) {
		return [
			{
				field: 'changes',
				code: JOURNEY_REVISION_ERROR_CODES.NO_CHANGES,
				message:
					'Proposed snapshot has no business field changes from source (NO_CHANGES).',
			},
		];
	}

	return [];
}
