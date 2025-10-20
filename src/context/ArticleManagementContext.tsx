'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Article, ArticleStatus, ArticleCategory } from '@/types/article';

interface ArticleManagementContextType {
  articles: Article[];
  isLoading: boolean;
  addArticle: (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateArticle: (id: string, updates: Partial<Omit<Article, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  updateArticleStatus: (id: string, status: ArticleStatus) => void;
  deleteArticle: (id: string) => void;
  getArticlesByCategory: (category: ArticleCategory) => Article[];
  getArticlesByStatus: (status: ArticleStatus) => Article[];
  getArticleBySlug: (slug: string) => Article | undefined;
}

const ArticleManagementContext = createContext<ArticleManagementContextType | undefined>(undefined);

export const useArticleManagement = () => {
  const ctx = useContext(ArticleManagementContext);
  if (!ctx) throw new Error('useArticleManagement must be used within ArticleManagementProvider');
  return ctx;
};

interface ProviderProps { children: ReactNode }

const defaultArticles: Article[] = [
  {
    id: 'article-1',
    slug: 'sichuan-street-food-guide',
    title: 'Sichuan Street Food: A Practical Guide',
    author: 'Korascale Editorial',
    coverImage: '/images/inspirations/food-journey.jpg',
    category: 'Food Journey',
    content: '<p>From spicy skewers to rabbit head, this guide helps you navigate Chengdu\'s irresistible street food scene with confidence.</p>',
    excerpt: 'From spicy skewers to rabbit head, this guide helps you navigate...',
    relatedJourneyIds: ['journey-1'],
    tags: ['sichuan', 'food', 'street'],
    status: 'active',
    pageTitle: 'Sichuan Street Food: A Practical Guide',
    metaDescription: 'Navigate Chengdu street food like a local. Tips, iconic snacks, and hygiene insights.',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const ArticleManagementProvider: React.FC<ProviderProps> = ({ children }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('articles');
      if (raw) {
        const parsed: Article[] = JSON.parse(raw).map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt)
        }));
        setArticles(parsed);
      } else {
        setArticles(defaultArticles);
        localStorage.setItem('articles', JSON.stringify(defaultArticles));
      }
    } catch (e) {
      console.error('Failed to load articles from storage', e);
      setArticles(defaultArticles);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const persist = (next: Article[]) => {
    setArticles(next);
    try {
      localStorage.setItem('articles', JSON.stringify(next));
    } catch (e) {
      console.error('Failed to persist articles', e);
    }
  };

  const addArticle = (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newArticle: Article = {
      ...article,
      id: `article-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    persist([...articles, newArticle]);
  };

  const updateArticle = (id: string, updates: Partial<Omit<Article, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const next = articles.map(a => (a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a));
    persist(next);
  };

  const updateArticleStatus = (id: string, status: ArticleStatus) => {
    updateArticle(id, { status });
  };

  const deleteArticle = (id: string) => {
    const next = articles.filter(a => a.id !== id);
    persist(next);
  };

  const getArticlesByCategory = (category: ArticleCategory) => articles.filter(a => a.category === category);
  const getArticlesByStatus = (status: ArticleStatus) => articles.filter(a => a.status === status);
  const getArticleBySlug = (slug: string) => articles.find(a => a.slug === slug);

  const value: ArticleManagementContextType = {
    articles,
    isLoading,
    addArticle,
    updateArticle,
    updateArticleStatus,
    deleteArticle,
    getArticlesByCategory,
    getArticlesByStatus,
    getArticleBySlug
  };

  return <ArticleManagementContext.Provider value={value}>{children}</ArticleManagementContext.Provider>;
};


