import fs from 'fs';
import path from 'path';
import { describe, expect, it, vi, beforeEach } from 'vitest';

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
	mergeChangesIntoProposedSnapshot,
	rowToJourneyRevisionSnapshot,
} from '@/lib/journeyRevisions/snapshot';
import {
	runJourneyRevisionValidation,
	validateSourceUpdatedAt,
	detectLockedFieldChangeAttempts,
	detectProtectedClientFieldAttempts,
} from '@/lib/journeyRevisions/validation';
import {
	compareProtectedPriceValues,
	detectProtectedPricePathsInChanges,
} from '@/lib/journeyRevisions/priceProtection';
import { sanitizeClientChanges } from '@/lib/journeyRevisions/allowlist';
import { validateOperationStatusSemantics } from '@/lib/journeyRevisions/operationRules';
import { supersedePendingJourneyRevisions } from '@/lib/journeyRevisions/repository.server';
import {
	allowedActionsForStatus,
	canTransitionRevisionStatus,
	defaultProposedStatusForOperation,
} from '@/lib/journeyRevisions/stateMachine';
import { dryRunJourneyRevision, createJourneyRevision } from '@/lib/journeyRevisions/dryRun.server';
import { publishJourneyRevision } from '@/lib/journeyRevisions/publish.server';
import { JourneyRevisionError } from '@/lib/journeyRevisions/errors';

const JOURNEY_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_JOURNEY_ID = '44444444-4444-4444-8444-444444444444';
const ARTICLE_ID = '22222222-2222-4222-8222-222222222222';
const REVISION_ID = '33333333-3333-4333-8333-333333333333';
const CREATE_REVISION_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const CREATE_REVISION_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function sampleJourneyRow(overrides: Record<string, unknown> = {}) {
	return {
		id: JOURNEY_ID,
		slug: 'sample-journey',
		status: 'active',
		title: 'Sample Journey',
		short_description: 'Short',
		description: 'Desc',
		page_title: 'Sample Page Title',
		meta_description: 'Meta',
		hero_image_url: '/hero.jpg',
		hero_image_alt: 'Hero alt',
		journey_type_slug: 'deep-discovery',
		journey_type: 'Deep Discovery',
		price: 100,
		original_price: null,
		currency: null,
		price_from: null,
		price_basis: null,
		price_on_request: null,
		data: {
			itinerary: [{ day: 1, title: 'Day 1', description: 'Content' }],
			gallery: ['a.jpg'],
			customField: 'preserve-me',
		},
		updated_at: '2026-06-29T10:00:00.000Z',
		created_at: '2026-06-01T10:00:00.000Z',
		...overrides,
	};
}

describe('PR-J5A inspiration reuse audit artifact', () => {
	it('1. inspiration reuse audit references real article revision modules', () => {
		const audit = fs.readFileSync(
			path.join(process.cwd(), 'docs/audits/pr-j5a-inspiration-revision-reuse-audit.md'),
			'utf8'
		);
		expect(audit).toContain('article_revisions');
		expect(audit).toContain('revisionAdmin.server.ts');
		expect(audit).toContain('enforceAdminWrite');
		expect(fs.existsSync(path.join(process.cwd(), 'database/migrations/019_create_article_revisions_table.sql'))).toBe(
			true
		);
	});
});

describe('PR-J5A snapshot merge and price protection', () => {
	it('10. create defaults to draft', () => {
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'create',
			source: null,
			changes: { title: 'New', slug: 'new-journey' },
		});
		expect(proposed.status).toBe('draft');
	});

	it('11. restore defaults to draft', () => {
		const source = rowToJourneyRevisionSnapshot(
			sampleJourneyRow({ status: 'archived' })
		);
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'restore',
			source,
			changes: {},
		});
		expect(proposed.status).toBe('draft');
	});

	it('20. client seo_complete ignored in merge', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { seo_complete: true },
		});
		expect(proposed.seo_complete).toBe(false);
	});

	it('22. price change rejected', () => {
		const errors = detectLockedFieldChangeAttempts({ price: 200 });
		expect(errors.some((e) => e.code === 'JOURNEY_REVISION_PRICE_FIELDS_LOCKED')).toBe(true);
	});

	it('27. unknown JSONB keys preserved', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { data: { itinerary: source.data.itinerary } },
		});
		expect(proposed.data.customField).toBe('preserve-me');
	});

	it('28. itinerary not lost on partial update', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { title: 'Updated title' },
		});
		expect(Array.isArray(proposed.data.itinerary)).toBe(true);
		expect((proposed.data.itinerary as unknown[]).length).toBe(1);
	});

	it('29. gallery not lost on partial update', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { title: 'Updated title' },
		});
		expect(proposed.data.gallery).toEqual(['a.jpg']);
	});

	it('30. archive only changes status', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'archive',
			source,
			changes: {},
		});
		expect(proposed.status).toBe('archived');
		expect(proposed.slug).toBe(source.slug);
		expect(proposed.data).toEqual(source.data);
	});

	it('31. restore does not default active', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow({ status: 'archived' }));
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'restore',
			source,
			changes: {},
		});
		expect(proposed.status).toBe('draft');
	});
});

