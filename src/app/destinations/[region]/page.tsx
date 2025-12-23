'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from "next/link";
import { Container, Section, Heading, Text, Button, Card, Breadcrumb } from '@/components/common';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import RegionMap, { RegionMapHandle } from '@/components/map/RegionMap';
import { getRegionMapping, REGION_MAPPING } from '@/lib/regionMapping';

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
  }
};

// 区域数据配置（用于 sidebar 显示）
// 注意：地图数据现在从 GeoJSON 文件加载，bounds 仅用于相机动画的后备方案
const REGIONS_SIDEBAR_DATA = [
  {
    id: 'tibetan-plateau',
    title: 'Tibetan Plateau & Kham Region',
    description: 'High-altitude landscapes, ancient monasteries, and the rich cultural heritage of Tibetan communities define this vast plateau region.',
    image: '/images/journey-cards/tibet-buddhist-journey.jpg'
  },
  {
    id: 'yunnan-guizhou-highlands',
    title: 'Yunnan–Guizhou Highlands',
    description: 'Terraced rice fields, karst mountains, and diverse ethnic minority cultures create a stunning mosaic across these highland provinces.',
    image: '/images/journey-cards/jiuzhaigou-valley-multi-color-lake.jpeg'
  },
  {
    id: 'sichuan-basin',
    title: 'Sichuan Basin & Mountains',
    description: 'From the fertile Chengdu Plain to the dramatic peaks of the Tibetan Plateau foothills, experience the contrast of basin and mountain landscapes.',
    image: '/images/journey-cards/chengdu-deep-dive.jpeg'
  },
  {
    id: 'chongqing-gorges',
    title: 'Chongqing & Three Gorges',
    description: 'The mighty Yangtze River carves through dramatic gorges, while the mountain city of Chongqing offers vibrant urban culture and spicy cuisine.',
    image: '/images/journey-cards/chongqing-wulong-karst-national-park.jpg'
  }
];

export default function RegionDestinationsPage() {
  const params = useParams();
  const region = params.region as string;
  const { journeys } = useJourneyManagement();
  
  const [filteredJourneys, setFilteredJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const mapRef = useRef<RegionMapHandle>(null);

  const regionInfo = regionMap[region];
  const isNorthwestChina = region === 'southwest-china';

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

      {/* Southwest China 子导航 + 5 个分类 */}
      {isNorthwestChina && (
        <>
          {/* 顶部四个子导航 */}
          <Section background="primary" padding="none" className="border-b border-gray-200">
            <Container size="xl" className="pt-6 pb-4 max-w-3xl mx-auto">
              {/* 四个栏目：等距分布（container 更窄，间距更紧凑） */}
              <nav
                className="grid grid-cols-4 gap-1 md:gap-2 text-xs sm:text-sm md:text-base text-center"
              aria-label="Southwest China subsections"
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
        id={isNorthwestChina ? 'trip-inspiration' : undefined}
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

      {/* Southwest China Map Section */}
      {isNorthwestChina && (
        <>
          <Section id="map" background="primary" padding="none" className="py-16">
            <Container size="xl" className="px-1 lg:px-2">
              <div className="flex flex-col lg:flex-row h-[800px] gap-4 lg:gap-6">
                {/* 左侧地图区域 */}
                <div className="lg:w-1/2 h-full flex items-center justify-center">
                  <div className="w-full h-full">
                    <RegionMap 
                      ref={mapRef}
                      geojsonUrl="/data/china-provinces.geojson"
                      defaultCenter={[102, 30]}
                      defaultZoom={5.5}
                      activeRegionId={activeRegionId}
                      onRegionClick={setActiveRegionId}
                    />
                  </div>
                </div>

                {/* 右侧区域列表 */}
                <div className="lg:w-1/2 h-full overflow-y-auto bg-white">
                  <div className="py-4 px-2 lg:px-4">
                    <Heading level={2} className="text-2xl font-heading mb-6" style={{ fontFamily: 'Montaga, serif' }}>
                      Where to go
                    </Heading>
                    
                    <div className="space-y-6">
                      {REGIONS_SIDEBAR_DATA.map((region) => (
                        <div
                          key={region.id}
                          className="flex gap-4 pb-6 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors"
                          onMouseEnter={() => {
                            const mapping = getRegionMapping(region.id);
                            if (mapping && mapRef.current) {
                              // 只在未 selected 时设置 hover
                              if (activeRegionId !== region.id) {
                                mapping.geojsonIds.forEach(adcode => {
                                  mapRef.current?.setHoverState(adcode, true);
                                });
                              }
                            }
                          }}
                          onMouseLeave={() => {
                            const mapping = getRegionMapping(region.id);
                            if (mapping && mapRef.current) {
                              // 清除 hover
                              mapping.geojsonIds.forEach(adcode => {
                                mapRef.current?.setHoverState(adcode, false);
                              });
                            }
                          }}
                          onClick={() => {
                            console.log('[Sidebar] click region', region.id);
                            console.log('[Sidebar] current activeRegionId before set:', activeRegionId);
                            setActiveRegionId(region.id);
                            console.log('[Sidebar] setActiveRegionId called with:', region.id);
                          }}
                        >
                          {/* 图片 */}
                          <div className="w-32 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                            <img
                              src={region.image}
                              alt={region.title}
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
                              {region.title}
                            </Heading>
                            <Text 
                              className="text-sm text-gray-600 mb-3"
                              style={{ fontFamily: 'Monda, sans-serif' }}
                            >
                              {region.description}
                            </Text>
                            <Link 
                              href={`#${region.id}`}
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
                Why travel with Korascale in Southwest China
              </Heading>
              <Text className="text-lg text-gray-600 max-w-3xl">
                We combine local expertise, carefully vetted partners, and immersive cultural access to craft journeys
                across Southwest China that are safe, seamless and deeply enriching.
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
                Share your group size, timing and interests, and our team will design a Southwest China itinerary just
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
