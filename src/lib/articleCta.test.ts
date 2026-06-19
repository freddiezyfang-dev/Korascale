import { describe, expect, it } from 'vitest';

import {
	getArticleBodyContentBlocks,
	getCtaDisplayBody,
	getPrimaryLegacyTripCtaBlock,
	isValidCtaUrl,
	PLAN_TRIP_CTA_HREF,
	resolveArticleCta,
	resolveArticleCtaPreview,
	resolveTemplateModeForCategory,
	validateArticleCtaCustomFields,
} from './articleCta';
import type { Article } from '../types/article';

function baseArticle(overrides: Partial<Article> = {}): Article {
	return {
		id: 'article-1',
		slug: 'sample-article',
		title: 'Sample',
		author: 'KoraScale',
		coverImage: '/cover.jpg',
		category: 'China Travel Planning',
		relatedJourneyIds: [],
		status: 'active',
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

describe('getCtaDisplayBody', () => {
	it('merges body and supportingText into one paragraph', () => {
		expect(
			getCtaDisplayBody({
				body: 'Custom body copy.',
				supportingText: 'Supporting line.',
			})
		).toBe('Custom body copy. Supporting line.');
	});

	it('returns only body when supportingText is empty', () => {
		expect(
			getCtaDisplayBody({
				body: 'Single paragraph.',
				supportingText: '',
			})
		).toBe('Single paragraph.');
	});
});

describe('resolveTemplateModeForCategory', () => {
	it('maps business category to corporate travel', () => {
		expect(
			resolveTemplateModeForCategory('Business Travel & Bleisure in China')
		).toBe('corporate_travel');
	});

	it('maps travel categories to private journey', () => {
		expect(resolveTemplateModeForCategory('China Travel Planning')).toBe('private_journey');
		expect(resolveTemplateModeForCategory('Destinations & Route Strategy')).toBe(
			'private_journey'
		);
		expect(resolveTemplateModeForCategory('Culture, Dining & Local Experiences')).toBe(
			'private_journey'
		);
	});

	it('falls back to private journey for unknown legacy categories', () => {
		expect(resolveTemplateModeForCategory('Ancient Chinese Culture')).toBe('private_journey');
	});
});

describe('resolveArticleCta', () => {
	it('returns corporate template for empty config + business category', () => {
		const result = resolveArticleCta(
			baseArticle({ category: 'Business Travel & Bleisure in China' })
		);
		expect(result?.mode).toBe('corporate_travel');
		expect(result?.eyebrow).toBe('CORPORATE TRAVEL IN CHINA');
		expect(result?.primaryHref).toBe(PLAN_TRIP_CTA_HREF);
	});

	it('returns private template for empty config + travel category', () => {
		const result = resolveArticleCta(baseArticle());
		expect(result?.heading).toBe('Plan a China Journey of Your Own');
		expect(result?.primaryLabel).toBe('Start Planning');
		expect(result?.primaryHref).toBe(PLAN_TRIP_CTA_HREF);
		expect(result?.secondaryLabel).toBe('Explore Journeys');
	});

	it('returns private template when mode is private_journey', () => {
		const result = resolveArticleCta(
			baseArticle({ ctaConfig: { mode: 'private_journey' } })
		);
		expect(result?.eyebrow).toBe('PRIVATE JOURNEYS IN CHINA');
	});

	it('returns corporate template when mode is corporate_travel', () => {
		const result = resolveArticleCta(
			baseArticle({ ctaConfig: { mode: 'corporate_travel' } })
		);
		expect(result?.primaryLabel).toBe('Discuss Your Visit');
	});

	it('returns null when hidden', () => {
		expect(resolveArticleCta(baseArticle({ ctaConfig: { mode: 'hidden' } }))).toBeNull();
	});

	it('returns custom fields in custom mode', () => {
		const result = resolveArticleCta(
			baseArticle({
				ctaConfig: {
					mode: 'custom',
					eyebrow: 'CUSTOM EYEBROW',
					heading: 'Custom Heading',
					body: 'Custom body copy.',
					supportingText: 'Supporting line.',
					primaryLabel: 'Primary Action',
					primaryHref: '/contact',
				},
			})
		);
		expect(result?.heading).toBe('Custom Heading');
		expect(result?.secondaryLabel).toBeUndefined();
	});

	it('omits secondary button when custom secondary is empty', () => {
		const result = resolveArticleCta(
			baseArticle({
				ctaConfig: {
					mode: 'custom',
					heading: 'Custom Heading',
					body: 'Custom body copy.',
					primaryLabel: 'Primary Action',
					primaryHref: '/contact',
					secondaryLabel: '',
					secondaryHref: '',
				},
			})
		);
		expect(result?.secondaryLabel).toBeUndefined();
		expect(result?.secondaryHref).toBeUndefined();
	});
});

describe('isValidCtaUrl', () => {
	it('accepts internal, https, and mailto URLs', () => {
		expect(isValidCtaUrl('/contact')).toBe(true);
		expect(isValidCtaUrl('https://example.com')).toBe(true);
		expect(isValidCtaUrl('mailto:test@example.com')).toBe(true);
	});

	it('rejects javascript and data URLs', () => {
		expect(isValidCtaUrl('javascript:alert(1)')).toBe(false);
		expect(isValidCtaUrl('data:text/html,<script>')).toBe(false);
	});
});

describe('validateArticleCtaCustomFields', () => {
	it('requires primary fields in custom mode', () => {
		const errors = validateArticleCtaCustomFields({ mode: 'custom' });
		expect(errors.heading).toBeTruthy();
		expect(errors.body).toBeTruthy();
		expect(errors.primaryLabel).toBeTruthy();
		expect(errors.primaryHref).toBeTruthy();
	});

	it('requires paired secondary label and URL', () => {
		const errors = validateArticleCtaCustomFields({
			mode: 'custom',
			heading: 'Heading',
			body: 'Body',
			primaryLabel: 'Go',
			primaryHref: '/contact',
			secondaryLabel: 'Secondary',
		});
		expect(errors.secondaryHref).toBeTruthy();
	});
});

describe('legacy trip_cta compatibility', () => {
	it('uses the last legacy trip_cta block as a heading fallback', () => {
		const result = resolveArticleCta(
			baseArticle({
				contentBlocks: [
					{ id: '1', type: 'paragraph', text: 'Intro' },
					{ id: '2', type: 'trip_cta', journeyId: 'j1', ctaText: 'First CTA' },
					{ id: '3', type: 'trip_cta', journeyId: 'j2', ctaText: 'Legacy Heading' },
				],
			})
		);
		expect(result?.heading).toBe('Legacy Heading');
		expect(getPrimaryLegacyTripCtaBlock(baseArticle().contentBlocks)).toBeNull();
	});

	it('suppresses legacy trip_cta blocks when page-level CTA renders', () => {
		const article = baseArticle({
			contentBlocks: [
				{ id: '1', type: 'paragraph', text: 'Intro' },
				{ id: '2', type: 'trip_cta', journeyId: 'j1', ctaText: 'Legacy Heading' },
			],
		});
		const filtered = getArticleBodyContentBlocks(article, true);
		expect(filtered.some((block) => block.type === 'trip_cta')).toBe(false);
	});
});

describe('resolveArticleCtaPreview', () => {
	it('does not use legacy trip_cta fallback in admin preview', () => {
		const preview = resolveArticleCtaPreview({
			category: 'China Travel Planning',
			contentBlocks: [{ id: '1', type: 'trip_cta', journeyId: 'j1', ctaText: 'Legacy' }],
		} as Article);
		expect(preview?.heading).toBe('Plan a China Journey of Your Own');
	});
});
