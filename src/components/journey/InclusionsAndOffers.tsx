'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Journey } from '@/types';
import OfferIcon from './OfferIcon';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
const generateStandardText = (offer: { type?: string; discount?: string; startDate?: string; deadline?: string; description?: string }): string => {
  // 如果提供了自定义描述，优先使用
  if (offer.description && offer.description.trim()) {
    return offer.description;
  }

  const discountValue = offer.discount || '';
  const startDate = offer.startDate ? formatDate(offer.startDate) : '';
  const deadline = offer.deadline ? formatDate(offer.deadline) : '';
  
  // 构建日期文本
  let dateText = '';
  if (startDate && deadline) {
    dateText = ` from ${startDate} to ${deadline}`;
  } else if (deadline) {
    dateText = ` booked by ${deadline}`;
  } else if (startDate) {
    dateText = ` from ${startDate}`;
  }

  // 根据类型生成标准文案（精确匹配）
  const offerType = offer.type || '';
  
  if (offerType === 'Companion Discount') {
    return `Save ${discountValue} per person for groups of 2 or more on select departures${dateText}.`;
  } else if (offerType === 'Promotional Offer') {
    return `Save ${discountValue} per person on select departures${dateText}.`;
  } else if (offerType === 'Government Subsidy') {
    return `Exclusive ${discountValue} government travel incentive applied to select departures${dateText}.`;
  } else if (offerType === 'Early Bird Discount') {
    return `Save ${discountValue} per person when you book early on select departures${dateText}.`;
  }

  // 默认文案（如果没有匹配到类型，但提供了 discount）
  if (discountValue) {
    return `${discountValue} on select departures${dateText}.`;
  }

  return '';
};

