'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Section, Container, Heading, Text } from '@/components/common';
import { useArticleManagement } from '@/context/ArticleManagementContext';
import { ArticleCategoryToHeroImage, ArticleSlugToCategory, ArticleCategoryToSlug } from '@/types/article';
import { ArticleCard } from '@/components/cards/ArticleCard';

export default function InspirationCategoryPage() {
  const params = useParams();
  const { articles, isLoading } = useArticleManagement();
  const slug = Array.isArray(params?.category) ? params?.category[0] : (params?.category as string);
  const category = ArticleSlugToCategory(slug || '');
  const list = useMemo(() => {
    if (!category) return [];
    const filtered = articles.filter(a => a.category === category && a.status === 'active');
    // 调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('Category Page Debug:', {
        categorySlug: slug,
        category,
        totalArticles: articles.length,
        activeArticles: articles.filter(a => a.status === 'active').length,
        categoryArticles: articles.filter(a => a.category === category).length,
        filteredArticles: filtered.length,
        allArticles: articles.map(a => ({ id: a.id, title: a.title, category: a.category, status: a.status, slug: a.slug }))
      });
    }
    return filtered;
  }, [articles, category, slug]);
  const hero = category ? ArticleCategoryToHeroImage[category] : '';

  return (
    <main>
      <Section background="primary" padding="none" className="relative h-[520px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${hero}')` }} />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <Heading 
            level={1} 
            className="text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight" 
            style={{ 
              fontFamily: 'Montserrat, sans-serif',
              color: '#FFFFFF'
            }}
          >
            {category || 'Unknown Category'}
          </Heading>
        </div>
      </Section>

      <Section background="secondary" padding="xl">
        <Container size="xl">
          {isLoading ? (
            <div className="text-center py-10">
              <Text className="text-gray-600">加载中...</Text>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {list.map(a => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
              {list.length === 0 && (
                <div className="col-span-full text-center py-10">
                  <Text className="text-gray-600 mb-2">暂无文章</Text>
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-gray-500 mt-4 space-y-1">
                      <p>调试信息：</p>
                      <p>分类: {category || '未识别'}</p>
                      <p>分类 Slug: {slug}</p>
                      <p>总文章数: {articles.length}</p>
                      <p>Active 文章数: {articles.filter(a => a.status === 'active').length}</p>
                      <p>该分类文章数: {articles.filter(a => a.category === category).length}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </Container>
      </Section>
    </main>
  );
}


