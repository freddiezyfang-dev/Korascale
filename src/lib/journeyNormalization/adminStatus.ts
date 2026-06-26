import { normalizeJourneyStatusForRead } from './write';

/** Display status in admin UI (maps legacy inactive → archived). */
export function journeyStatusForAdminDisplay(status: unknown): string {
	return normalizeJourneyStatusForRead(status);
}

export function journeyMatchesAdminStatusFilter(
	journeyStatus: unknown,
	filter: string
): boolean {
	if (filter === 'all') return true;
	const display = journeyStatusForAdminDisplay(journeyStatus);
	return display === filter;
}

export function isJourneyArchivedInDb(status: unknown): boolean {
	const normalized = String(status ?? '').trim().toLowerCase();
	return normalized === 'inactive' || normalized === 'archived';
}