export default function InclusionsAndOffers({ journey, onBookingClick }: InclusionsAndOffersProps) {
  // Select Your Date 相关状态
  const today = useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = useState(0);
  const baseDate = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + monthOffset, 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today, monthOffset]);

  // 根据日期项中的 offer 计算折扣百分比（向后兼容，用于自动生成的日期）
  // 现在折扣信息直接存储在 availableDates 中，不再需要从 offers 列表获取
  const getDiscountPercentage = useMemo(() => {
    return (date: Date): number => {
      // 自动生成的日期不再使用全局 offers，折扣信息在 availableDates 中
      return 0;
    };
  }, []);

  // 展开/折叠状态管理
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const toggleDateExpand = (dateId: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateId)) {
        newSet.delete(dateId);
      } else {
        newSet.add(dateId);
      }
      return newSet;
    });
  };

  // 生成所有日期列表（不按月份过滤，用于获取所有年份）
  const allDatesList = useMemo(() => {
    // 根据 offerType 创建 offer 对象（内部函数，避免外部引用）
    const createOfferFromDateItem = (dateItem: any) => {
      if (!dateItem.offerType || dateItem.offerType === 'No Offer') return null;
      return {
        type: dateItem.offerType,
        discount: dateItem.offerDiscount || '',
        description: dateItem.offerDescription || ''
      };
    };

    // 如果存在后台管理的日期，优先使用
    if (journey.availableDates && journey.availableDates.length > 0) {
      return journey.availableDates
        .map(dateItem => {
          const startDate = new Date(dateItem.startDate);
          const endDate = new Date(dateItem.endDate);
          
          // 获取关联的 offer（从日期项中直接获取）
          const associatedOffer = createOfferFromDateItem(dateItem);
          
          // 基础价格来自 journey.price
          const basePrice = journey.price || 0;
          
          // 使用日期项中已计算的价格（后台已根据 discountPercentage 计算）
          // 如果价格未设置或为0，则使用基础价格
          let finalPrice = dateItem.price && dateItem.price > 0 ? dateItem.price : basePrice;
          
          // 如果日期关联了 offer，从 offer 中计算折扣（覆盖后台计算的折扣）
          let discountPercentage = dateItem.discountPercentage;
          if (associatedOffer && associatedOffer.discount) {
            const discountStr = associatedOffer.discount.trim();
            if (discountStr.endsWith('%')) {
              discountPercentage = parseFloat(discountStr.replace('%', ''));
              finalPrice = basePrice * (1 - (discountPercentage || 0) / 100);
            } else if (discountStr.startsWith('$')) {
              // 如果是固定金额折扣
              const discountAmount = parseFloat(discountStr.replace('$', '').replace(/,/g, ''));
              if (!isNaN(discountAmount) && basePrice > 0) {
                finalPrice = Math.max(0, basePrice - discountAmount);
                discountPercentage = (discountAmount / basePrice) * 100;
              }
            }
          } else if (discountPercentage && discountPercentage > 0) {
            // 使用后台配置的折扣
            const discountType = dateItem.discountType || 'Percentage';
            if (discountType === 'Percentage') {
              finalPrice = basePrice * (1 - discountPercentage / 100);
            } else {
              // Fixed Amount
              finalPrice = Math.max(0, basePrice - discountPercentage);
            }
          }
          
          return {
            id: dateItem.id,
            startDate,
            endDate,
            price: finalPrice,
            originalPrice: basePrice, // 使用 journey.price 作为原价
            status: dateItem.status,
            offer: associatedOffer,
            offerType: dateItem.offerType || undefined
          };
        })
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    }
    
    // 否则自动生成日期列表（向后兼容）
    const list: Array<{
      id: string;
      startDate: Date;
      endDate: Date;
      price: number;
      originalPrice?: number;
      status: 'Available' | 'Limited' | 'Call';
      offerType?: string;
      offer: any;
    }> = [];
    
    const todayDate = new Date();
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(todayDate.getFullYear(), todayDate.getMonth() + i, 1);
      if (monthDate < todayDate) continue;
      
      const startDate = new Date(monthDate);
      const days = parseInt(journey.duration?.split(' ')[0] || '9');
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days - 1);
      
      // 计算折扣后的价格（根据 offers）
      const basePrice = journey.price || 0;
      let finalPrice = basePrice;
      const discountPercentage = getDiscountPercentage(startDate);
      if (discountPercentage > 0) {
        finalPrice = basePrice * (1 - discountPercentage / 100);
      }
      
      list.push({
        id: `auto-${i}`,
        startDate,
        endDate,
        price: finalPrice,
        originalPrice: basePrice, // 使用 journey.price 作为原价
        status: i < 3 ? 'Available' : i < 6 ? 'Limited' : 'Call' as 'Available' | 'Limited' | 'Call',
        offerType: undefined,
        offer: null
      });
    }
    
    return list;
  }, [journey.availableDates, journey.duration, journey.price, getDiscountPercentage]);

  // 获取所有可用年份（从所有日期中提取，移除 2025）
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allDatesList.forEach(item => {
      const year = item.startDate.getFullYear();
      if (year >= 2026) { // 移除 2025，只保留 2026 及以后的年份
        years.add(year);
      }
    });
    return Array.from(years).sort();
  }, [allDatesList]);

  // 生成当前选中年份和月份的日期列表
  const dateList = useMemo(() => {
    return allDatesList.filter(item => 
      item.startDate.getFullYear() === baseDate.getFullYear() &&
      item.startDate.getMonth() === baseDate.getMonth()
    );
  }, [allDatesList, baseDate]);

  // 初始化：如果有可用日期，自动切换到第一个可用日期的年份和月份
  useEffect(() => {
    if (allDatesList.length > 0 && monthOffset === 0) {
      const firstDate = allDatesList[0];
      const firstDateYear = firstDate.startDate.getFullYear();
      // 只处理 2026 及以后的年份
      if (firstDateYear >= 2026) {
        const todayDate = new Date();
        const monthsDiff = (firstDate.startDate.getFullYear() - todayDate.getFullYear()) * 12 + 
                          (firstDate.startDate.getMonth() - todayDate.getMonth());
        if (monthsDiff >= 0) {
          setMonthOffset(monthsDiff);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDatesList.length]); // 只在日期列表变化时执行一次

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
        {/* Inclusions 与 Dates 的 左右布局 */}
        <div className="flex flex-col lg:flex-row gap-12 items-stretch">
          
          {/* 左侧：Inclusions 垂直列表 */}
          <div className="w-full lg:w-1/2 flex flex-col lg:max-h-[600px]">
            <h3 className="text-2xl font-heading mb-8 text-gray-900">Includes</h3>
            {inclusionsList.length > 0 ? (
              <div className="flex flex-col gap-6 lg:overflow-y-auto lg:pr-4 scrollbar-thin" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db transparent'
              }}>
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
          <div className="w-full lg:w-1/2 lg:border-l lg:pl-12 border-gray-200 flex flex-col lg:max-h-[600px]">
            <h3 className="text-2xl font-heading mb-8 text-gray-900">Select Your Date</h3>
            
            {/* 年份切换 - 动态显示所有可用年份（移除 2025） */}
            {availableYears.length > 0 && (
              <div className="flex gap-8 border-b border-gray-200 mb-8">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    className={`pb-4 text-sm font-medium transition-colors ${
                      baseDate.getFullYear() === year
                        ? 'border-b-2 border-black font-medium'
                        : 'text-gray-400'
                    }`}
                    onClick={() => {
                      // 找到该年份的第一个日期，切换到对应的月份
                      const firstDateInYear = allDatesList.find(item => item.startDate.getFullYear() === year);
                      if (firstDateInYear) {
                        const newDate = new Date(firstDateInYear.startDate);
                        const todayDate = new Date();
                        const monthsDiff = (newDate.getFullYear() - todayDate.getFullYear()) * 12 + (newDate.getMonth() - todayDate.getMonth());
                        setMonthOffset(Math.max(0, monthsDiff));
                      }
                    }}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
            
            {/* 日期列表 - 可滚动区域 */}
            <div className="space-y-4 lg:overflow-y-auto lg:pr-4 lg:flex-1 scrollbar-thin" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db transparent'
            }}>
              {dateList.map((item, index) => {
                const startStr = item.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const endStr = item.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const dateRange = `${startStr} - ${endStr}`;
                const dateId = item.id || `date-${index}`;
                const isExpanded = expandedDates.has(dateId);
                const hasOffer = item.offerType && item.offerType !== 'No Offer' && item.offer;
                
                return (
                  <div
                    key={dateId}
                    className="bg-white rounded-sm shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* 日期行 - 可点击展开 */}
                    <div 
                      className="p-6 flex items-center justify-between gap-6 cursor-pointer"
                      onClick={() => toggleDateExpand(dateId)}
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
                          {hasOffer && (
                            <span className="text-xs px-2 py-1 rounded bg-[#8B4513] text-white font-semibold uppercase tracking-wider">
                              OFFER
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span 
                            className="text-lg text-gray-900"
                            style={{ fontFamily: 'Playfair Display, serif' }}
                          >
                            ${item.price.toLocaleString()}
                          </span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ${item.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDateClick(item.startDate);
                          }}
                          className="px-6 py-2 bg-black text-white text-xs tracking-widest uppercase hover:bg-gray-800 transition-colors whitespace-nowrap"
                        >
                          Book Now
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDateExpand(dateId);
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* 展开详情区域 */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                        {hasOffer && item.offer && (
                          <div className="mb-4 p-4 bg-gray-50 rounded-sm">
                            <div className="flex items-start gap-3 mb-2">
                              <div className="mt-1 flex-shrink-0 text-[#8B4513]">
                                <OfferIcon />
                              </div>
                              <div className="flex-1">
                                <p className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase mb-2">
                                  Offer Details
                                </p>
                                <div className="space-y-1 mb-3">
                                  {item.offer.type && (
                                    <p className="text-sm font-semibold text-gray-900">
                                      Type: {item.offer.type}
                                    </p>
                                  )}
                                  {item.offer.discount && (
                                    <p className="text-sm font-semibold text-gray-900">
                                      Discount: {item.offer.discount}
                                    </p>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed prose-force-wrap">
                                  {generateStandardText(item.offer)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {!hasOffer && (
                          <p className="text-sm text-gray-500">No special offers available for this date.</p>
                        )}
                      </div>
                    )}
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

