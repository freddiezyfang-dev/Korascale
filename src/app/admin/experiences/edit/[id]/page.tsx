'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useExperienceManagement } from '@/context/ExperienceManagementContext';
import { Experience, ExperienceStatus, ExperienceType, ExperienceDifficulty } from '@/types/experience';
import { ArrowLeft, Save, Eye, Copy } from 'lucide-react';

const typeOptions: { value: ExperienceType; label: string }[] = [
  { value: 'cooking', label: 'Cooking' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'nature', label: 'Nature' },
  { value: 'spiritual', label: 'Spiritual' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'educational', label: 'Educational' },
];

const difficultyOptions: { value: ExperienceDifficulty; label: string }[] = [
  { value: 'Easy', label: 'Easy' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Hard', label: 'Hard' },
];

const statusOptions: { value: ExperienceStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'draft', label: 'Draft' },
];

export default function EditExperiencePage() {
  const { user } = useUser();
  const { experiences, updateExperience, getExperiencesByStatus } = useExperienceManagement();
  const router = useRouter();
  const params = useParams();
  const experienceId = params.id as string;

  const [experience, setExperience] = useState<Experience | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 加载体验数据
  useEffect(() => {
    if (experiences.length > 0) {
      const foundExperience = experiences.find(exp => exp.id === experienceId);
      if (foundExperience) {
        setExperience(foundExperience);
      } else {
        router.push('/admin/experiences');
      }
      setIsLoading(false);
    }
  }, [experiences, experienceId, router]);

  // 检查用户权限
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    if (user.email !== 'admin@korascale.com') {
      router.push('/');
      return;
    }
  }, [user, router]);

  const handleInputChange = (field: keyof Experience, value: any) => {
    if (experience) {
      setExperience({
        ...experience,
        [field]: value,
        updatedAt: new Date(),
      });
    }
  };

  const handleArrayChange = (field: keyof Experience, index: number, value: string) => {
    if (experience) {
      const currentArray = (experience[field] as string[]) || [];
      const newArray = [...currentArray];
      newArray[index] = value;
      setExperience({
        ...experience,
        [field]: newArray,
        updatedAt: new Date(),
      });
    }
  };

  const handleAddArrayItem = (field: keyof Experience, value: string = '') => {
    if (experience) {
      const currentArray = (experience[field] as string[]) || [];
      setExperience({
        ...experience,
        [field]: [...currentArray, value],
        updatedAt: new Date(),
      });
    }
  };

  const handleRemoveArrayItem = (field: keyof Experience, index: number) => {
    if (experience) {
      const currentArray = (experience[field] as string[]) || [];
      const newArray = currentArray.filter((_, i) => i !== index);
      setExperience({
        ...experience,
        [field]: newArray,
        updatedAt: new Date(),
      });
    }
  };

  const handleSave = async () => {
    if (!experience) return;

    setIsSaving(true);
    try {
      updateExperience(experienceId, experience);
      alert('Experience updated successfully!');
      router.push('/admin/experiences');
    } catch (error) {
      console.error('Error updating experience:', error);
      alert('Error updating experience. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewPage = () => {
    if (experience?.slug) {
      window.open(`/experiences/${experience.slug}`, '_blank');
    }
  };

  const handleCopyUrl = () => {
    if (experience?.slug) {
      navigator.clipboard.writeText(`${window.location.origin}/experiences/${experience.slug}`);
      alert('URL copied to clipboard!');
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Text className="text-gray-600">Loading experience...</Text>
        </div>
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heading level={1} className="text-2xl font-bold mb-4">
            Experience Not Found
          </Heading>
          <Text className="text-gray-600 mb-4">
            The experience you're looking for doesn't exist.
          </Text>
          <Button onClick={() => router.push('/admin/experiences')}>
            Back to Experiences
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
                  onClick={() => router.push('/admin/experiences')}
                  variant="secondary"
                  size="sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <div>
                  <Heading level={1} className="text-3xl font-bold mb-2">
                    Edit Experience
                  </Heading>
                  <Text size="lg" className="text-gray-600">
                    {experience.title}
                  </Text>
                </div>
              </div>
              
              <div className="flex gap-4">
                {experience.slug && (
                  <>
                    <Button onClick={handleViewPage} variant="secondary">
                      <Eye className="w-4 h-4 mr-1" />
                      View Page
                    </Button>
                    <Button onClick={handleCopyUrl} variant="secondary">
                      <Copy className="w-4 h-4 mr-1" />
                      Copy URL
                    </Button>
                  </>
                )}
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">
                  Basic Information
                </Heading>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={experience.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={experience.status}
                      onChange={(e) => handleInputChange('status', e.target.value as ExperienceStatus)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={experience.type}
                      onChange={(e) => handleInputChange('type', e.target.value as ExperienceType)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {typeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={experience.difficulty}
                      onChange={(e) => handleInputChange('difficulty', e.target.value as ExperienceDifficulty)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {difficultyOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={experience.duration}
                      onChange={(e) => handleInputChange('duration', e.target.value)}
                      placeholder="e.g., 3 Hours, Half Day, Full Day"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (¥)
                    </label>
                    <input
                      type="number"
                      value={experience.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Original Price (¥)
                    </label>
                    <input
                      type="number"
                      value={experience.originalPrice || ''}
                      onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      value={experience.maxParticipants}
                      onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Min Participants
                    </label>
                    <input
                      type="number"
                      value={experience.minParticipants}
                      onChange={(e) => handleInputChange('minParticipants', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rating
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={experience.rating}
                      onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Review Count
                    </label>
                    <input
                      type="number"
                      value={experience.reviewCount}
                      onChange={(e) => handleInputChange('reviewCount', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Description
                  </label>
                  <textarea
                    value={experience.shortDescription}
                    onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={experience.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </Card>

              {/* Location Information */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">
                  Location Information
                </Heading>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={experience.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Region
                    </label>
                    <input
                      type="text"
                      value={experience.region}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={experience.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </Card>

              {/* Images */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">
                  Images
                </Heading>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Main Image URL
                    </label>
                    <input
                      type="url"
                      value={experience.image}
                      onChange={(e) => handleInputChange('image', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Images
                    </label>
                    <div className="space-y-2">
                      {experience.images.map((image, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="url"
                            value={image}
                            onChange={(e) => handleArrayChange('images', index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          <Button
                            onClick={() => handleRemoveArrayItem('images', index)}
                            variant="secondary"
                            size="sm"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        onClick={() => handleAddArrayItem('images')}
                        variant="secondary"
                        size="sm"
                      >
                        Add Image
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Highlights */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">
                  Highlights
                </Heading>
                
                <div className="space-y-2">
                  {experience.highlights.map((highlight, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={highlight}
                        onChange={(e) => handleArrayChange('highlights', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <Button
                        onClick={() => handleRemoveArrayItem('highlights', index)}
                        variant="secondary"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() => handleAddArrayItem('highlights')}
                    variant="secondary"
                    size="sm"
                  >
                    Add Highlight
                  </Button>
                </div>
              </Card>

              {/* Included Items */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">
                  Included Items
                </Heading>
                
                <div className="space-y-2">
                  {experience.included.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleArrayChange('included', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <Button
                        onClick={() => handleRemoveArrayItem('included', index)}
                        variant="secondary"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() => handleAddArrayItem('included')}
                    variant="secondary"
                    size="sm"
                  >
                    Add Item
                  </Button>
                </div>
              </Card>

              {/* Excluded Items */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">
                  Excluded Items
                </Heading>
                
                <div className="space-y-2">
                  {experience.excluded.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleArrayChange('excluded', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <Button
                        onClick={() => handleRemoveArrayItem('excluded', index)}
                        variant="secondary"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() => handleAddArrayItem('excluded')}
                    variant="secondary"
                    size="sm"
                  >
                    Add Item
                  </Button>
                </div>
              </Card>

              {/* Requirements */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">
                  Requirements
                </Heading>
                
                <div className="space-y-2">
                  {experience.requirements.map((requirement, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={requirement}
                        onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <Button
                        onClick={() => handleRemoveArrayItem('requirements', index)}
                        variant="secondary"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() => handleAddArrayItem('requirements')}
                    variant="secondary"
                    size="sm"
                  >
                    Add Requirement
                  </Button>
                </div>
              </Card>

              {/* Best Time to Visit */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">
                  Best Time to Visit
                </Heading>
                
                <div className="space-y-2">
                  {experience.bestTimeToVisit.map((time, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={time}
                        onChange={(e) => handleArrayChange('bestTimeToVisit', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <Button
                        onClick={() => handleRemoveArrayItem('bestTimeToVisit', index)}
                        variant="secondary"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() => handleAddArrayItem('bestTimeToVisit')}
                    variant="secondary"
                    size="sm"
                  >
                    Add Time
                  </Button>
                </div>
              </Card>

              {/* Tags */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">
                  Tags
                </Heading>
                
                <div className="space-y-2">
                  {experience.tags.map((tag, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <Button
                        onClick={() => handleRemoveArrayItem('tags', index)}
                        variant="secondary"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    onClick={() => handleAddArrayItem('tags')}
                    variant="secondary"
                    size="sm"
                  >
                    Add Tag
                  </Button>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Page Management */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">
                  Page Management
                </Heading>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug (URL)
                    </label>
                    <input
                      type="text"
                      value={experience.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      placeholder="e.g., sichuan-cooking-class"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Page Title
                    </label>
                    <input
                      type="text"
                      value={experience.pageTitle}
                      onChange={(e) => handleInputChange('pageTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meta Description
                    </label>
                    <textarea
                      value={experience.metaDescription}
                      onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </Card>

              {/* Settings */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">
                  Settings
                </Heading>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Text className="font-medium">Featured</Text>
                    <input
                      type="checkbox"
                      checked={experience.featured}
                      onChange={(e) => handleInputChange('featured', e.target.checked)}
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </div>
                </div>
              </Card>

              {/* Statistics */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">
                  Statistics
                </Heading>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Text className="text-sm text-gray-600">Created:</Text>
                    <Text className="text-sm">{experience.createdAt.toLocaleDateString()}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-sm text-gray-600">Last Updated:</Text>
                    <Text className="text-sm">{experience.updatedAt.toLocaleDateString()}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-sm text-gray-600">Status:</Text>
                    <Text className={`text-sm px-2 py-1 rounded-full ${
                      experience.status === 'active' ? 'bg-green-100 text-green-800' :
                      experience.status === 'inactive' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {experience.status}
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












