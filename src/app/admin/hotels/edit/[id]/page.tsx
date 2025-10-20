'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useHotelManagement } from '@/context/HotelManagementContext';
import { Hotel, HotelStatus } from '@/types';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';

export default function EditHotelPage() {
  const { user } = useUser();
  const { hotels, updateHotel } = useHotelManagement();
  const router = useRouter();
  const params = useParams();
  const hotelId = params.id as string;
  
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
        amenities: [''],
        basePrice: 200,
        maxOccupancy: 2
      }
    ]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 加载酒店数据
  useEffect(() => {
    const hotel = hotels.find(h => h.id === hotelId);
    if (hotel) {
      setFormData({
        name: hotel.name,
        city: hotel.city,
        location: hotel.location,
        description: hotel.description,
        starRating: hotel.starRating,
        images: hotel.images,
        roomTypes: hotel.roomTypes.map(rt => ({
          name: rt.name,
          description: rt.description,
          amenities: rt.amenities,
          basePrice: rt.basePrice || 200,
          maxOccupancy: rt.maxOccupancy || 2
        }))
      });
    }
    setIsLoading(false);
  }, [hotels, hotelId]);

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

  const handleAmenityChange = (roomTypeIndex: number, amenityIndex: number, value: string) => {
    const newRoomTypes = [...formData.roomTypes];
    newRoomTypes[roomTypeIndex].amenities[amenityIndex] = value;
    setFormData(prev => ({
      ...prev,
      roomTypes: newRoomTypes
    }));
  };

  const addRoomType = () => {
    setFormData(prev => ({
      ...prev,
      roomTypes: [
        ...prev.roomTypes,
        {
          name: '',
          description: '',
          amenities: [''],
          basePrice: 200,
          maxOccupancy: 2
        }
      ]
    }));
  };

  const removeRoomType = (index: number) => {
    setFormData(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.filter((_, i) => i !== index)
    }));
  };

  const addAmenity = (roomTypeIndex: number) => {
    const newRoomTypes = [...formData.roomTypes];
    newRoomTypes[roomTypeIndex].amenities.push('');
    setFormData(prev => ({
      ...prev,
      roomTypes: newRoomTypes
    }));
  };

  const removeAmenity = (roomTypeIndex: number, amenityIndex: number) => {
    const newRoomTypes = [...formData.roomTypes];
    newRoomTypes[roomTypeIndex].amenities = newRoomTypes[roomTypeIndex].amenities.filter((_, i) => i !== amenityIndex);
    setFormData(prev => ({
      ...prev,
      roomTypes: newRoomTypes
    }));
  };

  const addImage = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 验证必填字段
      if (!formData.name || !formData.city || !formData.location || !formData.description) {
        alert('Please fill in all required fields');
        return;
      }

      // 过滤空图片和房间类型
      const filteredImages = formData.images.filter(img => img.trim() !== '');
      const filteredRoomTypes = formData.roomTypes.filter(rt => 
        rt.name.trim() !== '' && rt.description.trim() !== ''
      );

      if (filteredImages.length === 0) {
        alert('Please add at least one image');
        return;
      }

      if (filteredRoomTypes.length === 0) {
        alert('Please add at least one room type');
        return;
      }

      // 更新酒店数据
      updateHotel(hotelId, {
        name: formData.name,
        city: formData.city,
        location: formData.location,
        description: formData.description,
        starRating: formData.starRating,
        images: filteredImages,
        roomTypes: filteredRoomTypes.map(rt => ({
          name: rt.name,
          description: rt.description,
          amenities: rt.amenities.filter(amenity => amenity.trim() !== ''),
          basePrice: rt.basePrice,
          maxOccupancy: rt.maxOccupancy
        }))
      });

      alert('Hotel updated successfully!');
      router.push('/admin/hotels');
    } catch (error) {
      console.error('Error updating hotel:', error);
      alert('Error updating hotel. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Text className="text-lg">Loading hotel data...</Text>
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
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    onClick={() => router.push('/admin/hotels')}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Hotels
                  </Button>
                </div>
                <Heading level={1} className="text-3xl font-bold mb-2">
                  Edit Hotel
                </Heading>
                <Text size="lg" className="text-gray-600">
                  Update hotel information and details
                </Text>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <Card className="p-6">
                <Heading level={3} className="text-xl font-bold mb-6">
                  Basic Information
                </Heading>
                
                <div className="space-y-6">
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
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter city"
                        required
                      />
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
                  <div className="flex items-center justify-between mb-6">
                    <Heading level={3} className="text-xl font-bold">
                      Images
                    </Heading>
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
                  
                  <div className="space-y-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => handleImageChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Enter image URL"
                        />
                        <Button
                          type="button"
                          onClick={() => removeImage(index)}
                          variant="secondary"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Room Types */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <Heading level={3} className="text-xl font-bold">
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
                  
                  <div className="space-y-6">
                    {formData.roomTypes.map((roomType, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <Heading level={4} className="text-lg font-semibold">
                            Room Type {index + 1}
                          </Heading>
                          <Button
                            type="button"
                            onClick={() => removeRoomType(index)}
                            variant="secondary"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Room Name
                            </label>
                            <input
                              type="text"
                              value={roomType.name}
                              onChange={(e) => handleRoomTypeChange(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Enter room name"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Description
                            </label>
                            <textarea
                              value={roomType.description}
                              onChange={(e) => handleRoomTypeChange(index, 'description', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Enter room description"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Base Price (USD)
                              </label>
                              <input
                                type="number"
                                value={roomType.basePrice}
                                onChange={(e) => handleRoomTypeChange(index, 'basePrice', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Occupancy
                              </label>
                              <input
                                type="number"
                                value={roomType.maxOccupancy}
                                onChange={(e) => handleRoomTypeChange(index, 'maxOccupancy', Number(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                min="1"
                                max="10"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Amenities
                            </label>
                            <div className="space-y-2">
                              {roomType.amenities.map((amenity, amenityIndex) => (
                                <div key={amenityIndex} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={amenity}
                                    onChange={(e) => handleAmenityChange(index, amenityIndex, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Enter amenity"
                                  />
                                  <Button
                                    type="button"
                                    onClick={() => removeAmenity(index, amenityIndex)}
                                    variant="secondary"
                                    size="sm"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                onClick={() => addAmenity(index)}
                                variant="secondary"
                                size="sm"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Amenity
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Updating...' : 'Update Hotel'}
              </Button>
            </div>
          </form>
        </Container>
      </Section>
    </div>
  );
}