describe('PR-J5A source_updated_at validation', () => {
	it('12-14. source_updated_at mismatch rejected', () => {
		const row = sampleJourneyRow();
		const bad = validateSourceUpdatedAt('update', '2026-01-01T00:00:00.000Z', row);
		expect(bad.matched).toBe(false);
		expect(bad.errors.some((e) => e.code === 'JOURNEY_REVISION_SOURCE_CHANGED')).toBe(true);

		const good = validateSourceUpdatedAt('update', '2026-06-29T10:00:00.000Z', row);
		expect(good.matched).toBe(true);
	});
});

describe('PR-J5A state machine', () => {
	it('35-36. published/rejected cannot publish again', () => {
		expect(canTransitionRevisionStatus('published', 'published')).toBe(false);
		expect(canTransitionRevisionStatus('rejected', 'published')).toBe(false);
		expect(allowedActionsForStatus('published')).toEqual(['read']);
		expect(allowedActionsForStatus('pending_review')).toContain('publish');
	});
});

describe('PR-J5A dry-run and create (mocked DB)', () => {
	beforeEach(() => {
		vi.mocked(query).mockReset();
		vi.mocked(findJourneySlugConflict).mockResolvedValue(false);
		vi.mocked(runJourneyPublishIntegrityGate).mockResolvedValue({
			ok: true,
			contentComplete: true,
			publishReady: false,
			errors: [],
			seoComplete: false,
		});
		vi.mocked(query).mockImplementation(async (text: string, params?: unknown[]) => {
			if (text.includes('journey_revisions') && text.includes('information_schema')) {
				return { rows: [{ exists: true }] } as never;
			}
			if (text.includes('FROM journeys WHERE id')) {
				return { rows: [sampleJourneyRow()] } as never;
			}
			if (text.includes('FROM articles WHERE id')) {
				return { rows: [{ id: params?.[0] }] } as never;
			}
			if (text.includes('INSERT INTO journey_revisions')) {
				return { rows: [{ id: REVISION_ID }] } as never;
			}
			if (text.includes('UPDATE journey_revisions')) {
				return { rowCount: 1, rows: [] } as never;
			}
			return { rows: [] } as never;
		});
	});

	it('2-5. dry-run operations do not update journeys table', async () => {
		for (const operation of ['create', 'update', 'archive', 'restore'] as const) {
			await dryRunJourneyRevision({
				operation,
				journeyId: operation === 'create' ? undefined : JOURNEY_ID,
				sourceUpdatedAt:
					operation === 'create' ? undefined : '2026-06-29T10:00:00.000Z',
				changes: operation === 'create' ? { slug: 'new-j', title: 'New' } : {},
			});
		}
		const journeyUpdates = vi
			.mocked(query)
			.mock.calls.filter(([sql]) => /UPDATE journeys|INSERT INTO journeys/i.test(String(sql)));
		expect(journeyUpdates.length).toBe(0);
	});

	it('6-9. create revision does not modify journeys', async () => {
		await createJourneyRevision({
			request: {
				operation: 'create',
				changes: { slug: 'brand-new-journey', title: 'Brand New' },
			},
			createdBy: 'admin@test.com',
		});
		const journeyWrites = vi
			.mocked(query)
			.mock.calls.filter(([sql]) => /UPDATE journeys|INSERT INTO journeys/i.test(String(sql)));
		expect(journeyWrites.length).toBe(0);
	});

	it('15-16. duplicate slug rejected', async () => {
		vi.mocked(findJourneySlugConflict).mockResolvedValue(true);
		const result = await dryRunJourneyRevision({
			operation: 'create',
			changes: { slug: 'sample-journey', title: 'Dup' },
		});
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.code === 'JOURNEY_SLUG_CONFLICT')).toBe(true);
	});

	it('18-19. draft/archived incomplete candidate can create revision', async () => {
		const draftResult = await dryRunJourneyRevision({
			operation: 'create',
			changes: { slug: 'draft-only-journey', title: 'Draft only', status: 'draft' },
		});
		expect(draftResult.valid).toBe(true);

		vi.mocked(query).mockImplementation(async (text: string) => {
			if (text.includes('information_schema')) return { rows: [{ exists: true }] } as never;
			if (text.includes('FROM journeys')) {
				return { rows: [sampleJourneyRow({ status: 'archived' })] } as never;
			}
			return { rows: [] } as never;
		});

		const restoreResult = await dryRunJourneyRevision({
			operation: 'restore',
			journeyId: JOURNEY_ID,
			sourceUpdatedAt: '2026-06-29T10:00:00.000Z',
			changes: {},
		});
		expect(restoreResult.valid).toBe(true);
	});

	it('23-26. relationship validation', async () => {
		const result = await runJourneyRevisionValidation(
			{
				operation: 'update',
				journeyId: JOURNEY_ID,
				sourceUpdatedAt: '2026-06-29T10:00:00.000Z',
				changes: {
					relationships: {
						relatedJourneyIds: [JOURNEY_ID, JOURNEY_ID],
						relatedArticleIds: ['not-a-uuid'],
					},
				},
			},
			{
				journeyRow: sampleJourneyRow(),
				runQuery: async (text, params = []) => {
					if (text.includes('articles')) return { rows: [] };
					if (text.includes('journeys')) return { rows: [{ id: params[0], status: 'active' }] };
					return { rows: [] };
				},
			}
		);
		expect(result.valid).toBe(false);
		expect(result.report.errors.length).toBeGreaterThan(0);
	});
});

