'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { useExperienceManagement } from '@/context/ExperienceManagementContext';
import { useHotelManagement } from '@/context/HotelManagementContext';
import { Journey, JourneyStatus, JourneyType } from '@/types';
import { uploadAPI, JourneyPublishIntegrityClientError, type JourneyPublishFieldError } from '@/lib/databaseClient';
import { PageGenerationHelper } from '@/components/admin/PageGenerationHelper';
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  Star
} from 'lucide-react';

const categoryOptions = [
  'Nature', 'Culture', 'History', 'City', 'Cruises'
];

const journeyTypeOptions: JourneyType[] = [
  'Explore Together',
  'Deep Discovery',
  'Signature Journeys'
];


const regionOptions = [
  'Southwest China',
  'Northwest&Northern Frontier',
  'North China',
  'South China',
  'East&Central China'
];

const placeOptions = [
  'Tibetan Plateau & Kham Region',
  'Yunnan–Guizhou Highlands',
  'Sichuan Basin & Mountains',
  'Chongqing & Three Gorges',
  'Zhangjiajie',
  'Silk Road Corridor',
  'Qinghai–Tibet Plateau',
  'Xi\'an',
  'Xinjiang Oases & Deserts',
  'Inner Mongolian Grasslands',
  'Beijing',
  'Loess & Shanxi Heritage',
  'Northeastern Forests',
  'Canton',
  'Guilin',
  'Hakka Fujian',
  'Wuhan',
  'Shanghai',
  'WaterTowns',
  'Hangzhou',
  'Yellow Mountain & Southern Anhui'
];

import { JOURNEY_ADMIN_STATUS_OPTIONS } from '@/lib/journeyNormalization/write';

const statusOptions = JOURNEY_ADMIN_STATUS_OPTIONS;

// 预设的标准服务列表（基于 A&K 风格）
const STANDARD_INCLUDES = [
  'English-Speaking Resident Tour Director® and Local Guides',
  'Airport Meet and Greet with Private Transfers',
  'Travelling Bell Boy® Luggage Handling',
  'Traveller\'s Valet® Laundry Service',
  'Internet Access',
  'Entrance Fees, Taxes and All Gratuities Except Resident Tour Director',
  '24/7 A&K On-Call Support',
  'Accommodation',
  'Meals',
  'Domestic Flights',
  'Travel Insurance',
  'Visa Support',
  'Local Guide',
  'Airport Transfers',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Hotel',
  'Transportation',
];

