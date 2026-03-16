'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heading, Text, Card, Button, Container, Section } from '@/components/common';
import { useArticleManagement } from '@/context/ArticleManagementContext';
import { Article, ArticleCategory, ContentBlock, ContentBlockType, RecommendedItem } from '@/types/article';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { uploadAPI } from '@/lib/databaseClient';
import { Upload } from 'lucide-react';
import { RichTextEditor } from '@/components/admin/RichTextEditor';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const { articles, updateArticle } = useArticleManagement();
  const { journeys } = useJourneyManagement();
  const id = Array.isArray(params?.id) ? params?.id[0] : (params?.id as string);

  const target = useMemo(() => articles.find(a => a.id === id), [articles, id]);

  const [form, setForm] = useState({
    title: '',
    author: '',
    coverImage: '',
    heroImage: '',
    readingTime: '12 min read',
    category: 'Food Journey' as ArticleCategory,
    content: '',
    contentBlocks: [] as ContentBlock[],
    excerpt: '',
    relatedJourneyIds: [] as string[],
    recommendedItems: [] as RecommendedItem[],
    status: 'draft' as Article['status'],
    slug: '',
    featured: false,
    displayOrder: undefined as number | undefined,
    tags: [] as string[],
    faqs: [] as { question: string; answer: string }[],
  });

  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [tagInputValue, setTagInputValue] = useState('');

  useEffect(() => {
    if (target) {
      setForm({
        title: target.title,
        author: target.author,
        coverImage: target.coverImage,
        heroImage: target.heroImage || '',
        readingTime: target.readingTime || '12 min read',
        category: target.category,
        content: target.content || '',
        contentBlocks: target.contentBlocks || [],
        excerpt: target.excerpt || '',
        relatedJourneyIds: target.relatedJourneyIds,
        recommendedItems: target.recommendedItems || [],
        status: target.status,
        slug: target.slug,
        featured: target.featured ?? false,
        displayOrder: target.displayOrder ?? undefined,
        tags: target.tags ?? [],
        faqs: target.faqs ?? [],
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

  const addContentBlock = (type: ContentBlockType) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      text: '',
      level: type === 'heading' ? 2 : undefined,
      imageWidth: type === 'image' ? 'contained' : undefined
    };
    setForm(prev => ({
      ...prev,
      contentBlocks: [...prev.contentBlocks, newBlock]
    }));
  };

  const updateContentBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    setForm(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      )
    }));
  };

  const removeContentBlock = (blockId: string) => {
    setForm(prev => ({
      ...prev,
      contentBlocks: prev.contentBlocks.filter(block => block.id !== blockId)
    }));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= form.contentBlocks.length) return;
    
    const blocks = [...form.contentBlocks];
    [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
    setForm(prev => ({ ...prev, contentBlocks: blocks }));
  };

  const onSubmit = async () => {
    try {
      const metaDescription = form.excerpt || (form.content ? form.content.replace(/<[^>]+>/g,'').slice(0, 150) : '');
      const cleanedFaqs = (form.faqs || []).map(f => ({
        question: (f.question || '').trim(),
        answer: (f.answer || '').trim(),
      })).filter(f => f.question && f.answer);
      const { savedToDatabase, errorMessage } = await updateArticle(target.id, {
        ...form,
        metaDescription,
        contentBlocks: form.contentBlocks.length > 0 ? form.contentBlocks : undefined,
        featured: form.featured,
        displayOrder: form.displayOrder,
        faqs: cleanedFaqs.length > 0 ? cleanedFaqs : undefined,
      });
      if (savedToDatabase) {
        alert('已保存到数据库。刷新页面后仍会保留。');
      } else {
        const msg = errorMessage
          ? `保存失败：${errorMessage}\n\n仅保存到本地，请检查 Vercel 环境变量与 Neon 表结构。`
          : '保存失败：未能写入数据库，仅保存到本地。请检查网络或联系管理员。';
        alert(msg);
      }
      router.push('/admin/articles');
    } catch (error) {
      console.error('[EditArticle] Error updating article:', error);
      alert('更新文章时出错，请检查控制台');
    }
  };

  const categories: ArticleCategory[] = [
    'Food Journey','The Western Corridor','Ancient Chinese Culture','Spiritual Retreat','Vibrant Nightscapes','Seasonal Highlights'
  ];

  const toggleJourney = (jid: string) => {
    setForm(prev => ({
      ...prev,
      relatedJourneyIds: prev.relatedJourneyIds.includes(jid)
        ? prev.relatedJourneyIds.filter(x => x !== jid)
        : [...prev.relatedJourneyIds, jid]
    }));
  };

  const toggleRecommendedItem = (type: 'journey' | 'article', id: string) => {
    setForm(prev => {
      const currentItems = prev.recommendedItems || [];
      const existingIndex = currentItems.findIndex(item => item.type === type && item.id === id);
      
      if (existingIndex >= 0) {
        // 移除
        return {
          ...prev,
          recommendedItems: currentItems.filter((_, index) => index !== existingIndex)
        };
      } else {
        // 添加
        return {
          ...prev,
          recommendedItems: [...currentItems, { type, id }]
        };
      }
    });
  };

  const isRecommendedItemSelected = (type: 'journey' | 'article', id: string): boolean => {
    return (form.recommendedItems || []).some(item => item.type === type && item.id === id);
  };

  const addTag = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed || (form.tags ?? []).includes(trimmed)) return;
    setForm(prev => ({ ...prev, tags: [...(prev.tags ?? []), trimmed] }));
    setTagInputValue('');
  };
  const removeTag = (index: number) => {
    setForm(prev => ({ ...prev, tags: (prev.tags ?? []).filter((_, i) => i !== index) }));
  };
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInputValue);
    }
  };

  const MAX_ALT_LENGTH = 125;
  const cleanAndTruncateAlt = (s: string): string => {
    const cleaned = s.replace(/,+/g, ',').replace(/\s*,\s*/g, ', ').trim();
    if (cleaned.length <= MAX_ALT_LENGTH) return cleaned;
    const cut = cleaned.slice(0, MAX_ALT_LENGTH);
    const lastSpace = cut.lastIndexOf(' ');
    const lastComma = cut.lastIndexOf(',');
    const splitAt = Math.max(lastSpace, lastComma, 0);
    return (splitAt > 0 ? cut.slice(0, splitAt) : cut.slice(0, MAX_ALT_LENGTH)).trim();
  };

  type AltContext = 'cover' | 'content';
  const generateAltFromTags = (title: string, tags: string[], context: AltContext): string => {
    const t = title.trim() || 'Article';
    const tagList = [...new Set(tags.map(s => s.trim()).filter(Boolean))];
    if (tagList.length === 0) return cleanAndTruncateAlt(t);

    if (context === 'cover') {
      const part = tagList.slice(0, 2).join(', ');
      return cleanAndTruncateAlt(`${t} | ${part} - Korascale Bespoke Travel`);
    }
    const count = Math.min(2 + Math.floor(Math.random() * 2), tagList.length);
    const shuffled = [...tagList].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, count);
    const tagPhrase = count === 1 ? picked[0] : count === 2 ? `${picked[0]} and ${picked[1]}` : `${picked[0]}, ${picked[1]} and ${picked[2]}`;
    return cleanAndTruncateAlt(`Exploring ${tagPhrase} during our ${t} trip.`);
  };

  const syncCaptionFromTags = (blockId: string, context: AltContext = 'content') => {
    const tags = form.tags ?? [];
    const title = form.title.trim() || 'Article';
    const suggested = generateAltFromTags(title, tags, context);
    updateContentBlock(blockId, { caption: suggested });
  };

  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const handleBlockImageUpload = async (blockId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }
    setUploadingBlockId(blockId);
    try {
      const imageUrl = await uploadAPI.uploadImage(file, 'journeys');
      const block = form.contentBlocks.find(b => b.id === blockId);
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
      const suggestedCaption = (form.title.trim() || 'Image') + ' - ' + nameWithoutExt;
      updateContentBlock(blockId, {
        imageSrc: imageUrl,
        ...((!block?.caption || !block.caption.trim()) ? { caption: suggestedCaption } : {}),
      });
      alert('图片上传成功！');
    } catch (error) {
      console.error('Block image upload failed:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploadingBlockId(null);
      event.target.value = '';
    }
  };

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    setIsUploadingCover(true);
    try {
      const imageUrl = await uploadAPI.uploadImage(file, 'journeys');
      setForm(prev => ({ ...prev, coverImage: imageUrl }));
      alert('封面图上传成功！');
    } catch (error) {
      console.error('Cover image upload failed:', error);
      alert('封面图上传失败，请重试');
    } finally {
      setIsUploadingCover(false);
      event.target.value = '';
    }
  };

  const handleHeroImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    setIsUploadingHero(true);
    try {
      const imageUrl = await uploadAPI.uploadImage(file, 'journeys');
      setForm(prev => ({ ...prev, heroImage: imageUrl }));
      alert('Hero 图上传成功！');
    } catch (error) {
      console.error('Hero image upload failed:', error);
      alert('Hero 图上传失败，请重试');
    } finally {
      setIsUploadingHero(false);
      event.target.value = '';
    }
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
                <div className="flex gap-2">
                  <input 
                    className="flex-1 border rounded px-3 py-2" 
                    value={form.coverImage} 
                    onChange={e=>setForm({...form,coverImage:e.target.value})}
                    placeholder="图片URL（上传后会自动填充）或输入路径"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    disabled={isUploadingCover}
                    className="hidden"
                    id="cover-image-upload-input"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isUploadingCover}
                    className="flex items-center gap-2"
                    onClick={() => document.getElementById('cover-image-upload-input')?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    {isUploadingCover ? '上传中...' : '上传'}
                  </Button>
                </div>
                <Text size="sm" className="text-gray-500 mt-1">
                  {(() => {
                    if (!form.coverImage) {
                      return '💡 提示：点击"上传"按钮可将图片上传到 Vercel Blob 云存储，或直接输入图片URL';
                    } else if (form.coverImage.startsWith('https://') && form.coverImage.includes('vercel-storage.com')) {
                      return '✅ 云存储URL（已上传到 Vercel Blob 云存储）';
                    } else if (form.coverImage.startsWith('/')) {
                      return '💡 本地路径（存储在 public 目录）';
                    } else {
                      return '💡 外部URL或云存储URL';
                    }
                  })()}
                </Text>
                {form.coverImage && (
                  <div className="mt-3">
                    <img
                      src={form.coverImage}
                      alt="Cover image preview"
                      className="w-full h-40 object-cover rounded-lg border border-gray-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Hero 图 URL（可选）</label>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 border rounded px-3 py-2" 
                    value={form.heroImage} 
                    onChange={e=>setForm({...form,heroImage:e.target.value})}
                    placeholder="图片URL（上传后会自动填充）或输入路径"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload}
                    disabled={isUploadingHero}
                    className="hidden"
                    id="hero-image-upload-input"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isUploadingHero}
                    className="flex items-center gap-2"
                    onClick={() => document.getElementById('hero-image-upload-input')?.click()}
                  >
                    <Upload className="w-4 h-4" />
                    {isUploadingHero ? '上传中...' : '上传'}
                  </Button>
                </div>
                <Text size="sm" className="text-gray-500 mt-1">
                  {(() => {
                    if (!form.heroImage) {
                      return '💡 提示：点击"上传"按钮可将图片上传到 Vercel Blob 云存储，或直接输入图片URL';
                    } else if (form.heroImage.startsWith('https://') && form.heroImage.includes('vercel-storage.com')) {
                      return '✅ 云存储URL（已上传到 Vercel Blob 云存储）';
                    } else if (form.heroImage.startsWith('/')) {
                      return '💡 本地路径（存储在 public 目录）';
                    } else {
                      return '💡 外部URL或云存储URL';
                    }
                  })()}
                </Text>
                {form.heroImage && (
                  <div className="mt-3">
                    <img
                      src={form.heroImage}
                      alt="Hero image preview"
                      className="w-full h-40 object-cover rounded-lg border border-gray-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">阅读时间</label>
                <input className="w-full border rounded px-3 py-2" value={form.readingTime} onChange={e=>setForm({...form,readingTime:e.target.value})} placeholder="12 min read" />
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
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">标签 (Tags)</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={tagInputValue}
                  onChange={e => setTagInputValue(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => { if (tagInputValue.trim()) addTag(tagInputValue); }}
                  placeholder="输入后按回车或逗号添加标签"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {(form.tags ?? []).map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="text-gray-500 hover:text-red-600 ml-0.5"
                        aria-label={`移除 ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 border border-dashed border-gray-200 rounded-lg p-4 bg-white/60">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800">FAQ Management</h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => setForm(prev => ({ ...prev, faqs: [...(prev.faqs || []), { question: '', answer: '' }] }))}
                    >
                      + Add FAQ
                    </Button>
                    {form.faqs && form.faqs.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-xs text-red-600 border-red-200"
                        onClick={() => setForm(prev => ({ ...prev, faqs: [] }))}
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                </div>
                {(!form.faqs || form.faqs.length === 0) ? (
                  <Text size="sm" className="text-gray-500">暂无 FAQ，可点击「+ Add FAQ」添加常见问答。</Text>
                ) : (
                  <div className="space-y-3">
                    {form.faqs.map((faq, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-3 bg-gray-50/80">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 space-y-2">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Question</label>
                              <input
                                className="w-full border rounded px-2 py-1 text-sm"
                                value={faq.question}
                                onChange={e => {
                                  const value = e.target.value;
                                  setForm(prev => {
                                    const next = [...(prev.faqs || [])];
                                    next[index] = { ...next[index], question: value };
                                    return { ...prev, faqs: next };
                                  });
                                }}
                                placeholder="用户可能会问的问题，例如：What is the best season to visit?"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Answer</label>
                              <textarea
                                className="w-full border rounded px-2 py-1 text-sm"
                                rows={3}
                                value={faq.answer}
                                onChange={e => {
                                  const value = e.target.value;
                                  setForm(prev => {
                                    const next = [...(prev.faqs || [])];
                                    next[index] = { ...next[index], answer: value };
                                    return { ...prev, faqs: next };
                                  });
                                }}
                                placeholder="为该问题提供简洁直接的回答。"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            className="ml-2 text-gray-400 hover:text-red-500"
                            onClick={() => {
                              setForm(prev => ({
                                ...prev,
                                faqs: (prev.faqs || []).filter((_, i) => i !== index),
                              }));
                            }}
                            aria-label="删除该 FAQ"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* 首页展示位：精选 + 顺序 1–5 */}
              <div className="md:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">首页展示位</h4>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={e => setForm(prev => ({ ...prev, featured: e.target.checked }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">设为首页精选 (isFeatured)</span>
                  </label>
                  {form.featured && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">展示顺序 (1–5)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={form.displayOrder ?? ''}
                        onChange={e => {
                          const v = e.target.value === '' ? undefined : Math.min(5, Math.max(1, Number(e.target.value)));
                          setForm(prev => ({ ...prev, displayOrder: v }));
                        }}
                        className="w-16 border rounded px-2 py-1.5 text-sm"
                        placeholder="1"
                      />
                    </div>
                  )}
                </div>
                <Text size="sm" className="text-gray-500 mt-2">
                  仅当「设为首页精选」勾选且填写 1–5 时，该文章会出现在首页 Content Section，按 featuredOrder 排序填充 5 个展示位。
                </Text>
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

            {/* Content Blocks Editor */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-gray-700">内容块（推荐使用）</label>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => addContentBlock('heading')}>添加标题</Button>
                  <Button size="sm" variant="outline" onClick={() => addContentBlock('paragraph')}>添加段落</Button>
                  <Button size="sm" variant="outline" onClick={() => addContentBlock('image')}>添加图片</Button>
                  <Button size="sm" variant="outline" onClick={() => addContentBlock('callout')}>添加高亮框</Button>
                  <Button size="sm" variant="outline" onClick={() => addContentBlock('trip_cta')}>添加行程 CTA</Button>
                </div>
              </div>

              <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                {form.contentBlocks.length === 0 ? (
                  <Text className="text-gray-500 text-center py-4">暂无内容块，点击上方按钮添加</Text>
                ) : (
                  form.contentBlocks.map((block, index) => (
                    <div key={block.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-600 uppercase">{block.type}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => moveBlock(index, 'up')}
                              disabled={index === 0}
                              className="text-xs px-2 py-1 border rounded disabled:opacity-50"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveBlock(index, 'down')}
                              disabled={index === form.contentBlocks.length - 1}
                              className="text-xs px-2 py-1 border rounded disabled:opacity-50"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => removeContentBlock(block.id)}
                          className="text-red-600 text-sm hover:underline"
                        >
                          删除
                        </button>
                      </div>

                      {block.type === 'heading' && (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">级别</label>
                            <select
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={block.level || 2}
                              onChange={e => updateContentBlock(block.id, { level: parseInt(e.target.value) })}
                            >
                              {[1, 2, 3, 4, 5, 6].map(l => <option key={l} value={l}>H{l}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">文本</label>
                            <input
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={block.text || ''}
                              onChange={e => updateContentBlock(block.id, { text: e.target.value })}
                              placeholder="标题文本"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'paragraph' && (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1 mb-2">文本内容</label>
                          <RichTextEditor
                            value={block.text || ''}
                            onChange={(value) => updateContentBlock(block.id, { text: value })}
                            placeholder="输入段落内容..."
                            className="w-full"
                          />
                        </div>
                      )}

                      {block.type === 'image' && (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">图片 URL</label>
                            <div className="flex gap-2">
                              <input
                                className="flex-1 border rounded px-2 py-1 text-sm"
                                value={block.imageSrc || ''}
                                onChange={e => updateContentBlock(block.id, { imageSrc: e.target.value })}
                                placeholder="图片 URL"
                              />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id={`block-image-upload-${block.id}`}
                                onChange={e => handleBlockImageUpload(block.id, e)}
                                disabled={!!uploadingBlockId}
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="border text-xs shrink-0"
                                disabled={!!uploadingBlockId}
                                onClick={() => document.getElementById(`block-image-upload-${block.id}`)?.click()}
                              >
                                {uploadingBlockId === block.id ? '上传中...' : '上传'}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <label className="block text-xs text-gray-600">图片说明 (alt)</label>
                              <button
                                type="button"
                                className="border rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 shrink-0"
                                onClick={() => syncCaptionFromTags(block.id, 'content')}
                                title="从标签生成 alt（无标签时使用文章标题）"
                              >
                                Sync from Tags
                              </button>
                            </div>
                            <input
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={block.caption || ''}
                              onChange={e => updateContentBlock(block.id, { caption: e.target.value })}
                              placeholder="图片说明（可选）"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">宽度</label>
                            <select
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={block.imageWidth || 'contained'}
                              onChange={e => updateContentBlock(block.id, { imageWidth: e.target.value as 'contained' | 'full-bleed' })}
                            >
                              <option value="contained">Contained（行内）</option>
                              <option value="full-bleed">Full Bleed（全宽）</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {block.type === 'callout' && (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">月份标签（可选）</label>
                            <input
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={block.monthTag || ''}
                              onChange={e => updateContentBlock(block.id, { monthTag: e.target.value })}
                              placeholder="例如：January in Botswana"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">强调色（可选）</label>
                            <input
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={block.highlightColor || '#c0a273'}
                              onChange={e => updateContentBlock(block.id, { highlightColor: e.target.value })}
                              placeholder="#c0a273"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1 mb-2">文本内容</label>
                            <RichTextEditor
                              value={block.text || ''}
                              onChange={(value) => updateContentBlock(block.id, { text: value })}
                              placeholder="输入高亮框内容..."
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'trip_cta' && (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">关联行程</label>
                            <select
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={block.journeyId || ''}
                              onChange={e => updateContentBlock(block.id, { journeyId: e.target.value })}
                            >
                              <option value="">选择行程</option>
                              {journeys.map(j => (
                                <option key={j.id} value={j.id}>{j.title}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">CTA 文本（可选）</label>
                            <input
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={block.ctaText || ''}
                              onChange={e => updateContentBlock(block.id, { ctaText: e.target.value })}
                              placeholder="Trip Inspiration"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Legacy Content Field (for backward compatibility) */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">内容（旧版，如果使用内容块则无需填写）</label>
              <textarea className="w-full border rounded px-3 py-2" value={form.content} onChange={e=>setForm({...form,content:e.target.value})} rows={10} />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">关联 Journeys（向后兼容）</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {journeys.map(j => (
                  <label key={j.id} className="flex items-center gap-2 p-2 border rounded">
                    <input type="checkbox" checked={form.relatedJourneyIds.includes(j.id)} onChange={()=>toggleJourney(j.id)} />
                    <span className="text-sm">{j.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">推荐项（Recommend For You）</label>
              <Text size="sm" className="text-gray-500 mb-4">
                支持混合选择 Journey 和 Article，将显示在文章页面的推荐模块中
              </Text>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Journeys</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                    {journeys.map(j => (
                      <label key={j.id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isRecommendedItemSelected('journey', j.id)} 
                          onChange={() => toggleRecommendedItem('journey', j.id)} 
                        />
                        <span className="text-sm">{j.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-2">Articles</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                    {articles.filter(a => a.status === 'active' && a.id !== target?.id).map(a => (
                      <label key={a.id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isRecommendedItemSelected('article', a.id)} 
                          onChange={() => toggleRecommendedItem('article', a.id)} 
                        />
                        <span className="text-sm">{a.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {(form.recommendedItems || []).length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <Text size="sm" className="font-semibold text-blue-900 mb-2">
                      已选择 {form.recommendedItems.length} 个推荐项：
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {form.recommendedItems.map((item, index) => {
                        const data = item.type === 'journey' 
                          ? journeys.find(j => j.id === item.id)
                          : articles.find(a => a.id === item.id);
                        return data ? (
                          <span key={index} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {item.type === 'journey' ? '🚗' : '📄'} {data.title}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
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
