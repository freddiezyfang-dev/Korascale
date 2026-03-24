'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Journey } from '@/types';
import { getRenderableImageUrl } from '@/lib/imageUtils';

interface RecommendedJourneySectionProps {
  journeys: Journey[];
  placeName: string;
  isLoading?: boolean;
}

export default function RecommendedJourneySection({
  journeys,
  placeName,
  isLoading = false
}: RecommendedJourneySectionProps) {
  const [activeTab, setActiveTab] = useState<'private' | 'group'>('group');
  const hasInitializedTabRef = useRef(false);

  const groupJourneys = useMemo(
    () => journeys.filter((journey) => journey.journeyType === 'Explore Together' || !journey.journeyType),
    [journeys]
  );
  const privateJourneys = useMemo(
    () => journeys.filter((journey) => journey.journeyType === 'Deep Discovery'),
    [journeys]
  );

  // 根据标签过滤旅程
  const filteredJourneys = useMemo(() => {
    if (!journeys || journeys.length === 0) return [];
    
    return journeys.filter(journey => {
      if (activeTab === 'private') {
        // Deep Discovery = private journeys
        return journey.journeyType === 'Deep Discovery';
      } else {
        // Explore Together = group journeys
        return journey.journeyType === 'Explore Together' || !journey.journeyType;
      }
    });
  }, [journeys, activeTab]);

  // 首次进入页面：若无 Explore Together 但有 Deep Discovery，默认定位到 Deep Discovery
  useEffect(() => {
    if (hasInitializedTabRef.current || isLoading) return;

    if (groupJourneys.length === 0 && privateJourneys.length > 0) {
      setActiveTab('private');
    }
    hasInitializedTabRef.current = true;
  }, [groupJourneys.length, privateJourneys.length, isLoading]);

  // 转换 Journey 格式以适配组件显示
  const transformedJourneys = useMemo(() => {
    return filteredJourneys.map(journey => ({
      id: journey.id,
      title: journey.title,
      description: journey.shortDescription || journey.description || '',
      // 不在这里写死 placeholder 路径；由 getRenderableImageUrl 在渲染时兜底
      image: journey.image || journey.heroImage || '',
      slug: journey.slug,
      isPrivate: journey.journeyType === 'Deep Discovery'
    }));
  }, [filteredJourneys]);

  const displayJourneys = useMemo(() => transformedJourneys.slice(0, 3), [transformedJourneys]);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Tabs */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setActiveTab('group')}
              className={`px-6 py-3 rounded-md transition-all font-sans text-sm font-medium uppercase ${
                activeTab === 'group'
                  ? 'bg-[#E6D5B8] text-black'
                  : 'text-gray-600 hover:text-gray-900 bg-transparent'
              }`}
              style={{
                fontFamily: 'Montserrat, sans-serif',
                letterSpacing: activeTab === 'group' ? '0.1em' : '0.05em'
              }}
            >
              Explore Together
            </button>
            <button
              onClick={() => setActiveTab('private')}
              className={`px-6 py-3 rounded-md transition-all font-sans text-sm font-medium uppercase ${
                activeTab === 'private'
                  ? 'bg-[#E6D5B8] text-black'
                  : 'text-gray-600 hover:text-gray-900 bg-transparent'
              }`}
              style={{
                fontFamily: 'Montserrat, sans-serif',
                letterSpacing: activeTab === 'private' ? '0.1em' : '0.05em'
              }}
            >
              Deep Discovery
            </button>
          </div>
        </div>

        {/* Journey Cards */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-sans" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Loading journeys...
            </p>
          </div>
        ) : (
          <>
            {displayJourneys.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayJourneys.map((journey) => (
                  <Link
                    key={journey.id}
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
                        <p className="text-sm md:text-base font-light leading-relaxed opacity-90 max-w-[280px]">
                          {journey.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
            
            {/* View All Journeys Button */}
            {displayJourneys.length > 0 ? (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => {
                    const filterSection = document.getElementById('journey-filter');
                    if (filterSection) {
                      filterSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  className="px-8 py-3 bg-black text-white font-sans text-sm font-medium hover:bg-gray-800 transition-colors uppercase tracking-wider"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  View All Journeys
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
