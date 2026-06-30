import {
	JOURNEY_REVISION_OPERATIONS,
	JOURNEY_REVISION_STATUSES,
	type JourneyRevisionOperation,
	type JourneyRevisionStatus,
} from './types';

const TRANSITIONS: Record<JourneyRevisionStatus, JourneyRevisionStatus[]> = {
	draft: ['pending_review', 'rejected'],
	pending_review: ['published', 'rejected', 'superseded'],
	published: [],
	rejected: [],
	superseded: [],
};

export function canTransitionRevisionStatus(
	from: JourneyRevisionStatus,
	to: JourneyRevisionStatus
): boolean {
	return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertRevisionPublishable(status: JourneyRevisionStatus): void {
	if (status === 'published') {
		throw new Error('JOURNEY_REVISION_ALREADY_PUBLISHED');
	}
	if (status !== 'pending_review') {
		throw new Error('JOURNEY_REVISION_INVALID_STATE');
	}
}

export function assertRevisionRejectable(status: JourneyRevisionStatus): boolean {
	return status === 'pending_review' || status === 'draft';
}

export function allowedActionsForStatus(status: JourneyRevisionStatus): string[] {
	switch (status) {
		case 'pending_review':
			return ['read', 'publish', 'reject'];
		case 'draft':
			return ['read', 'reject'];
		case 'published':
			return ['read'];
		case 'rejected':
			return ['read'];
		case 'superseded':
			return ['read'];
		default:
			return ['read'];
	}
}

export function isValidRevisionOperation(value: unknown): value is JourneyRevisionOperation {
	return typeof value === 'string' && JOURNEY_REVISION_OPERATIONS.includes(value as JourneyRevisionOperation);
}

export function isValidRevisionStatus(value: unknown): value is JourneyRevisionStatus {
	return typeof value === 'string' && JOURNEY_REVISION_STATUSES.includes(value as JourneyRevisionStatus);
}

export function defaultProposedStatusForOperation(
	operation: JourneyRevisionOperation,
	requestedStatus?: string
): string {
	if (operation === 'archive') return 'archived';
	if (operation === 'restore') {
		return requestedStatus === 'active' ? 'active' : 'draft';
	}
	if (operation === 'create') {
		return requestedStatus === 'active' ? 'active' : 'draft';
	}
	return requestedStatus ?? 'draft';
}
