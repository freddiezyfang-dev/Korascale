'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Section, Container, Heading, Text, Breadcrumb, Card, Button } from '@/components/common';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { JourneyType } from '@/types';

// Journey Type 到 Slug 的映射
const JourneyTypeToSlug: Record<JourneyType, string> = {
  'Explore Together': 'explore-together',
  'Deep Discovery': 'deep-discovery',
  'Signature Journeys': 'signature-journeys'
};

// Slug 到 Journey Type 的映射
const SlugToJourneyType: Record<string, JourneyType> = {
  'explore-together': 'Explore Together',
  'deep-discovery': 'Deep Discovery',
  'signature-journeys': 'Signature Journeys'
};

// Journey Type 到 Hero 图片的映射
const JourneyTypeToHeroImage: Record<JourneyType, string> = {
  'Explore Together': '/images/journey-cards/chengdu-deep-dive.jpeg',
  'Deep Discovery': '/images/journey-cards/jiuzhaigou-valley-multi-color-lake.jpeg',
  'Signature Journeys': '/images/journey-cards/jiuzhaigou-huanglong-national-park-tour.jpg'
};

// Journey Type 的描述
const JourneyTypeDescriptions: Record<JourneyType, string> = {
  'Explore Together': 'Immersive day experiences and micro adventures designed for quick inspiration.',
  'Deep Discovery': 'Multi-day journeys that dive beneath the surface of local culture, nature, and cuisine.',
  'Signature Journeys': 'Premium, curated expeditions with elevated service, exclusive access, and unforgettable moments.'
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

export default function JourneyTypePage() {
  const params = useParams();
  const { journeys, isLoading } = useJourneyManagement();
  
  const typeSlug = Array.isArray(params?.type) ? params?.type[0] : (params?.type as string);
  const journeyType = SlugToJourneyType[typeSlug || ''];
  
  // 筛选对应类型的 journeys
  const filteredJourneys = useMemo(() => {
    if (!journeyType) return [];
    return journeys.filter(journey => {
      const isActive = 'status' in journey ? journey.status === 'active' : true;
      const jType = resolveJourneyType(journey);
      return isActive && jType === journeyType;
    });
  }, [journeys, journeyType]);

  const heroImage = journeyType ? JourneyTypeToHeroImage[journeyType] : '';
  const description = journeyType ? JourneyTypeDescriptions[journeyType] : '';

  if (!journeyType) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Text>页面不存在</Text>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Text>加载中...</Text>
      </div>
    );
  }

  return (
    <main>
      {/* Hero Section */}
      <Section background="primary" padding="none" className="relative h-[520px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${heroImage}')` }}
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center text-white">
            <Breadcrumb 
              items={[
                { label: 'Home', href: '/' },
                { label: 'Journeys', href: '/journeys' },
                { label: journeyType }
              ]}
              color="#FFFFFF"
              sizeClassName="text-lg md:text-xl"
              className="mb-4"
            />
            <Heading 
              level={1} 
              className="text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight mb-4" 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                color: '#FFFFFF'
              }}
            >
              {journeyType}
            </Heading>
            <Text className="text-lg text-white/90 max-w-2xl mx-auto">
              {description}
            </Text>
          </div>
        </div>
      </Section>

      {/* Journeys Grid Section */}
      <Section background="secondary" padding="xl" className="py-16">
        <Container size="xl">
          {filteredJourneys.length === 0 ? (
            <div className="text-center py-20">
              <Text className="text-gray-600 text-lg mb-4">
                暂无 {journeyType} 类型的旅程
              </Text>
              <Link href="/journeys">
                <Button variant="primary">
                  返回所有旅程
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <Text className="text-gray-600">
                  找到 {filteredJourneys.length} 个 {journeyType} 旅程
                </Text>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJourneys.map((journey) => (
                  <Card key={journey.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
                    <div 
                      className="h-48 bg-cover bg-center bg-no-repeat flex-shrink-0"
                      style={{ backgroundImage: `url('${journey.image}')` }}
                    />
                    <div className="p-4 bg-[#fff6da] flex flex-col flex-1">
                      <h3 className="text-lg font-['Montaga'] mb-2 leading-tight flex-shrink-0">
                        {journey.title}
                      </h3>
                      <Text className="text-sm text-gray-600 mb-3 line-clamp-2 flex-shrink-0">
                        {('shortDescription' in journey && journey.shortDescription) 
                          || ('description' in journey && journey.description) 
                          || ''}
                      </Text>
                      <div className="flex justify-between items-center text-sm text-gray-600 mb-4 flex-shrink-0">
                        <span className="font-['Monda']">{journey.duration}</span>
                        <span className="font-['Monda'] font-bold text-primary-600">
                          {('price' in journey && typeof journey.price === 'number') 
                            ? `$${journey.price}` 
                            : ('price' in journey ? journey.price : 'N/A')}
                        </span>
                      </div>
                      <div className="mt-auto pt-3">
                        <Link 
                          href={('slug' in journey && journey.slug) 
                            ? `/journeys/${journey.slug}` 
                            : ('link' in journey && journey.link) 
                              ? journey.link 
                              : '#'} 
                          className="block"
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </Container>
      </Section>
    </main>
  );
}

