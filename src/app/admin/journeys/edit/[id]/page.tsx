'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { useExperienceManagement } from '@/context/ExperienceManagementContext';
import { useHotelManagement } from '@/context/HotelManagementContext';
import { Journey, JourneyStatus, JourneyType } from '@/types';
import { PageGenerationHelper } from '@/components/admin/PageGenerationHelper';
import { DeleteConfirmationModal } from '@/components/modals/DeleteConfirmationModal';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import { 
  ArrowLeft,
  Save,
  Eye,
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2,
  Upload,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Star,
  Edit
} from 'lucide-react';
import { ExtensionFormModal } from '@/components/admin/ExtensionFormModal';
import { JourneyHotelFormModal } from '@/components/admin/JourneyHotelFormModal';
import { uploadAPI } from '@/lib/databaseClient';

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

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

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

export default function EditJourneyPage() {
  const { user } = useUser();
  const { journeys, updateJourney, deleteJourney, isLoading } = useJourneyManagement();
  const { experiences } = useExperienceManagement();
  const { hotels } = useHotelManagement();
  const router = useRouter();
  const params = useParams();
  const journeyId = params.id as string;
  const { 
    isModalOpen, 
    isDeleting, 
    deleteOptions, 
    confirmDelete, 
    handleConfirm, 
    handleClose 
  } = useDeleteConfirmation();

  const [journey, setJourney] = useState<Journey | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<Journey>>({});
  const [extensions, setExtensions] = useState<any[]>([]);
  const [journeyHotels, setJourneyHotels] = useState<any[]>([]);
  const [loadingExtensions, setLoadingExtensions] = useState(false);
  const [loadingHotels, setLoadingHotels] = useState(false);
  
  // Modal 状态
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [editingExtension, setEditingExtension] = useState<any>(null);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<any>(null);

  // 获取 Extensions 和 Journey Hotels 列表
  const fetchExtensionsAndHotels = async () => {
    setLoadingExtensions(true);
    setLoadingHotels(true);
    try {
      const [extensionsRes, hotelsRes] = await Promise.all([
        fetch('/api/extensions'),
        fetch('/api/journey-hotels')
      ]);
      if (extensionsRes.ok) {
        const data = await extensionsRes.json();
        setExtensions(data.extensions || []);
      }
      if (hotelsRes.ok) {
        const data = await hotelsRes.json();
        setJourneyHotels(data.hotels || []);
      }
    } catch (error) {
      console.error('Error fetching extensions and hotels:', error);
    } finally {
      setLoadingExtensions(false);
      setLoadingHotels(false);
    }
  };

  useEffect(() => {
    fetchExtensionsAndHotels();
  }, []);

  // Extension Modal 处理函数
  const handleExtensionSuccess = (extension: any) => {
    if (!journey) return;
    
    // 如果是新创建的，添加到列表
    if (!extensions.find(ext => ext.id === extension.id)) {
      setExtensions(prev => [extension, ...prev]);
      // 自动勾选新创建的 extension
      const currentExtensions = isEditing
        ? (formData.extensions || journey.extensions || [])
        : (journey.extensions || []);
      if (!currentExtensions.includes(extension.id)) {
        handleInputChange('extensions', [...currentExtensions, extension.id]);
      }
    } else {
      // 如果是编辑，更新列表中的项
      setExtensions(prev => prev.map(ext => ext.id === extension.id ? extension : ext));
    }
    setEditingExtension(null);
  };

  const handleOpenExtensionModal = (extension?: any) => {
    setEditingExtension(extension || null);
    setExtensionModalOpen(true);
  };

  const handleCloseExtensionModal = () => {
    setExtensionModalOpen(false);
    setEditingExtension(null);
  };

  // Hotel Modal 处理函数
  const handleHotelSuccess = (hotel: any) => {
    if (!journey) return;
    
    // 如果是新创建的，添加到列表
    if (!journeyHotels.find(h => h.id === hotel.id)) {
      setJourneyHotels(prev => [hotel, ...prev]);
      // 自动勾选新创建的 hotel
      const currentHotels = isEditing
        ? (formData.hotels || journey.hotels || [])
        : (journey.hotels || []);
      if (!currentHotels.includes(hotel.id)) {
        handleInputChange('hotels', [...currentHotels, hotel.id]);
      }
    } else {
      // 如果是编辑，更新列表中的项
      setJourneyHotels(prev => prev.map(h => h.id === hotel.id ? hotel : h));
    }
    setEditingHotel(null);
  };

  const handleOpenHotelModal = (hotel?: any) => {
    setEditingHotel(hotel || null);
    setHotelModalOpen(true);
  };

  const handleCloseHotelModal = () => {
    setHotelModalOpen(false);
    setEditingHotel(null);
  };

  useEffect(() => {
    if (!user || user.email !== 'admin@korascale.com') {
      router.push('/');
      return;
    }

    const foundJourney = journeys.find(j => j.id === journeyId);
    if (foundJourney) {
      // 如果 included 数组不存在，但从 includes 文本存在，则解析文本为数组
      const processedJourney = { ...foundJourney };
      if (!processedJourney.included || processedJourney.included.length === 0) {
        if (processedJourney.includes) {
          processedJourney.included = processedJourney.includes
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        } else {
          processedJourney.included = [];
        }
      }
      
      // 确保 availableDates 字段存在
      if (!processedJourney.availableDates) {
        processedJourney.availableDates = [];
      }
      
      // 确保 standardInclusions 字段存在
      if (!processedJourney.standardInclusions) {
        processedJourney.standardInclusions = {};
      }
      
      // 确保 maxGuests 字段存在（从 JSONB data 中读取）
      if (processedJourney.maxGuests === undefined) {
        processedJourney.maxGuests = (processedJourney as any).data?.maxGuests || 0;
      }
      
      setJourney(processedJourney);
      setFormData(processedJourney);
    } else {
      router.push('/admin/journeys');
    }
  }, [journeyId, journeys, user, router]);

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

  const handleExperienceSelection = (experienceId: string, checked: boolean) => {
    if (!journey) return;
    
    const currentExps = isEditing 
      ? (formData.availableExperiences || journey.availableExperiences || [])
      : (journey.availableExperiences || []);
    const newExps = checked 
      ? [...currentExps, experienceId]
      : currentExps.filter(id => id !== experienceId);
    
    if (isEditing) {
      handleInputChange('availableExperiences', newExps);
    } else {
      setJourney(prev => prev ? {
        ...prev,
        availableExperiences: newExps
      } : null);
    }
  };

  const handleAccommodationSelection = (hotelId: string, checked: boolean) => {
    if (!journey) return;
    
    const currentHotels = isEditing
      ? (formData.availableAccommodations || journey.availableAccommodations || [])
      : (journey.availableAccommodations || []);
    const newHotels = checked 
      ? [...currentHotels, hotelId]
      : currentHotels.filter(id => id !== hotelId);
    
    if (isEditing) {
      handleInputChange('availableAccommodations', newHotels);
    } else {
      setJourney(prev => prev ? {
        ...prev,
        availableAccommodations: newHotels
      } : null);
    }
  };

  const handleArrayInputChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof Journey] ? 
        (prev[field as keyof Journey] as string[]).map((item, i) => i === index ? value : item) :
        []
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

  // 处理inclusions结构的变化

  // 规范化与统一更新行程（保证 day 序号连续从1开始）
  const normalizeItinerary = (items: Array<any>) => items.map((d, i) => ({ ...d, day: i + 1 }));
  const updateItinerary = (items: Array<any>) => {
    const normalized = normalizeItinerary(items);
    handleInputChange('itinerary', normalized);
  };

  const handleSave = async () => {
    if (!journey || isSaving) return;
    setIsSaving(true);
    try {
      // 确保duration格式正确（如果只是数字，格式化为"X Day"或"X Days"）
      const saveData = { ...formData };
      if (saveData.duration && /^\d+$/.test(saveData.duration.trim())) {
        const days = parseInt(saveData.duration.trim(), 10);
        if (!isNaN(days) && days > 0) {
          saveData.duration = formatDuration(days);
        }
      }
      
      // 确保 availableDates 字段存在（如果为空数组也要保存）
      if (saveData.availableDates === undefined) {
        saveData.availableDates = [];
      }
      
      // 确保 standardInclusions 字段存在
      if (saveData.standardInclusions === undefined) {
        saveData.standardInclusions = journey.standardInclusions || {};
      }
      
      // 确保 maxParticipants 和 maxGuests 正确传递
      if (saveData.maxParticipants !== undefined) {
        saveData.maxParticipants = parseInt(String(saveData.maxParticipants)) || 0;
      }
      if (saveData.maxGuests !== undefined) {
        saveData.maxGuests = parseInt(String(saveData.maxGuests)) || 0;
      }
      
      // 调试：打印要保存的数据
      console.log('Saving journey data:', {
        journeyId: journey.id,
        maxParticipants: saveData.maxParticipants,
        maxGuests: saveData.maxGuests,
        standardInclusions: saveData.standardInclusions,
        availableDates: saveData.availableDates,
        availableDatesLength: saveData.availableDates?.length || 0,
      });
      
      const updated = await updateJourney(journey.id, saveData);
      
      // 调试：打印保存后的数据
      console.log('Journey saved, updated data:', {
        updated: updated,
        maxParticipants: updated?.maxParticipants,
        maxGuests: updated?.maxGuests,
        standardInclusions: updated?.standardInclusions,
      });
      
      if (updated) {
        setJourney(updated);
        setFormData(updated);
      } else {
        // 如果更新失败，至少更新本地状态
        setJourney({ ...journey, ...saveData });
        setFormData({ ...journey, ...saveData });
      }
      setIsEditing(false);
      alert('保存成功！');
    } catch (e) {
      console.error('Save journey failed:', e);
      alert('保存失败，请稍后重试');
    } finally {
      setIsSaving(false);
    }
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

    if (!journey) {
      alert('Journey 数据未加载');
      return;
    }

    // 检查是否在编辑模式
    if (!isEditing) {
      alert('请先进入编辑模式');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadAPI.uploadImage(file, 'journeys');
      const source = formData.itinerary || journey.itinerary || [];
      
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

  const handleStatusToggle = () => {
    if (journey) {
      const newStatus = journey.status === 'active' ? 'inactive' : 'active';
      updateJourney(journey.id, { status: newStatus });
      setJourney({ ...journey, status: newStatus });
    }
  };

  if (isLoading || !journey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Text className="text-gray-600">Loading journey...</Text>
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
                    {isEditing ? 'Edit Journey' : 'Journey Details'}
                  </Heading>
                  <Text size="lg" className="text-gray-600">
                    {journey.title}
                  </Text>
                </div>
              </div>
              <div className="flex gap-4">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} variant="primary" disabled={isSaving}>
                      <Save className="w-4 h-4 mr-1" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="secondary">
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setIsEditing(true)} variant="primary">
                      <Eye className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button onClick={handleStatusToggle} variant="secondary">
                      {journey.status === 'active' ? (
                        <>
                          <ToggleRight className="w-4 h-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">Basic Information</Heading>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={isEditing ? (formData.title ?? '') : (journey.title ?? '')}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                    <input
                      type="text"
                      value={isEditing ? (formData.shortDescription ?? '') : (journey.shortDescription ?? '')}
                      onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={isEditing ? (formData.category ?? '') : (journey.category ?? '')}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        {categoryOptions.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Journey Type</label>
                      <select
                        value={isEditing ? (formData.journeyType ?? '') : (journey.journeyType ?? '')}
                        onChange={(e) => handleInputChange('journeyType', e.target.value as JourneyType)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
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
                        value={isEditing ? (formData.region ?? '') : (journey.region ?? '')}
                        onChange={(e) => handleInputChange('region', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        {regionOptions.map(region => (
                          <option key={region} value={region}>{region}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Place</label>
                      <select
                        value={isEditing ? (formData.place ?? '') : ((journey as any).place ?? '')}
                        onChange={(e) => handleInputChange('place', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
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
                        value={isEditing 
                          ? parseDurationDays(formData.duration) 
                          : parseDurationDays(journey.duration)}
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
                        disabled={!isEditing}
                        placeholder="Enter days"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                      />
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {isEditing 
                          ? formatDuration(parseDurationDays(formData.duration)) 
                          : formatDuration(parseDurationDays(journey.duration))}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={isEditing ? formData.price || 0 : journey.price || 0}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination Count</label>
                    <input
                      type="number"
                      min="0"
                      value={isEditing ? formData.destinationCount || 0 : journey.destinationCount || 0}
                      onChange={(e) => handleInputChange('destinationCount', parseInt(e.target.value) || 0)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests</label>
                    <input
                      type="number"
                      min="0"
                      value={isEditing ? formData.maxGuests || 0 : journey.maxGuests || 0}
                      onChange={(e) => handleInputChange('maxGuests', parseInt(e.target.value) || 0)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </Card>

              {/* Available Dates Management */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Heading level={2} className="text-xl font-semibold">Available Dates</Heading>
                  {isEditing && (
                    <Button
                      onClick={() => {
                        const currentDates = isEditing 
                          ? (formData.availableDates || [])
                          : (journey.availableDates || []);
                        const basePrice = journey.price || 0;
                        const newDate = {
                          id: `date-${Date.now()}`,
                          startDate: new Date().toISOString().split('T')[0],
                          endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                          price: basePrice, // 初始价格等于基础价格
                          discountPercentage: 0,
                          discountType: 'Percentage' as const,
                          status: 'Available' as const,
                          offerType: undefined
                        };
                        handleInputChange('availableDates', [...currentDates, newDate]);
                      }}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Date
                    </Button>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-4">
                    {((formData.availableDates || journey.availableDates) || []).map((dateItem, index) => (
                      <div key={dateItem.id || index} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <Heading level={4} className="text-sm font-semibold">Date {index + 1}</Heading>
                          <Button
                            onClick={() => {
                              const currentDates = formData.availableDates || journey.availableDates || [];
                              handleInputChange('availableDates', currentDates.filter((_, i) => i !== index));
                            }}
                            variant="secondary"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {(() => {
                          // 计算基础价格（来自 journey.price）
                          const basePrice = journey.price || 0;
                          // 计算最终价格（基于基础价格和折扣）
                          const discountPercentage = dateItem.discountPercentage || 0;
                          const discountType = dateItem.discountType || 'Percentage';
                          let calculatedPrice = basePrice;
                          
                          if (discountType === 'Percentage') {
                            calculatedPrice = basePrice * (1 - discountPercentage / 100);
                          } else {
                            // Fixed Amount
                            calculatedPrice = Math.max(0, basePrice - discountPercentage);
                          }
                          
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                <input
                                  type="date"
                                  value={dateItem.startDate}
                                  onChange={(e) => {
                                    const currentDates = formData.availableDates || journey.availableDates || [];
                                    const updatedDates = [...currentDates];
                                    updatedDates[index] = { ...updatedDates[index], startDate: e.target.value };
                                    handleInputChange('availableDates', updatedDates);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                <input
                                  type="date"
                                  value={dateItem.endDate}
                                  onChange={(e) => {
                                    const currentDates = formData.availableDates || journey.availableDates || [];
                                    const updatedDates = [...currentDates];
                                    updatedDates[index] = { ...updatedDates[index], endDate: e.target.value };
                                    handleInputChange('availableDates', updatedDates);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($)</label>
                                <input
                                  type="text"
                                  value={basePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  disabled
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                                />
                                <Text size="sm" className="text-gray-500 mt-1">
                                  From Pricing & Duration section
                                </Text>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                                <select
                                  value={dateItem.discountType || 'Percentage'}
                                  onChange={(e) => {
                                    const currentDates = formData.availableDates || journey.availableDates || [];
                                    const updatedDates = [...currentDates];
                                    updatedDates[index] = { 
                                      ...updatedDates[index], 
                                      discountType: e.target.value as 'Percentage' | 'Fixed Amount'
                                    };
                                    handleInputChange('availableDates', updatedDates);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                  <option value="Percentage">Percentage (%)</option>
                                  <option value="Fixed Amount">Fixed Amount ($)</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {dateItem.discountType === 'Fixed Amount' ? 'Discount Amount ($)' : 'Discount Percentage (%)'}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={dateItem.discountType === 'Fixed Amount' ? basePrice : 100}
                                  value={dateItem.discountPercentage || 0}
                                  onChange={(e) => {
                                    const currentDates = formData.availableDates || journey.availableDates || [];
                                    const updatedDates = [...currentDates];
                                    const discountValue = parseFloat(e.target.value) || 0;
                                    let newPrice = basePrice;
                                    
                                    if (dateItem.discountType === 'Percentage') {
                                      // 百分比折扣
                                      newPrice = basePrice * (1 - discountValue / 100);
                                    } else {
                                      // 固定金额折扣
                                      newPrice = Math.max(0, basePrice - discountValue);
                                    }
                                    
                                    updatedDates[index] = { 
                                      ...updatedDates[index], 
                                      discountPercentage: discountValue,
                                      price: newPrice
                                    };
                                    handleInputChange('availableDates', updatedDates);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Final Price ($)</label>
                                <input
                                  type="text"
                                  value={calculatedPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  disabled
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-green-50 text-gray-900 font-semibold cursor-not-allowed"
                                />
                                <Text size="sm" className="text-gray-500 mt-1">
                                  Automatically calculated
                                </Text>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                  value={dateItem.status}
                                  onChange={(e) => {
                                    const currentDates = formData.availableDates || journey.availableDates || [];
                                    const updatedDates = [...currentDates];
                                    updatedDates[index] = { ...updatedDates[index], status: e.target.value as 'Available' | 'Limited' | 'Call' };
                                    handleInputChange('availableDates', updatedDates);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                  <option value="Available">Available</option>
                                  <option value="Limited">Limited</option>
                                  <option value="Call">Call for Availability</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Type</label>
                                <select
                                  value={dateItem.offerType || 'No Offer'}
                                  onChange={(e) => {
                                    const currentDates = formData.availableDates || journey.availableDates || [];
                                    const updatedDates = [...currentDates];
                                    updatedDates[index] = { 
                                      ...updatedDates[index], 
                                      offerType: e.target.value === 'No Offer' ? undefined : e.target.value,
                                      offerDiscount: e.target.value === 'No Offer' ? undefined : updatedDates[index].offerDiscount,
                                      offerDescription: e.target.value === 'No Offer' ? undefined : updatedDates[index].offerDescription
                                    };
                                    handleInputChange('availableDates', updatedDates);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                  <option value="No Offer">No Offer</option>
                                  <option value="Promotional Offer">Promotional Offer</option>
                                  <option value="Companion Discount">Companion Discount</option>
                                  <option value="Government Subsidy">Government Subsidy</option>
                                  <option value="Early Bird Discount">Early Bird Discount</option>
                                </select>
                              </div>
                              
                              {dateItem.offerType && dateItem.offerType !== 'No Offer' && (
                                <>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Offer Discount Value</label>
                                    <input
                                      type="text"
                                      value={dateItem.offerDiscount || ''}
                                      onChange={(e) => {
                                        const currentDates = formData.availableDates || journey.availableDates || [];
                                        const updatedDates = [...currentDates];
                                        updatedDates[index] = { 
                                          ...updatedDates[index], 
                                          offerDiscount: e.target.value || undefined
                                        };
                                        handleInputChange('availableDates', updatedDates);
                                      }}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                      placeholder="例如：$1500 或 10%"
                                    />
                                    <Text size="sm" className="text-gray-500 mt-1">
                                      只填写数值部分，如 $1500 或 10%，系统会自动生成完整文案
                                    </Text>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Description (Optional)</label>
                                    <textarea
                                      value={dateItem.offerDescription || ''}
                                      onChange={(e) => {
                                        const currentDates = formData.availableDates || journey.availableDates || [];
                                        const updatedDates = [...currentDates];
                                        updatedDates[index] = { 
                                          ...updatedDates[index], 
                                          offerDescription: e.target.value || undefined
                                        };
                                        handleInputChange('availableDates', updatedDates);
                                      }}
                                      rows={2}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                      placeholder="仅限特殊情况覆盖自动文案时使用，平时留空"
                                    />
                                    <Text size="sm" className="text-gray-500 mt-1">
                                      如果填写了自定义描述，将覆盖自动生成的文案
                                    </Text>
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                    
                    {((formData.availableDates || journey.availableDates) || []).length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No dates added. Click "Add Date" to add available dates.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(journey.availableDates || []).length > 0 ? (
                      journey.availableDates!.map((dateItem, index) => {
                        const startDate = new Date(dateItem.startDate);
                        const endDate = new Date(dateItem.endDate);
                        const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const basePrice = journey.price || 0;
                        const finalPrice = dateItem.price; // 使用已计算的价格
                        const hasDiscount = dateItem.discountPercentage && dateItem.discountPercentage > 0;
                        
                        return (
                          <div key={dateItem.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-gray-900">
                                {startStr} - {endStr}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                dateItem.status === 'Available' 
                                  ? 'bg-green-100 text-green-700'
                                  : dateItem.status === 'Limited'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {dateItem.status === 'Call' ? 'Call for Availability' : `${dateItem.status} Availability`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">
                                ${finalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              {hasDiscount && basePrice > finalPrice && (
                                <span className="text-xs text-gray-500 line-through">
                                  ${basePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-sm">No dates configured. Dates will be auto-generated on the frontend.</p>
                    )}
                  </div>
                )}
              </Card>

              {/* Overview Content & Highlights */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">Overview Content & Highlights</Heading>
                <div className="space-y-4">
                  {/* Overview Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Overview Description</label>
                    <textarea
                      value={isEditing ? formData.overview?.description || journey.description : journey.overview?.description || journey.description}
                      onChange={(e) => handleInputChange('overview', { ...formData.overview, description: e.target.value })}
                      disabled={!isEditing}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Enter detailed overview description"
                    />
                  </div>

                  {/* Overview Side Image (左侧图片上传/URL) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Overview Side Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={
                          isEditing
                            ? formData.overview?.sideImage ??
                              journey.overview?.sideImage ??
                              journey.images?.[1] ??
                              journey.image ??
                              ''
                            : journey.overview?.sideImage ?? journey.images?.[1] ?? journey.image ?? ''
                        }
                        onChange={(e) =>
                          handleInputChange('overview', {
                            ...formData.overview,
                            sideImage: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="图片URL（上传后会自动填充）或输入路径，例如：/images/... 或 https://xxx.public.blob.vercel-storage.com/..."
                      />
                      {isEditing && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploading}
                            className="hidden"
                            id="overview-side-image-upload"
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
                              document.getElementById('overview-side-image-upload')?.click()
                            }
                          >
                            <Upload className="w-4 h-4" />
                            {isUploading ? '上传中...' : '上传'}
                          </Button>
                        </>
                      )}
                    </div>
                    <Text size="sm" className="text-gray-500 mt-1">
                      该图片用于 Journey 详情页 Overview &amp; Highlights 区域左侧展示。
                    </Text>

                    {/* 预览 */}
                    <div className="mt-3">
                      {(() => {
                        const previewUrl =
                          (isEditing
                            ? formData.overview?.sideImage ??
                              journey.overview?.sideImage ??
                              journey.images?.[1] ??
                              journey.image
                            : journey.overview?.sideImage ?? journey.images?.[1] ?? journey.image) ||
                          '';
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
                      {((isEditing ? formData.overview?.highlights : journey.overview?.highlights) || []).map((highlight: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <Heading level={4} className="text-sm font-semibold">Highlight {index + 1}</Heading>
                            {isEditing && (
                              <Button
                                onClick={() => {
                                  const currentHighlights = isEditing 
                                    ? (formData.overview?.highlights || [])
                                    : (journey.overview?.highlights || []);
                                  const newHighlights = currentHighlights.filter((_: any, i: number) => i !== index);
                                  handleInputChange('overview', {
                                    ...formData.overview,
                                    highlights: newHighlights
                                  });
                                }}
                                variant="secondary"
                                size="sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
                    <textarea
                              value={highlight.description || highlight.title || ''}
                      onChange={(e) => {
                                const currentHighlights = isEditing 
                                  ? (formData.overview?.highlights || [])
                                  : (journey.overview?.highlights || []);
                                const newHighlights = [...currentHighlights];
                                newHighlights[index] = { ...highlight, title: '', description: e.target.value };
                                handleInputChange('overview', {
                                  ...formData.overview,
                                  highlights: newHighlights
                                });
                      }}
                      disabled={!isEditing}
                              rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                              placeholder="输入highlight内容（支持换行）"
                            />
                          </div>
                        </div>
                      ))}
                      {isEditing && (
                        <Button
                          onClick={() => {
                            const currentHighlights = formData.overview?.highlights || [];
                            handleInputChange('overview', {
                              ...formData.overview,
                              highlights: [...currentHighlights, { title: '', description: '' }]
                            });
                          }}
                          variant="secondary"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Highlight
                        </Button>
                      )}
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
                  {(isEditing ? (formData.itinerary || []) : (journey.itinerary || [])).map((day, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Heading level={3} className="text-lg font-semibold">Day {day.day}</Heading>
                        {isEditing && (
                          <Button
                            onClick={() => {
                              const source = isEditing ? (formData.itinerary || []) : (journey.itinerary || []);
                              const newItinerary = source.filter((_, i) => i !== index);
                              updateItinerary(newItinerary);
                            }}
                            variant="secondary"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Day Title</label>
                          <input
                            type="text"
                            value={day.title}
                            onChange={(e) => {
                              const source = isEditing ? (formData.itinerary || []) : (journey.itinerary || []);
                              const newItinerary = [...source];
                              newItinerary[index] = { ...day, title: e.target.value };
                              updateItinerary(newItinerary);
                            }}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={day.description}
                            onChange={(e) => {
                              const source = isEditing ? (formData.itinerary || []) : (journey.itinerary || []);
                              const newItinerary = [...source];
                              newItinerary[index] = { ...day, description: e.target.value };
                              updateItinerary(newItinerary);
                            }}
                            disabled={!isEditing}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={day.image || ''}
                              onChange={(e) => {
                                const source = isEditing ? (formData.itinerary || []) : journey.itinerary;
                                const newItinerary = [...source];
                                newItinerary[index] = { ...day, image: e.target.value };
                                updateItinerary(newItinerary);
                              }}
                              disabled={!isEditing}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                              placeholder="图片URL（上传后会自动填充）或输入路径，例如：/images/... 或 https://xxx.public.blob.vercel-storage.com/..."
                            />
                            {isEditing && (
                              <>
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
                              </>
                            )}
                          </div>
                          {isEditing && (
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
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isEditing && (
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
                  )}
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
                          const currentInclusions = isEditing 
                            ? (formData.standardInclusions || journey.standardInclusions || {})
                            : (journey.standardInclusions || {});
                          const isChecked = currentInclusions[item.key as keyof typeof currentInclusions] || false;
                          return (
                            <label
                              key={item.key}
                              className={`flex items-start space-x-3 p-2 rounded cursor-pointer ${
                                !isEditing ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const prevInclusions = formData.standardInclusions || journey.standardInclusions || {};
                                  handleInputChange('standardInclusions', {
                                    ...prevInclusions,
                                    [item.key]: e.target.checked
                                  });
                                }}
                                disabled={!isEditing}
                                className="mt-1 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50"
                              />
                              <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                            </label>
                          );
                        })}
                      </div>
                      <Text size="sm" className="text-gray-500 mt-2">
                        已选择 {Object.values(isEditing ? (formData.standardInclusions || {}) : (journey.standardInclusions || {})).filter(Boolean).length} 项标准化服务
                      </Text>
                    </div>
                  </div>


                  {/* Extensions */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Heading level={3} className="text-lg font-semibold">Extensions</Heading>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open('/admin/extensions', '_blank')}
                        >
                          管理 Extensions
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenExtensionModal()}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          添加
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {loadingExtensions ? (
                        <Text size="sm" className="text-gray-500">加载中...</Text>
                      ) : extensions.length === 0 ? (
                        <Text size="sm" className="text-gray-500">暂无 Extensions，请先创建 Extension</Text>
                      ) : (
                        extensions.filter(ext => ext.status === 'active').map((extension) => {
                          const currentExtensions = isEditing
                            ? (formData.extensions || journey.extensions || [])
                            : (journey.extensions || []);
                          const isSelected = currentExtensions.includes(extension.id);
                          return (
                            <div
                              key={extension.id}
                              className={`flex items-start gap-3 p-2 rounded ${
                                !isEditing ? 'opacity-60' : 'hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const current = isEditing
                                    ? (formData.extensions || journey.extensions || [])
                                    : (journey.extensions || []);
                                  const newExtensions = e.target.checked
                                    ? [...current, extension.id]
                                    : current.filter(id => id !== extension.id);
                                  handleInputChange('extensions', newExtensions);
                                }}
                                disabled={!isEditing}
                                className="mt-1 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50"
                              />
                              <div className="flex-1 flex items-center gap-3 min-w-0">
                                {extension.image && (
                                  <img
                                    src={extension.image}
                                    alt={extension.title}
                                    className="w-12 h-12 object-cover rounded flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-gray-700 font-medium prose-force-wrap block">{extension.title}</span>
                                  {extension.days && (
                                    <span className="text-xs text-gray-500">({extension.days})</span>
                                  )}
                                </div>
                                {isEditing && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenExtensionModal(extension);
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
                                    title="编辑"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <Text size="sm" className="text-gray-500 mt-2">
                      已选择 {(isEditing ? (formData.extensions || []) : (journey.extensions || [])).length} 个 Extension
                    </Text>
                  </div>

                  {/* Journey Hotels */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <Heading level={3} className="text-lg font-semibold">Where You Will Stay (Hotels)</Heading>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open('/admin/journey-hotels', '_blank')}
                        >
                          管理 Hotels
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenHotelModal()}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          添加
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {loadingHotels ? (
                        <Text size="sm" className="text-gray-500">加载中...</Text>
                      ) : journeyHotels.length === 0 ? (
                        <Text size="sm" className="text-gray-500">暂无 Hotels，请先创建 Journey Hotel</Text>
                      ) : (
                        journeyHotels.filter(hotel => hotel.status === 'active').map((hotel) => {
                          const currentHotels = isEditing
                            ? (formData.hotels || journey.hotels || [])
                            : (journey.hotels || []);
                          const isSelected = currentHotels.includes(hotel.id);
                          return (
                            <div
                              key={hotel.id}
                              className={`flex items-start gap-3 p-2 rounded ${
                                !isEditing ? 'opacity-60' : 'hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const current = isEditing
                                    ? (formData.hotels || journey.hotels || [])
                                    : (journey.hotels || []);
                                  const newHotels = e.target.checked
                                    ? [...current, hotel.id]
                                    : current.filter(id => id !== hotel.id);
                                  handleInputChange('hotels', newHotels);
                                }}
                                disabled={!isEditing}
                                className="mt-1 w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50"
                              />
                              <div className="flex-1 flex items-center gap-3 min-w-0">
                                {hotel.image && (
                                  <img
                                    src={hotel.image}
                                    alt={hotel.name}
                                    className="w-12 h-16 object-cover rounded flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-gray-700 font-medium prose-force-wrap block">{hotel.name}</span>
                                  {hotel.location && (
                                    <span className="text-xs text-gray-500 prose-force-wrap">({hotel.location})</span>
                                  )}
                                </div>
                                {isEditing && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenHotelModal(hotel);
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
                                    title="编辑"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <Text size="sm" className="text-gray-500 mt-2">
                      已选择 {(isEditing ? (formData.hotels || []) : (journey.hotels || [])).length} 个 Hotel
                    </Text>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status and Settings */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">Status & Settings</Heading>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={isEditing ? (formData.status ?? '') : (journey.status ?? '')}
                      onChange={(e) => handleInputChange('status', e.target.value as JourneyStatus)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
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
                      checked={isEditing ? formData.featured || false : journey.featured}
                      onChange={(e) => handleInputChange('featured', e.target.checked)}
                      disabled={!isEditing}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                      Featured Journey
                    </label>
                  </div>
                </div>
              </Card>

              {/* Image Upload */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">Images</Heading>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Image URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={isEditing ? (formData.image ?? '') : (journey.image ?? '')}
                        onChange={(e) => handleInputChange('image', e.target.value)}
                        disabled={!isEditing}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                        placeholder="图片URL（上传后会自动填充）或输入路径，例如：/images/journey-cards/xxx.jpg 或 https://xxx.public.blob.vercel-storage.com/..."
                      />
                      {isEditing && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                            className="hidden"
                            id="image-upload-input"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={isUploading}
                            className="flex items-center gap-2"
                            onClick={() => document.getElementById('image-upload-input')?.click()}
                          >
                            <Upload className="w-4 h-4" />
                            {isUploading ? '上传中...' : '上传'}
                          </Button>
                        </>
                      )}
                    </div>
                    {isEditing && (
                      <Text size="sm" className="text-gray-500 mt-1">
                        {(() => {
                          const currentImage = formData.image ?? journey.image ?? '';
                          if (currentImage?.startsWith('https://') && currentImage.includes('vercel-storage.com')) {
                            return '✅ 云存储URL（已上传到 Vercel Blob 云存储）';
                          } else if (currentImage?.startsWith('/')) {
                            return '💡 本地路径（存储在 public 目录），建议使用"上传"按钮上传到云存储';
                          } else if (currentImage) {
                            return '💡 外部URL或云存储URL';
                          }
                          return '💡 提示：点击"上传"按钮可将图片上传到 Vercel Blob 云存储，或直接输入图片URL（支持本地路径 /images/... 或云存储URL）';
                        })()}
                      </Text>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    {(() => {
                      const previewUrl = isEditing ? (formData.image ?? journey.image) : journey.image;
                      return previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Journey preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : null;
                    })()}
                  </div>
                </div>
              </Card>

              {/* Experience Management */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">Experience Management</Heading>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Available Experiences
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                      {experiences.filter(exp => exp.status === 'active').map((experience) => {
                        const availableExps = isEditing 
                          ? (formData.availableExperiences || journey.availableExperiences || [])
                          : (journey.availableExperiences || []);
                        const isInAvailable = availableExps.includes(experience.id);
                        const isSelected = isEditing ? (formData.experiences || []).includes(experience.id) : (journey.experiences || []).includes(experience.id);
                        return (
                          <div key={experience.id} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`exp-${experience.id}`}
                              checked={isInAvailable}
                              onChange={(e) => {
                                handleExperienceSelection(experience.id, e.target.checked);
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
                            {isInAvailable && !isSelected && (
                              <Button
                                onClick={() => {
                                  const currentSelected = isEditing ? (formData.experiences || []) : (journey.experiences || []);
                                  handleInputChange('experiences', [...currentSelected, experience.id]);
                                }}
                                variant="primary"
                                size="sm"
                                className="ml-2"
                                disabled={!isEditing}
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
                      Selected Experiences for This Journey
                    </label>
                    <div className="space-y-2">
                      {(isEditing ? (formData.experiences || []) : (journey.experiences || [])).map((expId) => {
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
                                const currentExps = isEditing ? (formData.experiences || []) : (journey.experiences || []);
                                const newExps = currentExps.filter(id => id !== expId);
                                handleInputChange('experiences', newExps);
                              }}
                              variant="secondary"
                              size="sm"
                              disabled={!isEditing}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                      {((isEditing ? (formData.experiences || []) : (journey.experiences || [])).length === 0) && (
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
                        const availableHotels = isEditing
                          ? (formData.availableAccommodations || journey.availableAccommodations || [])
                          : (journey.availableAccommodations || []);
                        const isInAvailable = availableHotels.includes(hotel.id);
                        const isSelected = isEditing ? (formData.accommodations || []).includes(hotel.id) : (journey.accommodations || []).includes(hotel.id);
                        return (
                          <div key={hotel.id} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`hotel-${hotel.id}`}
                              checked={isInAvailable}
                              onChange={(e) => {
                                handleAccommodationSelection(hotel.id, e.target.checked);
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
                                  const currentSelected = isEditing ? (formData.accommodations || []) : (journey.accommodations || []);
                                  handleInputChange('accommodations', [...currentSelected, hotel.id]);
                                }}
                                variant="primary"
                                size="sm"
                                className="ml-2"
                                disabled={!isEditing}
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
                      {(isEditing ? (formData.accommodations || []) : (journey.accommodations || [])).map((hotelId) => {
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
                                const currentHotels = isEditing ? (formData.accommodations || []) : (journey.accommodations || []);
                                const newHotels = currentHotels.filter(id => id !== hotelId);
                                handleInputChange('accommodations', newHotels);
                              }}
                              variant="secondary"
                              size="sm"
                              disabled={!isEditing}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                      {((isEditing ? (formData.accommodations || []) : (journey.accommodations || [])).length === 0) && (
                        <Text className="text-gray-500 text-sm">No accommodations selected</Text>
                      )}
                    </div>
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
                          value={isEditing ? (formData.slug ?? '') : (journey.slug ?? '')}
                          onChange={(e) => handleInputChange('slug', e.target.value)}
                          disabled={!isEditing}
                          placeholder="e.g., chengdu-city-one-day-deep-dive"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                        />
                        <Text size="sm" className="text-gray-500 mt-1">
                          Journey URL: /journeys/[slug]
                        </Text>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Region for Destinations</label>
                        <select
                          value={isEditing ? (formData.region ?? '') : (journey.region ?? '')}
                          onChange={(e) => handleInputChange('region', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
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
                      {(isEditing ? formData.slug : journey.slug) && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <Text size="sm" className="text-gray-700">
                            Journey: <code className="bg-white px-2 py-1 rounded text-blue-600">/journeys/{isEditing ? formData.slug : journey.slug}</code>
                          </Text>
                        </div>
                      )}
                      {(isEditing ? formData.region : journey.region) && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <Text size="sm" className="text-gray-700">
                            Destination: <code className="bg-white px-2 py-1 rounded text-blue-600">/destinations/{(isEditing ? formData.region : journey.region)?.toLowerCase()}</code>
                          </Text>
                        </div>
                      )}
                      {!(isEditing ? formData.slug : journey.slug) && !(isEditing ? formData.region : journey.region) && (
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

              {/* Page Generation Helper */}
              <PageGenerationHelper
                journey={journey}
                onUpdateJourney={updateJourney}
                allJourneys={journeys} // 传入所有旅行卡片用于生成相关推荐
              />

              {/* Statistics */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">Statistics</Heading>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Text className="text-sm text-gray-600">Rating</Text>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <Text className="text-sm font-medium">{journey.rating}</Text>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-sm text-gray-600">Reviews</Text>
                    <Text className="text-sm font-medium">{journey.reviewCount}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-sm text-gray-600">Created</Text>
                    <Text className="text-sm font-medium">
                      {new Date(journey.createdAt).toLocaleDateString()}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-sm text-gray-600">Updated</Text>
                    <Text className="text-sm font-medium">
                      {new Date(journey.updatedAt).toLocaleDateString()}
                    </Text>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          </Container>
        </Section>

        {/* Extension Modal */}
        <ExtensionFormModal
          isOpen={extensionModalOpen}
          onClose={handleCloseExtensionModal}
          onSuccess={handleExtensionSuccess}
          extension={editingExtension}
        />

        {/* Hotel Modal */}
        <JourneyHotelFormModal
          isOpen={hotelModalOpen}
          onClose={handleCloseHotelModal}
          onSuccess={handleHotelSuccess}
          hotel={editingHotel}
        />
      </div>
    );
  }
