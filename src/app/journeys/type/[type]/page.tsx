'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Section, Container, Heading, Text, Breadcrumb, Card, Button } from '@/components/common';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { useUser } from '@/context/UserContext';
import { JourneyType, Journey } from '@/types';
import { PlanTripModal } from '@/components/modals/PlanTripModal';

// Journey Type 到 Slug 的映射
const JourneyTypeToSlug: Record<JourneyType, string> = {
  'Explore Together': 'explore-together',
  'Deep Discovery': 'deep-discovery',
  'Signature Journeys': 'signature-journeys',
  'Group Tours': 'group-tours'
};

// Slug 到 Journey Type 的映射
const SlugToJourneyType: Record<string, JourneyType> = {
  'explore-together': 'Explore Together',
  'deep-discovery': 'Deep Discovery',
  'signature-journeys': 'Signature Journeys',
  'group-tours': 'Group Tours'
};

// Journey Type 到 Hero 图片的映射
const JourneyTypeToHeroImage: Record<JourneyType, string> = {
  'Explore Together': '/images/journey-cards/chengdu-deep-dive.jpeg',
  'Deep Discovery': '/images/journey-cards/jiuzhaigou-valley-multi-color-lake.jpeg',
  'Signature Journeys': '/images/journey-cards/jiuzhaigou-huanglong-national-park-tour.jpg',
  'Group Tours': '/images/journey-cards/chongqing-wulong-karst-national-park.jpg'
};

// Journey Type 的描述
const JourneyTypeDescriptions: Record<JourneyType, string> = {
  'Explore Together':
    'Join a curated group of fellow travelers on our 1-2 day highlight tours. Designed for maximum discovery with minimal planning, these journeys offer the perfect introduction to a city or region\'s iconic culture and landscapes. Led by expert guides, it\'s the most vibrant and social way to explore.',
  'Deep Discovery':
    'Multi-day journeys that dive beneath the surface of local culture, nature, and cuisine.',
  'Signature Journeys':
    'Premium, curated expeditions with elevated service, exclusive access, and unforgettable moments.',
  'Group Tours':
    'For schools, corporations, institutions, and large private gatherings, our dedicated Group Tours are designed to inspire, engage, and unite. We expertly manage every detail for parties of 30 or more, transforming complex logistics into seamless, impactful journeys—whether for educational discovery, team building, corporate off-sites, or special events. Share a moment of discovery and create lasting bonds.\n\nReady to inspire your group? Contact our Group Travel Specialists to begin crafting your journey.'
};

// 解析 journey type 的辅助函数
const resolveJourneyType = (journey: any): JourneyType => {
  if ('journeyType' in journey && journey.journeyType) {
    return journey.journeyType as JourneyType;
  }
  // 根据 duration 推断（可选）
  if (journey.duration?.includes('1 Day')) {
    return 'Explore Together';
  }
  if (journey.duration?.match(/\d+ Days?/) && !journey.duration?.includes('1 Day')) {
    return 'Deep Discovery';
  }
  return 'Explore Together'; // 默认
};

// Brochure 数据结构
interface Brochure {
  id: string;
  title: string;
  coverImage: string;
  pdfUrl: string;
}

// 示例 brochures 数据
const brochures: Brochure[] = [
  {
    id: '1',
    title: 'Abercrombie & Kent',
    coverImage: '/images/brochures/brochure-1.jpg',
    pdfUrl: '/pdfs/brochure-1.pdf'
  },
  {
    id: '2',
    title: 'Abercrombie & Kent',
    coverImage: '/images/brochures/brochure-2.jpg',
    pdfUrl: '/pdfs/brochure-2.pdf'
  },
  {
    id: '3',
    title: 'Abercrombie & Kent - Join The Adventure',
    coverImage: '/images/brochures/brochure-3.jpg',
    pdfUrl: '/pdfs/brochure-3.pdf'
  }
];

// Partnership Paths 数据结构
interface PartnershipPath {
  id: number;
  number: number;
  title: string;
  description: string;
  image: string;
}

