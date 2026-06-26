'use client';

import { TourismPageCta } from '@/components/cta/TourismPageCta';
import {
	INSPIRATION_ARTICLE_CTA,
	TOURISM_CTA_FALLBACK_IMAGE,
} from '@/lib/tourismPageCtaContent';
import {
	CANONICAL_CATEGORY_TO_HERO_IMAGE,
	getCanonicalCategoryForArticle,
} from '@/lib/articleCategories';
import type { Article } from '@/types/article';

type ArticleTourismPageCtaProps = {
	article: Pick<Article, 'id' | 'slug' | 'title' | 'heroImage' | 'coverImage' | 'category'>;
	categorySlug: string;
	sourcePage: string;
};

export function ArticleTourismPageCta({
	article,
	categorySlug,
	sourcePage,
}: ArticleTourismPageCtaProps) {
	const canonicalCategory = getCanonicalCategoryForArticle({ category: article.category });
	const fallbackImage =
		CANONICAL_CATEGORY_TO_HERO_IMAGE[canonicalCategory] ?? TOURISM_CTA_FALLBACK_IMAGE;
	const imageSrc = article.heroImage || article.coverImage || fallbackImage;

	return (
		<TourismPageCta
			title={INSPIRATION_ARTICLE_CTA.title}
			description={INSPIRATION_ARTICLE_CTA.description}
			buttonLabel={INSPIRATION_ARTICLE_CTA.buttonLabel}
			image={{
				src: imageSrc,
				alt: article.title
					? `${article.title} — China travel inspiration`
					: 'China travel inspiration',
			}}
			sourcePage={sourcePage}
			articleId={String(article.id)}
			inquiry={{
				intent: 'custom_journey',
				sourceType: 'article',
				sourcePage,
				sourceSlug: article.slug,
				sourceContext: {
					articleId: String(article.id),
					articleSlug: article.slug,
					articleTitle: article.title,
					category: categorySlug,
					sourceCta: 'tourism_page_end',
				},
			}}
		/>
	);
}
