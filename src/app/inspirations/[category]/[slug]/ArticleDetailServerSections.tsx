import type { ReactNode } from 'react';
import { Breadcrumb, Heading, Section, Text } from '@/components/common';
import ArticleBodyContent from '@/components/articles/ArticleBodyContent';
import {
	getCanonicalCategoryForArticle,
	getCanonicalCategorySlug,
} from '@/lib/articleCategories';
import { ArticleCategoryToHeroImage, type Article, type ArticleCategory } from '@/types/article';

interface ArticleDetailServerSectionsProps {
	article: Article;
	categorySlug: string;
	shareSlot: ReactNode;
	sidebarSlot: ReactNode;
	mobileSidebarSlot: ReactNode;
}

function buildToc(article: Article) {
	if (!article.contentBlocks?.length) return [];
	return article.contentBlocks
		.filter((block) => block.type === 'heading' && block.text && block.level)
		.map((block) => ({
			id: `heading-${block.id}`,
			text: block.text!.replace(/<[^>]+>/g, ''),
			level: block.level!,
		}));
}

export default function ArticleDetailServerSections({
	article,
	categorySlug,
	shareSlot,
	sidebarSlot,
	mobileSidebarSlot,
}: ArticleDetailServerSectionsProps) {
	const category = article.category as ArticleCategory;
	const canonicalCategory = getCanonicalCategoryForArticle(article);
	const hero =
		article.heroImage ||
		article.coverImage ||
		ArticleCategoryToHeroImage[category] ||
		ArticleCategoryToHeroImage[canonicalCategory];
	const readingTime = article.readingTime || '12 min read';
	const toc = buildToc(article);

	const faqList = (article.faqs || [])
		.map((f) => ({
			question: (f.question || '').trim(),
			answer: (f.answer || '').trim(),
		}))
		.filter((f) => f.question && f.answer);

	const faqJsonLd = faqList.length
		? {
				'@context': 'https://schema.org',
				'@type': 'FAQPage',
				mainEntity: faqList.map((f) => ({
					'@type': 'Question',
					name: f.question,
					acceptedAnswer: {
						'@type': 'Answer',
						text: f.answer,
					},
				})),
			}
		: null;

	return (
		<main className="overflow-x-hidden w-full max-w-full">
			{faqJsonLd && (
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
				/>
			)}
			<style>{`
          .article-body,
          .article-body * {
            word-break: normal !important;
            overflow-wrap: break-word !important;
            hyphens: none !important;
          }
          .article-body h1,
          .article-body h2,
          .article-body h3,
          .article-body h4,
          .article-body h5,
          .article-body h6,
          .article-body p {
            word-break: normal !important;
            overflow-wrap: break-word !important;
            hyphens: none !important;
          }
          .article-body p,
          .article-body div,
          .article-body span {
            word-break: normal !important;
            overflow-wrap: break-word !important;
            hyphens: none !important;
            line-break: strict;
          }
          .article-body .prose p,
          .article-body p {
            word-break: keep-all !important;
            word-wrap: normal !important;
            overflow-wrap: break-word !important;
            hyphens: none !important;
            -webkit-hyphens: none !important;
            font-feature-settings: "liga" 0, "clig" 0 !important;
          }
          .article-body p {
            line-break: anywhere;
          }
          .article-body a,
          .article-internal-link {
            color: #24332d !important;
            font-weight: 700 !important;
            text-decoration: none !important;
            transition: color 0.2s ease, text-decoration-color 0.2s ease;
          }
          .article-body a:hover,
          .article-internal-link:hover {
            text-decoration: underline !important;
            text-underline-offset: 2px;
            color: #2d4a3f !important;
          }
        `}</style>

			<Section
				background="primary"
				padding="none"
				className="relative h-[500px] overflow-hidden"
			>
				<div
					className="absolute inset-0 bg-cover bg-center bg-no-repeat"
					style={{ backgroundImage: `url('${hero}')` }}
					aria-hidden="true"
				/>
				<div className="absolute inset-0 bg-black/40" />
				<div className="relative z-10 h-full flex items-end">
					<div className="p-8 w-full max-w-7xl mx-auto">
						<Breadcrumb
							items={[
								{ label: 'Home', href: '/' },
								{ label: 'Inspirations', href: '/inspirations' },
								{
									label: canonicalCategory,
									href: `/inspirations/${categorySlug || getCanonicalCategorySlug(canonicalCategory)}`,
								},
							]}
							color="#FFFFFF"
							sizeClassName="text-lg md:text-xl"
						/>
					</div>
				</div>
			</Section>

			<Section background="secondary" padding="xl" className="pt-12 pb-8 flex flex-col">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 w-full min-w-0">
					<div className="max-w-4xl mx-0 mb-8 min-w-0 w-full max-w-full">
						<Text className="text-sm text-gray-600 mb-4 uppercase tracking-widest font-sans">
							{readingTime}
						</Text>
						<Heading
							level={1}
							className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading text-[#111] leading-tight min-w-0"
							style={{
								fontFamily: 'Playfair Display, serif',
								wordBreak: 'normal',
								overflowWrap: 'normal',
								hyphens: 'none',
							}}
						>
							{article.title}
						</Heading>
						{article.excerpt && (
							<p className="mt-6 text-lg text-gray-700 leading-relaxed font-sans max-w-3xl">
								{article.excerpt}
							</p>
						)}
					</div>

					<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 mb-8 border-t border-b border-gray-100 min-w-0">
						<div className="flex items-center gap-3 min-w-0">
							<Text className="text-xs text-gray-500 uppercase tracking-widest font-sans">
								Author
							</Text>
							<Text className="text-base font-semibold text-[#111] font-sans min-w-0">
								{article.author}
							</Text>
						</div>
						{shareSlot}
					</div>

					{toc.length > 0 && (
						<div className="max-w-4xl mx-0 min-w-0">
							<Text className="text-sm font-semibold uppercase tracking-widest mb-4 text-gray-700 font-sans">
								Contents
							</Text>
							<nav aria-label="Table of contents">
								<ol className="space-y-2.5 list-decimal list-outside ml-5">
									{toc.map((item) => (
										<li key={item.id} className={item.level === 1 ? '' : 'ml-4'}>
											<a
												href={`#${item.id}`}
												className="text-sm font-medium text-[#1e3b32] hover:text-[#c0a273] transition-colors font-sans"
											>
												{item.text}
											</a>
										</li>
									))}
								</ol>
							</nav>
						</div>
					)}
				</div>
			</Section>

			<Section background="secondary" padding="xl" className="w-full overflow-hidden">
				<div className="w-full max-w-screen-xl mx-auto">
					<div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
						<ArticleBodyContent article={article} />
						{sidebarSlot}
					</div>
				</div>
			</Section>

			{mobileSidebarSlot}
		</main>
	);
}
