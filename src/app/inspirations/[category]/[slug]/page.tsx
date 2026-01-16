'use client';

import React, { useMemo } from 'react';
import Head from 'next/head';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Instagram, Youtube, Link as LinkIcon } from 'lucide-react';
import { Section, Container, Heading, Text, Breadcrumb } from '@/components/common';
import { useArticleManagement } from '@/context/ArticleManagementContext';
import { ArticleCategoryToHeroImage, ArticleSlugToCategory, ArticleCategoryToSlug, ContentBlock } from '@/types/article';
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
  const { getArticleBySlug } = useArticleManagement();
  const { journeys } = useJourneyManagement();

  const article = getArticleBySlug(slug || '');
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

  // 调试信息：获取所有文章用于诊断
  const { articles } = useArticleManagement();
  
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
        return (
          <div
            className="prose prose-lg prose-slate max-w-none w-full prose-force-wrap prose-headings:font-serif prose-headings:text-[#111] prose-p:font-sans prose-p:text-[#333] prose-p:leading-[1.8] prose-img:rounded-sm prose-img:w-full mb-6"
            dangerouslySetInnerHTML={{ __html: block.text }}
          />
        );

      case 'image':
        if (!block.imageSrc) return null;
        const isFullBleed = block.imageWidth === 'full-bleed';
        return (
          <div className={`mb-8 ${isFullBleed ? 'w-full -mx-4 md:-mx-8 lg:-mx-16' : 'max-w-prose mx-auto'}`}>
            <img
              src={block.imageSrc}
              alt={block.caption || ''}
              className={`w-full ${isFullBleed ? 'object-cover' : 'object-contain'} rounded-lg`}
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
                dangerouslySetInnerHTML={{ __html: block.text }}
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
                  <Text className="text-sm text-[#1e3b32] underline">查看行程 →</Text>
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
    <main>
      <Head>
        <title>{safeArticle.pageTitle || safeArticle.title}</title>
        {safeArticle.metaDescription && <meta name="description" content={safeArticle.metaDescription} />}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* 统一容器：标题和正文使用相同的 max-w-4xl 约束，左对齐 */}
          <div className="max-w-4xl mx-0 mb-8 min-w-0 w-full">
            <Text className="text-sm text-gray-600 mb-4 uppercase tracking-widest font-sans">
              {readingTime}
            </Text>
            <Heading 
              level={1} 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading text-[#111] leading-tight min-w-0 break-words"
              style={{ 
                fontFamily: 'Playfair Display, serif',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto'
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
                <button onClick={() => window.open('https://www.youtube.com/', '_blank')} className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                  <Youtube className="w-4 h-4" />
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

      {/* Content Stream */}
      <Section background="secondary" padding="xl" className="overflow-hidden flex flex-col">
        {/* 使用与标题相同的 max-w 约束，确保对齐 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* 直接使用 max-w-4xl 匹配标题宽度，左对齐 */}
          <div className="max-w-4xl mx-0 w-full">
            <article className="w-full min-w-0 overflow-x-hidden">
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
                    <div dangerouslySetInnerHTML={{ __html: safeArticle.content as string }} />
                  )
                )}
              </div>
            </article>
          </div>
        </div>
      </Section>

      {/* Related Journeys */}
      {related.length > 0 && (
        <Section background="secondary" padding="xl">
          <Container size="xl">
            <Heading level={2} className="text-3xl font-heading mb-8 text-center" style={{ fontFamily: 'Playfair Display, serif' }}>
              Related Journeys
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {related.map(j => (
                <Link key={j.id} href={`/journeys/${j.slug}`} className="group">
                  <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    <img src={j.image} alt={j.title} className="w-full h-48 object-cover" />
                    <div className="p-4">
                      <Heading level={3} className="text-lg mb-1 group-hover:text-[#1e3b32] transition-colors">
                        {j.title}
                      </Heading>
                      <Text className="text-sm text-gray-600 mb-2">{j.duration} • ¥{j.price}</Text>
                      <Text className="text-sm text-[#1e3b32] underline">查看行程 →</Text>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </main>
  );
}
