'use client';

import React, { useMemo } from 'react';
import Head from 'next/head';
import { useParams } from 'next/navigation';
import { Section, Container, Heading, Text, Breadcrumb } from '@/components/common';
import { useArticleManagement } from '@/context/ArticleManagementContext';
import { ArticleCategoryToHeroImage, ArticleSlugToCategory } from '@/types/article';
import { useJourneyManagement } from '@/context/JourneyManagementContext';

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params?.slug[0] : (params?.slug as string);
  const categorySlug = Array.isArray(params?.category) ? params?.category[0] : (params?.category as string);
  const category = ArticleSlugToCategory(categorySlug || '');
  const { getArticleBySlug } = useArticleManagement();
  const { journeys } = useJourneyManagement();

  // Hooks must be called unconditionally
  const article = getArticleBySlug(slug || '');
  const related = useMemo(() => {
    if (!article) return [];
    return journeys.filter(j => article.relatedJourneyIds.includes(j.id));
  }, [journeys, article]);

  if (!category || !article || article.category !== category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Text>文章不存在</Text>
      </div>
    );
  }

  const hero = ArticleCategoryToHeroImage[category];

  return (
    <main>
      <Head>
        <title>{article.pageTitle || article.title}</title>
        {article.metaDescription && <meta name="description" content={article.metaDescription} />}
      </Head>

      <Section background="primary" padding="none" className="relative h-[420px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${hero}')` }} />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 h-full flex items-end">
          <div className="p-8 w-full max-w-5xl mx-auto">
            <Breadcrumb items={[{label:'Home',href:'/'},{label:'Inspirations',href:'/inspirations'},{label:category}]} color="#FFFFFF" sizeClassName="text-sm" />
            <Heading level={1} className="text-4xl text-white mt-4">{article.title}</Heading>
            <Text className="text-white/90 mt-2">作者：{article.author}</Text>
          </div>
        </div>
      </Section>

      <Section background="secondary" padding="xl">
        <Container size="xl">
          <article className="prose max-w-5xl mx-auto">
            {/* 允许 HTML 内容渲染，确保内容来源可信 */}
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          </article>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section background="secondary" padding="xl">
          <Container size="xl">
            <Heading level={2} className="text-2xl font-semibold mb-6">Related Journeys</Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map(j => (
                <div key={j.id} className="border rounded-lg overflow-hidden">
                  <img src={j.image} alt={j.title} className="w-full h-40 object-cover" />
                  <div className="p-4">
                    <Heading level={3} className="text-lg mb-1">{j.title}</Heading>
                    <Text className="text-sm text-gray-600 mb-2">{j.duration} • ¥{j.price}</Text>
                    <a href={`/journeys/${j.slug}`} className="text-primary-600 underline text-sm">查看行程</a>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </main>
  );
}


