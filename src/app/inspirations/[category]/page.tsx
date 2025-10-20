'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Section, Container, Heading, Text } from '@/components/common';
import { useArticleManagement } from '@/context/ArticleManagementContext';
import { ArticleCategoryToHeroImage, ArticleSlugToCategory, ArticleCategoryToSlug } from '@/types/article';
import { ArticleCard } from '@/components/cards/ArticleCard';

export default function InspirationCategoryPage() {
  const params = useParams();
  const { articles } = useArticleManagement();
  const slug = Array.isArray(params?.category) ? params?.category[0] : (params?.category as string);
  const category = ArticleSlugToCategory(slug || '');
  const list = useMemo(() => {
    if (!category) return [];
    return articles.filter(a => a.category === category && a.status === 'active');
  }, [articles, category]);
  const hero = category ? ArticleCategoryToHeroImage[category] : '';

  return (
    <main>
      <Section background="primary" padding="none" className="relative h-[520px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${hero}')` }} />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <Heading level={1} className="text-5xl text-white">{category || 'Unknown Category'}</Heading>
        </div>
      </Section>

      <Section background="secondary" padding="xl">
        <Container size="xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {list.map(a => (
              <ArticleCard key={a.id} article={a} />
            ))}
            {list.length === 0 && (
              <div className="col-span-full text-center py-10">
                <Text className="text-gray-600">暂无文章</Text>
              </div>
            )}
          </div>
        </Container>
      </Section>
    </main>
  );
}


