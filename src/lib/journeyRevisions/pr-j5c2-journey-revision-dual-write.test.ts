import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
	query: vi.fn(),
	withTransaction: vi.fn(),
}));

vi.mock('@/lib/journeyNormalization/journeySlugUniqueness.server', () => ({
	findJourneySlugConflict: vi.fn(),
}));

vi.mock('@/lib/journeyNormalization/journeyPublishIntegrityGate.server', () => ({
	runJourneyPublishIntegrityGate: vi.fn(),
}));

import { query, withTransaction } from '@/lib/db';
import { findJourneySlugConflict } from '@/lib/journeyNormalization/journeySlugUniqueness.server';
import { runJourneyPublishIntegrityGate } from '@/lib/journeyNormalization/journeyPublishIntegrityGate.server';
import {
	buildJourneyCreateMutation,
	buildJourneyUpdateMutation,
	sanitizeJourneyUpdateBody,
} from '@/lib/journeyNormalization/journeyAdminMutation.server';
import {
	getExpandedColumnEntries,
	mergeExpandedColumnSql,
	shouldWriteNormalizedColumns,
} from '@/lib/journeyNormalization/write';
import { JourneyRevisionError } from '@/lib/journeyRevisions/errors';
import {
	buildRevisionJsonbCompatibilityExpectations,
	buildRevisionNormalizedColumnExpectations,
	verifyRevisionPublishPostWriteIntegrity,
} from '@/lib/journeyRevisions/postWriteIntegrity.server';
import { publishJourneyRevision } from '@/lib/journeyRevisions/publish.server';
import { REVISION_PUBLISH_MUTATION_OPTIONS } from '@/lib/journeyRevisions/revisionPublishMutation.server';
import {
	mergeChangesIntoProposedSnapshot,
	rowToJourneyRevisionSnapshot,
	snapshotToMutationBody,
} from '@/lib/journeyRevisions/snapshot';

const JOURNEY_ID = '11111111-1111-4111-8111-111111111111';
const REVISION_ID = '33333333-3333-4333-8333-333333333333';

function opaqueWallClockToken(updatedAt: string | Date): string {
	if (typeof updatedAt === 'string') {
		if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(updatedAt)) {
			const [date, timePart] = updatedAt.split(' ');
			const [time, frac = ''] = timePart.split('.');
			const ms = frac.padEnd(3, '0').slice(0, 3);
			return `${date}T${time}.${ms}Z`;
		}
		if (updatedAt.endsWith('Z')) return updatedAt;
	}
	if (updatedAt instanceof Date) return updatedAt.toISOString();
	throw new Error(`Unable to derive opaque token from ${String(updatedAt)}`);
}

function sampleJourneyRow(overrides: Record<string, unknown> = {}) {
	const base = {
		id: JOURNEY_ID,
		slug: 'sample-journey',
		status: 'active',
		title: 'Sample Journey',
		short_description: 'Short',
		description: 'Desc',
		page_title: 'Sample Page Title',
		meta_description: 'Old meta',
		hero_image_url: '/hero.jpg',
		hero_image_alt: 'Hero alt',
		journey_type_slug: 'deep-discovery',
		journey_type: 'Deep Discovery',
		display_order: 5,
		seo_complete: true,
		price: 100,
		original_price: null,
		currency: null,
		price_from: null,
		price_basis: null,
		data: {
			pageTitle: 'Sample Page Title',
			metaDescription: 'Old meta',
			heroImage: '/hero.jpg',
			heroAlt: 'Hero alt',
			heroImageAlt: 'Hero alt',
			journeyType: 'Deep Discovery',
			itinerary: [{ day: 1, title: 'Day 1' }],
			images: ['a.jpg'],
			customField: 'preserve-me',
		},
		updated_at: '2026-06-29 10:00:00.000',
		created_at: '2026-06-01T10:00:00.000Z',
	};
	const row = { ...base, ...overrides } as Record<string, unknown>;
	if (row.journey_revision_source_updated_at == null && row.updated_at != null) {
		row.journey_revision_source_updated_at = opaqueWallClockToken(
			row.updated_at as string | Date
		);
	}
	return row;
}

