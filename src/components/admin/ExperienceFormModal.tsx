'use client';

import React, { useState, useEffect } from 'react';
import { Heading, Text, Button } from '@/components/common';
import { X, Save, Upload } from 'lucide-react';
import { uploadAPI } from '@/lib/databaseClient';

interface ExperienceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (experience: any) => void;
  experience?: any;
}

export function ExperienceFormModal({
  isOpen,
  onClose,
  onSuccess,
  experience,
}: ExperienceFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    mainImage: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
    galleryImages: [] as string[],
  });

  useEffect(() => {
    if (experience) {
      setFormData({
        title: experience.title || '',
        location: experience.location || '',
        mainImage: experience.mainImage || '',
        description: experience.description || '',
        status: experience.status || 'active',
        galleryImages: experience.galleryImages || [],
      });
    } else {
      setFormData({
        title: '',
        location: '',
        mainImage: '',
        description: '',
        status: 'active',
        galleryImages: [],
      });
    }
  }, [experience, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'mainImage' | 'galleryImages') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadAPI.uploadImage(file, 'journeys');
      if (field === 'mainImage') {
        handleInputChange('mainImage', url);
      } else {
        handleInputChange('galleryImages', [...formData.galleryImages, url]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('图片上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('请填写标题');
      return;
    }
    setIsSubmitting(true);
    try {
      const url = experience ? `/api/experiences/${experience.id}` : '/api/experiences';
      const method = experience ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          location: formData.location,
          mainImage: formData.mainImage,
          description: formData.description,
          status: formData.status,
          galleryImages: formData.galleryImages,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onSuccess(data.experience || experience);
        onClose();
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = [err.error || '保存失败', err.details, err.hint].filter(Boolean).join('\n');
        alert(msg);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('保存失败，请检查网络或控制台');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <button className="absolute inset-0 w-full h-full" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <Heading level={2}>{experience ? '编辑 Experience' : '添加 Experience'}</Heading>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Experience 标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">地点（如 TOKYO, JAPAN）</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="TOKYO, JAPAN"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">封面图</label>
            <div className="flex gap-2 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'mainImage')}
                className="hidden"
                id="main-image-upload"
              />
              <label
                htmlFor="main-image-upload"
                className="px-3 py-2 border border-gray-300 rounded-lg cursor-pointer flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? '上传中...' : '上传'}
              </label>
              {formData.mainImage && (
                <img
                  src={formData.mainImage}
                  alt="封面"
                  className="w-20 h-20 object-cover rounded"
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">详细描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="弹窗中显示的详细描述"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-1" />
              {isSubmitting ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
