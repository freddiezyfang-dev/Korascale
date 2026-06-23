import { parseArticleCtaConfig } from '@/lib/articleCta';
import type { Article, ContentBlock, RecommendedItem } from '@/types/article';

import type { SeoArticleExport, SeoEditableArticleFields } from './types';
import { serializeArticleUpdatedAt } from './sourceTimestamp';

function parseJsonArray<T>(value: unknown): T[] | undefined {
	if (value == null) return undefined;
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value) as unknown;
			return Array.isArray(parsed) ? (parsed as T[]) : undefined;
		} catch {
			return undefined;
		}
	}
	return Array.isArray(value) ? (value as T[]) : undefined;
}

function normalizeContentBlocks(raw: unknown): ContentBlock[] {
	const blocks = parseJsonArray<Record<string, unknown>>(raw);
	if (!blocks?.length) return [];

	return blocks
		.map((block, index) => {
			const type = block.type as ContentBlock['type'] | undefined;
			if (!type) return null;

			const normalized: ContentBlock = {
				id: String(block.id ?? index),
				type,
				text: block.text != null ? String(block.text) : undefined,
				level: block.level != null ? Number(block.level) : undefined,
				imageSrc:
					block.imageSrc != null
						? String(block.imageSrc)
						: block.image_src != null
							? String(block.image_src)
							: undefined,
				caption: block.caption != null ? String(block.caption) : undefined,
				imageWidth: block.imageWidth as ContentBlock['imageWidth'],
				monthTag: block.monthTag != null ? String(block.monthTag) : undefined,
				highlightColor:
					block.highlightColor != null ? String(block.highlightColor) : undefined,
				journeyId: block.journeyId != null ? String(block.journeyId) : undefined,
				ctaText: block.ctaText != null ? String(block.ctaText) : undefined,
			};
			return normalized;
		})
		.filter((block): block is ContentBlock => block !== null);
}

function extractRelatedJourneys(
	relatedJourneyIds: string[],
	recommendedItems: RecommendedItem[] | undefined
): string[] {
	const fromRecommended =
		recommendedItems?.filter((item) => item.type === 'journey').map((item) => item.id) ?? [];
	return [...new Set([...relatedJourneyIds, ...fromRecommended])];
}

function extractRelatedArticles(recommendedItems: RecommendedItem[] | undefined): string[] {
	return [
		...new Set(
			recommendedItems?.filter((item) => item.type === 'article').map((item) => item.id) ?? []
		),
	];
}

export function mapArticleToEditableFields(article: Article): SeoEditableArticleFields {
	return {
		title: article.title,
		pageTitle: article.pageTitle ?? '',
		metaDescription: article.metaDescription ?? '',
		excerpt: article.excerpt ?? '',
		category: article.category,
		tags: article.tags ?? [],
		content: article.content ?? null,
		contentBlocks: article.contentBlocks ?? [],
		faqs: article.faqs ?? [],
		ctaConfig: article.ctaConfig ?? {},
		relatedArticles: extractRelatedArticles(article.recommendedItems),
		relatedJourneys: extractRelatedJourneys(
			article.relatedJourneyIds ?? [],
			article.recommendedItems
		),
	};
}

export function mapDbRowToArticle(row: Record<string, unknown>): Article {
	const relatedJourneyIds = parseJsonArray<string>(row.related_journey_ids) ?? [];
	const recommendedItems = parseJsonArray<RecommendedItem>(row.recommended_items);
	const tags = parseJsonArray<string>(row.tags);
	const faqs = parseJsonArray<{ question: string; answer: string }>(row.faqs);

	return {
		id: String(row.id ?? ''),
		slug: String(row.slug ?? ''),
		title: String(row.title ?? ''),
		author: String(row.author ?? 'KoraScale'),
		coverImage: row.cover_image ? String(row.cover_image) : '',
		heroImage: row.hero_image ? String(row.hero_image) : undefined,
		readingTime: row.reading_time ? String(row.reading_time) : undefined,
		category: row.category as Article['category'],
		content: row.content ? String(row.content) : undefined,
		contentBlocks: normalizeContentBlocks(row.content_blocks),
		excerpt: row.excerpt ? String(row.excerpt) : undefined,
		relatedJourneyIds,
		recommendedItems,
		ctaConfig: parseArticleCtaConfig(row.cta_config),
		faqs,
		tags,
		status: row.status as Article['status'],
		featured: row.is_featured === true,
		displayOrder: row.display_order != null ? Number(row.display_order) : undefined,
		pageTitle: row.page_title ? String(row.page_title) : undefined,
		metaDescription: row.meta_description ? String(row.meta_description) : undefined,
		createdAt: row.created_at ? new Date(String(row.created_at)) : new Date(),
		updatedAt: new Date(serializeArticleUpdatedAt(row.updated_at)),
	};
}

export function buildSeoArticleExport(article: Article): SeoArticleExport {
	const editable = mapArticleToEditableFields(article);
	return {
		...editable,
		exportedAt: new Date().toISOString(),
		sourceUpdatedAt: serializeArticleUpdatedAt(article.updatedAt),
		sourceArticleId: article.id,
		sourceSlug: article.slug,
	};
}

export function stableSerialize(value: unknown): string {
	return JSON.stringify(value, (_key, val) => {
		if (val instanceof Date) return val.toISOString();
		if (Array.isArray(val)) return [...val];
		if (val && typeof val === 'object') {
			return Object.keys(val as Record<string, unknown>)
				.sort()
				.reduce<Record<string, unknown>>((acc, key) => {
					acc[key] = (val as Record<string, unknown>)[key];
					return acc;
				}, {});
		}
		return val;
	});
}

export function valuesEqual(a: unknown, b: unknown): boolean {
	return stableSerialize(a) === stableSerialize(b);
}
