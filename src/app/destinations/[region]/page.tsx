'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from "next/link";
import { Container, Section, Heading, Text, Button, Card, Breadcrumb } from '@/components/common';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import RegionMap, { RegionMapHandle } from '@/components/map/RegionMap';
import { getRegionMapping, getSidebarDataByCategory, REGION_MAPPING } from '@/lib/regionMapping';

// 地区映射
const regionMap: { [key: string]: { name: string; description: string; image: string } } = {
  sichuan: {
    name: "Sichuan & Chongqing",
    description: "熊猫之乡，火锅之都",
    image: "/images/journey-cards/chengdu-deep-dive.jpeg"
  },
  gansu: {
    name: "Gansu & Qinghai", 
    description: "丝绸之路，高原风光",
    image: "/images/journey-cards/gansu-zhangye.jpg"
  },
  shaanxi: {
    name: "Shaanxi",
    description: "古都西安，兵马俑", 
    image: "/images/journey-cards/shannxi-yejing.jpg"
  },
  xinjiang: {
    name: "Xinjiang",
    description: "新疆维吾尔自治区",
    image: "/images/journey-cards/xinjiang-altstadt.webp"
  },
  "southwest-china": {
    name: "Southwest China",
    description: "Mountain ranges, deep gorges and vibrant minority cultures define Southwest China—where landscapes and traditions intertwine.",
    image: "/images/journey-cards/xinjiang-altstadt.webp"
  },
  "northwest": {
    name: "Northwest & Northern Frontier",
    description: "Discover the frontier regions with stunning natural beauty, ancient Silk Road heritage, and diverse landscapes from deserts to grasslands.",
    image: "/images/journey-cards/gansu-zhangye.jpg"
  },
  "north": {
    name: "North China",
    description: "Experience the historical heartland of ancient China, where imperial palaces, ancient walls, and rich cultural traditions await.",
    image: "/images/journey-cards/shannxi-yejing.jpg"
  },
  "south": {
    name: "South China",
    description: "Immerse yourself in the vibrant culture and cuisine of South China, from tropical coastlines to bustling modern cities.",
    image: "/images/journey-cards/chengdu-deep-dive.jpeg"
  },
  "east-central": {
    name: "East & Central China",
    description: "Journey through the economic and cultural centers of China, where ancient traditions meet modern innovation.",
    image: "/images/journey-cards/chengdu-deep-dive.jpeg"
  }
};

// 区域映射到 category 的转换
const REGION_TO_CATEGORY: { [key: string]: 'southwest' | 'northwest' | 'north' | 'south' | 'east-central' } = {
  'southwest-china': 'southwest',
  'northwest': 'northwest',
  'north': 'north',
  'south': 'south',
  'east-central': 'east-central'
};

// 地图配置：每个区域的地图中心点和缩放级别
const MAP_CONFIG: { [key: string]: { center: [number, number]; zoom: number } } = {
  'southwest-china': {
    center: [102, 30], // 西南地区中心（四川/云南）
    zoom: 5.5
  },
  'northwest': {
    center: [95, 40], // 西北地区中心（新疆/甘肃）
    zoom: 4.5
  },
  'north': {
    center: [116, 40], // 华北地区中心（北京）
    zoom: 5.5
  },
  'south': {
    center: [113, 24], // 华南地区中心（广东/广西）
    zoom: 6
  },
  'east-central': {
    center: [118, 32], // 华东地区中心（上海/江苏）
    zoom: 6
  }
};

