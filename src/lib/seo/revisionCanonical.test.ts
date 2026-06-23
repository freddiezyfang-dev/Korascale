import { describe, expect, it } from 'vitest';

import { CANONICAL_ARTICLE_CATEGORIES } from '@/lib/articleCategories';

import {
	formatPublishConfirmMessage,
	getRevisionCanonicalPathWarning,
} from './revisionCanonical';

describe('revisionCanonical', () => {
	const slug = 'dissolution-vs-stimulation-why-the-world-needs-chengdus-teahouse-logic';

	it('returns null when category is unchanged', () => {
		const category = CANONICAL_ARTICLE_CATEGORIES[3];
		expect(
			getRevisionCanonicalPathWarning({ slug, publishedCategory: category, proposedCategory: category })
		).toBeNull();
	});

	it('returns current and proposed paths when category differs', () => {
		const warning = getRevisionCanonicalPathWarning({
			slug,
			publishedCategory: 'Destinations & Route Strategy',
			proposedCategory: 'Culture, Dining & Local Experiences',
		});
		expect(warning).not.toBeNull();
		expect(warning?.currentPath).toContain('destinations-route-strategy');
		expect(warning?.proposedPath).toContain('culture-dining-local-experiences');
		expect(warning?.message).toMatch(/redirect/i);
	});

	it('includes canonical warning in publish confirm message', () => {
		const warning = getRevisionCanonicalPathWarning({
			slug,
			publishedCategory: 'Destinations & Route Strategy',
			proposedCategory: 'Culture, Dining & Local Experiences',
		});
		const message = formatPublishConfirmMessage('Publish this revision?', warning);
		expect(message).toContain('Canonical path change');
		expect(message).toContain(warning!.currentPath);
		expect(message).toContain(warning!.proposedPath);
	});
});
