'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useWishlist } from '@/context/WishlistContext';
import { useOrderManagement } from '@/context/OrderManagementContext';
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
  CheckCircle
} from 'lucide-react';

// 行程模块数据
const journeyModules = [
  {
    id: 'panda-base',
    title: 'Chengdu Panda Base Visit',
    description: 'Visit the world-famous Chengdu Research Base of Giant Panda Breeding',
    duration: '3 hours',
    price: 299,
    image: '/images/journey-cards/chengdu-daytour/panda-base.jpeg',
    included: true
  },
  {
    id: 'cuisine-museum',
    title: 'Sichuan Cuisine Museum',
    description: 'Interactive food experience with snack making and tasting',
    duration: '2 hours',
    price: 199,
    image: '/images/journey-cards/chengdu-daytour/cooking-class.jpg',
    included: true
  },
  {
    id: 'sichuan-opera',
    title: 'Sichuan Opera Performance',
    description: 'Traditional face-changing performance at Shufeng Yayuan Theatre',
    duration: '2 hours',
    price: 399,
    image: '/images/journey-cards/chengdu-daytour/face-changing-opera.jpg',
    included: true
  },
  {
    id: 'hot-pot-dinner',
    title: 'Authentic Hot Pot Dinner',
    description: 'Classic Chengdu hot pot meal experience',
    duration: '1.5 hours',
    price: 149,
    image: '/images/journey-cards/chengdu-daytour/hot-pot.png',
    included: true
  }
];

// 额外体验模块
const additionalExperiences = [
  {
    id: 'cooking-class',
    title: 'Sichuan Cooking Class',
    description: 'Learn authentic Sichuan cooking techniques from local chefs',
    duration: '3 hours',
    price: 299,
    image: '/images/journey-cards/chengdu-daytour/cooking-class.jpg'
  },
  {
    id: 'tea-ceremony',
    title: 'Traditional Tea Ceremony',
    description: 'Experience the ancient art of Chinese tea ceremony',
    duration: '2 hours',
    price: 199,
    image: '/images/journey-cards/chengdu-daytour/face-changing-opera.jpg'
  },
  {
    id: 'opera-workshop',
    title: 'Face-Changing Workshop',
    description: 'Learn the secrets of Sichuan opera face-changing technique',
    duration: '4 hours',
    price: 399,
    image: '/images/journey-cards/chengdu-daytour/face-changing-opera.jpg'
  }
];

// 住宿选项
const accommodationOptions = [
  {
    id: 'tibet-hotel',
    title: 'Chengdu Tibet Hotel',
    description: 'Traditional Sichuan architecture with modern luxury amenities',
    price: 899,
    rating: 5,
    image: '/images/hotels/chengdu-tibet-1.png'
  },
  {
    id: 'pagoda-hotel',
    title: 'Chengdu Pagoda Hotel',
    description: 'Peaceful retreat featuring traditional Chinese gardens',
    price: 599,
    rating: 4,
    image: '/images/hotels/chengdu-pagoda-1.png'
  },
  {
    id: 'wanda-hotel',
    title: 'Chengdu Wanda Hotel',
    description: 'Conveniently located with all modern amenities',
    price: 399,
    rating: 4,
    image: '/images/hotels/chengdu-wanda-1.png'
  }
];

