import {
	getArticleCanonicalCategorySlug,
	getCanonicalCategoryForArticle,
} from '@/lib/articleCategories';
import { PLAN_TRIP_CTA_HREF } from '@/lib/planTripCta';
import type { Article, ArticleCategory, ArticleCtaConfig, ArticleCtaMode, ContentBlock } from '@/types/article';

export { PLAN_TRIP_CTA_HREF, isPlanTripCtaHref } from '@/lib/planTripCta';

export type { ArticleCtaConfig, ArticleCtaMode } from '@/types/article';

export type ResolvedArticleCta = {
	mode: ArticleCtaMode;
	eyebrow: string;
	heading: string;
	body: string;
	supportingText: string;
	primaryLabel: string;
	primaryHref: string;
	secondaryLabel?: string;
	secondaryHref?: string;
};

const PRIVATE_JOURNEY_TEMPLATE: Omit<ResolvedArticleCta, 'mode'> = {
	eyebrow: 'PRIVATE JOURNEYS IN CHINA',
	heading: 'Plan a China Journey of Your Own',
	body: 'Tell us your dates, group size, and what matters most to you. We’ll shape the route, pace, and local experiences around you.',
	supportingText: '',
	primaryLabel: 'Start Planning',
	primaryHref: PLAN_TRIP_CTA_HREF,
	secondaryLabel: 'Explore Journeys',
	secondaryHref: '/journeys',
};

const CORPORATE_TRAVEL_TEMPLATE: Omit<ResolvedArticleCta, 'mode'> = {
	eyebrow: 'CORPORATE TRAVEL IN CHINA',
	heading: 'Plan Your Next China Business Visit',
	body: 'Share your dates, cities, group size, and business schedule. We’ll coordinate the local details around your priorities.',
	supportingText: '',
	primaryLabel: 'Discuss Your Visit',
	primaryHref: PLAN_TRIP_CTA_HREF,
	secondaryLabel: 'View Corporate Travel Solutions',
	secondaryHref: '/solutions/corporate-travel',
};

const CATEGORY_SLUG_TO_TEMPLATE_MODE: Record<string, 'private_journey' | 'corporate_travel'> = {
	'business-travel-bleisure-china': 'corporate_travel',
	'china-travel-planning': 'private_journey',
	'destinations-route-strategy': 'private_journey',
	'culture-dining-local-experiences': 'private_journey',
};

export function resolveTemplateModeForCategory(
	category: ArticleCategory | string
): 'private_journey' | 'corporate_travel' {
	const canonical = getCanonicalCategoryForArticle({ category: category as ArticleCategory });
	const slug = getArticleCanonicalCategorySlug({ category: canonical });
	return CATEGORY_SLUG_TO_TEMPLATE_MODE[slug] ?? 'private_journey';
}

function trim(value: string | undefined): string {
	return (value ?? '').trim();
}

/** Merges body + supportingText for a single frontend paragraph (custom CTA compat). */
export function getCtaDisplayBody(
	cta: Pick<ResolvedArticleCta, 'body' | 'supportingText'>
): string {
	return [cta.body, cta.supportingText].map((part) => trim(part)).filter(Boolean).join(' ');
}

function pickString(...values: Array<string | undefined>): string {
	for (const value of values) {
		const trimmed = trim(value);
		if (trimmed) return trimmed;
	}
	return '';
}

export function isValidCtaUrl(url: string): boolean {
	const trimmed = trim(url);
	if (!trimmed) return false;

	const lower = trimmed.toLowerCase();
	if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
		return false;
	}

	if (trimmed.startsWith('/')) return true;
	if (lower.startsWith('mailto:')) return trimmed.length > 7;
	if (lower.startsWith('https://') || lower.startsWith('http://')) return true;

	return false;
}

export function getLegacyTripCtaBlocks(blocks: ContentBlock[] | undefined): ContentBlock[] {
	if (!blocks?.length) return [];
	return blocks.filter((block) => block.type === 'trip_cta');
}

/** Prefer the last trip_cta block when multiple exist (legacy compatibility). */
export function getPrimaryLegacyTripCtaBlock(
	blocks: ContentBlock[] | undefined
): ContentBlock | null {
	const legacyBlocks = getLegacyTripCtaBlocks(blocks);
	if (legacyBlocks.length === 0) return null;
	return legacyBlocks[legacyBlocks.length - 1];
}

