'use client';

import Link from 'next/link';
import { Experience } from '@/types/experience';

interface ExperienceCardsGridProps {
  experiences: Experience[];
  placeName: string;
  isLoading?: boolean;
}

// Skeleton Card Component
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
      {/* Top: Fixed aspect ratio image skeleton */}
      <div className="relative w-full aspect-[4/3] bg-gray-200" />
      
      {/* Middle: Content skeleton */}
      <div className="p-6">
        <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-full mb-1" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
      
      {/* Bottom: Button skeleton */}
      <div className="px-6 pb-6">
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default function ExperienceCardsGrid({
  experiences,
  placeName,
  isLoading = false
}: ExperienceCardsGridProps) {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p
            className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-sans"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            AMAZING EXPERIENCES IN {placeName.toUpperCase()}
          </p>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-serif"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Bring your {placeName} adventure to life...
          </h2>
        </div>

        {/* Grid: 4 columns on desktop, 1 on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            // Show 4 skeleton cards while loading
            Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={`skeleton-${index}`} />
            ))
          ) : experiences.length === 0 ? (
            // Show 4 skeleton cards if no experiences
            Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={`skeleton-empty-${index}`} />
            ))
          ) : (
            experiences.map((experience) => {
              // 提取 location 和 country 从 experience 数据
              const locationParts = experience.location?.split(',') || [experience.city || '', experience.region || ''];
              const location = locationParts[0]?.trim() || experience.city || '';
              const country = locationParts[1]?.trim() || experience.region || 'China';
              
              return (
            <div
              key={experience.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Top: Fixed aspect ratio image */}
              <div className="relative w-full aspect-[4/3] overflow-hidden">
                <img
                  src={experience.image}
                  alt={experience.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Middle: Location and description */}
              <div className="p-6">
                <p
                  className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 font-sans"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  {location.toUpperCase()}, {country.toUpperCase()}
                </p>
                <h3
                  className="text-lg font-serif mb-3"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {experience.title}
                </h3>
                <p
                  className="text-sm text-gray-600 font-serif leading-relaxed"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {experience.shortDescription || experience.description}
                </p>
              </div>

              {/* Bottom: Learn More button */}
              <div className="px-6 pb-6">
                <Link href={`/experiences/${experience.slug}`}>
                  <button
                    className="w-full border border-gray-300 px-4 py-2 text-sm font-sans tracking-wider uppercase hover:bg-gray-50 transition-colors"
                    style={{ 
                      fontFamily: 'Montserrat, sans-serif',
                      letterSpacing: '0.1em'
                    }}
                  >
                    Learn More
                  </button>
                </Link>
              </div>
            </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
