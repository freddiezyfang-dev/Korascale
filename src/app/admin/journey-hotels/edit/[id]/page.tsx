'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { uploadAPI } from '@/lib/databaseClient';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { getRenderableImageUrl } from '@/lib/imageUtils';

export default function EditJourneyHotelPage() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const hotelId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    image: '',
    status: 'active',
    galleryImages: [] as string[],
    longDescription: ''
  });

  useEffect(() => {
    if (!user || user.email !== 'admin@korascale.com') {
      router.push('/');
      return;
    }
    const loadHotel = async () => {
      try {
        const res = await fetch(`/api/journey-hotels/${hotelId}`);
        if (res.ok) {
          const data = await res.json();
          const hotel = data.hotel;
          setFormData({
            name: hotel.name || '',
            location: hotel.location || '',
            image: hotel.image || '',
            status: hotel.status || 'active',
            galleryImages: (hotel.galleryImages as string[] | undefined) || hotel.data?.galleryImages || [],
            longDescription: (hotel.longDescription as string | undefined) || hotel.data?.longDescription || ''
          });
        }
      } catch (error) {
        console.error('Error fetching hotel:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadHotel();
  }, [user, router, hotelId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const imageUrl = await uploadAPI.uploadImage(file, 'journeys');
      handleInputChange('image', imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('图片上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('请填写酒店名称');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        location: formData.location,
        image: formData.image,
        status: formData.status,
        galleryImages: formData.galleryImages,
        longDescription: formData.longDescription,
      };

      const res = await fetch(`/api/journey-hotels/${hotelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Hotel 更新成功！');
        router.push('/admin/journey-hotels');
      } else {
        const error = await res.json();
        alert(`更新失败: ${error.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Error updating hotel:', error);
      alert('更新失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Text>加载中...</Text>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Section background="primary" padding="lg">
        <Container size="xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="secondary" onClick={() => router.push('/admin/journey-hotels')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <Heading level={1} className="text-3xl font-bold">编辑 Journey Hotel</Heading>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="p-6 space-y-6">
              {/* 基本信息 */}
              <div>
                <Heading level={2} className="text-xl font-semibold mb-4">基本信息</Heading>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      酒店名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="例如：The Ritz Carlton, Osaka"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">地点描述</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="例如：Osaka, Japan"
                    />
                  </div>
                </div>
              </div>

              {/* 图片上传 */}
              <div>
                <Heading level={2} className="text-xl font-semibold mb-4">图片（竖版，3:4 比例）</Heading>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">图片 URL</label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => handleInputChange('image', e.target.value)}
                      placeholder="或上传图片"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">或上传图片</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {isUploading && <Text size="sm" className="text-gray-500 mt-2">上传中...</Text>}
                  </div>
                  {formData.image && (
                    <div className="mt-4">
                      <img src={getRenderableImageUrl(formData.image)} alt="Preview" className="w-48 h-64 object-cover rounded" />
                    </div>
                  )}
                </div>
              </div>

              {/* 多图图库 */}
              <div>
                <Heading level={2} className="text-xl font-semibold mb-4">酒店图库（可选，多图轮播）</Heading>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    {formData.galleryImages.map((url, idx) => (
                      <div key={idx} className="relative w-24 h-32 rounded overflow-hidden bg-gray-100">
                        <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded"
                          onClick={() =>
                            setFormData(prev => ({
                              ...prev,
                              galleryImages: prev.galleryImages.filter((_, i) => i !== idx),
                            }))
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {formData.galleryImages.length === 0 && (
                      <Text size="sm" className="text-gray-500">
                        暂无图库图片，可通过下方按钮上传。
                      </Text>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <Upload className="w-4 h-4 mr-2" />
                      <span className="text-sm text-gray-700">上传图库图片</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploading(true);
                          try {
                            const url = await uploadAPI.uploadImage(file, 'journeys');
                            setFormData(prev => ({
                              ...prev,
                              galleryImages: [...prev.galleryImages, url],
                            }));
                          } catch (error) {
                            console.error('Error uploading gallery image:', error);
                            alert('图库图片上传失败');
                          } finally {
                            setIsUploading(false);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>
                    {isUploading && (
                      <Text size="sm" className="text-gray-500">
                        上传中…
                      </Text>
                    )}
                  </div>
                </div>
              </div>

              {/* 详细描述（富文本） */}
              <div>
                <Heading level={2} className="text-xl font-semibold mb-4">详细描述（用于 Journey 详情页弹窗）</Heading>
                <RichTextEditor
                  value={formData.longDescription}
                  onChange={(val) => setFormData(prev => ({ ...prev, longDescription: val }))}
                  placeholder="请输入酒店的详细介绍，例如设计理念、服务亮点、推荐房型等…"
                />
              </div>

              {/* 状态 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* 提交按钮 */}
              <div className="flex items-center gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? '保存中...' : '保存更改'}
                </Button>
                <Button variant="secondary" onClick={() => router.push('/admin/journey-hotels')}>
                  取消
                </Button>
              </div>
            </Card>
          </form>
        </Container>
      </Section>
    </div>
  );
}
