import fs from 'fs';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';

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
	buildRevisionJsonbCompatibilityMap,
	canonicalizeJourneyRevisionProposedSnapshot,
	detectRevisionSnapshotCompatibilityMismatches,
	REVISION_COMPATIBILITY_SYNC_KEYS,
} from '@/lib/journeyRevisions/compatibilityMapping';
import { publishJourneyRevision } from '@/lib/journeyRevisions/publish.server';
import {
	mergeChangesIntoProposedSnapshot,
	rowToJourneyRevisionSnapshot,
} from '@/lib/journeyRevisions/snapshot';
import { dryRunJourneyRevision } from '@/lib/journeyRevisions/dryRun.server';

const JOURNEY_ID = '11111111-1111-4111-8111-111111111111';
const REVISION_ID = '33333333-3333-4333-8333-333333333333';

function sampleJourneyRow(overrides: Record<string, unknown> = {}) {
	return {
		id: JOURNEY_ID,
		slug: 'sample-journey',
		status: 'active',
		title: 'Sample Journey',
		short_description: 'Short',
		description: 'Desc',
		page_title: 'Old page title',
		meta_description: 'Old meta',
		hero_image_url: '/old-hero.jpg',
		hero_image_alt: 'Old alt',
		journey_type_slug: 'deep-discovery',
		journey_type: 'Deep Discovery',
		display_order: 5,
		seo_complete: true,
		price: 100,
		original_price: 120,
		currency: null,
		price_from: null,
		price_basis: null,
		price_on_request: null,
		price_note: null,
		price_valid_until: null,
		data: {
			pageTitle: 'Old page title',
			metaDescription: 'Old meta',
			heroImage: '/old-hero.jpg',
			heroAlt: 'Old alt',
			heroImageAlt: 'Old alt',
			journeyType: 'Deep Discovery',
			itinerary: [{ day: 1, title: 'Day 1' }],
			gallery: ['g.jpg'],
			faqs: [{ question: 'Q', answer: 'A' }],
			relatedJourneyIds: ['22222222-2222-4222-8222-222222222222'],
			customField: 'preserve-me',
		},
		journey_revision_source_updated_at: '2026-06-29T10:00:00.000Z',
		updated_at: '2026-06-29 10:00:00.000',
		created_at: '2026-06-01T10:00:00.000Z',
		...overrides,
	};
}

describe('PR-J5C3 proposed snapshot canonicalization', () => {
	it('syncs normalized SEO and hero fields into compatibility JSONB', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: {
				meta_description: 'New meta',
				page_title: 'New page title',
				hero_image_url: '/new-hero.jpg',
				hero_image_alt: 'New hero alt',
			},
		});

		expect(proposed.data.metaDescription).toBe('New meta');
		expect(proposed.data.pageTitle).toBe('New page title');
		expect(proposed.data.heroImage).toBe('/new-hero.jpg');
		expect(proposed.data.heroAlt).toBe('New hero alt');
		expect(proposed.data.heroImageAlt).toBe('New hero alt');
		expect(detectRevisionSnapshotCompatibilityMismatches(proposed)).toEqual([]);
	});

	it('syncs journey_type_slug using the compatibility label', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { journey_type_slug: 'explore-together' },
		});

		expect(proposed.journey_type).toBe('Explore Together');
		expect(proposed.data.journeyType).toBe('Explore Together');
		expect(proposed.data.journeyType).not.toBe('explore-together');
	});

	it('does not require users to submit JSONB compatibility keys and resolves conflicts authoritatively', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: {
				meta_description: 'Normalized wins',
				data: { metaDescription: 'Stale user JSONB value' },
			},
		});

		expect(proposed.meta_description).toBe('Normalized wins');
		expect(proposed.data.metaDescription).toBe('Normalized wins');
		expect(proposed.data.customField).toBe('preserve-me');
	});

	it('preserves itinerary, gallery, FAQ, relationships, unknown JSONB, and prices on partial meta update', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { meta_description: 'Only meta changed' },
		});

		expect(proposed.data.itinerary).toEqual(source.data.itinerary);
		expect(proposed.data.gallery).toEqual(source.data.gallery);
		expect(proposed.data.faqs).toEqual(source.data.faqs);
		expect(proposed.relationships).toEqual(source.relationships);
		expect(proposed.data.customField).toBe('preserve-me');
		expect(proposed.price).toBe(source.price);
		expect(proposed.original_price).toBe(source.original_price);
		expect(proposed.seo_complete).toBe(false);
	});

	it('dry-run resolvedSnapshot is canonical and change summary reports the business field once', async () => {
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
			if (text.includes('FROM journeys WHERE id')) return { rows: [sampleJourneyRow()] } as never;
			return { rows: [] } as never;
		});

		const result = await dryRunJourneyRevision({
			operation: 'update',
			journeyId: JOURNEY_ID,
			sourceUpdatedAt: '2026-06-29T10:00:00.000Z',
			changes: { meta_description: 'Dry-run meta' },
		});

		expect(result.valid).toBe(true);
		expect(result.resolvedSnapshot.data.metaDescription).toBe('Dry-run meta');
		expect(result.changeSummary).toEqual(['meta_description updated']);
	});

	it('legacy mismatched pending revision is rejected before publish and is not patched', async () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = {
			...mergeChangesIntoProposedSnapshot({
				operation: 'update',
				source,
				changes: { meta_description: 'Expected meta' },
			}),
			data: { ...source.data, metaDescription: null },
		};
		let markedPublished = false;

		vi.mocked(query).mockImplementation(async (text: string) => {
			if (text.includes('information_schema')) return { rows: [{ exists: true }] } as never;
			return { rows: [] } as never;
		});
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
									source_snapshot: source,
									proposed_snapshot: proposed,
									change_summary: ['meta_description updated'],
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
					if (text.includes('UPDATE journey_revisions') && text.includes('published')) {
						markedPublished = true;
					}
					return { rows: [] };
				},
			} as never);
		});

		await expect(
			publishJourneyRevision({ revisionId: REVISION_ID, publishedBy: 'admin@test.com' })
		).rejects.toMatchObject({
			code: 'JOURNEY_REVISION_PROPOSED_SNAPSHOT_INTEGRITY_FAILED',
			status: 409,
		});
		expect(markedPublished).toBe(false);
	});

	it('preflight and audit artifacts exist', () => {
		expect(
			fs.existsSync(
				path.join(
					process.cwd(),
					'scripts/migrations/pr-j5c3-proposed-snapshot-canonicalization-preflight.ts'
				)
			)
		).toBe(true);
		expect(
			fs.existsSync(
				path.join(
					process.cwd(),
					'docs/audits/pr-j5c3-proposed-snapshot-canonicalization-audit.md'
				)
			)
		).toBe(true);
		expect(REVISION_COMPATIBILITY_SYNC_KEYS).toContain('data.metaDescription');
		expect(buildRevisionJsonbCompatibilityMap(rowToJourneyRevisionSnapshot(sampleJourneyRow()))).toMatchObject({
			metaDescription: 'Old meta',
			journeyType: 'Deep Discovery',
		});
		expect(
			detectRevisionSnapshotCompatibilityMismatches(
				canonicalizeJourneyRevisionProposedSnapshot(
					rowToJourneyRevisionSnapshot(sampleJourneyRow())
				)
			)
		).toEqual([]);
	});
});
