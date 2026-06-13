import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { Section, Container, Heading, Text } from '@/components/common';
import { ArticleCard } from '@/components/cards/ArticleCard';
import {
	articleListItemToCardArticle,
	getPublishedArticlesByCategorySlug,
} from '@/lib/articleQuery.server';
import {
	CANONICAL_ARTICLE_CATEGORIES,
	CANONICAL_CATEGORY_TO_DESCRIPTION,
	CANONICAL_CATEGORY_TO_HERO_IMAGE,
	getCanonicalCategoryBySlug,
	getCanonicalCategorySlug,
} from '@/lib/articleCategories';

const SITE_URL = 'https://www.korascale.com';

export const dynamic = 'force-dynamic';

type PageProps = {
	params: Promise<{ category: string }>;
};

export function generateStaticParams() {
	return CANONICAL_ARTICLE_CATEGORIES.map((category) => ({
		category: getCanonicalCategorySlug(category),
	}));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { category: categorySlug } = await params;
	const canonicalCategory = getCanonicalCategoryBySlug(categorySlug);

	if (!canonicalCategory) {
		return { title: 'Category Not Found | KoraScale' };
	}

	const canonicalSlug = getCanonicalCategorySlug(canonicalCategory);
	const title = `${canonicalCategory} | KoraScale Inspirations`;
	const description =
		CANONICAL_CATEGORY_TO_DESCRIPTION[canonicalCategory] ||
		`Explore ${canonicalCategory} travel insights, guides, and inspiration from KoraScale.`;
	const canonical = `${SITE_URL}/inspirations/${canonicalSlug}`;

	return {
		title,
		description,
		alternates: { canonical },
		openGraph: {
			title,
			description,
			url: canonical,
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
		},
	};
}

export default async function InspirationCategoryPage({ params }: PageProps) {
	const { category: categorySlug } = await params;
	const canonicalCategory = getCanonicalCategoryBySlug(categorySlug);

	if (!canonicalCategory) {
		notFound();
	}

	const canonicalSlug = getCanonicalCategorySlug(canonicalCategory);

	if (categorySlug !== canonicalSlug) {
		permanentRedirect(`/inspirations/${canonicalSlug}`);
	}

	const articles = await getPublishedArticlesByCategorySlug(canonicalSlug);
	const hero = CANONICAL_CATEGORY_TO_HERO_IMAGE[canonicalCategory];

	return (
		<main>
			<Section background="primary" padding="none" className="relative h-[520px] overflow-hidden">
				<div
					className="absolute inset-0 bg-cover bg-center"
					style={{ backgroundImage: `url('${hero}')` }}
				/>
				<div className="absolute inset-0 bg-black/35" />
				<div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
					<Heading
						level={1}
						className="text-4xl md:text-6xl font-semibold tracking-tight text-white drop-shadow-lg"
						style={{ fontFamily: 'Montserrat, sans-serif' }}
					>
						{canonicalCategory}
					</Heading>
				</div>
			</Section>

			<Section background="secondary" padding="xl">
				<Container size="xl">
					<div className="max-w-4xl mx-auto text-center mb-12">
						<Text className="text-lg md:text-xl text-gray-700 leading-relaxed font-sans">
							{CANONICAL_CATEGORY_TO_DESCRIPTION[canonicalCategory]}
						</Text>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{articles.map((article) => (
							<ArticleCard
								key={article.id}
								article={articleListItemToCardArticle(article)}
							/>
						))}
					</div>
					{articles.length === 0 && (
						<div className="col-span-full text-center py-10">
							<Text className="text-gray-600 mb-2">暂无文章</Text>
						</div>
					)}
				</Container>
			</Section>
		</main>
	);
}
