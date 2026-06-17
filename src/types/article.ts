export type ArticleStatus = 'draft' | 'active' | 'inactive';

export type ArticleCtaMode =
	| 'auto'
	| 'private_journey'
	| 'corporate_travel'
	| 'custom'
	| 'hidden';

export type ArticleCtaConfig = {
	mode?: ArticleCtaMode;
	eyebrow?: string;
	heading?: string;
	body?: string;
	supportingText?: string;
	primaryLabel?: string;
	primaryHref?: string;
	secondaryLabel?: string;
	secondaryHref?: string;
};

import {
	ADMIN_ARTICLE_CATEGORIES,
	CANONICAL_ARTICLE_CATEGORIES,
	CANONICAL_CATEGORY_TO_DESCRIPTION,
	CANONICAL_CATEGORY_TO_HERO_IMAGE,
	CANONICAL_CATEGORY_TO_SLUG,
	LEGACY_ARTICLE_CATEGORIES,
	type ArticleCategoryName,
	type CanonicalArticleCategory,
	type LegacyArticleCategory,
} from '@/lib/articleCategories';

export type { ArticleCategoryName, CanonicalArticleCategory, LegacyArticleCategory };

/** All valid article category DB values (canonical + legacy). */
export type ArticleCategory = ArticleCategoryName;

/** @deprecated Use CANONICAL_ARTICLE_CATEGORIES for public navigation. */
export const ARTICLE_CATEGORIES: ArticleCategory[] = [
	...CANONICAL_ARTICLE_CATEGORIES,
	...LEGACY_ARTICLE_CATEGORIES,
];

/** Admin form / filter dropdown order (canonical first). */
export const ADMIN_ARTICLE_CATEGORY_OPTIONS = ADMIN_ARTICLE_CATEGORIES;

// Content Block Types
export type ContentBlockType = 'heading' | 'paragraph' | 'image' | 'callout' | 'trip_cta';

export interface ContentBlock {
	id: string;
	type: ContentBlockType;
	text?: string;
	level?: number;
	imageSrc?: string;
	caption?: string;
	imageWidth?: 'contained' | 'full-bleed';
	monthTag?: string;
	highlightColor?: string;
	journeyId?: string;
	ctaText?: string;
}

export interface Article {
	id: string;
	slug: string;
	title: string;
	author: string;
	coverImage: string;
	heroImage?: string;
	readingTime?: string;
	category: ArticleCategory;
	content?: string;
	contentBlocks?: ContentBlock[];
	excerpt?: string;
	relatedJourneyIds: string[];
	recommendedItems?: RecommendedItem[];
	tags?: string[];
	faqs?: { question: string; answer: string }[];
	ctaConfig?: ArticleCtaConfig;
	status: ArticleStatus;
	featured?: boolean;
	displayOrder?: number;
	pageTitle?: string;
	metaDescription?: string;
	createdAt: Date;
	updatedAt: Date;
}

const LEGACY_HERO_IMAGES: Record<LegacyArticleCategory, string> = {
	'Food Journey': '/images/inspirations/food-journey.jpg',
	'The Western Corridor': '/images/inspirations/great-outdoors.jpeg',
	'Ancient Chinese Culture': '/images/inspirations/traditional%20craft.png',
	'Spiritual Retreat': '/images/inspirations/spiritual%20retreat.webp',
	'Vibrant Nightscapes': '/images/inspirations/nightscapes.jpg',
	'Seasonal Highlights': '/images/inspirations/seasonal-highlights.jpg',
	'How to Plan a China Trip': '/images/inspirations/food-journey.jpg',
};

const LEGACY_SLUGS: Record<LegacyArticleCategory, string> = {
	'Food Journey': 'food-journey',
	'How to Plan a China Trip': 'how-to-plan-a-china-trip',
	'The Western Corridor': 'the-western-corridor',
	'Ancient Chinese Culture': 'ancient-chinese-culture',
	'Spiritual Retreat': 'spiritual-retreat',
	'Vibrant Nightscapes': 'vibrant-nightscapes',
	'Seasonal Highlights': 'seasonal-highlights',
};

