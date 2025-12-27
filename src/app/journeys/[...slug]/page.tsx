'use client';

import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Container, Section, Heading, Text, Button, Card, Breadcrumb } from '@/components/common';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { AccommodationCard } from '@/components/cards/AccommodationCard';
import { WishlistSidebar } from '@/components/wishlist/WishlistSidebar';
// import { HotelDetailModal } from '@/components/modals/HotelDetailModal';
import { useWishlist } from '@/context/WishlistContext';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { useExperienceManagement } from '@/context/ExperienceManagementContext';
import { useHotelManagement } from '@/context/HotelManagementContext';
import { generateStandardPageConfig, JOURNEY_PAGE_TEMPLATE } from '@/lib/journeyPageTemplate';
import { useCart } from '@/context/CartContext';
import { Journey } from '@/types';
import { Heart, MapPin, Clock, Users } from 'lucide-react';
import JourneyMap from '@/components/map/JourneyMap';

// Journey Type slugs 映射（移到组件外部，避免每次渲染都创建新数组）
// 注意：这里用于路由识别和重定向，必须包含所有 journey type 的 slug
const JOURNEY_TYPE_SLUGS = ['explore-together', 'deep-discovery', 'signature-journeys', 'group-tours'] as const;

// 通用地理坐标知识库（Geo Dictionary）
// 支持中英文关键词匹配，可随时扩展新地点
const CITY_GEO_DB: Record<string, { lng: number; lat: number; name: string }> = {
  // 四川地区
  'jiuzhaigou': { lng: 103.92, lat: 33.26, name: 'Jiuzhaigou' },
  '九寨沟': { lng: 103.92, lat: 33.26, name: 'Jiuzhaigou' },
  'chengdu': { lng: 104.06, lat: 30.67, name: 'Chengdu' },
  '成都': { lng: 104.06, lat: 30.67, name: 'Chengdu' },
  'songpan': { lng: 103.59, lat: 32.65, name: 'Songpan' },
  '松潘': { lng: 103.59, lat: 32.65, name: 'Songpan' },
  'huanglong': { lng: 103.82, lat: 32.75, name: 'Huanglong' },
  '黄龙': { lng: 103.82, lat: 32.75, name: 'Huanglong' },
  'meishan': { lng: 103.85, lat: 30.05, name: 'Meishan' },
  '眉山': { lng: 103.85, lat: 30.05, name: 'Meishan' },
  
  // 内蒙古呼伦贝尔地区
  'hailar': { lng: 119.76, lat: 49.21, name: 'Hailar' },
  '海拉尔': { lng: 119.76, lat: 49.21, name: 'Hailar' },
  'genhe': { lng: 121.52, lat: 50.77, name: 'Genhe' },
  '根河': { lng: 121.52, lat: 50.77, name: 'Genhe' },
  'erguna': { lng: 120.18, lat: 50.24, name: 'Erguna' },
  '额尔古纳': { lng: 120.18, lat: 50.24, name: 'Erguna' },
  'manzhouli': { lng: 117.44, lat: 49.58, name: 'Manzhouli' },
  '满洲里': { lng: 117.44, lat: 49.58, name: 'Manzhouli' },
  'hulunbuir': { lng: 119.76, lat: 49.21, name: 'Hulunbuir' },
  '呼伦贝尔': { lng: 119.76, lat: 49.21, name: 'Hulunbuir' },
  'shiwei': { lng: 120.27, lat: 51.34, name: 'Shiwei' },
  '室韦': { lng: 120.27, lat: 51.34, name: 'Shiwei' },
  'heishantou': { lng: 119.29, lat: 50.21, name: 'Heishantou' },
  '黑山头': { lng: 119.29, lat: 50.21, name: 'Heishantou' },
  'arxan': { lng: 120.32, lat: 47.17, name: 'Arxan' },
  '阿尔山': { lng: 120.32, lat: 47.17, name: 'Arxan' },
  'arxan national forest park': { lng: 120.44, lat: 47.30, name: 'Arxan National Forest Park' },
  '阿尔山国家森林公园': { lng: 120.44, lat: 47.30, name: 'Arxan National Forest Park' },
  
  // 可以继续添加其他地区...
};

