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
  Car,
  Bed,
  User,
  Utensils,
  Ticket
} from 'lucide-react';
import { uploadAPI } from '@/lib/databaseClient';

const categoryOptions = [
  'Food', 'Culture & History', 'Adventure', 'City', 'Nature', 'Spiritual'
];

const journeyTypeOptions: JourneyType[] = [
  'Explore Together',
  'Deep Discovery',
  'Signature Journeys'
];

const difficultyOptions = ['Easy', 'Medium', 'Hard'];

const regionOptions = [
  'Sichuan', 'Chongqing', 'Qinghai', 'Gansu', 'Xinjiang', 'Shaanxi', 'Tibet', 'Yunnan'
];

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
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

  useEffect(() => {
    if (!user || user.email !== 'admin@korascale.com') {
      router.push('/');
      return;
    }

    const foundJourney = journeys.find(j => j.id === journeyId);
    if (foundJourney) {
      setJourney(foundJourney);
      setFormData(foundJourney);
    } else {
      router.push('/admin/journeys');
    }
  }, [journeyId, journeys, user, router]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
  const handleInclusionChange = (category: 'transportation' | 'guide' | 'meals' | 'accommodation', field: 'title' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      inclusions: {
        ...prev.inclusions,
        [category]: {
          ...prev.inclusions?.[category],
          icon: prev.inclusions?.[category]?.icon || (category === 'transportation' ? 'Car' : category === 'guide' ? 'User' : category === 'meals' ? 'Utensils' : 'Bed'),
          [field]: value
        }
      }
    }));
  };

  // 处理其他inclusions的变化
  const handleOtherInclusionChange = (index: number, field: 'title' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      inclusions: {
        ...prev.inclusions,
        others: prev.inclusions?.others?.map((item, i) => 
          i === index ? { ...item, [field]: value } : item
        ) || []
      }
    }));
  };

  // 添加其他inclusion
  const handleAddOtherInclusion = () => {
    setFormData(prev => ({
      ...prev,
      inclusions: {
        ...prev.inclusions,
        others: [
          ...(prev.inclusions?.others || []),
          { icon: 'Ticket', title: '', description: '' }
        ]
      }
    }));
  };

  // 移除其他inclusion
  const handleRemoveOtherInclusion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inclusions: {
        ...prev.inclusions,
        others: prev.inclusions?.others?.filter((_, i) => i !== index) || []
      }
    }));
  };

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
      // 调试：打印要保存的数据
      console.log('Saving journey data:', {
        journeyId: journey.id,
        formData: formData,
        highlights: formData.highlights,
        highlightsType: Array.isArray(formData.highlights) ? 'array' : typeof formData.highlights,
        highlightsLength: Array.isArray(formData.highlights) ? formData.highlights.length : 'N/A'
      });
      
      const updated = await updateJourney(journey.id, formData);
      
      // 调试：打印保存后的数据
      console.log('Journey saved, updated data:', {
        updated: updated,
        highlights: updated?.highlights,
        highlightsType: updated?.highlights ? (Array.isArray(updated.highlights) ? 'array' : typeof updated.highlights) : 'undefined'
      });
      
      setJourney(updated || { ...journey, ...formData });
      setIsEditing(false);
      alert('保存成功！请刷新页面查看 highlights 是否显示。');
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={isEditing ? (formData.city ?? '') : (journey.city ?? '')}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Pricing and Duration */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">Pricing & Duration</Heading>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      value={isEditing ? (formData.duration ?? '') : (journey.duration ?? '')}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      value={isEditing ? formData.price || 0 : journey.price}
                      onChange={(e) => handleInputChange('price', parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Original Price ($)</label>
                    <input
                      type="number"
                      value={isEditing ? formData.originalPrice || 0 : journey.originalPrice || 0}
                      onChange={(e) => handleInputChange('originalPrice', parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination Count</label>
                    <input
                      type="number"
                      value={isEditing ? formData.destinationCount || 0 : journey.destinationCount || 0}
                      onChange={(e) => handleInputChange('destinationCount', parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests</label>
                    <input
                      type="number"
                      value={isEditing ? formData.maxGuests || 0 : journey.maxGuests || 0}
                      onChange={(e) => handleInputChange('maxGuests', parseInt(e.target.value))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </Card>

              {/* Overview Content & Highlights */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">Overview Content & Highlights</Heading>
                <div className="space-y-4">
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Overview Side Image URL</label>
                    <input
                      type="text"
                      value={isEditing ? formData.overview?.sideImage || '' : journey.overview?.sideImage || ''}
                      onChange={(e) => handleInputChange('overview', { ...formData.overview, sideImage: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Enter side image URL (e.g., /images/... or https://...)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Highlights</label>
                    <textarea
                      value={(isEditing ? (formData.highlights || []) : (journey.highlights || [])).join('\n')}
                      onChange={(e) => {
                        const highlightsArray = e.target.value.split('\n').filter(line => line.trim() !== '');
                        handleInputChange('highlights', highlightsArray);
                      }}
                      disabled={!isEditing}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Enter highlights, one per line:&#10;• Visit Chengdu Panda Base&#10;• Hands-on cooking experience&#10;• Sichuan Opera face-changing show&#10;• Authentic hot pot dinner"
                    />
                    <Text size="sm" className="text-gray-500 mt-1">
                      Enter each highlight on a new line. Use bullet points (•) or dashes (-) for better formatting.
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                            placeholder="Enter image URL (e.g., /images/... or https://...)"
                          />
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

              {/* Inclusions & Excluded */}
              <Card className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* New Inclusions Structure */}
                  <div>
                    <Heading level={3} className="text-lg font-semibold mb-4">Inclusions & Offers</Heading>
                    <div className="space-y-6">
                      {/* Transportation */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <Heading level={4} className="text-md font-medium mb-3 flex items-center gap-2">
                          <Car className="w-5 h-5 text-primary-500" />
                          Transportation
                        </Heading>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                              type="text"
                              value={isEditing ? (formData.inclusions?.transportation?.title || '') : (journey.inclusions?.transportation?.title || '')}
                              onChange={(e) => handleInclusionChange('transportation', 'title', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                              placeholder="Transportation"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={isEditing ? (formData.inclusions?.transportation?.description || '') : (journey.inclusions?.transportation?.description || '')}
                              onChange={(e) => handleInclusionChange('transportation', 'description', e.target.value)}
                              disabled={!isEditing}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                              placeholder="Transportation details..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Guide */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <Heading level={4} className="text-md font-medium mb-3 flex items-center gap-2">
                          <User className="w-5 h-5 text-primary-500" />
                          Guide
                        </Heading>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                              type="text"
                              value={isEditing ? (formData.inclusions?.guide?.title || '') : (journey.inclusions?.guide?.title || '')}
                              onChange={(e) => handleInclusionChange('guide', 'title', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                              placeholder="Guide"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={isEditing ? (formData.inclusions?.guide?.description || '') : (journey.inclusions?.guide?.description || '')}
                              onChange={(e) => handleInclusionChange('guide', 'description', e.target.value)}
                              disabled={!isEditing}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                              placeholder="Guide details..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Meals */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <Heading level={4} className="text-md font-medium mb-3 flex items-center gap-2">
                          <Utensils className="w-5 h-5 text-primary-500" />
                          Meals
                        </Heading>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                              type="text"
                              value={isEditing ? (formData.inclusions?.meals?.title || '') : (journey.inclusions?.meals?.title || '')}
                              onChange={(e) => handleInclusionChange('meals', 'title', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                              placeholder="Meals"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={isEditing ? (formData.inclusions?.meals?.description || '') : (journey.inclusions?.meals?.description || '')}
                              onChange={(e) => handleInclusionChange('meals', 'description', e.target.value)}
                              disabled={!isEditing}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                              placeholder="Meals details..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Accommodation */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <Heading level={4} className="text-md font-medium mb-3 flex items-center gap-2">
                          <Bed className="w-5 h-5 text-primary-500" />
                          Accommodation
                        </Heading>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                              type="text"
                              value={isEditing ? (formData.inclusions?.accommodation?.title || '') : (journey.inclusions?.accommodation?.title || '')}
                              onChange={(e) => handleInclusionChange('accommodation', 'title', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                              placeholder="Accommodation"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                              value={isEditing ? (formData.inclusions?.accommodation?.description || '') : (journey.inclusions?.accommodation?.description || '')}
                              onChange={(e) => handleInclusionChange('accommodation', 'description', e.target.value)}
                              disabled={!isEditing}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                              placeholder="Accommodation details..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Others */}
                      <div className="border border-gray-200 rounded-lg p-4">
                        <Heading level={4} className="text-md font-medium mb-3">Other Inclusions</Heading>
                        <div className="space-y-3">
                          {(isEditing ? (formData.inclusions?.others || []) : (journey.inclusions?.others || [])).map((item, index) => (
                            <div key={index} className="flex gap-2 p-3 border border-gray-200 rounded-lg">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-primary-500 font-bold">*</span>
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => handleOtherInclusionChange(index, 'title', e.target.value)}
                                    disabled={!isEditing}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                                    placeholder="Title"
                                  />
                                </div>
                                <textarea
                                  value={item.description}
                                  onChange={(e) => handleOtherInclusionChange(index, 'description', e.target.value)}
                                  disabled={!isEditing}
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                                  placeholder="Description"
                                />
                              </div>
                              {isEditing && (
                                <Button
                                  onClick={() => handleRemoveOtherInclusion(index)}
                                  variant="secondary"
                                  size="sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {isEditing && (
                            <Button
                              onClick={handleAddOtherInclusion}
                              variant="secondary"
                              size="sm"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Other Inclusion
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Excluded */}
                  <div>
                    <Heading level={3} className="text-lg font-semibold mb-4">Excluded</Heading>
                    <div className="space-y-2">
                      {(isEditing ? (formData.excluded || []) : (journey.excluded || [])).map((item, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleArrayInputChange('excluded', index, e.target.value)}
                            disabled={!isEditing}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                          />
                          {isEditing && (
                            <Button
                              onClick={() => handleRemoveArrayItem('excluded', index)}
                              variant="secondary"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <Button
                          onClick={() => handleAddArrayItem('excluded')}
                          variant="secondary"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Item
                        </Button>
                      )}
                    </div>
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
                        placeholder="图片路径 (如: /images/... 或 https://...)"
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
                        点击"上传"按钮上传图片到 Vercel Blob 云存储，或直接输入图片 URL
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
    </div>
  );
}
