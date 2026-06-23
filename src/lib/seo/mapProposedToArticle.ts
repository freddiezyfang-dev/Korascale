import type { RecommendedItem } from '@/types/article';

import type { SeoEditableArticleFields } from './types';

export type ArticlePublishColumns = {
	title: string;
	page_title: string;
	meta_description: string;
	excerpt: string;
	category: string;
	tags: string;
	content: string | null;
	content_blocks: string;
	faqs: string;
	cta_config: string;
	related_journey_ids: string;
	recommended_items: string;
};

/** Map SEO proposed_content to articles table columns for publish. */
export function mapProposedToArticleColumns(
	proposed: SeoEditableArticleFields
): ArticlePublishColumns {
	const contentBlocks = proposed.contentBlocks ?? [];
	const hasBlocks = contentBlocks.length > 0;
	const relatedJourneyIds = [...new Set(proposed.relatedJourneys ?? [])];
	const recommendedItems: RecommendedItem[] = (proposed.relatedArticles ?? []).map((id) => ({
		type: 'article',
		id,
	}));

	return {
		title: proposed.title,
		page_title: proposed.pageTitle,
		meta_description: proposed.metaDescription,
		excerpt: proposed.excerpt,
		category: proposed.category,
		tags: JSON.stringify(proposed.tags ?? []),
		content: hasBlocks ? null : proposed.content,
		content_blocks: JSON.stringify(hasBlocks ? contentBlocks : []),
		faqs: JSON.stringify(proposed.faqs ?? []),
		cta_config: JSON.stringify(proposed.ctaConfig ?? {}),
		related_journey_ids: JSON.stringify(relatedJourneyIds),
		recommended_items: JSON.stringify(recommendedItems),
	};
}
