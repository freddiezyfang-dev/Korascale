import { CANONICAL_ARTICLE_CATEGORIES } from '@/lib/articleCategories';
import { isValidCtaUrl } from '@/lib/articleCta';
import type { ArticleCtaConfig, ContentBlock } from '@/types/article';

import type { SeoEditableArticleFields, SeoRevisionReviewMetadata, SeoRevisionSubmission, SeoRevisionValidationResult } from './types';

const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ISO_DATE_RE =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

export const SEO_FIELD_LIMITS = {
	title: 255,
	pageTitle: 255,
	metaDescription: 500,
	excerpt: 2000,
	tag: 80,
	maxTags: 30,
	faqQuestion: 500,
	faqAnswer: 5000,
	maxFaqs: 20,
	changeSummary: 4000,
	factCheckItem: 500,
	factCheckNote: 1000,
	maxFactCheckItems: 50,
	recommendedSlug: 255,
	maxRelatedIds: 20,
	content: 500_000,
	slug: 255,
} as const;

export const SEO_FORBIDDEN_REVISION_FIELDS = [
	'id',
	'articleId',
	'slug',
	'author',
	'status',
	'createdAt',
	'updatedAt',
	'publishedAt',
	'canonical',
	'redirect',
	'sitemap',
	'robots',
	'featured',
	'displayOrder',
	'coverImage',
	'heroImage',
	'readingTime',
	'role',
	'created_by',
	'createdBy',
] as const;

export const SEO_ALLOWED_REVISION_KEYS = [
	'sourceArticleId',
	'sourceSlug',
	'sourceUpdatedAt',
	'title',
	'pageTitle',
	'metaDescription',
	'excerpt',
	'category',
	'tags',
	'content',
	'contentBlocks',
	'faqs',
	'ctaConfig',
	'relatedArticles',
	'relatedJourneys',
	'recommendedSlug',
	'changeSummary',
	'factCheckItems',
] as const;

const ALLOWED_TOP_LEVEL_KEYS = new Set<string>(SEO_ALLOWED_REVISION_KEYS);

const VALID_CTA_MODES = new Set([
	'auto',
	'private_journey',
	'corporate_travel',
	'custom',
	'hidden',
]);

