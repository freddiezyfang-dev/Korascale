'use client';

import React from 'react';
import { JourneyHotel } from '@/types';

interface HotelsProps {
  hotels: JourneyHotel[];
}

export default function Hotels({ hotels }: HotelsProps) {
  return (
    <section className="w-full bg-white py-16 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* 标题区域 */}
        <div className="mb-12">
          <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-4 prose-force-wrap">
            WHERE YOU WILL STAY
          </p>
          <h2
            className="text-gray-900 text-3xl prose-force-wrap"
            style={{ fontFamily: 'Montaga, serif', fontWeight: 400 }}
          >
            Hand Selected for an Unmatched Experience
          </h2>
        </div>

        {/* 酒店卡片网格 - 水平排布 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {hotels.map((hotel, index) => (
            <div
              key={hotel.id || index}
              className="flex flex-col group cursor-pointer hover:shadow-lg transition-shadow duration-300"
            >
              {/* 图片 - 3:4 比例 */}
              <div className="relative w-full aspect-[3/4] overflow-hidden rounded-sm mb-4 bg-gray-100">
                {hotel.image ? (
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <div className="text-center text-gray-400">
                      <div className="text-3xl mb-2">🏨</div>
                      <div className="text-sm">No Image</div>
                    </div>
                  </div>
                )}
              </div>

              {/* 酒店信息 - 居中显示 */}
              <div className="text-center">
                <h3
                  className="text-lg text-gray-900 mb-2 prose-force-wrap"
                  style={{ fontFamily: 'Montaga, serif', fontWeight: 400 }}
                >
                  {hotel.name}
                </h3>
                {hotel.location && (
                  <p className="text-sm text-gray-600 prose-force-wrap">
                    {hotel.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
