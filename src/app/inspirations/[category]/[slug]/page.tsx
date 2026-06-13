import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import ArticleDetailServerSections from './ArticleDetailServerSections';
import {
	ArticleDesktopSidebar,
	ArticleMobileSidebar,
	ArticleShareButtons,
} from './ClientArticlePage';
import {
	getPublishedArticleBySlug,
	getPublishedArticlesForStaticParams,
	getRelatedPublishedArticles,
} from '@/lib/articleQuery.server';
import {
	getArticleCanonicalCategorySlug,
	getArticleCanonicalPath,
} from '@/lib/articleCategories';
import { getArticleSeoDescription } from '@/lib/articleSeo';
import type { Article } from '@/types/article';

type SerializableArticle = Omit<Article, 'createdAt' | 'updatedAt'> & {
	createdAt: string;
	updatedAt: string;
};

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

const SITE_URL = 'https://www.korascale.com';

type PageProps = {
	params: Promise<{ category: string; slug: string }>;
};

function serializeArticle(article: Article): SerializableArticle {
	return {
		...article,
		createdAt: article.createdAt.toISOString(),
		updatedAt: article.updatedAt.toISOString(),
	};
}

function buildArticleJsonLd(article: Article, categorySlug: string) {
	const image = article.heroImage || article.coverImage || '';
	const imageUrl = image
		? image.startsWith('http')
			? image
			: `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`
		: undefined;

	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: article.title,
		description: getArticleSeoDescription(article),
		datePublished: article.createdAt.toISOString(),
		dateModified: article.updatedAt.toISOString(),
		image: imageUrl ? [imageUrl] : undefined,
		author: {
			'@type': 'Organization',
			name: 'KoraScale',
		},
		publisher: {
			'@type': 'Organization',
			name: 'KoraScale',
			url: SITE_URL,
		},
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': `${SITE_URL}/inspirations/${categorySlug}/${article.slug}`,
		},
	};
}

export async function generateStaticParams() {
	try {
		return await getPublishedArticlesForStaticParams();
	} catch (error) {
		console.error('[Inspirations Detail] Failed to generate static params:', error);
		return [];
	}
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const article = await getPublishedArticleBySlug(slug);

	if (!article) {
		console.error('[Inspirations Detail] generateMetadata: article not found', {
			slug,
			statusFilter: 'active',
			sql: 'SELECT * FROM articles WHERE status = $1 AND slug = $2 LIMIT 1',
		});
		return {
			title: 'Article Not Found | KoraScale',
			description: 'The requested inspiration article could not be found.',
		};
	}

	const categorySlug = getArticleCanonicalCategorySlug(article);
	const title = article.pageTitle || `${article.title} | KoraScale`;
	const description = getArticleSeoDescription(article);
	const canonical = `${SITE_URL}/inspirations/${categorySlug}/${article.slug}`;
	const image = article.heroImage || article.coverImage;
	const ogImage = image
		? image.startsWith('http')
			? image
			: `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`
		: undefined;

	return {
		title,
		description,
		alternates: { canonical },
		openGraph: {
			title,
			description,
			url: canonical,
			type: 'article',
			images: ogImage ? [{ url: ogImage }] : undefined,
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: ogImage ? [ogImage] : undefined,
		},
	};
}

export default async function ArticleDetailPage({ params }: PageProps) {
	const { category: paramCategory, slug } = await params;
	const article = await getPublishedArticleBySlug(slug);

	if (!article) {
		console.error('[Inspirations Detail] notFound — no active article for slug', {
			slug,
			paramCategory,
			statusFilter: 'active',
			sql: 'SELECT * FROM articles WHERE status = $1 AND slug = $2 LIMIT 1',
		});
		notFound();
	}

	const categorySlug = getArticleCanonicalCategorySlug(article);

	if (paramCategory !== categorySlug) {
		permanentRedirect(getArticleCanonicalPath(article));
	}

	const serializedArticle = serializeArticle(article);
	const relatedArticles = await getRelatedPublishedArticles(article, 4);
	const serializedRelated = relatedArticles.map(serializeArticle);

	const articleJsonLd = buildArticleJsonLd(article, categorySlug);

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
			/>
			<ArticleDetailServerSections
				article={article}
				categorySlug={categorySlug}
				shareSlot={<ArticleShareButtons />}
				sidebarSlot={
					<ArticleDesktopSidebar
						article={serializedArticle}
						relatedArticles={serializedRelated}
					/>
				}
				mobileSidebarSlot={
					<ArticleMobileSidebar
						article={serializedArticle}
						relatedArticles={serializedRelated}
					/>
				}
			/>
		</>
	);
}