export default function RegionDestinationsPage() {
  const params = useParams();
  const region = params.region as string;
  const { journeys } = useJourneyManagement();
  
  const [filteredJourneys, setFilteredJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const mapRef = useRef<RegionMapHandle>(null);

  const regionInfo = regionMap[region];
  const isFullPageRegion = ['southwest-china', 'northwest', 'north', 'south', 'east-central'].includes(region);
  
  // 动态获取当前 category 的 sidebar 数据
  const currentCategory = REGION_TO_CATEGORY[region];
  
  // 🔍 调试日志：检查 currentCategory 是否正确
  useEffect(() => {
    console.log('[RegionDestinationsPage] Current Page:', region);
    console.log('[RegionDestinationsPage] Current Category:', currentCategory);
    if (!currentCategory) {
      console.error(`[RegionDestinationsPage] ⚠️ WARNING: No category found for region: ${region}`);
    }
  }, [region, currentCategory]);
  
  const currentRegionSidebarData = currentCategory ? getSidebarDataByCategory(currentCategory) : [];
  
  // 🔍 数据一致性检查：验证 sidebar 数据的 id 是否都在 REGION_MAPPING 中
  useEffect(() => {
    if (currentRegionSidebarData.length > 0) {
      const allPageIds = new Set(REGION_MAPPING.map(m => m.pageId));
      const missingIds = currentRegionSidebarData
        .map(item => item.id)
        .filter(id => !allPageIds.has(id));
      
      if (missingIds.length > 0) {
        console.error(`[RegionDestinationsPage] ⚠️ DATA MISMATCH: Sidebar IDs not found in REGION_MAPPING:`, missingIds);
      } else {
        console.log(`[RegionDestinationsPage] ✅ Data consistency check passed: All ${currentRegionSidebarData.length} sidebar items have valid pageIds`);
      }
    }
  }, [currentRegionSidebarData]);

  useEffect(() => {
    if (!regionInfo) {
      setLoading(false);
      return;
    }

    // 根据地区过滤旅程
    const filtered = journeys.filter(journey => {
      const journeyRegion = journey.region?.toLowerCase();
      const targetRegion = region.toLowerCase();
      
      // 匹配地区名称
      if (journeyRegion === targetRegion) return true;
      
      // 特殊匹配规则
      if (targetRegion === 'sichuan' && journeyRegion?.includes('sichuan')) return true;
      if (targetRegion === 'gansu' && journeyRegion?.includes('gansu')) return true;
      if (targetRegion === 'southwest-china' && journeyRegion && journeyRegion.includes('southwest')) return true;
      if (targetRegion === 'northwest' && journeyRegion && (journeyRegion.includes('northwest') || journeyRegion.includes('north west'))) return true;
      if (targetRegion === 'north' && journeyRegion && journeyRegion.includes('north') && !journeyRegion.includes('northwest')) return true;
      if (targetRegion === 'south' && journeyRegion && journeyRegion.includes('south') && !journeyRegion.includes('southwest')) return true;
      if (targetRegion === 'east-central' && journeyRegion && (journeyRegion.includes('east') || journeyRegion.includes('central'))) return true;
      
      return false;
    });

    setFilteredJourneys(filtered);
    setLoading(false);
  }, [journeys, region, regionInfo]);

  useEffect(() => {
    if (regionInfo) {
      document.title = `${regionInfo.name} - Destinations - Korascale`;
    }
  }, [regionInfo]);

  if (!regionInfo) {
    return (
      <main className="min-h-screen bg-white">
        <Container size="xl" className="py-24">
          <div className="text-center">
            <Heading level={1} className="text-4xl font-heading mb-4">
              Region Not Found
            </Heading>
            <Text className="text-xl mb-8">
              The region "{region}" does not exist.
            </Text>
            <Link href="/destinations">
              <Button variant="primary">
                Back to Destinations
              </Button>
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Container size="xl" className="py-24">
          <div className="text-center">
            <Text className="text-xl">Loading journeys...</Text>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Banner */}
      <Section background="primary" padding="none" className="relative h-[600px]">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-85"
          style={{ backgroundImage: `url('${regionInfo.image}')` }}
        />
        <div className="relative z-10 h-full flex flex-col">
          {/* Breadcrumb */}
          <div className="px-9 pt-2">
            <Breadcrumb 
              items={[
                { label: 'Home', href: '/' }, 
                { label: 'Destinations', href: '/destinations' },
                { label: regionInfo.name }
              ]}
              color="#FFFFFF"
              sizeClassName="text-lg md:text-xl"
            />
          </div>
          
          {/* Hero Content */}
          <div className="flex-1 flex items-center px-4">
            <div className="text-white max-w-4xl">
              <Heading 
                level={1} 
                className="text-5xl md:text-6xl lg:text-7xl font-normal mb-2 tracking-tight" 
                style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  color: '#FFFFFF'
                }}
              >
                {regionInfo.name}
              </Heading>
              
              <p 
                className="text-lg md:text-xl lg:text-2xl mt-6 leading-relaxed max-w-2xl" 
                style={{ 
                  fontFamily: 'Montagu Slab, serif',
                  color: '#FFFFFF'
                }}
              >
                {regionInfo.description}
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* 子导航 */}
      {isFullPageRegion && (
        <>
          {/* 顶部四个子导航 */}
          <Section background="primary" padding="none" className="border-b border-gray-200">
            <Container size="xl" className="pt-6 pb-4 max-w-3xl mx-auto">
              {/* 四个栏目：等距分布（container 更窄，间距更紧凑） */}
              <nav
                className="grid grid-cols-4 gap-1 md:gap-2 text-xs sm:text-sm md:text-base text-center"
                aria-label={`${regionInfo.name} subsections`}
              >
                <a
                  href="#trip-inspiration"
                  className="uppercase tracking-wide py-1.5 md:py-2 border-b-2 border-transparent hover:border-black transition-colors"
                  style={{ fontFamily: 'Monda, sans-serif' }}
                >
                  Trip inspiration
                </a>
                <a
                  href="#map"
                  className="uppercase tracking-wide py-1.5 md:py-2 border-b-2 border-transparent hover:border-black transition-colors"
                  style={{ fontFamily: 'Monda, sans-serif' }}
                >
                  Map
                </a>
                <a
                  href="#why-with-us"
                  className="uppercase tracking-wide py-1.5 md:py-2 border-b-2 border-transparent hover:border-black transition-colors"
                  style={{ fontFamily: 'Monda, sans-serif' }}
                >
                  Why travel with us
                </a>
                <a
                  href="#plan-your-trip"
                  className="uppercase tracking-wide py-1.5 md:py-2 border-b-2 border-transparent hover:border-black transition-colors"
                  style={{ fontFamily: 'Monda, sans-serif' }}
                >
                  Plan your trip
                </a>
              </nav>
            </Container>
          </Section>

        </>
      )}

      {/* Journeys / Trip Inspiration Section */}
      <Section
        id={isFullPageRegion ? 'trip-inspiration' : undefined}
        background="secondary"
        padding="xl"
        className="py-24"
      >
        <Container size="xl">
          <div className="text-center mb-16">
            <Heading level={2} className="text-4xl font-heading mb-4">
              Trip Inspiration
            </Heading>
            <Text className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover handpicked journeys and ideas for exploring {regionInfo.name}.
            </Text>
          </div>

          {/* 三个 Featured Journeys 卡片占位 */}
          <div className="mb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredJourneys.length > 0 ? (
              // 如果有数据，显示实际的旅程卡片
              filteredJourneys.slice(0, 3).map((journey) => (
                <Card
                  key={`featured-${journey.id}`}
                  className="overflow-hidden bg-white shadow-md hover:shadow-xl transition-shadow"
                >
                  <div className="h-56 overflow-hidden">
                    <img
                      src={journey.image}
                      alt={journey.title}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 flex flex-col h-full">
                    <Text
                      className="text-xs uppercase tracking-[0.2em] mb-2 text-gray-500"
                      style={{ fontFamily: 'Monda, sans-serif' }}
                    >
                      Featured Journey
                    </Text>
                    <Heading
                      level={3}
                      className="text-lg md:text-xl mb-3"
                      style={{ fontFamily: 'Montaga, serif' }}
                    >
                      {journey.title}
                    </Heading>
                    <Text className="text-sm text-gray-600 flex-1 mb-4 line-clamp-3">
                      {journey.shortDescription || journey.description}
                    </Text>
                    <Link href={`/journeys/${journey.slug || journey.id}`}>
                      <Button variant="secondary" className="w-full">
                        View journey
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            ) : (
              // 如果没有数据，显示三个占位卡片
              [1, 2, 3].map((index) => (
                <Card
                  key={`placeholder-${index}`}
                  className="overflow-hidden bg-gray-100 shadow-md"
                >
                  <div className="h-56 bg-gray-200 flex items-center justify-center">
                    <Text className="text-gray-400" style={{ fontFamily: 'Monda, sans-serif' }}>
                      Journey {index}
                    </Text>
                  </div>
                  <div className="p-5 flex flex-col h-full">
                    <Text
                      className="text-xs uppercase tracking-[0.2em] mb-2 text-gray-400"
                      style={{ fontFamily: 'Monda, sans-serif' }}
                    >
                      Featured Journey
                    </Text>
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Container>
      </Section>

      {/* Map Section */}
      {isFullPageRegion && (
        <>
          <Section id="map" background="primary" padding="none" className="py-16">
            <Container size="xl" className="px-1 lg:px-2 max-w-[1600px] mx-auto">
              <div className="grid grid-cols-12 gap-4 lg:gap-6 h-[650px]">
                {/* 左侧地图区域 */}
                <div className="col-span-12 lg:col-span-7 h-full flex items-center justify-center">
                  <div className="w-full h-full">
                    <RegionMap 
                      ref={mapRef}
                      geojsonUrl="/data/china-provinces.geojson"
                      defaultCenter={MAP_CONFIG[region]?.center || [104.1954, 35.8617]}
                      defaultZoom={MAP_CONFIG[region]?.zoom || 5}
                      currentCategory={currentCategory}
                      activeRegionId={activeRegionId}
                      onRegionClick={setActiveRegionId}
                    />
                  </div>
                </div>

                {/* 右侧区域列表 */}
                <div className="col-span-12 lg:col-span-5 h-full overflow-y-auto bg-white">
                  <div className="py-4 px-2 lg:px-4">
                    <Heading level={2} className="text-2xl font-heading mb-6" style={{ fontFamily: 'Montaga, serif' }}>
                      Where to go
                    </Heading>
                    
                    <div className="space-y-6">
                      {currentRegionSidebarData.map((regionItem) => (
                        <div
                          key={regionItem.id}
                          className="flex gap-4 pb-6 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors"
                          onMouseEnter={() => {
                            const mapping = getRegionMapping(regionItem.id);
                            if (mapping && mapRef.current) {
                              // 只在未 selected 时设置 hover
                              if (activeRegionId !== regionItem.id) {
                                mapping.geojsonIds.forEach(adcode => {
                                  mapRef.current?.setHoverState(adcode, true);
                                });
                              }
                            }
                          }}
                          onMouseLeave={() => {
                            const mapping = getRegionMapping(regionItem.id);
                            if (mapping && mapRef.current) {
                              // 清除 hover
                              mapping.geojsonIds.forEach(adcode => {
                                mapRef.current?.setHoverState(adcode, false);
                              });
                            }
                          }}
                          onClick={() => {
                            console.log('[Sidebar] click region', regionItem.id);
                            console.log('[Sidebar] current activeRegionId before set:', activeRegionId);
                            setActiveRegionId(regionItem.id);
                            console.log('[Sidebar] setActiveRegionId called with:', regionItem.id);
                          }}
                        >
                          {/* 图片 */}
                          <div className="w-32 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                            <img
                              src={regionItem.image}
                              alt={regionItem.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // 如果图片加载失败，显示占位符
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">Image</div>';
                              }}
                            />
                          </div>
                          
                          {/* 内容 */}
                          <div className="flex-1">
                            <Heading 
                              level={3} 
                              className="text-lg font-heading mb-2"
                              style={{ fontFamily: 'Montaga, serif' }}
                            >
                              {regionItem.title}
                            </Heading>
                            <Text 
                              className="text-sm text-gray-600 mb-3"
                              style={{ fontFamily: 'Monda, sans-serif' }}
                            >
                              {regionItem.description}
                            </Text>
                            <Link 
                              href={`#${regionItem.id}`}
                              className="text-sm text-[#c0a273] hover:underline"
                              style={{ fontFamily: 'Monda, sans-serif' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Discover more
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Container>
          </Section>

          {/* Why With Us Section */}
          <Section id="why-with-us" background="primary" padding="xl" className="py-16">
            <Container size="xl">
              <Heading level={2} className="text-3xl font-heading mb-4">
                Why travel with Korascale in {regionInfo.name}
              </Heading>
              <Text className="text-lg text-gray-600 max-w-3xl">
                We combine local expertise, carefully vetted partners, and immersive cultural access to craft journeys
                across {regionInfo.name} that are safe, seamless and deeply enriching.
              </Text>
            </Container>
          </Section>

          {/* Plan Your Trip Section */}
          <Section id="plan-your-trip" background="secondary" padding="xl" className="py-16">
            <Container size="xl">
              <Heading level={2} className="text-3xl font-heading mb-4">
                Plan your trip
              </Heading>
              <Text className="text-lg text-gray-600 mb-8 max-w-3xl">
                Share your group size, timing and interests, and our team will design a {regionInfo.name} itinerary just
                for you.
              </Text>
              <Link href="/contact">
                <Button variant="primary">
                  Start planning
                </Button>
              </Link>
            </Container>
          </Section>
        </>
      )}
    </main>
  );
}
