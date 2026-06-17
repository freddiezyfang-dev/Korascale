/**
 * Server-only article queries (direct DB). Do not import from Client Components.
 */
import { query } from '@/lib/db';
import {
	getArticleCanonicalCategorySlug,
	getArticleCategoryQueryNames,
	getCanonicalCategoryBySlug,
	getCanonicalCategorySlug,
	CANONICAL_ARTICLE_CATEGORIES,
} from '@/lib/articleCategories';
import {
	Article,
	ArticleCategory,
	ContentBlock,
	RecommendedItem,
} from '@/types/article';
import { parseArticleCtaConfig } from '@/lib/articleCta';

export type ArticleListItem = {
	id: string;
	slug: string;
	title: string;
	author: string;
	coverImage: string;
	heroImage?: string;
	readingTime?: string;
	category: ArticleCategory;
	excerpt?: string;
	featured?: boolean;
	displayOrder?: number;
	updatedAt: Date;
};

export type ArticleSitemapEntry = {
	slug: string;
	categorySlug: string;
	updatedAt: Date;
};

const LIST_SELECT = `
  id, slug, title, author, cover_image, hero_image, reading_time,
  category, excerpt, is_featured, display_order, updated_at
`;

function parseJsonField<T>(value: unknown): T | undefined {
	if (value == null) return undefined;
	if (typeof value === 'string') {
		try {
			return JSON.parse(value) as T;
		} catch {
			return undefined;
		}
	}
	return value as T;
}

function parseJsonArray<T>(value: unknown): T[] | undefined {
	const parsed = parseJsonField<T[]>(value);
	return Array.isArray(parsed) ? parsed : undefined;
}

