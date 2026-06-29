import { describe, expect, it, vi } from 'vitest';

import {
	evaluateJourneyContentCompleteness,
	JOURNEY_PUBLISH_INTEGRITY_ERROR,
	validateJourneyPublishReadiness,
	type JourneyPublishCandidate,
} from '@/lib/journeyNormalization/journeyPublishIntegrity';
import {
	mergePublishCandidateWithUpdates,
	publishCandidateFromCreatePayload,
} from '@/lib/journeyNormalization/journeyPublishIntegrity.server';
import { runJourneyPublishIntegrityGate } from '@/lib/journeyNormalization/journeyPublishIntegrityGate.server';
import { buildPublicStatusWhereClause } from '@/lib/journeyNormalization/status';
import { mapJourneyRowToPublicJourney } from '@/lib/journeyListQuery.server';

vi.mock('@/lib/db', () => ({
	query: vi.fn(),
}));

import { query } from '@/lib/db';

function completeCandidate(
	overrides: Partial<JourneyPublishCandidate> = {}
): JourneyPublishCandidate {
	return {
		id: 'journey-1',
		title: 'Sample Journey',
		slug: 'sample-journey',
		short_description: 'Short copy',
		page_title: 'Page Title',
		meta_description: 'Meta description',
		hero_image_url: '/hero.jpg',
		hero_image_alt: 'Hero alt',
		journey_type_slug: 'deep-discovery',
		status: 'active',
		...overrides,
	};
}