function buildFromTemplate(
	mode: 'private_journey' | 'corporate_travel',
	config?: ArticleCtaConfig
): ResolvedArticleCta {
	const template =
		mode === 'corporate_travel' ? CORPORATE_TRAVEL_TEMPLATE : PRIVATE_JOURNEY_TEMPLATE;

	const resolved: ResolvedArticleCta = {
		mode,
		eyebrow: pickString(config?.eyebrow, template.eyebrow),
		heading: pickString(config?.heading, template.heading),
		body: pickString(config?.body, template.body),
		supportingText: pickString(config?.supportingText, template.supportingText),
		primaryLabel: pickString(config?.primaryLabel, template.primaryLabel),
		primaryHref: pickString(config?.primaryHref, template.primaryHref),
		secondaryLabel: pickString(config?.secondaryLabel, template.secondaryLabel),
		secondaryHref: pickString(config?.secondaryHref, template.secondaryHref),
	};

	if (!isValidCtaUrl(resolved.primaryHref)) {
		resolved.primaryHref = template.primaryHref;
	}
	if (resolved.secondaryHref && !isValidCtaUrl(resolved.secondaryHref)) {
		resolved.secondaryLabel = undefined;
		resolved.secondaryHref = undefined;
	}
	if (!resolved.secondaryLabel || !resolved.secondaryHref) {
		resolved.secondaryLabel = undefined;
		resolved.secondaryHref = undefined;
	}

	return resolved;
}

function buildLegacyFallbackCta(
	article: Article,
	legacyBlock: ContentBlock
): ResolvedArticleCta {
	const templateMode = resolveTemplateModeForCategory(article.category);
	const base = buildFromTemplate(templateMode);

	const legacyHeading = trim(legacyBlock.ctaText);
	if (legacyHeading) {
		base.heading = legacyHeading;
	}

	return { ...base, mode: 'custom' };
}

function buildCustomCta(config: ArticleCtaConfig): ResolvedArticleCta | null {
	const heading = trim(config.heading);
	const body = trim(config.body);
	const primaryLabel = trim(config.primaryLabel);
	const primaryHref = trim(config.primaryHref);

	if (!heading || !body || !primaryLabel || !primaryHref || !isValidCtaUrl(primaryHref)) {
		return null;
	}

	const secondaryLabel = trim(config.secondaryLabel);
	const secondaryHref = trim(config.secondaryHref);
	const hasSecondary = Boolean(secondaryLabel && secondaryHref && isValidCtaUrl(secondaryHref));

	return {
		mode: 'custom',
		eyebrow: trim(config.eyebrow),
		heading,
		body,
		supportingText: trim(config.supportingText),
		primaryLabel,
		primaryHref,
		secondaryLabel: hasSecondary ? secondaryLabel : undefined,
		secondaryHref: hasSecondary ? secondaryHref : undefined,
	};
}

function hasExplicitCtaConfig(config: ArticleCtaConfig | undefined): boolean {
	if (!config) return false;
	return Boolean(trim(config.mode) && config.mode !== 'auto');
}

/**
 * Resolves the page-level primary CTA for an article.
 * Returns null when hidden or when custom mode lacks required fields.
 */
export function resolveArticleCta(article: Article): ResolvedArticleCta | null {
	const config = article.ctaConfig;
	const mode: ArticleCtaMode = config?.mode ?? 'auto';

	if (mode === 'hidden') return null;

	if (mode === 'custom') {
		const custom = buildCustomCta(config ?? {});
		if (custom) return custom;
		if (hasExplicitCtaConfig(config)) return null;
	}

	if (mode === 'private_journey' || mode === 'corporate_travel') {
		return buildFromTemplate(mode, config);
	}

	if (mode === 'auto' && hasExplicitCtaConfig(config)) {
		// Defensive: unknown explicit mode falls through to auto
	}

	if (!hasExplicitCtaConfig(config)) {
		const legacyBlock = getPrimaryLegacyTripCtaBlock(article.contentBlocks);
		if (legacyBlock) {
			return buildLegacyFallbackCta(article, legacyBlock);
		}
	}

	const autoMode = resolveTemplateModeForCategory(article.category);
	return buildFromTemplate(autoMode);
}

