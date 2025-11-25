'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from "next/link";
import { Container, Section, Heading, Text, Button, Card, Breadcrumb } from '@/components/common';
import { useJourneyManagement } from '@/context/JourneyManagementContext';

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
  }
};

export default function RegionDestinationsPage() {
  const params = useParams();
  const region = params.region as string;
  const { journeys } = useJourneyManagement();
  
  const [filteredJourneys, setFilteredJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const regionInfo = regionMap[region];

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

      {/* Journeys Section */}
      <Section background="secondary" padding="xl" className="py-24">
        <Container size="xl">
          <div className="text-center mb-16">
            <Heading level={2} className="text-4xl font-heading mb-4">
              Available Journeys
            </Heading>
            <Text className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the best experiences in {regionInfo.name}
            </Text>
          </div>

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
    </main>
  );
}
