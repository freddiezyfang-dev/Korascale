import { parseArticleCtaConfig } from '@/lib/articleCta';
import type { Article, ContentBlock, RecommendedItem } from '@/types/article';

export function mapArticleRowFromDb(row: Record<string, unknown>): Article {
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
		contentBlocks: row.content_blocks ? (row.content_blocks as ContentBlock[]) : undefined,
		excerpt: row.excerpt ? String(row.excerpt) : undefined,
		relatedJourneyIds: row.related_journey_ids
			? (row.related_journey_ids as string[])
			: [],
		recommendedItems: row.recommended_items
			? (row.recommended_items as RecommendedItem[])
			: undefined,
		ctaConfig: parseArticleCtaConfig(row.cta_config),
		faqs: row.faqs ? (row.faqs as { question: string; answer: string }[]) : undefined,
		tags: row.tags ? (row.tags as string[]) : undefined,
		status: row.status as Article['status'],
		featured: row.is_featured === true,
		displayOrder: row.display_order != null ? Number(row.display_order) : undefined,
		pageTitle: row.page_title ? String(row.page_title) : undefined,
		metaDescription: row.meta_description ? String(row.meta_description) : undefined,
		createdAt: row.created_at ? new Date(String(row.created_at)) : new Date(),
		updatedAt: row.updated_at ? new Date(String(row.updated_at)) : new Date(),
	};
}

export async function ensureArticleCtaConfigColumn(
	queryFn: (text: string, params?: unknown[]) => Promise<unknown>
) {
	try {
		await queryFn(`
      ALTER TABLE articles
      ADD COLUMN IF NOT EXISTS cta_config JSONB DEFAULT '{}'::jsonb;
    `);
	} catch (error) {
		console.warn('[articles] Could not ensure cta_config column:', error);
	}
}
