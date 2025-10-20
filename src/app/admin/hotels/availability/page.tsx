'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useHotelManagement } from '@/context/HotelManagementContext';
import { Hotel, RoomAvailability } from '@/types';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  ToggleLeft, 
  ToggleRight,
  Plus,
  Save,
  Edit3
} from 'lucide-react';

export default function HotelAvailabilityPage() {
  const { user } = useUser();
  const { hotels, updateRoomPrice, toggleRoomAvailability, updateRoomAvailability } = useHotelManagement();
  const router = useRouter();
  
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);

  // 从URL参数获取预选酒店
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hotelId = urlParams.get('hotel');
    if (hotelId) {
      const hotel = hotels.find(h => h.id === hotelId);
      if (hotel) {
        setSelectedHotel(hotel);
      }
    }
  }, [hotels]);

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

  const handleHotelSelect = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setSelectedRoomType('');
    setSelectedDate('');
    setPrice(0);
    setIsEditing(false);
  };

  const handleRoomTypeSelect = (roomTypeName: string) => {
    setSelectedRoomType(roomTypeName);
    setSelectedDate('');
    setPrice(0);
    setIsEditing(false);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setIsEditing(false);
    
    // 查找现有的可用性记录
    if (selectedHotel && selectedRoomType && selectedHotel.availability) {
      const existingAvailability = selectedHotel.availability.find(
        item => item.roomTypeName === selectedRoomType && item.date === date
      );
      
      if (existingAvailability) {
        setPrice(existingAvailability.price);
        setIsEditing(true);
      } else {
        // 使用基础价格
        const roomType = selectedHotel.roomTypes.find(rt => rt.name === selectedRoomType);
        setPrice(roomType?.basePrice || 200);
      }
    }
  };

  const handlePriceUpdate = () => {
    if (selectedHotel && selectedRoomType && selectedDate && price > 0) {
      updateRoomPrice(selectedHotel.id, selectedRoomType, selectedDate, price);
      setIsEditing(false);
    }
  };

  const handleAvailabilityToggle = (roomTypeName: string, date: string) => {
    if (selectedHotel) {
      toggleRoomAvailability(selectedHotel.id, roomTypeName, date);
    }
  };

  const getAvailabilityForRoomType = (roomTypeName: string) => {
    if (!selectedHotel || !selectedHotel.availability) return [];
    return selectedHotel.availability.filter(item => item.roomTypeName === roomTypeName);
  };

  const isAvailable = (roomTypeName: string, date: string) => {
    const availability = getAvailabilityForRoomType(roomTypeName);
    const item = availability.find(item => item.date === date);
    return item ? item.available : false;
  };

  const getPriceForDate = (roomTypeName: string, date: string) => {
    const availability = getAvailabilityForRoomType(roomTypeName);
    const item = availability.find(item => item.date === date);
    return item ? item.price : 0;
  };

  // 生成未来30天的日期
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const dates = generateDates();

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
                  Hotel Availability & Pricing
                </Heading>
                <Text size="lg" className="text-gray-600">
                  Manage room availability and pricing for specific dates
                </Text>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 酒店选择 */}
            <div className="lg:col-span-1">
              <Card className="p-6">
                <Heading level={3} className="text-xl font-bold mb-4">
                  Select Hotel
                </Heading>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {hotels.filter(hotel => hotel.status === 'active').map((hotel) => (
                    <button
                      key={hotel.id}
                      onClick={() => handleHotelSelect(hotel)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedHotel?.id === hotel.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{hotel.name}</div>
                      <div className="text-sm text-gray-500">{hotel.city}</div>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* 房间类型和日期管理 */}
            <div className="lg:col-span-2">
              {selectedHotel ? (
                <div className="space-y-6">
                  {/* 房间类型选择 */}
                  <Card className="p-6">
                    <Heading level={3} className="text-xl font-bold mb-4">
                      Room Types
                    </Heading>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedHotel.roomTypes.map((roomType) => (
                        <button
                          key={roomType.name}
                          onClick={() => handleRoomTypeSelect(roomType.name)}
                          className={`p-4 rounded-lg border text-left transition-colors ${
                            selectedRoomType === roomType.name
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-gray-900">{roomType.name}</div>
                          <div className="text-sm text-gray-500">Base: ${roomType.basePrice}</div>
                          <div className="text-sm text-gray-500">Max: {roomType.maxOccupancy} guests</div>
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* 日期和价格管理 */}
                  {selectedRoomType && (
                    <Card className="p-6">
                      <Heading level={3} className="text-xl font-bold mb-4">
                        Availability & Pricing - {selectedRoomType}
                      </Heading>
                      
                      {/* 价格编辑区域 */}
                      {selectedDate && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div>
                              <Text className="text-sm text-gray-600">Selected Date:</Text>
                              <Text className="font-medium">{selectedDate}</Text>
                            </div>
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price (USD)
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={price}
                                  onChange={(e) => setPrice(Number(e.target.value))}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  min="0"
                                  step="0.01"
                                />
                                <Button
                                  onClick={handlePriceUpdate}
                                  variant="primary"
                                  className="flex items-center gap-2"
                                >
                                  <Save className="w-4 h-4" />
                                  Save
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 日期网格 */}
                      <div className="grid grid-cols-7 gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                            {day}
                          </div>
                        ))}
                      {dates.map((date) => {
                        const dateObj = new Date(date);
                        const dayOfWeek = dateObj.getDay();
                        const roomAvailable = isAvailable(selectedRoomType, date);
                        const currentPrice = getPriceForDate(selectedRoomType, date);
                        const isToday = date === new Date().toISOString().split('T')[0];
                          
                          return (
                            <div
                              key={date}
                              className={`p-2 text-center text-sm rounded-lg border cursor-pointer transition-colors ${
                                selectedDate === date
                                  ? 'border-primary-500 bg-primary-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              } ${isToday ? 'bg-blue-50' : ''}`}
                              onClick={() => handleDateSelect(date)}
                            >
                              <div className="font-medium">{dateObj.getDate()}</div>
                              <div className="text-xs text-gray-500">
                                {roomAvailable ? `$${currentPrice}` : 'N/A'}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAvailabilityToggle(selectedRoomType, date);
                                }}
                                className="mt-1"
                              >
                                {roomAvailable ? (
                                  <ToggleRight className="w-4 h-4 text-green-500" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <Heading level={3} className="text-xl font-bold mb-2">
                    Select a Hotel
                  </Heading>
                  <Text className="text-gray-600">
                    Choose a hotel from the list to manage its availability and pricing
                  </Text>
                </Card>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
