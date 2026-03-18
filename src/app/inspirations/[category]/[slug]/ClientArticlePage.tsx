'use client';

import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Instagram, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { Section, Container, Heading, Text, Breadcrumb } from '@/components/common';
import { useArticleManagement } from '@/context/ArticleManagementContext';
import {
  ArticleCategoryToHeroImage,
  ArticleSlugToCategory,
  ArticleCategoryToSlug,
  ArticleCategoryToDisplayName,
  ContentBlock,
  RecommendedItem,
  ArticleCategory,
} from '@/types/article';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { getRenderableImageUrl } from '@/lib/imageUtils';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

// 辅助函数：生成推荐项的 href
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
  return `/inspirations/${ArticleCategoryToSlug[item.data.category]}/${item.data.slug}`;
}

export default function ClientArticlePage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params?.slug[0] : (params?.slug as string);
  const categorySlug = Array.isArray(params?.category) ? params?.category[0] : (params?.category as string);
  const category = ArticleSlugToCategory(categorySlug || '');
  const { getArticleBySlug, isLoading, articles } = useArticleManagement();
  const { journeys } = useJourneyManagement();

  const article = getArticleBySlug(slug || '');

  // 获取推荐项（支持混合 Journey 和 Article）
  const recommendedItems = useMemo(() => {
    if (!article) return [];

    const items: Array<
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
    > = [];

    if (article.recommendedItems && article.recommendedItems.length > 0) {
      article.recommendedItems.forEach((item: RecommendedItem) => {
        if (item.type === 'journey') {
          const journey = journeys.find((j) => j.id === item.id);
          if (journey) items.push({ type: 'journey', id: item.id, data: journey });
        } else if (item.type === 'article') {
          const articleItem = articles.find((a) => a.id === item.id && a.status === 'active');
          if (articleItem) items.push({ type: 'article', id: item.id, data: articleItem });
        }
      });
    } else {
      journeys
        .filter((j) => article.relatedJourneyIds.includes(j.id))
        .forEach((j) => items.push({ type: 'journey', id: j.id, data: j }));
    }

    return items;
  }, [journeys, articles, article]);

  const toc = useMemo(() => {
    if (!article?.contentBlocks) return [];
    const items: TOCItem[] = [];
    article.contentBlocks.forEach((block) => {
      if (block.type === 'heading' && block.text && block.level) {
        const id = `heading-${block.id}`;
        items.push({
          id,
          text: block.text.replace(/<[^>]+>/g, ''),
          level: block.level,
        });
      }
    });
    return items;
  }, [article]);

  const cleanContent = (content: string | undefined): string => {
    if (!content) return '';
    return content.replace(/&shy;|\u00AD/g, '');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3b32] mb-4" />
          <Text className="text-lg text-gray-600">加载中...</Text>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          <Text className="text-lg mb-2">分类不存在</Text>
          <Text className="text-sm text-gray-600">Category slug: {categorySlug}</Text>
          <Text className="text-sm text-gray-600 mt-4">可用的分类 slug：</Text>
          <ul className="text-sm text-gray-600 mt-2 list-disc list-inside text-left">
            <li>food-journey</li>
            <li>the-western-corridor</li>
            <li>ancient-chinese-culture</li>
            <li>spiritual-retreat</li>
            <li>vibrant-nightscapes</li>
            <li>seasonal-highlights</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!article) {
    const matchingSlug = articles.filter((a) => a.slug === slug);
    const matchingCategory = articles.filter((a) => a.category === category);
    const similarSlugs = articles.filter(
      (a) =>
        a.slug.toLowerCase().includes(slug.toLowerCase()) ||
        slug.toLowerCase().includes(a.slug.toLowerCase())
    );

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          <Text className="text-lg mb-2">文章不存在</Text>
          <Text className="text-sm text-gray-600">
            查找的 Slug: <strong>{slug}</strong>
          </Text>
          <Text className="text-sm text-gray-600">
            分类: <strong>{category}</strong>
          </Text>
          <Text className="text-sm text-gray-600 mt-4">诊断信息：</Text>
          <div className="text-sm text-gray-600 mt-2 text-left space-y-1">
            <p>• 总文章数: {articles.length}</p>
            <p>• 匹配该 slug 的文章数: {matchingSlug.length}</p>
            <p>• 匹配该分类的文章数: {matchingCategory.length}</p>
            {similarSlugs.length > 0 && (
              <div className="mt-2 p-2 bg-yellow-50 rounded">
                <p className="font-semibold">找到相似的 slug：</p>
                {similarSlugs.map((a) => (
                  <p key={a.id}>
                    - {a.title}{' '}
                    <span className="bg-gray-100 px-1">{a.slug}</span> ({a.category},{' '}
                    {a.status})
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (article.category !== category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          <Text className="text-lg mb-2">分类不匹配</Text>
          <Text className="text-sm text-gray-600">
            文章分类: <strong>{article.category}</strong>
          </Text>
          <Text className="text-sm text-gray-600">
            URL 分类: <strong>{category}</strong>
          </Text>
          <Text className="text-sm text-gray-600 mt-4">正确的 URL 应该是：</Text>
          <Text className="text-sm text-blue-600 mt-2">
            /inspirations/{ArticleCategoryToSlug[article.category]}/{article.slug}
          </Text>
        </div>
      </div>
    );
  }

  const safeArticle = article;
  const hero =
    safeArticle.heroImage ||
    safeArticle.coverImage ||
    ArticleCategoryToHeroImage[category];
  const readingTime = safeArticle.readingTime || '12 min read';
  const contentBlocks = safeArticle.contentBlocks || [];

  const renderContentBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case 'heading': {
        if (!block.text || !block.level) return null;
        const headingId = `heading-${block.id}`;
        const isH2 = block.level === 2;
        const headingProps = {
          id: headingId,
          className: `font-heading text-[#111] mb-6 ${
            isH2 ? 'mt-12' : block.level === 1 ? 'mt-0' : 'mt-8'
          } first:mt-0 ${
            block.level === 1
              ? 'text-4xl md:text-5xl'
              : block.level === 2
              ? 'text-3xl md:text-4xl'
              : block.level === 3
              ? 'text-2xl md:text-3xl'
              : 'text-xl md:text-2xl'
          }`,
          style: {
            fontFamily: 'Playfair Display, serif',
            scrollMarginTop: '80px',
          } as React.CSSProperties,
        };

        const plainText = block.text.replace(/<[^>]+>/g, '');
        if (block.level === 1) return <h1 {...headingProps}>{plainText}</h1>;
        if (block.level === 2) return <h2 {...headingProps}>{plainText}</h2>;
        if (block.level === 3) return <h3 {...headingProps}>{plainText}</h3>;
        if (block.level === 4) return <h4 {...headingProps}>{plainText}</h4>;
        if (block.level === 5) return <h5 {...headingProps}>{plainText}</h5>;
        return <h6 {...headingProps}>{plainText}</h6>;
      }

      case 'paragraph': {
        if (!block.text) return null;
        const processedText = cleanContent(block.text).replace(
          /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi,
          (match, attrs, href) => {
            if (
              href.startsWith('/journeys/') ||
              href.startsWith('/inspirations/')
            ) {
              return `<a ${attrs} class="article-internal-link" style="color: #24332d; font-weight: 600; text-decoration: none;">`;
            }
            return match;
          }
        );
        return (
          <div
            className="prose prose-lg prose-slate max-w-none w-full prose-force-wrap prose-headings:font-serif prose-headings:text-[#111] prose-p:font-sans prose-p:text-[#333] prose-p:leading-[1.8] prose-img:rounded-sm prose-img:w-full mb-6"
            dangerouslySetInnerHTML={{ __html: processedText }}
          />
        );
      }

      case 'image': {
        if (!block.imageSrc) return null;
        const isFullBleed = block.imageWidth === 'full-bleed';
        return (
          <div
            className={`mb-8 ${
              isFullBleed
                ? 'w-full -mx-4 md:-mx-8 lg:-mx-16 max-w-full overflow-hidden'
                : 'max-w-prose mx-auto w-full'
            }`}
          >
            <img
              src={block.imageSrc}
              alt={block.caption || ''}
              className={`w-full max-w-full h-auto ${
                isFullBleed ? 'object-cover' : 'object-contain'
              } rounded-lg`}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            {block.caption && (
              <p
                className="text-sm text-gray-600 mt-2 text-center italic"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {block.caption}
              </p>
            )}
          </div>
        );
      }

      case 'callout': {
        const highlightColor = block.highlightColor || '#c0a273';
        return (
          <div
            className="my-8 p-6 border-l-4 rounded w-full"
            style={{
              borderLeftColor: highlightColor,
              backgroundColor: `${highlightColor}15`,
            }}
          >
            {block.monthTag && (
              <div
                className="text-sm uppercase tracking-widest mb-2 font-semibold"
                style={{
                  color: highlightColor,
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                {block.monthTag}
              </div>
            )}
            {block.text && (
              <div
                className="prose prose-base prose-slate max-w-none w-full prose-force-wrap prose-headings:font-serif prose-headings:text-[#111] prose-p:font-sans prose-p:text-[#333] prose-p:leading-[1.8] prose-img:rounded-sm prose-img:w-full"
                dangerouslySetInnerHTML={{ __html: cleanContent(block.text) }}
              />
            )}
          </div>
        );
      }

      case 'trip_cta': {
        if (!block.journeyId) return null;
        const journey = journeys.find((j) => j.id === block.journeyId);
        if (!journey) return null;
        return (
          <div className="my-12 p-8 bg-[#f5f1e6] rounded-lg border border-[#1e3b32]/10">
            <Heading
              level={3}
              className="text-2xl mb-4"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {block.ctaText || 'Trip Inspiration'}
            </Heading>
            <Link href={`/journeys/${journey.slug}`} className="block group">
              <div className="flex flex-col md:flex-row gap-4">
                <img
                  src={getRenderableImageUrl(journey.image)}
                  alt={journey.title}
                  className="w-full md:w-48 h-48 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <Heading
                    level={4}
                    className="text-xl mb-2 group-hover:text-[#1e3b32] transition-colors"
                  >
                    {journey.title}
                  </Heading>
                  <Text className="text-gray-600 mb-2">
                    {journey.duration} • ¥{journey.price}
                  </Text>
                  <Text className="text-sm text-[#1e3b32] underline">
                    View Journey →
                  </Text>
                </div>
              </div>
            </Link>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const siteUrl = 'https://www.korascale.com';
  const PERSON_TAGS = ['Lewis Hamilton', 'Max Verstappen', 'George Russell'];
  const PLACE_TAGS = ['Jiuzhaigou', 'Shanghai', 'Chengdu'];

  const tagList = safeArticle?.tags ?? [];
  const about = tagList.map((name) => {
    const trimmed = (name ?? '').trim();
    if (!trimmed) return null;
    if (PERSON_TAGS.includes(trimmed)) return { '@type': 'Person' as const, name: trimmed };
    if (PLACE_TAGS.includes(trimmed)) return { '@type': 'Place' as const, name: trimmed };
    return { '@type': 'Thing' as const, name: trimmed };
  }).filter(Boolean) as Array<{ '@type': 'Person' | 'Place' | 'Thing'; name: string }>;

  const articleImage = safeArticle.heroImage || safeArticle.coverImage || '';
  const articleImageUrl = articleImage.startsWith('http') ? articleImage : `${siteUrl}${articleImage.startsWith('/') ? '' : '/'}${articleImage}`;
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: safeArticle.title,
    image: articleImage ? [articleImageUrl] : undefined,
    datePublished: safeArticle.createdAt ? (typeof safeArticle.createdAt === 'string' ? safeArticle.createdAt : new Date(safeArticle.createdAt).toISOString()) : undefined,
    author: {
      '@type': 'Person',
      name: safeArticle.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Korascale',
      url: siteUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/inspirations/${categorySlug}/${safeArticle.slug}`,
    },
    ...(about.length > 0 ? { about } : {}),
  };

  const faqList = (safeArticle.faqs || [])
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <Head>
        <title>{safeArticle.pageTitle || safeArticle.title}</title>
        {safeArticle.metaDescription && (
          <meta name="description" content={safeArticle.metaDescription} />
        )}
        <style>{`
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
      </Head>

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
                { label: ArticleCategoryToDisplayName[category] },
              ]}
              color="#FFFFFF"
              sizeClassName="text-lg md:text-xl"
            />
          </div>
        </div>
      </Section>

      <Section
        background="secondary"
        padding="xl"
        className="pt-12 pb-8 flex flex-col"
      >
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
              {safeArticle.title}
            </Heading>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 mb-8 border-t border-b border-gray-100 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <Text className="text-xs text-gray-500 uppercase tracking-widest font-sans">
                Author
              </Text>
              <Text className="text-base font-semibold text-[#111] font-sans min-w-0">
                {safeArticle.author}
              </Text>
            </div>

            <div className="flex items-center gap-4 min-w-0">
              <Text className="text-xs text-gray-500 uppercase tracking-widest font-sans">
                Share
              </Text>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    window.open('https://www.instagram.com/', '_blank')
                  }
                  className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(
                        window.location.href
                      )}`,
                      '_blank'
                    )
                  }
                  className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('链接已复制');
                  }}
                  className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {toc.length > 0 && (
            <div className="max-w-4xl mx-0 min-w-0">
              <Text className="text-sm font-semibold uppercase tracking-widest mb-4 text-gray-700 font-sans">
                Contents
              </Text>
              <nav>
                <ol className="space-y-2.5 list-decimal list-outside ml-5">
                  {toc.map((item) => (
                    <li
                      key={item.id}
                      className={item.level === 1 ? '' : 'ml-4'}
                    >
                      <a
                        href={`#${item.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const element = document.getElementById(item.id);
                          if (element) {
                            const offset = 80;
                            window.scrollTo({
                              top:
                                element.getBoundingClientRect().top +
                                window.pageYOffset -
                                offset,
                              behavior: 'smooth',
                            });
                          }
                        }}
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

      <Section
        background="secondary"
        padding="xl"
        className="w-full overflow-hidden"
      >
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <article className="flex-1 min-w-0 prose-force-wrap w-full lg:max-w-4xl article-body">
              <div className="prose prose-lg prose-slate w-full max-w-none prose-force-wrap prose-headings:font-serif prose-headings:text-[#111] prose-p:font-sans prose-p:text-[#333] prose-p:leading-[1.8]">
                {contentBlocks.length > 0 ? (
                  contentBlocks.map((block, index) => (
                    <React.Fragment key={block.id || index}>
                      {renderContentBlock(block, index)}
                    </React.Fragment>
                  ))
                ) : (
                  safeArticle.content && (
                    <div
                      className="article-body"
                      dangerouslySetInnerHTML={{
                        __html: cleanContent(safeArticle.content),
                      }}
                    />
                  )
                )}
              </div>
              {tagList.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {tagList.map((tag) => {
                      const label = (tag ?? '').trim();
                      if (!label) return null;
                      return (
                        <span
                          key={label}
                          className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-700 font-sans"
                          role="listitem"
                          data-tag={label}
                          /* 预留：未来可改为 Link 跳转到 /inspirations?tag=... 或分类页 */
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {faqList.length > 0 && (
                <div className="mt-10 pt-6 border-t border-gray-100">
                  <Heading level={3} className="text-xl font-heading mb-4">
                    Frequently Asked Questions
                  </Heading>
                  <div className="space-y-3">
                    {faqList.map((f, index) => (
                      <details
                        key={`${f.question}-${index}`}
                        className="group border border-gray-200 rounded-lg px-4 py-3 bg-white"
                      >
                        <summary className="flex items-center justify-between cursor-pointer list-none">
                          <h3 className="text-sm md:text-base font-semibold text-gray-900">
                            {f.question}
                          </h3>
                          <span className="ml-3 text-gray-400 group-open:rotate-180 transition-transform">
                            ˅
                          </span>
                        </summary>
                        <div className="mt-2 text-sm text-gray-700 leading-relaxed">
                          {f.answer}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {recommendedItems.length > 0 && (
              <aside className="hidden lg:block lg:w-80 lg:flex-shrink-0">
                <div className="sticky top-24">
                  <Heading
                    level={2}
                    className="text-2xl font-heading mb-6"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    Recommend For You
                  </Heading>
                  <div className="space-y-4">
                    {recommendedItems.map((item) => (
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
                                  {item.data.duration} • ¥{item.data.price}
                                </Text>
                                <Text className="text-sm text-[#24332d] font-semibold mt-auto">
                                  View Journey →
                                </Text>
                              </>
                            )}
                            {item.type === 'article' && (
                              <>
                                <Text className="text-sm text-gray-600 mb-2">
                                  {item.data.readingTime || '12 min read'}
                                </Text>
                                <Text className="text-sm text-[#24332d] font-semibold mt-auto">
                                  Read Article →
                                </Text>
                              </>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </Section>

      {recommendedItems.length > 0 && (
        <Section background="primary" padding="xl" className="lg:hidden">
          <Container size="xl">
            <Heading
              level={2}
              className="text-2xl font-heading mb-6"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Recommend For You
            </Heading>
            <div className="overflow-x-auto scroll-smooth snap-x snap-mandatory -mx-4 px-4 pb-4">
              <div className="flex gap-4 w-max">
                {recommendedItems.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={getRecommendedItemHref(item)}
                    className="group block snap-start"
                  >
                    <div className="bg-white border border-[#d1d5db] rounded-lg overflow-hidden hover:shadow-md transition-shadow w-[280px] h-full flex flex-col">
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
                              {item.data.duration} • ¥{item.data.price}
                            </Text>
                            <Text className="text-sm text-[#24332d] font-semibold mt-auto">
                              View Journey →
                            </Text>
                          </>
                        )}
                        {item.type === 'article' && (
                          <>
                            <Text className="text-sm text-gray-600 mb-2">
                              {item.data.readingTime || '12 min read'}
                            </Text>
                            <Text className="text-sm text-[#24332d] font-semibold mt-auto">
                              Read Article →
                            </Text>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        </Section>
      )}
    </main>
  );
}

