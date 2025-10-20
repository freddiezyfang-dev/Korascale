'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heading, Text, Card, Button, Container, Section } from '@/components/common';
import { useArticleManagement } from '@/context/ArticleManagementContext';
import { Article, ArticleCategory } from '@/types/article';
import { useJourneyManagement } from '@/context/JourneyManagementContext';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const { articles, updateArticle } = useArticleManagement();
  const { journeys } = useJourneyManagement();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const target = useMemo(() => articles.find(a => a.id === id), [articles, id]);

  const [form, setForm] = useState({
    title: '', author: '', coverImage: '', category: 'Food Journey' as ArticleCategory,
    content: '', excerpt: '', relatedJourneyIds: [] as string[], status: 'draft' as Article['status'], slug: ''
  });

  useEffect(() => {
    if (target) {
      setForm({
        title: target.title,
        author: target.author,
        coverImage: target.coverImage,
        category: target.category,
        content: target.content,
        excerpt: target.excerpt || '',
        relatedJourneyIds: target.relatedJourneyIds,
        status: target.status,
        slug: target.slug
      });
    }
  }, [target]);

  if (!target) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text>文章不存在</Text>
      </div>
    );
  }

  const onSubmit = () => {
    const metaDescription = form.excerpt || form.content.replace(/<[^>]+>/g,'').slice(0, 150);
    updateArticle(target.id, { ...form, metaDescription });
    router.push('/admin/articles');
  };

  const categories: ArticleCategory[] = [
    'Food Journey','Great Outdoors','Immersive Encounters','Spiritual Retreat','Vibrant Nightscapes','Seasonal Highlights'
  ];

  const toggleJourney = (jid: string) => {
    setForm(prev => ({
      ...prev,
      relatedJourneyIds: prev.relatedJourneyIds.includes(jid)
        ? prev.relatedJourneyIds.filter(x => x !== jid)
        : [...prev.relatedJourneyIds, jid]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Section background="primary" padding="xl">
        <Container size="xl">
          <Heading level={1} className="text-2xl font-bold mb-4">编辑文章</Heading>
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
                <label className="block text-sm text-gray-600 mb-1">Slug</label>
                <input className="w-full border rounded px-3 py-2" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">摘要（选填）</label>
              <textarea className="w-full border rounded px-3 py-2" value={form.excerpt} onChange={e=>setForm({...form,excerpt:e.target.value})} rows={2} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">内容</label>
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


