import type { MetadataRoute } from 'next';
import { fetchActiveJourneySitemapSlugs } from '@/lib/journeyDetailQuery.server';
import {
  buildJourneyDetailPath,
  SITE_URL,
  SITEMAP_STATIC_PATHS,
} from '@/lib/journeySitemap.server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = SITEMAP_STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : path === '/journeys' ? 0.9 : 0.7,
  }));

  let journeyEntries: MetadataRoute.Sitemap = [];
  try {
    const slugs = await fetchActiveJourneySitemapSlugs();
    journeyEntries = slugs.map((slug) => ({
      url: `${SITE_URL}${buildJourneyDetailPath(slug)}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('[sitemap] Failed to fetch journey slugs, static URLs only:', error);
  }

  return [...staticEntries, ...journeyEntries];
}