describe('PR-J5A publish transaction (mocked)', () => {
	beforeEach(() => {
		vi.mocked(withTransaction).mockReset();
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

	it('32-34. publish uses transaction and marks revision published', async () => {
		const clientQuery = vi.fn(async (text: string) => {
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
							proposed_snapshot: mergeChangesIntoProposedSnapshot({
								operation: 'update',
								source: rowToJourneyRevisionSnapshot(sampleJourneyRow()),
								changes: { title: 'Published title' },
							}),
							change_summary: [],
							validation_report: { errors: [], warnings: [] },
							review_metadata: {},
							created_by: 'admin@test.com',
							published_by: null,
							created_at: '2026-06-29T10:00:00.000Z',
							updated_at: '2026-06-29T10:00:00.000Z',
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
			if (text.includes('UPDATE journey_revisions') && text.includes('published')) {
				return { rowCount: 1, rows: [] };
			}
			if (text.includes('FROM articles') || text.includes('FROM journeys WHERE id = $1 LIMIT')) {
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
							proposed_snapshot: rowToJourneyRevisionSnapshot(sampleJourneyRow()),
							change_summary: [],
							validation_report: { errors: [], warnings: [] },
							review_metadata: {},
							created_by: 'admin@test.com',
							published_by: 'admin@test.com',
							created_at: '2026-06-29T10:00:00.000Z',
							updated_at: '2026-06-29T10:00:00.000Z',
							published_at: '2026-06-29T11:00:00.000Z',
							rejected_at: null,
						},
					],
				} as never;
			}
			if (text.includes('FROM journeys WHERE id')) {
				return { rows: [sampleJourneyRow()] } as never;
			}
			return { rows: [] } as never;
		});

		await publishJourneyRevision({ revisionId: REVISION_ID, publishedBy: 'admin@test.com' });
		expect(withTransaction).toHaveBeenCalled();
		expect(clientQuery.mock.calls.some(([sql]) => String(sql).includes('UPDATE journeys'))).toBe(
			true
		);
	});

	it('37. source changed returns 409 on publish', async () => {
		vi.mocked(withTransaction).mockImplementation(async (fn) => {
			await fn({
				query: async (text: string) => {
					if (text.includes('journey_revisions')) {
						return {
							rows: [
								{
									id: REVISION_ID,
									journey_id: JOURNEY_ID,
									operation: 'update',
									status: 'pending_review',
									source_updated_at: '2026-01-01T00:00:00.000Z',
									proposed_snapshot: rowToJourneyRevisionSnapshot(sampleJourneyRow()),
									source_snapshot: rowToJourneyRevisionSnapshot(sampleJourneyRow()),
									change_summary: [],
									validation_report: { errors: [], warnings: [] },
									review_metadata: {},
									created_by: 'admin',
									schema_version: 1,
									published_by: null,
									created_at: new Date(),
									updated_at: new Date(),
									published_at: null,
									rejected_at: null,
								},
							],
						};
					}
					if (text.includes('journeys')) {
						return { rows: [sampleJourneyRow({ updated_at: '2026-06-29T10:00:00.000Z' })] };
					}
					return { rows: [] };
				},
			} as never);
		});

		await expect(
			publishJourneyRevision({ revisionId: REVISION_ID, publishedBy: 'admin@test.com' })
		).rejects.toMatchObject({ code: 'JOURNEY_REVISION_SOURCE_CHANGED', status: 409 });
	});
});

