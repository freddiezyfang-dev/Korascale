import { describe, expect, it } from 'vitest';

import { mapArticleRevisionRow } from './articleRevisionQuery.server';
import revisionWithFactChecks from './fixtures/revision-with-fact-checks.fixture.json';
import { validateSeoRevisionSubmission } from './schema';
import { toReviewMetadata } from './schema';

describe('mapArticleRevisionRow', () => {
	it('reads legacy rows with empty review_metadata safely', () => {
		const record = mapArticleRevisionRow({
			id: '9fea050d-74c1-4926-9c29-8aa82e585880',
			article_id: '11111111-1111-4111-8111-111111111111',
			source_slug: 'sample',
			source_snapshot: { title: 'Before' },
			proposed_content: { title: 'After' },
			review_metadata: {},
			status: 'pending',
			created_by: 'codex',
			created_at: new Date('2026-06-17T08:00:00.000Z'),
			updated_at: new Date('2026-06-17T08:00:00.000Z'),
			published_at: null,
		});

		expect(record.reviewMetadata).toEqual({
			changeSummary: '',
			factCheckItems: [],
		});
		expect(record.sourceUpdatedAt).toBeNull();
		expect(record.proposedContent).toEqual({ title: 'After' });
	});

	it('maps stored review_metadata without mixing into proposed_content', () => {
		const validation = validateSeoRevisionSubmission(revisionWithFactChecks);
		expect(validation.success).toBe(true);
		if (!validation.success) return;

		const reviewMetadata = toReviewMetadata(validation.data);
		const record = mapArticleRevisionRow({
			id: 'rev-fact-check',
			article_id: validation.data.sourceArticleId,
			source_slug: validation.data.sourceSlug,
			source_snapshot: { title: 'Before' },
			proposed_content: { title: validation.data.title },
			review_metadata: reviewMetadata,
			status: 'pending',
			created_by: 'codex-test',
			created_at: new Date(),
			updated_at: new Date(),
			published_at: null,
		});

		expect(record.reviewMetadata.changeSummary).toBe(validation.data.changeSummary);
		expect(record.reviewMetadata.factCheckItems).toEqual(validation.data.factCheckItems);
		expect(record.proposedContent).not.toHaveProperty('changeSummary');
		expect(record.proposedContent).not.toHaveProperty('factCheckItems');
		expect(record.sourceSnapshot).not.toHaveProperty('changeSummary');
		expect(record.sourceSnapshot).not.toHaveProperty('factCheckItems');
	});
});
