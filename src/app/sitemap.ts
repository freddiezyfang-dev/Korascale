import type { MetadataRoute } from 'next';
import { fetchActiveJourneySitemapSlugs } from '@/lib/journeyDetailQuery.server';
import {
	getActiveArticleCategoriesForSitemap,
	getLatestActiveArticleUpdatedAt,
	getPublishedArticlesForSitemap,
} from '@/lib/articleQuery.server';
import {
	buildJourneyDetailPath,
	SITE_URL,
	SITEMAP_STATIC_PATHS,
} from '@/lib/journeySitemap.server';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const fallbackModified = new Date();

	const staticEntries: MetadataRoute.Sitemap = SITEMAP_STATIC_PATHS.filter(
		(path) => path !== '/inspirations'
	).map((path) => ({
		url: `${SITE_URL}${path}`,
		lastModified: fallbackModified,
		changeFrequency: 'weekly' as const,
		priority: path === '' ? 1 : path === '/journeys' ? 0.9 : 0.7,
	}));

	let journeyEntries: MetadataRoute.Sitemap = [];
	try {
		const slugs = await fetchActiveJourneySitemapSlugs();
		journeyEntries = slugs.map((slug) => ({
			url: `${SITE_URL}${buildJourneyDetailPath(slug)}`,
			lastModified: fallbackModified,
			changeFrequency: 'weekly' as const,
			priority: 0.8,
		}));
	} catch (error) {
		console.error('[sitemap] Failed to fetch journey slugs, static URLs only:', error);
	}

	let inspirationsIndexEntry: MetadataRoute.Sitemap = [];
	let categoryEntries: MetadataRoute.Sitemap = [];
	let articleEntries: MetadataRoute.Sitemap = [];

	try {
		const [latestArticleUpdatedAt, categories, articles] = await Promise.all([
			getLatestActiveArticleUpdatedAt(),
			getActiveArticleCategoriesForSitemap(),
			getPublishedArticlesForSitemap(),
		]);

		const inspirationsLastModified = latestArticleUpdatedAt ?? fallbackModified;

		inspirationsIndexEntry = [
			{
				url: `${SITE_URL}/inspirations`,
				lastModified: inspirationsLastModified,
				changeFrequency: 'weekly' as const,
				priority: 0.85,
			},
		];

		categoryEntries = categories.map(({ categorySlug, latestUpdatedAt }) => ({
			url: `${SITE_URL}/inspirations/${categorySlug}`,
			lastModified: latestUpdatedAt,
			changeFrequency: 'weekly' as const,
			priority: 0.8,
		}));

		articleEntries = articles.map(({ slug, categorySlug, updatedAt }) => ({
			url: `${SITE_URL}/inspirations/${categorySlug}/${slug}`,
			lastModified: updatedAt,
			changeFrequency: 'monthly' as const,
			priority: 0.75,
		}));
	} catch (error) {
		console.error('[sitemap] Failed to fetch inspirations URLs:', error);
	}

	return [
		...staticEntries,
		...inspirationsIndexEntry,
		...categoryEntries,
		...articleEntries,
		...journeyEntries,
	];
}