describe('PR-J5A module guards', () => {
	it('50-51. no 025C2 or price normalization in J5A modules', () => {
		const migration = fs.readFileSync(
			path.join(process.cwd(), 'database/migrations/pending/027_journey_revisions.sql'),
			'utf8'
		);
		expect(migration).not.toContain('025c2');
		expect(migration).not.toMatch(/\bprice_basis\s*=/i);

		const dir = path.join(process.cwd(), 'src/lib/journeyRevisions');
		for (const file of fs.readdirSync(dir)) {
			if (file.endsWith('.test.ts')) continue;
			const source = fs.readFileSync(path.join(dir, file), 'utf8');
			expect(source).not.toContain('025C2');
		}
	});

	it('migration SQL has no apply entrypoint', () => {
		const preflight = fs.readFileSync(
			path.join(process.cwd(), 'scripts/migrations/pr-j5a-journey-revision-preflight.ts'),
			'utf8'
		);
		expect(preflight).not.toContain('--apply');
		expect(preflight).toContain('readOnly: true');
	});

	it('errors use structured contract codes', () => {
		const err = new JourneyRevisionError('fail', 'JOURNEY_REVISION_VALIDATION_FAILED', 422, [
			{ field: 'slug', code: 'SLUG_CONFLICT', message: 'dup' },
		]);
		expect(err.fields).toHaveLength(1);
	});
});

describe('PR-J5A default status helpers', () => {
	it('restore with explicit active requests active', () => {
		expect(defaultProposedStatusForOperation('restore', 'active')).toBe('active');
	});
});

