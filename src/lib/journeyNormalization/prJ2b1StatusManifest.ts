/** Approved PR-J2B1 status backfill manifest — 59 inactive journey IDs. */
export const PR_J2B1_STATUS_MANIFEST_IDS = [
	'e468b842-7c59-4258-8d56-8b585566be82',
	'68262f66-90f9-4f2f-822e-51865bde7967',
	'3ec32480-b591-470f-bd10-9714c84588ef',
	'f0f123a2-0413-4050-99d8-46f2b0cd8ec9',
	'77f512fd-41df-4eee-8d35-4c33623aa637',
	'64ad1143-2c99-4444-a735-195b5c2da099',
	'6cbaf3e2-63ef-4d78-b1cb-1ed4ef635d13',
	'ce8fcb42-c0a8-4925-b4e0-540cac40b7e1',
	'1a95095c-9f0d-4b6d-a30e-8084a7277304',
	'fd6b7c12-c11d-4ae4-9a84-d451bc2fe372',
	'f699fa20-3732-4bd0-8379-974e9a35420c',
	'87788afb-8344-4dbe-92e9-4ad41f660cd5',
	'fd744425-8680-496a-aa47-74a07ff0f5e3',
	'1efb5a6e-8b7e-43ca-9dde-9e6587bee8ba',
	'490aea2d-6cff-47f4-a9fa-5131ff160d06',
	'2351fc82-887f-4b37-bad7-2c466764e0e0',
	'1654f129-046a-4daf-b595-a2fd00f13cc3',
	'cf231b9a-9022-477f-a583-04e5711a659c',
	'a1d410d7-a3c1-4333-bc5f-52befea2acd2',
	'6c8279a0-ecad-4b80-9ad0-069b104c407d',
	'9c0864b9-a79d-46c4-800c-ddc4dbab54d5',
	'7e8e641d-4446-490c-9b94-ce19c8a94912',
	'24ded7e2-c63c-4625-b5f9-5f383583633f',
	'591a7e54-4cce-4bc2-940a-338b38b79e2d',
	'20cb64d6-c2e1-4197-8e78-08e6236d5706',
	'a624b439-0fed-495c-bebc-4bd9823a47ff',
	'68b2dbbd-ed87-4cd4-b420-6e282aa2afe6',
	'c1599bf8-9d1a-4494-8401-8c7eff563838',
	'0f9d936a-6cd6-443d-a7c8-b2d317a75d6c',
	'0389826c-8d82-4c3b-b612-2b44c0b2f781',
	'b4c761e4-b3b1-4568-b173-3ff9ece44388',
	'1be89fa2-9420-45b5-bc61-6b9f1c43a43b',
	'033eb46d-8326-4d1d-8d89-a0d690bc59e9',
	'22567336-9280-46a9-9309-73f1dc45bf01',
	'ba5e65c7-23b9-4be6-87fb-886a09de2947',
	'fda690c8-6884-4006-a982-305d20426d00',
	'1f4c1481-bb45-4ac7-acd0-4aba2550cea1',
	'7b370612-01bb-4812-89c9-0c25a3bb9f70',
	'926c8370-1bea-4470-bdb7-f882ff318cc7',
	'991d0029-2312-4301-bb1e-51aa586c122c',
	'd3485450-4186-468d-803d-f6e87fc48cf5',
	'5d2baed2-a662-4fe5-8b49-8d8ee0f16483',
	'8d704e28-7e8c-4134-aa7e-4fe1ab76ce71',
	'5cfec52f-1a4f-40a5-af90-29c471461d7a',
	'd8958be5-72fd-4dfe-acd9-dfad00b1f928',
	'9cef0680-e565-4507-bf70-24ae7ff50952',
	'b782a27c-e4c1-4e1b-9a4f-7d01cf71e385',
	'6ab8d247-4eae-47dc-b344-17ed2352dd1c',
	'ae4e5fd0-f467-4be2-858c-2ee30242b554',
	'bbec6b13-4f66-443b-bfde-b36172660e0d',
	'2952bb01-6cb2-452e-b1c9-ee25c19b2dcb',
	'8a6bf407-eb4e-4864-8e1d-091ab007ef59',
	'140ce811-9a74-432d-be97-8f7353093a34',
	'9d4bfc58-201f-40aa-9d95-9101ad4c2f08',
	'dabc4159-c42e-438e-a1eb-6abd957c9104',
	'ff1ed0c8-1ea1-4ca7-9de2-707844381a68',
	'1625c038-3464-4a7a-b5d9-c345f195dd74',
	'ff987022-70a1-48c7-bed4-3dd33be5f105',
	'31f789ed-e6c2-4acb-a7d3-0fd07937acba',
] as const;

export type PrJ2b1StatusManifestId = (typeof PR_J2B1_STATUS_MANIFEST_IDS)[number];

export const PR_J2B1_STATUS_MANIFEST_COUNT = PR_J2B1_STATUS_MANIFEST_IDS.length;

/** Status-only in 025B1; slug/type handled in separate PRs. */
export const PR_J2B1_STATUS_MANUAL_REVIEW_IDS = [
	'e468b842-7c59-4258-8d56-8b585566be82',
] as const;

export const PR_J2B1_EXPECTED_TOTAL = 83;
export const PR_J2B1_EXPECTED_ACTIVE = 24;
export const PR_J2B1_EXPECTED_INACTIVE = 59;
export const PR_J2B1_EXPECTED_ARCHIVED_BEFORE = 0;

export function isPrJ2b1StatusManifestId(id: unknown): id is PrJ2b1StatusManifestId {
	return (
		typeof id === 'string' &&
		(PR_J2B1_STATUS_MANIFEST_IDS as readonly string[]).includes(id)
	);
}

export function isPrJ2b1StatusManualReviewId(id: unknown): boolean {
	return (
		typeof id === 'string' &&
		(PR_J2B1_STATUS_MANUAL_REVIEW_IDS as readonly string[]).includes(id)
	);
}

export function assertPrJ2b1ManifestIntegrity(): void {
	if (PR_J2B1_STATUS_MANIFEST_COUNT !== PR_J2B1_EXPECTED_INACTIVE) {
		throw new Error(
			`Manifest count ${PR_J2B1_STATUS_MANIFEST_COUNT} != expected ${PR_J2B1_EXPECTED_INACTIVE}`
		);
	}
	const unique = new Set(PR_J2B1_STATUS_MANIFEST_IDS);
	if (unique.size !== PR_J2B1_STATUS_MANIFEST_COUNT) {
		throw new Error('Manifest contains duplicate IDs');
	}
}

assertPrJ2b1ManifestIntegrity();

/** SQL `IN (...)` fragment for pending/025b1 migrations (uuid casts). */
export function buildPrJ2b1StatusManifestSqlInList(): string {
	return PR_J2B1_STATUS_MANIFEST_IDS.map((id) => `'${id}'::uuid`).join(',\n    ');
}
