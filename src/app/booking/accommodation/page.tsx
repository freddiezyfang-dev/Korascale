'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useCart } from '@/context/CartContext';
import { useHotelManagement } from '@/context/HotelManagementContext';
import { Calendar, Users, MapPin, Star, Wifi, Car, Utensils, Dumbbell } from 'lucide-react';

function AccommodationBookingContent() {
  const { user } = useUser();
  const { addJourney } = useCart();
  const { hotels } = useHotelManagement();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 从 URL 参数获取酒店信息
  const hotelId = searchParams.get('hotelId');
  const checkIn = searchParams.get('checkIn');
  const adults = parseInt(searchParams.get('adults') || '2');
  const children = parseInt(searchParams.get('children') || '0');
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [roomTypeQuantities, setRoomTypeQuantities] = useState<Record<number, number>>({});
  
  // 从房型汇总设施（若酒店无顶层amenities则从roomTypes聚合）
  const aggregatedAmenities = useMemo(() => {
    if (!selectedHotel) return [] as string[];
    const topLevel = Array.isArray(selectedHotel.amenities) ? selectedHotel.amenities : [];
    const fromRooms = Array.isArray(selectedHotel.roomTypes)
      ? selectedHotel.roomTypes.flatMap((rt: any) => Array.isArray(rt.amenities) ? rt.amenities : [])
      : [];
    return Array.from(new Set([ ...topLevel, ...fromRooms ]));
  }, [selectedHotel]);
  
  // 预订表单状态
  const [stayDetails, setStayDetails] = useState({
    checkIn: checkIn || '',
    checkOut: '',
    adults: adults,
    children: children,
  });
  
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    specialRequests: '',
  });

  // 从localStorage恢复表单数据
  useEffect(() => {
    const savedFormData = localStorage.getItem('accommodation_booking_form');
    if (savedFormData) {
      try {
        const { stayDetails: savedStayDetails, guestInfo: savedGuestInfo } = JSON.parse(savedFormData);
        setStayDetails(prev => ({ ...prev, ...savedStayDetails }));
        setGuestInfo(prev => ({ ...prev, ...savedGuestInfo }));
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, []);

  // 查找选中的酒店
  useEffect(() => {
    if (hotelId && hotels.length > 0) {
      const hotel = hotels.find(h => h.id === hotelId);
      if (hotel) {
        setSelectedHotel(hotel);
      }
    }
  }, [hotelId, hotels]);

  useEffect(() => {
    // 当切换酒店时重置图片索引
    setImageIndex(0);
    // 重置房型数量
    setRoomTypeQuantities({});
  }, [selectedHotel]);

  // 计算总价
  const calculateTotalPrice = () => {
    if (!stayDetails.checkIn || !stayDetails.checkOut || !selectedHotel) return 0;
    
    const checkInDate = new Date(stayDetails.checkIn);
    const checkOutDate = new Date(stayDetails.checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // 使用默认价格，因为hotels.json中没有price字段
    const defaultPrice = 500; // 默认每晚500元
    return nights * defaultPrice;
  };

  // 处理预订
  const handleBooking = async () => {
    if (!stayDetails.checkIn || !stayDetails.checkOut || !guestInfo.firstName || !guestInfo.lastName || !guestInfo.email) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // 将酒店预订添加到购物车（作为特殊的journey item）
      const accommodationSlug = `accommodation-${selectedHotel.id}`;
      
      addJourney({
        journeyId: selectedHotel.id,
        slug: accommodationSlug,
        title: selectedHotel.name,
        image: selectedHotel.images?.[0] || '',
        dates: {
          start: stayDetails.checkIn,
          end: stayDetails.checkOut
        },
        travelers: {
          adults: stayDetails.adults,
          children: stayDetails.children
        },
        basePrice: calculateTotalPrice(),
        experiences: []
      });

      // 保存表单数据到localStorage以便后退时恢复
      localStorage.setItem('accommodation_booking_form', JSON.stringify({
        stayDetails,
        guestInfo
      }));

      // 重定向到review页面
      router.push('/booking/review');
    } catch (error) {
      console.error('Booking error:', error);
      alert(`Booking failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Text className="text-xl mb-4">Please log in to make a booking</Text>
          <Button onClick={() => router.push('/auth/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!selectedHotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Text className="text-xl mb-4">Hotel not found</Text>
          <Button onClick={() => router.push('/accommodations')}>
            Back to Accommodations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Container size="xl" className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：酒店信息 */}
          <div className="space-y-6">
            <Card className="p-6">
              <Heading level={2} className="text-2xl font-bold mb-4">
                {selectedHotel.name}
              </Heading>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <Text>{selectedHotel.city}</Text>
                </div>
                
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                  <Text>{selectedHotel.rating}/5 ({selectedHotel.reviewCount} reviews)</Text>
                </div>
                
                <div className="flex items-center gap-2">
                  <Text className="text-2xl font-bold text-primary-600">
                    ¥500/night
                  </Text>
                </div>
              </div>
              
              {/* 酒店图片轮播 */}
              <div className="mt-6">
                <div className="relative w-full h-64 overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={(selectedHotel.images && selectedHotel.images[imageIndex]) || '/images/hotels/default.jpg'}
                    alt={selectedHotel.name}
                    className="w-full h-full object-cover"
                  />

                  {/* 上一张 */}
                  {Array.isArray(selectedHotel.images) && selectedHotel.images.length > 1 && (
                    <>
                      <button
                        aria-label="Previous image"
                        onClick={() => setImageIndex((prev) => (prev - 1 + selectedHotel.images.length) % selectedHotel.images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-2 rounded-md hover:bg-black/70"
                      >
                        ‹
                      </button>
                      {/* 下一张 */}
                      <button
                        aria-label="Next image"
                        onClick={() => setImageIndex((prev) => (prev + 1) % selectedHotel.images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-2 rounded-md hover:bg-black/70"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>

                {/* 缩略图指示器 */}
                {Array.isArray(selectedHotel.images) && selectedHotel.images.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {selectedHotel.images.map((src: string, idx: number) => (
                      <button
                        key={idx}
                        aria-label={`Show image ${idx + 1}`}
                        onClick={() => setImageIndex(idx)}
                        className={`h-14 w-20 flex-shrink-0 rounded-md overflow-hidden border ${idx === imageIndex ? 'border-primary-600' : 'border-gray-300'}`}
                      >
                        <img src={src} alt={`${selectedHotel.name} ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 设施 */}
              <div className="mt-6">
                <Heading level={3} className="text-lg font-semibold mb-3">
                  Amenities
                </Heading>
                {aggregatedAmenities.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {aggregatedAmenities.map((amenity: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <Text size="sm">{amenity}</Text>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text size="sm" className="text-gray-500">Amenities information will be provided at check-in.</Text>
                )}
              </div>

              {/* 房型信息 */}
              <div className="mt-6">
                <Heading level={3} className="text-lg font-semibold mb-3">
                  Room Types
                </Heading>
                {Array.isArray(selectedHotel.roomTypes) && selectedHotel.roomTypes.length > 0 ? (
                  <div className="space-y-4">
                    {selectedHotel.roomTypes.map((rt: any, idx: number) => (
                      <div key={idx} className="border rounded-lg p-4 relative">
                        <Heading level={4} className="text-base font-semibold mb-2">
                          {rt.name || 'Room'}
                        </Heading>
                        {rt.description && (
                          <Text size="sm" className="text-gray-700 mb-3">{rt.description}</Text>
                        )}
                        {Array.isArray(rt.amenities) && rt.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {rt.amenities.map((a: string, i: number) => (
                              <span key={i} className="text-xs px-2 py-1 rounded-full border border-gray-300 bg-gray-50">
                                {a}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 数量选择器 - 右下角 */}
                        <div className="mt-4 flex items-center justify-end gap-3">
                          <Text size="sm" className="text-gray-700">Quantity</Text>
                          <div className="flex items-center border rounded-md overflow-hidden">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() => setRoomTypeQuantities(prev => ({ ...prev, [idx]: Math.max(0, (prev[idx] || 0) - 1) }))}
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                            >
                              −
                            </button>
                            <div className="px-4 py-1 min-w-[2rem] text-center">
                              {roomTypeQuantities[idx] ?? 0}
                            </div>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => setRoomTypeQuantities(prev => ({ ...prev, [idx]: (prev[idx] || 0) + 1 }))}
                              className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Text size="sm" className="text-gray-500">Room type details will be arranged upon request.</Text>
                )}
              </div>
            </Card>
          </div>

          {/* 右侧：预订表单 */}
          <div className="space-y-6">
            <Card className="p-6">
              <Heading level={2} className="text-2xl font-bold mb-6">
                Booking Details
              </Heading>
              
              {/* 入住详情 */}
              <div className="space-y-4 mb-6">
                <Heading level={3} className="text-lg font-semibold">
                  Stay Details
                </Heading>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      value={stayDetails.checkIn}
                      onChange={(e) => setStayDetails(prev => ({ ...prev, checkIn: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      value={stayDetails.checkOut}
                      onChange={(e) => setStayDetails(prev => ({ ...prev, checkOut: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adults
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={stayDetails.adults}
                      onChange={(e) => setStayDetails(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Children
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stayDetails.children}
                      onChange={(e) => setStayDetails(prev => ({ ...prev, children: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              {/* 客人信息 */}
              <div className="space-y-4 mb-6">
                <Heading level={3} className="text-lg font-semibold">
                  Guest Information
                </Heading>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={guestInfo.firstName}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={guestInfo.lastName}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Requests
                  </label>
                  <textarea
                    value={guestInfo.specialRequests}
                    onChange={(e) => setGuestInfo(prev => ({ ...prev, specialRequests: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Any special requests or notes..."
                  />
                </div>
              </div>
              
              {/* 价格摘要 */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <Heading level={3} className="text-lg font-semibold mb-3">
                  Price Summary
                </Heading>
                
                {stayDetails.checkIn && stayDetails.checkOut && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Text>Nights: {Math.ceil((new Date(stayDetails.checkOut).getTime() - new Date(stayDetails.checkIn).getTime()) / (1000 * 60 * 60 * 24))}</Text>
                        <Text>¥500/night</Text>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <Text>Total Price:</Text>
                          <Text>¥{calculateTotalPrice()}</Text>
                        </div>
                      </div>
                    </div>
                )}
              </div>
              
              {/* 预订按钮 */}
              <Button
                onClick={handleBooking}
                disabled={isLoading || !stayDetails.checkIn || !stayDetails.checkOut}
                className="w-full py-3 text-lg font-semibold"
                variant="primary"
              >
                {isLoading ? 'Processing...' : 'Continue to Review'}
              </Button>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}

export default function AccommodationBookingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AccommodationBookingContent />
    </Suspense>
  );
}
