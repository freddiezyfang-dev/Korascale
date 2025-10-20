'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { useExperienceManagement } from '@/context/ExperienceManagementContext';
import { useHotelManagement } from '@/context/HotelManagementContext';
import { Journey, JourneyStatus } from '@/types';
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Upload
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
    tags: []
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 验证必填字段
      if (!formData.title || !formData.description || !formData.image) {
        alert('请填写所有必填字段');
        return;
      }

      // 创建新的旅行卡片
      const newJourney = {
        ...formData,
        id: `journey-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>;

      addJourney(newJourney);
      
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        required
                        rows={4}
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                      <input
                        type="number"
                        value={formData.maxParticipants || 12}
                        onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </Card>

                {/* Highlights */}
                <Card className="p-6">
                  <Heading level={2} className="text-xl font-semibold mb-4">Highlights</Heading>
                  <div className="space-y-2">
                    {(formData.highlights || []).map((highlight, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={highlight}
                          onChange={(e) => handleArrayInputChange('highlights', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <Button
                          onClick={() => handleRemoveArrayItem('highlights', index)}
                          variant="secondary"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      onClick={() => handleAddArrayItem('highlights')}
                      variant="secondary"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Highlight
                    </Button>
                  </div>
                </Card>

                {/* Included/Excluded */}
                <Card className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Heading level={3} className="text-lg font-semibold mb-4">Included</Heading>
                      <div className="space-y-2">
                        {(formData.included || []).map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => handleArrayInputChange('included', index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            <Button
                              onClick={() => handleRemoveArrayItem('included', index)}
                              variant="secondary"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          onClick={() => handleAddArrayItem('included')}
                          variant="secondary"
                          size="sm"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Item
                        </Button>
                      </div>
                    </div>

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
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {experiences.filter(exp => exp.status === 'active').map((experience) => (
                          <div key={experience.id} className="flex items-center space-x-2">
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
                                <Text className="text-sm font-medium">{experience.title}</Text>
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                  {experience.city}
                                </span>
                              </div>
                            </label>
                          </div>
                        ))}
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
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {hotels.filter(hotel => hotel.status === 'active').map((hotel) => (
                          <div key={hotel.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`hotel-${hotel.id}`}
                              checked={(formData.availableAccommodations || []).includes(hotel.id)}
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
                                <Text className="text-sm font-medium">{hotel.name}</Text>
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                  {hotel.city}
                                </span>
                              </div>
                            </label>
                          </div>
                        ))}
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    
                    {formData.image && (
                      <div className="mt-4">
                        <img
                          src={formData.image}
                          alt="Journey preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Submit Button */}
                <Card className="p-6">
                  <div className="space-y-4">
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full"
                      disabled={isSubmitting}
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
