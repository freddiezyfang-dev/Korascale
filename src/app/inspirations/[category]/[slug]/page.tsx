'use server';

import { articleAPI } from '@/lib/databaseClient';
import {
  ArticleCategoryToSlug,
  ArticleCategory,
} from '@/types/article';
import ClientArticlePage from './ClientArticlePage';

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const articles = await articleAPI.getAll();
    const activeArticles = articles.filter(
      (article) => article.status === 'active'
    );

    return activeArticles.map((article) => ({
      category: ArticleCategoryToSlug[article.category as ArticleCategory],
      slug: article.slug,
    }));
  } catch (error) {
    console.error(
      '[Inspirations Detail] Failed to generate static params:',
      error
    );
    return [];
  }
}

export default function ArticleDetailPage() {
  return <ClientArticlePage />;
}

