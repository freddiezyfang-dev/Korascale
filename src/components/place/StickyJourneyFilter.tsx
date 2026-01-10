'use client';

import { useState, useEffect } from 'react';

interface FilterOption {
  label: string;
  value: string;
}

interface StickyJourneyFilterProps {
  regions?: FilterOption[];
  durations?: FilterOption[];
  interests?: FilterOption[];
  onFilterChange?: (filters: {
    region: string;
    duration: string;
    interest: string;
  }) => void;
}

export default function StickyJourneyFilter({
  regions = [],
  durations = [],
  interests = [],
  onFilterChange
}: StickyJourneyFilterProps) {
  const [isSticky, setIsSticky] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedDuration, setSelectedDuration] = useState('All');
  const [selectedInterest, setSelectedInterest] = useState('All');

  // 监听滚动，实现粘性效果
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsSticky(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 通知父组件过滤变化
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        region: selectedRegion,
        duration: selectedDuration,
        interest: selectedInterest
      });
    }
  }, [selectedRegion, selectedDuration, selectedInterest, onFilterChange]);

  return (
    <div
      className={`bg-white border-b border-gray-200 transition-all duration-300 ${
        isSticky ? 'fixed top-0 left-0 right-0 z-50 shadow-md' : 'relative'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          {/* Region Filter */}
          {regions.length > 0 && (
            <div className="flex items-center gap-2">
              <label
                className="text-sm font-sans text-gray-600 whitespace-nowrap"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Region:
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#E6D5B8]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {regions.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Duration Filter */}
          {durations.length > 0 && (
            <div className="flex items-center gap-2">
              <label
                className="text-sm font-sans text-gray-600 whitespace-nowrap"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Duration:
              </label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#E6D5B8]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {durations.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Interest Filter */}
          {interests.length > 0 && (
            <div className="flex items-center gap-2">
              <label
                className="text-sm font-sans text-gray-600 whitespace-nowrap"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Interest:
              </label>
              <select
                value={selectedInterest}
                onChange={(e) => setSelectedInterest(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#E6D5B8]"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {interests.map((interest) => (
                  <option key={interest.value} value={interest.value}>
                    {interest.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