export const ArticleCategoryToHeroImage: Record<ArticleCategory, string> = {
	...CANONICAL_CATEGORY_TO_HERO_IMAGE,
	...LEGACY_HERO_IMAGES,
};

export const ArticleCategoryToSlug: Record<ArticleCategory, string> = {
	...CANONICAL_CATEGORY_TO_SLUG,
	...LEGACY_SLUGS,
};

export const ArticleCategoryToDisplayName: Record<ArticleCategory, string> = {
	'China Travel Planning': 'China Travel Planning',
	'Business Travel & Bleisure in China': 'Business Travel & Bleisure in China',
	'Destinations & Route Strategy': 'Destinations & Route Strategy',
	'Culture, Dining & Local Experiences': 'Culture, Dining & Local Experiences',
	'Food Journey': 'How to Plan a China Trip; A Logic-First Guide (2026)',
	'How to Plan a China Trip': 'How to Plan a China Trip; A Logic-First Guide (2026)',
	'The Western Corridor': 'The Western Corridor',
	'Ancient Chinese Culture': 'Ancient Chinese Culture',
	'Spiritual Retreat': 'Whispers of the Water Towns',
	'Vibrant Nightscapes': 'Vibrant Nightscapes',
	'Seasonal Highlights': "The Alchemist's Kitchen",
};

export const ArticleCategoryToCardTitle: Record<ArticleCategory, string> = {
	'China Travel Planning': 'China Travel Planning',
	'Business Travel & Bleisure in China': 'Business Travel & Bleisure in China',
	'Destinations & Route Strategy': 'Destinations & Route Strategy',
	'Culture, Dining & Local Experiences': 'Culture, Dining & Local Experiences',
	'Food Journey': 'How to Plan a China Trip: A Logic-First Guide (2026)',
	'How to Plan a China Trip': 'How to Plan a China Trip: A Logic-First Guide (2026)',
	'The Western Corridor': 'The Western Corridor',
	'Ancient Chinese Culture': 'Ancient Chinese Culture',
	'Spiritual Retreat': 'Whispers of the Water Towns',
	'Vibrant Nightscapes': 'Vibrant Nightscapes',
	'Seasonal Highlights': "The Alchemist's Kitchen",
};

export const ArticleCategoryToCardDescription: Record<ArticleCategory, string> = {
	...CANONICAL_CATEGORY_TO_DESCRIPTION,
	'Food Journey': CANONICAL_CATEGORY_TO_DESCRIPTION['China Travel Planning'],
	'How to Plan a China Trip': CANONICAL_CATEGORY_TO_DESCRIPTION['China Travel Planning'],
	'The Western Corridor': CANONICAL_CATEGORY_TO_DESCRIPTION['Destinations & Route Strategy'],
	'Ancient Chinese Culture':
		CANONICAL_CATEGORY_TO_DESCRIPTION['Culture, Dining & Local Experiences'],
	'Spiritual Retreat': CANONICAL_CATEGORY_TO_DESCRIPTION['Destinations & Route Strategy'],
	'Vibrant Nightscapes':
		CANONICAL_CATEGORY_TO_DESCRIPTION['Culture, Dining & Local Experiences'],
	'Seasonal Highlights':
		CANONICAL_CATEGORY_TO_DESCRIPTION['Culture, Dining & Local Experiences'],
};

export function articleCategoryOptionLabel(cat: ArticleCategory): string {
	if ((CANONICAL_ARTICLE_CATEGORIES as string[]).includes(cat)) {
		return cat;
	}
	return `${ArticleCategoryToCardTitle[cat]} — ${cat} (legacy)`;
}

/** @deprecated Use getCanonicalCategoryBySlug from @/lib/articleCategories */
export const ArticleSlugToCategory = (slug: string): ArticleCategory | null => {
	if (slug === 'great-outdoors') return 'The Western Corridor';
	const entry = (Object.entries(ArticleCategoryToSlug) as [ArticleCategory, string][]).find(
		([, s]) => s === slug
	);
	return entry ? entry[0] : null;
};

export type RecommendedItemType = 'journey' | 'article';

export interface RecommendedItem {
	type: RecommendedItemType;
	id: string;
}