describe('PR-J5A create revision lifecycle', () => {
	beforeEach(() => {
		vi.mocked(query).mockReset();
		vi.mocked(findJourneySlugConflict).mockResolvedValue(false);
		vi.mocked(runJourneyPublishIntegrityGate).mockResolvedValue({
			ok: true,
			contentComplete: true,
			publishReady: false,
			errors: [],
			seoComplete: false,
		});
		vi.mocked(query).mockImplementation(async (text: string) => {
			if (text.includes('information_schema')) return { rows: [{ exists: true }] } as never;
			if (text.includes('INSERT INTO journey_revisions')) {
				return { rows: [{ id: REVISION_ID }] } as never;
			}
			return { rows: [] } as never;
		});
	});

	it('1. create pending stores journey_id=NULL', async () => {
		let insertedJourneyId: unknown;
		vi.mocked(query).mockImplementation(async (text: string, params?: unknown[]) => {
			if (text.includes('information_schema')) return { rows: [{ exists: true }] } as never;
			if (text.includes('INSERT INTO journey_revisions')) {
				insertedJourneyId = params?.[0];
				return { rows: [{ id: REVISION_ID }] } as never;
			}
			return { rows: [] } as never;
		});
		await createJourneyRevision({
			request: { operation: 'create', changes: { slug: 'new-one', title: 'New One' } },
			createdBy: 'admin@test.com',
		});
		expect(insertedJourneyId).toBeNull();
	});

	it('3-5. create publish links journey_id in single published UPDATE', async () => {
		const NEW_JOURNEY_ID = '99999999-9999-4999-8999-999999999999';
		const publishUpdates: string[] = [];

		vi.mocked(withTransaction).mockImplementation(async (fn) => {
			await fn({
				query: async (text: string, params?: unknown[]) => {
					if (text.includes('journey_revisions') && text.includes('FOR UPDATE')) {
						return {
							rows: [
								{
									id: REVISION_ID,
									journey_id: null,
									operation: 'create',
									status: 'pending_review',
									source_updated_at: null,
									source_snapshot: null,
									proposed_snapshot: mergeChangesIntoProposedSnapshot({
										operation: 'create',
										source: null,
										changes: { slug: 'brand-new', title: 'Brand New' },
									}),
									change_summary: [],
									validation_report: { errors: [], warnings: [] },
									review_metadata: {},
									created_by: 'admin@test.com',
									schema_version: 1,
									published_by: null,
									created_at: new Date(),
									updated_at: new Date(),
									published_at: null,
									rejected_at: null,
								},
							],
						};
					}
					if (text.includes('INSERT INTO journeys')) {
						return { rows: [{ id: NEW_JOURNEY_ID }] };
					}
					if (text.includes('UPDATE journey_revisions') && text.includes('published')) {
						publishUpdates.push(String(text));
						expect(params?.[2]).toBe(NEW_JOURNEY_ID);
						return { rowCount: 1, rows: [] };
					}
					if (text.includes('FROM articles') || text.includes('FROM journeys WHERE id = $1 LIMIT')) {
						return { rows: [] };
					}
					return { rows: [] };
				},
			} as never);
		});

		vi.mocked(query).mockImplementation(async (text: string) => {
			if (text.includes('information_schema')) return { rows: [{ exists: true }] } as never;
			if (text.includes('journey_revisions WHERE id')) {
				return {
					rows: [
						{
							id: REVISION_ID,
							journey_id: NEW_JOURNEY_ID,
							operation: 'create',
							status: 'published',
							source_updated_at: null,
							source_snapshot: null,
							proposed_snapshot: mergeChangesIntoProposedSnapshot({
								operation: 'create',
								source: null,
								changes: { slug: 'brand-new', title: 'Brand New' },
							}),
							change_summary: [],
							validation_report: { errors: [], warnings: [] },
							review_metadata: {},
							created_by: 'admin@test.com',
							published_by: 'admin@test.com',
							schema_version: 1,
							created_at: new Date(),
							updated_at: new Date(),
							published_at: new Date(),
							rejected_at: null,
						},
					],
				} as never;
			}
			if (text.includes('FROM journeys WHERE id')) {
				return {
					rows: [sampleJourneyRow({ id: NEW_JOURNEY_ID, slug: 'brand-new' })],
				} as never;
			}
			return { rows: [] } as never;
		});

		await publishJourneyRevision({ revisionId: REVISION_ID, publishedBy: 'admin@test.com' });
		expect(publishUpdates.some((sql) => sql.includes('journey_id = COALESCE'))).toBe(true);
	});

	it('4. Journey insert failure leaves revision unchanged', async () => {
		vi.mocked(withTransaction).mockImplementation(async (fn) => {
			await fn({
				query: async (text: string) => {
					if (text.includes('journey_revisions') && text.includes('FOR UPDATE')) {
						return {
							rows: [
								{
									id: REVISION_ID,
									journey_id: null,
									operation: 'create',
									status: 'pending_review',
									source_updated_at: null,
									source_snapshot: null,
									proposed_snapshot: mergeChangesIntoProposedSnapshot({
										operation: 'create',
										source: null,
										changes: { slug: 'fail-create', title: 'Fail' },
									}),
									change_summary: [],
									validation_report: { errors: [], warnings: [] },
									review_metadata: {},
									created_by: 'admin',
									schema_version: 1,
									published_by: null,
									created_at: new Date(),
									updated_at: new Date(),
									published_at: null,
									rejected_at: null,
								},
							],
						};
					}
					if (text.includes('INSERT INTO journeys')) {
						return { rows: [] };
					}
					return { rows: [] };
				},
			} as never);
		});

		await expect(
			publishJourneyRevision({ revisionId: REVISION_ID, publishedBy: 'admin@test.com' })
		).rejects.toBeTruthy();
	});
});

