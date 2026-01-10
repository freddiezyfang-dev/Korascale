'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Journey } from '@/types';

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

  // 转换 Journey 格式以适配组件显示
  const transformedJourneys = useMemo(() => {
    return filteredJourneys.map(journey => ({
      id: journey.id,
      title: journey.title,
      duration: journey.duration || 'N/A',
      destinations: journey.highlights?.slice(0, 4) || [],
      image: journey.image || journey.heroImage || '/images/placeholder.jpg',
      slug: journey.slug,
      isPrivate: journey.journeyType === 'Deep Discovery'
    }));
  }, [filteredJourneys]);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Tabs */}
        <div className="flex justify-center mb-12">
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

        {/* Journey Cards or Empty State */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-sans" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Loading journeys...
            </p>
          </div>
        ) : transformedJourneys.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 max-w-2xl text-center">
              <p 
                className="text-gray-600 italic font-serif text-lg"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                No journeys currently available for this category. Please contact us for a custom itinerary.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-8">
              {transformedJourneys.slice(0, 3).map((journey) => (
              <div
                key={journey.id}
                className="flex flex-col md:flex-row bg-white shadow-lg overflow-hidden rounded-lg"
              >
                {/* Left: 16:9 cinematic image */}
                <div className="relative w-full md:w-[60%] aspect-video overflow-hidden">
                  <img
                    src={journey.image}
                    alt={journey.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* TRAVEL PRIVATELY tag */}
                  {journey.isPrivate && (
                    <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1.5 text-xs font-sans tracking-wider uppercase">
                      TRAVEL PRIVATELY
                    </div>
                  )}
                </div>

                {/* Right: Tan background container */}
                <div className="w-full md:w-[40%] bg-[#E6D5B8] p-8 flex flex-col justify-between">
                  <div>
                    {/* Title */}
                    <h3
                      className="text-2xl md:text-3xl font-serif mb-4"
                      style={{ fontFamily: 'Playfair Display, serif' }}
                    >
                      {journey.title}
                    </h3>

                    {/* Duration */}
                    <p className="text-sm font-sans mb-4 text-gray-700" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {journey.duration}
                    </p>

                    {/* Destinations list */}
                    <ul className="space-y-2 mb-6">
                      {journey.destinations.map((destination, index) => (
                        <li
                          key={index}
                          className="text-sm font-sans text-gray-700"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                          • {destination}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Button: Bottom right */}
                  <div className="flex justify-end">
                    <Link href={`/journeys/${journey.slug}`}>
                      <button
                        className="bg-black text-white px-6 py-3 font-sans text-sm font-medium hover:bg-gray-800 transition-colors"
                        style={{ fontFamily: 'Montserrat, sans-serif' }}
                      >
                        View Journey
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            </div>
            
            {/* View All Journeys Button */}
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
          </>
        )}
      </div>
    </section>
  );
}
