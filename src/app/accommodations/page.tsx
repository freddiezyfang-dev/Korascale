'use client';

import Link from "next/link";
import { useState, useEffect, useRef } from 'react';
import { Container, Section, Heading, Text, Button, Card, Breadcrumb } from '@/components/common';
import { AccommodationCard } from '@/components/cards/AccommodationCard';
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
  // 已移除酒店详情弹窗
  const { toggleWishlist, items } = useWishlist();
  
  // 自动轮播状态
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Filter states
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedStarRating, setSelectedStarRating] = useState<string | null>(null);

  // 自动轮播逻辑
  useEffect(() => {
    if (isHovered) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % 3); // 3张卡片
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovered]);

  // 滚动到当前索引
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollAmount = currentIndex * (615 + 32); // 卡片宽度 + gap
      scrollContainerRef.current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  // 已移除点击卡片弹出酒店详情的交互


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
      {/* <WishlistSidebar /> */}
      
      {/* Wishlist Button - 固定定位跟随屏幕 */}
      {/* <div className="fixed top-6 right-6 z-40">
        <Button
          variant="secondary"
          onClick={toggleWishlist}
          className="flex items-center gap-2 bg-white text-tertiary hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Heart className="w-5 h-5" />
          Wishlist ({items.length})
        </Button>
      </div> */}
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
                lineHeight: '1.1',
                color: '#ffffff'
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
              fontFamily="Montserrat, sans-serif"
              sizeClassName="text-lg md:text-xl"
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


      {/* Recommended Accommodations - 自动轮播布局 */}
      <Section id="accommodations" background="tertiary" padding="xl" className="overflow-hidden">
        <div className="max-w-screen-2xl mx-auto">
          <div className="text-center mb-16 px-4">
            <Heading 
              level={2} 
              className="text-5xl font-heading text-center text-white"
              style={{
                fontFamily: 'Montaga, serif',
                fontWeight: 400,
                letterSpacing: '-0.025em',
                lineHeight: '1.1',
                color: '#ffffff'
              }}
            >
              Discover our curated collection of hotels and guesthouses
            </Heading>
          </div>
          
          {/* 自动轮播容器 */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-8 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide pl-4"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ 
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {/* Accommodation Card 1 */}
            <div className="bg-white h-[300px] w-[615px] flex-shrink-0 border-2 border-black rounded-lg overflow-hidden snap-start transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
              <div className="flex h-full">
                <div 
                  className="w-[344px] h-[225px] bg-center bg-cover bg-no-repeat m-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundImage: `url('${imgFrame33}')` }}
                />
                <div className="flex-1 p-4 flex flex-col justify-center">
                  <h3 className="text-2xl font-subheading text-black mb-4 group-hover:text-primary-500 transition-colors duration-300">
                    Chengdu City: One-Day Food & Culture Deep Dive
                  </h3>
                  <span className="text-black underline text-sm font-body hover:opacity-80 group-hover:text-primary-500 transition-colors duration-300">
                    VIEW MORE
                  </span>
                </div>
              </div>
            </div>

            {/* Accommodation Card 2 */}
            <div className="bg-white h-[300px] w-[615px] flex-shrink-0 border-2 border-black rounded-lg overflow-hidden snap-start transition-all duration-300 hover:scale-105 hover:shadow-2xl group">
              <div className="flex h-full">
                <div 
                  className="w-[344px] h-[225px] bg-center bg-cover bg-no-repeat m-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundImage: `url('${imgFrame36}')` }}
                />
                <div className="flex-1 p-4 flex flex-col justify-center">
                  <h3 className="text-2xl font-subheading text-black mb-4 group-hover:text-primary-500 transition-colors duration-300">
                    Chongqing City Highlights Day Tour
                  </h3>
                  <span className="text-black underline text-sm font-body hover:opacity-80 group-hover:text-primary-500 transition-colors duration-300">
                    VIEW MORE
                  </span>
                </div>
              </div>
            </div>

            {/* Accommodation Card 3 */}
            <div className="bg-white h-[300px] w-[615px] flex-shrink-0 border-2 border-black rounded-lg overflow-hidden snap-start transition-all duration-300 hover:scale-105 hover:shadow-2xl group mr-4">
              <div className="flex h-full">
                <div 
                  className="w-[344px] h-[225px] bg-center bg-cover bg-no-repeat m-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundImage: `url('${imgFrame37}')` }}
                />
                <div className="flex-1 p-4 flex flex-col justify-center">
                  <h3 className="text-2xl font-subheading text-black mb-4 group-hover:text-primary-500 transition-colors duration-300">
                    Jiuzhaigou, Panda & Zhongzhagou 4-Days In-Depth Tour
                  </h3>
                  <span className="text-black underline text-sm font-body hover:opacity-80 group-hover:text-primary-500 transition-colors duration-300">
                    VIEW MORE
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 轮播指示器 */}
          <div className="flex justify-center gap-2 mt-8 px-4">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </Section>

      {/* Filter and Results Section - 响应式左右分栏布局 */}
      <Section background="secondary">
        <Container size="xl">
          <div className="text-center mb-16">
            <Heading 
              level={3} 
              className="text-4xl lg:text-4xl md:text-3xl text-2xl font-heading text-white"
              style={{
                fontFamily: 'Montaga, serif',
                fontWeight: 400,
                letterSpacing: '-0.025em',
                lineHeight: '1.1',
                color: '#ffffff'
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
                className="text-3xl font-heading text-white mb-8 lg:text-3xl md:text-2xl text-xl"
                style={{
                  fontFamily: 'Montaga, serif',
                  fontWeight: 400,
                  letterSpacing: '-0.025em',
                  lineHeight: '1.2',
                  color: '#ffffff'
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
                    
                    variant="light"
                    showWishlist={false}
                  />
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* 已移除酒店详情弹窗 */}
    </div>
  );
}