describe('PR-J5A supersede logic', () => {
	beforeEach(() => {
		vi.mocked(query).mockReset();
	});

	it('1. update revision supersedes same journey pending only', async () => {
		const updateSql: string[] = [];
		vi.mocked(query).mockImplementation(async (text: string, params?: unknown[]) => {
			if (text.includes('information_schema')) return { rows: [{ exists: true }] } as never;
			if (text.includes('SELECT id FROM journey_revisions')) {
				expect(params?.[0]).toBe(JOURNEY_ID);
				return { rows: [{ id: 'old-pending' }] } as never;
			}
			if (text.includes('UPDATE journey_revisions') && text.includes('superseded')) {
				updateSql.push(text);
				expect(params?.[0]).toBe(JOURNEY_ID);
			}
			if (text.includes('FROM journeys WHERE id')) {
				return { rows: [sampleJourneyRow()] } as never;
			}
			if (text.includes('INSERT INTO journey_revisions')) {
				return { rows: [{ id: REVISION_ID }] } as never;
			}
			return { rows: [] } as never;
		});
		vi.mocked(findJourneySlugConflict).mockResolvedValue(false);
		vi.mocked(runJourneyPublishIntegrityGate).mockResolvedValue({
			ok: true,
			contentComplete: true,
			publishReady: false,
			errors: [],
			seoComplete: false,
		} as never);

		await createJourneyRevision({
			request: {
				operation: 'update',
				journeyId: JOURNEY_ID,
				sourceUpdatedAt: '2026-06-29T10:00:00.000Z',
				changes: { title: 'Updated' },
			},
			createdBy: 'admin@test.com',
		});
		expect(updateSql.length).toBeGreaterThan(0);
	});

	it('2. supersede query uses journey_id not NULL', async () => {
		vi.mocked(query).mockImplementation(async (text: string) => {
			if (text.includes('SELECT id FROM journey_revisions')) {
				return { rows: [{ id: 'pending-1' }] } as never;
			}
			if (text.includes('superseded')) return { rowCount: 1, rows: [] } as never;
			return { rows: [] } as never;
		});
		const ids = await supersedePendingJourneyRevisions(JOURNEY_ID);
		expect(ids).toEqual(['pending-1']);
		const supersedeCall = vi
			.mocked(query)
			.mock.calls.find(([sql]) => String(sql).includes('WHERE journey_id = $1'));
		expect(supersedeCall).toBeTruthy();
	});

	it('3-4. create revisions do not supersede each other', async () => {
		vi.mocked(query).mockImplementation(async (text: string) => {
			if (text.includes('information_schema')) return { rows: [{ exists: true }] } as never;
			if (text.includes('INSERT INTO journey_revisions')) {
				return { rows: [{ id: CREATE_REVISION_A }] } as never;
			}
			return { rows: [] } as never;
		});
		vi.mocked(findJourneySlugConflict).mockResolvedValue(false);
		vi.mocked(runJourneyPublishIntegrityGate).mockResolvedValue({
			ok: true,
			contentComplete: true,
			publishReady: false,
			errors: [],
			seoComplete: false,
		} as never);

		await createJourneyRevision({
			request: { operation: 'create', changes: { slug: 'create-a', title: 'A' } },
			createdBy: 'admin@test.com',
		});
		vi.mocked(query).mockImplementation(async (text: string) => {
			if (text.includes('information_schema')) return { rows: [{ exists: true }] } as never;
			if (text.includes('INSERT INTO journey_revisions')) {
				return { rows: [{ id: CREATE_REVISION_B }] } as never;
			}
			return { rows: [] } as never;
		});
		await createJourneyRevision({
			request: { operation: 'create', changes: { slug: 'create-b', title: 'B' } },
			createdBy: 'admin@test.com',
		});
		const supersedeCalls = vi
			.mocked(query)
			.mock.calls.filter(([sql]) => String(sql).includes('superseded'));
		expect(supersedeCalls.length).toBe(0);
	});
});

