import { describe, expect, it } from 'vitest';

import { toReviewMetadata } from './schema';
import {
	assertProposedContentIsPublishableOnly,
	normalizeReviewMetadata,
	SEO_PROPOSED_CONTENT_KEYS,
	SEO_REVIEW_METADATA_KEYS,
} from './reviewMetadata';

describe('reviewMetadata', () => {
	it('returns safe defaults for legacy empty review_metadata', () => {
		expect(normalizeReviewMetadata({})).toEqual({
			changeSummary: '',
			factCheckItems: [],
		});
		expect(normalizeReviewMetadata(null)).toEqual({
			changeSummary: '',
			factCheckItems: [],
		});
	});

	it('preserves changeSummary and all factCheckItem fields', () => {
		const metadata = normalizeReviewMetadata({
			changeSummary: 'Updated SEO title and FAQ.',
			factCheckItems: [
				{
					item: 'Verify visa-free transit rules',
					resolved: false,
					note: 'Needs embassy source',
				},
				{
					item: 'Confirm route name spelling',
					resolved: true,
				},
			],
		});

		expect(metadata.changeSummary).toBe('Updated SEO title and FAQ.');
		expect(metadata.factCheckItems).toHaveLength(2);
		expect(metadata.factCheckItems[0]).toEqual({
			item: 'Verify visa-free transit rules',
			resolved: false,
			note: 'Needs embassy source',
		});
		expect(metadata.factCheckItems[1]).toEqual({
			item: 'Confirm route name spelling',
			resolved: true,
		});
	});

	it('toReviewMetadata mirrors validated submission review fields', () => {
		const metadata = toReviewMetadata({
			changeSummary: 'Summary text',
			factCheckItems: [{ item: 'Check policy', resolved: false }],
		});
		expect(metadata).toEqual({
			changeSummary: 'Summary text',
			factCheckItems: [{ item: 'Check policy', resolved: false }],
		});
	});

	it('rejects review fields inside proposed_content', () => {
		expect(() =>
			assertProposedContentIsPublishableOnly({
				title: 'Example',
				changeSummary: 'hidden',
			})
		).toThrow(/changeSummary/);
		expect(() =>
			assertProposedContentIsPublishableOnly({
				title: 'Example',
				factCheckItems: [],
			})
		).toThrow(/factCheckItems/);
	});

	it('documents separate proposed vs review key sets', () => {
		expect(SEO_PROPOSED_CONTENT_KEYS).not.toContain('changeSummary');
		expect(SEO_PROPOSED_CONTENT_KEYS).not.toContain('factCheckItems');
		expect(SEO_REVIEW_METADATA_KEYS).toEqual(['changeSummary', 'factCheckItems']);
	});
});
