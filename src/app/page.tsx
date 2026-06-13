import { getPublishedFeaturedArticles } from '@/lib/articleQuery.server';
import { getArticleCanonicalPath, getArticleCategoryLabel } from '@/lib/articleCategories';
import { Container, Section } from '@/components/common';
import EditorialMosaic, { type EditorialMosaicItem } from '@/components/sections/EditorialMosaic';
import HomePageClient from './HomePageClient';

function buildMosaicItems(
	articles: Awaited<ReturnType<typeof getPublishedFeaturedArticles>>
): EditorialMosaicItem[] {
	return articles.map((article) => ({
		title: article.title,
		image: article.heroImage || article.coverImage || '',
		href: getArticleCanonicalPath(article),
		category: getArticleCategoryLabel(article),
	}));
}

export const dynamic = 'force-dynamic';

export default async function Home() {
	const featuredArticles = await getPublishedFeaturedArticles(5);
	const mosaicItems = buildMosaicItems(featuredArticles);

	return (
		<HomePageClient
			mosaicSection={
				mosaicItems.length > 0 ? (
					<Section background="tertiary" padding="xl">
						<Container size="xl">
							<EditorialMosaic items={mosaicItems} />
						</Container>
					</Section>
				) : null
			}
		/>
	);
}
