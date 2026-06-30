import { isValidRevisionOperation } from './stateMachine';
import type { JourneyRevisionDryRunRequest, JourneyRevisionOperation } from './types';

export function parseJourneyRevisionRequest(body: Record<string, unknown>): JourneyRevisionDryRunRequest {
	const operation = body.operation;
	if (!isValidRevisionOperation(operation)) {
		throw new Error('Invalid operation');
	}
	return {
		operation: operation as JourneyRevisionOperation,
		journeyId: typeof body.journeyId === 'string' ? body.journeyId : undefined,
		sourceUpdatedAt:
			typeof body.sourceUpdatedAt === 'string' ? body.sourceUpdatedAt : undefined,
		changes:
			body.changes && typeof body.changes === 'object' && !Array.isArray(body.changes)
				? (body.changes as Record<string, unknown>)
				: {},
		reviewMetadata:
			body.reviewMetadata && typeof body.reviewMetadata === 'object'
				? (body.reviewMetadata as JourneyRevisionDryRunRequest['reviewMetadata'])
				: undefined,
	};
}
