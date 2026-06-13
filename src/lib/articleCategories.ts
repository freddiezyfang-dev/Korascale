/** Canonical Inspirations categories (URL + DB value). */
export type CanonicalArticleCategory =
	| 'China Travel Planning'
	| 'Business Travel & Bleisure in China'
	| 'Destinations & Route Strategy'
	| 'Culture, Dining & Local Experiences';

/** Legacy DB category values retained for backward compatibility. */
export type LegacyArticleCategory =
	| 'Food Journey'
	| 'How to Plan a China Trip'
	| 'The Western Corridor'
	| 'Ancient Chinese Culture'
	| 'Spiritual Retreat'
	| 'Vibrant Nightscapes'
	| 'Seasonal Highlights';

export type ArticleCategoryName = CanonicalArticleCategory | LegacyArticleCategory;

export const CANONICAL_ARTICLE_CATEGORIES: CanonicalArticleCategory[] = [
	'China Travel Planning',
	'Business Travel & Bleisure in China',
	'Destinations & Route Strategy',
	'Culture, Dining & Local Experiences',
];

export const LEGACY_ARTICLE_CATEGORIES: LegacyArticleCategory[] = [
	'Food Journey',
	'How to Plan a China Trip',
	'The Western Corridor',
	'Ancient Chinese Culture',
	'Spiritual Retreat',
	'Vibrant Nightscapes',
	'Seasonal Highlights',
];

export const CANONICAL_CATEGORY_TO_SLUG: Record<CanonicalArticleCategory, string> = {
	'China Travel Planning': 'china-travel-planning',
	'Business Travel & Bleisure in China': 'business-travel-bleisure-china',
	'Destinations & Route Strategy': 'destinations-route-strategy',
	'Culture, Dining & Local Experiences': 'culture-dining-local-experiences',
};

export const CANONICAL_CATEGORY_TO_HERO_IMAGE: Record<CanonicalArticleCategory, string> = {
	'China Travel Planning': '/images/inspirations/food-journey.jpg',
	'Business Travel & Bleisure in China': '/images/inspirations/nightscapes.jpg',
	'Destinations & Route Strategy': '/images/inspirations/great-outdoors.jpeg',
	'Culture, Dining & Local Experiences': '/images/inspirations/traditional%20craft.png',
};

export const CANONICAL_CATEGORY_TO_DESCRIPTION: Record<CanonicalArticleCategory, string> = {
	'China Travel Planning':
		'Dissect the intricate geography of the Middle Kingdom with logic-first frameworks. From balancing high-altitude spiritual pulse with historic depth, we map your journey with precision and reveal optimal sequences for true immersion.',
	'Business Travel & Bleisure in China':
		'Navigate China for work with efficiency and depth. From executive logistics and city hubs to curated bleisure extensions, we design trips that respect your schedule while unlocking authentic local context.',
	'Destinations & Route Strategy':
		'Ascend from mist-shrouded valleys to spiritual highlands. Explore route logic across corridors, borderlands, and evolving communities — where geography, timing, and narrative shape the right sequence for each journey.',
	'Culture, Dining & Local Experiences':
		'Go beyond the surface. Engage with artisans, regional flavors, nightscapes, and living traditions — from private ateliers and seasonal kitchens to the pulse of modern China meeting its ancient spirit.',
};

/** Legacy URL slug → canonical category */
const LEGACY_SLUG_TO_CANONICAL: Record<string, CanonicalArticleCategory> = {
	'food-journey': 'China Travel Planning',
	'how-to-plan-a-china-trip': 'China Travel Planning',
	'the-western-corridor': 'Destinations & Route Strategy',
	'great-outdoors': 'Destinations & Route Strategy',
	'spiritual-retreat': 'Destinations & Route Strategy',
	'ancient-chinese-culture': 'Culture, Dining & Local Experiences',
	'immersive-encounters': 'Culture, Dining & Local Experiences',
	'vibrant-nightscapes': 'Culture, Dining & Local Experiences',
	'seasonal-highlights': 'Culture, Dining & Local Experiences',
};

/** Legacy DB category name → canonical category */
const LEGACY_NAME_TO_CANONICAL: Record<LegacyArticleCategory, CanonicalArticleCategory> = {
	'Food Journey': 'China Travel Planning',
	'How to Plan a China Trip': 'China Travel Planning',
	'The Western Corridor': 'Destinations & Route Strategy',
	'Ancient Chinese Culture': 'Culture, Dining & Local Experiences',
	'Spiritual Retreat': 'Destinations & Route Strategy',
	'Vibrant Nightscapes': 'Culture, Dining & Local Experiences',
	'Seasonal Highlights': 'Culture, Dining & Local Experiences',
};

