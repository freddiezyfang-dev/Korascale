'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from "next/link";
import { Container, Section, Heading, Text, Button, Breadcrumb } from '@/components/common';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import RegionMap, { RegionMapHandle } from '@/components/map/RegionMap';
import { getRegionMapping, getSidebarDataByCategory, REGION_MAPPING } from '@/lib/regionMapping';
import PlanningSectionNew from '@/components/sections/PlanningSectionNew';
import { getRenderableImageUrl } from '@/lib/imageUtils';
import { getCoordsForPlacePageId } from '@/lib/geographyDatabase';

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
    image: "/images/hero/chuanxi.jpg"
  },
  "northwest": {
    name: "Northwest & Northern Frontier",
    description: "Discover the frontier regions with stunning natural beauty, ancient Silk Road heritage, and diverse landscapes from deserts to grasslands.",
    image: "/images/hero/jiangyuguan.jpg"
  },
  "north": {
    name: "North China",
    description: "Experience the historical heartland of ancient China, where imperial palaces, ancient walls, and rich cultural traditions await.",
    image: "/images/hero/Gugong.jpg"
  },
  "south": {
    name: "South China",
    description: "Immerse yourself in the vibrant culture and cuisine of South China, from tropical coastlines to bustling modern cities.",
    image: "/images/hero/Guilin.jpg"
  },
  "east-central": {
    name: "East & Central China",
    description: "Journey through the economic and cultural centers of China, where ancient traditions meet modern innovation.",
    image: "/images/hero/Jiangnan.jpg"
  }
};

// 区域映射到 category 的转换（子路由与对应大区共用同一套地图 / Where to go 数据）
const REGION_TO_CATEGORY: { [key: string]: 'southwest' | 'northwest' | 'north' | 'south' | 'east-central' } = {
  'southwest-china': 'southwest',
  'northwest': 'northwest',
  'north': 'north',
  'south': 'south',
  'east-central': 'east-central',
  // 省/主题子页：与主区共用 RegionMap + sidebar
  gansu: 'northwest',
  shaanxi: 'northwest',
  xinjiang: 'northwest',
  sichuan: 'southwest',
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
  },
  gansu: {
    center: [100.5, 38.5],
    zoom: 5.5
  },
  shaanxi: {
    center: [108.94, 34.34],
    zoom: 6
  },
  xinjiang: {
    center: [85.5, 41.0],
    zoom: 4.5
  },
  sichuan: {
    center: [104.06, 30.57],
    zoom: 5.5
  }
};

const REGION_NARRATIVES: Record<string, string> = {
  'southwest-china':
    "Southwest China is a realm of impossible verticality and millions of stories, where life scales the prayer-flag-strewn ridges of the Tibetan Plateau and dives into the neon-lit foggy chasms of Chongqing. It begins in the clouds of Lhasa, where pilgrims circumambulate the sacred Potala Palace, and follows the ancient Tea Horse Road into the jade-colored valleys of Yunnan. From the fiery spice of a Chengdu teahouse to the meditative silence of the Meili Snow Mountain, and the timeless cobblestones of Dali and Lijiang, each stop is a story of resilience and wonder, etched into the most dramatic terrain on earth.",
  northwest:
    "Northwest China unfolds as a vast corridor of civilizations and frontiers, where caravan routes once stitched together empires across wind-cut deserts and high plateaus. The journey moves through the storied Silk Road Corridor and into the luminous quiet of the Qinghai-Tibet Plateau, then opens toward the sweeping horizons of Xinjiang. In Xi'an, imperial memory and cosmopolitan exchange still pulse through ancient walls and Muslim Quarter lanes, while dunes, oases, and mountain passes carry the echo of merchants, monks, and explorers who crossed these lands for centuries.",
  north:
    "North China reveals the architecture of empire and the endurance of frontier cultures, where capitals, grasslands, cave temples, and old merchant towns coexist in one historical continuum. It begins in Beijing's ceremonial heart, expands into the sky-wide Inner Mongolian Grasslands, and follows the loess landscapes and Shanxi heritage routes that once powered caravan trade. Further northeast, forests and winter cities introduce a different rhythm of life, proving that North China is not a single story, but a layered geography of power, memory, and movement.",
  south:
    "South China is a region of misted peaks, river towns, subtropical coasts, and living craft traditions, where nature and daily life remain deeply interwoven. From the trading legacy of Canton to the quartzite pillars of Zhangjiajie and the karst poetry of Guilin, every landscape reshapes the pace of travel. In Hakka Fujian, fortified tulou communities and mountain settlements preserve vernacular architecture and collective memory. Together, these places form a southern world of texture and vitality, where cuisine, language, and terrain shift beautifully from one valley to the next.",
  'east-central':
    "East & Central China is a meeting ground of classical elegance and modern momentum, where river civilizations, waterborne towns, and global cities share one connected cultural map. The route spans Wuhan's central crossroads, Shanghai's metropolitan edge, and Hangzhou's lyrical lake-and-tea landscapes. It drifts through Water Towns threaded by stone bridges and canals, then rises toward Yellow Mountain and Southern Anhui, where granite peaks and white-walled villages preserve a timeless aesthetic. Here, refinement and reinvention are not opposites, but parallel currents of the same journey.",
};

