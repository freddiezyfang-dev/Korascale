'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heading, Text, Card, Button, Container, Section } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useArticleManagement } from '@/context/ArticleManagementContext';
import { Article, ArticleCategory, ArticleCategoryToSlug } from '@/types/article';
import { DeleteConfirmationModal } from '@/components/modals/DeleteConfirmationModal';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { Plus, Edit, Trash2, Eye, Filter } from 'lucide-react';

export default function AdminArticlesPage() {
  const { user } = useUser();
  const router = useRouter();
  const { articles, deleteArticle, updateArticleStatus } = useArticleManagement();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { 
    isModalOpen, 
    isDeleting, 
    deleteOptions, 
    confirmDelete, 
    handleConfirm, 
    handleClose 
  } = useDeleteConfirmation();

  const categories: ArticleCategory[] = [
    'Food Journey',
    'Great Outdoors',
    'Immersive Encounters',
    'Spiritual Retreat',
    'Vibrant Nightscapes',
    'Seasonal Highlights'
  ];

  const handleDeleteArticle = (article: Article) => {
    confirmDelete({
      title: 'Delete Article',
      description: 'This will permanently remove the article and all associated data.',
      itemName: article.title,
      itemType: 'article',
      onConfirm: async () => {
        try {
          await deleteArticle(article.id);
        } catch (error) {
          console.error('[AdminArticles] Error deleting article:', error);
          alert('删除文章时出错，请检查控制台');
        }
      }
    });
  };

  // Hooks must be called unconditionally; compute filtered before any early return
  const filtered = useMemo(() => {
    return articles
      .filter(a => {
        const categoryOk = categoryFilter === 'all' || a.category === categoryFilter;
        const statusOk = statusFilter === 'all' || a.status === statusFilter;
        return categoryOk && statusOk;
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [articles, categoryFilter, statusFilter]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Section background="primary" padding="xl">
        <Container size="xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Heading level={1} className="text-3xl font-bold mb-2">Article Management</Heading>
              <Text className="text-gray-600">管理灵感文章，支持分类、SEO 与关联行程</Text>
              <Text className="text-sm text-amber-600 mt-2">
                💡 提示：只有状态为 <strong>active</strong> 的文章才会在前端显示。新文章默认为 <strong>draft</strong>，请在列表中切换状态。
              </Text>
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 mt-2 space-x-4">
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/articles');
                        const data = await response.json();
                        if (data.articles) {
                          console.log('📊 数据库中的文章:', data.articles);
                          alert(`数据库中有 ${data.articles.length} 篇文章\n\n请在控制台查看详细信息`);
                        } else {
                          alert('API 返回格式错误，请查看控制台');
                          console.error('API 响应:', data);
                        }
                      } catch (error) {
                        console.error('检查数据库失败:', error);
                        alert('检查数据库失败，请查看控制台');
                      }
                    }}
                    className="underline"
                  >
                    🔍 检查数据库
                  </button>
                  <button
                    onClick={() => {
                      const stored = localStorage.getItem('articles');
                      if (stored) {
                        const parsed = JSON.parse(stored);
                        console.log('💾 localStorage 中的文章数据:', parsed);
                        alert(`localStorage 中有 ${parsed.length} 篇文章\n\n请在控制台查看详细信息`);
                      } else {
                        alert('localStorage 中没有文章数据');
                      }
                    }}
                    className="underline"
                  >
                    💾 检查 localStorage
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        // 从数据库获取
                        const dbResponse = await fetch('/api/articles');
                        const dbData = await dbResponse.json();
                        const dbArticles = dbData.articles || [];
                        
                        // 从 localStorage 获取
                        const localRaw = localStorage.getItem('articles');
                        const localArticles = localRaw ? JSON.parse(localRaw) : [];
                        
                        const message = `
数据库: ${dbArticles.length} 篇文章
localStorage: ${localArticles.length} 篇文章

${dbArticles.length > 0 ? '✅ 文章已保存到数据库' : '⚠️ 数据库中暂无文章'}
${localArticles.length > 0 ? '💾 localStorage 有备份数据' : '💾 localStorage 无数据'}

请在控制台查看详细对比信息
                        `;
                        alert(message);
                        
                        console.log('📊 对比结果:', {
                          数据库: dbArticles.map(a => ({ title: a.title, slug: a.slug, status: a.status })),
                          localStorage: localArticles.map(a => ({ title: a.title, slug: a.slug, status: a.status }))
                        });
                      } catch (error) {
                        console.error('对比失败:', error);
                        alert('对比失败，请查看控制台');
                      }
                    }}
                    className="underline"
                  >
                    🔄 对比数据库 vs localStorage
                  </button>
                </div>
              )}
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
                  <div className="flex items-center justify-between mb-1">
                    <Text className="text-xs text-gray-500">{article.category}</Text>
                    <select
                      className="text-xs border rounded px-2 py-1 bg-white"
                      value={article.status}
                      onChange={(e) => {
                        updateArticleStatus(article.id, e.target.value as Article['status']);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="draft">draft</option>
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                    </select>
                  </div>
                  <Heading level={3} className="text-lg font-semibold mb-1">{article.title}</Heading>
                  <Text className="text-sm text-gray-600 mb-3">作者：{article.author}</Text>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/articles/edit/${article.id}`} className="inline-flex">
                      <Button variant="secondary" size="sm"><Edit className="w-4 h-4 mr-1" />编辑</Button>
                    </Link>
                    <Button variant="secondary" size="sm" onClick={() => handleDeleteArticle(article)}>
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

      {/* Delete Confirmation Modal */}
      {deleteOptions && (
        <DeleteConfirmationModal
          isOpen={isModalOpen}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title={deleteOptions.title}
          description={deleteOptions.description}
          itemName={deleteOptions.itemName}
          itemType={deleteOptions.itemType}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}