/** DB category names grouped under each canonical slug (for IN queries). */
const CANONICAL_SLUG_TO_QUERY_NAMES: Record<string, string[]> = {
	'china-travel-planning': [
		'China Travel Planning',
		'Food Journey',
		'How to Plan a China Trip',
	],
	'business-travel-bleisure-china': ['Business Travel & Bleisure in China'],
	'destinations-route-strategy': [
		'Destinations & Route Strategy',
		'The Western Corridor',
		'Spiritual Retreat',
	],
	'culture-dining-local-experiences': [
		'Culture, Dining & Local Experiences',
		'Ancient Chinese Culture',
		'Vibrant Nightscapes',
		'Seasonal Highlights',
	],
};

const SLUG_TO_CANONICAL: Record<string, CanonicalArticleCategory> = {
	...Object.fromEntries(
		(Object.entries(CANONICAL_CATEGORY_TO_SLUG) as [CanonicalArticleCategory, string][]).map(
			([category, slug]) => [slug, category]
		)
	),
	...LEGACY_SLUG_TO_CANONICAL,
};

function isCanonicalCategoryName(name: string): name is CanonicalArticleCategory {
	return (CANONICAL_ARTICLE_CATEGORIES as string[]).includes(name);
}

function isLegacyCategoryName(name: string): name is LegacyArticleCategory {
	return (LEGACY_ARTICLE_CATEGORIES as string[]).includes(name);
}

export function getCanonicalCategorySlug(category: CanonicalArticleCategory): string {
	return CANONICAL_CATEGORY_TO_SLUG[category];
}

export function isLegacyCategorySlug(slug: string): boolean {
	const trimmed = decodeURIComponent(slug).trim();
	return trimmed in LEGACY_SLUG_TO_CANONICAL;
}

export function isCanonicalCategorySlug(slug: string): boolean {
	const trimmed = decodeURIComponent(slug).trim();
	return (Object.values(CANONICAL_CATEGORY_TO_SLUG) as string[]).includes(trimmed);
}

/** Resolve URL slug to canonical category, or null if unknown. */
export function getCanonicalCategoryBySlug(categorySlug: string): CanonicalArticleCategory | null {
	const trimmed = decodeURIComponent(categorySlug).trim();
	return SLUG_TO_CANONICAL[trimmed] ?? null;
}

/** Map article DB category to canonical category. */
export function getCanonicalCategoryForArticle(
	article: { category: ArticleCategoryName | string }
): CanonicalArticleCategory {
	const name = article.category;
	if (isCanonicalCategoryName(name)) return name;
	if (isLegacyCategoryName(name)) return LEGACY_NAME_TO_CANONICAL[name];
	return 'China Travel Planning';
}

export function getArticleCanonicalCategorySlug(
	article: { category: ArticleCategoryName | string }
): string {
	return getCanonicalCategorySlug(getCanonicalCategoryForArticle(article));
}

export function getArticleCanonicalPath(
	article: { category: ArticleCategoryName | string; slug: string }
): string {
	return `/inspirations/${getArticleCanonicalCategorySlug(article)}/${article.slug}`;
}

export function getCategoryCanonicalPath(categorySlug: string): string | null {
	const canonical = getCanonicalCategoryBySlug(categorySlug);
	if (!canonical) return null;
	return `/inspirations/${getCanonicalCategorySlug(canonical)}`;
}

/** DB category names to query for a canonical category page. */
export function getArticleCategoryQueryNames(canonicalCategorySlug: string): string[] {
	const trimmed = decodeURIComponent(canonicalCategorySlug).trim();
	const canonical = getCanonicalCategoryBySlug(trimmed);
	if (!canonical) return [];
	return CANONICAL_SLUG_TO_QUERY_NAMES[getCanonicalCategorySlug(canonical)] ?? [canonical];
}

export function getArticleCategoryLabel(
	article: { category: ArticleCategoryName | string }
): string {
	return getCanonicalCategoryForArticle(article);
}

/** Admin dropdown: new categories first, then legacy. */
export const ADMIN_ARTICLE_CATEGORIES: ArticleCategoryName[] = [
	...CANONICAL_ARTICLE_CATEGORIES,
	...LEGACY_ARTICLE_CATEGORIES,
];
