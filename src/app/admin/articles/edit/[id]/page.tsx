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
    slug: ''
  });

  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);

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
      const { savedToDatabase } = await updateArticle(target.id, {
        ...form,
        metaDescription,
        contentBlocks: form.contentBlocks.length > 0 ? form.contentBlocks : undefined
      });
      if (savedToDatabase) {
        alert('已保存到数据库。刷新页面后仍会保留。');
      } else {
        alert('保存失败：未能写入数据库，仅保存到本地。请检查网络或联系管理员。');
      }
      router.push('/admin/articles');
    } catch (error) {
      console.error('[EditArticle] Error updating article:', error);
      alert('更新文章时出错，请检查控制台');
    }
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
                            <input
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={block.imageSrc || ''}
                              onChange={e => updateContentBlock(block.id, { imageSrc: e.target.value })}
                              placeholder="图片 URL"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">图片说明</label>
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
