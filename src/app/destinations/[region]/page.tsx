'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from "next/link";
import { Container, Section, Heading, Text, Button, Card, Breadcrumb } from '@/components/common';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { northwestSubRegions } from '../northwestSubRegions';

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
  "northwest-china": {
    name: "Northwest China",
    description: "Vast deserts, high plateaus and ancient Silk Road cities define Northwest China—where cultures, landscapes and histories converge.",
    image: "/images/journey-cards/xinjiang-altstadt.webp"
  }
};

export default function RegionDestinationsPage() {
  const params = useParams();
  const region = params.region as string;
  const { journeys } = useJourneyManagement();
  
  const [filteredJourneys, setFilteredJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const regionInfo = regionMap[region];
  const isNorthwestChina = region === 'northwest-china';

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
      if (targetRegion === 'northwest-china' && journeyRegion && journeyRegion.includes('northwest')) return true;
      
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

      {/* Northwest China 子导航 + 5 个分类 */}
      {isNorthwestChina && (
        <>
          {/* 顶部四个子导航 */}
          <Section background="primary" padding="none" className="border-b border-gray-200">
            <Container size="xl" className="pt-6 pb-4 max-w-3xl mx-auto">
              {/* 四个栏目：等距分布（container 更窄，间距更紧凑） */}
              <nav
                className="grid grid-cols-4 gap-1 md:gap-2 text-xs sm:text-sm md:text-base text-center"
                aria-label="Northwest China subsections"
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

          {/* 独立的五个标签区域 */}
          <Section background="primary" padding="none" className="py-10">
            <Container size="xl" className="max-w-5xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-14 text-center">
                {northwestSubRegions.map((item) => (
                  <div key={item.id} className="flex flex-col items-center">
                    {/* 图标更大 */}
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-[#c0a273] flex items-center justify-center mb-4">
                      <span
                        className="text-base md:text-lg"
                        style={{ fontFamily: 'Monda, sans-serif', fontWeight: 600, color: '#c0a273' }}
                      >
                        {item.name.charAt(0)}
                      </span>
                    </div>
                    {/* 文本更大 */}
                    <div
                      className="text-xl md:text-2xl tracking-wide"
                      style={{ fontFamily: 'Montaga, serif', color: '#000000' }}
                    >
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
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

          {/* 三个 Featured Journeys 卡片 */}
          {filteredJourneys.length > 0 && (
            <div className="mb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredJourneys.slice(0, 3).map((journey) => (
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
              ))}
            </div>
          )}

          {filteredJourneys.length === 0 ? (
            <div className="text-center py-16">
              <Text className="text-xl text-gray-600 mb-8">
                No journeys available for {regionInfo.name} yet.
              </Text>
              <Link href="/journeys">
                <Button variant="primary">
                  View All Journeys
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredJourneys.map((journey) => (
                <Card key={journey.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={journey.image}
                      alt={journey.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-6">
                    <Heading level={3} className="text-xl font-subheading mb-2">
                      {journey.title}
                    </Heading>
                    <Text className="text-gray-600 mb-4 line-clamp-3">
                      {journey.shortDescription || journey.description}
                    </Text>
                    <div className="flex justify-between items-center mb-4">
                      <Text className="text-sm text-gray-500">
                        {journey.duration}
                      </Text>
                      <Text className="text-lg font-semibold text-primary-600">
                        ${journey.price}
                      </Text>
                    </div>
                    <Link href={`/journeys/${journey.slug || journey.id}`}>
                      <Button variant="primary" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </Section>

      {/* Northwest China Map Section */}
      {isNorthwestChina && (
        <>
          <Section id="map" background="primary" padding="xl" className="py-16">
            <Container size="xl">
              <Heading level={2} className="text-3xl font-heading mb-4">
                Map
              </Heading>
              <Text className="text-lg text-gray-600">
                A detailed map of Northwest China and featured journeys will appear here.
              </Text>
            </Container>
          </Section>

          {/* Why With Us Section */}
          <Section id="why-with-us" background="primary" padding="xl" className="py-16">
            <Container size="xl">
              <Heading level={2} className="text-3xl font-heading mb-4">
                Why travel with Korascale in Northwest China
              </Heading>
              <Text className="text-lg text-gray-600 max-w-3xl">
                We combine local expertise, carefully vetted partners, and immersive cultural access to craft journeys
                across Northwest China that are safe, seamless and deeply enriching.
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
                Share your group size, timing and interests, and our team will design a Northwest China itinerary just
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