export default function AddJourneyPage() {
  const { user } = useUser();
  const { addJourney } = useJourneyManagement();
  const { experiences } = useExperienceManagement();
  const { hotels } = useHotelManagement();
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<Journey>>({
    title: '',
    description: '',
    shortDescription: '',
    image: '',
    images: [],
    duration: '',
    price: 0,
    originalPrice: 0,
    category: 'Nature',
    journeyType: 'Explore Together',
    region: 'Southwest China',
    place: '',
    city: '',
    location: '',
    maxParticipants: 12,
    minParticipants: 2,
    included: [],
    excluded: [],
    highlights: [],
    itinerary: [],
    modules: [],
    experiences: [],
    accommodations: [],
    requirements: [],
    bestTimeToVisit: [],
    rating: 0,
    reviewCount: 0,
    status: 'draft',
    featured: false,
    tags: [],
    overview: {
      breadcrumb: [],
      description: '',
      highlights: [],
      sideImage: ''
    },
    includes: '',
    excludes: '',
    slug: '',
    standardInclusions: {
      airportTransfers: false,
      entranceFees: false,
      support24_7: false,
      insurance: false,
      meals: false,
      transportation: false,
      accommodations: false
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [publishErrors, setPublishErrors] = useState<JourneyPublishFieldError[]>([]);

  // 辅助函数：从duration字符串中提取数字
  const parseDurationDays = (duration: string | undefined): number => {
    if (!duration) return 1;
    const match = duration.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  };

  // 辅助函数：将数字格式化为duration字符串
  const formatDuration = (days: number): string => {
    if (days <= 0) return '1 Day';
    return days === 1 ? '1 Day' : `${days} Days`;
  };

  const handleInputChange = (field: string, value: any) => {
    setPublishErrors([]);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理duration输入（只接受数字，自动格式化）
  const handleDurationChange = (value: string) => {
    // 只允许数字
    const numValue = value.replace(/\D/g, '');
    if (numValue === '') {
      handleInputChange('duration', '');
      return;
    }
    const days = parseInt(numValue, 10);
    if (!isNaN(days) && days > 0) {
      handleInputChange('duration', formatDuration(days));
    }
  };

  const handleArrayInputChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof Journey] as string[]).map((item, i) => i === index ? value : item)
    }));
  };

  const handleAddArrayItem = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field as keyof Journey] as string[] || []), '']
    }));
  };

  const handleRemoveArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof Journey] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadAPI.uploadImage(file, 'journeys');
      handleInputChange('image', imageUrl);
      alert('图片上传成功！');
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('图片上传失败，请重试');
    } finally {
      setIsUploading(false);
      // 重置 input 值，以便可以重复选择同一文件
      event.target.value = '';
    }
  };

  const handleItineraryImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, dayIndex: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadAPI.uploadImage(file, 'journeys');
      const source = formData.itinerary || [];
      
      // 检查 dayIndex 是否有效
      if (dayIndex < 0 || dayIndex >= source.length) {
        console.error('Invalid dayIndex:', dayIndex, 'itinerary length:', source.length);
        alert('无效的行程索引，请刷新页面重试');
        return;
      }

      const newItinerary = [...source];
      const currentDay = newItinerary[dayIndex];
      
      if (!currentDay) {
        console.error('Day not found at index:', dayIndex);
        alert('找不到对应的行程，请刷新页面重试');
        return;
      }

      newItinerary[dayIndex] = { ...currentDay, image: imageUrl };
      updateItinerary(newItinerary);
      alert('图片上传成功！');
    } catch (error) {
      console.error('Image upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      alert(`图片上传失败：${errorMessage}。请检查控制台获取详细信息。`);
    } finally {
      setIsUploading(false);
      // 重置 input 值，以便可以重复选择同一文件
      event.target.value = '';
    }
  };

  // 处理inclusions结构的变化

  // 规范化与统一更新行程（保证 day 序号连续从1开始）
  const normalizeItinerary = (items: Array<any>) => items.map((d, i) => ({ ...d, day: i + 1 }));
  const updateItinerary = (items: Array<any>) => {
    const normalized = normalizeItinerary(items);
    handleInputChange('itinerary', normalized);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPublishErrors([]);

    try {
      const submitData = { ...formData };
      if (submitData.duration && /^\d+$/.test(submitData.duration.trim())) {
        const days = parseInt(submitData.duration.trim(), 10);
        if (!isNaN(days) && days > 0) {
          submitData.duration = formatDuration(days);
        }
      }

      await addJourney(submitData as Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>);
      router.push('/admin/journeys');
    } catch (error) {
      console.error('Error creating journey:', error);
      if (error instanceof JourneyPublishIntegrityClientError) {
        setPublishErrors(error.fields);
        alert('Not ready to publish. Please fix the highlighted fields.');
        return;
      }
      alert('创建旅行卡片时出错，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 检查用户权限
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heading level={1} className="text-2xl font-bold mb-4">
            Access Denied
          </Heading>
          <Text className="text-gray-600 mb-4">
            You don't have permission to access the admin panel
          </Text>
          <Button onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Section background="primary" padding="xl">
        <Container size="xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => router.push('/admin/journeys')}
                  variant="secondary"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Journeys
                </Button>
                <div>
                  <Heading level={1} className="text-3xl font-bold mb-2">
                    Add New Journey
                  </Heading>
                  <Text size="lg" className="text-gray-600">
                    Create a new travel experience
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {publishErrors.length > 0 && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
              <Text className="font-semibold text-red-800">Not ready to publish</Text>
              <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
                {publishErrors.map((error) => (
                  <li key={`${error.field}-${error.code}`}>
                    {error.field}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <Card className="p-6">
                  <Heading level={2} className="text-xl font-semibold mb-4">Basic Information</Heading>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                      <input
                        type="text"
                        value={formData.shortDescription || ''}
                        onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Main Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Main Image <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.image || ''}
                          onChange={(e) => handleInputChange('image', e.target.value)}
                          required
                          placeholder="图片URL（上传后会自动填充）或输入路径，例如：/images/journey-cards/xxx.jpg 或 https://xxx.public.blob.vercel-storage.com/..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="hidden"
                          id="main-image-upload-input"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={isUploading}
                          className="flex items-center gap-2"
                          onClick={() => document.getElementById('main-image-upload-input')?.click()}
                        >
                          <Upload className="w-4 h-4" />
                          {isUploading ? '上传中...' : '上传'}
                        </Button>
                      </div>
                      <Text size="sm" className="text-gray-500 mt-1">
                        {(() => {
                          if (!formData.image) {
                            return '💡 提示：点击"上传"按钮可将图片上传到 Vercel Blob 云存储，或直接输入图片URL（支持本地路径 /images/... 或云存储URL）';
                          } else if (formData.image.startsWith('https://') && formData.image.includes('vercel-storage.com')) {
                            return '✅ 云存储URL（已上传到 Vercel Blob 云存储）';
                          } else if (formData.image.startsWith('/')) {
                            return '💡 本地路径（存储在 public 目录），建议使用"上传"按钮上传到云存储';
                          } else {
                            return '💡 外部URL或云存储URL';
                          }
                        })()}
                      </Text>
                      {formData.image && (
                        <div className="mt-3">
                          <img
                            src={formData.image}
                            alt="Main image preview"
                            className="w-full h-40 object-cover rounded-lg border border-gray-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          value={formData.category || 'Food'}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          {categoryOptions.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Journey Type</label>
                        <select
                          value={formData.journeyType || 'Explore Together'}
                          onChange={(e) => handleInputChange('journeyType', e.target.value as JourneyType)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          {journeyTypeOptions.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                        <select
                        value={formData.region || 'Southwest China'}
                          onChange={(e) => handleInputChange('region', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          {regionOptions.map(region => (
                            <option key={region} value={region}>{region}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
                        <select
                          value={formData.place || ''}
                          onChange={(e) => handleInputChange('place', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Select Place (Optional)</option>
                          {placeOptions.map(place => (
                            <option key={place} value={place}>{place}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Pricing and Duration */}
                <Card className="p-6">
                  <Heading level={2} className="text-xl font-semibold mb-4">Pricing & Duration</Heading>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={formData.duration ? parseDurationDays(formData.duration) : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              handleDurationChange('');
                            } else {
                              const days = parseInt(value, 10);
                              if (!isNaN(days) && days > 0) {
                                handleDurationChange(days.toString());
                              }
                            }
                          }}
                          placeholder="Enter days"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {formData.duration ? formatDuration(parseDurationDays(formData.duration)) : 'Day(s)'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price || 0}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination Count</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.destinationCount || 0}
                        onChange={(e) => handleInputChange('destinationCount', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <Text size="sm" className="text-gray-500 mt-1">
                        For hero banner display
                      </Text>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.maxGuests || 0}
                        onChange={(e) => handleInputChange('maxGuests', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <Text size="sm" className="text-gray-500 mt-1">
                        For hero banner display
                      </Text>
                    </div>
                  </div>
                </Card>

                {/* Overview Content & Highlights */}
                <Card className="p-6">
                  <Heading level={2} className="text-xl font-semibold mb-4">Overview Content & Highlights</Heading>
                  <div className="space-y-4">
                    {/* Overview Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Overview Description</label>
                      <textarea
                        value={formData.overview?.description || formData.description || ''}
                        onChange={(e) =>
                          handleInputChange('overview', { ...formData.overview, description: e.target.value })
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter detailed overview description"
                      />
                    </div>

                    {/* Overview Side Image (左侧图片上传/URL) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Overview Side Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.overview?.sideImage || ''}
                          onChange={(e) =>
                            handleInputChange('overview', {
                              ...formData.overview,
                              sideImage: e.target.value,
                            })
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="图片URL（上传后会自动填充）或输入路径，例如：/images/... 或 https://xxx.public.blob.vercel-storage.com/..."
                        />
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploading}
                            className="hidden"
                            id="overview-side-image-upload-add"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;

                              if (!file.type.startsWith('image/')) {
                                alert('请选择图片文件');
                                return;
                              }

                              setIsUploading(true);
                              try {
                                const imageUrl = await uploadAPI.uploadImage(file, 'journeys');
                                handleInputChange('overview', {
                                  ...formData.overview,
                                  sideImage: imageUrl,
                                });
                                alert('图片上传成功！');
                              } catch (error) {
                                console.error('Overview side image upload failed:', error);
                                alert('图片上传失败，请重试');
                              } finally {
                                setIsUploading(false);
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={isUploading}
                            className="flex items-center gap-2"
                            onClick={() =>
                              document.getElementById('overview-side-image-upload-add')?.click()
                            }
                          >
                            <Upload className="w-4 h-4" />
                            {isUploading ? '上传中...' : '上传'}
                          </Button>
                        </>
                      </div>
                      <Text size="sm" className="text-gray-500 mt-1">
                        该图片用于 Journey 详情页 Overview &amp; Highlights 区域左侧展示。
                      </Text>

                      {/* 预览 */}
                      <div className="mt-3">
                        {(() => {
                          const previewUrl = formData.overview?.sideImage || '';
                          return previewUrl ? (
                            <img
                              src={previewUrl}
                              alt="Overview side preview"
                              className="w-full h-40 object-cover rounded-lg"
                            />
                          ) : null;
                        })()}
                      </div>
                    </div>

                    {/* Overview Highlights */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Overview Highlights</label>
                      <div className="space-y-4">
                        {(formData.overview?.highlights || []).map((highlight: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <Heading level={4} className="text-sm font-semibold">Highlight {index + 1}</Heading>
                              <Button
                                onClick={() => {
                                  const currentHighlights = formData.overview?.highlights || [];
                                  const newHighlights = currentHighlights.filter((_: any, i: number) => i !== index);
                                  handleInputChange('overview', {
                                    ...formData.overview,
                                    highlights: newHighlights,
                                  });
                                }}
                                variant="secondary"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
                              <textarea
                                value={highlight.description || highlight.title || ''}
                                onChange={(e) => {
                                  const currentHighlights = formData.overview?.highlights || [];
                                  const newHighlights = [...currentHighlights];
                                  newHighlights[index] = {
                                    ...highlight,
                                    title: '',
                                    description: e.target.value,
                                  };
                                  handleInputChange('overview', {
                                    ...formData.overview,
                                    highlights: newHighlights,
                                  });
                                }}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="输入highlight内容（支持换行）"
                              />
                            </div>
                          </div>
                        ))}
                        <Button
                          onClick={() => {
                            const currentHighlights = formData.overview?.highlights || [];
                            handleInputChange('overview', {
                              ...formData.overview,
                              highlights: [...currentHighlights, { title: '', description: '' }],
                            });
                          }}
                          variant="secondary"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Highlight
                        </Button>
                      </div>
                      <Text size="sm" className="text-gray-500 mt-2">
                        这些highlights会显示在journey详情页面的overview部分。支持换行显示。
                      </Text>
                    </div>
                  </div>
                </Card>

                {/* Daily Itinerary */}
                <Card className="p-6">
                  <Heading level={2} className="text-xl font-semibold mb-4">Daily Itinerary</Heading>
                  <div className="space-y-4">
                    {(formData.itinerary || []).map((day, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Heading level={3} className="text-lg font-semibold">Day {day.day}</Heading>
                          <Button
                            onClick={() => {
                              const newItinerary = (formData.itinerary || []).filter((_, i) => i !== index);
                              updateItinerary(newItinerary);
                            }}
                            variant="secondary"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Day Title</label>
                            <input
                              type="text"
                              value={day.title}
                              onChange={(e) => {
                                const newItinerary = [...(formData.itinerary || [])];
                                newItinerary[index] = { ...day, title: e.target.value };
                                updateItinerary(newItinerary);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={day.description}
                              onChange={(e) => {
                                const newItinerary = [...(formData.itinerary || [])];
                                newItinerary[index] = { ...day, description: e.target.value };
                                updateItinerary(newItinerary);
                              }}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={day.image || ''}
                                onChange={(e) => {
                                  const newItinerary = [...(formData.itinerary || [])];
                                  newItinerary[index] = { ...day, image: e.target.value };
                                  updateItinerary(newItinerary);
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="图片URL（上传后会自动填充）或输入路径，例如：/images/... 或 https://xxx.public.blob.vercel-storage.com/..."
                              />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleItineraryImageUpload(e, index)}
                                disabled={isUploading}
                                className="hidden"
                                id={`itinerary-image-upload-${index}`}
                              />
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={isUploading}
                                className="flex items-center gap-2"
                                onClick={() => document.getElementById(`itinerary-image-upload-${index}`)?.click()}
                              >
                                <Upload className="w-4 h-4" />
                                {isUploading ? '上传中...' : '上传'}
                              </Button>
                            </div>
                            <Text size="sm" className="text-gray-500 mt-1">
                              {(() => {
                                const currentImage = day.image || '';
                                if (currentImage?.startsWith('https://') && currentImage.includes('vercel-storage.com')) {
                                  return '✅ 云存储URL（已上传到 Vercel Blob 云存储）';
                                } else if (currentImage?.startsWith('/')) {
                                  return '💡 本地路径（存储在 public 目录），建议使用"上传"按钮上传到云存储';
                                } else if (currentImage) {
                                  return '💡 外部URL或云存储URL';
                                }
                                return '💡 提示：点击"上传"按钮可将图片上传到 Vercel Blob 云存储，或直接输入图片URL';
                              })()}
                            </Text>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      onClick={() => {
                        const base = formData.itinerary || [];
                        const newItinerary = [...base, { day: base.length + 1, title: '', description: '', image: '' }];
                        updateItinerary(newItinerary);
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Day
                    </Button>
                  </div>
                </Card>

                {/* Standard Inclusions & Offers */}
                <Card className="p-6">
                  <div className="space-y-6">
                    {/* Standard Inclusions - 标准化 Checkbox 模式 */}
                    <div>
                      <Heading level={3} className="text-lg font-semibold mb-4">Standard Inclusions</Heading>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          选择包含的标准化服务（勾选后会在前端显示）
                        </label>
                        <div className="space-y-3 border border-gray-200 rounded-lg p-4">
                          {[
                            { key: 'airportTransfers', label: 'Airport Meet and Greet with Private Transfers' },
                            { key: 'entranceFees', label: 'Entrance Fees, Taxes and All Gratuities Except Resident Tour Director' },
                            { key: 'support24_7', label: '24/7 On-Call Support' },
                            { key: 'insurance', label: 'Comprehensive Travel Insurance' },
                            { key: 'meals', label: 'Daily Breakfast, Lunch, and Dinner' },
                            { key: 'transportation', label: 'Premium Private Transportation' },
                            { key: 'accommodations', label: 'Hand-selected Luxury Hotels' },
                            { key: 'tourGuides', label: 'English-speaking or other language-speaking tour guides' },
                            { key: 'highSpeedRails', label: 'Mainland China domestic High-speed rails' },
                            { key: 'internationalFlights', label: 'International flights to and from Mainland China' },
                            { key: 'optionalActivities', label: 'Optional activities available for purchase on-site' },
                            { key: 'handicraftExperiences', label: 'Authentic local handicraft experiences' },
                            { key: 'personalExpenses', label: 'Personal expenses during leisure time' },
                          ].map((item) => {
                            const isChecked = formData.standardInclusions?.[item.key as keyof typeof formData.standardInclusions] || false;
                            return (
                              <label
                                key={item.key}
                                className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    handleInputChange('standardInclusions', {
                                      ...formData.standardInclusions,
                                      [item.key]: e.target.checked
                                    });
                                  }}
                                  className="mt-1 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                              </label>
                            );
                          })}
                        </div>
                        <Text size="sm" className="text-gray-500 mt-2">
                          已选择 {Object.values(formData.standardInclusions || {}).filter(Boolean).length} 项标准化服务
                        </Text>
                      </div>
                    </div>

                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Experience Management */}
                <Card className="p-6">
                  <Heading level={2} className="text-xl font-semibold mb-4">Experience Management</Heading>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Available Experiences
                      </label>
                      <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                        {experiences.filter(exp => exp.status === 'active').map((experience) => (
                          <div key={experience.id} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`exp-${experience.id}`}
                              checked={(formData.availableExperiences || []).includes(experience.id)}
                              onChange={(e) => {
                                const currentExps = formData.availableExperiences || [];
                                const newExps = e.target.checked 
                                  ? [...currentExps, experience.id]
                                  : currentExps.filter(id => id !== experience.id);
                                handleInputChange('availableExperiences', newExps);
                              }}
                              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <label htmlFor={`exp-${experience.id}`} className="flex-1 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <Text className="font-medium text-sm">{experience.title}</Text>
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                  {experience.city}
                                </span>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Experiences for This Journey
                      </label>
                      <div className="space-y-2">
                        {(formData.experiences || []).map((expId) => {
                          const exp = experiences.find(e => e.id === expId);
                          if (!exp) return null;
                          return (
                            <div key={expId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center justify-between w-full">
                                <Text className="text-sm font-medium">{exp.title}</Text>
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                  {exp.city}
                                </span>
                              </div>
                              <Button
                                onClick={() => {
                                  const currentExps = formData.experiences || [];
                                  const newExps = currentExps.filter(id => id !== expId);
                                  handleInputChange('experiences', newExps);
                                }}
                                variant="secondary"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                        {((formData.experiences || []).length === 0) && (
                          <Text className="text-gray-500 text-sm">No experiences selected</Text>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Accommodation Management */}
                <Card className="p-6">
                  <Heading level={2} className="text-xl font-semibold mb-4">Accommodation Management</Heading>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Available Accommodations
                      </label>
                      <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                        {hotels.filter(hotel => hotel.status === 'active').map((hotel) => {
                          const isInAvailable = (formData.availableAccommodations || []).includes(hotel.id);
                          const isSelected = (formData.accommodations || []).includes(hotel.id);
                          return (
                            <div key={hotel.id} className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id={`hotel-${hotel.id}`}
                                checked={isInAvailable}
                                onChange={(e) => {
                                  const currentHotels = formData.availableAccommodations || [];
                                  const newHotels = e.target.checked 
                                    ? [...currentHotels, hotel.id]
                                    : currentHotels.filter(id => id !== hotel.id);
                                  handleInputChange('availableAccommodations', newHotels);
                                }}
                                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <label htmlFor={`hotel-${hotel.id}`} className="flex-1 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <Text className="font-medium text-sm">{hotel.name}</Text>
                                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                    {hotel.city}
                                  </span>
                                </div>
                              </label>
                              {isInAvailable && !isSelected && (
                                <Button
                                  onClick={() => {
                                    const currentSelected = formData.accommodations || [];
                                    handleInputChange('accommodations', [...currentSelected, hotel.id]);
                                  }}
                                  variant="primary"
                                  size="sm"
                                  className="ml-2"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Accommodations for This Journey
                      </label>
                      <div className="space-y-2">
                        {(formData.accommodations || []).map((hotelId) => {
                          const hotel = hotels.find(h => h.id === hotelId);
                          if (!hotel) return null;
                          return (
                            <div key={hotelId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center justify-between w-full">
                                <Text className="text-sm font-medium">{hotel.name}</Text>
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                  {hotel.city}
                                </span>
                              </div>
                              <Button
                                onClick={() => {
                                  const currentHotels = formData.accommodations || [];
                                  const newHotels = currentHotels.filter(id => id !== hotelId);
                                  handleInputChange('accommodations', newHotels);
                                }}
                                variant="secondary"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                        {((formData.accommodations || []).length === 0) && (
                          <Text className="text-gray-500 text-sm">No accommodations selected</Text>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Status and Settings */}
                <Card className="p-6">
                  <Heading level={2} className="text-xl font-semibold mb-4">Status & Settings</Heading>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={formData.status || 'draft'}
                        onChange={(e) => handleInputChange('status', e.target.value as JourneyStatus)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={formData.featured || false}
                        onChange={(e) => handleInputChange('featured', e.target.checked)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                        Featured Journey
                      </label>
                    </div>
                  </div>
                </Card>

              {/* Page Management */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">Page Management</Heading>
                <div className="space-y-6">
                  {/* URL Configuration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL Configuration</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Journey Slug</label>
                        <input
                          type="text"
                          value={formData.slug || ''}
                          onChange={(e) => handleInputChange('slug', e.target.value)}
                          placeholder="e.g., chengdu-city-one-day-deep-dive"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <Text size="sm" className="text-gray-500 mt-1">
                          Journey URL: /journeys/[slug]
                        </Text>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Region for Destinations</label>
                        <select
                          value={formData.region || ''}
                          onChange={(e) => handleInputChange('region', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Select Region</option>
                          <option value="Sichuan">Sichuan</option>
                          <option value="Gansu">Gansu</option>
                          <option value="Shaanxi">Shaanxi</option>
                          <option value="Xinjiang">Xinjiang</option>
                        </select>
                        <Text size="sm" className="text-gray-500 mt-1">
                          Destination URL: /destinations/[region]
                        </Text>
                      </div>
                    </div>
                  </div>

                  {/* URL Preview */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Text size="sm" className="text-gray-600 mb-2 font-medium">URL Preview:</Text>
                    <div className="space-y-2">
                      {formData.slug && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <Text size="sm" className="text-gray-700">
                            Journey: <code className="bg-white px-2 py-1 rounded text-blue-600">/journeys/{formData.slug}</code>
                          </Text>
                        </div>
                      )}
                      {formData.region && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <Text size="sm" className="text-gray-700">
                            Destination: <code className="bg-white px-2 py-1 rounded text-blue-600">/destinations/{formData.region.toLowerCase()}</code>
                          </Text>
                        </div>
                      )}
                      {!formData.slug && !formData.region && (
                        <Text size="sm" className="text-gray-500 italic">
                          Configure slug and region to see URL previews
                        </Text>
                      )}
                    </div>
                  </div>

                  {/* URL Validation */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <Text size="sm" className="text-blue-800 mb-2 font-medium">URL Strategy:</Text>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Journey slug creates: <code>/journeys/[slug]</code></li>
                      <li>• Region creates: <code>/destinations/[region]</code></li>
                      <li>• Both URLs will show the same journey content</li>
                      <li>• Region-based filtering happens automatically</li>
                    </ul>
                  </div>
                </div>
              </Card>

                {/* Page Generation Helper - 暂时禁用 */}
                {/* <PageGenerationHelper
                  journey={formData as Journey}
                  onUpdateJourney={(id, updates) => {
                    handleInputChange(Object.keys(updates)[0], Object.values(updates)[0]);
                  }}
                  allJourneys={[]} // 这里可以传入所有旅行卡片用于生成相关推荐
                /> */}

                {/* Image Upload - 备用入口（主入口已在 Basic Information 中） */}
                <Card className="p-6">
                  <Heading level={2} className="text-xl font-semibold mb-4">Images</Heading>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Main Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.image || ''}
                          onChange={(e) => handleInputChange('image', e.target.value)}
                          required
                          placeholder="图片URL（上传后会自动填充）或输入路径，例如：/images/journey-cards/xxx.jpg 或 https://xxx.public.blob.vercel-storage.com/..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="hidden"
                          id="image-upload-input-sidebar"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={isUploading}
                          className="flex items-center gap-2"
                          onClick={() => document.getElementById('image-upload-input-sidebar')?.click()}
                        >
                          <Upload className="w-4 h-4" />
                          {isUploading ? '上传中...' : '上传'}
                        </Button>
                      </div>
                      <Text size="sm" className="text-gray-500 mt-1">
                        {(() => {
                          const currentImage = formData.image || '';
                          if (currentImage?.startsWith('https://') && currentImage.includes('vercel-storage.com')) {
                            return '✅ 云存储URL（已上传到 Vercel Blob 云存储）';
                          } else if (currentImage?.startsWith('/')) {
                            return '💡 本地路径（存储在 public 目录），建议使用"上传"按钮上传到云存储';
                          } else if (currentImage) {
                            return '💡 外部URL或云存储URL';
                          }
                          return '💡 提示：点击"上传"按钮可将图片上传到 Vercel Blob 云存储，或直接输入图片URL';
                        })()}
                      </Text>
                      {formData.image && (
                        <div className="mt-3">
                          <img
                            src={formData.image}
                            alt="Main image preview"
                            className="w-full h-48 object-cover rounded-lg border border-gray-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Statistics */}
                <Card className="p-6">
                  <Heading level={2} className="text-xl font-semibold mb-4">Statistics</Heading>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Text className="text-sm text-gray-600">Rating</Text>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <Text className="text-sm font-medium">{formData.rating || 0}</Text>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Text className="text-sm text-gray-600">Reviews</Text>
                      <Text className="text-sm font-medium">{formData.reviewCount || 0}</Text>
                    </div>
                    <div className="flex justify-between">
                      <Text className="text-sm text-gray-600">Created</Text>
                      <Text className="text-sm font-medium">
                        {new Date().toLocaleDateString()}
                      </Text>
                    </div>
                    <div className="flex justify-between">
                      <Text className="text-sm text-gray-600">Updated</Text>
                      <Text className="text-sm font-medium">
                        {new Date().toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                </Card>

                {/* Submit Button */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full mb-2"
                      onClick={() => {
                        console.log('Test button clicked!');
                        alert('测试按钮工作正常！');
                      }}
                    >
                      测试按钮
                    </Button>
                    
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full mb-2"
                      onClick={() => {
                        console.log('Direct submit test');
                        handleSubmit(new Event('submit') as any);
                      }}
                    >
                      直接提交测试
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full"
                      disabled={isSubmitting}
                      onClick={(e) => {
                        console.log('Button clicked!', e);
                        console.log('isSubmitting:', isSubmitting);
                        console.log('formData:', formData);
                      }}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {isSubmitting ? 'Creating...' : 'Create Journey'}
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={() => router.push('/admin/journeys')}
                      variant="secondary"
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </form>
        </Container>
      </Section>
    </div>
  );
}
