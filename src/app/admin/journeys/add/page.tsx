'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { useExperienceManagement } from '@/context/ExperienceManagementContext';
import { useHotelManagement } from '@/context/HotelManagementContext';
import { Journey, JourneyStatus } from '@/types';
import { PageGenerationHelper } from '@/components/admin/PageGenerationHelper';
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  Car,
  Bed,
  User,
  Utensils,
  Ticket,
  Star
} from 'lucide-react';

const categoryOptions = [
  'Food', 'Culture & History', 'Adventure', 'City', 'Nature', 'Spiritual'
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
    category: 'Food',
    region: 'Sichuan',
    city: '',
    location: '',
    difficulty: 'Easy',
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
      description: '',
      sideImage: ''
    },
    inclusions: {
      transportation: { icon: 'Car', title: '', description: '' },
      guide: { icon: 'User', title: '', description: '' },
      meals: { icon: 'Utensils', title: '', description: '' },
      accommodation: { icon: 'Bed', title: '', description: '' },
      others: []
    },
    slug: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    setIsSubmitting(true);

    try {
      console.log('Creating journey without validation...');
      
      // 创建新的旅行卡片
      const newJourney = {
        ...formData,
        id: `journey-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>;

      console.log('New journey data:', newJourney);
      addJourney(newJourney);
      
      console.log('Journey added successfully, redirecting...');
      // 重定向到旅行卡片列表
      router.push('/admin/journeys');
    } catch (error) {
      console.error('Error creating journey:', error);
      alert('创建旅行卡片时出错，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 检查用户权限
  if (!user || user.email !== 'admin@korascale.com') {
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                        <select
                          value={formData.difficulty || 'Easy'}
                          onChange={(e) => handleInputChange('difficulty', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          {difficultyOptions.map(difficulty => (
                            <option key={difficulty} value={difficulty}>{difficulty}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                        <select
                          value={formData.region || 'Sichuan'}
                          onChange={(e) => handleInputChange('region', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                          value={formData.city || ''}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          value={formData.location || ''}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                        value={formData.duration || ''}
                        onChange={(e) => handleInputChange('duration', e.target.value)}
                        placeholder="e.g., 1 Day, 3 Days"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                      <input
                        type="number"
                        value={formData.price || 0}
                        onChange={(e) => handleInputChange('price', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Original Price ($)</label>
                      <input
                        type="number"
                        value={formData.originalPrice || 0}
                        onChange={(e) => handleInputChange('originalPrice', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination Count</label>
                      <input
                        type="number"
                        value={formData.destinationCount || 0}
                        onChange={(e) => handleInputChange('destinationCount', parseInt(e.target.value))}
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
                        value={formData.maxGuests || 0}
                        onChange={(e) => handleInputChange('maxGuests', parseInt(e.target.value))}
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Overview Description</label>
                      <textarea
                        value={formData.overview?.description || formData.description || ''}
                        onChange={(e) => handleInputChange('overview', { ...formData.overview, description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter detailed overview description"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Overview Side Image URL</label>
                      <input
                        type="url"
                        value={formData.overview?.sideImage || ''}
                        onChange={(e) => handleInputChange('overview', { ...formData.overview, sideImage: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter side image URL"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Highlights</label>
                      <textarea
                        value={(formData.highlights || []).join('\n')}
                        onChange={(e) => {
                          const highlightsArray = e.target.value.split('\n').filter(line => line.trim() !== '');
                          handleInputChange('highlights', highlightsArray);
                        }}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                            <input
                              type="url"
                              value={day.image || ''}
                              onChange={(e) => {
                                const newItinerary = [...(formData.itinerary || [])];
                                newItinerary[index] = { ...day, image: e.target.value };
                                updateItinerary(newItinerary);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Enter image URL for this day"
                            />
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
                                value={formData.inclusions?.transportation?.title || ''}
                                onChange={(e) => handleInclusionChange('transportation', 'title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Transportation"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                value={formData.inclusions?.transportation?.description || ''}
                                onChange={(e) => handleInclusionChange('transportation', 'description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                                value={formData.inclusions?.guide?.title || ''}
                                onChange={(e) => handleInclusionChange('guide', 'title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Guide"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                value={formData.inclusions?.guide?.description || ''}
                                onChange={(e) => handleInclusionChange('guide', 'description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                                value={formData.inclusions?.meals?.title || ''}
                                onChange={(e) => handleInclusionChange('meals', 'title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Meals"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                value={formData.inclusions?.meals?.description || ''}
                                onChange={(e) => handleInclusionChange('meals', 'description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                                value={formData.inclusions?.accommodation?.title || ''}
                                onChange={(e) => handleInclusionChange('accommodation', 'title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Accommodation"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea
                                value={formData.inclusions?.accommodation?.description || ''}
                                onChange={(e) => handleInclusionChange('accommodation', 'description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="Accommodation details..."
                              />
                            </div>
                          </div>
                        </div>

                        {/* Others */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <Heading level={4} className="text-md font-medium mb-3">Other Inclusions</Heading>
                          <div className="space-y-3">
                            {(formData.inclusions?.others || []).map((item, index) => (
                              <div key={index} className="flex gap-2 p-3 border border-gray-200 rounded-lg">
                                <div className="flex-1 space-y-2">
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => handleOtherInclusionChange(index, 'title', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Title"
                                  />
                                  <textarea
                                    value={item.description}
                                    onChange={(e) => handleOtherInclusionChange(index, 'description', e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Description"
                                  />
                                </div>
                                <Button
                                  onClick={() => handleRemoveOtherInclusion(index)}
                                  variant="secondary"
                                  size="sm"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              onClick={handleAddOtherInclusion}
                              variant="secondary"
                              size="sm"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add Other Inclusion
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Excluded */}
                    <div>
                      <Heading level={3} className="text-lg font-semibold mb-4">Excluded</Heading>
                      <div className="space-y-2">
                        {(formData.excluded || []).map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => handleArrayInputChange('excluded', index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <Button
                              onClick={() => handleRemoveArrayItem('excluded', index)}
                              variant="secondary"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() => handleAddArrayItem('excluded')}
                          variant="secondary"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Item
                        </Button>
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

                {/* Image Upload */}
                <Card className="p-6">
                  <Heading level={2} className="text-xl font-semibold mb-4">Images</Heading>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Main Image URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={formData.image || ''}
                        onChange={(e) => handleInputChange('image', e.target.value)}
                        required
                        placeholder="/images/journey-cards/ancient-dujiangyan-irrigation.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <Text size="sm" className="text-gray-500 mt-1">
                        请输入图片路径，例如：/images/journey-cards/ancient-dujiangyan-irrigation.jpg
                      </Text>
                    </div>
                    
                    {formData.image && (
                      <div className="mt-4">
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300">
                          <Text size="sm">图片预览: {formData.image}</Text>
                        </div>
                      </div>
                    )}
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