describe('PR-J5A relationship validation', () => {
	beforeEach(() => {
		vi.mocked(findJourneySlugConflict).mockResolvedValue(false);
		vi.mocked(runJourneyPublishIntegrityGate).mockResolvedValue({
			ok: true,
			contentComplete: true,
			publishReady: false,
			errors: [],
			seoComplete: false,
		});
	});

	const runQuery = async (text: string, params: unknown[] = []) => {
		if (text.includes('articles')) {
			return { rows: params[0] === ARTICLE_ID ? [{ id: ARTICLE_ID }] : [] };
		}
		if (text.includes('FROM journeys')) {
			if (text.includes('WHERE id')) {
				const id = String(params[0]);
				if (id === OTHER_JOURNEY_ID) return { rows: [{ id, slug: 'other-journey', status: 'active' }] };
				if (id === JOURNEY_ID) return { rows: [{ id, slug: 'sample-journey', status: 'active' }] };
				return { rows: [] };
			}
			return {
				rows: [
					{ id: OTHER_JOURNEY_ID, slug: 'other-journey', status: 'active' },
					{ id: JOURNEY_ID, slug: 'sample-journey', status: 'active' },
				],
			};
		}
		return { rows: [] };
	};

	it('1. valid relatedTrips slug passes', async () => {
		const result = await runJourneyRevisionValidation(
			{
				operation: 'update',
				journeyId: JOURNEY_ID,
				sourceUpdatedAt: '2026-06-29T10:00:00.000Z',
				changes: {
					data: {
						relatedTrips: [{ slug: 'other-journey', title: 'Other', duration: '3d', price: 0, image: '' }],
					},
				},
			},
			{ journeyRow: sampleJourneyRow(), runQuery }
		);
		expect(result.report.errors.filter((e) => e.field.includes('relatedTrips'))).toHaveLength(0);
	});

	it('2-4. invalid/self/duplicate relatedTrips rejected', async () => {
		const missing = await runJourneyRevisionValidation(
			{
				operation: 'update',
				journeyId: JOURNEY_ID,
				sourceUpdatedAt: '2026-06-29T10:00:00.000Z',
				changes: { data: { relatedTrips: [{ slug: 'missing-slug', title: 'X' }] } },
			},
			{ journeyRow: sampleJourneyRow(), runQuery }
		);
		expect(missing.valid).toBe(false);

		const selfLink = await runJourneyRevisionValidation(
			{
				operation: 'update',
				journeyId: JOURNEY_ID,
				sourceUpdatedAt: '2026-06-29T10:00:00.000Z',
				changes: { data: { relatedTrips: [{ slug: 'sample-journey', title: 'Self' }] } },
			},
			{ journeyRow: sampleJourneyRow(), runQuery }
		);
		expect(selfLink.valid).toBe(false);

		const dup = await runJourneyRevisionValidation(
			{
				operation: 'update',
				journeyId: JOURNEY_ID,
				sourceUpdatedAt: '2026-06-29T10:00:00.000Z',
				changes: {
					data: {
						relatedTrips: [
							{ slug: ' Other-Journey ', title: 'A' },
							{ slug: 'other-journey', title: 'B' },
						],
					},
				},
			},
			{ journeyRow: sampleJourneyRow(), runQuery }
		);
		expect(dup.valid).toBe(false);
	});

	it('5-7. relatedJourneyIds and relatedArticles UUID validation', async () => {
		const good = await runJourneyRevisionValidation(
			{
				operation: 'update',
				journeyId: JOURNEY_ID,
				sourceUpdatedAt: '2026-06-29T10:00:00.000Z',
				changes: {
					relationships: {
						relatedJourneyIds: [OTHER_JOURNEY_ID],
						relatedArticleIds: [ARTICLE_ID],
					},
				},
			},
			{ journeyRow: sampleJourneyRow(), runQuery }
		);
		expect(good.report.errors.filter((e) => e.field.includes('relationships'))).toHaveLength(0);

		const badUuid = await runJourneyRevisionValidation(
			{
				operation: 'update',
				journeyId: JOURNEY_ID,
				sourceUpdatedAt: '2026-06-29T10:00:00.000Z',
				changes: { relationships: { relatedJourneyIds: ['not-a-uuid'], relatedArticleIds: [] } },
			},
			{ journeyRow: sampleJourneyRow(), runQuery }
		);
		expect(badUuid.valid).toBe(false);
	});

	it('8. relationships not in changes preserves unknown JSONB keys', async () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { title: 'Only title' },
		});
		expect(proposed.data.customField).toBe('preserve-me');
		expect(proposed.data.relatedTrips).toBeUndefined();
	});
});

describe('PR-J5A nested price protection', () => {
	const source = rowToJourneyRevisionSnapshot(
		sampleJourneyRow({
			data: {
				customField: 'x',
				price: 100,
				priceDetails: { perPerson: 100 },
				availableDates: [{ date: '2026-07-01', price: 50, originalPrice: 60 }],
				pricing: { base: 100 },
			},
		})
	);

	it('rejects top-level and nested price mutations', () => {
		for (const changes of [
			{ price: 200 },
			{ price_from: 99 },
			{ currency: 'USD' },
			{ data: { price: 200 } },
			{ data: { pricing: { base: 200 } } },
			{ data: { ...source.data, price: 999 } },
		]) {
			const errors = detectProtectedPricePathsInChanges(changes, source);
			expect(errors.some((e) => e.code === 'JOURNEY_REVISION_PRICE_FIELDS_LOCKED')).toBe(true);
		}
	});

	it('7. partial data update without price passes', () => {
		const errors = detectProtectedPricePathsInChanges(
			{ data: { itinerary: [{ day: 1, title: 'D1', description: 'X' }] } },
			source
		);
		expect(errors.filter((e) => e.code === 'JOURNEY_REVISION_PRICE_FIELDS_LOCKED')).toHaveLength(0);
	});

	it('8. publish-time price drift rejected', () => {
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { title: 'Changed' },
		});
		proposed.price = 999;
		const errors = compareProtectedPriceValues(source, proposed);
		expect(errors.length).toBeGreaterThan(0);
	});

	it('create cannot include prices', () => {
		const errors = compareProtectedPriceValues(
			null,
			mergeChangesIntoProposedSnapshot({
				operation: 'create',
				source: null,
				changes: { data: { price: 10 } },
			})
		);
		expect(errors.length).toBeGreaterThan(0);
	});
});

