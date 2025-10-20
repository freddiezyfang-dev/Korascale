'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useHotelManagement } from '@/context/HotelManagementContext';
import { Hotel, HotelStatus } from '@/types';
import { ArrowLeft, Upload, Plus } from 'lucide-react';

export default function AddHotelPage() {
  const { user } = useUser();
  const { hotels } = useHotelManagement();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    location: '',
    description: '',
    starRating: 'comfortable',
    images: [''],
    roomTypes: [
      {
        name: '',
        description: '',
        amenities: ['']
      }
    ]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRoomTypeChange = (index: number, field: string, value: any) => {
    const newRoomTypes = [...formData.roomTypes];
    newRoomTypes[index] = {
      ...newRoomTypes[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      roomTypes: newRoomTypes
    }));
  };

  const addRoomType = () => {
    setFormData(prev => ({
      ...prev,
      roomTypes: [...prev.roomTypes, { name: '', description: '', amenities: [''] }]
    }));
  };

  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 这里可以添加保存到数据库的逻辑
      // 目前只是模拟保存
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('New hotel data:', formData);
      alert('Hotel added successfully! (This is a demo - data not actually saved)');
      
      // 返回酒店管理页面
      router.push('/admin/hotels');
    } catch (error) {
      console.error('Error adding hotel:', error);
      alert('Error adding hotel. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Section background="primary" padding="xl">
        <Container size="lg">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                onClick={() => router.push('/admin/hotels')}
                variant="secondary"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Hotels
              </Button>
            </div>
            <Heading level={1} className="text-3xl font-bold mb-2">
              Add New Hotel
            </Heading>
            <Text size="lg" className="text-gray-600">
              Add a new hotel to the platform
            </Text>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <Card className="p-6">
                <Heading level={2} className="text-xl font-semibold mb-4">
                  Basic Information
                </Heading>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hotel Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter hotel name"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <select
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select City</option>
                        <option value="Chongqing">Chongqing</option>
                        <option value="Chengdu">Chengdu</option>
                        <option value="Beijing">Beijing</option>
                        <option value="Shanghai">Shanghai</option>
                        <option value="Guangzhou">Guangzhou</option>
                        <option value="Shenzhen">Shenzhen</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Star Rating
                      </label>
                      <select
                        value={formData.starRating}
                        onChange={(e) => handleInputChange('starRating', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="comfortable">Comfortable</option>
                        <option value="upscale">Upscale</option>
                        <option value="luxury">Luxury</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter hotel location"
                      required
                    />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter hotel description"
                      required
                    />
                  </div>
                </div>
              </Card>

              {/* Images and Room Types */}
              <div className="space-y-6">
                {/* Images */}
                <Card className="p-6">
                  <Heading level={2} className="text-xl font-semibold mb-4">
                    Hotel Images
                  </Heading>
                  
                  <div className="space-y-3">
                    {formData.images.map((image, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => {
                            const newImages = [...formData.images];
                            newImages[index] = e.target.value;
                            handleInputChange('images', newImages);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Enter image URL"
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      onClick={addImage}
                      variant="secondary"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Image
                    </Button>
                  </div>
                </Card>

                {/* Room Types */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Heading level={2} className="text-xl font-semibold">
                      Room Types
                    </Heading>
                    <Button
                      type="button"
                      onClick={addRoomType}
                      variant="secondary"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Room Type
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.roomTypes.map((roomType, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Room Name
                            </label>
                            <input
                              type="text"
                              value={roomType.name}
                              onChange={(e) => handleRoomTypeChange(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="e.g., Deluxe King Room"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              value={roomType.description}
                              onChange={(e) => handleRoomTypeChange(index, 'description', e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Room description"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Amenities (comma-separated)
                            </label>
                            <input
                              type="text"
                              value={roomType.amenities.join(', ')}
                              onChange={(e) => handleRoomTypeChange(index, 'amenities', e.target.value.split(', ').filter(a => a.trim()))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="WiFi, Air Conditioning, Minibar, Safe"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end gap-4">
              <Button
                type="button"
                onClick={() => router.push('/admin/hotels')}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding Hotel...' : 'Add Hotel'}
              </Button>
            </div>
          </form>
        </Container>
      </Section>
    </div>
  );
}