describe('PR-J3B journey publish integrity evaluator', () => {
	it('1. complete active Journey passes', () => {
		const result = validateJourneyPublishReadiness(completeCandidate());
		expect(result.publishReady).toBe(true);
		expect(result.contentComplete).toBe(true);
	});

	it('2. missing title rejected', () => {
		const result = evaluateJourneyContentCompleteness(completeCandidate({ title: '  ' }));
		expect(result.contentComplete).toBe(false);
		expect(result.errors.some((e) => e.field === 'title')).toBe(true);
	});

	it('3. missing slug rejected', () => {
		const result = evaluateJourneyContentCompleteness(completeCandidate({ slug: '' }));
		expect(result.errors.some((e) => e.field === 'slug' && e.code === 'REQUIRED')).toBe(true);
	});

	it('4-7. invalid slug formats rejected', () => {
		for (const slug of ['sample-', '-sample', 'sample--journey', 'Sample-Journey']) {
			const result = evaluateJourneyContentCompleteness(completeCandidate({ slug }));
			expect(result.contentComplete).toBe(false);
			expect(result.errors.some((e) => e.field === 'slug')).toBe(true);
		}
	});

	it('8-9. duplicate slug rejected and self excluded in gate context', async () => {
		vi.mocked(query).mockResolvedValue({
			rows: [
				{ id: 'other-id', slug: 'sample-journey' },
				{ id: 'journey-1', slug: 'sample-journey' },
			],
		} as never);
		const gate = await runJourneyPublishIntegrityGate(completeCandidate());
		expect(gate.ok).toBe(false);
		if (gate.ok) return;
		expect(gate.body.error).toBe(JOURNEY_PUBLISH_INTEGRITY_ERROR);
		expect(gate.body.fields.some((f) => f.code === 'SLUG_CONFLICT')).toBe(true);

		const selfOk = await runJourneyPublishIntegrityGate(
			completeCandidate({ id: 'only-id', slug: 'unique-slug' })
		);
		expect(selfOk.ok).toBe(true);
	});

	it('10-14. missing publish fields rejected for active', () => {
		for (const field of [
			'short_description',
			'page_title',
			'meta_description',
			'hero_image_url',
			'hero_image_alt',
		] as const) {
			const result = evaluateJourneyContentCompleteness(completeCandidate({ [field]: '  ' }));
			expect(result.errors.some((e) => e.field === field)).toBe(true);
		}
	});

	it('15-16. journey type slug validation', () => {
		const invalid = evaluateJourneyContentCompleteness(
			completeCandidate({ journey_type_slug: 'legacy-type' })
		);
		expect(invalid.errors.some((e) => e.code === 'INVALID_JOURNEY_TYPE')).toBe(true);

		for (const journey_type_slug of [
			'explore-together',
			'deep-discovery',
			'signature-journeys',
			'group-tours',
		] as const) {
			const ok = evaluateJourneyContentCompleteness(
				completeCandidate({ journey_type_slug })
			);
			expect(ok.contentComplete).toBe(true);
		}
	});

	it('17-18. draft and archived may be incomplete', async () => {
		const draft = await runJourneyPublishIntegrityGate(
			completeCandidate({
				status: 'draft',
				meta_description: '',
				page_title: '',
			})
		);
		expect(draft.ok).toBe(true);
		if (!draft.ok) return;
		expect(draft.seoComplete).toBe(false);

		const archived = await runJourneyPublishIntegrityGate(
			completeCandidate({ status: 'archived', page_title: '' })
		);
		expect(archived.ok).toBe(true);
	});

	it('19. active edit remains valid when merged row stays complete', () => {
		const existing = completeCandidate({ status: 'active' });
		const merged = mergePublishCandidateWithUpdates(existing, { title: 'Updated Title' });
		expect(validateJourneyPublishReadiness(merged).publishReady).toBe(true);
	});

	it('20. active edit clearing meta_description fails', () => {
		const existing = completeCandidate({ status: 'active' });
		const merged = mergePublishCandidateWithUpdates(existing, { metaDescription: '  ' });
		expect(validateJourneyPublishReadiness(merged).publishReady).toBe(false);
	});

	it('21. active to archived may clear fields', async () => {
		const existing = completeCandidate({ status: 'active' });
		const merged = mergePublishCandidateWithUpdates(existing, {
			status: 'archived',
			metaDescription: '',
		});
		const gate = await runJourneyPublishIntegrityGate(merged);
		expect(gate.ok).toBe(true);
		if (!gate.ok) return;
		expect(gate.seoComplete).toBe(false);
	});

	it('22. draft publish incomplete rejected', async () => {
		const candidate = publishCandidateFromCreatePayload(
			{
				title: 'Draft',
				slug: 'draft-journey',
				status: 'active',
				shortDescription: '',
			},
			'active'
		);
		const gate = await runJourneyPublishIntegrityGate(candidate);
		expect(gate.ok).toBe(false);
	});

	it('23. PATCH status-only uses merged existing row', () => {
		const existing = completeCandidate({ status: 'draft' });
		const merged = mergePublishCandidateWithUpdates(existing, { status: 'active' });
		expect(validateJourneyPublishReadiness(merged).publishReady).toBe(true);
	});

	it('26-29. client seo_complete ignored; server computes contentComplete', () => {
		const incomplete = publishCandidateFromCreatePayload(
			{
				title: 'Draft',
				slug: 'draft-journey',
				status: 'draft',
				shortDescription: '',
				seo_complete: true,
			} as never,
			'draft'
		);
		expect(evaluateJourneyContentCompleteness(incomplete).contentComplete).toBe(false);

		const completeDraft = evaluateJourneyContentCompleteness(
			completeCandidate({ status: 'draft', id: 'draft-1' })
		);
		expect(completeDraft.contentComplete).toBe(true);
	});

	it('30. archived seo_complete true does not affect public SQL', () => {
		expect(buildPublicStatusWhereClause()).toBe("status = 'active'");
	});

	it('31. active seo_complete false is not used in public query', () => {
		const source = mapJourneyRowToPublicJourney.toString();
		expect(source).not.toContain('seo_complete');
	});

	it('32-33. stable API error contract', async () => {
		vi.mocked(query).mockResolvedValue({ rows: [{ id: 'other', slug: 'sample-journey' }] } as never);
		const gate = await runJourneyPublishIntegrityGate(completeCandidate());
		expect(gate.ok).toBe(false);
		if (gate.ok) return;
		expect(gate.status).toBe(422);
		expect(gate.body.error).toBe(JOURNEY_PUBLISH_INTEGRITY_ERROR);
		expect(Array.isArray(gate.body.fields)).toBe(true);
	});

	it('41. J3A public mapper still normalized-only', () => {
		const source = mapJourneyRowToPublicJourney.toString();
		expect(source).not.toContain('adminCompat');
		expect(source).not.toContain('jsonb');
	});

	it('42-43. no 025C2 or price normalization in evaluator module', () => {
		const source = evaluateJourneyContentCompleteness.toString();
		expect(source).not.toContain('price_basis');
		expect(source).not.toContain('025C2');
	});
});