const PLACE_LINK_CLASS =
  'text-white hover:opacity-90 transition-all font-medium';

const REGION_PLACE_LINK_MAP: Record<string, Record<string, string>> = {
  'southwest-china': {
    'Tibetan Plateau': '/places/tibetan-plateau',
    Chongqing: '/places/chongqing-gorges',
    Lhasa: '/places/tibetan-plateau',
    Yunnan: '/places/yunnan-guizhou-highlands',
    Chengdu: '/places/sichuan-basin',
    'Meili Snow Mountain': '/places/yunnan-guizhou-highlands',
    Dali: '/places/yunnan-guizhou-highlands',
    Lijiang: '/places/yunnan-guizhou-highlands',
  },
  northwest: {
    'Silk Road Corridor': '/places/silk-road-corridor',
    'Qinghai-Tibet Plateau': '/places/qinghai-tibet-plateau',
    Xinjiang: '/places/xinjiang-oases-deserts',
    "Xi'an": '/places/xian',
  },
  north: {
    Beijing: '/places/beijing',
    'Inner Mongolian Grasslands': '/places/inner-mongolian-grasslands',
    'Shanxi heritage': '/places/loess-shanxi-heritage',
    forests: '/places/northeastern-forests',
  },
  south: {
    Canton: '/places/canton',
    Zhangjiajie: '/places/zhangjiajie',
    Guilin: '/places/guilin',
    'Hakka Fujian': '/places/hakka-fujian',
  },
  'east-central': {
    Wuhan: '/places/wuhan',
    Shanghai: '/places/shanghai',
    Hangzhou: '/places/hangzhou',
    'Water Towns': '/places/water-towns',
    'Yellow Mountain': '/places/yellow-mountain-southern-anhui',
    'Southern Anhui': '/places/yellow-mountain-southern-anhui',
  },
};