export default function ChengduDeepDiveBooking() {
  const { user } = useUser();
  const { items: wishlistItems, removeFromWishlist } = useWishlist();
  const { addOrder } = useOrderManagement();
  const router = useRouter();

  // 状态管理
  const [selectedModules, setSelectedModules] = useState(journeyModules);
  const [selectedExperiences, setSelectedExperiences] = useState([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);
  const [guestInfo, setGuestInfo] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: '',
    nationality: '',
    specialRequests: ''
  });
  const [travelDates, setTravelDates] = useState({
    departureDate: '',
    returnDate: '',
    travelers: 1
  });
  const [isLoading, setIsLoading] = useState(false);

  // 检查用户登录状态
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  // 计算总价格
  const calculateTotalPrice = () => {
    let total = 0;
    
    // 基础行程模块
    selectedModules.forEach(module => {
      total += module.price * travelDates.travelers;
    });
    
    // 额外体验
    selectedExperiences.forEach(exp => {
      total += exp.price * travelDates.travelers;
    });
    
    // 住宿（按天数计算，假设1天）
    if (selectedAccommodation) {
      total += selectedAccommodation.price;
    }
    
    return total;
  };

  // 移除模块
  const removeModule = (moduleId) => {
    setSelectedModules(prev => prev.filter(module => module.id !== moduleId));
  };

  // 添加额外体验
  const addExperience = (experience) => {
    setSelectedExperiences(prev => [...prev, experience]);
  };

  // 移除额外体验
  const removeExperience = (experienceId) => {
    setSelectedExperiences(prev => prev.filter(exp => exp.id !== experienceId));
  };

  // 从愿望清单添加
  const addFromWishlist = (item) => {
    if (item.type === 'experience') {
      addExperience(item);
    } else if (item.type === 'accommodation') {
      setSelectedAccommodation(item);
    }
    removeFromWishlist(item.id);
  };

  // 处理预订
  const handleBooking = async () => {
    if (!travelDates.departureDate || !guestInfo.firstName || !guestInfo.lastName || !guestInfo.email) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    
    try {
      // 创建订单（状态：pending）
      const order = addOrder({
        userId: user.id,
        userEmail: user.email,
        userName: `${guestInfo.firstName} ${guestInfo.lastName}`,
        accommodation: {
          id: selectedAccommodation?.id || 'journey-only',
          title: 'Chengdu Deep Dive Journey',
          location: 'Chengdu, Sichuan',
          image: '/images/journey-cards/chengdu-deep-dive.jpeg',
          price: calculateTotalPrice()
        },
        selectedModules: selectedModules,
        selectedExperiences: selectedExperiences,
        selectedAccommodation: selectedAccommodation,
        stayDetails: {
          checkIn: new Date(travelDates.departureDate),
          checkOut: new Date(travelDates.returnDate || travelDates.departureDate),
          guests: travelDates.travelers
        },
        guestInfo: {
          firstName: guestInfo.firstName,
          lastName: guestInfo.lastName,
          email: guestInfo.email,
          phone: guestInfo.phone,
          nationality: guestInfo.nationality,
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heading level={1} className="text-2xl font-bold mb-4">
            Please Login to Continue
          </Heading>
          <Button onClick={() => router.push('/auth/login')}>
            Go to Login
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
            <Heading level={1} className="text-3xl font-bold mb-2">
              Customize Your Chengdu Deep Dive Journey
            </Heading>
            <Text size="lg" className="text-gray-600">
              Personalize your experience by selecting modules and adding extras
            </Text>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧：行程模块和愿望清单 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 基础行程模块 */}
              <Card className="p-6">
                <Heading level={2} className="text-lg font-semibold mb-4 truncate">
                  Journey Modules (Included)
                </Heading>
                <div className="space-y-4">
                  {selectedModules.map((module) => (
                    <div key={module.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <img 
                        src={module.image} 
                        alt={module.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <Text className="font-medium">{module.title}</Text>
                        <Text size="sm" className="text-gray-600">{module.description}</Text>
                        <div className="flex items-center gap-4 mt-2">
                          <Text size="sm" className="text-gray-500">
                            <Clock className="w-4 h-4 inline mr-1" />
                            {module.duration}
                          </Text>
                          <Text size="sm" className="font-medium text-primary-600">
                            ¥{module.price}/person
                          </Text>
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeModule(module.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>



              {/* 愿望清单 */}
              {wishlistItems.length > 0 && (
                <Card className="p-6">
                  <Heading level={2} className="text-lg font-semibold mb-4 truncate">
                    From Your Wishlist
                  </Heading>
                  <div className="space-y-3">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <img 
                            src={item.image} 
                            alt={item.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div>
                            <Text className="font-medium">{item.title}</Text>
                            <Text size="sm" className="text-gray-600">{item.type}</Text>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addFromWishlist(item)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 住宿选项 */}
              <Card className="p-6">
                <Heading level={2} className="text-lg font-semibold mb-4 truncate">
                  Accommodation Options
                </Heading>
                <div className="space-y-4">
                  {accommodationOptions.map((hotel) => (
                    <div 
                      key={hotel.id} 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedAccommodation?.id === hotel.id 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedAccommodation(hotel)}
                    >
                      <div className="flex items-center gap-4">
                        <img 
                          src={hotel.image} 
                          alt={hotel.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Text className="font-medium">{hotel.title}</Text>
                            {selectedAccommodation?.id === hotel.id && (
                              <CheckCircle className="w-5 h-5 text-primary-500" />
                            )}
                          </div>
                          <Text size="sm" className="text-gray-600 mb-2">{hotel.description}</Text>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-sm ${i < hotel.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <Text className="font-medium text-primary-600">
                              ¥{hotel.price}/night
                            </Text>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* 右侧：个人信息和预订详情 */}
            <div className="space-y-6">
              {/* 预订摘要 */}
              <Card className="p-6 sticky top-6">
                <Heading level={2} className="text-lg font-semibold mb-4">
                  Booking Summary
                </Heading>
                
                <div className="space-y-3">
                  {/* 基础行程模块费用 */}
                  <div className="space-y-2">
                    <Text className="font-medium text-sm">Base Journey Modules</Text>
                    {selectedModules.map(module => (
                      <div key={module.id} className="flex justify-between text-sm text-gray-600">
                        <Text className="truncate">{module.title}</Text>
                        <Text>¥{module.price * travelDates.travelers}</Text>
                      </div>
                    ))}
                  </div>
                  
                  {/* 额外体验费用 */}
                  {selectedExperiences.length > 0 && (
                    <div className="space-y-2">
                      <Text className="font-medium text-sm">Additional Experiences</Text>
                      {selectedExperiences.map(exp => (
                        <div key={exp.id} className="flex justify-between text-sm text-gray-600">
                          <Text className="truncate">{exp.title}</Text>
                          <Text>¥{exp.price * travelDates.travelers}</Text>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 住宿费用 */}
                  {selectedAccommodation && (
                    <div className="space-y-2">
                      <Text className="font-medium text-sm">Accommodation</Text>
                      <div className="flex justify-between text-sm text-gray-600">
                        <Text className="truncate">{selectedAccommodation.title}</Text>
                        <Text>¥{selectedAccommodation.price}</Text>
                      </div>
                    </div>
                  )}
                  
                  {/* 总费用 */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <Text>Total</Text>
                      <Text>¥{calculateTotalPrice()}</Text>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 个人信息表单 */}
              <Card className="p-6">
                <Heading level={2} className="text-lg font-semibold mb-4 truncate">
                  Traveler Information
                </Heading>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={guestInfo.firstName}
                        onChange={(e) => setGuestInfo(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={guestInfo.nationality}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, nationality: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </Card>

              {/* 旅行日期 */}
              <Card className="p-6">
                <Heading level={2} className="text-lg font-semibold mb-4 truncate">
                  Travel Dates
                </Heading>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departure Date *
                    </label>
                    <input
                      type="date"
                      value={travelDates.departureDate}
                      onChange={(e) => setTravelDates(prev => ({ ...prev, departureDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Travelers
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTravelDates(prev => ({ ...prev, travelers: Math.max(1, prev.travelers - 1) }))}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="px-4 py-2 border border-gray-300 rounded-md min-w-[60px] text-center">
                        {travelDates.travelers}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTravelDates(prev => ({ ...prev, travelers: prev.travelers + 1 }))}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 特殊要求 */}
              <Card className="p-6">
                <Heading level={2} className="text-lg font-semibold mb-4 truncate">
                  Special Requests
                </Heading>
                <textarea
                  value={guestInfo.specialRequests}
                  onChange={(e) => setGuestInfo(prev => ({ ...prev, specialRequests: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Any special dietary requirements, accessibility needs, or other requests..."
                />
              </Card>

              {/* 预订按钮 */}
              <div className="space-y-3">
                <Button
                  onClick={handleBooking}
                  disabled={isLoading || !travelDates.departureDate || !guestInfo.firstName || !guestInfo.lastName || !guestInfo.email}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? 'Processing...' : 'Submit Order'}
                </Button>
                
                {/* 提示信息 */}
                {(!travelDates.departureDate || !guestInfo.firstName || !guestInfo.lastName || !guestInfo.email) && (
                  <Text size="sm" className="text-gray-500 text-center">
                    Please fill in all required fields to submit your order
                  </Text>
                )}
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}
