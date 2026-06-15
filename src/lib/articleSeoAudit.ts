import {
	CANONICAL_ARTICLE_CATEGORIES,
	LEGACY_ARTICLE_CATEGORIES,
} from '@/lib/articleCategories';

export type ArticleSeoIssueSeverity = 'critical' | 'warning' | 'info';

export type ArticleSeoIssue = {
	key: string;
	label: string;
	severity: ArticleSeoIssueSeverity;
	detail?: string;
};

export type ArticleSeoAuditStatus = 'good' | 'needs-work' | 'critical';

export type ArticleSeoAuditResult = {
	status: ArticleSeoAuditStatus;
	score: number;
	issues: ArticleSeoIssue[];
	flags: {
		missingPageTitle: boolean;
		missingMetaDescription: boolean;
		missingExcerpt: boolean;
		legacyCategory: boolean;
		tooManyTags: boolean;
		tooFewTags: boolean;
		missingFaqs: boolean;
		missingHeroImage: boolean;
		missingCoverImage: boolean;
		missingRelatedLinks: boolean;
		possibleMissingCta: boolean;
	};
};

export type ArticleSeoAuditInput = Record<string, unknown>;

const CTA_KEYWORDS = [
	'contact',
	'plan your trip',
	'private journey',
	'corporate travel',
	'business travel',
	'/contact',
	'/solutions/corporate-travel',
];

function pickString(source: ArticleSeoAuditInput, ...keys: string[]): string {
	for (const key of keys) {
		const value = source[key];
		if (typeof value === 'string' && value.trim()) {
			return value.trim();
		}
	}
	return '';
}

function pickArray(source: ArticleSeoAuditInput, ...keys: string[]): unknown[] {
	for (const key of keys) {
		const value = source[key];
		if (Array.isArray(value)) {
			return value;
		}
	}
	return [];
}

function normalizeTags(raw: unknown): string[] {
	if (Array.isArray(raw)) {
		return raw
			.filter((item): item is string => typeof item === 'string')
			.map((item) => item.trim())
			.filter(Boolean);
	}
	if (typeof raw === 'string') {
		return raw
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean);
	}
	return [];
}