const VALID_CONTENT_BLOCK_TYPES = new Set([
	'heading',
	'paragraph',
	'image',
	'callout',
	'trip_cta',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function trimString(value: unknown, maxLength: number, field: string, errors: Record<string, string>): string {
	if (typeof value !== 'string') {
		errors[field] = `${field} must be a string.`;
		return '';
	}
	const trimmed = value.trim();
	if (!trimmed) {
		errors[field] = `${field} is required.`;
		return '';
	}
	if (trimmed.length > maxLength) {
		errors[field] = `${field} must be at most ${maxLength} characters.`;
	}
	return trimmed;
}

function optionalTrimString(
	value: unknown,
	maxLength: number,
	field: string,
	errors: Record<string, string>
): string | undefined {
	if (value == null || value === '') return undefined;
	if (typeof value !== 'string') {
		errors[field] = `${field} must be a string.`;
		return undefined;
	}
	const trimmed = value.trim();
	if (!trimmed) return undefined;
	if (trimmed.length > maxLength) {
		errors[field] = `${field} must be at most ${maxLength} characters.`;
	}
	return trimmed;
}

function parseIsoDate(value: unknown, field: string, errors: Record<string, string>): string {
	if (typeof value !== 'string' || !value.trim()) {
		errors[field] = `${field} is required and must be an ISO date string.`;
		return '';
	}
	const trimmed = value.trim();
	const date = new Date(trimmed);
	if (Number.isNaN(date.getTime()) || !ISO_DATE_RE.test(trimmed)) {
		errors[field] = `${field} must be a valid ISO 8601 date string.`;
		return '';
	}
	return date.toISOString();
}

function parseUuidArray(value: unknown, field: string, errors: Record<string, string>): string[] {
	if (!Array.isArray(value)) {
		errors[field] = `${field} must be an array.`;
		return [];
	}
	if (value.length > SEO_FIELD_LIMITS.maxRelatedIds) {
		errors[field] = `${field} must contain at most ${SEO_FIELD_LIMITS.maxRelatedIds} items.`;
	}
	const ids: string[] = [];
	for (let i = 0; i < value.length; i++) {
		const item = value[i];
		if (typeof item !== 'string' || !UUID_RE.test(item.trim())) {
			errors[`${field}[${i}]`] = `${field} items must be valid UUIDs.`;
			continue;
		}
		ids.push(item.trim());
	}
	return [...new Set(ids)];
}

function parseTags(value: unknown, errors: Record<string, string>): string[] {
	if (!Array.isArray(value)) {
		errors.tags = 'tags must be an array.';
		return [];
	}
	if (value.length > SEO_FIELD_LIMITS.maxTags) {
		errors.tags = `tags must contain at most ${SEO_FIELD_LIMITS.maxTags} items.`;
	}
	const tags: string[] = [];
	for (let i = 0; i < value.length; i++) {
		const tag = value[i];
		if (typeof tag !== 'string' || !tag.trim()) {
			errors[`tags[${i}]`] = 'Each tag must be a non-empty string.';
			continue;
		}
		const trimmed = tag.trim();
		if (trimmed.length > SEO_FIELD_LIMITS.tag) {
			errors[`tags[${i}]`] = `Each tag must be at most ${SEO_FIELD_LIMITS.tag} characters.`;
		}
		tags.push(trimmed);
	}
	return tags;
}

function parseFaqs(
	value: unknown,
	errors: Record<string, string>
): { question: string; answer: string }[] {
	if (!Array.isArray(value)) {
		errors.faqs = 'faqs must be an array.';
		return [];
	}
	if (value.length > SEO_FIELD_LIMITS.maxFaqs) {
		errors.faqs = `faqs must contain at most ${SEO_FIELD_LIMITS.maxFaqs} items.`;
	}
	const faqs: { question: string; answer: string }[] = [];
	for (let i = 0; i < value.length; i++) {
		const item = value[i];
		if (!isRecord(item)) {
			errors[`faqs[${i}]`] = 'Each FAQ must be an object with question and answer.';
			continue;
		}
		const question = trimString(
			item.question,
			SEO_FIELD_LIMITS.faqQuestion,
			`faqs[${i}].question`,
			errors
		);
		const answer = trimString(
			item.answer,
			SEO_FIELD_LIMITS.faqAnswer,
			`faqs[${i}].answer`,
			errors
		);
		if (question && answer) {
			faqs.push({ question, answer });
		}
	}
	return faqs;
}

function parseContentBlocks(value: unknown, errors: Record<string, string>): ContentBlock[] {
	if (!Array.isArray(value)) {
		errors.contentBlocks = 'contentBlocks must be an array.';
		return [];
	}
	const blocks: ContentBlock[] = [];
	for (let i = 0; i < value.length; i++) {
		const item = value[i];
		if (!isRecord(item)) {
			errors[`contentBlocks[${i}]`] = 'Each content block must be an object.';
			continue;
		}
		const type = item.type;
		if (typeof type !== 'string' || !VALID_CONTENT_BLOCK_TYPES.has(type)) {
			errors[`contentBlocks[${i}].type`] = 'Invalid content block type.';
			continue;
		}
		blocks.push({
			id: String(item.id ?? i),
			type: type as ContentBlock['type'],
			text: item.text != null ? String(item.text) : undefined,
			level: item.level != null ? Number(item.level) : undefined,
			imageSrc:
				item.imageSrc != null
					? String(item.imageSrc)
					: item.image_src != null
						? String(item.image_src)
						: undefined,
			caption: item.caption != null ? String(item.caption) : undefined,
			imageWidth: item.imageWidth as ContentBlock['imageWidth'],
			monthTag: item.monthTag != null ? String(item.monthTag) : undefined,
			highlightColor:
				item.highlightColor != null ? String(item.highlightColor) : undefined,
			journeyId: item.journeyId != null ? String(item.journeyId) : undefined,
			ctaText: item.ctaText != null ? String(item.ctaText) : undefined,
		});
	}
	return blocks;
}

function parseCtaConfig(value: unknown, errors: Record<string, string>): ArticleCtaConfig {
	if (!isRecord(value)) {
		errors.ctaConfig = 'ctaConfig must be an object.';
		return {};
	}
	const config: ArticleCtaConfig = {};
	if (value.mode != null) {
		const mode = String(value.mode);
		if (!VALID_CTA_MODES.has(mode)) {
			errors['ctaConfig.mode'] = 'Invalid CTA mode.';
		} else {
			config.mode = mode as ArticleCtaConfig['mode'];
		}
	}
	const stringFields = [
		'eyebrow',
		'heading',
		'body',
		'supportingText',
		'primaryLabel',
		'primaryHref',
		'secondaryLabel',
		'secondaryHref',
	] as const;
	for (const key of stringFields) {
		if (value[key] != null) {
			config[key] = String(value[key]);
		}
	}
	if (config.primaryHref && !isValidCtaUrl(config.primaryHref)) {
		errors['ctaConfig.primaryHref'] = 'Invalid primary CTA URL.';
	}
	if (config.secondaryHref && !isValidCtaUrl(config.secondaryHref)) {
		errors['ctaConfig.secondaryHref'] = 'Invalid secondary CTA URL.';
	}
	return config;
}

function parseFactCheckItems(value: unknown, errors: Record<string, string>) {
	if (!Array.isArray(value)) {
		errors.factCheckItems = 'factCheckItems must be an array.';
		return [];
	}
	if (value.length > SEO_FIELD_LIMITS.maxFactCheckItems) {
		errors.factCheckItems = `factCheckItems must contain at most ${SEO_FIELD_LIMITS.maxFactCheckItems} items.`;
	}
	const items = [];
	for (let i = 0; i < value.length; i++) {
		const item = value[i];
		if (!isRecord(item)) {
			errors[`factCheckItems[${i}]`] = 'Each fact check item must be an object.';
			continue;
		}
		const factItem = trimString(
			item.item,
			SEO_FIELD_LIMITS.factCheckItem,
			`factCheckItems[${i}].item`,
			errors
		);
		if (typeof item.resolved !== 'boolean') {
			errors[`factCheckItems[${i}].resolved`] = 'resolved must be a boolean.';
		}
		const note = optionalTrimString(
			item.note,
			SEO_FIELD_LIMITS.factCheckNote,
			`factCheckItems[${i}].note`,
			errors
		);
		if (factItem && typeof item.resolved === 'boolean') {
			items.push({ item: factItem, resolved: item.resolved, note });
		}
	}
	return items;
}

function rejectForbiddenFields(input: Record<string, unknown>, errors: Record<string, string>) {
	for (const key of Object.keys(input)) {
		if ((SEO_FORBIDDEN_REVISION_FIELDS as readonly string[]).includes(key)) {
			errors[key] = `Field "${key}" is not allowed in revision submissions.`;
		} else if (!ALLOWED_TOP_LEVEL_KEYS.has(key)) {
			errors[key] = `Unknown field "${key}" is not allowed.`;
		}
	}
	if (input.status === 'published' || input.status === 'active') {
		errors.status = 'Revision status cannot be set to published via file submission.';
	}
}

export function validateSeoRevisionSubmission(input: unknown): SeoRevisionValidationResult {
	const errors: Record<string, string> = {};
	if (!isRecord(input)) {
		return { success: false, errors: { _root: 'Revision file must be a JSON object.' } };
	}

	rejectForbiddenFields(input, errors);

	const sourceArticleId = trimString(
		input.sourceArticleId,
		36,
		'sourceArticleId',
		errors
	);
	if (sourceArticleId && !UUID_RE.test(sourceArticleId)) {
		errors.sourceArticleId = 'sourceArticleId must be a valid UUID.';
	}

	const sourceSlug = trimString(input.sourceSlug, SEO_FIELD_LIMITS.slug, 'sourceSlug', errors);
	const sourceUpdatedAt = parseIsoDate(input.sourceUpdatedAt, 'sourceUpdatedAt', errors);

	const title = trimString(input.title, SEO_FIELD_LIMITS.title, 'title', errors);
	const pageTitle = trimString(input.pageTitle, SEO_FIELD_LIMITS.pageTitle, 'pageTitle', errors);
	const metaDescription = trimString(
		input.metaDescription,
		SEO_FIELD_LIMITS.metaDescription,
		'metaDescription',
		errors
	);
	const excerpt = trimString(input.excerpt, SEO_FIELD_LIMITS.excerpt, 'excerpt', errors);

	let category = '';
	if (typeof input.category !== 'string' || !input.category.trim()) {
		errors.category = 'category is required.';
	} else {
		category = input.category.trim();
		if (!(CANONICAL_ARTICLE_CATEGORIES as string[]).includes(category)) {
			errors.category = `category must be one of: ${CANONICAL_ARTICLE_CATEGORIES.join(', ')}.`;
		}
	}

	const tags = parseTags(input.tags, errors);
	const content =
		input.content == null
			? null
			: typeof input.content === 'string'
				? input.content.length > SEO_FIELD_LIMITS.content
					? (errors.content = `content must be at most ${SEO_FIELD_LIMITS.content} characters.`, input.content)
					: input.content
				: (errors.content = 'content must be a string or null.', null);

	const contentBlocks = parseContentBlocks(input.contentBlocks, errors);
	const faqs = parseFaqs(input.faqs, errors);
	const ctaConfig = parseCtaConfig(input.ctaConfig ?? {}, errors);
	const relatedArticles = parseUuidArray(input.relatedArticles, 'relatedArticles', errors);
	const relatedJourneys = parseUuidArray(input.relatedJourneys, 'relatedJourneys', errors);
	const recommendedSlug = optionalTrimString(
		input.recommendedSlug,
		SEO_FIELD_LIMITS.recommendedSlug,
		'recommendedSlug',
		errors
	);
	const changeSummary = trimString(
		input.changeSummary,
		SEO_FIELD_LIMITS.changeSummary,
		'changeSummary',
		errors
	);
	const factCheckItems = parseFactCheckItems(input.factCheckItems, errors);

	if (!content?.trim() && contentBlocks.length === 0) {
		errors.content = 'Either content or contentBlocks must be provided.';
	}

	if (Object.keys(errors).length > 0) {
		return { success: false, errors };
	}

	const data: SeoRevisionSubmission = {
		sourceArticleId,
		sourceSlug,
		sourceUpdatedAt,
		title,
		pageTitle,
		metaDescription,
		excerpt,
		category,
		tags,
		content,
		contentBlocks,
		faqs,
		ctaConfig,
		relatedArticles,
		relatedJourneys,
		recommendedSlug,
		changeSummary,
		factCheckItems,
	};

	return { success: true, data };
}

export function toEditableFields(input: SeoRevisionSubmission): SeoEditableArticleFields {
	const {
		sourceArticleId: _sourceArticleId,
		sourceSlug: _sourceSlug,
		sourceUpdatedAt: _sourceUpdatedAt,
		changeSummary: _changeSummary,
		factCheckItems: _factCheckItems,
		...editable
	} = input;
	return editable;
}

export function toReviewMetadata(
	input: Pick<SeoRevisionSubmission, 'changeSummary' | 'factCheckItems'>
): SeoRevisionReviewMetadata {
	return {
		changeSummary: input.changeSummary,
		factCheckItems: input.factCheckItems,
	};
}
