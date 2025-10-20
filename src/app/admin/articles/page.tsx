'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heading, Text, Card, Button, Container, Section } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useArticleManagement } from '@/context/ArticleManagementContext';
import { Article, ArticleCategory, ArticleCategoryToSlug } from '@/types/article';
import { Plus, Edit, Trash2, Eye, Filter } from 'lucide-react';

export default function AdminArticlesPage() {
  const { user } = useUser();
  const router = useRouter();
  const { articles, deleteArticle } = useArticleManagement();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (!user || user.email !== 'admin@korascale.com') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heading level={1} className="text-2xl font-bold mb-4">访问被拒绝</Heading>
          <Text className="text-gray-600 mb-4">您没有权限访问管理后台</Text>
          <Link href="/" className="text-primary-600 hover:text-primary-500">返回首页</Link>
        </div>
      </div>
    );
  }

  const categories: ArticleCategory[] = [
    'Food Journey',
    'Great Outdoors',
    'Immersive Encounters',
    'Spiritual Retreat',
    'Vibrant Nightscapes',
    'Seasonal Highlights'
  ];

  const filtered = useMemo(() => {
    return articles.filter(a => {
      const categoryOk = categoryFilter === 'all' || a.category === categoryFilter;
      const statusOk = statusFilter === 'all' || a.status === statusFilter;
      return categoryOk && statusOk;
    }).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [articles, categoryFilter, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Section background="primary" padding="xl">
        <Container size="xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Heading level={1} className="text-3xl font-bold mb-2">Article Management</Heading>
              <Text className="text-gray-600">管理灵感文章，支持分类、SEO 与关联行程</Text>
            </div>
            <Link href="/admin/articles/new" className="inline-flex">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                新建文章
              </Button>
            </Link>
          </div>

          <Card className="p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                className="border rounded px-2 py-1"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">全部分类</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                className="border rounded px-2 py-1"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">全部状态</option>
                <option value="active">active</option>
                <option value="draft">draft</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(article => (
              <Card key={article.id} className="overflow-hidden">
                <img src={article.coverImage} alt={article.title} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <Text className="text-xs text-gray-500 mb-1">{article.category} • {article.status}</Text>
                  <Heading level={3} className="text-lg font-semibold mb-1">{article.title}</Heading>
                  <Text className="text-sm text-gray-600 mb-3">作者：{article.author}</Text>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/articles/edit/${article.id}`} className="inline-flex">
                      <Button variant="secondary" size="sm"><Edit className="w-4 h-4 mr-1" />编辑</Button>
                    </Link>
                    <Button variant="secondary" size="sm" onClick={() => deleteArticle(article.id)}>
                      <Trash2 className="w-4 h-4 mr-1" />删除
                    </Button>
                    <Link href={`/inspirations/${ArticleCategoryToSlug[article.category]}/${article.slug}`} className="inline-flex ml-auto">
                      <Button variant="secondary" size="sm"><Eye className="w-4 h-4 mr-1" />预览</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </div>
  );
}