function stripHtml(value: string): string {
	return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasFaqs(source: ArticleSeoAuditInput): boolean {
	const faqs = pickArray(source, 'faqs', 'faqItems', 'faq_items');
	return faqs.some((item) => {
		if (!item || typeof item !== 'object') return false;
		const record = item as Record<string, unknown>;
		const question = pickString(record, 'question');
		const answer = pickString(record, 'answer');
		return Boolean(question && answer);
	});
}

function hasRelatedLinks(source: ArticleSeoAuditInput): boolean {
	const journeyIds = pickArray(source, 'relatedJourneyIds', 'related_journey_ids');
	const recommendedItems = pickArray(source, 'recommendedItems', 'recommended_items');
	return journeyIds.length > 0 || recommendedItems.length > 0;
}

function isLegacyCategory(category: string): boolean {
	if (!category) return false;
	if ((CANONICAL_ARTICLE_CATEGORIES as string[]).includes(category)) {
		return false;
	}
	return (LEGACY_ARTICLE_CATEGORIES as string[]).includes(category);
}

function extractPlainText(source: ArticleSeoAuditInput): string {
	const parts: string[] = [];

	const content = pickString(source, 'content');
	if (content) parts.push(stripHtml(content));

	const blocks = pickArray(source, 'contentBlocks', 'content_blocks');
	for (const block of blocks) {
		if (!block || typeof block !== 'object') continue;
		const record = block as Record<string, unknown>;
		if (record.type === 'trip_cta') {
			return 'trip_cta';
		}
		const text = pickString(record, 'text');
		if (text) parts.push(stripHtml(text));
		const ctaText = pickString(record, 'ctaText', 'cta_text');
		if (ctaText) parts.push(ctaText);
	}

	return parts.join(' ').toLowerCase();
}

function detectPossibleMissingCta(source: ArticleSeoAuditInput): boolean {
	const plainText = extractPlainText(source);
	if (plainText === 'trip_cta') {
		return false;
	}
	if (!plainText) {
		return false;
	}
	return !CTA_KEYWORDS.some((keyword) => plainText.includes(keyword));
}

function clampScore(score: number): number {
	return Math.max(0, Math.min(100, score));
}

function resolveStatus(
	score: number,
	flags: ArticleSeoAuditResult['flags']
): ArticleSeoAuditStatus {
	if (flags.missingMetaDescription || flags.missingPageTitle) {
		return 'critical';
	}
	if (score < 70) {
		return 'critical';
	}
	if (score < 90) {
		return 'needs-work';
	}
	return 'good';
}

export function getArticleSeoAudit(
	article: ArticleSeoAuditInput | object
): ArticleSeoAuditResult {
	const source = article as ArticleSeoAuditInput;
	const pageTitle = pickString(source, 'pageTitle', 'page_title');
	const metaDescription = pickString(source, 'metaDescription', 'meta_description');
	const excerpt = pickString(source, 'excerpt');
	const category = pickString(source, 'category');
	const heroImage = pickString(source, 'heroImage', 'hero_image');
	const coverImage = pickString(source, 'coverImage', 'cover_image');
	const tags = normalizeTags(source.tags ?? source.tag_list);

	const missingPageTitle = !pageTitle;
	const missingMetaDescription = !metaDescription;
	const missingExcerpt = !excerpt;
	const legacyCategory = isLegacyCategory(category);
	const tooManyTags = tags.length > 8;
	const tooFewTags = tags.length > 0 && tags.length < 3;
	const missingFaqs = !hasFaqs(source);
	const missingHeroImage = !heroImage;
	const missingCoverImage = !coverImage;
	const missingRelatedLinks = !hasRelatedLinks(source);
	const possibleMissingCta = detectPossibleMissingCta(source);

	const flags: ArticleSeoAuditResult['flags'] = {
		missingPageTitle,
		missingMetaDescription,
		missingExcerpt,
		legacyCategory,
		tooManyTags,
		tooFewTags,
		missingFaqs,
		missingHeroImage,
		missingCoverImage,
		missingRelatedLinks,
		possibleMissingCta,
	};

	let score = 100;
	const issues: ArticleSeoIssue[] = [];

	if (missingPageTitle) {
		score -= 20;
		issues.push({
			key: 'missingPageTitle',
			label: 'Missing page title',
			severity: 'critical',
			detail:
				'Page title is missing. Add a concise SEO title around 50–65 characters.',
		});
	}

	if (missingMetaDescription) {
		score -= 25;
		issues.push({
			key: 'missingMetaDescription',
			label: 'Missing meta description',
			severity: 'critical',
			detail:
				'Meta description is missing. Add a natural 140–160 character summary.',
		});
	}

	if (missingExcerpt) {
		score -= 15;
		issues.push({
			key: 'missingExcerpt',
			label: 'Missing excerpt',
			severity: 'critical',
			detail:
				'Excerpt is missing. Add a short summary for article cards and category pages.',
		});
	}

	if (legacyCategory) {
		score -= 15;
		issues.push({
			key: 'legacyCategory',
			label: 'Legacy category',
			severity: 'critical',
			detail:
				'This article still uses a legacy category. Consider migrating it to one of the new canonical categories in PR4B.',
		});
	}

	if (missingHeroImage) {
		score -= 10;
		issues.push({
			key: 'missingHeroImage',
			label: 'Missing hero image',
			severity: 'critical',
			detail: 'Hero image is missing. Add a strong hero image for the article header.',
		});
	}

	if (missingCoverImage) {
		score -= 10;
		issues.push({
			key: 'missingCoverImage',
			label: 'Missing cover image',
			severity: 'critical',
			detail: 'Cover image is missing. Add a cover image for cards and listings.',
		});
	}

	if (tooManyTags) {
		score -= 8;
		issues.push({
			key: 'tooManyTags',
			label: 'Too many tags',
			severity: 'warning',
			detail: 'Too many tags. Keep 5–8 focused tags.',
		});
	}

	if (tooFewTags) {
		score -= 4;
		issues.push({
			key: 'tooFewTags',
			label: 'Too few tags',
			severity: 'warning',
			detail: 'Consider adding at least 3 focused tags for discoverability.',
		});
	}

	if (missingFaqs) {
		score -= 5;
		issues.push({
			key: 'missingFaqs',
			label: 'No FAQ',
			severity: 'warning',
			detail: 'No FAQ found. Add 3–5 useful FAQ items if relevant.',
		});
	}

	if (missingRelatedLinks) {
		score -= 5;
		issues.push({
			key: 'missingRelatedLinks',
			label: 'No related links',
			severity: 'warning',
			detail:
				'No related journey or recommended item found. Add internal links in PR4C.',
		});
	}

	if (possibleMissingCta) {
		score -= 3;
		issues.push({
			key: 'possibleMissingCta',
			label: 'No clear CTA',
			severity: 'info',
			detail: 'No clear CTA detected. Add a service CTA in PR4C.',
		});
	}

	score = clampScore(score);
	const status = resolveStatus(score, flags);

	return { status, score, issues, flags };
}

/** Short badge label for list UI. */
export function getArticleSeoIssueShortLabel(key: string): string {
	const labels: Record<string, string> = {
		missingPageTitle: 'Missing title',
		missingMetaDescription: 'Missing meta',
		missingExcerpt: 'Missing excerpt',
		legacyCategory: 'Legacy category',
		tooManyTags: 'Too many tags',
		tooFewTags: 'Too few tags',
		missingFaqs: 'No FAQ',
		missingHeroImage: 'No hero',
		missingCoverImage: 'No cover',
		missingRelatedLinks: 'No links',
		possibleMissingCta: 'No CTA',
	};
	return labels[key] ?? key;
}

export function getArticleSeoStatusLabel(status: ArticleSeoAuditStatus): string {
	switch (status) {
		case 'good':
			return 'Good';
		case 'needs-work':
			return 'Needs work';
		case 'critical':
			return 'Critical';
	}
}
