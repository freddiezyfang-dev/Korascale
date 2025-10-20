'use client';

import Link from "next/link";
import { useState } from 'react';
import { Container, Section, Heading, Text, Button, Card, Breadcrumb } from '@/components/common';
import { AccommodationCard } from '@/components/cards/AccommodationCard';
import { HotelDetailModal } from '@/components/modals/HotelDetailModal';
import { WishlistSidebar } from '@/components/wishlist/WishlistSidebar';
import { useWishlist } from '@/context/WishlistContext';
import hotelsData from '@/data/hotels.json';
import { Heart } from 'lucide-react';

// 定义酒店类型
interface Hotel {
  id: string;
  name: string;
  location: string;
  city?: string;
  starRating?: string;
  images: string[];
  rating: string;
  description: string;
  roomTypes: Array<{
    name: string;
    description: string;
    amenities: string[];
  }>;
}

// 图片资源 - 使用Figma设计中的图片
const imgHeroBanner = "/images/hero/slide8-accommodation.png";
const imgFrame33 = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop&crop=center";
const imgFrame36 = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop&crop=center";
const imgFrame37 = "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop&crop=center";
// 移除未使用的图片常量

export default function Accommodations() {
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toggleWishlist, items } = useWishlist();
  
  // Filter states
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedStarRating, setSelectedStarRating] = useState<string | null>(null);

  const handleHotelClick = (hotel: Hotel) => {
    console.log('Hotel clicked in accommodations page:', hotel);
    console.log('Setting selectedHotel to:', hotel);
    setSelectedHotel(hotel);
    setIsModalOpen(true);
    console.log('Modal should now be open');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedHotel(null);
  };


  // Filter hotels based on selected criteria
  const filteredHotels = hotelsData.hotels.filter(hotel => {
    if (selectedCity && !hotel.city?.toLowerCase().includes(selectedCity.toLowerCase())) {
      return false;
    }
    if (selectedStarRating && hotel.starRating !== selectedStarRating) {
      return false;
    }
    return true;
  });

  // Get unique cities from hotels data
  const cities = [...new Set(hotelsData.hotels.map(hotel => hotel.city).filter(Boolean))];
  
  // Star rating options
  const starRatings = [
    { value: 'luxury', label: 'Luxury (5★)', count: hotelsData.hotels.filter(h => h.starRating === 'luxury').length },
    { value: 'upscale', label: 'Upscale (4★)', count: hotelsData.hotels.filter(h => h.starRating === 'upscale').length },
    { value: 'comfortable', label: 'Comfortable (3★)', count: hotelsData.hotels.filter(h => h.starRating === 'comfortable').length },
    { value: 'guesthouse', label: 'Guesthouse', count: hotelsData.hotels.filter(h => h.starRating === 'guesthouse').length }
  ];

  return (
    <div className="min-h-screen bg-white">
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* Wishlist Sidebar */}
      <WishlistSidebar />
      
      {/* Wishlist Button - 固定定位跟随屏幕 */}
      <div className="fixed top-6 right-6 z-40">
        <Button
          variant="secondary"
          onClick={toggleWishlist}
          className="flex items-center gap-2 bg-white text-tertiary hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Heart className="w-5 h-5" />
          Wishlist ({items.length})
        </Button>
      </div>
      {/* Hero Banner - 按照Figma设计的左右分栏布局 */}
      <section className="flex h-[800px] w-full overflow-hidden relative">
        {/* 左侧图片区域 */}
        <div 
          className="w-1/2 h-[800px] bg-center bg-cover bg-no-repeat relative flex-shrink-0 md:w-1/2 w-full"
          style={{ backgroundImage: `url('${imgHeroBanner}')` }}
        >
          {/* 渐变遮罩层，增强文字可读性 */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
            <Heading 
              level={1} 
              className="text-8xl lg:text-8xl md:text-6xl text-4xl mb-6 font-heading text-white drop-shadow-lg" 
              style={{ 
                fontFamily: 'Montaga, serif',
                fontWeight: 400,
                letterSpacing: '-0.025em',
                lineHeight: '1.1'
              }}
            >
              Stay Extraordinary
            </Heading>
            <Link 
              href="#accommodations" 
              className="text-2xl lg:text-2xl md:text-lg text-base underline hover:no-underline transition-all duration-300 hover:opacity-80 font-body"
              style={{ 
                color: '#FFFFFF',
                fontFamily: 'Monda, sans-serif',
                fontWeight: 400
              }}
            >
              View All Stays
            </Link>
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="w-1/2 h-[800px] flex flex-col flex-shrink-0 md:w-1/2 w-full" 
             style={{ backgroundColor: '#f5f1e6' }}>
          {/* 面包屑导航 */}
          <div className="px-6 py-2 lg:px-6 md:px-4 px-3">
            <Breadcrumb 
              items={[{ label: 'Home', href: '/' }, { label: 'Accommodations' }]}
              color="#000000"
              fontFamily="Montaga, serif"
              sizeClassName="text-lg md:text-2xl"
            />
          </div>

          {/* 描述文本 */}
          <div className="px-6 pt-32 flex-1 lg:px-6 lg:pt-32 md:px-4 md:pt-24 px-3 pt-16">
            <Text 
              size="xl" 
              className="text-black leading-relaxed font-body"
              style={{
                fontFamily: 'Monda, sans-serif',
                fontSize: '1.25rem',
                lineHeight: '1.625',
                letterSpacing: '0em'
              }}
            >
              Nestled in the heart of western China, Sichuan is a land of breathtaking landscapes,
              vibrant traditions, and unforgettable flavors. From the dramatic peaks of the Hengduan
              Mountains to the serene beauty of the Jiuzhaigou Valley, this region offers a perfect
              blend of natural wonders and cultural treasures. Known worldwide for its spicy cuisine
              and as the home of the giant panda, Sichuan invites travelers to explore its ancient
              temples, Tibetan-influenced highlands, and dynamic cities like Chengdu. Whether you
              seek adventure, cultural immersion, or culinary delights, Sichuan promises an experience
              unlike any other.
            </Text>
          </div>
        </div>
      </section>


      {/* Recommended Accommodations - 响应式布局 */}
      <Section id="accommodations" background="secondary">
        <Container size="xl">
          <Heading 
            level={2} 
            align="center" 
            className="mb-16 text-4xl lg:text-4xl md:text-3xl text-2xl font-heading text-black"
            style={{
              fontFamily: 'Montaga, serif',
              fontWeight: 400,
              letterSpacing: '-0.025em',
              lineHeight: '1.1'
            }}
          >
            Discover our curated collection of hotels and guesthouses
          </Heading>
          
          {/* 响应式卡片容器 - 优化布局和间距 */}
          <div className="flex gap-8 overflow-x-auto pb-8 lg:flex-row md:flex-col flex-col scrollbar-hide">
            {/* Accommodation Card 1 */}
            <Card className="h-[400px] w-[1200px] flex-shrink-0 overflow-hidden lg:w-[1200px] md:w-full w-full p-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex h-full lg:flex-row md:flex-col flex-col">
                <div
                  className="w-[600px] h-[400px] bg-center bg-cover bg-no-repeat lg:w-[600px] lg:h-[400px] md:w-full md:h-64 w-full h-48 relative"
                  style={{ backgroundImage: `url('${imgFrame33}')` }}
                >
                  {/* 图片渐变遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
                </div>
                <div className="flex-1 p-8 flex flex-col justify-center bg-white">
                  <Heading 
                    level={3} 
                    className="mb-4 text-2xl lg:text-2xl md:text-xl text-lg font-heading text-black"
                    style={{
                      fontFamily: 'Montaga, serif',
                      fontWeight: 400,
                      letterSpacing: '-0.025em',
                      lineHeight: '1.2'
                    }}
                  >
                    Chengdu City: One-Day Food & Culture Deep Dive
                  </Heading>
                  <Text 
                    className="text-gray-700 mb-8 lg:text-base md:text-sm text-xs font-body leading-relaxed"
                    style={{
                      fontFamily: 'Monda, sans-serif',
                      lineHeight: '1.625'
                    }}
                  >
                    Designed for food and culture enthusiasts. Visit the Panda Base in the morning,
                    then head to the Sichuan Cuisine Museum for a hands-on experience with snack
                    making and tasting. In the afternoon, enjoy a face-changing performance of
                    Sichuan Opera. The day concludes with a classic Chengdu hot pot dinner, offering
                    a deep dive into Sichuan&apos;s culinary and artistic heritage.
                  </Text>
                  <Link 
                    href="#" 
                    className="text-2xl font-body text-black underline hover:opacity-80 self-end lg:text-2xl md:text-lg text-base transition-all duration-300 hover:no-underline"
                    style={{
                      fontFamily: 'Monda, sans-serif',
                      fontWeight: 400
                    }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </Card>

            {/* Accommodation Card 2 */}
            <Card className="h-[400px] w-[1200px] flex-shrink-0 overflow-hidden lg:w-[1200px] md:w-full w-full p-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex h-full lg:flex-row md:flex-col flex-col">
                <div
                  className="w-[600px] h-[400px] bg-center bg-cover bg-no-repeat lg:w-[600px] lg:h-[400px] md:w-full md:h-64 w-full h-48 relative"
                  style={{ backgroundImage: `url('${imgFrame36}')` }}
                >
                  {/* 图片渐变遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
                </div>
                <div className="flex-1 p-8 flex flex-col justify-center bg-white">
                  <Heading 
                    level={3} 
                    className="mb-4 text-2xl lg:text-2xl md:text-xl text-lg font-heading text-black"
                    style={{
                      fontFamily: 'Montaga, serif',
                      fontWeight: 400,
                      letterSpacing: '-0.025em',
                      lineHeight: '1.2'
                    }}
                  >
                    Chongqing City Highlights Day Tour
                  </Heading>
                  <Text 
                    className="text-gray-700 mb-8 lg:text-base md:text-sm text-xs font-body leading-relaxed"
                    style={{
                      fontFamily: 'Monda, sans-serif',
                      lineHeight: '1.625'
                    }}
                  >
                    See the best of Chongqing&apos;s magical and retro vibes in one day. Explore the
                    ancient Ciqikou Old Town in the morning. In the afternoon, experience the
                    Liziba Monorail passing through a residential building, ride the Yangtze River
                    Cableway, and stroll through Longmenhao Old Street. Admire the Hongyadong night
                    view before enjoying a dinner of authentic Chongqing hot pot.
                  </Text>
                  <Link 
                    href="#" 
                    className="text-2xl font-body text-black underline hover:opacity-80 self-end lg:text-2xl md:text-lg text-base transition-all duration-300 hover:no-underline"
                    style={{
                      fontFamily: 'Monda, sans-serif',
                      fontWeight: 400
                    }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </Card>

            {/* Accommodation Card 3 */}
            <Card className="h-[400px] w-[1200px] flex-shrink-0 overflow-hidden lg:w-[1200px] md:w-full w-full p-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex h-full lg:flex-row md:flex-col flex-col">
                <div
                  className="w-[600px] h-[400px] bg-center bg-cover bg-no-repeat lg:w-[600px] lg:h-[400px] md:w-full md:h-64 w-full h-48 relative"
                  style={{ backgroundImage: `url('${imgFrame37}')` }}
                >
                  {/* 图片渐变遮罩 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
                </div>
                <div className="flex-1 p-8 flex flex-col justify-center bg-white">
                  <Heading 
                    level={3} 
                    className="mb-4 text-2xl lg:text-2xl md:text-xl text-lg font-heading text-black"
                    style={{
                      fontFamily: 'Montaga, serif',
                      fontWeight: 400,
                      letterSpacing: '-0.025em',
                      lineHeight: '1.2'
                    }}
                  >
                    Jiuzhaigou, Panda & Zhongzhagou 4-Days In-Depth Tour
                  </Heading>
                  <Text 
                    className="text-gray-700 mb-8 lg:text-base md:text-sm text-xs font-body leading-relaxed"
                    style={{
                      fontFamily: 'Monda, sans-serif',
                      lineHeight: '1.625'
                    }}
                  >
                    A 4-day deep dive into Jiuzhaigou and its surrounding secrets. Beyond the main
                    parks, this tour includes a visit to the Jiawu Hai Panda Garden and a horse
                    riding experience in Zhongzhagou Valley to experience Tibetan culture and natural
                    adventure. Perfect for travelers who enjoy in-depth exploration and outdoor activities.
                  </Text>
                  <Link 
                    href="#" 
                    className="text-2xl font-body text-black underline hover:opacity-80 self-end lg:text-2xl md:text-lg text-base transition-all duration-300 hover:no-underline"
                    style={{
                      fontFamily: 'Monda, sans-serif',
                      fontWeight: 400
                    }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </Card>
          </div>

        </Container>
      </Section>

      {/* Filter and Results Section - 响应式左右分栏布局 */}
      <Section background="secondary">
        <Container size="xl">
          <div className="text-center mb-16">
            <Heading 
              level={3} 
              className="text-4xl lg:text-4xl md:text-3xl text-2xl font-heading text-black"
              style={{
                fontFamily: 'Montaga, serif',
                fontWeight: 400,
                letterSpacing: '-0.025em',
                lineHeight: '1.1'
              }}
            >
              Recommended Accommodations
            </Heading>
          </div>
          
          <div className="flex gap-8 lg:flex-row md:flex-col flex-col">
            {/* Filter Sidebar - 响应式宽度 */}
            <Card className="w-[340px] h-fit lg:w-[340px] md:w-full w-full bg-white shadow-lg">
              <div className="p-6">
                <Heading 
                  level={3} 
                  className="text-2xl font-heading text-black mb-6 lg:text-2xl md:text-xl text-lg"
                  style={{
                    fontFamily: 'Montaga, serif',
                    fontWeight: 400,
                    letterSpacing: '-0.025em'
                  }}
                >
                  CITIES
                </Heading>
                <div className="grid grid-cols-1 gap-3 mb-8">
                  <Button
                    variant={selectedCity === null ? "primary" : "outline"}
                    size="sm"
                    className="w-full text-left text-base lg:text-base md:text-sm text-xs font-body transition-all duration-200"
                    style={{
                      fontFamily: 'Monda, sans-serif',
                      fontWeight: 400
                    }}
                    onClick={() => setSelectedCity(null)}
                  >
                    All Cities
                  </Button>
                  {cities.map((city) => (
                    <Button
                      key={city}
                      variant={selectedCity === city ? "primary" : "outline"}
                      size="sm"
                      className="w-full text-left text-base lg:text-base md:text-sm text-xs font-body transition-all duration-200"
                      style={{
                        fontFamily: 'Monda, sans-serif',
                        fontWeight: 400
                      }}
                      onClick={() => setSelectedCity(city)}
                    >
                      {city}
                    </Button>
                  ))}
                </div>

                <Heading 
                  level={3} 
                  className="text-2xl font-heading text-black mb-6 lg:text-2xl md:text-xl text-lg"
                  style={{
                    fontFamily: 'Montaga, serif',
                    fontWeight: 400,
                    letterSpacing: '-0.025em'
                  }}
                >
                  Star Rating
                </Heading>
                <div className="space-y-3">
                  <Button
                    variant={selectedStarRating === null ? "primary" : "outline"}
                    size="sm"
                    className="w-full text-left text-base lg:text-base md:text-sm text-xs font-body transition-all duration-200"
                    style={{
                      fontFamily: 'Monda, sans-serif',
                      fontWeight: 400
                    }}
                    onClick={() => setSelectedStarRating(null)}
                  >
                    All Ratings
                  </Button>
                  {starRatings.map((rating) => (
                    <Button
                      key={rating.value}
                      variant={selectedStarRating === rating.value ? "primary" : "outline"}
                      size="sm"
                      className="w-full text-left text-base lg:text-base md:text-sm text-xs font-body transition-all duration-200"
                      style={{
                        fontFamily: 'Monda, sans-serif',
                        fontWeight: 400
                      }}
                      onClick={() => setSelectedStarRating(rating.value)}
                    >
                      {rating.label} ({rating.count})
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Results Grid - 响应式网格布局 */}
            <div className="flex-1">
              <Heading 
                level={3} 
                className="text-3xl font-heading text-black mb-8 lg:text-3xl md:text-2xl text-xl"
                style={{
                  fontFamily: 'Montaga, serif',
                  fontWeight: 400,
                  letterSpacing: '-0.025em',
                  lineHeight: '1.2'
                }}
              >
                See Where We Can Take You
              </Heading>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHotels.map((hotel) => (
                  <AccommodationCard
                    key={hotel.id}
                    id={hotel.id}
                    title={hotel.name}
                    location={hotel.location}
                    image={hotel.images[0]}
                    price={`$${100 + (hotel.id.charCodeAt(6) % 100)}/night`}
                    description={hotel.description}
                    onClick={() => handleHotelClick(hotel)}
                  />
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* 酒店详情弹窗 */}
      <HotelDetailModal
        hotel={selectedHotel}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}