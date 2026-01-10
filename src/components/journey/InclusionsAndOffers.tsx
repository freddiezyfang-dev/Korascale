'use client';

import React, { useState, useMemo } from 'react';
import { Journey } from '@/types';
import OfferIcon from './OfferIcon';

// 1px 极细线性图标
const ThinLineIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M4 8L6.5 10.5L12 5" 
      stroke="#333" 
      strokeWidth="1" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

interface InclusionsAndOffersProps {
  journey: Journey;
  onBookingClick?: (date: Date) => void;
}

// 格式化日期
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch {
    return '';
  }
};

// 生成标准化文案
const generateStandardText = (offer: { type?: string; discount?: string; deadline?: string; description?: string }): string => {
  // 如果提供了自定义描述，优先使用
  if (offer.description && offer.description.trim()) {
    return offer.description;
  }

  const discountValue = offer.discount || '';
  const date = offer.deadline ? formatDate(offer.deadline) : '';
  const dateText = date ? ` booked by ${date}` : '';

  // 根据类型生成标准文案（精确匹配）
  const offerType = offer.type || '';
  
  if (offerType === 'Companion Discount') {
    return `Save ${discountValue} per person for groups of 2 or more on select departures${dateText}.`;
  } else if (offerType === 'Promotional Offer') {
    return `Save ${discountValue} per person on select departures${dateText}.`;
  } else if (offerType === 'Government Subsidy') {
    return `Exclusive ${discountValue} government travel incentive applied to select departures${dateText}.`;
  }

  // 默认文案（如果没有匹配到类型，但提供了 discount）
  if (discountValue) {
    return `${discountValue} on select departures${dateText}.`;
  }

  return '';
};

export default function InclusionsAndOffers({ journey, onBookingClick }: InclusionsAndOffersProps) {
  // 获取 offers 列表
  const offersList = journey.offers || [];

  // Select Your Date 相关状态
  const today = useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = useState(0);
  const baseDate = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + monthOffset, 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today, monthOffset]);

  // 生成日期列表
  const dateList = useMemo(() => {
    const list: Array<{
      startDate: Date;
      endDate: Date;
      price: number;
      originalPrice?: number;
      status: 'Available' | 'Limited' | 'Call';
    }> = [];
    
    const todayDate = new Date();
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(todayDate.getFullYear(), todayDate.getMonth() + i, 1);
      if (monthDate < todayDate) continue;
      
      const startDate = new Date(monthDate);
      const days = parseInt(journey.duration?.split(' ')[0] || '9');
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days - 1);
      
      list.push({
        startDate,
        endDate,
        price: journey.price,
        originalPrice: journey.originalPrice,
        status: i < 3 ? 'Available' : i < 6 ? 'Limited' : 'Call'
      });
    }
    
    return list.filter(item => 
      item.startDate.getFullYear() === baseDate.getFullYear()
    );
  }, [journey.duration, journey.price, journey.originalPrice, baseDate]);

  const handleDateClick = (date: Date) => {
    if (onBookingClick) {
      onBookingClick(date);
    }
  };

  // 获取 inclusions 列表（从 standardInclusions 生成）
  const inclusionsList = useMemo(() => {
    if (!journey.standardInclusions) return [];
    
    const phrases = {
      airportTransfers: 'Airport Meet and Greet with Private Transfers',
      entranceFees: 'Entrance Fees, Taxes and All Gratuities Except Resident Tour Director',
      support24_7: '24/7 On-Call Support',
      insurance: 'Comprehensive Travel Insurance',
      meals: 'Daily Breakfast, Lunch, and Dinner',
      transportation: 'Premium Private Transportation',
      accommodations: 'Hand-selected Luxury Hotels',
      tourGuides: 'English-speaking or other language-speaking tour guides',
      highSpeedRails: 'Mainland China domestic High-speed rails',
      internationalFlights: 'International flights to and from Mainland China',
      optionalActivities: 'Optional activities available for purchase on-site',
      handicraftExperiences: 'Authentic local handicraft experiences',
      personalExpenses: 'Personal expenses during leisure time',
    };
    
    return Object.entries(journey.standardInclusions)
      .filter(([_, isActive]) => isActive)
      .map(([key, _]) => phrases[key as keyof typeof phrases])
      .filter(Boolean);
  }, [journey.standardInclusions]);

  return (
    <section className="w-full py-16 bg-[#FAF9F6]">
      <div className="w-full max-w-[1440px] mx-auto px-8 lg:px-20">
        {/* 1. Offers 置于最上方，作为全宽警告/通知栏 (参考 A&K 风格) */}
        {offersList.length > 0 && (
          <div className="flex flex-col mb-16 max-w-[800px]">
            {offersList.map((offer, idx) => (
              <div 
                key={idx} 
                className="border-l-4 border-[#8B4513] bg-white p-8 mb-4 flex items-start gap-6 shadow-sm"
              >
                <div className="mt-1 flex-shrink-0 text-[#333]">
                  <OfferIcon />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">
                    Offer
                  </p>
                  <p className="text-sm text-gray-800 leading-relaxed font-medium">
                    {generateStandardText(offer)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Inclusions 与 Dates 的 左右布局 (关键修改) */}
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          
          {/* 左侧：Inclusions 垂直列表 */}
          <div className="flex-1">
            <h3 className="text-2xl font-heading mb-8 text-gray-900">Includes</h3>
            {inclusionsList.length > 0 ? (
              <div className="flex flex-col gap-6">
                {inclusionsList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-5 group">
                    <div className="w-5 h-5 flex-shrink-0 text-gray-800 mt-0.5 opacity-80">
                      <ThinLineIcon /> 
                    </div>
                    <p className="text-[14px] text-gray-700 font-light leading-snug">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No inclusion details available for this journey.</p>
            )}
          </div>

          {/* 右侧：Select Your Date 模块 */}
          <div className="lg:w-[500px] lg:flex-shrink-0 lg:border-l lg:pl-16 border-gray-200">
            <h3 className="text-2xl font-heading mb-8 text-gray-900">Select Your Date</h3>
            
            {/* 年份切换 */}
            <div className="flex gap-8 border-b border-gray-200 mb-8">
              {[2025, 2026].map((year) => (
                <button
                  key={year}
                  className={`pb-4 text-sm font-medium transition-colors ${
                    baseDate.getFullYear() === year
                      ? 'border-b-2 border-black font-medium'
                      : 'text-gray-400'
                  }`}
                  onClick={() => {
                    const currentMonth = baseDate.getMonth();
                    const newDate = new Date(year, currentMonth, 1);
                    const todayDate = new Date();
                    const monthsDiff = (newDate.getFullYear() - todayDate.getFullYear()) * 12 + (newDate.getMonth() - todayDate.getMonth());
                    setMonthOffset(Math.max(0, Math.min(11, monthsDiff)));
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
            
            {/* 日期列表 */}
            <div className="space-y-4">
              {dateList.map((item, index) => {
                const startStr = item.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const endStr = item.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const dateRange = `${startStr} - ${endStr}`;
                
                return (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-sm shadow-sm hover:shadow-md transition-shadow flex items-center justify-between gap-6"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-gray-900 font-medium">{dateRange}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.status === 'Available' 
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'Limited'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.status === 'Call' ? 'Call for Availability' : `${item.status} Availability`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-heading text-gray-900">
                          ${item.price.toLocaleString()}
                        </span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="text-sm text-gray-500 line-through">
                            ${item.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDateClick(item.startDate)}
                      className="px-6 py-2 bg-black text-white text-xs tracking-widest uppercase hover:bg-gray-800 transition-colors whitespace-nowrap"
                    >
                      Book Now
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

