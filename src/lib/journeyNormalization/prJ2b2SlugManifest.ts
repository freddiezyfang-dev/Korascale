/** Approved PR-J2B2 slug normalization manifest — 4 trailing-hyphen journeys. */
export type PrJ2b2SlugManifestEntry = {
	readonly id: string;
	readonly status: 'active' | 'archived';
	readonly oldSlug: string;
	readonly newSlug: string;
	readonly redirectRequired: boolean;
	readonly manualReview: boolean;
	readonly reason: string;
};

export const PR_J2B2_SLUG_MANIFEST: readonly PrJ2b2SlugManifestEntry[] = [
	{
		id: '4d3bbbb8-3907-459b-af10-181ace7af8ec',
		status: 'active',
		oldSlug:
			'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-',
		newSlug:
			'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour',
		redirectRequired: true,
		manualReview: false,
		reason:
			'Active trailing-hyphen; permanent redirect retained after DB slug normalization',
	},
	{
		id: 'f699fa20-3732-4bd0-8379-974e9a35420c',
		status: 'archived',
		oldSlug: 'dali-cangshan-mountain-with-chongsheng-three-pagodas-day-tour-',
		newSlug: 'dali-cangshan-mountain-with-chongsheng-three-pagodas-day-tour',
		redirectRequired: false,
		manualReview: false,
		reason: 'Archived trailing-hyphen; DB normalization only, no public redirect',
	},
	{
		id: '1be89fa2-9420-45b5-bc61-6b9f1c43a43b',
		status: 'archived',
		oldSlug: 'lugu-lake-with-mosuo-culture-experience-2-day-tour-',
		newSlug: 'lugu-lake-with-mosuo-culture-experience-2-day-tour',
		redirectRequired: false,
		manualReview: false,
		reason: 'Archived trailing-hyphen; DB normalization only, no public redirect',
	},
	{
		id: 'd8958be5-72fd-4dfe-acd9-dfad00b1f928',
		status: 'archived',
		oldSlug: 'urumqi-to-ili-grassland-nature-loop-tour-7-day-',
		newSlug: 'urumqi-to-ili-grassland-nature-loop-tour-7-day',
		redirectRequired: false,
		manualReview: false,
		reason: 'Archived trailing-hyphen; DB normalization only, no public redirect',
	},
] as const;

export const PR_J2B2_SLUG_MANIFEST_COUNT = PR_J2B2_SLUG_MANIFEST.length;

export const PR_J2B2_EXPECTED_TOTAL = 83;
export const PR_J2B2_EXPECTED_ACTIVE = 24;
export const PR_J2B2_EXPECTED_ARCHIVED = 59;
export const PR_J2B2_EXPECTED_ACTIVE_IN_MANIFEST = 1;
export const PR_J2B2_EXPECTED_ARCHIVED_IN_MANIFEST = 3;

export const PR_J2B2_ACTIVE_ENTRY = PR_J2B2_SLUG_MANIFEST.find(
	(entry) => entry.status === 'active'
)!;

export function assertPrJ2b2ManifestIntegrity(): void {
	if (PR_J2B2_SLUG_MANIFEST_COUNT !== 4) {
		throw new Error(`Manifest count ${PR_J2B2_SLUG_MANIFEST_COUNT} != 4`);
	}
	const ids = new Set(PR_J2B2_SLUG_MANIFEST.map((entry) => entry.id));
	if (ids.size !== 4) throw new Error('Manifest contains duplicate IDs');
	const newSlugs = new Set(PR_J2B2_SLUG_MANIFEST.map((entry) => entry.newSlug));
	if (newSlugs.size !== 4) throw new Error('Manifest contains duplicate newSlug values');
	const oldSlugs = new Set(PR_J2B2_SLUG_MANIFEST.map((entry) => entry.oldSlug));
	if (oldSlugs.size !== 4) throw new Error('Manifest contains duplicate oldSlug values');
}

assertPrJ2b2ManifestIntegrity();

export function buildPrJ2b2ManifestSqlValues(): string {
	return PR_J2B2_SLUG_MANIFEST.map(
		(entry) =>
			`  ('${entry.id}'::uuid, '${entry.oldSlug}', '${entry.newSlug}', '${entry.status}')`
	).join(',\n');
}