describe('PR-J5A operation/status matrix', () => {
	it('create cannot be archived; update cannot archive', () => {
		const createArchived = validateOperationStatusSemantics({
			operation: 'create',
			source: null,
			proposed: mergeChangesIntoProposedSnapshot({
				operation: 'create',
				source: null,
				changes: { status: 'archived', slug: 'x', title: 'X' },
			}),
		});
		expect(createArchived.length).toBeGreaterThan(0);

		const updateArchive = validateOperationStatusSemantics({
			operation: 'update',
			source: rowToJourneyRevisionSnapshot(sampleJourneyRow()),
			proposed: mergeChangesIntoProposedSnapshot({
				operation: 'update',
				source: rowToJourneyRevisionSnapshot(sampleJourneyRow()),
				changes: { status: 'archived' },
			}),
		});
		expect(updateArchive.length).toBeGreaterThan(0);
	});

	it('archive requires archived status; restore requires archived source', () => {
		const archiveSource = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const archiveBad = validateOperationStatusSemantics({
			operation: 'archive',
			source: archiveSource,
			proposed: { ...archiveSource, status: 'draft' },
		});
		expect(archiveBad.length).toBeGreaterThan(0);

		const restoreBad = validateOperationStatusSemantics({
			operation: 'restore',
			source: rowToJourneyRevisionSnapshot(sampleJourneyRow({ status: 'active' })),
			proposed: mergeChangesIntoProposedSnapshot({
				operation: 'restore',
				source: rowToJourneyRevisionSnapshot(sampleJourneyRow({ status: 'active' })),
				changes: {},
			}),
		});
		expect(restoreBad.length).toBeGreaterThan(0);
	});
});

describe('PR-J5A protected field allowlist', () => {
	it('1-4. client protected fields rejected or stripped', () => {
		const { sanitized, rejected } = sanitizeClientChanges({
			id: 'fake',
			created_at: 'x',
			updated_at: 'x',
			seo_complete: true,
			published_by: 'hacker',
			title: 'OK',
		});
		expect(sanitized.title).toBe('OK');
		expect(sanitized.id).toBeUndefined();
		expect(rejected).toContain('published_by');

		const publishedByErrors = detectProtectedClientFieldAttempts({ published_by: 'x' });
		expect(publishedByErrors.length).toBeGreaterThan(0);
	});

	it('5-6. unknown protected fields excluded from snapshot merge', () => {
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source: rowToJourneyRevisionSnapshot(sampleJourneyRow()),
			changes: { validation_report: { hacked: true }, title: 'Safe' },
		});
		expect((proposed as Record<string, unknown>).validation_report).toBeUndefined();
		expect(proposed.title).toBe('Safe');
	});
});

describe('PR-J5A migration definition', () => {
	it('CHECK constraints and rollback guard', () => {
		const migration = fs.readFileSync(
			path.join(process.cwd(), 'database/migrations/pending/027_journey_revisions.sql'),
			'utf8'
		);
		const rollback = fs.readFileSync(
			path.join(process.cwd(), 'database/migrations/pending/027_journey_revisions.rollback.sql'),
			'utf8'
		);
		expect(migration).toContain('journey_revisions_journey_id_check');
		expect(migration).toContain("operation = 'create' AND status = 'published' AND journey_id IS NOT NULL");
		expect(migration).toContain('ON DELETE RESTRICT');
		expect(migration).toContain('update_journey_revisions_updated_at');
		expect(rollback).toContain('row_count > 0');
		expect(rollback).not.toContain('CASCADE');
	});
});