/** Body blocks with legacy trip_cta suppressed when a page-level CTA is shown. */
export function getArticleBodyContentBlocks(
	article: Article,
	showPageLevelCta: boolean
): ContentBlock[] {
	const blocks = article.contentBlocks ?? [];
	if (!showPageLevelCta) return blocks;
	return blocks.filter((block) => block.type !== 'trip_cta');
}

export function parseArticleCtaConfig(raw: unknown): ArticleCtaConfig | undefined {
	if (raw == null) return undefined;
	let value = raw;
	if (typeof raw === 'string') {
		try {
			value = JSON.parse(raw);
		} catch {
			return undefined;
		}
	}
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;

	const record = value as Record<string, unknown>;
	const mode = record.mode;
	const validModes: ArticleCtaMode[] = [
		'auto',
		'private_journey',
		'corporate_travel',
		'custom',
		'hidden',
	];

	return {
		mode:
			typeof mode === 'string' && (validModes as string[]).includes(mode)
				? (mode as ArticleCtaMode)
				: undefined,
		eyebrow: record.eyebrow != null ? String(record.eyebrow) : undefined,
		heading: record.heading != null ? String(record.heading) : undefined,
		body: record.body != null ? String(record.body) : undefined,
		supportingText:
			record.supportingText != null ? String(record.supportingText) : undefined,
		primaryLabel: record.primaryLabel != null ? String(record.primaryLabel) : undefined,
		primaryHref: record.primaryHref != null ? String(record.primaryHref) : undefined,
		secondaryLabel:
			record.secondaryLabel != null ? String(record.secondaryLabel) : undefined,
		secondaryHref: record.secondaryHref != null ? String(record.secondaryHref) : undefined,
	};
}

export type ArticleCtaCustomFieldErrors = Partial<
	Record<
		| 'heading'
		| 'body'
		| 'primaryLabel'
		| 'primaryHref'
		| 'secondaryLabel'
		| 'secondaryHref',
		string
	>
>;

export function validateArticleCtaCustomFields(
	config: ArticleCtaConfig
): ArticleCtaCustomFieldErrors {
	const errors: ArticleCtaCustomFieldErrors = {};
	const heading = trim(config.heading);
	const body = trim(config.body);
	const primaryLabel = trim(config.primaryLabel);
	const primaryHref = trim(config.primaryHref);
	const secondaryLabel = trim(config.secondaryLabel);
	const secondaryHref = trim(config.secondaryHref);

	if (!heading) errors.heading = 'Heading is required.';
	if (!body) errors.body = 'Body is required.';
	if (!primaryLabel) errors.primaryLabel = 'Primary button label is required.';
	if (!primaryHref) {
		errors.primaryHref = 'Primary button URL is required.';
	} else if (!isValidCtaUrl(primaryHref)) {
		errors.primaryHref = 'Enter a valid URL starting with /, https://, or mailto:.';
	}

	if (secondaryLabel && !secondaryHref) {
		errors.secondaryHref = 'Secondary URL is required when a secondary label is set.';
	}
	if (secondaryHref && !secondaryLabel) {
		errors.secondaryLabel = 'Secondary label is required when a secondary URL is set.';
	}
	if (secondaryHref && secondaryLabel && !isValidCtaUrl(secondaryHref)) {
		errors.secondaryHref = 'Enter a valid URL starting with /, https://, or mailto:.';
	}

	return errors;
}

export function getResolvedCtaPreviewLabel(mode: ArticleCtaMode, category: ArticleCategory): string {
	if (mode === 'corporate_travel') return 'Corporate Travel';
	if (mode === 'private_journey') return 'Private Journey';
	if (mode === 'auto') {
		return resolveTemplateModeForCategory(category) === 'corporate_travel'
			? 'Corporate Travel'
			: 'Private Journey';
	}
	if (mode === 'custom') return 'Custom';
	return 'Hidden';
}

/** Preview resolver used in admin — does not apply legacy trip_cta fallback. */
export function resolveArticleCtaPreview(
	article: Pick<Article, 'category' | 'ctaConfig'>
): ResolvedArticleCta | null {
	const config = article.ctaConfig;
	const mode: ArticleCtaMode = config?.mode ?? 'auto';

	if (mode === 'hidden') return null;
	if (mode === 'custom') {
		return buildCustomCta(config ?? {});
	}
	if (mode === 'private_journey' || mode === 'corporate_travel') {
		return buildFromTemplate(mode, config);
	}
	return buildFromTemplate(resolveTemplateModeForCategory(article.category), config);
}
