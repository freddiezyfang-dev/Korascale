'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heading, Text, Card, Button, Container, Section } from '@/components/common';
import { useArticleManagement } from '@/context/ArticleManagementContext';
import { Article, ArticleCategory, ArticleCategoryToSlug } from '@/types/article';
import { useJourneyManagement } from '@/context/JourneyManagementContext';

export default function NewArticlePage() {
  const router = useRouter();
  const { addArticle } = useArticleManagement();
  const { journeys } = useJourneyManagement();

  const categories: ArticleCategory[] = [
    'Food Journey','Great Outdoors','Immersive Encounters','Spiritual Retreat','Vibrant Nightscapes','Seasonal Highlights'
  ];

  const [form, setForm] = useState({
    title: '',
    author: '',
    coverImage: '',
    category: categories[0] as ArticleCategory,
    content: '',
    excerpt: '',
    relatedJourneyIds: [] as string[],
    status: 'draft' as Article['status'],
    slug: ''
  });

  const onSubmit = () => {
    const slug = form.slug || form.title.trim().toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-');
    const pageTitle = form.title;
    const metaDescription = form.excerpt || form.content.replace(/<[^>]+>/g,'').slice(0, 150);
    addArticle({
      ...form,
      slug,
      pageTitle,
      metaDescription
    } as Omit<Article, 'id'|'createdAt'|'updatedAt'>);
    router.push('/admin/articles');
  };

  const toggleJourney = (id: string) => {
    setForm(prev => ({
      ...prev,
      relatedJourneyIds: prev.relatedJourneyIds.includes(id)
        ? prev.relatedJourneyIds.filter(x => x !== id)
        : [...prev.relatedJourneyIds, id]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Section background="primary" padding="xl">
        <Container size="xl">
          <Heading level={1} className="text-2xl font-bold mb-4">新建文章</Heading>
          <Card className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">标题</label>
                <input className="w-full border rounded px-3 py-2" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">作者</label>
                <input className="w-full border rounded px-3 py-2" value={form.author} onChange={e=>setForm({...form,author:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">封面图 URL</label>
                <input className="w-full border rounded px-3 py-2" value={form.coverImage} onChange={e=>setForm({...form,coverImage:e.target.value})} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">分类</label>
                <select className="w-full border rounded px-3 py-2" value={form.category} onChange={e=>setForm({...form,category:e.target.value as ArticleCategory})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">状态</label>
                <select className="w-full border rounded px-3 py-2" value={form.status} onChange={e=>setForm({...form,status:e.target.value as Article['status']})}>
                  <option value="draft">draft</option>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Slug（可选）</label>
                <input className="w-full border rounded px-3 py-2" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="自动根据标题生成" />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">摘要（选填）</label>
              <textarea className="w-full border rounded px-3 py-2" value={form.excerpt} onChange={e=>setForm({...form,excerpt:e.target.value})} rows={2} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">内容（支持 HTML/Markdown 文本）</label>
              <textarea className="w-full border rounded px-3 py-2" value={form.content} onChange={e=>setForm({...form,content:e.target.value})} rows={10} />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">关联 Journeys</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {journeys.map(j => (
                  <label key={j.id} className="flex items-center gap-2 p-2 border rounded">
                    <input type="checkbox" checked={form.relatedJourneyIds.includes(j.id)} onChange={()=>toggleJourney(j.id)} />
                    <span className="text-sm">{j.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={onSubmit}>保存</Button>
              <Button variant="secondary" onClick={()=>router.push('/admin/articles')}>取消</Button>
            </div>
          </Card>
        </Container>
      </Section>
    </div>
  );
}


