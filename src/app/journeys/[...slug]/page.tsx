'use client';

import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Container, Section, Heading, Text, Button, Card, Breadcrumb } from '@/components/common';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { AccommodationCard } from '@/components/cards/AccommodationCard';
// import { HotelDetailModal } from '@/components/modals/HotelDetailModal';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { useExperienceManagement } from '@/context/ExperienceManagementContext';
import { useHotelManagement } from '@/context/HotelManagementContext';
import { generateStandardPageConfig, JOURNEY_PAGE_TEMPLATE } from '@/lib/journeyPageTemplate';
import { useCart } from '@/context/CartContext';
import { Journey } from '@/types';
import { MapPin, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import JourneyMap from '@/components/map/JourneyMap';
import StandardInclusions from '@/components/journey/StandardInclusions';
import OfferCard from '@/components/journey/OfferCard';
import OfferIcon from '@/components/journey/OfferIcon';
import InclusionsAndOffers from '@/components/journey/InclusionsAndOffers';

// Details Accordion 组件 - 用于可折叠的技术细节
function DetailsAccordion({ meals, accommodation, transportation }: { meals?: string[]; accommodation?: string; transportation?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasDetails = (meals && meals.length > 0) || accommodation || transportation;
  
  if (!hasDetails) return null;
  
  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <span className="font-medium">Details</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {isOpen && (
        <div className="mt-3 space-y-2 text-xs text-gray-500">
          {meals && meals.length > 0 && (
            <div>
              <span className="font-medium text-gray-600">Meals: </span>
              {meals.join(', ')}
            </div>
          )}
          {accommodation && (
            <div>
              <span className="font-medium text-gray-600">Accommodation: </span>
              {accommodation}
            </div>
          )}
          {transportation && (
            <div>
              <span className="font-medium text-gray-600">Transportation: </span>
              {transportation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
  
  // 北京地区
  'beijing': { lng: 116.4074, lat: 39.9042, name: 'Beijing' },
  '北京': { lng: 116.4074, lat: 39.9042, name: 'Beijing' },
  'peking': { lng: 116.4074, lat: 39.9042, name: 'Beijing' },
  'forbidden city': { lng: 116.3972, lat: 39.9163, name: 'Forbidden City' },
  '故宫': { lng: 116.3972, lat: 39.9163, name: 'Forbidden City' },
  'tiananmen': { lng: 116.3974, lat: 39.9037, name: 'Tiananmen Square' },
  '天安门': { lng: 116.3974, lat: 39.9037, name: 'Tiananmen Square' },
  'temple of heaven': { lng: 116.4075, lat: 39.8823, name: 'Temple of Heaven' },
  '天坛': { lng: 116.4075, lat: 39.8823, name: 'Temple of Heaven' },
  'summer palace': { lng: 116.2734, lat: 39.9990, name: 'Summer Palace' },
  '颐和园': { lng: 116.2734, lat: 39.9990, name: 'Summer Palace' },
  'great wall': { lng: 116.5704, lat: 40.4319, name: 'Great Wall' },
  '长城': { lng: 116.5704, lat: 40.4319, name: 'Great Wall' },
  'badaling': { lng: 116.0147, lat: 40.3592, name: 'Badaling' },
  '八达岭': { lng: 116.0147, lat: 40.3592, name: 'Badaling' },
  'mutianyu': { lng: 116.5704, lat: 40.4319, name: 'Mutianyu' },
  '慕田峪': { lng: 116.5704, lat: 40.4319, name: 'Mutianyu' },
  'beihai park': { lng: 116.3883, lat: 39.9254, name: 'Beihai Park' },
  '北海公园': { lng: 116.3883, lat: 39.9254, name: 'Beihai Park' },
  'hutong': { lng: 116.3974, lat: 39.9042, name: 'Hutong' },
  '胡同': { lng: 116.3974, lat: 39.9042, name: 'Hutong' },
  
  // 山西地区
  'shanxi': { lng: 112.5624, lat: 37.8739, name: 'Shanxi' },
  '山西': { lng: 112.5624, lat: 37.8739, name: 'Shanxi' },
  'taiyuan': { lng: 112.5492, lat: 37.8570, name: 'Taiyuan' },
  '太原': { lng: 112.5492, lat: 37.8570, name: 'Taiyuan' },
  'datong': { lng: 113.2953, lat: 40.0903, name: 'Datong' },
  '大同': { lng: 113.2953, lat: 40.0903, name: 'Datong' },
  'yungang grottoes': { lng: 113.2953, lat: 40.0903, name: 'Yungang Grottoes' },
  '云冈石窟': { lng: 113.2953, lat: 40.0903, name: 'Yungang Grottoes' },
  'pingyao': { lng: 112.1781, lat: 37.1988, name: 'Pingyao' },
  '平遥': { lng: 112.1781, lat: 37.1988, name: 'Pingyao' },
  'pingyao ancient city': { lng: 112.1781, lat: 37.1988, name: 'Pingyao Ancient City' },
  '平遥古城': { lng: 112.1781, lat: 37.1988, name: 'Pingyao Ancient City' },
  'wutai mountain': { lng: 113.5901, lat: 38.9944, name: 'Wutai Mountain' },
  '五台山': { lng: 113.5901, lat: 38.9944, name: 'Wutai Mountain' },
  'wutai': { lng: 113.5901, lat: 38.9944, name: 'Wutai Mountain' },
  'hanging temple': { lng: 113.5901, lat: 39.6167, name: 'Hanging Temple' },
  '悬空寺': { lng: 113.5901, lat: 39.6167, name: 'Hanging Temple' },
  'xuan kong si': { lng: 113.5901, lat: 39.6167, name: 'Hanging Temple' },
  'jinci temple': { lng: 112.5492, lat: 37.8570, name: 'Jinci Temple' },
  '晋祠': { lng: 112.5492, lat: 37.8570, name: 'Jinci Temple' },
  'qiao family compound': { lng: 112.1781, lat: 37.1988, name: 'Qiao Family Compound' },
  '乔家大院': { lng: 112.1781, lat: 37.1988, name: 'Qiao Family Compound' },
  'wang family compound': { lng: 111.7521, lat: 36.6908, name: 'Wang Family Compound' },
  '王家大院': { lng: 111.7521, lat: 36.6908, name: 'Wang Family Compound' },
  'yanmen pass': { lng: 112.5624, lat: 39.0167, name: 'Yanmen Pass' },
  '雁门关': { lng: 112.5624, lat: 39.0167, name: 'Yanmen Pass' },
  'changzhi': { lng: 113.1136, lat: 36.1911, name: 'Changzhi' },
  '长治': { lng: 113.1136, lat: 36.1911, name: 'Changzhi' },
  'jincheng': { lng: 112.8513, lat: 35.4976, name: 'Jincheng' },
  '晋城': { lng: 112.8513, lat: 35.4976, name: 'Jincheng' },
  'yangquan': { lng: 113.5833, lat: 37.8612, name: 'Yangquan' },
  '阳泉': { lng: 113.5833, lat: 37.8612, name: 'Yangquan' },
  'xi county': { lng: 110.93, lat: 36.69, name: 'Xi County' },
  '隰县': { lng: 110.93, lat: 36.69, name: 'Xi County' },
  'xi xian': { lng: 110.93, lat: 36.69, name: 'Xi County' },
  'xixian': { lng: 110.93, lat: 36.69, name: 'Xi County' },
  'xian': { lng: 108.9398, lat: 34.3416, name: 'Xi\'an' },
  'xi\'an': { lng: 108.9398, lat: 34.3416, name: 'Xi\'an' },
  '西安': { lng: 108.9398, lat: 34.3416, name: 'Xi\'an' },
  'xian city': { lng: 108.9398, lat: 34.3416, name: 'Xi\'an' },
  'terracotta warriors': { lng: 109.2778, lat: 34.3853, name: 'Terracotta Warriors' },
  '兵马俑': { lng: 109.2778, lat: 34.3853, name: 'Terracotta Warriors' },
  
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
    // 如果 journey 有 longitude/latitude，使用它；否则根据城市判断
    // 对于北京-山西行程，使用北京和山西之间的中点作为默认值
    let baseLng = 116.4074; // 北京经度
    let baseLat = 39.9042; // 北京纬度
    
    // 如果 journey 有明确的坐标，使用它
    if ((journey as any).longitude && (journey as any).latitude) {
      baseLng = Number((journey as any).longitude);
      baseLat = Number((journey as any).latitude);
    } else {
      // 根据城市或标题判断区域
      const journeyCity = (journey.city || journey.title || '').toLowerCase();
      if (journeyCity.includes('beijing') || journeyCity.includes('北京')) {
        baseLng = 116.4074;
        baseLat = 39.9042;
      } else if (journeyCity.includes('shanxi') || journeyCity.includes('山西')) {
        baseLng = 112.5624;
        baseLat = 37.8739;
      } else if (journeyCity.includes('chengdu') || journeyCity.includes('成都')) {
        baseLng = 104.06;
        baseLat = 30.67;
      }
    }
    
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
        // 如果仍然无法匹配，尝试从标题中提取更多信息
        const titleLower = day.title?.toLowerCase() || '';
        const descLower = day.description?.toLowerCase() || '';
        const combinedText = `${titleLower} ${descLower}`;
        
        // 再次尝试匹配（可能标题格式不同）
        const retryMatch = Object.entries(CITY_GEO_DB).find(([key]) => {
          const lowerKey = key.toLowerCase();
          return combinedText.includes(lowerKey);
        });
        
        if (retryMatch) {
          const [, geoData] = retryMatch;
          finalLng = geoData.lng;
          finalLat = geoData.lat;
          finalCity = geoData.name;
          console.log(`[page.tsx] Day ${day.day}: Retry match from Geo Dictionary:`, { key: retryMatch[0], finalCity, finalLng, finalLat });
        } else {
          // 如果仍然无法匹配，使用行程中心点，但确保 finalCity 有值
          finalLng = baseLng;
          finalLat = baseLat;
          // 从标题中提取城市名称（处理 "Day X — 城市名" 格式）
          const titleParts = day.title?.split('—') || day.title?.split('-') || day.title?.split(' ') || [];
          // 尝试从标题中提取最后一个部分作为城市名
          finalCity = titleParts[titleParts.length - 1]?.trim() || day.title || `Day ${day.day}`;
          console.log(`[page.tsx] Day ${day.day}: Using journey center point (region-aware fallback)`, { 
            finalCity, 
            finalLng, 
            finalLat,
            source: 'journey center',
            title: day.title
          });
        }
      }
      
      // 优先级 4: 绝对默认值（仅在以上都失败时使用）
      if (!finalLng || !finalLat || isNaN(finalLng) || isNaN(finalLat)) {
        finalLng = baseLng; // 使用行程中心点，而不是固定的成都
        finalLat = baseLat;
        finalCity = day.title || `Day ${day.day}`;
        console.warn(`[page.tsx] Day ${day.day}: Using journey center as absolute default`, { finalCity, finalLng, finalLat });
      }
      
      // 最终坐标验证
      if (finalLng < -180 || finalLng > 180 || finalLat < -90 || finalLat > 90) {
        console.warn(`[page.tsx] Day ${day.day}: Coordinates out of range, using journey center`, { finalLng, finalLat });
        finalLng = baseLng;
        finalLat = baseLat;
      }

      // 确保 finalCity 有值，如果没有则从标题中提取
      if (!finalCity || finalCity.trim() === '') {
        // 尝试从标题中提取城市名
        const titleParts = day.title?.split('—') || day.title?.split('-') || day.title?.split(' ') || [];
        finalCity = titleParts[titleParts.length - 1]?.trim() || day.title || `Day ${day.day}`;
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
          label: finalCity, // 确保 label 字段也有值，用于 Marker 显示
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
        sideImage: journey.overview?.sideImage || journey.images?.[1] || journey.image,
        routeGeojson: journey.overview?.routeGeojson, // 从后台获取 GeoJSON 路径
        mapInitialBounds: journey.overview?.mapInitialBounds // 从后台获取地图初始边界
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

      // 标准化 Inclusions 和 Offers
      standardInclusions: journey.standardInclusions,
      offers: journey.offers || [],

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
      {/* Hero Banner - 底部对齐布局 */}
      <section className={`relative ${JOURNEY_PAGE_TEMPLATE.hero.height} overflow-hidden`}>
        {/* 背景图片 */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: `url('${pageConfig.hero.image}')` }}
        />
        
        {/* 底部渐变遮罩 - 从透明到深绿色，增强文字可读性 */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-[#1e3b32]/90 via-[#1e3b32]/40 to-transparent z-0"
        />
        
        {/* 内容容器 - 底部对齐 */}
        <div className="relative z-10 flex items-end h-full pb-16 px-8 lg:px-16">
          <div className="w-full flex flex-col lg:flex-row justify-between items-end gap-8">
            {/* 左侧：标题区域 - 左下角 */}
            <div className="flex-1 max-w-2xl prose-force-wrap">
              <Heading 
                level={1} 
                className="text-4xl lg:text-5xl xl:text-6xl mb-4 tracking-tight leading-[1.1]"
                style={{ 
                  fontFamily: 'Playfair Display, serif',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.1',
                  color: '#ffffff'
                }}
              >
                {pageConfig.hero.title}
              </Heading>
            </div>
            
            {/* 右侧：核心参数 - 右下角，用细线分割 */}
            {/* 桌面端：垂直排列，移动端：水平居中分布 */}
            <div className="flex flex-row lg:flex-row items-center lg:items-end justify-center lg:justify-end gap-6 lg:gap-8">
              {/* 天数 */}
              <div className="flex flex-col items-center lg:items-end">
                <div 
                  className="text-4xl lg:text-5xl font-light text-white mb-1"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {pageConfig.hero.stats.days}
                </div>
                <div className="text-xs uppercase tracking-widest text-white/80 font-light">
                  DAYS
                </div>
              </div>
              
              {/* 分割线 - 移动端隐藏，桌面端显示 */}
              <div className="hidden lg:block h-16 w-px bg-white/30" />
              
              {/* 目的地数量 */}
              <div className="flex flex-col items-center lg:items-end">
                <div 
                  className="text-4xl lg:text-5xl font-light text-white mb-1"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {pageConfig.hero.stats.destinations}
                </div>
                <div className="text-xs uppercase tracking-widest text-white/80 font-light">
                  DESTINATIONS
                </div>
              </div>
              
              {/* 分割线 - 移动端隐藏，桌面端显示 */}
              <div className="hidden lg:block h-16 w-px bg-white/30" />
              
              {/* 最大客人 */}
              <div className="flex flex-col items-center lg:items-end">
                <div 
                  className="text-4xl lg:text-5xl font-light text-white mb-1"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {pageConfig.hero.stats.maxGuests}
                </div>
                <div className="text-xs uppercase tracking-widest text-white/80 font-light">
                  GUESTS MAX
                </div>
              </div>
            </div>
          </div>
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
        <div className="max-w-[1440px] mx-auto px-10 py-24 flex flex-col lg:flex-row items-start justify-between gap-12">
          {/* 左侧内容 - 文字区域，设置最大宽度避免行太长 */}
          <div className="lg:w-[60%] flex flex-col w-full max-w-2xl">
            {/* 标题和描述 */}
            <div className="space-y-8 prose-force-wrap">
              <h2 
                className="text-2xl lg:text-3xl text-gray-900 leading-relaxed"
                style={{ 
                  fontFamily: 'Playfair Display, serif',
                  fontWeight: 400,
                  lineHeight: '1.6'
                }}
              >
                {pageConfig.overview.description}
              </h2>
              {journey.shortDescription && (
                <p 
                  className="text-xl text-gray-600 font-light leading-relaxed prose-force-wrap"
                  style={{ lineHeight: '1.6' }}
                >
                  {journey.shortDescription}
                </p>
              )}
            </div>

            {/* 特色亮点 - 两列 Grid 布局，统一使用十字星图标 */}
            {(() => {
              const highlights = pageConfig.overview?.highlights || [];
              
              if (highlights.length === 0) {
                return (
                  <div className="text-gray-500 text-sm mt-16">
                    No highlights available. Please add highlights in the admin panel.
                  </div>
                );
              }
              
              // 十字星图标 SVG - 1px 细线
              const StarIcon = () => (
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline-block mr-2"
                >
                  <path 
                    d="M8 0L9.5 5.5L15 7L9.5 8.5L8 14L6.5 8.5L1 7L6.5 5.5L8 0Z" 
                    stroke="currentColor" 
                    strokeWidth="1" 
                    fill="none"
                    className="text-gray-900"
                  />
                </svg>
              );
              
              return (
                <div className="grid grid-cols-2 gap-x-12 gap-y-10 mt-16">
                  {highlights.map((highlight, index) => {
                    // 优先使用title作为标题，description作为描述
                    const title = highlight.title || `Highlight ${index + 1}`;
                    const description = highlight.description || '';
                    
                    return (
                      <div key={index} className="space-y-2">
                        <h4 
                          className="text-xs tracking-widest font-bold text-gray-900 flex items-center uppercase prose-force-wrap"
                          style={{ letterSpacing: '0.1em' }}
                        >
                          <StarIcon />
                          {title}
                        </h4>
                        {description && (
                          <p className="text-sm text-gray-600 leading-normal prose-force-wrap">
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

          {/* 右侧图片 - 固定高度，与左侧文字区域高度匹配 */}
          <div className="lg:w-[40%] relative flex items-start">
            <div className="w-full h-[600px] lg:h-[700px] relative group">
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

      {/* Itinerary - 固定高度双栏布局：左侧 Mapbox 地图 + 右侧浅色卡片行程 */}
      <section 
        id="itinerary" 
        className="w-full bg-[#f5f1e6] h-[calc(100vh-80px)] flex flex-col lg:flex-row items-stretch overflow-hidden"
      >
        {/* 左侧：地图容器 (40%) - 高度与父容器一致 */}
        <div className="w-full lg:w-[40%] h-[300px] lg:h-full">
          {journey && journeyLocations.length > 0 ? (
            <JourneyMap
              mode={isDayTour ? 'single-location' : 'multi-stop-route'}
              locations={journeyLocations}
              radius={5000}
              dayLocations={dayLocations}
              currentDay={currentDay}
              activeDay={activeDay}
              className="w-full h-full"
              routeGeoJsonPath={(() => {
                // 优先使用后台配置的 routeGeojson（如果存在且非空）
                if (pageConfig?.overview?.routeGeojson && pageConfig.overview.routeGeojson.trim() !== '') {
                  return pageConfig.overview.routeGeojson;
                }
                
                // 不再使用硬编码的 GeoJSON 路径，因为现在使用地理字典自动匹配坐标
                // 如果需要特定路线的 GeoJSON，请在后台配置 routeGeojson 字段
                
                return undefined;
              })()}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500">Loading map...</p>
            </div>
          )}
        </div>

        {/* 右侧：行程详情 (60%) - 固定高度内独立滚动 */}
        <div className="w-full lg:w-[60%] h-full overflow-y-auto bg-[#f5f1e6] py-12 px-6 lg:px-16 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-gray-900 text-3xl mb-12" style={{ fontFamily: 'Montaga, serif', fontWeight: 400 }}>Daily Itinerary</h2>
          
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
                className="itinerary-card bg-white text-gray-900 rounded-lg p-8 mb-10 shadow-sm border border-gray-100 transition-all hover:shadow-md flex flex-col md:flex-row gap-8 items-start"
              >
                {/* 左侧文字内容 */}
                <div className="flex-1 min-w-0">
                  {/* Day 标签 - 优化后的样式 */}
                  <span className="text-gray-500 font-medium text-xs tracking-widest uppercase block mb-3">
                    DAY {day.day}
                  </span>
                  
                  {/* 城市标签 - 橙棕色 Badge（如果有） */}
                  {cityName && (
                    <div className="mb-3">
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

                  {/* 标题 - 使用 Montaga，与 hero banner 保持一致 */}
                  <h3 
                    className="text-3xl text-gray-900 mt-2 mb-6 leading-tight"
                    style={{ fontFamily: 'Montaga, serif', fontWeight: 400 }}
                  >
                    {day.title}
                  </h3>
                  
                  {/* 核心体验描述 - 只保留核心内容 */}
                  <p className="text-gray-700 leading-relaxed text-base mb-6 whitespace-pre-line">
                    {day.description}
                  </p>
                  
                  {/* 活动列表（如果有） */}
                  {(day as any).activities && Array.isArray((day as any).activities) && (day as any).activities.length > 0 && (
                    <div className="mt-6 space-y-2">
                      {(day as any).activities.map((activity: string, actIndex: number) => (
                        <div key={actIndex} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <p className="text-gray-700 text-sm">{activity}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 可折叠 Details 部分 - 用于技术细节 */}
                  {((day as any).meals || (day as any).accommodation || (day as any).transportation) && (
                    <DetailsAccordion
                      meals={(day as any).meals}
                      accommodation={(day as any).accommodation}
                      transportation={(day as any).transportation}
                    />
                  )}
                </div>
                
                {/* 右侧图片 - 优化后的尺寸和比例 */}
                {day.image && (
                  <div className="w-full md:w-[45%] flex-shrink-0">
                    <img 
                      src={day.image} 
                      alt={day.title || 'Itinerary image'} 
                      className="w-full aspect-[16/9] rounded-sm object-cover" 
                    />
                  </div>
                )}
              </div>
            );
          })}
          </div>
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

      {/* Inclusions & Offers Section - 新设计（包含 Select Your Date） */}
      <InclusionsAndOffers 
        journey={journey} 
        onBookingClick={(date) => {
          setConfirmedDate(date);
          setTimeout(() => {
            handleDirectBooking();
          }, 100);
        }}
      />

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