function normalizeContentBlocks(raw: unknown): ContentBlock[] | undefined {
	const blocks = parseJsonArray<Record<string, unknown>>(raw);
	if (!blocks?.length) return undefined;

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

function mapRowToArticleListItem(row: Record<string, unknown>): ArticleListItem {
	return {
		id: String(row.id ?? ''),
		slug: String(row.slug ?? ''),
		title: String(row.title ?? ''),
		author: String(row.author ?? 'KoraScale'),
		coverImage: row.cover_image ? String(row.cover_image) : '',
		heroImage: row.hero_image ? String(row.hero_image) : undefined,
		readingTime: row.reading_time ? String(row.reading_time) : undefined,
		category: (row.category as ArticleCategory) ?? 'Food Journey',
		excerpt: row.excerpt ? String(row.excerpt) : undefined,
		featured: row.is_featured === true,
		displayOrder: row.display_order != null ? Number(row.display_order) : undefined,
		updatedAt: row.updated_at ? new Date(String(row.updated_at)) : new Date(),
	};
}

/** Minimal Article shape for ArticleCard and similar list UI. */
export function articleListItemToCardArticle(item: ArticleListItem): Article {
	return {
		...item,
		relatedJourneyIds: [],
		status: 'active',
		createdAt: item.updatedAt,
		updatedAt: item.updatedAt,
	};
}

function mapRowToArticle(row: Record<string, unknown>): Article {
	const relatedJourneyIds = parseJsonArray<string>(row.related_journey_ids);
	const contentBlocks = normalizeContentBlocks(row.content_blocks);
	const recommendedItems = parseJsonArray<RecommendedItem>(row.recommended_items);
	const tags = parseJsonArray<string>(row.tags);
	const faqs = parseJsonArray<{ question: string; answer: string }>(row.faqs);
	const ctaConfig = parseArticleCtaConfig(row.cta_config);

	return {
		id: String(row.id ?? ''),
		slug: String(row.slug ?? ''),
		title: String(row.title ?? ''),
		author: String(row.author ?? 'KoraScale'),
		coverImage: row.cover_image ? String(row.cover_image) : '',
		heroImage: row.hero_image ? String(row.hero_image) : undefined,
		readingTime: row.reading_time ? String(row.reading_time) : undefined,
		category: (row.category as ArticleCategory) ?? 'Food Journey',
		content: row.content ? String(row.content) : undefined,
		contentBlocks,
		excerpt: row.excerpt ? String(row.excerpt) : undefined,
		relatedJourneyIds: relatedJourneyIds ?? [],
		recommendedItems,
		ctaConfig,
		faqs,
		tags,
		status: 'active',
		featured: row.is_featured === true,
		displayOrder: row.display_order != null ? Number(row.display_order) : undefined,
		pageTitle: row.page_title ? String(row.page_title) : undefined,
		metaDescription: row.meta_description ? String(row.meta_description) : undefined,
		createdAt: row.created_at ? new Date(String(row.created_at)) : new Date(),
		updatedAt: row.updated_at ? new Date(String(row.updated_at)) : new Date(),
	};
}

/** Featured active articles for homepage mosaic and inspirations landing. */
export async function getPublishedFeaturedArticles(limit = 5): Promise<ArticleListItem[]> {
	try {
		const { rows } = await query(
			`
      SELECT ${LIST_SELECT}
      FROM articles
      WHERE status = 'active' AND is_featured = true
      ORDER BY display_order ASC NULLS LAST, updated_at DESC
      LIMIT $1
    `,
			[limit]
		);

		return rows.map((row) => mapRowToArticleListItem(row as Record<string, unknown>));
	} catch (error) {
		console.error('[articleQuery.server] getPublishedFeaturedArticles failed:', error);
		return [];
	}
}

/** Active articles in a canonical category (includes mapped legacy DB categories). */
export async function getPublishedArticlesByCategorySlug(
	categorySlug: string
): Promise<ArticleListItem[]> {
	const canonical = getCanonicalCategoryBySlug(categorySlug);
	if (!canonical) {
		return [];
	}

	const canonicalSlug = getCanonicalCategorySlug(canonical);
	const categoryNames = getArticleCategoryQueryNames(canonicalSlug);
	if (categoryNames.length === 0) {
		return [];
	}

	try {
		const { rows } = await query(
			`
      SELECT ${LIST_SELECT}
      FROM articles
      WHERE status = 'active' AND category = ANY($1::text[])
      ORDER BY display_order ASC NULLS LAST, updated_at DESC
    `,
			[categoryNames]
		);

		return rows.map((row) => mapRowToArticleListItem(row as Record<string, unknown>));
	} catch (error) {
		console.error('[articleQuery.server] getPublishedArticlesByCategorySlug failed:', error);
		return [];
	}
}

/** Active articles for sitemap (slug + category URL + updated_at). */
export async function getPublishedArticlesForSitemap(): Promise<ArticleSitemapEntry[]> {
	try {
		const { rows } = await query(`
      SELECT slug, category, updated_at
      FROM articles
      WHERE status = 'active'
      ORDER BY updated_at DESC
    `);

		return rows
			.map((row) => {
				const category = row.category as ArticleCategory;
				const categorySlug = getArticleCanonicalCategorySlug({ category });
				const slug = String(row.slug ?? '').trim();
				if (!categorySlug || !slug) return null;
				return {
					slug,
					categorySlug,
					updatedAt: row.updated_at ? new Date(String(row.updated_at)) : new Date(),
				};
			})
			.filter((entry): entry is ArticleSitemapEntry => entry !== null);
	} catch (error) {
		console.error('[articleQuery.server] getPublishedArticlesForSitemap failed:', error);
		return [];
	}
}

/** Canonical category slugs for sitemap (always the 4 new categories). */
export async function getActiveArticleCategoriesForSitemap(): Promise<
	{ categorySlug: string; latestUpdatedAt: Date }[]
> {
	try {
		const { rows } = await query(`
      SELECT category, MAX(updated_at) AS latest_updated_at
      FROM articles
      WHERE status = 'active'
      GROUP BY category
    `);

		const latestByCanonicalSlug = new Map<string, Date>();

		for (const row of rows) {
			const category = row.category as ArticleCategory;
			const canonicalSlug = getArticleCanonicalCategorySlug({ category });
			const updatedAt = row.latest_updated_at
				? new Date(String(row.latest_updated_at))
				: new Date();
			const existing = latestByCanonicalSlug.get(canonicalSlug);
			if (!existing || updatedAt > existing) {
				latestByCanonicalSlug.set(canonicalSlug, updatedAt);
			}
		}

		const fallbackModified = new Date();
		return CANONICAL_ARTICLE_CATEGORIES.map((category) => {
			const categorySlug = getCanonicalCategorySlug(category);
			return {
				categorySlug,
				latestUpdatedAt: latestByCanonicalSlug.get(categorySlug) ?? fallbackModified,
			};
		});
	} catch (error) {
		console.error('[articleQuery.server] getActiveArticleCategoriesForSitemap failed:', error);
		return CANONICAL_ARTICLE_CATEGORIES.map((category) => ({
			categorySlug: getCanonicalCategorySlug(category),
			latestUpdatedAt: new Date(),
		}));
	}
}

/** Latest updated_at among active articles (for /inspirations index sitemap). */
export async function getLatestActiveArticleUpdatedAt(): Promise<Date | null> {
	try {
		const { rows } = await query(`
      SELECT MAX(updated_at) AS latest_updated_at
      FROM articles
      WHERE status = 'active'
    `);
		const value = rows[0]?.latest_updated_at;
		return value ? new Date(String(value)) : null;
	} catch (error) {
		console.error('[articleQuery.server] getLatestActiveArticleUpdatedAt failed:', error);
		return null;
	}
}

/** Active article by slug — full row including content / content_blocks. */
export async function getPublishedArticleBySlug(slug: string): Promise<Article | null> {
	const trimmed = decodeURIComponent(slug).trim();
	if (!trimmed) {
		console.error('[articleQuery.server] getPublishedArticleBySlug: empty slug');
		return null;
	}

	try {
		const { rows } = await query(
			`
      SELECT *
      FROM articles
      WHERE status = 'active' AND slug = $1
      LIMIT 1
    `,
			[trimmed]
		);

		if (rows.length === 0) {
			console.error('[articleQuery.server] getPublishedArticleBySlug: no row matched', {
				slug: trimmed,
				statusFilter: 'active',
				sql: 'SELECT * FROM articles WHERE status = $1 AND slug = $2 LIMIT 1',
			});
			return null;
		}

		const article = mapRowToArticle(rows[0] as Record<string, unknown>);
		const blockCount = article.contentBlocks?.length ?? 0;
		const hasLegacyContent = Boolean(article.content?.trim());

		if (blockCount === 0 && !hasLegacyContent) {
			console.warn('[articleQuery.server] Article has no renderable body content', {
				slug: article.slug,
				title: article.title,
			});
		}

		return article;
	} catch (error) {
		console.error('[articleQuery.server] getPublishedArticleBySlug failed:', {
			slug: trimmed,
			error,
		});
		return null;
	}
}

/** Params for generateStaticParams — no HTTP. */
export async function getPublishedArticlesForStaticParams(): Promise<
	{ category: string; slug: string }[]
> {
	try {
		const { rows } = await query(`
      SELECT slug, category
      FROM articles
      WHERE status = 'active'
      ORDER BY updated_at DESC
    `);

		return rows
			.map((row) => {
				const category = row.category as ArticleCategory;
				const categorySlug = getArticleCanonicalCategorySlug({ category });
				const slug = String(row.slug ?? '').trim();
				if (!categorySlug || !slug) return null;
				return { category: categorySlug, slug };
			})
			.filter((entry): entry is { category: string; slug: string } => entry !== null);
	} catch (error) {
		console.error('[articleQuery.server] getPublishedArticlesForStaticParams failed:', error);
		return [];
	}
}

/** Related active articles in the same canonical category (excludes current slug). */
export async function getRelatedPublishedArticles(
	article: { category: ArticleCategory | string; slug: string },
	limit = 4
): Promise<Article[]> {
	const trimmedSlug = decodeURIComponent(article.slug).trim();
	if (!trimmedSlug) return [];

	const canonicalSlug = getArticleCanonicalCategorySlug(article);
	const categoryNames = getArticleCategoryQueryNames(canonicalSlug);
	if (categoryNames.length === 0) return [];

	try {
		const { rows } = await query(
			`
      SELECT *
      FROM articles
      WHERE status = 'active'
        AND category = ANY($1::text[])
        AND slug <> $2
      ORDER BY updated_at DESC
      LIMIT $3
    `,
			[categoryNames, trimmedSlug, limit]
		);

		return rows.map((row) => mapRowToArticle(row as Record<string, unknown>));
	} catch (error) {
		console.error('[articleQuery.server] getRelatedPublishedArticles failed:', error);
		return [];
	}
}

const SIDEBAR_RELATED_LIMIT = 3;

async function getPublishedArticlesByIds(
	ids: string[],
	excludeSlug: string
): Promise<Article[]> {
	if (ids.length === 0) return [];

	try {
		const { rows } = await query(
			`
      SELECT *
      FROM articles
      WHERE status = 'active'
        AND id = ANY($1::uuid[])
        AND slug <> $2
    `,
			[ids, excludeSlug]
		);

		const byId = new Map(
			rows.map((row) => {
				const article = mapRowToArticle(row as Record<string, unknown>);
				return [article.id, article] as const;
			})
		);

		return ids
			.map((id) => byId.get(id))
			.filter((article): article is Article => article != null);
	} catch (error) {
		console.error('[articleQuery.server] getPublishedArticlesByIds failed:', error);
		return [];
	}
}

async function getRelatedPublishedArticlesByTags(
	article: Article,
	excludeIds: Set<string>,
	limit: number
): Promise<Article[]> {
	const tags = (article.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
	if (tags.length === 0 || limit <= 0) return [];

	try {
		const { rows } = await query(
			`
      SELECT *
      FROM articles
      WHERE status = 'active'
        AND slug <> $1
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(COALESCE(tags, '[]'::jsonb)) AS tag(value)
          WHERE tag.value = ANY($2::text[])
        )
      ORDER BY updated_at DESC
      LIMIT $3
    `,
			[article.slug.trim(), tags, limit + excludeIds.size]
		);

		return rows
			.map((row) => mapRowToArticle(row as Record<string, unknown>))
			.filter((candidate) => !excludeIds.has(candidate.id))
			.slice(0, limit);
	} catch (error) {
		console.error('[articleQuery.server] getRelatedPublishedArticlesByTags failed:', error);
		return [];
	}
}

async function getFeaturedOrLatestPublishedArticles(
	excludeSlug: string,
	excludeIds: Set<string>,
	limit: number
): Promise<Article[]> {
	if (limit <= 0) return [];

	try {
		const { rows } = await query(
			`
      SELECT *
      FROM articles
      WHERE status = 'active'
        AND slug <> $1
      ORDER BY is_featured DESC NULLS LAST, display_order ASC NULLS LAST, updated_at DESC
      LIMIT $2
    `,
			[excludeSlug, limit + excludeIds.size]
		);

		return rows
			.map((row) => mapRowToArticle(row as Record<string, unknown>))
			.filter((candidate) => !excludeIds.has(candidate.id))
			.slice(0, limit);
	} catch (error) {
		console.error('[articleQuery.server] getFeaturedOrLatestPublishedArticles failed:', error);
		return [];
	}
}

/**
 * Sidebar related articles: manual article picks first (order preserved), then auto-fill to 3.
 * Journeys in recommended_items are ignored here (reserved for future bottom module).
 */
export async function getSidebarRelatedArticles(
	article: Article,
	limit = SIDEBAR_RELATED_LIMIT
): Promise<Article[]> {
	const excludeSlug = decodeURIComponent(article.slug).trim();
	if (!excludeSlug) return [];

	const excludeIds = new Set<string>([article.id]);
	const result: Article[] = [];

	const manualIds = (article.recommendedItems ?? [])
		.filter((item) => item.type === 'article')
		.map((item) => item.id)
		.slice(0, limit);

	if (manualIds.length > 0) {
		const manualArticles = await getPublishedArticlesByIds(manualIds, excludeSlug);
		for (const manualArticle of manualArticles) {
			if (result.length >= limit) break;
			if (excludeIds.has(manualArticle.id)) continue;
			result.push(manualArticle);
			excludeIds.add(manualArticle.id);
		}
	}

	const appendUnique = (candidates: Article[]) => {
		for (const candidate of candidates) {
			if (result.length >= limit) break;
			if (excludeIds.has(candidate.id)) continue;
			result.push(candidate);
			excludeIds.add(candidate.id);
		}
	};

	let need = limit - result.length;
	if (need > 0) {
		appendUnique(await getRelatedPublishedArticles(article, need + excludeIds.size));
	}

	need = limit - result.length;
	if (need > 0) {
		appendUnique(await getRelatedPublishedArticlesByTags(article, excludeIds, need));
	}

	need = limit - result.length;
	if (need > 0) {
		appendUnique(await getFeaturedOrLatestPublishedArticles(excludeSlug, excludeIds, need));
	}

	return result.slice(0, limit);
}
