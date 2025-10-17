'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { useUser } from '@/context/UserContext';
import { useWishlist } from '@/context/WishlistContext';
import { useOrderManagement } from '@/context/OrderManagementContext';
import { HotelDetailModal } from '@/components/modals/HotelDetailModal';
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
  const { items: wishlistItems, removeFromWishlist, addToWishlist } = useWishlist();
  const { addOrder } = useOrderManagement();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 状态管理
  const [selectedModules, setSelectedModules] = useState(journeyModules);
  const [selectedExperiences, setSelectedExperiences] = useState<any[]>([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState<any>(null);
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
  const [guestBreakdown, setGuestBreakdown] = useState<{ adults: number; children: number }>({ adults: 1, children: 0 });
  
  // 酒店详情弹窗状态
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 检查用户登录状态
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  // 处理从BookingDetailsModal传递的URL参数
  useEffect(() => {
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const adults = searchParams.get('adults');
    const children = searchParams.get('children');
    const roomType = searchParams.get('roomType');
    const hotelId = searchParams.get('hotelId');
    const hotelName = searchParams.get('hotelName');

    if (checkIn) {
      setTravelDates(prev => ({
        ...prev,
        departureDate: checkIn
      }));
    }
    if (checkOut) {
      setTravelDates(prev => ({
        ...prev,
        returnDate: checkOut
      }));
    }
    if (adults) {
      setTravelDates(prev => ({
        ...prev,
        travelers: parseInt(adults) + (children ? parseInt(children) : 0)
      }));
      setGuestBreakdown({ adults: parseInt(adults), children: children ? parseInt(children) : 0 });
    }
    if (hotelId && hotelName) {
      // 查找对应的酒店并设置为选中状态
      // 首先尝试在accommodationOptions中查找
      let hotel = accommodationOptions.find(h => h.id === hotelId);
      
      // 如果没找到，尝试根据hotelName匹配
      if (!hotel) {
        hotel = accommodationOptions.find(h => h.title === hotelName);
      }
      
      // 如果还是没找到，创建一个临时的酒店对象
      if (!hotel) {
        hotel = {
          id: hotelId,
          title: hotelName,
          description: 'Selected hotel from accommodations',
          price: 0,
          rating: 5,
          image: '/images/hotels/chengdu-tibet-1.png' // 默认图片
        };
      }
      
      if (hotel) {
        setSelectedAccommodation(hotel);
      }
    }
  }, [searchParams]);

  // 检查是否从BookingDetailsModal进入（有URL参数）
  const isFromBookingDetails = searchParams.get('hotelId') && searchParams.get('hotelName');
  
  // 调试信息
  console.log('Booking page debug info:', {
    isFromBookingDetails,
    hotelId: searchParams.get('hotelId'),
    hotelName: searchParams.get('hotelName'),
    selectedAccommodation,
    checkIn: searchParams.get('checkIn'),
    checkOut: searchParams.get('checkOut'),
    adults: searchParams.get('adults'),
    children: searchParams.get('children'),
    roomType: searchParams.get('roomType')
  });


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
  const removeModule = (moduleId: any) => {
    setSelectedModules(prev => prev.filter(module => module.id !== moduleId));
  };

  // 添加额外体验
  const addExperience = (experience: any) => {
    setSelectedExperiences(prev => [...prev, experience]);
  };

  // 移除额外体验
  const removeExperience = (experienceId: any) => {
    setSelectedExperiences(prev => prev.filter(exp => exp.id !== experienceId));
  };

  // 从愿望清单添加
  const addFromWishlist = (item: any) => {
    if (item.type === 'experience') {
      addExperience(item);
    } else if (item.type === 'accommodation') {
      setSelectedAccommodation(item);
    }
    removeFromWishlist(item.id);
  };

  // 处理酒店点击
  const handleHotelClick = (hotel: any) => {
    console.log('Hotel clicked in booking page:', hotel);
    console.log('Setting modal to open...');
    
    // 转换为HotelDetailModal期望的格式
    const hotelForModal = {
      id: hotel.id,
      name: hotel.title,
      location: hotel.location || 'Chengdu, Sichuan',
      description: hotel.description,
      rating: hotel.rating.toString(),
      images: [hotel.image],
      roomTypes: [
        {
          name: 'Standard Room',
          description: 'Comfortable room with modern amenities',
          amenities: ['WiFi', 'Air Conditioning', 'TV', 'Private Bathroom'],
          price: hotel.price
        }
      ]
    };
    
    console.log('Hotel for modal:', hotelForModal);
    setSelectedHotel(hotelForModal);
    setIsModalOpen(true);
    console.log('Modal should be open now');
  };

  // 关闭酒店详情弹窗
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedHotel(null);
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
        userId: user?.id || '',
        userEmail: user?.email || '',
        userName: `${guestInfo.firstName} ${guestInfo.lastName}`,
        accommodation: {
          id: selectedAccommodation?.id || 'journey-only',
          title: 'Chengdu Deep Dive Journey',
          location: 'Chengdu, Sichuan',
          image: '/images/journey-cards/chengdu-deep-dive.jpeg',
          price: calculateTotalPrice()
        },
        selectedModules: selectedModules as any,
        selectedExperiences: selectedExperiences,
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
                        variant="outline"
                        size="sm"
                        onClick={() => removeModule(module.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 额外体验 */}
              {selectedExperiences.length > 0 && (
                <Card className="p-6">
                  <Heading level={2} className="text-lg font-semibold mb-4 truncate">
                    Additional Experiences
                  </Heading>
                  <div className="space-y-4">
                    {selectedExperiences.map((exp) => (
                      <div key={exp.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                        <img 
                          src={exp.image} 
                          alt={exp.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Text className="font-medium">{exp.title}</Text>
                            <CheckCircle className="w-5 h-5 text-primary-500" />
                          </div>
                          <Text size="sm" className="text-gray-600 mb-2">{exp.description}</Text>
                          <div className="flex items-center gap-4">
                            <Text className="font-medium text-primary-600">
                              ¥{exp.price}/person
                            </Text>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeExperience(exp.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

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
                          <div className="flex-1">
                            <Text className="font-medium">{item.title}</Text>
                            <Text size="sm" className="text-gray-600">{item.type}</Text>
                            
                            {/* 酒店预订详情 */}
                            {item.type === 'accommodation' && item.bookingDetails && (
                              <div className="mt-1 space-y-1">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  <Text size="xs" className="text-gray-600">
                                    {item.bookingDetails.checkIn?.toLocaleDateString()} - {item.bookingDetails.checkOut?.toLocaleDateString()}
                                  </Text>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-gray-400" />
                                  <Text size="xs" className="text-gray-600">
                                    {item.bookingDetails.adults} adult{item.bookingDetails.adults > 1 ? 's' : ''}
                                    {item.bookingDetails.children > 0 && `, ${item.bookingDetails.children} child${item.bookingDetails.children > 1 ? 'ren' : ''}`}
                                  </Text>
                                </div>
                                <Text size="xs" className="text-gray-500">
                                  {item.bookingDetails.roomType}
                                </Text>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromWishlist(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* 酒店预订信息或住宿选项 */}
              {isFromBookingDetails && selectedAccommodation ? (
                <Card className="p-6">
                  <Heading level={2} className="text-lg font-semibold mb-4 truncate">
                    Hotel Booking Details
                  </Heading>
                  <div className="border border-primary-200 bg-primary-50 rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <img 
                        src={selectedAccommodation.image} 
                        alt={selectedAccommodation.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Text className="font-medium">{selectedAccommodation.title}</Text>
                          <CheckCircle className="w-5 h-5 text-primary-500" />
                        </div>
                        <Text size="sm" className="text-gray-600 mb-2">{selectedAccommodation.description}</Text>
                        <div className="space-y-2">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-sm ${i < selectedAccommodation.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <Text className="font-medium text-primary-600">
                              ¥{selectedAccommodation.price}/night
                            </Text>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <Text className="text-gray-500">Check-in:</Text>
                              <Text className="font-medium">{travelDates.departureDate}</Text>
                            </div>
                            <div>
                              <Text className="text-gray-500">Check-out:</Text>
                              <Text className="font-medium">{travelDates.returnDate || travelDates.departureDate}</Text>
                            </div>
                            <div>
                              <Text className="text-gray-500">Guests:</Text>
                              <Text className="font-medium">{travelDates.travelers} {travelDates.travelers === 1 ? 'person' : 'people'}</Text>
                            </div>
                            <div>
                              <Text className="text-gray-500">Room Type:</Text>
                              <Text className="font-medium">{searchParams.get('roomType') || 'Standard Room'}</Text>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // 清除选中的酒店
                          setSelectedAccommodation(null);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Heading level={2} className="text-lg font-semibold truncate">
                      Accommodation Options
                    </Heading>
                    <Link href="/accommodations">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => console.log('View All clicked')}
                      >
                        View All
                      </Button>
                    </Link>
                  </div>
                  <div className="space-y-4">
                    {accommodationOptions
                      .filter(hotel => {
                        // 过滤掉已经在wishlist中的酒店
                        return !wishlistItems.some(item => 
                          item.type === 'accommodation' && 
                          item.title === hotel.title
                        );
                      })
                      .map((hotel) => (
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
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Add to wishlist clicked for:', hotel.title);
                              const wishlistItem = {
                                id: hotel.id,
                                title: hotel.title,
                                type: 'accommodation' as const,
                                image: hotel.image,
                                price: hotel.price.toString(),
                                location: 'Chengdu, Sichuan'
                              };
                                addToWishlist(wishlistItem);
                                console.log('Added to wishlist:', wishlistItem);
                              }}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Book now clicked for:', hotel.title);
                                handleHotelClick(hotel);
                              }}
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-sm text-gray-600">Adults</span>
                        <Button variant="outline" size="sm" onClick={() => setGuestBreakdown(prev => { const v=Math.max(1, prev.adults-1); setTravelDates(t=>({...t, travelers: v+prev.children})); return {...prev, adults: v}; })}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="px-4 py-2 border border-gray-300 rounded-md min-w-[40px] text-center">{guestBreakdown.adults}</span>
                        <Button variant="outline" size="sm" onClick={() => setGuestBreakdown(prev => { const v=Math.min(9, prev.adults+1); setTravelDates(t=>({...t, travelers: v+prev.children})); return {...prev, adults: v}; })}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-sm text-gray-600">Children</span>
                        <Button variant="outline" size="sm" onClick={() => setGuestBreakdown(prev => { const v=Math.max(0, prev.children-1); setTravelDates(t=>({...t, travelers: prev.adults+v})); return {...prev, children: v}; })}>
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="px-4 py-2 border border-gray-300 rounded-md min-w-[40px] text-center">{guestBreakdown.children}</span>
                        <Button variant="outline" size="sm" onClick={() => setGuestBreakdown(prev => { const v=Math.min(9, prev.children+1); setTravelDates(t=>({...t, travelers: prev.adults+v})); return {...prev, children: v}; })}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500">Total: {travelDates.travelers} {travelDates.travelers === 1 ? 'person' : 'people'}</div>
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

      {/* 调试信息 */}
      <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs z-50">
        <div>Modal Open: {isModalOpen ? 'Yes' : 'No'}</div>
        <div>Selected Hotel: {selectedHotel ? (selectedHotel as any).name : 'None'}</div>
      </div>

      {/* 酒店详情弹窗 */}
      <HotelDetailModal
        hotel={selectedHotel}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
