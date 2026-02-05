'use client';

import React, { useMemo } from 'react';
import Head from 'next/head';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Instagram, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { Section, Container, Heading, Text, Breadcrumb } from '@/components/common';
import { useArticleManagement } from '@/context/ArticleManagementContext';
import { ArticleCategoryToHeroImage, ArticleSlugToCategory, ArticleCategoryToSlug, ContentBlock, RecommendedItem } from '@/types/article';
import { useJourneyManagement } from '@/context/JourneyManagementContext';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export default function ArticleDetailPage() {
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
    
    // 优先使用 recommendedItems，如果没有则使用 relatedJourneyIds（向后兼容）
    const items: Array<{ type: 'journey' | 'article'; id: string; data: any }> = [];
    
    if (article.recommendedItems && article.recommendedItems.length > 0) {
      article.recommendedItems.forEach((item: RecommendedItem) => {
        if (item.type === 'journey') {
          const journey = journeys.find(j => j.id === item.id);
          if (journey) items.push({ type: 'journey', id: item.id, data: journey });
        } else if (item.type === 'article') {
          const articleItem = articles.find(a => a.id === item.id && a.status === 'active');
          if (articleItem) items.push({ type: 'article', id: item.id, data: articleItem });
        }
      });
    } else {
      // 向后兼容：使用 relatedJourneyIds
      journeys
        .filter(j => article.relatedJourneyIds.includes(j.id))
        .forEach(j => items.push({ type: 'journey', id: j.id, data: j }));
    }
    
    return items;
  }, [journeys, articles, article]);
  
  // 向后兼容：保留 related 变量
  const related = useMemo(() => {
    if (!article) return [];
    return journeys.filter(j => article.relatedJourneyIds.includes(j.id));
  }, [journeys, article]);

  // Generate TOC from contentBlocks
  const toc = useMemo(() => {
    if (!article?.contentBlocks) return [];
    const items: TOCItem[] = [];
    article.contentBlocks.forEach((block) => {
      if (block.type === 'heading' && block.text && block.level) {
        const id = `heading-${block.id}`;
        items.push({
          id,
          text: block.text.replace(/<[^>]+>/g, ''), // Strip HTML tags
          level: block.level
        });
      }
    });
    return items;
  }, [article]);

  // 清理软换行字符（&shy; 和 \u00AD）
  const cleanContent = (content: string | undefined): string => {
    if (!content) return '';
    return content.replace(/&shy;|\u00AD/g, '');
  };
  
  // 显示加载状态，避免闪烁
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e3b32] mb-4"></div>
          <Text className="text-lg text-gray-600">加载中...</Text>
        </div>
      </div>
    );
  }
  
  // 调试信息：检查文章是否存在
  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          <Text className="text-lg mb-2">分类不存在</Text>
          <Text className="text-sm text-gray-600">Category slug: {categorySlug}</Text>
          <Text className="text-sm text-gray-600 mt-4">可用的分类 slug：</Text>
          <ul className="text-sm text-gray-600 mt-2 list-disc list-inside text-left">
            <li>food-journey</li>
            <li>great-outdoors</li>
            <li>immersive-encounters</li>
            <li>spiritual-retreat</li>
            <li>vibrant-nightscapes</li>
            <li>seasonal-highlights</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!article) {
    // 查找所有匹配 slug 的文章（用于调试）
    const matchingSlug = articles.filter(a => a.slug === slug);
    const matchingCategory = articles.filter(a => a.category === category);
    // 查找相似的 slug（可能只是大小写或空格问题）
    const similarSlugs = articles.filter(a => 
      a.slug.toLowerCase().includes(slug.toLowerCase()) || 
      slug.toLowerCase().includes(a.slug.toLowerCase())
    );
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          <Text className="text-lg mb-2">文章不存在</Text>
          <Text className="text-sm text-gray-600">查找的 Slug: <strong>{slug}</strong></Text>
          <Text className="text-sm text-gray-600">分类: <strong>{category}</strong></Text>
          <Text className="text-sm text-gray-600 mt-4">诊断信息：</Text>
          <div className="text-sm text-gray-600 mt-2 text-left space-y-1">
            <p>• 总文章数: {articles.length}</p>
            <p>• 匹配该 slug 的文章数: {matchingSlug.length}</p>
            <p>• 匹配该分类的文章数: {matchingCategory.length}</p>
            {similarSlugs.length > 0 && (
              <div className="mt-2 p-2 bg-yellow-50 rounded">
                <p className="font-semibold">找到相似的 slug：</p>
                {similarSlugs.map(a => (
                  <p key={a.id}>- {a.title} (slug: <code className="bg-gray-100 px-1">{a.slug}</code>, 分类: {a.category}, 状态: {a.status})</p>
                ))}
              </div>
            )}
            {matchingSlug.length > 0 && (
              <div className="mt-2 p-2 bg-yellow-50 rounded">
                <p className="font-semibold">找到相同 slug 的文章：</p>
                {matchingSlug.map(a => (
                  <p key={a.id}>- {a.title} (分类: {a.category}, 状态: {a.status})</p>
                ))}
              </div>
            )}
            {matchingCategory.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <p className="font-semibold">该分类下的所有文章：</p>
                {matchingCategory.slice(0, 10).map(a => (
                  <p key={a.id}>- {a.title} (slug: <code className="bg-gray-100 px-1">{a.slug}</code>, 状态: {a.status})</p>
                ))}
                {matchingCategory.length > 10 && <p>... 还有 {matchingCategory.length - 10} 篇文章</p>}
              </div>
            )}
            {articles.length > 0 && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <p className="font-semibold">所有文章的 slug 列表：</p>
                {articles.slice(0, 20).map(a => (
                  <p key={a.id} className="text-xs">- <code className="bg-gray-100 px-1">{a.slug}</code> ({a.title})</p>
                ))}
                {articles.length > 20 && <p className="text-xs">... 还有 {articles.length - 20} 篇文章</p>}
              </div>
            )}
          </div>
          <Text className="text-sm text-gray-600 mt-4">请检查：</Text>
          <ul className="text-sm text-gray-600 mt-2 list-disc list-inside text-left">
            <li>文章是否已保存到 localStorage（当前有 {articles.length} 篇文章）</li>
            <li>Slug 是否完全匹配（当前查找: <code className="bg-gray-100 px-1">{slug}</code>）</li>
            <li>文章状态是否为 'active'</li>
            <li>文章分类是否匹配（当前分类: {category}）</li>
          </ul>
        </div>
      </div>
    );
  }

  if (article.category !== category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-2xl px-4">
          <Text className="text-lg mb-2">分类不匹配</Text>
          <Text className="text-sm text-gray-600">文章分类: <strong>{article.category}</strong></Text>
          <Text className="text-sm text-gray-600">URL 分类: <strong>{category}</strong></Text>
          <Text className="text-sm text-gray-600 mt-4">正确的 URL 应该是：</Text>
          <Text className="text-sm text-blue-600 mt-2">
            /inspirations/{ArticleCategoryToSlug[article.category]}/{article.slug}
          </Text>
        </div>
      </div>
    );
  }

  // TypeScript guard: article is guaranteed to be defined after the check above
  const safeArticle = article;
  const hero = safeArticle.heroImage || ArticleCategoryToHeroImage[category];
  const readingTime = safeArticle.readingTime || '12 min read';
  const contentBlocks = safeArticle.contentBlocks || [];

  // Render content block
  const renderContentBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case 'heading':
        if (!block.text || !block.level) return null;
        const headingId = `heading-${block.id}`;
        // H2 使用特殊的样式和间距
        const isH2 = block.level === 2;
        const headingProps = {
          id: headingId,
          className: `font-heading text-[#111] mb-6 ${
            isH2 ? 'mt-12' : block.level === 1 ? 'mt-0' : 'mt-8'
          } first:mt-0 ${
            block.level === 1 ? 'text-4xl md:text-5xl' :
            block.level === 2 ? 'text-3xl md:text-4xl' :
            block.level === 3 ? 'text-2xl md:text-3xl' :
            'text-xl md:text-2xl'
          }`,
          style: { 
            fontFamily: 'Playfair Display, serif',
            scrollMarginTop: '80px' // 为平滑滚动添加偏移
          } as React.CSSProperties
        };
        
        if (block.level === 1) {
          return <h1 {...headingProps}>{block.text.replace(/<[^>]+>/g, '')}</h1>;
        } else if (block.level === 2) {
          return <h2 {...headingProps}>{block.text.replace(/<[^>]+>/g, '')}</h2>;
        } else if (block.level === 3) {
          return <h3 {...headingProps}>{block.text.replace(/<[^>]+>/g, '')}</h3>;
        } else if (block.level === 4) {
          return <h4 {...headingProps}>{block.text.replace(/<[^>]+>/g, '')}</h4>;
        } else if (block.level === 5) {
          return <h5 {...headingProps}>{block.text.replace(/<[^>]+>/g, '')}</h5>;
        } else {
          return <h6 {...headingProps}>{block.text.replace(/<[^>]+>/g, '')}</h6>;
        }

      case 'paragraph':
        if (!block.text) return null;
        // 处理内链样式
        const processedText = cleanContent(block.text)
          .replace(/<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi, (match, attrs, href) => {
            // 检查是否是内部链接（以 /journeys/ 或 /inspirations/ 开头）
            if (href.startsWith('/journeys/') || href.startsWith('/inspirations/')) {
              return `<a ${attrs} class="article-internal-link" style="color: #24332d; font-weight: 600; text-decoration: none;">`;
            }
            return match;
          });
        return (
          <div
            className="prose prose-lg prose-slate max-w-none w-full prose-force-wrap prose-headings:font-serif prose-headings:text-[#111] prose-p:font-sans prose-p:text-[#333] prose-p:leading-[1.8] prose-img:rounded-sm prose-img:w-full mb-6"
            dangerouslySetInnerHTML={{ __html: processedText }}
          />
        );

      case 'image':
        if (!block.imageSrc) return null;
        const isFullBleed = block.imageWidth === 'full-bleed';
        return (
          <div className={`mb-8 ${isFullBleed ? 'w-full -mx-4 md:-mx-8 lg:-mx-16 max-w-full overflow-hidden' : 'max-w-prose mx-auto w-full'}`}>
            <img
              src={block.imageSrc}
              alt={block.caption || ''}
              className={`w-full max-w-full h-auto ${isFullBleed ? 'object-cover' : 'object-contain'} rounded-lg`}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            {block.caption && (
              <p className="text-sm text-gray-600 mt-2 text-center italic" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {block.caption}
              </p>
            )}
          </div>
        );

      case 'callout':
        const highlightColor = block.highlightColor || '#c0a273';
        return (
          <div
            className="my-8 p-6 border-l-4 rounded w-full"
            style={{ borderLeftColor: highlightColor, backgroundColor: `${highlightColor}15` }}
          >
            {block.monthTag && (
              <div
                className="text-sm uppercase tracking-widest mb-2 font-semibold"
                style={{ color: highlightColor, fontFamily: 'Montserrat, sans-serif' }}
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

      case 'trip_cta':
        if (!block.journeyId) return null;
        const journey = journeys.find(j => j.id === block.journeyId);
        if (!journey) return null;
        return (
          <div className="my-12 p-8 bg-[#f5f1e6] rounded-lg border border-[#1e3b32]/10">
            <Heading level={3} className="text-2xl mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              {block.ctaText || 'Trip Inspiration'}
            </Heading>
            <Link
              href={`/journeys/${journey.slug}`}
              className="block group"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <img
                  src={journey.image}
                  alt={journey.title}
                  className="w-full md:w-48 h-48 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <Heading level={4} className="text-xl mb-2 group-hover:text-[#1e3b32] transition-colors">
                    {journey.title}
                  </Heading>
                  <Text className="text-gray-600 mb-2">{journey.duration} • ¥{journey.price}</Text>
                  <Text className="text-sm text-[#1e3b32] underline">View Journey →</Text>
                </div>
              </div>
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <main className="overflow-x-hidden w-full max-w-full">
      <Head>
        <title>{safeArticle.pageTitle || safeArticle.title}</title>
        {safeArticle.metaDescription && <meta name="description" content={safeArticle.metaDescription} />}
        <style>{`
          .article-internal-link {
            color: #24332d !important;
            font-weight: 600 !important;
            text-decoration: none !important;
          }
          .article-internal-link:hover {
            text-decoration: underline !important;
            color: #2d4a3f !important;
          }
        `}</style>
      </Head>

      {/* Hero Section */}
      <Section background="primary" padding="none" className="relative h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${hero}')` }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 h-full flex items-end">
          <div className="p-8 w-full max-w-7xl mx-auto">
            <Breadcrumb 
              items={[
                {label:'Home',href:'/'},
                {label:'Inspirations',href:'/inspirations'},
                {label:category}
              ]} 
              color="#FFFFFF" 
              sizeClassName="text-lg md:text-xl" 
            />
          </div>
        </div>
      </Section>

      {/* Article Header (Jacada Style) */}
      <Section background="secondary" padding="xl" className="pt-12 pb-8 flex flex-col">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full min-w-0">
          {/* 统一容器：标题和正文使用相同的 max-w-4xl 约束，左对齐 */}
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
                hyphens: 'none'
              }}
            >
              {safeArticle.title}
            </Heading>
          </div>

          {/* 第二行：作者与分享链接 - 并排显示 */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 mb-8 border-t border-b border-gray-100 min-w-0">
            {/* 作者信息 */}
            <div className="flex items-center gap-3 min-w-0">
              <Text className="text-xs text-gray-500 uppercase tracking-widest font-sans">Author</Text>
              <Text className="text-base font-semibold text-[#111] font-sans min-w-0">{safeArticle.author}</Text>
            </div>
            
            {/* 分享图标 */}
            <div className="flex items-center gap-4 min-w-0">
              <Text className="text-xs text-gray-500 uppercase tracking-widest font-sans">Share</Text>
              <div className="flex gap-3">
                <button onClick={() => window.open('https://www.instagram.com/', '_blank')} className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                  <Instagram className="w-4 h-4" />
                </button>
                <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank')} className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('链接已复制'); }} className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                  <LinkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 目录部分 - 使用相同的 max-w-4xl 约束 */}
          {toc.length > 0 && (
            <div className="max-w-4xl mx-0 min-w-0">
              <Text className="text-sm font-semibold uppercase tracking-widest mb-4 text-gray-700 font-sans">
                Contents
              </Text>
              <nav>
                <ol className="space-y-2.5 list-decimal list-outside ml-5">
                  {toc.map((item) => (
                    <li key={item.id} className={item.level === 1 ? '' : 'ml-4'}>
                      <a
                        href={`#${item.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const element = document.getElementById(item.id);
                          if (element) {
                            const offset = 80;
                            window.scrollTo({ top: element.getBoundingClientRect().top + window.pageYOffset - offset, behavior: 'smooth' });
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

      {/* Content Stream with Sidebar Layout */}
      <Section background="secondary" padding="xl" className="w-full overflow-hidden">
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Main Article Content */}
            <article className="flex-1 min-w-0 prose-force-wrap w-full lg:max-w-4xl">
              <div
                className="prose prose-lg prose-slate w-full max-w-none prose-force-wrap
                           prose-headings:font-serif prose-headings:text-[#111] 
                           prose-p:font-sans prose-p:text-[#333] prose-p:leading-[1.8]"
              >
                {contentBlocks.length > 0 ? (
                  contentBlocks.map((block, index) => (
                    <React.Fragment key={block.id || index}>
                      {renderContentBlock(block, index)}
                    </React.Fragment>
                  ))
                ) : (
                  safeArticle.content && (
                    <div dangerouslySetInnerHTML={{ __html: cleanContent(safeArticle.content) }} />
                  )
                )}
              </div>
            </article>

            {/* Recommendation Sidebar (Desktop) */}
            {recommendedItems.length > 0 && (
              <aside className="hidden lg:block lg:w-80 lg:flex-shrink-0">
                <div className="sticky top-24">
                  <Heading level={2} className="text-2xl font-heading mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Recommend For You
                  </Heading>
                  <div className="space-y-4">
                    {recommendedItems.map((item) => (
                      <Link
                        key={`${item.type}-${item.id}`}
                        href={item.type === 'journey' ? `/journeys/${item.data.slug}` : `/inspirations/${ArticleCategoryToSlug[item.data.category]}/${item.data.slug}`}
                        className="group block"
                      >
                        <div className="bg-white border border-[#d1d5db] rounded-lg overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                          <div className="aspect-video w-full overflow-hidden">
                            <img
                              src={item.type === 'journey' ? item.data.image : (item.data.coverImage || item.data.heroImage || '/images/default-article.jpg')}
                              alt={item.data.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="p-4 flex-1 flex flex-col">
                            <Heading level={3} className="text-lg mb-2 line-clamp-2 group-hover:text-[#1e3b32] transition-colors font-heading" style={{ fontFamily: 'Playfair Display, serif' }}>
                              {item.data.title}
                            </Heading>
                            {item.type === 'journey' && (
                              <>
                                <Text className="text-sm text-gray-600 mb-2">{item.data.duration} • ¥{item.data.price}</Text>
                                <Text className="text-sm text-[#24332d] font-semibold mt-auto">View Journey →</Text>
                              </>
                            )}
                            {item.type === 'article' && (
                              <>
                                <Text className="text-sm text-gray-600 mb-2">{item.data.readingTime || '12 min read'}</Text>
                                <Text className="text-sm text-[#24332d] font-semibold mt-auto">Read Article →</Text>
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

      {/* Recommendation Section (Mobile - Bottom with Horizontal Scroll) */}
      {recommendedItems.length > 0 && (
        <Section background="white" padding="xl" className="lg:hidden">
          <Container size="xl">
            <Heading level={2} className="text-2xl font-heading mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
              Recommend For You
            </Heading>
            <div className="overflow-x-auto scroll-smooth snap-x snap-mandatory -mx-4 px-4 pb-4">
              <div className="flex gap-4 w-max">
                {recommendedItems.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.type === 'journey' ? `/journeys/${item.data.slug}` : `/inspirations/${ArticleCategoryToSlug[item.data.category]}/${item.data.slug}`}
                    className="group block snap-start"
                  >
                    <div className="bg-white border border-[#d1d5db] rounded-lg overflow-hidden hover:shadow-md transition-shadow w-[280px] h-full flex flex-col">
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={item.type === 'journey' ? item.data.image : (item.data.coverImage || item.data.heroImage || '/images/default-article.jpg')}
                          alt={item.data.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <Heading level={3} className="text-lg mb-2 line-clamp-2 group-hover:text-[#1e3b32] transition-colors font-heading" style={{ fontFamily: 'Playfair Display, serif' }}>
                          {item.data.title}
                        </Heading>
                        {item.type === 'journey' && (
                          <>
                            <Text className="text-sm text-gray-600 mb-2">{item.data.duration} • ¥{item.data.price}</Text>
                            <Text className="text-sm text-[#24332d] font-semibold mt-auto">View Journey →</Text>
                          </>
                        )}
                        {item.type === 'article' && (
                          <>
                            <Text className="text-sm text-gray-600 mb-2">{item.data.readingTime || '12 min read'}</Text>
                            <Text className="text-sm text-[#24332d] font-semibold mt-auto">Read Article →</Text>
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
