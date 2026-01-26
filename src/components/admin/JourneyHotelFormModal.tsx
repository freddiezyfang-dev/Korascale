'use client';

import React, { useState, useEffect } from 'react';
import { Heading, Text, Button } from '@/components/common';
import { X, Save, Upload } from 'lucide-react';
import { uploadAPI } from '@/lib/databaseClient';

interface JourneyHotelFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (hotel: any) => void;
  hotel?: any; // 如果提供，则为编辑模式
}

export function JourneyHotelFormModal({ isOpen, onClose, onSuccess, hotel }: JourneyHotelFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    image: '',
    status: 'active'
  });

  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name || '',
        location: hotel.location || '',
        image: hotel.image || '',
        status: hotel.status || 'active'
      });
    } else {
      setFormData({
        name: '',
        location: '',
        image: '',
        status: 'active'
      });
    }
  }, [hotel, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const imageUrl = await uploadAPI(file, 'journeys');
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
      const url = hotel ? `/api/journey-hotels/${hotel.id}` : '/api/journey-hotels';
      const method = hotel ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        const createdHotel = data.hotel || hotel;
        onSuccess(createdHotel);
        onClose();
      } else {
        const error = await res.json();
        alert(`操作失败: ${error.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Error saving hotel:', error);
      alert('操作失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="flex min-h-full items-center justify-center p-4 relative z-10">
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <Heading level={2} className="text-xl font-semibold">
              {hotel ? '编辑 Hotel' : '添加 Journey Hotel'}
            </Heading>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
            <div className="p-6 space-y-6">
              {/* 基本信息 */}
              <div>
                <Heading level={3} className="text-lg font-semibold mb-4">基本信息</Heading>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent prose-force-wrap"
                      placeholder="例如：The Ritz Carlton, Osaka"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">地点描述</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent prose-force-wrap"
                      placeholder="例如：Osaka, Japan"
                    />
                  </div>
                </div>
              </div>

              {/* 图片上传 */}
              <div>
                <Heading level={3} className="text-lg font-semibold mb-4">图片（竖版，3:4 比例）</Heading>
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
                      <img src={formData.image} alt="Preview" className="w-32 h-40 object-cover rounded" />
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
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50">
              <Button type="button" variant="secondary" onClick={onClose}>
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? '保存中...' : (hotel ? '保存更改' : '创建 Hotel')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