function journeyRowFromProposed(
	proposed: ReturnType<typeof rowToJourneyRevisionSnapshot>,
	seoComplete = true,
	overrides: Record<string, unknown> = {}
) {
	return {
		...sampleJourneyRow(),
		title: proposed.title,
		slug: proposed.slug,
		status: proposed.status,
		short_description: proposed.short_description,
		page_title: proposed.page_title,
		meta_description: proposed.meta_description,
		hero_image_url: proposed.hero_image_url,
		hero_image_alt: proposed.hero_image_alt,
		journey_type_slug: proposed.journey_type_slug,
		journey_type: proposed.journey_type,
		display_order: proposed.display_order,
		seo_complete: seoComplete,
		data: {
			...(sampleJourneyRow().data as Record<string, unknown>),
			...proposed.data,
			pageTitle: proposed.page_title,
			metaDescription: proposed.meta_description,
			heroImage: proposed.hero_image_url,
			heroAlt: proposed.hero_image_alt,
			heroImageAlt: proposed.hero_image_alt,
			journeyType: proposed.journey_type,
		},
		...overrides,
	};
}

describe('PR-J5C2 normalized column write policy', () => {
	const originalFlag = process.env.JOURNEY_NORMALIZATION_COLUMNS;

	afterEach(() => {
		if (originalFlag === undefined) delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		else process.env.JOURNEY_NORMALIZATION_COLUMNS = originalFlag;
	});

	it('1-3. always policy writes columns regardless of flag', () => {
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		expect(shouldWriteNormalizedColumns('env-flag')).toBe(false);
		expect(shouldWriteNormalizedColumns('always')).toBe(true);

		process.env.JOURNEY_NORMALIZATION_COLUMNS = '0';
		expect(getExpandedColumnEntries({ meta_description: 'x' }, 'always')).toEqual([
			['meta_description', 'x'],
		]);

		process.env.JOURNEY_NORMALIZATION_COLUMNS = '1';
		expect(getExpandedColumnEntries({ meta_description: 'x' }, 'always')).toEqual([
			['meta_description', 'x'],
		]);
	});

	it('4-5. update mutation includes meta_description column when policy is always', async () => {
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { meta_description: 'New meta description' },
		});
		const body = sanitizeJourneyUpdateBody(snapshotToMutationBody(proposed));
		const mutation = await buildJourneyUpdateMutation(
			JOURNEY_ID,
			sampleJourneyRow(),
			body,
			true,
			REVISION_PUBLISH_MUTATION_OPTIONS
		);
		expect(mutation.updateSql).toContain('meta_description =');
		expect(mutation.updateSql).toContain('data =');
	});

	it('6-9. dual-write page_title hero fields journey_type_slug', async () => {
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: {
				page_title: 'New page title',
				hero_image_url: '/new-hero.jpg',
				hero_image_alt: 'New alt',
				journey_type: 'Explore Together',
			},
		});
		const body = sanitizeJourneyUpdateBody(snapshotToMutationBody(proposed));
		const mutation = await buildJourneyUpdateMutation(
			JOURNEY_ID,
			sampleJourneyRow(),
			body,
			false,
			REVISION_PUBLISH_MUTATION_OPTIONS
		);
		expect(mutation.updateSql).toContain('page_title =');
		expect(mutation.updateSql).toContain('hero_image_url =');
		expect(mutation.updateSql).toContain('hero_image_alt =');
		expect(mutation.updateSql).toContain('journey_type_slug =');
	});

	it('10. display_order written with always policy', async () => {
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { display_order: 12 },
		});
		const body = sanitizeJourneyUpdateBody(snapshotToMutationBody(proposed));
		const mutation = await buildJourneyUpdateMutation(
			JOURNEY_ID,
			sampleJourneyRow(),
			body,
			false,
			REVISION_PUBLISH_MUTATION_OPTIONS
		);
		expect(mutation.updateSql).toContain('display_order =');
	});

	it('11. seo_complete comes from server gate not proposed snapshot', () => {
		const proposed = rowToJourneyRevisionSnapshot(sampleJourneyRow({ seo_complete: false }));
		const expected = buildRevisionNormalizedColumnExpectations(proposed, true);
		expect(expected.seo_complete).toBe(true);
		expect(proposed.seo_complete).toBe(false);
	});

	it('22. create mutation includes normalized columns with always policy', () => {
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'create',
			source: null,
			changes: {
				slug: 'new-journey',
				title: 'New Journey',
				meta_description: 'Create meta',
				page_title: 'Create page',
			},
		});
		const body = snapshotToMutationBody(proposed);
		const mutation = buildJourneyCreateMutation(
			{ ...body, normalizedStatus: 'draft' } as never,
			false,
			REVISION_PUBLISH_MUTATION_OPTIONS
		);
		expect(mutation.insertSql).toContain('meta_description');
		expect(mutation.insertSql).toContain('page_title');
	});
});

