'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Container, Section, Heading, Text, Button, Card, Breadcrumb } from '@/components/common';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { AccommodationCard } from '@/components/cards/AccommodationCard';
import { WishlistSidebar } from '@/components/wishlist/WishlistSidebar';
import dynamic from 'next/dynamic';

// 动态导入地图组件（避免 SSR 问题）
const JourneyMap = dynamic(() => import('@/components/map/JourneyMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] lg:h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
        <p className="text-gray-600 text-sm">加载地图中...</p>
      </div>
    </div>
  )
});
// import { HotelDetailModal } from '@/components/modals/HotelDetailModal';
import { useWishlist } from '@/context/WishlistContext';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { useExperienceManagement } from '@/context/ExperienceManagementContext';
import { useHotelManagement } from '@/context/HotelManagementContext';
import { generateStandardPageConfig, JOURNEY_PAGE_TEMPLATE } from '@/lib/journeyPageTemplate';
import { useCart } from '@/context/CartContext';
import { Journey } from '@/types';
import { Heart, MapPin, Clock, Users } from 'lucide-react';

export default function DynamicJourneyPage() {
  const { toggleWishlist, items } = useWishlist();
  const { journeys, isLoading: journeysLoading } = useJourneyManagement();
  const { experiences } = useExperienceManagement();
  const { hotels } = useHotelManagement();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  // 直接从API获取journey（如果context中没有）
  const [journeyFromApi, setJourneyFromApi] = useState<Journey | null>(null);
  const [isLoadingFromApi, setIsLoadingFromApi] = useState(false);

  // 已移除酒店详情弹窗状态

  // 根据slug查找对应的旅行卡片（优先从context，其次从API）
  const journey = useMemo(() => {
    const foundInContext = journeys.find(j => j.slug === slug);
    return foundInContext || journeyFromApi;
  }, [journeys, slug, journeyFromApi]);
  
  // 如果context中找不到，尝试从API获取
  useEffect(() => {
    const fetchJourneyBySlug = async () => {
      // 验证 slug 是否有效
      if (!slug || slug.trim() === '') {
        return;
      }
      
      // 如果还在加载context数据，等待一下
      if (journeysLoading) return;
      
      // 如果已经在context中找到，不需要API查询
      const foundInContext = journeys.find(j => j.slug === slug);
      if (foundInContext) return;
      
      // 如果已经查询过且结果为null，不需要重复查询
      // 添加 slug 验证，避免无效请求
      if (journeyFromApi === null && !isLoadingFromApi && journeys.length > 0 && slug && slug.length > 1) {
        setIsLoadingFromApi(true);
        try {
          // 创建超时控制器
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(`/api/journeys/slug/${encodeURIComponent(slug)}`, {
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          if (response.ok) {
            const data = await response.json();
            setJourneyFromApi(data.journey);
          } else {
            setJourneyFromApi(null);
          }
        } catch (error) {
          // 如果是 AbortError，不记录错误
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error fetching journey by slug:', error);
          }
          setJourneyFromApi(null);
        } finally {
          setIsLoadingFromApi(false);
        }
      }
    };
    
    fetchJourneyBySlug();
  }, [slug, journeys, journeysLoading, journeyFromApi, isLoadingFromApi]);
  
  console.log('DynamicJourneyPage Debug:', {
    journeysLoading,
    journeysCount: journeys.length,
    experiencesCount: experiences.length,
    hotelsCount: hotels.length,
    slug,
    journeyFound: !!journey,
    journeyTitle: journey?.title,
    allSlugs: journeys.map(j => j.slug),
    localStorageJourneys: typeof window !== 'undefined' ? localStorage.getItem('journeys') : 'N/A'
  });

  // 获取相关的体验和住宿 - 基于availableExperiences和availableAccommodations
  const relatedExperiences = useMemo(() => {
    if (!journey || !journey.availableExperiences) return [];
    return experiences.filter(exp => 
      journey.availableExperiences.includes(exp.id) && exp.status === 'active'
    );
  }, [journey, experiences]);

  const relatedAccommodations = useMemo(() => {
    if (!journey) return [];
    // 优先使用accommodations，如果没有则使用availableAccommodations
    const accommodationIds = journey.accommodations && journey.accommodations.length > 0 
      ? journey.accommodations 
      : (journey.availableAccommodations || []);
    
    return hotels.filter(hotel => 
      accommodationIds.includes(hotel.id) && hotel.status === 'active'
    );
  }, [journey, hotels]);

  // =============== Select Your Date: 动态月历（未来一年） =================
  const today = useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = useState(0); // 相对当前月份的偏移，0..11
  const baseDate = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + monthOffset, 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today, monthOffset]);

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const getMonthMatrix = (year: number, month: number) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const daysInMonth = last.getDate();
    const startWeekday = first.getDay();
    const blanks = Array.from({ length: startWeekday }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
    return [...blanks, ...days];
  };

  const monthMatrix = useMemo(() => getMonthMatrix(baseDate.getFullYear(), baseDate.getMonth()), [baseDate]);

  const isPastDate = (d: Date | null) => !d || d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isBeyondOneYear = (d: Date | null) => {
    if (!d) return false;
    const limit = new Date(today);
    limit.setFullYear(limit.getFullYear() + 1);
    return d > limit;
  };
  const isAvailable = (d: Date | null) => d && !isPastDate(d) && !isBeyondOneYear(d);

  // 悬浮可交互弹层状态（保持打开以便点击）
  const [activePopoverDate, setActivePopoverDate] = useState<Date | null>(null);
  const [guestAdults, setGuestAdults] = useState<number>(2);
  const [guestChildren, setGuestChildren] = useState<number>(0);
  const [confirmedDate, setConfirmedDate] = useState<Date | null>(null);
  const popoverTimer = useRef<number | null>(null);

  // 生成标准化的页面配置
  const pageConfig = useMemo(() => {
    if (!journey) return null;
    
    // 直接使用 journey 的页面内容，而不是模板生成
    return {
      // Hero区域 - 使用后台设置的内容
      hero: {
        image: journey.heroImage || journey.image,
        title: journey.pageTitle || journey.title,
        stats: journey.heroStats || {
          days: parseInt((journey.duration || '').split(' ')[0]) || 1,
          destinations: journey.destinationCount || (journey.itinerary ? journey.itinerary.length : 1) || 1,
          maxGuests: journey.maxGuests || journey.maxParticipants || 12
        }
      },

      // 导航 - 使用后台设置的导航
      navigation: journey.navigation || [
        { name: 'Overview', href: '#overview' },
        { name: 'Itinerary', href: '#itinerary' },
        ...(journey.accommodations && journey.accommodations.length > 0 
          ? [{ name: 'Stays', href: '#stays' }] 
          : []),
        { name: 'Details', href: '#details' }
      ],

      // 概述区域 - 使用后台设置的 overview 内容
      overview: {
        breadcrumb: journey.overview?.breadcrumb || [
          'Home', 'Journey', journey.category, journey.title
        ],
        description: journey.overview?.description || journey.description,
        highlights: journey.overview?.highlights || (journey.highlights || []).map(h => ({
          icon: '⭐',
          title: h,
          description: `Experience ${h.toLowerCase()} during your journey.`
        })),
        sideImage: journey.overview?.sideImage || journey.images?.[1] || journey.image
      },

      // 行程区域 - 使用后台设置的 itinerary
      itinerary: (journey.itinerary || []).map(day => ({
        ...day,
        image: day.image || journey.images?.[0] || journey.image
      })),

      // 体验区域 - 使用后台设置的 experiences（仅作为可选项清单）
      experiences: journey.experiences || [],

      // 住宿区域 - 使用后台设置的 accommodations
      accommodations: journey.accommodations || [],

      // 包含和排除项目
      includes: journey.includes || '',
      excludes: journey.excludes || '',

      // 相关推荐
      relatedTrips: journey.relatedTrips || [],

      // 旅行模块 - 用于预订页面的互动选择
      modules: journey.modules || []
    };
  }, [journey]);

  // 加入预订
  const { addJourney, addExperienceToJourney } = useCart();
  const handleAddToCart = () => {
    if (!journey) return;
    try {
      localStorage.setItem('last_selected_journey_slug', journey.slug);
    } catch {}
    addJourney({
      journeyId: journey.id,
      slug: journey.slug,
      title: journey.title,
      image: journey.image,
      basePrice: journey.price,
      travelers: { adults: 2, children: 0 },
    });
    router.push('/booking/cart');
  };

  // 直接预订：加入购物车后跳转到 Your Booking 页面
  const handleDirectBooking = () => {
    if (!journey) return;
    try {
      localStorage.setItem('last_selected_journey_slug', journey.slug);
    } catch {}
    const days = getDurationDays();
    const start = confirmedDate ? confirmedDate : new Date();
    const end = addDays(start, Math.max(0, days - 1));

    addJourney({
      journeyId: journey.id,
      slug: journey.slug,
      title: journey.title,
      image: journey.image,
      basePrice: journey.price,
      travelers: { adults: guestAdults, children: guestChildren },
      dates: confirmedDate ? { start: formatLocalYmd(start), end: formatLocalYmd(end) } : undefined,
    });
    router.push('/booking/cart');
  };

  // 如果找不到对应的旅行卡片，显示404（延迟判断，给API查询时间）
  useEffect(() => {
    // 只有在确认加载完成且确实找不到时才跳转404
    if (!journeysLoading && !isLoadingFromApi && journeys.length > 0 && !journey && journeyFromApi === null) {
      // 延迟一下，避免过快跳转
      const timer = setTimeout(() => {
        router.push('/404');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [journeys, journey, journeyFromApi, journeysLoading, isLoadingFromApi, router]);

  if (journeysLoading || isLoadingFromApi) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Text className="text-gray-600">Loading journey...</Text>
        </div>
      </div>
    );
  }

  if (!journey || !pageConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Text className="text-gray-600">Journey not found</Text>
        </div>
      </div>
    );
  }

  const openPopover = (d: Date | null) => {
    if (!d) return;
    if (popoverTimer.current) window.clearTimeout(popoverTimer.current);
    setActivePopoverDate(d);
  };
  const scheduleClosePopover = () => {
    if (popoverTimer.current) window.clearTimeout(popoverTimer.current);
    popoverTimer.current = window.setTimeout(() => setActivePopoverDate(null), 120);
  };

  const formatLocalYmd = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };
  const getDurationDays = (): number => {
    if (!journey?.duration) return 1;
    const match = journey.duration.match(/\d+/);
    const n = match ? parseInt(match[0], 10) : 1;
    return Math.max(1, n);
  };

  const submitBookingForDate = (d: Date) => {
    const checkIn = formatLocalYmd(d);
    const travelers = guestAdults + guestChildren;
    router.push(`/booking/${journey.slug}?checkIn=${encodeURIComponent(checkIn)}&adults=${guestAdults}&children=${guestChildren}&travelers=${travelers}`);
  };

  // 已移除酒店点击弹窗逻辑

  // 已移除酒店详情弹窗关闭逻辑

  return (
    <div className="min-h-screen bg-white">
      {/* Wishlist Sidebar */}
      <WishlistSidebar />

      {/* Hero Banner */}
      <section className={`relative ${JOURNEY_PAGE_TEMPLATE.hero.height} overflow-hidden`}>
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: `url('${pageConfig.hero.image}')` }}
        />
        
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="text-center text-white">
            <Heading 
              level={1} 
              className={`${JOURNEY_PAGE_TEMPLATE.hero.titleSize} font-bold mb-6`}
              style={{ color: '#ffffff' }}
            >
              {pageConfig.hero.title}
            </Heading>
            <div className={JOURNEY_PAGE_TEMPLATE.hero.statsLayout}>
              <div className={JOURNEY_PAGE_TEMPLATE.hero.statsItem.container} style={{ color: '#ffffff' }}>
                <div className={JOURNEY_PAGE_TEMPLATE.hero.statsItem.number}>{pageConfig.hero.stats.days}</div>
                <div className={JOURNEY_PAGE_TEMPLATE.hero.statsItem.label}>DAYS</div>
              </div>
              <div className={JOURNEY_PAGE_TEMPLATE.hero.statsItem.container} style={{ color: '#ffffff' }}>
                <div className={JOURNEY_PAGE_TEMPLATE.hero.statsItem.number}>{pageConfig.hero.stats.destinations}</div>
                <div className={JOURNEY_PAGE_TEMPLATE.hero.statsItem.label}>DESTINATIONS</div>
              </div>
              <div className={JOURNEY_PAGE_TEMPLATE.hero.statsItem.container} style={{ color: '#ffffff' }}>
                <div className={JOURNEY_PAGE_TEMPLATE.hero.statsItem.number}>{pageConfig.hero.stats.maxGuests}</div>
                <div className={JOURNEY_PAGE_TEMPLATE.hero.statsItem.label}>GUESTS MAX</div>
              </div>
            </div>
          </div>
        </div>

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
      </section>

      {/* Navigation */}
      <nav className="bg-tertiary py-4">
        <Container size="xl">
          <div className="flex justify-center gap-8">
            {pageConfig.navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-white hover:text-accent transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </Container>
      </nav>

      {/* Journey Overview */}
      <Section id="overview" background="secondary" padding="xl">
        <Container size="xl">
          <div className="flex gap-8 lg:flex-row md:flex-col">
            {/* 左侧内容 */}
            <div className="flex-1">
              {/* 面包屑导航 */}
              <Breadcrumb 
                items={pageConfig.overview.breadcrumb.map((item, index) => ({
                  label: item,
                  href: index === pageConfig.overview.breadcrumb.length - 1 ? undefined : 
                        index === 0 ? "/" : index === 1 ? "/journeys" : "#"
                }))}
                color="#000000"
                sizeClassName="text-lg md:text-xl"
                className="mb-8"
              />

            {/* 概述文本 */}
            <Text size="xl" className="mb-8 leading-relaxed">
                {pageConfig.overview.description}
              </Text>

              {/* 特色亮点 */}
              <div className="space-y-4">
                {(pageConfig.overview?.highlights || []).map((highlight, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-2xl">{highlight.icon}</span>
                    <div className="flex-1">
                      <Text className="font-medium">{highlight.title}</Text>
                      <Text size="sm" className="text-gray-600">
                        {highlight.description}
                      </Text>
                      {'image' in highlight && (highlight as any).image && (
                        <img
                          src={(highlight as any).image}
                          alt={highlight.title}
                          className="mt-2 w-full h-32 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧内容 */}
            <div className="lg:w-96 md:w-full">
              {/* 可交互地图 */}
              <div className="mt-6 relative">
                <JourneyMap
                  city={journey.city}
                  location={journey.location}
                  region={journey.region}
                  title={journey.title}
                  className="relative"
                />
                {/* Book Now 固定在地图的底部左侧 */}
                <div className="absolute left-4 bottom-4 z-[1000]">
                  <Button variant="primary" onClick={handleDirectBooking}>
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Itinerary */}
      <Section id="itinerary" background="tertiary" padding="xl">
        <Container size="xl">
          <Heading level={2} align="center" className="mb-12" style={{ color: '#ffffff' }}>
            Daily Itinerary
          </Heading>

          <div className="space-y-6">
            {pageConfig.itinerary.map((day, index) => (
              <div key={index} className="bg-white rounded-lg p-6 border-2 border-black">
                <div className="flex gap-6 lg:flex-row md:flex-col">
                  <div className="flex-1">
                    <Heading level={3} className="mb-4 text-black">
                      {day.title}
                    </Heading>
                    <Text className="text-gray-700 leading-relaxed">
                      {day.description}
                    </Text>
                  </div>
                  {day.image && (
                    <div
                      className="w-80 h-48 lg:w-96 lg:h-64 bg-center bg-cover bg-no-repeat rounded-lg flex-shrink-0"
                      style={{ backgroundImage: `url('${day.image}')` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Add Experiences */}
      {relatedExperiences.length > 0 && (
        <Section background="secondary" padding="xl">
          <Container size="xl">
            <Heading level={2} align="center" className="mb-4">
              ENHANCE YOUR JOURNEY WITH ADD-ON EXPERIENCES
            </Heading>
            <Text align="center" size="lg" className="mb-12 max-w-4xl mx-auto">
              Don&apos;t let any unforgettable moments pass you by—explore all the incredible add-on experiences available for your entire journey. Whether you&apos;re looking to revisit a missed adventure or want a convenient overview of every offering, this is your chance to ensure your trip is packed with every amazing experience possible.
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {relatedExperiences.map((experience) => (
                <ExperienceCard 
                  key={experience.id}
                  id={experience.id}
                  title={experience.title}
                  location={experience.location}
                  image={experience.image}
                  price={`From ¥${experience.price}`}
                  duration={experience.duration}
                  description={experience.shortDescription}
                />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Add Stay Options */}
      {relatedAccommodations.length > 0 && (
        <Section id="stays" background="tertiary" padding="xl">
          <Container size="xl">
            <Heading level={2} align="center" className="mb-4 text-white" style={{ color: '#ffffff' }}>
              YOUR STAY OPTIONS
            </Heading>
            <Text align="center" size="lg" className="mb-12 text-white max-w-4xl mx-auto" style={{ color: '#ffffff' }}>
              Hand Selected for an Unmatched Experience
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {relatedAccommodations.map((accommodation) => (
                <AccommodationCard 
                  key={accommodation.id} 
                  id={accommodation.id}
                  title={accommodation.name}
                  location={accommodation.location}
                  image={accommodation.images?.[0] || ''}
                  price="¥500/night"
                  description={accommodation.description}
                  variant="default"
                  showWishlist={true}
                />
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/accommodations">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-tertiary">
                  View More
                </Button>
              </Link>
            </div>
          </Container>
        </Section>
      )}

      {/* Includes & Excludes */}
      <Section id="details" background="secondary" padding="xl">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Includes */}
            <div>
              <Heading level={3} className="mb-8">
                Includes
              </Heading>
              
              <div className="space-y-4">
                {journey.includes ? (
                  <div className="whitespace-pre-line">
                    {journey.includes.split('\n').map((line, index) => (
                      line.trim() && (
                        <div key={index} className="flex items-start gap-3 mb-3">
                          <span className="text-primary-500 mt-1">•</span>
                          <Text className="text-gray-700">{line.trim()}</Text>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Text className="text-gray-500">No inclusion details available for this journey.</Text>
                  </div>
                )}
              </div>
            </div>

            {/* Excludes */}
            <div>
              <Heading level={3} className="mb-8">
                Excludes
              </Heading>
              
              <div className="space-y-4">
                {journey.excludes ? (
                  <div className="whitespace-pre-line">
                    {journey.excludes.split('\n').map((line, index) => (
                      line.trim() && (
                        <div key={index} className="flex items-start gap-3 mb-3">
                          <span className="text-red-500 mt-1">×</span>
                          <Text className="text-gray-700">{line.trim()}</Text>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Text className="text-gray-500">No exclusion details available for this journey.</Text>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Booking Section */}
      <Section id="booking" background="primary" padding="xl">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Select Your Date（替换原Dates & Prices区域，动态未来一年） */}
            <div>
              <Heading level={3} className="mb-8">
                Select Your Date
              </Heading>
              <Card className="p-6">
                {/* 顶部月份导航（限制未来一年） */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    className="px-2 py-1 text-sm rounded border disabled:opacity-40"
                    onClick={() => setMonthOffset(v => Math.max(0, v - 1))}
                    disabled={monthOffset === 0}
                  >Prev</button>
                  <div className="text-sm font-medium">{monthNames[baseDate.getMonth()]} {baseDate.getFullYear()}</div>
                  <button
                    className="px-2 py-1 text-sm rounded border disabled:opacity-40"
                    onClick={() => setMonthOffset(v => Math.min(11, v + 1))}
                    disabled={monthOffset === 11}
                  >Next</button>
                </div>

                {/* 星期标题 */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
                  ))}
                </div>

                {/* 当月网格 */}
                <div className="grid grid-cols-7 gap-1 relative">
                  {monthMatrix.map((cell, idx) => {
                    const disabled = isPastDate(cell) || isBeyondOneYear(cell);
                    const isDate = !!cell;
                    const isActive = activePopoverDate && cell && activePopoverDate.toDateString() === cell.toDateString();
                    const available = isAvailable(cell);
                    const isRange = (() => {
                      if (!confirmedDate || !cell) return false;
                      const days = getDurationDays();
                      const rangeEnd = addDays(confirmedDate, Math.max(0, days - 1));
                      return cell >= confirmedDate && cell <= rangeEnd;
                    })();
                    
                    return (
                      <div
                        key={idx}
                        className={`h-10 relative ${!isDate ? '' : available ? 'group' : ''}`}
                        onMouseEnter={() => (available ? openPopover(cell) : undefined)}
                        onMouseLeave={available ? scheduleClosePopover : undefined}
                      >
                        <div
                          className={`h-10 flex items-center justify-center text-sm rounded transition-colors ${
                            !isDate
                              ? ''
                              : disabled
                              ? 'text-gray-300 cursor-not-allowed'
                              : confirmedDate && cell && confirmedDate.toDateString() === cell.toDateString()
                              ? 'bg-black text-white'
                              : isRange
                              ? 'bg-primary-200 text-gray-900 ring-1 ring-primary-400'
                              : available
                              ? 'text-gray-700 hover:bg-primary-100 cursor-pointer'
                              : 'text-gray-400'
                          }`}
                        >
                          {cell ? cell.getDate() : ''}
                        </div>

                        {/* 悬浮/保持可点击的弹层 - 只对可用日期显示 */}
                        {isDate && available && activePopoverDate && isActive && (
                          <div
                            className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2"
                            onMouseEnter={() => openPopover(cell)}
                            onMouseLeave={scheduleClosePopover}
                          >
                            <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg min-w-[220px] pointer-events-auto">
                              <div className="text-center mb-2">
                                <div className="font-semibold">{monthNames[cell.getMonth()]} {cell.getDate()}, {cell.getFullYear()}</div>
                                <div className="text-green-400">Available</div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center"><span>Adult (12+)</span><span className="font-semibold">¥{journey.price}</span></div>
                                <div className="flex justify-between items-center"><span>Child (3-11)</span><span className="font-semibold">¥{Math.round(journey.price * 0.7)}</span></div>
                                <div className="flex justify-between items-center"><span>Infant (0-2)</span><span className="font-semibold">Free</span></div>
                              </div>
                              <div className="mt-3 pt-2 border-t border-gray-700">
                                <div className="text-center mb-2">Select Guests</div>
                                <div className="flex items-center justify-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <span className="w-10 inline-block text-right mr-1">Adults</span>
                                    <button className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-xs" onClick={() => setGuestAdults(v => Math.max(1, v - 1))}>-</button>
                                    <span className="px-2 text-sm">{guestAdults}</span>
                                    <button className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-xs" onClick={() => setGuestAdults(v => Math.min(9, v + 1))}>+</button>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-10 inline-block text-right mr-1">Child</span>
                                    <button className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-xs" onClick={() => setGuestChildren(v => Math.max(0, v - 1))}>-</button>
                                    <span className="px-2 text-sm">{guestChildren}</span>
                                    <button className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded text-xs" onClick={() => setGuestChildren(v => Math.min(9, v + 1))}>+</button>
                                  </div>
                                </div>
                              </div>
                              <button
                                className="w-full mt-3 bg-primary-500 hover:bg-primary-600 text-white text-xs py-1 rounded"
                                onClick={() => {
                                  setConfirmedDate(cell as Date);
                                  setActivePopoverDate(null);
                                }}
                              >
                                Confirm
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* 全局 Book Now 按钮 */}
                <div className="mt-4 text-right">
                  <Button
                    variant="primary"
                    onClick={handleDirectBooking}
                    disabled={!confirmedDate}
                  >
                    Book Now
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </Section>

      {/* Related Trips */}
      {pageConfig.relatedTrips && pageConfig.relatedTrips.length > 0 && (
        <Section background="accent" padding="xl">
          <Container size="xl">
            <Heading level={2} align="center" className="mb-12">
              More {journey.region} Adventures
            </Heading>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pageConfig.relatedTrips.map((trip, index) => (
                <Link key={index} href={`/journeys/${trip.slug}`}>
                  <Card className="overflow-hidden p-0 hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                    <div
                      className="h-48 bg-center bg-cover bg-no-repeat"
                      style={{ backgroundImage: `url('${trip.image}')` }}
                    />
                    <div className="p-4 bg-white">
                      <Text className="font-medium mb-2 line-clamp-2 text-gray-900">
                        {trip.title}
                      </Text>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>{trip.duration}</span>
                        <span className="font-medium text-primary-600">{trip.price}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* 已移除酒店详情弹窗 */}
    </div>
  );
}