const CATEGORY_TO_REGION_KEY: Record<string, keyof typeof REGION_NARRATIVES> = {
  southwest: 'southwest-china',
  northwest: 'northwest',
  north: 'north',
  south: 'south',
  'east-central': 'east-central',
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderDescriptionWithPlaceLinks(text: string, linkMap: Record<string, string>) {
  const keys = Object.keys(linkMap).sort((a, b) => b.length - a.length);
  if (keys.length === 0) return text;

  const matcher = new RegExp(`(${keys.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(matcher);

  return parts.map((part, index) => {
    const matchedKey = keys.find((key) => key.toLowerCase() === part.toLowerCase());
    if (!matchedKey) return part;

    return (
      <Link
        key={`${matchedKey}-${index}`}
        href={linkMap[matchedKey]}
        className={PLACE_LINK_CLASS}
        style={{
          color: '#ffffff',
          textDecorationLine: 'underline',
          textDecorationColor: '#ffffff',
          textDecorationThickness: '2px',
          textUnderlineOffset: '4px',
        }}
      >
        {part}
      </Link>
    );
  });
}

export default function RegionDestinationsPage() {
  const params = useParams();
  const region = params.region as string;
  const { journeys } = useJourneyManagement();
  
  const [filteredJourneys, setFilteredJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  const mapRef = useRef<RegionMapHandle>(null);

  const regionInfo = regionMap[region];
  const isFullPageRegion = [
    'southwest-china',
    'northwest',
    'north',
    'south',
    'east-central',
    'gansu',
    'shaanxi',
    'xinjiang',
    'sichuan',
  ].includes(region);
  
  // 动态获取当前 category 的 sidebar 数据
  const currentCategory = REGION_TO_CATEGORY[region];
  const narrativeKey =
    (region in REGION_NARRATIVES
      ? (region as keyof typeof REGION_NARRATIVES)
      : currentCategory
        ? CATEGORY_TO_REGION_KEY[currentCategory]
        : undefined) || null;
  
  // 🔍 调试日志：检查 currentCategory 是否正确
  useEffect(() => {
    console.log('[RegionDestinationsPage] Current Page:', region);
    console.log('[RegionDestinationsPage] Current Category:', currentCategory);
    if (!currentCategory) {
      console.error(`[RegionDestinationsPage] ⚠️ WARNING: No category found for region: ${region}`);
    }
  }, [region, currentCategory]);
  
  const currentRegionSidebarData = useMemo(
    () => (currentCategory ? getSidebarDataByCategory(currentCategory) : []),
    [currentCategory]
  );

  const placeMarkers = useMemo(() => {
    if (!currentCategory) return [];
    return currentRegionSidebarData
      .map((item) => {
        const coords = getCoordsForPlacePageId(item.id);
        if (!coords) return null;
        return { id: item.id, lng: coords[0], lat: coords[1] };
      })
      .filter((x): x is { id: string; lng: number; lat: number } => x !== null);
  }, [currentRegionSidebarData, currentCategory]);
  
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
      if (targetRegion === 'shaanxi' && journeyRegion?.includes('shaanxi')) return true;
      if (targetRegion === 'xinjiang' && journeyRegion?.includes('xinjiang')) return true;
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

  // 判断是否需要旋转图片
  const shouldRotateImage = region === 'north' || region === 'east-central' || region === 'southwest-china';

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Banner 容器：必须有 overflow-hidden */}
      <Section background="primary" padding="none" className="relative h-[70vh] min-h-[620px] w-full overflow-hidden">
        <div 
          className="absolute inset-0 opacity-85 transition-all duration-700"
          style={shouldRotateImage ? {
            backgroundImage: `url('${regionInfo.image}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            
            // 核心逻辑：
            // 1. 旋转 270 度
            // 2. 将宽度设为容器的高 (600px)，高度设为容器的宽 (100%)
            // 3. 使用 object-fit 的逻辑（background-size: cover 配合正确的宽高比）
            transform: 'rotate(270deg)',
            transformOrigin: 'center center',
            
            // 当图片旋转 270 度后：
            // 原本的 'height' 变成了视觉上的宽度
            // 因此我们需要强制让它的"长边"覆盖容器的宽
            width: '600px',   // 对应容器的 h-[600px]
            height: '100vw',  // 对应容器的 w-full
            
            // 居中定位：将旋转中心移至容器中央
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-50vw', // height 的一半
            marginLeft: '-300px' // width 的一半
          } : {
            backgroundImage: `url('${regionInfo.image}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: '100%',
            height: '100%'
          }}
        />
        
        {/* 可以在这里添加 A&K 风格的文字遮罩 */}
        <div className="absolute inset-0 bg-black/20" />
        
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
          <div className="flex-1 flex items-center px-4 py-24">
            <div className="w-full text-white grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-12">
              <div className="flex items-center">
                <Heading
                  level={1}
                  className="text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight font-serif"
                  style={{
                    fontFamily: 'var(--font-playfair), Playfair Display, serif',
                    color: '#FFFFFF'
                  }}
                >
                  {regionInfo.name}
                </Heading>
              </div>

              <p
                className="text-lg md:text-xl lg:text-2xl leading-relaxed font-sans md:col-start-2 max-w-2xl md:pl-12"
                style={{
                  fontFamily: 'Monda, sans-serif',
                  color: '#FFFFFF'
                }}
              >
                {renderDescriptionWithPlaceLinks(
                  (narrativeKey && REGION_NARRATIVES[narrativeKey]) || regionInfo.description,
                  (narrativeKey && REGION_PLACE_LINK_MAP[narrativeKey]) || {}
                )}
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
                className="grid grid-cols-3 gap-1 md:gap-2 text-center font-sans text-xs uppercase tracking-widest font-medium"
                style={{ fontFamily: 'Monda, sans-serif' }}
                aria-label={`${regionInfo.name} subsections`}
              >
                <a
                  href="#trip-inspiration"
                  className="py-1.5 md:py-2 border-b-2 border-transparent hover:border-black transition-colors"
                >
                  Trip inspiration
                </a>
                <a
                  href="#map"
                  className="py-1.5 md:py-2 border-b-2 border-transparent hover:border-black transition-colors"
                >
                  Map
                </a>
                <a
                  href="#plan-your-trip"
                  className="py-1.5 md:py-2 border-b-2 border-transparent hover:border-black transition-colors"
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
        className="pt-10 pb-20 md:pt-12 md:pb-24"
      >
        <Container size="xl">
          {/* 三个 Featured Journeys 卡片（已移除 Trip Inspiration 标题与描述，整体上移） */}
          <div className="mb-12 md:mb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredJourneys.length > 0 ? (
              // 如果有数据，显示实际的旅程卡片
              filteredJourneys.slice(0, 3).map((journey) => (
                <Link
                  key={`featured-${journey.id}`}
                  href={`/journeys/${journey.slug || journey.id}`}
                  className="block h-full"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden group cursor-pointer rounded-sm">
                    <img
                      src={getRenderableImageUrl(journey.image)}
                      alt={journey.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-85" />
                    <div className="absolute top-4 right-4 bg-black/70 text-white px-2.5 py-1 text-[10px] tracking-wider uppercase font-medium">
                      Featured Journey
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-end items-center pb-10 px-6 text-white text-center">
                      <h3 className="text-3xl md:text-4xl font-heading mb-3 tracking-wide drop-shadow-sm">
                        {journey.title}
                      </h3>
                      <p className="text-sm md:text-base font-light leading-relaxed opacity-90 max-w-[280px] line-clamp-3">
                        {journey.shortDescription || journey.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              // 如果没有数据，显示三个占位卡片
              [1, 2, 3].map((index) => (
                <div
                  key={`placeholder-${index}`}
                  className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-gray-200"
                >
                </div>
              ))
            )}
          </div>
        </Container>
      </Section>

      {/* Map Section */}
      {isFullPageRegion && (
        <>
          <Section id="map" background="primary" padding="none" className="py-16">
            <Container size="xl" className="px-1 lg:px-2 w-full max-w-7xl mx-auto">
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
                      placeMarkers={placeMarkers}
                      hoveredPlaceId={hoveredPlaceId}
                    />
                  </div>
                </div>

                {/* 右侧区域列表 */}
                <div className="col-span-12 lg:col-span-5 h-full overflow-y-auto bg-white">
                  <div className="py-4 px-2 lg:px-4">
                    <Heading level={2} className="text-2xl font-heading mb-6" style={{ fontFamily: 'Montaga, serif' }}>
                      Where to go
                    </Heading>
                    
                    <div
                      className="space-y-6"
                      onMouseLeave={() => {
                        setHoveredPlaceId(null);
                        mapRef.current?.clearCategoryHover();
                        mapRef.current?.resetCategoryView();
                      }}
                    >
                      {currentRegionSidebarData.map((regionItem) => {
                        // 检查是否是 Tibetan Plateau，如果是则链接到 Place 页面
                        const isTibetanPlateau = regionItem.id === 'tibetan-plateau';
                        const linkHref = isTibetanPlateau 
                          ? '/places/tibetan-plateau' 
                          : `/places/${regionItem.id}`;

                        const content = (
                          <div
                            id={regionItem.id}
                            className="flex gap-4 pb-6 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors scroll-mt-20"
                            onMouseEnter={() => {
                              setHoveredPlaceId(regionItem.id);
                              const coords = getCoordsForPlacePageId(regionItem.id);
                              if (coords && mapRef.current) {
                                mapRef.current.flyToPlace(coords, {
                                  zoom: 7,
                                  pitch: 45,
                                  bearing: -20,
                                  duration: 2000,
                                });
                              }
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
                            onClick={() => {
                              if (!isTibetanPlateau) {
                                console.log('[Sidebar] click region', regionItem.id);
                                console.log('[Sidebar] current activeRegionId before set:', activeRegionId);
                                setActiveRegionId(regionItem.id);
                                console.log('[Sidebar] setActiveRegionId called with:', regionItem.id);
                              }
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
                              {/* Discover more 文本 - 整个区域已经是链接，所以这里只显示文本 */}
                              <span 
                                className="text-sm text-[#c0a273]"
                                style={{ fontFamily: 'Monda, sans-serif' }}
                              >
                                Discover more
                              </span>
                            </div>
                          </div>
                        );

                        // 所有区域都可以点击跳转到对应的 place 详情页
                        return (
                          <Link key={regionItem.id} href={linkHref} className="block">
                            {content}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </Container>
          </Section>

          {/* Plan Your Trip Section */}
          <PlanningSectionNew />
        </>
      )}
    </main>
  );
}
