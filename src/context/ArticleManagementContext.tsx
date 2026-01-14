'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Article, ArticleStatus, ArticleCategory } from '@/types/article';
import { articleAPI } from '@/lib/databaseClient';

interface ArticleManagementContextType {
  articles: Article[];
  isLoading: boolean;
  addArticle: (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateArticle: (id: string, updates: Partial<Omit<Article, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  updateArticleStatus: (id: string, status: ArticleStatus) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
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

  // 从 API 加载文章，失败时使用 localStorage fallback
  useEffect(() => {
    const loadArticles = async () => {
      try {
        console.log('[ArticleManagement] Loading articles from API...');
        const apiArticles = await articleAPI.getAll();
        
        if (apiArticles.length > 0) {
          console.log(`[ArticleManagement] Loaded ${apiArticles.length} articles from API`);
          setArticles(apiArticles);
          // 同步到 localStorage 作为备份
          try {
            localStorage.setItem('articles', JSON.stringify(apiArticles));
          } catch (e) {
            console.warn('[ArticleManagement] Failed to sync to localStorage:', e);
          }
        } else {
          // API 返回空数组，尝试从 localStorage 加载
          console.warn('[ArticleManagement] API returned empty array, trying localStorage...');
          const raw = localStorage.getItem('articles');
          if (raw) {
            const parsed: Article[] = JSON.parse(raw).map((a: any) => ({
              ...a,
              createdAt: new Date(a.createdAt),
              updatedAt: new Date(a.updatedAt)
            }));
            console.log(`[ArticleManagement] Loaded ${parsed.length} articles from localStorage`);
            setArticles(parsed);
          } else {
            console.log('[ArticleManagement] No articles found, using defaults');
            setArticles(defaultArticles);
            localStorage.setItem('articles', JSON.stringify(defaultArticles));
          }
        }
      } catch (error) {
        console.error('[ArticleManagement] Failed to load articles from API:', error);
        // Fallback to localStorage
        try {
          const raw = localStorage.getItem('articles');
          if (raw) {
            const parsed: Article[] = JSON.parse(raw).map((a: any) => ({
              ...a,
              createdAt: new Date(a.createdAt),
              updatedAt: new Date(a.updatedAt)
            }));
            console.log(`[ArticleManagement] Fallback: Loaded ${parsed.length} articles from localStorage`);
            setArticles(parsed);
          } else {
            console.log('[ArticleManagement] Fallback: Using default articles');
            setArticles(defaultArticles);
            localStorage.setItem('articles', JSON.stringify(defaultArticles));
          }
        } catch (e) {
          console.error('[ArticleManagement] Failed to load from localStorage:', e);
          setArticles(defaultArticles);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadArticles();
  }, []);

  // 同步到 API 和 localStorage
  const syncToStorage = async (articlesToSync: Article[]) => {
    // 更新本地状态
    setArticles(articlesToSync);
    
    // 同步到 localStorage（作为备份）
    try {
      localStorage.setItem('articles', JSON.stringify(articlesToSync));
      console.log('[ArticleManagement] Synced to localStorage:', articlesToSync.length, 'articles');
    } catch (e) {
      console.error('[ArticleManagement] Failed to sync to localStorage:', e);
    }
  };

  const addArticle = async (article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('[ArticleManagement] Creating article via API:', {
        slug: article.slug,
        title: article.title,
        category: article.category,
        status: article.status
      });
      
      // 先尝试通过 API 创建
      const newArticle = await articleAPI.create(article);
      console.log('[ArticleManagement] Article created via API:', newArticle.id);
      
      // 更新本地状态
      setArticles(prev => {
        const updated = [...prev, newArticle];
        // 同步到 localStorage
        try {
          localStorage.setItem('articles', JSON.stringify(updated));
        } catch (e) {
          console.error('[ArticleManagement] Failed to sync to localStorage:', e);
        }
        return updated;
      });
    } catch (error) {
      console.error('[ArticleManagement] Failed to create article via API, using localStorage fallback:', error);
      // Fallback: 使用 localStorage
      const newArticle: Article = {
        ...article,
        id: `article-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setArticles(prev => {
        const updated = [...prev, newArticle];
        try {
          localStorage.setItem('articles', JSON.stringify(updated));
        } catch (e) {
          console.error('[ArticleManagement] Failed to persist articles', e);
        }
        return updated;
      });
    }
  };

  const updateArticle = async (id: string, updates: Partial<Omit<Article, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      console.log('[ArticleManagement] Updating article via API:', id);
      const updatedArticle = await articleAPI.update(id, updates);
      
      // 更新本地状态
      setArticles(prev => {
        const updated = prev.map(a => a.id === id ? updatedArticle : a);
        try {
          localStorage.setItem('articles', JSON.stringify(updated));
        } catch (e) {
          console.error('[ArticleManagement] Failed to sync to localStorage:', e);
        }
        return updated;
      });
    } catch (error) {
      console.error('[ArticleManagement] Failed to update article via API, using localStorage fallback:', error);
      // Fallback: 使用 localStorage
      const next = articles.map(a => (a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a));
      await syncToStorage(next);
    }
  };

  const updateArticleStatus = async (id: string, status: ArticleStatus) => {
    await updateArticle(id, { status });
  };

  const deleteArticle = async (id: string) => {
    try {
      console.log('[ArticleManagement] Deleting article via API:', id);
      await articleAPI.delete(id);
      
      // 更新本地状态
      setArticles(prev => {
        const updated = prev.filter(a => a.id !== id);
        try {
          localStorage.setItem('articles', JSON.stringify(updated));
        } catch (e) {
          console.error('[ArticleManagement] Failed to sync to localStorage:', e);
        }
        return updated;
      });
    } catch (error) {
      console.error('[ArticleManagement] Failed to delete article via API, using localStorage fallback:', error);
      // Fallback: 使用 localStorage
      const next = articles.filter(a => a.id !== id);
      await syncToStorage(next);
    }
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