const partnershipPaths: PartnershipPath[] = [
  {
    id: 1,
    number: 1,
    title: 'Initial Consultation',
    description: 'We begin with a detailed conversation to understand your group\'s interests, goals, and requirements.',
    image: '/images/journey-cards/chengdu-deep-dive.jpeg'
  },
  {
    id: 2,
    number: 2,
    title: 'Custom Itinerary Design',
    description: 'Our team crafts a bespoke itinerary tailored specifically to your group\'s needs and preferences.',
    image: '/images/journey-cards/jiuzhaigou-valley-multi-color-lake.jpeg'
  },
  {
    id: 3,
    number: 3,
    title: 'Logistics Planning',
    description: 'We handle all the complex logistics including accommodations, transportation, and special arrangements.',
    image: '/images/journey-cards/jiuzhaigou-huanglong-national-park-tour.jpg'
  },
  {
    id: 4,
    number: 4,
    title: 'Expert Guidance',
    description: 'Your journey is led by experienced guides who provide deep cultural insights and seamless experiences.',
    image: '/images/journey-cards/chongqing-wulong-karst-national-park.jpg'
  },
  {
    id: 5,
    number: 5,
    title: 'Ongoing Support',
    description: 'We provide continuous support throughout your journey and beyond, ensuring every detail is perfect.',
    image: '/images/journey-cards/chengdu-deep-dive.jpeg'
  }
];

