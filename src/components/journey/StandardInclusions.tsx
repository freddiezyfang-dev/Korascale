'use client';

import React from 'react';

// 1px 极细线性图标 SVG
const ThinLineIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 8L6.5 10.5L12 5" stroke="#333" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface StandardInclusionsProps {
  inclusions: {
    airportTransfers?: boolean;
    entranceFees?: boolean;
    support24_7?: boolean;
    insurance?: boolean;
    meals?: boolean;
    transportation?: boolean;
    accommodations?: boolean;
  };
}

// 标准化短语映射
const INCLUSION_PHRASES = {
  airportTransfers: 'Airport Meet and Greet with Private Transfers',
  entranceFees: 'Entrance Fees, Taxes and All Gratuities Except Resident Tour Director',
  support24_7: '24/7 On-Call Support',
  insurance: 'Comprehensive Travel Insurance',
  meals: 'Daily Breakfast, Lunch, and Dinner',
  transportation: 'Premium Private Transportation',
  accommodations: 'Hand-selected Luxury Hotels',
};

export default function StandardInclusions({ inclusions }: StandardInclusionsProps) {
  // 获取所有勾选的 inclusions
  const activeInclusions = Object.entries(inclusions)
    .filter(([_, isActive]) => isActive)
    .map(([key, _]) => ({
      key: key as keyof typeof INCLUSION_PHRASES,
      text: INCLUSION_PHRASES[key as keyof typeof INCLUSION_PHRASES],
    }));

  if (activeInclusions.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No inclusion details available for this journey.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-16 gap-y-6">
      {activeInclusions.map((item) => (
        <div key={item.key} className="flex items-center gap-4">
          <div className="w-5 h-5 flex-shrink-0 text-[#333]">
            <ThinLineIcon className="w-5 h-5" />
          </div>
          <p className="text-[13px] text-gray-800 font-light">{item.text}</p>
        </div>
      ))}
    </div>
  );
}

