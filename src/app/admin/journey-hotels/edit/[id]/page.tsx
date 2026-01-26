'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { uploadAPI } from '@/lib/databaseClient';

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
    status: 'active'
  });

  useEffect(() => {
    if (!user || user.email !== 'admin@korascale.com') {
      router.push('/');
      return;
    }
    fetchHotel();
  }, [user, router, hotelId]);

  const fetchHotel = async () => {
    try {
      const res = await fetch(`/api/journey-hotels/${hotelId}`);
      if (res.ok) {
        const data = await res.json();
        const hotel = data.hotel;
        setFormData({
          name: hotel.name || '',
          location: hotel.location || '',
          image: hotel.image || '',
          status: hotel.status || 'active'
        });
      }
    } catch (error) {
      console.error('Error fetching hotel:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      const res = await fetch(`/api/journey-hotels/${hotelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
      <Section background="white" padding="lg">
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
                      <img src={formData.image} alt="Preview" className="w-48 h-64 object-cover rounded" />
                    </div>
                  )}
                </div>
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