export default function JourneyTypePage() {
  const params = useParams();
  const router = useRouter();
  const { journeys, isLoading } = useJourneyManagement();
  const { user } = useUser();
  const [isPlanTripModalOpen, setIsPlanTripModalOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<number | null>(null);

  // Filter 状态：与 journey 主页面一致
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedDuration, setSelectedDuration] = useState<string>('All');
  const [selectedInterest, setSelectedInterest] = useState<string>('All');
  const [selectedPlace, setSelectedPlace] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 单个选项的折叠状态
  const [isJourneyTypeOpen, setIsJourneyTypeOpen] = useState(true);
  const [isRegionOpen, setIsRegionOpen] = useState(true);
  const [isDurationOpen, setIsDurationOpen] = useState(true);
  const [isInterestOpen, setIsInterestOpen] = useState(true);
  const [isPlaceOpen, setIsPlaceOpen] = useState(true);

  // Region选项
  const regionOptions = [
    'All',
    'Northwest China',
    'Northwest&Northern Frontier',
    'North China',
    'South China',
    'East&Central China'
  ];

  // Places选项
  const placeOptions = [
    'All',
    'Tibetan Plateau & Kham Region',
    'Yunnan–Guizhou Highlands',
    'Sichuan Basin & Mountains',
    'Chongqing & Three Gorges',
    'Zhangjiajie',
    'Silk Road Corridor',
    'Qinghai–Tibet Plateau',
    'Xi\'an',
    'Xinjiang Oases & Deserts',
    'Inner Mongolian Grasslands',
    'Beijing',
    'Loess & Shanxi Heritage',
    'Northeastern Forests',
    'Canton',
    'Guilin',
    'Hakka Fujian',
    'Wuhan',
    'Shanghai',
    'WaterTowns',
    'Hangzhou',
    'Yellow Mountain & Southern Anhui'
  ];
  
  const typeSlug = Array.isArray(params?.type) ? params?.type[0] : (params?.type as string);
  const journeyType = SlugToJourneyType[typeSlug || ''];
  
  // Journey Type 筛选：自动选择当前类型，但允许用户更改
  const [selectedJourneyType, setSelectedJourneyType] = useState<JourneyType | 'All'>(journeyType || 'All');
  
  // 当 journeyType 变化时，更新 selectedJourneyType
  useEffect(() => {
    if (journeyType) {
      setSelectedJourneyType(journeyType);
    }
  }, [journeyType]);

  // 所有可用的 Region（从所有 journeys 中提取）
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    journeys.forEach(j => {
      if (j.region) set.add(j.region);
    });
    return ['All', ...Array.from(set).sort()];
  }, [journeys]);

  // 应用所有筛选条件（显示所有 journeys，不只是当前类型）
  const filteredJourneys = useMemo(() => {
    return journeys.filter(journey => {
      const isActive = 'status' in journey ? journey.status === 'active' : true;
      const jType = resolveJourneyType(journey);
      
      const matchesJourneyType = selectedJourneyType === 'All' || jType === selectedJourneyType;
      const matchesRegion = selectedRegion === 'All' || journey.region === selectedRegion;
      const matchesDuration = selectedDuration === 'All' || journey.duration === selectedDuration;
      const matchesInterest = selectedInterest === 'All' || journey.category === selectedInterest;
      const matchesPlace = selectedPlace === 'All' || (journey.place && journey.place === selectedPlace);
      const matchesSearch = searchTerm === '' || 
        journey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (('description' in journey && journey.description) || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      return isActive && matchesJourneyType && matchesRegion && matchesDuration && matchesInterest && matchesPlace && matchesSearch;
    });
  }, [journeys, selectedJourneyType, selectedRegion, selectedDuration, selectedInterest, selectedPlace, searchTerm]);

  // 如果正在加载且没有数据，显示加载状态
  // 添加超时机制，避免无限加载
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    // 如果数据已加载，立即显示内容
    if (!isLoading || journeys.length > 0) {
      setShowContent(true);
      return;
    }
    
    // 如果还在加载，1.5秒后强制显示内容（即使没有数据）
    const timer = setTimeout(() => {
      console.log('Force showing content after timeout');
      setShowContent(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [isLoading, journeys.length]);

  // Recommended Journeys：当前类型下的前三条，横版卡片
  const recommendedJourneys = useMemo(() => {
    if (!journeyType) return [];
    return journeys.filter(journey => {
      const isActive = 'status' in journey ? journey.status === 'active' : true;
      const jType = resolveJourneyType(journey);
      return isActive && jType === journeyType;
    }).slice(0, 3);
  }, [journeys, journeyType]);

  const heroImage = journeyType ? JourneyTypeToHeroImage[journeyType] : '';
  const description = journeyType ? JourneyTypeDescriptions[journeyType] : '';

  // 早期返回必须在所有 Hooks 之后
  if (!journeyType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Text>页面不存在</Text>
      </div>
    );
  }

  // 只在初始加载时显示加载状态，1.5秒后强制显示内容
  // 即使 isLoading 为 true，如果 showContent 为 true，也显示内容
  if (isLoading && journeys.length === 0 && !showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Text>加载中...</Text>
      </div>
    );
  }
  
  // 调试信息
  console.log('JourneyTypePage render:', {
    isLoading,
    journeysCount: journeys.length,
    filteredCount: filteredJourneys.length,
    showContent,
    journeyType
  });

  const isGroupTours = journeyType === 'Group Tours';

  return (
    <main className="bg-[#f5f1e6]">
      {/* 1. Hero Banner Section */}
      <Section background="secondary" padding="none" className="relative overflow-hidden">
        {isGroupTours ? (
          // Group Tours：无配图，标题和正文居中
          <div className="relative h-[700px] w-full bg-[#f5f1e6] flex flex-col">
            {/* 面包屑导航 - 左上角 */}
            <div className="px-6 py-4 md:px-10 md:py-6">
              <Breadcrumb
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Journeys', href: '/journeys' },
                  { label: journeyType }
                ]}
                color="#000000"
                sizeClassName="text-lg md:text-xl font-normal"
                className="font-normal"
              />
            </div>
            {/* 中间标题 */}
            <div className="flex-1 flex items-center justify-center px-6 md:px-10">
              <div className="max-w-5xl lg:max-w-6xl text-center">
                <Heading
                  level={1}
                  className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl leading-tight"
                  style={{ fontFamily: 'Montaga, serif', color: '#000000', fontWeight: 400 }}
                >
                  The Korascale Partnership: A Clear Path to Extraordinary Groups
                </Heading>
              </div>
            </div>
          </div>
        ) : (
          // 其他类型：左图右文布局
          <div className="flex h-[800px] w-full overflow-hidden relative">
            {/* 左侧图片区域 */}
            <div
              className="w-1/2 h-[800px] bg-center bg-cover bg-no-repeat relative flex-shrink-0 md:w-1/2 w-full"
              style={{ backgroundImage: `url('${heroImage}')` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
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
                  {journeyType}
                </Heading>
              </div>
            </div>

            {/* 右侧内容区域 */}
            <div
              className="w-1/2 h-[800px] flex flex-col flex-shrink-0 md:w-1/2 w-full"
              style={{ backgroundColor: '#f5f1e6' }}
            >
              {/* 面包屑导航 - 靠左置顶，文字不加粗 */}
              <div className="px-6 py-2 lg:px-6 md:px-4 px-3">
                <Breadcrumb
                  items={[
                    { label: 'Home', href: '/' },
                    { label: 'Journeys', href: '/journeys' },
                    { label: journeyType }
                  ]}
                  color="#000000"
                  sizeClassName="text-lg md:text-xl font-normal"
                  className="font-normal"
                />
              </div>

              {/* 描述区域 - 左对齐 */}
              <div className="px-6 pt-32 flex-1 lg:px-6 lg:pt-32 md:px-4 md:pt-24 px-3 pt-16">
                <Text
                  size="xl"
                  className="text-black leading-relaxed font-body"
                  style={{
                    fontFamily: 'Monda, sans-serif',
                    fontSize: '1.25rem',
                    lineHeight: '1.625',
                    letterSpacing: '0em',
                    fontWeight: 400
                  }}
                >
                  {description}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* 2. Partnership Section - Only for Group Tours */}
      {isGroupTours && (
        <Section background="secondary" padding="none" className="py-6 sm:py-8 bg-white">
          <Container
            size="full"
            padding="none"
            className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12"
          >
            <div className="flex flex-col md:flex-row items-start gap-8 md:gap-12">
              {/* 左侧标题区域 */}
              <div className="md:w-1/3 flex-shrink-0 py-6 sm:py-8">
                <Heading
                  level={2}
                  className="text-2xl sm:text-3xl lg:text-4xl mb-4"
                  style={{ fontFamily: 'Montaga, serif', color: '#000000', fontWeight: 400 }}
                >
                  How to travel with Korascale
                </Heading>
                <Text
                  className="text-base sm:text-lg"
                  style={{
                    fontFamily: 'Monda, sans-serif',
                    color: '#000000',
                    fontWeight: 400
                  }}
                >
                  Your Path to a bespoke China Journey
                </Text>
              </div>
              {/* 右侧内容区域 - Partnership Paths */}
              <div className="md:w-2/3 flex-1 py-6 sm:py-8">
                <div className="flex gap-2 justify-end">
                  {partnershipPaths.map((path) => (
                    <div
                      key={path.id}
                      className={`
                        relative transition-all duration-300 ease-in-out cursor-pointer
                        ${hoveredPath === path.id ? 'w-80' : 'w-16'}
                      `}
                      onMouseEnter={() => setHoveredPath(path.id)}
                      onMouseLeave={() => setHoveredPath(null)}
                    >
                      {/* 竖长条 - 默认状态显示图片和数字 */}
                      <div
                        className={`
                          h-full min-h-[350px] rounded-lg transition-all duration-300 ease-in-out border overflow-hidden
                          flex flex-col
                          ${hoveredPath === path.id 
                            ? 'bg-white shadow-xl border-black/20' 
                            : 'bg-white border-black/10 hover:border-black/30'
                          }
                        `}
                      >
                        {/* 图片区域 */}
                        <div className="relative w-full flex-shrink-0">
                          <div
                            className={`
                              w-full bg-cover bg-center bg-no-repeat transition-all duration-300
                              ${hoveredPath === path.id ? 'h-56' : 'h-full min-h-[350px]'}
                            `}
                            style={{ backgroundImage: `url('${path.image}')` }}
                          >
                            {/* 数字覆盖层 */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div
                                className={`
                                  transition-all duration-300
                                  ${hoveredPath === path.id
                                    ? 'text-white text-2xl'
                                    : 'text-white text-3xl'
                                  }
                                `}
                                style={{ fontFamily: 'Monda, sans-serif', fontWeight: 600 }}
                              >
                                {path.number}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 卡片内容 - 悬停时展开显示 */}
                        {hoveredPath === path.id && (
                          <div className="flex-1 flex flex-col p-4">
                            <Heading
                              level={3}
                              className="text-lg mb-3"
                              style={{ fontFamily: 'Montaga, serif', color: '#000000', fontWeight: 400 }}
                            >
                              {path.title}
                            </Heading>
                            <Text
                              className="text-sm leading-relaxed"
                              style={{ fontFamily: 'Monda, sans-serif', color: '#000000', fontWeight: 400 }}
                            >
                              {path.description}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </Section>
      )}

      {/* 3. Recommended Journeys / Brochures Section */}
      <Section background="secondary" padding="none" className="py-12 sm:py-16 bg-white">
        <Container
          size="full"
          padding="none"
          className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12"
        >
          {isGroupTours ? (
            // Group Tours: 显示 Brochures，无标题和副标题
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {brochures.map((brochure) => {
                const handleBrochureClick = () => {
                  if (user) {
                    // 已登录，直接打开 PDF
                    window.open(brochure.pdfUrl, '_blank');
                  } else {
                    // 未登录，跳转到登录页面，登录后返回当前页面
                    router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                  }
                };

                return (
                  <Card
                    key={brochure.id}
                    className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={handleBrochureClick}
                  >
                    <div
                      className="w-full h-[400px] bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url('${brochure.coverImage}')` }}
                    />
                    <div className="p-4 bg-white">
                      <Text
                        className="text-sm font-medium text-center"
                        style={{ fontFamily: 'Monda, sans-serif', color: '#000000' }}
                      >
                        {brochure.title}
                      </Text>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            // 其他类型: 显示 Recommended Journeys，有标题和副标题
            <>
              <div className="text-center mb-10">
                <Text className="text-sm uppercase tracking-wide mb-2" style={{ fontFamily: 'Monda, sans-serif' }}>
                  Recommended Journeys
                </Text>
                <Heading
                  level={2}
                  className="text-2xl sm:text-3xl lg:text-4xl"
                  style={{ fontFamily: 'Montaga, serif' }}
                >
                  Our Favorite Adventures in {journeyType} Right Now
                </Heading>
              </div>

              <div className="space-y-8">
            {recommendedJourneys.map((journey: Journey) => {
              // 获取 overview 描述，优先使用 overview.description，否则使用 description
              const overviewText = ('overview' in journey && journey.overview && typeof journey.overview === 'object' && 'description' in journey.overview)
                ? (journey.overview as any).description
                : ('description' in journey ? journey.description : '');
              
              // 获取价格
              const price = ('price' in journey && typeof journey.price === 'number')
                ? `$${journey.price}`
                : ('price' in journey ? journey.price : 'N/A');
              
              // 获取 slug
              const journeySlug = ('slug' in journey && journey.slug) 
                ? `/journeys/${journey.slug}` 
                : ('link' in journey && journey.link) 
                  ? journey.link 
                  : '#';
              
              // 获取 maxGuests
              const maxGuests = ('maxGuests' in journey && journey.maxGuests) 
                ? journey.maxGuests 
                : ('maxParticipants' in journey && journey.maxParticipants) 
                  ? journey.maxParticipants 
                  : null;
              
              return (
                <Card
                  key={journey.id}
                  className="bg-[#f5f1e6] border border-[#e0d7c4] overflow-hidden flex flex-col md:flex-row shadow-sm h-[280px] md:h-[320px]"
                >
                  {/* 左侧图片 - 固定高度，无边距 */}
                  <div className="md:w-[45%] flex-shrink-0 h-full">
                    <div
                      className="h-full w-full bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: `url('${journey.image}')` }}
                    />
                  </div>
                  {/* 右侧文案 - 固定高度 */}
                  <div className="md:w-[55%] px-6 py-5 sm:px-8 sm:py-6 flex flex-col justify-between h-full">
                    <div className="flex-1 overflow-hidden">
                      {/* 标题 - 不加粗 */}
                      <Heading
                        level={3}
                        className="text-lg sm:text-xl mb-3 font-normal line-clamp-2"
                        style={{ fontFamily: 'Montaga, serif', fontWeight: 400 }}
                      >
                        {journey.title}
                      </Heading>
                      {/* Overview 描述 - 超过内容用省略号 */}
                      <Text
                        className="text-sm sm:text-base leading-relaxed line-clamp-4"
                        style={{ fontFamily: 'Monda, sans-serif', color: '#333333' }}
                      >
                        {overviewText || ''}
                      </Text>
                    </div>
                    {/* 底部：价格和按钮 - 固定位置 */}
                    <div className="mt-4 pt-4 flex items-center justify-between border-t border-gray-100 flex-shrink-0">
                      {/* 价格 */}
                      <Text
                        className="text-base sm:text-lg font-medium"
                        style={{ fontFamily: 'Monda, sans-serif', color: '#000000' }}
                      >
                        {price !== 'N/A' ? `Priced from ${price}` : ''}
                      </Text>
                      {/* View Journey 按钮 */}
                      <Link
                        href={journeySlug}
                        className="bg-black text-white px-6 py-2 text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
                        style={{ fontFamily: 'Monda, sans-serif', color: '#FFFFFF' }}
                      >
                        View Journey
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
              </div>
            </>
          )}
        </Container>
      </Section>

      {/* 4. Journey Filter + Grid Section - Group Tours 不显示 */}
      {!isGroupTours && (
      <Section background="secondary" padding="none" className="pb-16 bg-[#f5f1e6]">
        <Container size="full" padding="none" className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-16">
          <div className="flex gap-8">
            {/* Filter Sidebar - 左侧栏 */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h3 className="text-2xl font-['Monda'] font-bold mb-6">Filter</h3>
                
                {/* Journey Type Filter */}
                <div className="mb-8">
                  <div 
                    className="flex items-center justify-between cursor-pointer mb-4"
                    onClick={() => setIsJourneyTypeOpen(v => !v)}
                  >
                    <h4 className="text-xl font-['Monda'] font-bold">JOURNEY TYPE</h4>
                    <span className="text-sm transition-transform duration-200">{isJourneyTypeOpen ? '▼' : '▶'}</span>
                  </div>
                  {isJourneyTypeOpen && (
                    <div className="flex flex-wrap gap-2">
                      {['All', 'Explore Together', 'Deep Discovery', 'Signature Journeys', 'Group Tours'].map((type) => (
                        <button
                          key={type}
                          className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
                            selectedJourneyType === type ? 'bg-gray-200' : 'bg-white'
                          }`}
                          style={{
                            color: 'black',
                            backgroundColor: selectedJourneyType === type ? '#e5e7eb' : 'white'
                          }}
                          onClick={() => setSelectedJourneyType(type as JourneyType | 'All')}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Regions Filter */}
                <div className="mb-8">
                  <div 
                    className="flex items-center justify-between cursor-pointer mb-4"
                    onClick={() => setIsRegionOpen(v => !v)}
                  >
                    <h4 className="text-xl font-['Monda'] font-bold">REGIONS</h4>
                    <span className="text-sm transition-transform duration-200">{isRegionOpen ? '▼' : '▶'}</span>
                  </div>
                  {isRegionOpen && (
                    <div className="flex flex-wrap gap-2">
                      {regionOptions.map((region) => (
                        <button
                          key={region}
                          className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
                            selectedRegion === region ? 'bg-gray-200' : 'bg-white'
                          }`}
                          style={{
                            color: 'black',
                            backgroundColor: selectedRegion === region ? '#e5e7eb' : 'white'
                          }}
                          onClick={() => setSelectedRegion(region)}
                        >
                          {region}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Duration Filter */}
                <div className="mb-8">
                  <div 
                    className="flex items-center justify-between cursor-pointer mb-4"
                    onClick={() => setIsDurationOpen(v => !v)}
                  >
                    <h4 className="text-xl font-['Monda'] font-bold">DURATION</h4>
                    <span className="text-sm transition-transform duration-200">{isDurationOpen ? '▼' : '▶'}</span>
                  </div>
                  {isDurationOpen && (
                    <div className="flex flex-wrap gap-2">
                      {['All', '1 Day', '2 Days', '3 Days', '4 Days'].map((duration) => (
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
                  )}
                </div>

                {/* Interests Filter - 对应 Journey.category */}
                <div className="mb-8">
                  <div 
                    className="flex items-center justify-between cursor-pointer mb-4"
                    onClick={() => setIsInterestOpen(v => !v)}
                  >
                    <h4 className="text-xl font-['Monda'] font-bold">INTERESTS</h4>
                    <span className="text-sm transition-transform duration-200">{isInterestOpen ? '▼' : '▶'}</span>
                  </div>
                    {isInterestOpen && (
                    <div className="flex flex-wrap gap-2">
                      {['All', 'Nature', 'Culture', 'History', 'City', 'Cruises'].map((interest) => (
                        <button
                          key={interest}
                          className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
                            selectedInterest === interest ? 'bg-gray-200' : 'bg-white'
                          }`}
                          style={{
                            color: 'black',
                            backgroundColor: selectedInterest === interest ? '#e5e7eb' : 'white'
                          }}
                          onClick={() => setSelectedInterest(interest)}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Places Filter */}
                <div className="mb-8">
                  <div 
                    className="flex items-center justify-between cursor-pointer mb-4"
                    onClick={() => setIsPlaceOpen(v => !v)}
                  >
                    <h4 className="text-xl font-['Monda'] font-bold">PLACES</h4>
                    <span className="text-sm transition-transform duration-200">{isPlaceOpen ? '▼' : '▶'}</span>
                  </div>
                  {isPlaceOpen && (
                    <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                      {placeOptions.map((place) => (
                        <button
                          key={place}
                          className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
                            selectedPlace === place ? 'bg-gray-200' : 'bg-white'
                          }`}
                          style={{
                            color: 'black',
                            backgroundColor: selectedPlace === place ? '#e5e7eb' : 'white'
                          }}
                          onClick={() => setSelectedPlace(place)}
                        >
                          {place}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results Section - 右侧结果区域 */}
            <div className="flex-1">
              <h2 className="text-3xl font-['Montaga'] mb-8">See Where We Can Take You</h2>
              
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
            <div className="text-center py-20">
              <Text className="text-gray-600 text-lg mb-4">
                    No journeys found
              </Text>
              <Link href="/journeys">
                <Button variant="primary">
                      View All Journeys
                </Button>
              </Link>
            </div>
          ) : (
            <>
                  <div className="mb-6">
                <Text className="text-gray-600">
                      Found {filteredJourneys.length} journey{filteredJourneys.length !== 1 ? 's' : ''}
                </Text>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredJourneys.map((journey: Journey) => {
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
                        <Card
                          key={journey.id}
                          className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full bg-[#f5f1e6]"
                        >
                    <div 
                      className="h-48 bg-cover bg-center bg-no-repeat flex-shrink-0"
                      style={{ backgroundImage: `url('${journey.image}')` }}
                    />
                          <div className="p-4 flex flex-col flex-1">
                            <h3 
                              className="text-lg font-['Montaga'] mb-2 leading-tight flex-shrink-0 font-normal"
                              style={{ fontWeight: 400 }}
                            >
                        {journey.title}
                      </h3>
                      <Text className="text-sm text-gray-600 mb-3 line-clamp-2 flex-shrink-0">
                              {('shortDescription' in journey && journey.shortDescription) ||
                                ('description' in journey && journey.description) ||
                                ''}
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
            </>
          )}
            </div>
          </div>
        </Container>
      </Section>
      )}

      {/* 5. Plan Your Journey Section */}
      <Section background="primary" padding="none" className="py-12">
        <Container
          size="xl"
          padding="none"
          className="bg-tertiary mx-4 sm:mx-8 lg:mx-20 rounded-lg p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div>
            <Heading
              level={2}
              className="text-2xl sm:text-3xl mb-4"
              style={{ color: '#FFFFFF', fontFamily: 'Montaga, serif' }}
            >
              Plan your journey in China with Korascale
            </Heading>
            <Text
              className="text-sm sm:text-base"
              style={{ color: '#FFFFFF', fontFamily: 'Monda, sans-serif' }}
            >
              Tell us what you are looking for and our team will craft a tailored itinerary that matches your
              interests, timing and budget.
            </Text>
          </div>
          <Button
            variant="primary"
            size="lg"
            className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-body text-sm hover:bg-white hover:text-tertiary transition-all duration-300"
            onClick={() => setIsPlanTripModalOpen(true)}
          >
            PLAN YOUR JOURNEY
          </Button>
        </Container>

        <PlanTripModal isOpen={isPlanTripModalOpen} onClose={() => setIsPlanTripModalOpen(false)} />
      </Section>
    </main>
  );
}

