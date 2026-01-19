'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from "next/link";
import { Container, Section, Heading, Text, Button, Card, Breadcrumb } from '@/components/common';
import { AccommodationCard } from '@/components/cards/AccommodationCard';
import { PlanTripModal } from '@/components/modals/PlanTripModal';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { useHotelManagement } from '@/context/HotelManagementContext';
import PlanningSectionNew from '@/components/sections/PlanningSectionNew';

// 图片资源
const imgHeroBanner = "/images/journey-cards/chengdu-deep-dive.jpeg";

export default function SichuanChongqingPage() {
  const { journeys, isLoading: journeysLoading } = useJourneyManagement();
  const { hotels, isLoading: hotelsLoading } = useHotelManagement();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isSubNavSticky, setIsSubNavSticky] = useState(false);
  const [activeSection, setActiveSection] = useState('#recommended-journeys');
  
  // 筛选状态
  const [selectedJourneyType, setSelectedJourneyType] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDuration, setSelectedDuration] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isPlanTripModalOpen, setIsPlanTripModalOpen] = useState(false);

  // 筛选 Sichuan 和 Chongqing 地区的 journeys
  const filteredJourneys = useMemo(() => {
    return journeys.filter(journey => {
      const region = journey.region?.toLowerCase();
      const matchesRegion = region === 'sichuan' || region === 'chongqing' || 
                           region?.includes('sichuan') || region?.includes('chongqing');
      
      if (!matchesRegion) return false;
      
      // 状态筛选
      const isActive = 'status' in journey ? journey.status === 'active' : true;
      if (!isActive) return false;
      
      // Journey Type 筛选
      const journeyType = journey.journeyType || (journey.duration?.includes('1 Day') ? 'Explore Together' : 'Deep Discovery');
      const matchesJourneyType = selectedJourneyType === 'All' || journeyType === selectedJourneyType;
      
      // Category 筛选
      const matchesCategory = selectedCategory === 'All' || journey.category === selectedCategory;
      
      // Duration 筛选
      const matchesDuration = selectedDuration === 'All' || journey.duration === selectedDuration;
      
      // 搜索筛选
      const matchesSearch = searchTerm === '' || 
        journey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journey.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesJourneyType && matchesCategory && matchesDuration && matchesSearch;
    });
  }, [journeys, selectedJourneyType, selectedCategory, selectedDuration, searchTerm]);

  // 筛选 Sichuan 和 Chongqing 地区的 hotels
  const filteredHotels = useMemo(() => {
    return hotels.filter(hotel => {
      const city = hotel.city?.toLowerCase() || '';
      return city.includes('chengdu') || city.includes('chongqing') || 
             city.includes('sichuan') || hotel.location?.toLowerCase().includes('chengdu') ||
             hotel.location?.toLowerCase().includes('chongqing');
    }).slice(0, 6); // 只显示前6个
  }, [hotels]);

  // 获取所有可用的筛选选项
  const journeyTypes = useMemo(() => {
    const types = new Set<string>();
    journeys.forEach(j => {
      const type = j.journeyType || (j.duration?.includes('1 Day') ? 'Explore Together' : 'Deep Discovery');
      types.add(type);
    });
    return ['All', ...Array.from(types)];
  }, [journeys]);

  const categories = useMemo(() => {
    const cats = new Set(journeys.map(j => j.category).filter(Boolean));
    return ['All', ...Array.from(cats)];
  }, [journeys]);

  const durations = useMemo(() => {
    const durs = new Set(journeys.map(j => j.duration).filter(Boolean));
    return ['All', ...Array.from(durs)];
  }, [journeys]);
  const recommendedJourneys = filteredJourneys.slice(0, 3);
  const subNavItems = [
    { label: 'Recommended Journeys', href: '#recommended-journeys' },
    { label: 'Accommodations', href: '#accommodations' },
    { label: 'All Journeys', href: '#all-journeys' },
  ];

  useEffect(() => {
    document.title = "Sichuan & Chongqing - Destinations - Korascale";
  }, []);

  const isLoading = journeysLoading || hotelsLoading;
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsSubNavSticky(!entry.isIntersecting);
    }, { threshold: 1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>('header[data-name="Header/Main"]');
    if (!header) return;
    header.style.transition = 'transform 0.3s ease';
    header.style.transform = isSubNavSticky ? 'translateY(-100%)' : '';
    return () => {
      header.style.transform = '';
    };
  }, [isSubNavSticky]);

  useEffect(() => {
    const sectionIds = ['#recommended-journeys', '#accommodations', '#all-journeys'];
    const observers: IntersectionObserver[] = [];
    sectionIds.forEach((id) => {
      const section = document.querySelector(id);
      if (!section) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { threshold: 0.4 }
      );
      observer.observe(section);
      observers.push(observer);
    });
    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [filteredJourneys.length, filteredHotels.length]);

  const handleSubNavClick = (href: string) => {
    setActiveSection(href);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white">
        <Container size="xl" className="py-24">
          <div className="text-center">
            <Text className="text-xl">Loading...</Text>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Banner - 按照Figma设计的左右分栏布局，与accommodation页面统一 */}
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
              <div>Trip in</div>
              <div className="text-9xl lg:text-9xl md:text-7xl text-5xl">Sichuan</div>
            </Heading>
            <Link 
              href="#journeys" 
              className="text-2xl lg:text-2xl md:text-lg text-base underline hover:no-underline transition-all duration-300 hover:opacity-80 font-body"
              style={{ 
                color: '#FFFFFF',
                fontFamily: 'Monda, sans-serif',
                fontWeight: 400
              }}
            >
              View All Journeys
            </Link>
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="w-1/2 h-[800px] flex flex-col flex-shrink-0 md:w-1/2 w-full" 
             style={{ backgroundColor: '#f5f1e6' }}>
          {/* 面包屑导航 */}
          <div className="px-6 py-2 lg:px-6 md:px-4 px-3">
            <Breadcrumb 
              items={[
                { label: 'Home', href: '/' }, 
                { label: 'Destinations', href: '/destinations' },
                { label: 'Sichuan & Chongqing' }
              ]}
              color="#000000"
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

      {/* Sub Navigation */}
      <div ref={sentinelRef} aria-hidden="true"></div>
      <div 
        className={`bg-[#1e3b32] text-white py-3 px-4 sticky top-0 z-40 transition-shadow ${isSubNavSticky ? 'shadow-lg' : ''}`}
      >
        <Container size="xl">
          <nav className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {subNavItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleSubNavClick(item.href)}
                className="w-full py-2 text-sm md:text-base font-semibold border border-transparent text-white"
                style={{ fontFamily: 'Monda, sans-serif', textTransform: 'none', letterSpacing: '0em', color: '#ffffff' }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </Container>
      </div>

      {/* Recommend Journey Section */}
      <Section id="recommended-journeys" background="secondary" padding="xl" className="py-16">
        <Container size="xl">
          <div className="text-center mb-12">
            <Text className="uppercase text-gray-600 mb-3" style={{ fontFamily: 'Monda, sans-serif', letterSpacing: '0em' }}>
              Recommended Journeys
            </Text>
            <Heading level={2} className="text-4xl font-heading">
              Our Favorite Adventures in Sichuan Right Now
            </Heading>
          </div>

          {recommendedJourneys.length === 0 ? (
            <div className="text-center py-16">
              <Text className="text-xl text-gray-600 mb-8">
                No journeys found matching your filters.
              </Text>
              <Button 
                variant="primary" 
                onClick={() => {
                  setSelectedJourneyType('All');
                  setSelectedCategory('All');
                  setSelectedDuration('All');
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-10">
              {recommendedJourneys.map((journey) => (
                <Card key={journey.id} className="overflow-hidden border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 h-[400px]">
                    <div className="h-full">
                      <img
                        src={journey.image}
                        alt={journey.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 flex flex-col gap-4 h-full">
                      <Heading level={3} className="text-2xl font-heading" style={{ fontFamily: 'Montaga, serif' }}>
                        {journey.title}
                      </Heading>
                      <Text className="text-gray-700 line-clamp-2" style={{ fontFamily: 'Monda, sans-serif' }}>
                        {journey.overview?.description || journey.shortDescription || journey.description}
                      </Text>
                      <Text className="text-gray-700 leading-relaxed line-clamp-3" style={{ fontFamily: 'Monda, sans-serif' }}>
                        {journey.description}
                      </Text>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm text-gray-600 gap-2">
                        <span>{journey.duration || 'Flexible duration'}</span>
                        <span>{journey.category}</span>
                      </div>
                      <div className="mt-auto">
                        <Link href={`/journeys/${journey.slug || journey.id}`}>
                          <Button variant="outline" className="w-full sm:w-auto">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* Recommend Accommodation Section */}
      <Section background="primary" padding="xl" className="py-16">
        <Container size="xl">
          <div className="mb-12">
            <Heading level={2} className="text-4xl font-heading mb-4">
              Recommend Accommodation
            </Heading>
            <Text className="text-xl text-gray-600">
              Stay in the best hotels in Sichuan & Chongqing
            </Text>
          </div>

          {filteredHotels.slice(0, 3).length === 0 ? (
            <div className="text-center py-16">
              <Text className="text-xl text-gray-600">
                No accommodations available in this region yet.
              </Text>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {filteredHotels.slice(0, 3).map((hotel) => (
                  <AccommodationCard
                    key={hotel.id}
                    id={hotel.id}
                    title={hotel.name}
                    location={hotel.location}
                    image={hotel.images?.[0] || '/images/hotels/default.png'}
                    price={`$${100 + (hotel.id.charCodeAt(6) % 100)}/night`}
                    description={hotel.description}
                    variant="light"
                    showWishlist={false}
                    titleStyle={{ fontFamily: 'Montaga, serif' }}
                    descriptionStyle={{ fontFamily: 'Monda, sans-serif' }}
                  />
                ))}
              </div>
              <div className="mt-10 text-center">
                <Link href="/accommodations">
                  <Button variant="outline" className="px-8">
                    View All Accommodations
                  </Button>
                </Link>
              </div>
            </>
          )}
        </Container>
      </Section>

      {/* All Journeys / Filter Section */}
      <div id="all-journeys" className="bg-[#f5f1e6] py-16">
        <Container size="full" padding="none" className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filter Sidebar */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h3 className="text-2xl font-['Monda'] font-bold mb-6">Filter</h3>

                {/* Journey Type Filter */}
                <div className="mb-8">
                  <h4 className="text-xl font-['Monda'] font-bold mb-4">JOURNEY TYPE</h4>
                  <div className="flex flex-wrap gap-2">
                    {journeyTypes.map((type) => (
                      <button
                        key={type}
                        className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
                          selectedJourneyType === type ? 'bg-gray-200' : 'bg-white'
                        }`}
                        style={{
                          color: 'black',
                          backgroundColor: selectedJourneyType === type ? '#e5e7eb' : 'white'
                        }}
                        onClick={() => setSelectedJourneyType(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-8">
                  <h4 className="text-xl font-['Monda'] font-bold mb-4">CATEGORY</h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
                          selectedCategory === category ? 'bg-gray-200' : 'bg-white'
                        }`}
                        style={{
                          color: 'black',
                          backgroundColor: selectedCategory === category ? '#e5e7eb' : 'white'
                        }}
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Filter */}
                <div className="mb-8">
                  <h4 className="text-xl font-['Monda'] font-bold mb-4">DURATION</h4>
                  <div className="flex flex-wrap gap-2">
                    {durations.map((duration) => (
                      <button
                        key={duration}
                        className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
                          selectedDuration === duration ? 'bg-gray-200' : 'bg-white'
                        }`}
                        style={{
                          color: 'black',
                          backgroundColor: selectedDuration === duration ? '#e5e7eb' : 'white'
                        }}
                        onClick={() => setSelectedDuration(duration)}
                      >
                        {duration}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedJourneyType('All');
                    setSelectedCategory('All');
                    setSelectedDuration('All');
                    setSearchTerm('');
                  }}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>

            {/* Results Section */}
            <div className="flex-1">
              <Heading level={2} className="text-3xl font-heading mb-8" style={{ fontFamily: 'Montaga, serif' }}>
                See Where We Can Take You
              </Heading>

              {/* Search Bar */}
              <div className="mb-8">
                <input
                  type="text"
                  placeholder="Search journeys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {filteredJourneys.length === 0 ? (
                <div className="text-center py-16">
                  <Text className="text-xl text-gray-600 mb-8">
                    No journeys found matching your filters.
                  </Text>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredJourneys.map((journey) => {
                    // 获取 maxGuests
                    const maxGuests = ('maxGuests' in journey && journey.maxGuests) 
                      ? journey.maxGuests 
                      : ('maxParticipants' in journey && journey.maxParticipants) 
                        ? journey.maxParticipants 
                        : null;
                    
                    // 获取价格
                    const price = ('price' in journey && typeof journey.price === 'number')
                      ? `$${journey.price}`
                      : ('price' in journey ? journey.price : 'N/A');
                    
                    return (
                      <Card key={journey.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full bg-[#f5f1e6]">
                        <div 
                          className="h-48 bg-cover bg-center bg-no-repeat flex-shrink-0"
                          style={{ backgroundImage: `url('${journey.image}')` }}
                        />
                        <div className="p-4 flex flex-col flex-1">
                          <Heading 
                            level={3} 
                            className="text-lg font-heading mb-2 font-normal" 
                            style={{ fontFamily: 'Montaga, serif', fontWeight: 400 }}
                          >
                            {journey.title}
                          </Heading>
                          <Text className="text-sm text-gray-600 mb-3 line-clamp-2 flex-shrink-0">
                            {journey.shortDescription || journey.description}
                          </Text>
                          <div className="mt-auto flex flex-col flex-shrink-0">
                            {/* 第一行：Duration 和 Max Guests */}
                            <Text
                              className="text-sm mb-1"
                              style={{ fontFamily: 'Monda, sans-serif', color: '#000000', fontWeight: 400, fontSize: '0.875rem' }}
                            >
                              {journey.duration || 'N/A'}{maxGuests ? ` • Limited to ${maxGuests} guests` : ''}
                            </Text>
                            {/* 第二行：价格 */}
                            <Text
                              className="text-sm"
                              style={{ fontFamily: 'Monda, sans-serif', color: '#000000', fontWeight: 400, fontSize: '0.875rem' }}
                            >
                              {price !== 'N/A' ? `Priced from ${price}` : ''}
                            </Text>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* Plan Your Trip Section */}
      <PlanningSectionNew />
    </main>
  );
}
