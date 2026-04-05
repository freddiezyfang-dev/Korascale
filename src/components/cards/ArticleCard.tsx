'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Heading, Text } from '@/components/common';
import { Article, ArticleCategoryToSlug, ArticleCategoryToCardTitle } from '@/types/article';
import { getRenderableImageUrl } from '@/lib/imageUtils';

interface ArticleCardProps {
  article: Article;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  const href = `/inspirations/${ArticleCategoryToSlug[article.category]}/${article.slug}`;
  const excerpt = article.excerpt || (article.content ? article.content.replace(/<[^>]+>/g, '').slice(0, 140) + '...' : '');
  const coverImageUrl = getRenderableImageUrl(article.coverImage);
  return (
    <Link href={href} className="block group">
      <Card className="overflow-hidden h-full">
        <div className="h-40 w-full overflow-hidden">
          <img src={coverImageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="p-4">
          <Text className="text-xs text-gray-500 mb-1">
            {ArticleCategoryToCardTitle[article.category]} • {article.author}
          </Text>
          <Heading level={3} className="text-lg font-semibold mb-2">{article.title}</Heading>
          <Text className="text-sm text-gray-600">{excerpt}</Text>
        </div>
      </Card>
    </Link>
  );
};


