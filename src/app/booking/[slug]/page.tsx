'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useOrderManagement } from '@/context/OrderManagementContext';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { useExperienceManagement } from '@/context/ExperienceManagementContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useHotelManagement } from '@/context/HotelManagementContext';
import { HotelDetailModal } from '@/components/modals/HotelDetailModal';
import { WishlistSidebar } from '@/components/wishlist/WishlistSidebar';
import { 
  X, 
  Plus, 
  Minus, 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  Heart,
  Trash2,
  CreditCard,
  User,
  Mail,
  Phone,
  CheckCircle,
  Settings,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function InteractiveJourneyBookingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const { user } = useUser();
  const { items: wishlistItems, toggleWishlist, removeFromWishlist } = useWishlist();
  const { addOrder } = useOrderManagement();
  const { journeys, isLoading: journeysLoading } = useJourneyManagement();
  const { experiences, isLoading: experiencesLoading } = useExperienceManagement();
  const { hotels, isLoading: hotelsLoading } = useHotelManagement();
  const { items: cartItems, addExperienceToJourney, removeExperienceFromJourney } = useCart();
  
  // 查找对应的 journey
  const journey = useMemo(() => {
    return journeys.find(j => j.slug === slug);
  }, [journeys, slug]);
  
  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['modules', 'experiences']));
  
  // 旅行日期和客人信息
  const [travelDates, setTravelDates] = useState({
    departureDate: '',
    returnDate: '',
    travelers: 2
  });
  
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    specialRequests: ''
  });

  // 从 URL 参数获取初始值
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const checkIn = urlParams.get('checkIn');
    const adults = urlParams.get('adults');
    const children = urlParams.get('children');
    const travelers = urlParams.get('travelers');
    
    if (checkIn) {
      setTravelDates(prev => ({
        ...prev,
        departureDate: checkIn,
        travelers: travelers ? parseInt(travelers) : 2
      }));
    }
  }, []);

  // 获取可用的体验
  const availableExperiences = useMemo(() => {
    if (!journey) return [];
    return experiences.filter(exp => 
      journey.availableExperiences?.includes(exp.id) || 
      journey.experiences?.includes(exp.id)
    );
  }, [journey, experiences]);

  // 获取相关的住宿
  const relatedAccommodations = useMemo(() => {
    if (!journey) return [];
    const accommodationIds = journey.accommodations && journey.accommodations.length > 0 
      ? journey.accommodations 
      : (journey.availableAccommodations || []);
    
    return hotels.filter(hotel => 
      accommodationIds.includes(hotel.id) && hotel.status === 'active'
    );
  }, [journey, hotels]);

  // 当前购物车项
  const currentCartItem = useMemo(() => cartItems.find(c => c.slug === slug), [cartItems, slug]);

  // 合并：来自购物车的体验 + 心愿单中标记属于此 journey 的体验
  const journeyExperiences = useMemo(() => {
    const fromCart = (currentCartItem?.experiences || []).map(e => ({ id: e.id, title: e.title, unitPrice: e.unitPrice, source: 'cart' as const }));
    const fromWishlist = wishlistItems
      .filter(w => w.type === 'experience' && w.journeySlug === slug)
      .map(w => ({ id: w.id, title: w.title, unitPrice: typeof w.price === 'string' ? parseInt(w.price.replace(/[^0-9]/g, ''), 10) || 0 : 0, source: 'wishlist' as const }));
    // 去重（以 id 为准，优先保留购物车内项）
    const ids = new Set(fromCart.map(e => e.id));
    const merged = [...fromCart, ...fromWishlist.filter(e => !ids.has(e.id))];
    return merged;
  }, [currentCartItem, wishlistItems, slug]);

  // 计算总价
  const calculateTotalPrice = () => {
    if (!journey) return 0;
    
    let total = journey.price;
    
    // 添加选中的模块价格
    selectedModules.forEach(moduleId => {
      const module = journey.modules?.find(m => m.id === moduleId);
      if (module) {
        total += module.price;
      }
    });
    
    // 添加体验价格：来自购物车/心愿单的合并列表
    total += journeyExperiences.reduce((sum, e) => sum + (e.unitPrice || 0), 0);
    
    // 添加住宿价格（如果有）
    if (selectedAccommodation) {
      total += selectedAccommodation.price || 0;
    }
    
    return total;
  };

  // 删除某个体验（同时从购物车和心愿单移除）
  const handleRemoveExperience = (expId: string) => {
    removeExperienceFromJourney(slug, expId);
    removeFromWishlist(expId);
  };

  // 处理酒店点击
  const handleHotelClick = (hotel: any) => {
    setSelectedHotel(hotel);
    setIsModalOpen(true);
  };

  // 切换模块选择
  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // 切换体验选择
  const toggleExperience = (expId: string) => {
    setSelectedExperiences(prev => 
      prev.includes(expId) 
        ? prev.filter(id => id !== expId)
        : [...prev, expId]
    );
  };

  // 切换区域展开/收起
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // 处理预订
  const handleBooking = async () => {
    if (!journey) return;
    
    if (!travelDates.departureDate || !guestInfo.firstName || !guestInfo.lastName || !guestInfo.email) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // 创建订单（状态：pending）
      const order = addOrder({
        userId: user?.id || '',
        userEmail: user?.email || '',
        userName: `${guestInfo.firstName} ${guestInfo.lastName}`,
        accommodation: {
          id: selectedAccommodation?.id || journey.id,
          title: journey.title,
          location: journey.city,
          image: journey.image,
          price: calculateTotalPrice()
        },
        selectedModules: journey.modules?.filter(m => selectedModules.includes(m.id)) || [],
        // 解决类型不兼容：将所选体验以宽松类型提交
        selectedExperiences: (experiences.filter(e => selectedExperiences.includes(e.id)) as unknown as any[]),
        selectedAccommodation: selectedAccommodation,
        stayDetails: {
          checkIn: new Date(travelDates.departureDate),
          checkOut: new Date(travelDates.returnDate || travelDates.departureDate),
          adults: travelDates.travelers,
          children: 0
        },
        guestInfo: {
          fullName: `${guestInfo.firstName} ${guestInfo.lastName}`,
          email: guestInfo.email,
          phoneNumber: guestInfo.phone,
          specialRequests: guestInfo.specialRequests
        },
        totalPrice: calculateTotalPrice(),
        status: 'pending'
      });

      // 重定向到确认页面
      router.push(`/booking/confirm?orderId=${order.id}`);
    } catch (error) {
      console.error('Booking error:', error);
      alert(`Booking failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // 关闭模态框
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedHotel(null);
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

  if (journeysLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Text className="text-xl">Loading journey...</Text>
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Text className="text-xl mb-4">Journey not found</Text>
          <Button onClick={() => router.push('/journeys')}>
            Back to Journeys
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Wishlist Sidebar */}
      <WishlistSidebar />
      
      {/* Hotel Detail Modal */}
      <HotelDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        hotel={selectedHotel}
      />

      <Container size="xl" className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：行程信息和自定义选项 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Journey 基本信息 */}
            <Card className="p-6">
              <div className="flex gap-4 mb-6">
                <img
                  src={journey.image}
                  alt={journey.title}
                  className="w-32 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <Heading level={2} className="text-2xl font-bold mb-2">
                    {journey.title}
                  </Heading>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {journey.city}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {journey.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {journey.maxParticipants} max
                    </div>
                  </div>
                </div>
              </div>
              
              <Text className="text-gray-700 leading-relaxed">
                {journey.description}
              </Text>
            </Card>

            {/* 旅行详情 */}
            <Card className="p-6">
              <Heading level={3} className="text-xl font-bold mb-4">
                Travel Details
              </Heading>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departure Date *
                  </label>
                  <input
                    type="date"
                    value={travelDates.departureDate}
                    onChange={(e) => setTravelDates(prev => ({ ...prev, departureDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Return Date
                  </label>
                  <input
                    type="date"
                    value={travelDates.returnDate}
                    onChange={(e) => setTravelDates(prev => ({ ...prev, returnDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Travelers *
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTravelDates(prev => ({ ...prev, travelers: Math.max(1, prev.travelers - 1) }))}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="px-4 py-2 border border-gray-300 rounded-lg min-w-[60px] text-center">
                    {travelDates.travelers}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTravelDates(prev => ({ ...prev, travelers: Math.min(journey.maxParticipants, prev.travelers + 1) }))}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* 可自定义的旅行模块 */}
            {journey.modules && journey.modules.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Heading level={3} className="text-xl font-bold">
                    Customize Your Journey Modules
                  </Heading>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('modules')}
                  >
                    {expandedSections.has('modules') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
                
                {expandedSections.has('modules') && (
                  <div className="space-y-4">
                    <Text size="sm" className="text-gray-600 mb-4">
                      Choose which modules to include in your journey. Base modules are included by default.
                    </Text>
                    
                    {journey.modules.map((module) => (
                      <div key={module.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Heading level={4} className="font-semibold">{module.title}</Heading>
                            {module.included && (
                              <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded-full">
                                Included
                              </span>
                            )}
                          </div>
                          <Text size="sm" className="text-gray-600 mb-2">{module.description}</Text>
                          <div className="flex items-center gap-4 text-sm">
                            <Text className="text-primary-600 font-medium">¥{module.price}</Text>
                            <Text className="text-gray-500">{module.duration}</Text>
                          </div>
                        </div>
                        <Button
                          variant={selectedModules.includes(module.id) || module.included ? "primary" : "outline"}
                          onClick={() => toggleModule(module.id)}
                          disabled={!!module.included}
                        >
                          {selectedModules.includes(module.id) || module.included ? 'Selected' : 'Add'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* 体验清单（来自购物车与心愿单归属本行程的条目，可删除） */}
            <Card className="p-6">
              <Heading level={3} className="text-xl font-bold mb-4">Experiences for this Journey</Heading>
              {journeyExperiences.length === 0 ? (
                <Text size="sm" className="text-gray-500">No extra experiences added</Text>
              ) : (
                <div className="space-y-3">
                  {journeyExperiences.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                      <div className="flex-1 min-w-0">
                        <Text className="font-medium truncate">{e.title}</Text>
                        <Text size="sm" className="text-gray-600">¥{e.unitPrice}</Text>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleRemoveExperience(e.id)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* 住宿选择 */}
            {relatedAccommodations.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Heading level={3} className="text-xl font-bold">
                    Accommodation Options
                  </Heading>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('accommodations')}
                  >
                    {expandedSections.has('accommodations') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
                
                {expandedSections.has('accommodations') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {relatedAccommodations.map((hotel) => (
                      <div key={hotel.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors">
                        <div className="flex gap-3">
                          <img
                            src={hotel.images?.[0] || '/images/hotels/default.jpg'}
                            alt={hotel.name}
                            className="w-20 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <Heading level={4} className="font-semibold">{hotel.name}</Heading>
                            <Text size="sm" className="text-gray-600">{hotel.city}</Text>
                            <Text size="sm" className="text-primary-600 font-medium">
                              From ¥{hotel.roomTypes?.[0]?.basePrice || 0}/night
                            </Text>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full mt-3"
                          onClick={() => handleHotelClick(hotel)}
                        >
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* 客人信息 */}
            <Card className="p-6">
              <Heading level={3} className="text-xl font-bold mb-4">
                Guest Information
              </Heading>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests
                </label>
                <textarea
                  value={guestInfo.specialRequests}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, specialRequests: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Any special requests or dietary requirements..."
                />
              </div>
            </Card>
          </div>

          {/* 右侧：价格摘要 */}
          <div className="space-y-6">
            <Card className="p-6 sticky top-6">
              <Heading level={3} className="text-xl font-bold mb-4">
                Booking Summary
              </Heading>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Text>Journey Base Price</Text>
                  <Text>¥{journey.price}</Text>
                </div>
                
                {selectedModules.length > 0 && (
                  <div>
                    <Text size="sm" className="text-gray-600 mb-1">Selected Modules:</Text>
                    {selectedModules.map(moduleId => {
                      const module = journey.modules?.find(m => m.id === moduleId);
                      return module ? (
                        <div key={moduleId} className="flex justify-between text-sm">
                          <Text>{module.title}</Text>
                          <Text>¥{module.price}</Text>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                
                {selectedExperiences.length > 0 && (
                  <div>
                    <Text size="sm" className="text-gray-600 mb-1">Selected Experiences:</Text>
                    {selectedExperiences.map(expId => {
                      const exp = experiences.find(e => e.id === expId);
                      return exp ? (
                        <div key={expId} className="flex justify-between text-sm">
                          <Text>{exp.title}</Text>
                          <Text>¥{exp.price}</Text>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                
                {selectedAccommodation && (
                  <div className="flex justify-between">
                    <Text>Accommodation</Text>
                    <Text>¥{selectedAccommodation.price || 0}</Text>
                  </div>
                )}
                
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <Text>Total Price</Text>
                    <Text>¥{calculateTotalPrice()}</Text>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleBooking}
                disabled={isLoading || !travelDates.departureDate}
                className="w-full mt-6 py-3 text-lg font-semibold"
                variant="primary"
              >
                {isLoading ? 'Processing...' : 'Continue to Payment'}
              </Button>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}