describe('PR-J5C2 post-write integrity', () => {
	it('12-15. partial meta update preserves title itinerary gallery relationships', () => {
		const pre = sampleJourneyRow();
		const source = rowToJourneyRevisionSnapshot(pre);
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { meta_description: 'Only meta changed' },
		});
		const post = journeyRowFromProposed(proposed, true);
		const failures = verifyRevisionPublishPostWriteIntegrity({
			operation: 'update',
			preWriteRow: pre,
			postWriteRow: post,
			proposed,
			seoComplete: true,
		});
		expect(failures).toEqual([]);
		expect(post.title).toBe(source.title);
		expect((post.data as Record<string, unknown>).itinerary).toEqual(source.data.itinerary);
		expect((post.data as Record<string, unknown>).images).toEqual(source.data.images);
	});

	it('16. price field change fails integrity', () => {
		const pre = sampleJourneyRow();
		const source = rowToJourneyRevisionSnapshot(pre);
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { meta_description: 'New meta' },
		});
		const post = journeyRowFromProposed(proposed, true, { price: 999 });
		const failures = verifyRevisionPublishPostWriteIntegrity({
			operation: 'update',
			preWriteRow: pre,
			postWriteRow: post,
			proposed,
			seoComplete: true,
		});
		expect(failures.some((f) => f.code === 'PRICE_FIELD_CHANGED')).toBe(true);
	});

	it('17. column mismatch detected', () => {
		const pre = sampleJourneyRow();
		const source = rowToJourneyRevisionSnapshot(pre);
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { meta_description: 'Expected meta' },
		});
		const post = journeyRowFromProposed(proposed, true, { meta_description: 'Wrong column' });
		const failures = verifyRevisionPublishPostWriteIntegrity({
			operation: 'update',
			preWriteRow: pre,
			postWriteRow: post,
			proposed,
			seoComplete: true,
		});
		expect(failures.some((f) => f.field === 'meta_description')).toBe(true);
	});

	it('18. JSONB compatibility mismatch detected', () => {
		const pre = sampleJourneyRow();
		const source = rowToJourneyRevisionSnapshot(pre);
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { meta_description: 'Expected meta' },
		});
		const post = journeyRowFromProposed(proposed, true);
		(post.data as Record<string, unknown>).metaDescription = 'Stale jsonb';
		const failures = verifyRevisionPublishPostWriteIntegrity({
			operation: 'update',
			preWriteRow: pre,
			postWriteRow: post,
			proposed,
			seoComplete: true,
		});
		expect(failures.some((f) => f.code === 'JSONB_COMPAT_MISMATCH')).toBe(true);
	});

	it('JSONB expectations map mirrors compatibility keys', () => {
		const proposed = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		expect(buildRevisionJsonbCompatibilityExpectations(proposed)).toMatchObject({
			metaDescription: proposed.meta_description,
			pageTitle: proposed.page_title,
		});
	});
});

