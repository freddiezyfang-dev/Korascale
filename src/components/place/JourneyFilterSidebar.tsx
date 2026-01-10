'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Journey, JourneyType } from '@/types';

interface JourneyFilterSidebarProps {
  journeys: Journey[];
  onFilterChange?: (filteredJourneys: Journey[]) => void;
  placeName?: string;
  autoSelectPlace?: string; // 自动选中的 place 名称
}

// 解析 Journey Type（与 journey 页面一致）
const resolveJourneyType = (journey: any): JourneyType => {
  if ('journeyType' in journey && journey.journeyType) {
    return journey.journeyType as JourneyType;
  }
  return 'Explore Together'; // 默认值
};

export default function JourneyFilterSidebar({
  journeys,
  onFilterChange,
  placeName,
  autoSelectPlace
}: JourneyFilterSidebarProps) {
  // Journey Type 选项
  const journeyTypeOptions: { value: JourneyType; label: string }[] = [
    { value: 'Explore Together', label: 'Explore Together' },
    { value: 'Deep Discovery', label: 'Deep Discovery' },
    { value: 'Signature Journeys', label: 'Signature Journeys' },
    { value: 'Group Tours', label: 'Group Tours' }
  ];

  // Region 选项 - 移除 'All'
  const regionOptions = [
    'Southwest China',
    'Northwest&Northern Frontier',
    'North China',
    'South China',
    'East&Central China'
  ];

  // Place 选项 - 移除 'All'
  const placeOptions = [
    'Tibetan Plateau & Kham Region',
    'Yunnan–Guizhou Highlands',
    'Sichuan Basin & Mountains',
    'Chongqing & Three Gorges',
    'Zhangjiajie',
    'Silk Road Corridor',
    'Qinghai–Tibet Plateau',
    'Xi\'an',
    'Xinjiang Oases & Deserts',
    'Inner Mongolian Grasslands',
    'Beijing',
    'Loess & Shanxi Heritage',
    'Northeastern Forests',
    'Canton',
    'Guilin',
    'Hakka Fujian',
    'Wuhan',
    'Shanghai',
    'WaterTowns',
    'Hangzhou',
    'Yellow Mountain & Southern Anhui'
  ];

  // Duration 选项 - 移除 'All'
  const durationOptions = ['1 Day', '2 Days', '3 Days', '4 Days'];

  // Interests 选项 - 移除 'All'
  const interestOptions = ['Nature', 'Culture', 'History', 'City', 'Cruises'];

  // 初始化状态 - 使用 null 表示未选择（不应用过滤），如果有 autoSelectPlace 则默认选中
  const [selectedJourneyType, setSelectedJourneyType] = useState<JourneyType | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<string | null>(autoSelectPlace || null);
  const [searchTerm, setSearchTerm] = useState('');

  // 当 autoSelectPlace 改变时，更新 selectedPlace
  useEffect(() => {
    if (autoSelectPlace) {
      setSelectedPlace(autoSelectPlace);
    }
  }, [autoSelectPlace]);

  // 过滤逻辑 - 如果 filter 为 null，则不过滤
  const filteredJourneys = useMemo(() => {
    const filtered = journeys.filter(journey => {
      // 安全地检查 status 属性（默认 journeys 可能没有这个属性）
      const isActive = 'status' in journey ? journey.status === 'active' : true;
      const journeyType = resolveJourneyType(journey);
      // 只有当 filter 有值时才应用过滤，null 表示不过滤
      const matchesJourneyType = selectedJourneyType === null || journeyType === selectedJourneyType;
      const matchesRegion = selectedRegion === null || journey.region === selectedRegion;
      const matchesDuration = selectedDuration === null || journey.duration === selectedDuration;
      const matchesInterest = selectedInterest === null || journey.category === selectedInterest;
      const matchesPlace = selectedPlace === null || ('place' in journey && journey.place && journey.place === selectedPlace);
      const matchesSearch = searchTerm === '' || 
        journey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (journey.description && journey.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (journey.shortDescription && journey.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return isActive && matchesJourneyType && matchesRegion && matchesDuration && matchesInterest && matchesPlace && matchesSearch;
    });
    
    return filtered;
  }, [journeys, selectedJourneyType, selectedRegion, selectedDuration, selectedInterest, selectedPlace, searchTerm]);

  // 通知父组件过滤变化
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filteredJourneys);
    }
  }, [filteredJourneys, onFilterChange]);

  return (
    <div className="bg-[#f5f1e6] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="flex gap-8">
          {/* Filter Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-2xl font-['Monda'] font-bold mb-6">Filter</h3>
              
              {/* Journey Type Filter */}
              <div className="mb-8">
                <h4 className="text-base font-['Monda'] font-bold mb-4">JOURNEY TYPE</h4>
                <div className="flex flex-wrap gap-2">
                  {journeyTypeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
                        selectedJourneyType === opt.value ? 'bg-gray-200' : 'bg-white'
                      }`}
                      style={{
                        color: 'black',
                        backgroundColor: selectedJourneyType === opt.value ? '#e5e7eb' : 'white'
                      }}
                      onClick={() => setSelectedJourneyType(selectedJourneyType === opt.value ? null : opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Regions Filter */}
              <div className="mb-8">
                <h4 className="text-base font-['Monda'] font-bold mb-4">REGIONS</h4>
                <div className="flex flex-wrap gap-2">
                  {regionOptions.map((region) => (
                    <button
                      key={region}
                      className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
                        selectedRegion === region ? 'bg-gray-200' : 'bg-white'
                      }`}
                      style={{
                        color: 'black',
                        backgroundColor: selectedRegion === region ? '#e5e7eb' : 'white'
                      }}
                      onClick={() => setSelectedRegion(selectedRegion === region ? null : region)}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>

              {/* Places Filter */}
              <div className="mb-8">
                <h4 className="text-base font-['Monda'] font-bold mb-4">PLACES</h4>
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                  {placeOptions.map((place) => (
                    <button
                      key={place}
                      className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
                        selectedPlace === place ? 'bg-gray-200' : 'bg-white'
                      }`}
                      style={{
                        color: 'black',
                        backgroundColor: selectedPlace === place ? '#e5e7eb' : 'white'
                      }}
                      onClick={() => setSelectedPlace(selectedPlace === place ? null : place)}
                    >
                      {place}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interests Filter */}
              <div className="mb-8">
                <h4 className="text-base font-['Monda'] font-bold mb-4">INTERESTS</h4>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => (
                    <button
                      key={interest}
                      className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
                        selectedInterest === interest ? 'bg-gray-200' : 'bg-white'
                      }`}
                      style={{
                        color: 'black',
                        backgroundColor: selectedInterest === interest ? '#e5e7eb' : 'white'
                      }}
                      onClick={() => setSelectedInterest(selectedInterest === interest ? null : interest)}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Filter */}
              <div className="mb-8">
                <h4 className="text-base font-['Monda'] font-bold mb-4">DURATION</h4>
                <div className="flex flex-wrap gap-2">
                  {durationOptions.map((duration) => (
                    <button
                      key={duration}
                      className={`px-3 py-2 border border-black rounded text-sm font-['Monda'] hover:bg-gray-100 ${
                        selectedDuration === duration ? 'bg-gray-200' : 'bg-white'
                      }`}
                      style={{
                        color: 'black',
                        backgroundColor: selectedDuration === duration ? '#e5e7eb' : 'white'
                      }}
                      onClick={() => setSelectedDuration(selectedDuration === duration ? null : duration)}
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="flex-1">
            <h2 className="text-3xl font-['Montaga'] mb-8">
              {placeName ? `Journeys in ${placeName}` : 'See Where We Can Take You'}
            </h2>
            
            {/* Search Bar */}
            <div className="mb-8">
              <input
                type="text"
                placeholder="Search journeys..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                style={{ fontFamily: 'Monda, sans-serif' }}
              />
            </div>

            {/* Journey Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJourneys.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-600 font-serif italic" style={{ fontFamily: 'Playfair Display, serif' }}>
                    No journeys found matching your filters.
                  </p>
                </div>
              ) : (
                filteredJourneys.map((journey) => {
                  const maxGuests = journey.maxGuests || journey.maxParticipants || null;
                  const price = typeof journey.price === 'number' ? `$${journey.price}` : 'N/A';
                  
                  return (
                    <Link
                      key={journey.id}
                      href={`/journeys/${journey.slug}`}
                      className="block h-full"
                    >
                      <div className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full bg-[#f5f1e6] cursor-pointer rounded-lg">
                        <div 
                          className="h-48 bg-cover bg-center bg-no-repeat flex-shrink-0"
                          style={{ backgroundImage: `url('${journey.image || journey.heroImage}')` }}
                        />
                        <div className="p-4 flex flex-col flex-1">
                          <h3 
                            className="text-lg font-['Montaga'] mb-2 leading-tight flex-shrink-0 font-normal"
                            style={{ fontWeight: 400 }}
                          >
                            {journey.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-shrink-0" style={{ fontFamily: 'Monda, sans-serif' }}>
                            {journey.shortDescription || journey.description || ''}
                          </p>
                          <div className="mt-auto flex flex-col flex-shrink-0">
                            <p
                              className="text-sm mb-1"
                              style={{ fontFamily: 'Monda, sans-serif', color: '#000000', fontWeight: 400, fontSize: '0.875rem' }}
                            >
                              {journey.duration || 'N/A'}{maxGuests ? ` • Limited to ${maxGuests} guests` : ''}
                            </p>
                            <p
                              className="text-sm"
                              style={{ fontFamily: 'Monda, sans-serif', color: '#000000', fontWeight: 400, fontSize: '0.875rem' }}
                            >
                              {price !== 'N/A' ? `Priced from ${price}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