export default function DynamicJourneyPage() {
  const { toggleWishlist, items } = useWishlist();
  const { journeys, isLoading: journeysLoading } = useJourneyManagement();
  const { experiences } = useExperienceManagement();
  const { hotels } = useHotelManagement();
  const router = useRouter();
  const params = useParams();
  // catch-all 路由返回数组，需要合并
  const slugArray = params.slug as string[];
  const slug = Array.isArray(slugArray) ? slugArray.join('/') : (slugArray || '');
  
  // 检查是否是 journey type slug（在组件早期检查，避免执行后续逻辑）
  const isJourneyTypeSlug = slug && JOURNEY_TYPE_SLUGS.includes(slug as any);
  const isTypeRoute = slug && (slug.startsWith('type/') || slug === 'type');
  
  // 调试信息：检查 journey type slug 识别
  if (slug) {
    const directCheck = JOURNEY_TYPE_SLUGS.includes(slug as any);
    console.log('[DynamicJourneyPage] Slug check:', {
      slug,
      isJourneyTypeSlug,
      isTypeRoute,
      directCheck,
      JOURNEY_TYPE_SLUGS: Array.from(JOURNEY_TYPE_SLUGS),
      willRedirect: directCheck || isTypeRoute
    });
  }
  
  // 使用 useLayoutEffect 同步执行重定向（在 DOM 更新之前）
  // 这样可以确保在 useEffect 执行之前就完成重定向
  useLayoutEffect(() => {
    if (isTypeRoute) {
      // 提取 type 值并重定向
      const typeValue = slug.replace('type/', '');
      if (typeValue) {
        router.replace(`/journeys/type/${typeValue}`);
      }
    } else if (isJourneyTypeSlug) {
      // 如果是 journey type slug，立即重定向到 type 路由
      router.replace(`/journeys/type/${slug}`);
    }
  }, [slug, router, isTypeRoute, isJourneyTypeSlug]);
  
  // 如果路径是 type/* 或者是 journey type slug，不渲染任何内容，等待重定向
  if (isTypeRoute || isJourneyTypeSlug) {
    return null;
  }
  
  // 直接从API获取journey（如果context中没有）
  const [journeyFromApi, setJourneyFromApi] = useState<Journey | null>(null);
  const [isLoadingFromApi, setIsLoadingFromApi] = useState(false);

  // 已移除酒店详情弹窗状态

  // 根据slug查找对应的旅行卡片（优先从context，其次从API）
  const journey = useMemo(() => {
    const foundInContext = journeys.find(j => j.slug === slug);
    return foundInContext || journeyFromApi;
  }, [journeys, slug, journeyFromApi]);

  // 判断 journey 是 day tour 还是 multi-day journey
  const isDayTour = useMemo(() => {
    if (!journey) return false;
    const duration = journey.duration || '';
    // 检查是否包含 "1 Day" 或类似的一天游标识
    return /1\s*day/i.test(duration) || 
           journey.journeyType === 'Explore Together' ||
           (journey.itinerary && journey.itinerary.length === 1);
  }, [journey]);

  // 为 JourneyMap 准备 locations 数据
  const journeyLocations = useMemo(() => {
    if (!journey) return [];
    
    if (isDayTour) {
      // Day tour: 使用 city 或 location 作为单点
      const journeyData = journey as any;
      return [{
        id: journey.id,
        lng: journeyData.longitude || journeyData.data?.longitude || 104.0,
        lat: journeyData.latitude || journeyData.data?.latitude || 30.0
      }];
    } else {
      // Multi-day: 从 itinerary 中提取每个 day 的位置
      if (!journey.itinerary || journey.itinerary.length === 0) return [];
      
      return journey.itinerary.map((day, index) => {
        const dayData = day as any;
        return {
          id: `${journey.id}-day-${day.day}`,
          lng: dayData.longitude || dayData.data?.longitude || (104.0 + (index * 0.1)),
          lat: dayData.latitude || dayData.data?.latitude || (30.0 + (index * 0.1))
        };
      });
    }
  }, [journey, isDayTour]);

  // 为 multi-day journey 准备 dayLocations - 使用通用地理字典 + 行程区域感知兜底
  const dayLocations = useMemo(() => {
    if (!journey || isDayTour || !journey.itinerary) return undefined;
    
    // 【关键修复点】：获取行程的总中心点作为保底（行程区域感知）
    // 如果 journey 有 longitude/latitude，使用它；否则使用默认值（成都）
    const baseLng = (journey as any).longitude ? Number((journey as any).longitude) : 104.06;
    const baseLat = (journey as any).latitude ? Number((journey as any).latitude) : 30.67;
    
    // 调试：打印原始数据和行程中心点
    console.log('[page.tsx] Processing dayLocations with Geo Dictionary + Region-Aware Fallback', {
      itineraryLength: journey.itinerary.length,
      journeyCenter: { baseLng, baseLat },
      journeyCity: journey.city
    });
    
    return journey.itinerary.map((day, index) => {
      // 整合标题和描述进行模糊搜索
      const searchText = `${day.title || ''} ${day.description || ''}`.toLowerCase();
      
      // 优先级 1: 使用数据库中存储的坐标（如果存在）
      let finalLng: number | undefined = undefined;
      let finalLat: number | undefined = undefined;
      let finalCity: string | undefined = undefined;
      
      if ((day as any).longitude && (day as any).latitude) {
        finalLng = Number((day as any).longitude);
        finalLat = Number((day as any).latitude);
        finalCity = (day as any).city || day.title || `Day ${day.day}`;
        console.log(`[page.tsx] Day ${day.day}: Using database coordinates`, { finalCity, finalLng, finalLat });
      }
      
      // 优先级 2: 从地理字典中匹配（模糊搜索）
      if (!finalLng || !finalLat) {
        // 在搜索文本中查找匹配的城市关键词
        const matchedEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
          const lowerKey = key.toLowerCase();
          return searchText.includes(lowerKey) || 
                 ((day as any).city && (day as any).city.toLowerCase().includes(lowerKey)) ||
                 ((day as any).location && (day as any).location.toLowerCase().includes(lowerKey));
        });
        
        if (matchedEntry) {
          const [, geoData] = matchedEntry;
          finalLng = geoData.lng;
          finalLat = geoData.lat;
          finalCity = geoData.name;
          console.log(`[page.tsx] Day ${day.day}: Matched from Geo Dictionary:`, { key: matchedEntry[0], finalCity, finalLng, finalLat });
        }
      }
      
      // 优先级 3: 使用行程总中心点（行程区域感知兜底）
      // 【关键修复点】：优先参考整个行程的中心点，而不是死守固定坐标
      if (!finalLng || !finalLat) {
        finalLng = baseLng;
        finalLat = baseLat;
        // 从标题中提取城市名称（处理 "Day X — 城市名" 格式）
        const titleParts = day.title?.split('—') || day.title?.split('-') || [];
        finalCity = titleParts[0]?.trim() || day.title || `Day ${day.day}`;
        console.log(`[page.tsx] Day ${day.day}: Using journey center point (region-aware fallback)`, { 
          finalCity, 
          finalLng, 
          finalLat,
          source: 'journey center'
        });
      }
      
      // 优先级 4: 绝对默认值（仅在以上都失败时使用）
      if (!finalLng || !finalLat || isNaN(finalLng) || isNaN(finalLat)) {
        finalLng = 104.06; // 成都
        finalLat = 30.67;
        finalCity = day.title || `Day ${day.day}`;
        console.warn(`[page.tsx] Day ${day.day}: Using absolute default coordinates`, { finalCity, finalLng, finalLat });
      }
      
      // 最终坐标验证
      if (finalLng < -180 || finalLng > 180 || finalLat < -90 || finalLat > 90) {
        console.warn(`[page.tsx] Day ${day.day}: Coordinates out of range, using journey center`, { finalLng, finalLat });
        finalLng = baseLng;
        finalLat = baseLat;
      }

      return {
        day: day.day,
        title: day.title,
        locations: [{
          id: `${journey.id}-day-${day.day}-step-0`,
          lng: finalLng,
          lat: finalLat,
          name: finalCity,
          city: finalCity,
          day: day.day
        }]
      };
    });
  }, [journey, isDayTour]);

  // Intersection Observer: 监听当前在视口中央的 Day
  const [activeDay, setActiveDay] = useState<number | undefined>(undefined);
  const [currentDay, setCurrentDay] = useState<number | undefined>(undefined);
  const dayRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  
  // Navigation Scroll-Spy: 监听当前激活的导航项
  const [activeNav, setActiveNav] = useState<string>('overview');
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  
  // 如果context中找不到，尝试从API获取
  useEffect(() => {
    // 如果是 journey type slug，立即返回，不执行任何 API 调用
    // 使用更严格的检查，确保不会误判
    if (!slug) {
      console.log('[DynamicJourneyPage] No slug, skipping API call');
      return;
    }
    
    // 直接检查 slug 是否在 JOURNEY_TYPE_SLUGS 中（不依赖变量）
    const isTypeSlug = JOURNEY_TYPE_SLUGS.includes(slug as any);
    if (isTypeSlug) {
      console.log('[DynamicJourneyPage] Journey type slug detected, skipping API call:', slug, {
        slug,
        isTypeSlug,
        JOURNEY_TYPE_SLUGS: Array.from(JOURNEY_TYPE_SLUGS)
      });
      return; // 立即返回，不执行后续任何代码
    }
    
    console.log('[DynamicJourneyPage] Proceeding with API call for slug:', slug, {
      slug,
      isTypeSlug,
      JOURNEY_TYPE_SLUGS: Array.from(JOURNEY_TYPE_SLUGS)
    });
    
    const fetchJourneyBySlug = async () => {
      // 验证 slug 是否有效
      if (!slug || slug.trim() === '') {
        return;
      }
      
      // 再次检查是否是 journey type slug（双重保险，直接检查常量）
      if (JOURNEY_TYPE_SLUGS.includes(slug as any)) {
        console.log('[DynamicJourneyPage] Aborting API call - journey type slug detected:', slug);
        return;
      }
      
      // 如果还在加载context数据，等待一下
      if (journeysLoading) return;
      
      // 如果已经在context中找到，不需要API查询
      const foundInContext = journeys.find(j => j.slug === slug);
      if (foundInContext) return;
      
      // 最后一次检查是否是 journey type slug（三重保险）
      if (JOURNEY_TYPE_SLUGS.includes(slug as any)) {
        console.log('[DynamicJourneyPage] Final check - journey type slug, aborting:', slug);
        return;
      }
      
      // 如果已经查询过且结果为null，不需要重复查询
      // 添加 slug 验证，避免无效请求
      if (journeyFromApi === null && !isLoadingFromApi && journeys.length > 0 && slug && slug.length > 1) {
        // 最后一次检查（四重保险）
        if (JOURNEY_TYPE_SLUGS.includes(slug as any)) {
          console.log('[DynamicJourneyPage] Pre-fetch check - journey type slug, aborting:', slug);
          return;
        }
        
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

  // 生成标准化的页面配置（必须在 Intersection Observer 之前定义）
  const pageConfig = useMemo(() => {
    if (!journey) return null;
    
    // 直接使用 journey 的页面内容，而不是模板生成
    return {
      // Hero区域 - 使用后台设置的内容
      hero: {
        // 优先使用后台 main image（image 字段），没有时再回退到 heroImage
        image: journey.image || journey.heroImage,
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
        highlights: journey.overview?.highlights || [],
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

      // 包含和排除项目
      included: journey.included || [],
      excluded: journey.excluded || [],

      // 相关推荐
      relatedTrips: journey.relatedTrips || []
    };
  }, [journey]);

  // Intersection Observer: 监听导航栏对应的各个 section（Scroll-Spy）
  useEffect(() => {
    if (!pageConfig || !pageConfig.navigation) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            if (sectionId) {
              setActiveNav(sectionId);
              console.log(`[Navigation] Active section changed to: ${sectionId}`);
            }
          }
        });
      },
      { 
        threshold: 0.3, // 当 section 的 30% 进入视口时触发
        rootMargin: "-100px 0px -50% 0px" // 考虑导航栏高度，优先显示在视口上方的 section
      }
    );

    // 观察所有导航对应的 section
    pageConfig.navigation.forEach((navItem) => {
      const sectionId = navItem.href.replace('#', '');
      const sectionElement = document.getElementById(sectionId);
      if (sectionElement) {
        sectionRefs.current.set(sectionId, sectionElement);
        observer.observe(sectionElement);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [pageConfig]);

  // Intersection Observer: 监听右侧所有的行程卡片
  useEffect(() => {
    if (!pageConfig || !pageConfig.itinerary || pageConfig.itinerary.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当卡片进入视口中间位置时触发
          if (entry.isIntersecting) {
            const day = parseInt(entry.target.getAttribute('data-day') || '1');
            setCurrentDay(day);
            setActiveDay(day);
            console.log(`[Itinerary] Current day changed to: ${day}`);
          }
        });
      },
      { 
        threshold: 0.6, 
        rootMargin: "-20% 0px -20% 0px" // 当元素在视口中央 60% 区域时触发
      }
    );

    // 观察所有带有 data-day 属性的卡片
    const cards = document.querySelectorAll('[data-day]');
    cards.forEach((card) => {
      observer.observe(card);
    });

    return () => {
      observer.disconnect();
    };
  }, [pageConfig]);
  
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

      {/* Navigation - A&K 风格精致导航栏 */}
      <nav className="bg-tertiary py-4 sticky top-0 z-50 backdrop-blur-sm bg-tertiary/95">
        <Container size="xl">
          <div className="flex justify-center gap-12">
            {pageConfig.navigation.map((item) => {
              // 从 href 中提取 section ID（例如 #overview -> overview）
              const sectionId = item.href.replace('#', '');
              const isActive = activeNav === sectionId;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    relative pb-2 text-white hover:text-accent transition-colors 
                    font-medium tracking-widest uppercase text-sm
                    ${isActive ? 'text-white' : 'text-white/80'}
                  `}
                  onClick={(e) => {
                    e.preventDefault();
                    const targetId = item.href.replace('#', '');
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                      const offsetTop = targetElement.offsetTop - 80; // 考虑导航栏高度
                      window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                      });
                      setActiveNav(targetId);
                    }
                  }}
                >
                  {item.name}
                  {/* 下方横线动画指示器 - 从中间向两边展开 */}
                  <span
                    className={`
                      absolute bottom-0 left-1/2 w-full h-0.5 bg-white
                      transition-transform duration-300 ease-out origin-center
                    `}
                    style={{
                      transform: isActive 
                        ? 'translateX(-50%) scaleX(1)' 
                        : 'translateX(-50%) scaleX(0)'
                    }}
                  />
                </Link>
              );
            })}
          </div>
        </Container>
      </nav>

      {/* Journey Overview */}
      <section id="overview" className="w-full bg-[#FAF9F6] overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-10 py-24 flex flex-col lg:flex-row items-stretch gap-20">
          {/* 左侧内容 - 垂直居中对齐，确保文字少时留白均匀分布 */}
          <div className="lg:w-[58%] flex flex-col justify-center space-y-16 min-h-0">
            {/* 标题和描述 */}
            <div className="space-y-8">
              <h2 className="text-5xl font-serif text-gray-900 leading-[1.15]">
                {pageConfig.overview.description}
              </h2>
              {journey.shortDescription && (
                <p className="text-xl text-gray-600 font-light leading-relaxed">
                  {journey.shortDescription}
                </p>
              )}
            </div>

            {/* 特色亮点 - 网格布局，带分隔线 */}
            {(() => {
              const highlights = pageConfig.overview?.highlights || [];
              
              if (highlights.length === 0) {
                return (
                  <div className="text-gray-500 text-sm pt-12 border-t border-gray-200">
                    No highlights available. Please add highlights in the admin panel.
                  </div>
                );
              }
              
              // 图标映射（可以根据需要扩展）
              const iconMap: Record<number, string> = {
                0: '✨',
                1: '🚂',
                2: '🏔️',
                3: '🌸',
                4: '🏛️',
                5: '🍜',
                6: '🎭',
                7: '🌿',
              };
              
              return (
                <div className="grid grid-cols-2 gap-x-12 gap-y-10 pt-12 border-t border-gray-200">
                  {highlights.map((highlight, index) => {
                    // 优先使用title作为标题，description作为描述
                    const title = highlight.title || `Highlight ${index + 1}`;
                    const description = highlight.description || '';
                    const icon = iconMap[index] || '✨';
                    
                    return (
                      <div key={index} className="space-y-2">
                        <h4 className="font-medium text-gray-900">
                          {icon} {title}
                        </h4>
                        {description && (
                          <p className="text-sm text-gray-500 leading-normal">
                            {description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* 右侧图片 - 最小高度 + 最大高度限制 + 动态高度适配 */}
          <div className="lg:w-[42%] relative flex items-center">
            <div className="w-full h-full min-h-[400px] max-h-[70vh] relative group">
              <img 
                src={pageConfig.overview.sideImage} 
                alt={journey.title || 'Journey image'}
                className="w-full h-full object-cover shadow-2xl transition-transform duration-1000 group-hover:scale-105"
              />
              {/* 遮罩层 */}
              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Itinerary - A&K 风格双栏布局：左侧 Mapbox 地图 + 右侧白色卡片行程 */}
      <section 
        id="itinerary" 
        className="w-full bg-[#1e3b32] min-h-screen flex flex-col lg:flex-row items-stretch"
      >
        {/* 左侧：地图容器 (45%) - A&K 视觉对齐：lg:sticky lg:top-0 h-screen */}
        <div className="w-full lg:w-[45%] lg:sticky lg:top-0 h-[500px] lg:h-screen">
          {journey && journeyLocations.length > 0 ? (
            <JourneyMap
              mode={isDayTour ? 'single-location' : 'multi-stop-route'}
              locations={journeyLocations}
              radius={5000}
              dayLocations={dayLocations}
              currentDay={currentDay}
              activeDay={activeDay}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500">Loading map...</p>
            </div>
          )}
        </div>

        {/* 右侧：行程详情 (55%) */}
        <div className="w-full lg:w-[55%] py-12 px-6 lg:px-16 overflow-y-auto">
          <h2 className="text-white text-3xl font-serif mb-12">Daily Itinerary</h2>
          
          {pageConfig && pageConfig.itinerary && pageConfig.itinerary.map((day, index) => {
            const cityName = (day as any).city || 
                             (day as any).location || 
                             (journey?.city) || 
                             null;
            
            return (
              <div 
                key={index} 
                ref={(el) => {
                  if (el) {
                    dayRefs.current.set(day.day, el);
                  } else {
                    dayRefs.current.delete(day.day);
                  }
                }}
                data-day={day.day}
                className="itinerary-card bg-white text-gray-900 rounded-2xl p-8 mb-10 shadow-2xl transition-all hover:shadow-none flex flex-col md:flex-row gap-6 items-start"
              >
                {/* 左侧文字内容 */}
                <div className="flex-1">
                  {/* Day 标签 */}
                  <span className="text-[#1e3b32] font-bold text-sm tracking-widest uppercase">
                    Day {day.day}
                  </span>
                  
                  {/* 城市标签 - 橙棕色 Badge（如果有） */}
                  {cityName && (
                    <div className="mt-2 mb-2">
                      <span 
                        className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                        style={{ 
                          backgroundColor: '#d4a574',
                          color: '#ffffff'
                        }}
                      >
                        {cityName}
                      </span>
                    </div>
                  )}

                  {/* 标题 */}
                  <h3 className="text-2xl font-serif text-gray-900 mt-2 mb-4">{day.title}</h3>
                  
                  {/* 描述 */}
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {day.description}
                  </p>
                  
                  {/* 活动列表（如果有） */}
                  {(day as any).activities && Array.isArray((day as any).activities) && (day as any).activities.length > 0 && (
                    <div className="mt-6 space-y-2">
                      {(day as any).activities.map((activity: string, actIndex: number) => (
                        <div key={actIndex} className="flex items-start gap-2">
                          <span className="text-[#1e3b32] mt-1">•</span>
                          <p className="text-gray-700 text-sm">{activity}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 餐食信息（如果有） */}
                  {(day as any).meals && Array.isArray((day as any).meals) && (day as any).meals.length > 0 && (
                    <div className="mt-4">
                      <p className="text-gray-600 text-sm italic">
                        Meals: {(day as any).meals.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* 右侧图片 - 行程小图 w-32 h-32 */}
                {day.image && (
                  <img 
                    src={day.image} 
                    alt={day.title || 'Itinerary image'} 
                    className="w-32 h-32 rounded-lg object-cover flex-shrink-0" 
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

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

      {/* Includes & Select Your Date Section - A&K 风格 */}
      <section id="details" className="w-full bg-[#F9F7F2] py-20">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex flex-col lg:flex-row gap-16 items-stretch">
            {/* 左侧：Includes (40%) */}
            <div className="lg:w-[40%] flex flex-col justify-center">
              <h3 className="text-2xl font-serif text-gray-900 mb-8">Includes</h3>
              
              {/* 标准化清单 - 网格布局 */}
              {(() => {
                // 图标映射库（匹配预设服务）
                const iconMap: Record<string, string> = {
                  'English-Speaking Resident Tour Director® and Local Guides': '👤',
                  'Airport Meet and Greet with Private Transfers': '🚗',
                  'Travelling Bell Boy® Luggage Handling': '🧳',
                  'Traveller\'s Valet® Laundry Service': '🔑',
                  'Internet Access': '📶',
                  'Entrance Fees, Taxes and All Gratuities Except Resident Tour Director': '🎫',
                  '24/7 A&K On-Call Support': '🎧',
                  'Accommodation': '🏨',
                  'Meals': '🍽️',
                  'Domestic Flights': '✈️',
                  'Travel Insurance': '🛡️',
                  'Visa Support': '📋',
                  'Local Guide': '🗺️',
                  'Airport Transfers': '🚕',
                  'Breakfast': '🥐',
                  'Lunch': '🍱',
                  'Dinner': '🍽️',
                  'Hotel': '🏨',
                  'Transportation': '🚌',
                };
                
                // 优先使用 journey.included 数组，如果没有则从 journey.includes 文本解析
                const includedItems = journey.included && journey.included.length > 0
                  ? journey.included
                  : journey.includes
                    ? journey.includes.split('\n').filter(line => line.trim())
                    : [];
                
                if (includedItems.length === 0) {
                  return (
                    <div className="text-gray-500 text-sm">
                      No inclusion details available for this journey.
                    </div>
                  );
                }
                
                return (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    {includedItems.map((item: string, index: number) => {
                      const itemKey = item.trim();
                      const icon = iconMap[itemKey] || '✓';
                      
                      return (
                        <div key={index} className="flex items-start gap-3">
                          <span className="text-gray-600 text-sm mt-0.5 flex-shrink-0">{icon}</span>
                          <p className="text-sm text-gray-700 leading-relaxed">{itemKey}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              
              {/* Excludes - 折叠式，弱化显示 */}
              {journey.excludes && (
                <details className="mt-8 pt-8 border-t border-gray-200">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
                    What&apos;s not included
                  </summary>
                  <div className="mt-4 space-y-2">
                    {journey.excludes.split('\n').filter(line => line.trim()).map((line, index) => (
                      <p key={index} className="text-sm text-gray-500">{line.trim()}</p>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* 右侧：Select Your Date (60%) */}
            <div className="lg:w-[60%]">
              <h3 className="text-2xl font-serif text-gray-900 mb-8">Select Your Date</h3>
              
              {/* 年份切换 */}
              <div className="flex gap-4 mb-6">
                {[2025, 2026].map((year) => (
                  <button
                    key={year}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      baseDate.getFullYear() === year
                        ? 'text-gray-900 border-b-2 border-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => {
                      const currentMonth = baseDate.getMonth();
                      const newDate = new Date(year, currentMonth, 1);
                      const today = new Date();
                      const monthsDiff = (newDate.getFullYear() - today.getFullYear()) * 12 + (newDate.getMonth() - today.getMonth());
                      setMonthOffset(Math.max(0, Math.min(11, monthsDiff)));
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
              
              {/* 日期列表 */}
              <div className="space-y-4">
                {(() => {
                  // 生成未来一年的日期列表（示例数据，实际应从 API 获取）
                  const dateList: Array<{
                    startDate: Date;
                    endDate: Date;
                    price: number;
                    originalPrice?: number;
                    status: 'Available' | 'Limited' | 'Call';
                  }> = [];
                  
                  // 生成示例日期（每月第一个可用日期）
                  const today = new Date();
                  for (let i = 0; i < 12; i++) {
                    const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
                    if (monthDate < today) continue;
                    
                    const startDate = new Date(monthDate);
                    const days = parseInt(journey.duration?.split(' ')[0] || '9');
                    const endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + days - 1);
                    
                    dateList.push({
                      startDate,
                      endDate,
                      price: journey.price,
                      originalPrice: journey.originalPrice,
                      status: i < 3 ? 'Available' : i < 6 ? 'Limited' : 'Call'
                    });
                  }
                  
                  // 过滤当前年份
                  const filteredDates = dateList.filter(item => 
                    item.startDate.getFullYear() === baseDate.getFullYear()
                  );
                  
                  return filteredDates.map((item, index) => {
                    const startStr = item.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const endStr = item.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const dateRange = `${startStr} - ${endStr}`;
                    
                    return (
                      <div
                        key={index}
                        className="bg-white p-6 rounded-sm shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-6"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="text-gray-900 font-medium">{dateRange}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              item.status === 'Available' 
                                ? 'bg-green-100 text-green-700'
                                : item.status === 'Limited'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {item.status === 'Call' ? 'Call for Availability' : `${item.status} Availability`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-serif text-gray-900">
                              ${item.price.toLocaleString()}
                            </span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="text-sm text-gray-500 line-through">
                                ${item.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setConfirmedDate(item.startDate);
                            // 延迟执行以确保状态更新
                            setTimeout(() => {
                              handleDirectBooking();
                            }, 100);
                          }}
                          className="px-6 py-2 bg-black text-white text-xs tracking-widest uppercase hover:bg-gray-800 transition-colors whitespace-nowrap"
                        >
                          Book Now
                        </button>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>

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
