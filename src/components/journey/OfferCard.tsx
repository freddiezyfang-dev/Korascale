'use client';

import React from 'react';

interface OfferCardProps {
  type: 'companion-discount' | 'government-subsidy' | 'promotional-offer';
  discount: string; // 百分比或固定金额，如 "10%" 或 "$500"
  expiryDate?: string; // ISO 日期字符串
  description: string;
}

export default function OfferCard({ type, discount, expiryDate, description }: OfferCardProps) {
  // 格式化过期日期
  const formatExpiryDate = (dateStr?: string): string => {
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

  // 根据类型生成标准表述
  const getStandardText = (): string => {
    const expiryText = expiryDate ? ` booked by ${formatExpiryDate(expiryDate)}` : '';
    
    switch (type) {
      case 'companion-discount':
        return `Save ${discount} per person for groups of 4 or more on select departures.${expiryText}`;
      case 'government-subsidy':
        return `Exclusive government travel incentive applied to this journey.${expiryText}`;
      case 'promotional-offer':
        return `Save ${discount} per person on select departures${expiryText}.`;
      default:
        return description;
    }
  };

  // 确定显示的文本：优先使用 description，如果为空则使用标准文本
  const displayText = description && description.trim() 
    ? description 
    : getStandardText();

  return (
    <div className="bg-white rounded-sm shadow-sm border-l-4 border-[#1e3b32] p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="text-sm text-gray-700 leading-relaxed">
            {displayText}
          </p>
          {expiryDate && (
            <p className="text-xs text-gray-500 mt-2">
              Valid until {formatExpiryDate(expiryDate)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