describe('PR-J5C2 publish transaction integrity', () => {
	beforeEach(() => {
		vi.mocked(findJourneySlugConflict).mockResolvedValue(false);
		vi.mocked(runJourneyPublishIntegrityGate).mockResolvedValue({
			ok: true,
			contentComplete: true,
			publishReady: true,
			errors: [],
			seoComplete: true,
		});
		vi.mocked(query).mockImplementation(async (text: string) => {
			if (text.includes('information_schema')) return { rows: [{ exists: true }] } as never;
			return { rows: [] } as never;
		});
	});

	it('19-21. integrity failure rolls back — revision not published', async () => {
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source: rowToJourneyRevisionSnapshot(sampleJourneyRow()),
			changes: { meta_description: 'New meta' },
		});
		let markedPublished = false;

		vi.mocked(withTransaction).mockImplementation(async (fn) => {
			await fn({
				query: async (text: string) => {
						if (text.includes('source_timestamp_matches')) {
							return { rows: [{ source_timestamp_matches: true }] };
						}
						if (text.includes('FOR UPDATE') && text.includes('journey_revisions')) {
							return {
								rows: [
									{
										id: REVISION_ID,
										journey_id: JOURNEY_ID,
										operation: 'update',
										status: 'pending_review',
										schema_version: 1,
										source_updated_at: '2026-06-29T10:00:00.000Z',
										source_snapshot: rowToJourneyRevisionSnapshot(sampleJourneyRow()),
										proposed_snapshot: proposed,
										change_summary: [],
										validation_report: { errors: [], warnings: [] },
										review_metadata: {},
										created_by: 'admin@test.com',
										published_by: null,
										created_at: new Date(),
										updated_at: new Date(),
										published_at: null,
										rejected_at: null,
									},
								],
							};
						}
						if (text.includes('FOR UPDATE') && text.includes('journeys')) {
							return { rows: [sampleJourneyRow()] };
						}
						if (text.includes('UPDATE journeys')) return { rows: [{ id: JOURNEY_ID }] };
						if (text.includes('FROM journeys WHERE id = $1') && !text.includes('FOR UPDATE')) {
							return {
								rows: [
									journeyRowFromProposed(proposed, true, {
										meta_description: 'Column not updated',
									}),
								],
							};
						}
						if (text.includes('UPDATE journey_revisions') && text.includes('published')) {
							markedPublished = true;
							return { rowCount: 1, rows: [] };
						}
						if (text.includes('FROM articles') || text.includes('LIMIT')) {
							return { rows: [{ id: 'x', status: 'active' }] };
						}
						return { rows: [] };
					},
				} as never);
		});

		await expect(
			publishJourneyRevision({ revisionId: REVISION_ID, publishedBy: 'admin@test.com' })
		).rejects.toMatchObject({
			code: 'JOURNEY_REVISION_POST_WRITE_INTEGRITY_FAILED',
			status: 500,
		});
		expect(markedPublished).toBe(false);
	});

	it('21. successful publish passes integrity and marks published', async () => {
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source: rowToJourneyRevisionSnapshot(sampleJourneyRow()),
			changes: { meta_description: 'New meta' },
		});
		let markedPublished = false;

		const clientQuery = vi.fn(async (text: string) => {
			if (text.includes('source_timestamp_matches')) {
				return { rows: [{ source_timestamp_matches: true }] };
			}
			if (text.includes('FOR UPDATE') && text.includes('journey_revisions')) {
				return {
					rows: [
						{
							id: REVISION_ID,
							journey_id: JOURNEY_ID,
							operation: 'update',
							status: 'pending_review',
							schema_version: 1,
							source_updated_at: '2026-06-29T10:00:00.000Z',
							source_snapshot: rowToJourneyRevisionSnapshot(sampleJourneyRow()),
							proposed_snapshot: proposed,
							change_summary: [],
							validation_report: { errors: [], warnings: [] },
							review_metadata: {},
							created_by: 'admin@test.com',
							published_by: null,
							created_at: new Date(),
							updated_at: new Date(),
							published_at: null,
							rejected_at: null,
						},
					],
				};
			}
			if (text.includes('FOR UPDATE') && text.includes('journeys')) {
				return { rows: [sampleJourneyRow()] };
			}
			if (text.includes('FROM journeys WHERE id = $1') && !text.includes('FOR UPDATE')) {
				return { rows: [journeyRowFromProposed(proposed, true)] };
			}
			if (text.includes('UPDATE journeys')) return { rows: [{ id: JOURNEY_ID }] };
			if (text.includes('UPDATE journey_revisions') && text.includes('published')) {
				markedPublished = true;
				return { rowCount: 1, rows: [] };
			}
			if (text.includes('FROM articles') || text.includes('LIMIT')) {
				return { rows: [{ id: 'x', status: 'active' }] };
			}
			return { rows: [] };
		});

		vi.mocked(withTransaction).mockImplementation(async (fn) => {
			await fn({ query: clientQuery } as never);
		});

		vi.mocked(query).mockImplementation(async (text: string) => {
			if (text.includes('information_schema')) return { rows: [{ exists: true }] } as never;
			if (text.includes('journey_revisions WHERE id')) {
				return {
					rows: [
						{
							id: REVISION_ID,
							journey_id: JOURNEY_ID,
							operation: 'update',
							status: 'published',
							schema_version: 1,
							source_updated_at: '2026-06-29T10:00:00.000Z',
							source_snapshot: rowToJourneyRevisionSnapshot(sampleJourneyRow()),
							proposed_snapshot: proposed,
							change_summary: [],
							validation_report: { errors: [], warnings: [] },
							review_metadata: {},
							created_by: 'admin@test.com',
							published_by: 'admin@test.com',
							created_at: new Date(),
							updated_at: new Date(),
							published_at: new Date(),
							rejected_at: null,
						},
					],
				} as never;
			}
			return { rows: [] } as never;
		});

		await publishJourneyRevision({ revisionId: REVISION_ID, publishedBy: 'admin@test.com' });
		expect(markedPublished).toBe(true);
		expect(
			clientQuery.mock.calls.some(([sql]) => String(sql).includes('meta_description ='))
		).toBe(true);
	});
});

