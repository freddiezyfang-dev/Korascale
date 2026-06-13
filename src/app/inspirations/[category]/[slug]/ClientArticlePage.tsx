'use client';

import Link from 'next/link';
import { Instagram, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { Section, Container, Heading, Text } from '@/components/common';
import { useArticleManagement } from '@/context/ArticleManagementContext';
import {
	RecommendedItem,
	ArticleCategory,
	type Article,
} from '@/types/article';
import { getArticleCanonicalPath } from '@/lib/articleCategories';
import { useJourneyManagement } from '@/context/JourneyManagementContext';

export type SerializableArticle = Omit<Article, 'createdAt' | 'updatedAt'> & {
	createdAt: string;
	updatedAt: string;
};

interface ClientArticlePageProps {
	article: SerializableArticle;
	relatedArticles: SerializableArticle[];
	categorySlug: string;
}

function getRecommendedItemHref(
	item:
		| {
				type: 'journey';
				id: string;
				data: { slug: string; title: string; image?: string; [key: string]: any };
		  }
		| {
				type: 'article';
				id: string;
				data: {
					slug: string;
					title: string;
					category: ArticleCategory;
					coverImage?: string;
					heroImage?: string;
					[key: string]: any;
				};
		  }
): string {
	if (item.type === 'journey') {
		return `/journeys/${item.data.slug}`;
	}
	return getArticleCanonicalPath(item.data);
}

export function ArticleShareButtons() {
	return (
		<div className="flex items-center gap-4 min-w-0">
			<Text className="text-xs text-gray-500 uppercase tracking-widest font-sans">Share</Text>
			<div className="flex gap-3">
				<button
					type="button"
					onClick={() => window.open('https://www.instagram.com/', '_blank')}
					className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
					aria-label="Share on Instagram"
				>
					<Instagram className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={() =>
						window.open(
							`https://wa.me/?text=${encodeURIComponent(window.location.href)}`,
							'_blank'
						)
					}
					className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
					aria-label="Share on WhatsApp"
				>
					<MessageCircle className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={() => {
						navigator.clipboard.writeText(window.location.href);
						alert('链接已复制');
					}}
					className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
					aria-label="Copy link"
				>
					<LinkIcon className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}

function useSidebarItems(
	article: SerializableArticle,
	relatedArticles: SerializableArticle[]
) {
	const { articles: contextArticles } = useArticleManagement();
	const { journeys } = useJourneyManagement();

	const recommendedItems: Array<
		| {
				type: 'journey';
				id: string;
				data: { slug: string; title: string; image?: string; [key: string]: any };
		  }
		| {
				type: 'article';
				id: string;
				data: {
					slug: string;
					title: string;
					category: ArticleCategory;
					coverImage?: string;
					heroImage?: string;
					readingTime?: string;
					[key: string]: any;
				};
		  }
	> = [];

	if (article.recommendedItems && article.recommendedItems.length > 0) {
		article.recommendedItems.forEach((item: RecommendedItem) => {
			if (item.type === 'journey') {
				const journey = journeys.find((j) => j.id === item.id);
				if (journey) recommendedItems.push({ type: 'journey', id: item.id, data: journey });
			} else if (item.type === 'article') {
				const articleItem = contextArticles.find(
					(a) => a.id === item.id && a.status === 'active'
				);
				if (articleItem) {
					recommendedItems.push({ type: 'article', id: item.id, data: articleItem });
				}
			}
		});
	} else {
		journeys
			.filter((j) => article.relatedJourneyIds.includes(j.id))
			.forEach((j) => recommendedItems.push({ type: 'journey', id: j.id, data: j }));
	}

	const sidebarItems =
		recommendedItems.length > 0
			? recommendedItems
			: relatedArticles.map((item) => ({
					type: 'article' as const,
					id: item.id,
					data: {
						...item,
						category: item.category as ArticleCategory,
					},
				}));

	return { sidebarItems, recommendedItems };
}

function SidebarCard({
	item,
}: {
	item: ReturnType<typeof useSidebarItems>['sidebarItems'][number];
}) {
	return (
		<Link
			key={`${item.type}-${item.id}`}
			href={getRecommendedItemHref(item)}
			className="group block"
		>
			<div className="bg-white border border-[#d1d5db] rounded-lg overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
				<div className="aspect-video w-full overflow-hidden">
					<img
						src={
							item.type === 'journey'
								? item.data.image
								: item.data.coverImage ||
									item.data.heroImage ||
									'/images/default-article.jpg'
						}
						alt={item.data.title}
						className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
					/>
				</div>
				<div className="p-4 flex-1 flex flex-col">
					<Heading
						level={3}
						className="text-lg mb-2 line-clamp-2 group-hover:text-[#1e3b32] transition-colors font-heading"
						style={{ fontFamily: 'Playfair Display, serif' }}
					>
						{item.data.title}
					</Heading>
					{item.type === 'journey' && (
						<>
							<Text className="text-sm text-gray-600 mb-2">
								{item.data.duration as string} • ¥{item.data.price as number}
							</Text>
							<Text className="text-sm text-[#24332d] font-semibold mt-auto">
								View Journey →
							</Text>
						</>
					)}
					{item.type === 'article' && (
						<>
							<Text className="text-sm text-gray-600 mb-2">
								{(item.data.readingTime as string) || '12 min read'}
							</Text>
							<Text className="text-sm text-[#24332d] font-semibold mt-auto">
								Read Article →
							</Text>
						</>
					)}
				</div>
			</div>
		</Link>
	);
}

export function ArticleDesktopSidebar({
	article,
	relatedArticles,
}: {
	article: SerializableArticle;
	relatedArticles: SerializableArticle[];
}) {
	const { sidebarItems, recommendedItems } = useSidebarItems(article, relatedArticles);
	if (sidebarItems.length === 0) return null;

	return (
		<aside className="hidden lg:block lg:w-80 lg:flex-shrink-0">
			<div className="sticky top-24">
				<Heading
					level={2}
					className="text-2xl font-heading mb-6"
					style={{ fontFamily: 'Playfair Display, serif' }}
				>
					{recommendedItems.length > 0 ? 'Recommend For You' : 'More in this category'}
				</Heading>
				<div className="space-y-4">
					{sidebarItems.map((item) => (
						<SidebarCard key={`${item.type}-${item.id}`} item={item} />
					))}
				</div>
			</div>
		</aside>
	);
}

export function ArticleMobileSidebar({
	article,
	relatedArticles,
}: {
	article: SerializableArticle;
	relatedArticles: SerializableArticle[];
}) {
	const { sidebarItems, recommendedItems } = useSidebarItems(article, relatedArticles);
	if (sidebarItems.length === 0) return null;

	return (
		<Section background="primary" padding="xl" className="lg:hidden">
			<Container size="xl">
				<Heading
					level={2}
					className="text-2xl font-heading mb-6"
					style={{ fontFamily: 'Playfair Display, serif' }}
				>
					{recommendedItems.length > 0 ? 'Recommend For You' : 'More in this category'}
				</Heading>
				<div className="overflow-x-auto scroll-smooth snap-x snap-mandatory -mx-4 px-4 pb-4">
					<div className="flex gap-4 w-max">
						{sidebarItems.map((item) => (
							<div key={`${item.type}-${item.id}`} className="snap-start w-[280px]">
								<SidebarCard item={item} />
							</div>
						))}
					</div>
				</div>
			</Container>
		</Section>
	);
}

/** @deprecated Use named exports ArticleShareButtons / ArticleDesktopSidebar / ArticleMobileSidebar */
export default function ClientArticlePage(props: ClientArticlePageProps) {
	return (
		<>
			<ArticleShareButtons />
			<ArticleDesktopSidebar article={props.article} relatedArticles={props.relatedArticles} />
			<ArticleMobileSidebar article={props.article} relatedArticles={props.relatedArticles} />
		</>
	);
}