describe('PR-J5C2 revision path independence', () => {
	it('29. revision publish mutation options do not reference normalization flag', () => {
		const source = fs.readFileSync(
			path.join(process.cwd(), 'src/lib/journeyRevisions/revisionPublishMutation.server.ts'),
			'utf8'
		);
		expect(source).not.toContain('JOURNEY_NORMALIZATION_COLUMNS');
		expect(REVISION_PUBLISH_MUTATION_OPTIONS.normalizedColumnWritePolicy).toBe('always');
	});

	it('30. production write guard still present in CLI', () => {
		const cli = fs.readFileSync(
			path.join(process.cwd(), 'scripts/codex/journey-revision-cli.ts'),
			'utf8'
		);
		expect(cli).toContain('CODEX_JOURNEY_REVISION_WRITE_ENABLED');
		expect(cli).toContain('confirm-production');
	});

	it('mergeExpandedColumnSql with always policy emits SQL fields', () => {
		delete process.env.JOURNEY_NORMALIZATION_COLUMNS;
		const merged = mergeExpandedColumnSql({ meta_description: 'x' }, 1, 'always');
		expect(merged.fields).toEqual(['meta_description = $1']);
	});
});

describe('PR-J5C2 archive and restore operations', () => {
	it('24. archive only changes status in proposed snapshot', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'archive',
			source,
			changes: {},
		});
		expect(proposed.status).toBe('archived');
		expect(proposed.meta_description).toBe(source.meta_description);
	});

	it('25. restore dual-write fields preserved from source', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow({ status: 'archived' }));
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'restore',
			source,
			changes: {},
		});
		expect(proposed.status).toBe('draft');
		expect(proposed.page_title).toBe(source.page_title);
		expect(proposed.meta_description).toBe(source.meta_description);
	});
});

describe('PR-J5C2 audit artifact', () => {
	it('audit doc records corrective revision history', () => {
		const audit = fs.readFileSync(
			path.join(process.cwd(), 'docs/audits/pr-j5c2-journey-revision-dual-write-audit.md'),
			'utf8'
		);
		expect(audit).toContain('1f53d729');
		expect(audit).toContain('6b9d0b18');
		expect(audit).toContain('JOURNEY_NORMALIZATION_COLUMNS');
	});
});
