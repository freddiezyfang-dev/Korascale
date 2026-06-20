'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Card, Heading, Text } from '@/components/common';
import { Star, MapPin, Wifi, Car, Coffee } from 'lucide-react';

export interface AccommodationCardProps {
  id: string;
  title: string;
  location: string;
  image: string;
  price?: string;
  description?: string;
  amenities?: string[];
  featured?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'light';
  titleStyle?: CSSProperties;
  descriptionStyle?: CSSProperties;
}

export const AccommodationCard: React.FC<AccommodationCardProps> = ({
  id,
  title,
  location,
  image,
  price,
  description,
  amenities = [],
  featured = false,
  onClick,
  variant = 'default',
  titleStyle,
  descriptionStyle,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(image);
  
  // 当 image prop 改变时，重置错误状态
  useEffect(() => {
    setImageSrc(image);
    setImageError(false);
  }, [image]);

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const isLight = variant === 'light';

  return (
    <Card 
      className={`overflow-hidden p-0 group h-full flex flex-col cursor-pointer hover:shadow-lg transition-shadow duration-300 ${isLight ? 'bg-white border-2 border-black' : 'bg-tertiary'}`}
      onClick={handleCardClick}
    >
      {/* 图片部分 - 简化版本 */}
      <div className="relative h-[300px] overflow-hidden flex-shrink-0 bg-gray-200">
        {!imageError ? (
          <img
            src={imageSrc}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => {
              // 静默处理错误，设置错误状态
              setImageError(true);
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-500">
              <div className="text-2xl">🏨</div>
              <div className="text-sm mt-2">图片加载失败</div>
              <div className="text-xs mt-1 opacity-75">{title}</div>
            </div>
          </div>
        )}
      </div>

      {/* 内容 */}
      <div className={`p-4 flex-1 flex flex-col ${isLight ? 'bg-white' : 'bg-tertiary'}`}>
        {/* 位置 */}
        <Text 
          size="sm" 
          className={`${isLight ? 'text-black' : 'text-white'} mb-1 font-body`} 
          style={{ color: isLight ? '#000000' : '#ffffff', fontFamily: 'Monda, sans-serif', lineHeight: '1.625' }}
        >
          {location}
        </Text>

        {/* 标题 */}
        <Heading
          level={4}
          className={`text-lg font-medium mb-3 line-clamp-2 ${isLight ? 'text-black' : 'text-white'}`}
          style={{ color: isLight ? '#000000' : '#ffffff', ...(titleStyle || {}) }}
        >
          {title}
        </Heading>

        {/* 描述 */}
        {description && (
          <Text
            size="sm"
            className={`${isLight ? 'text-black' : 'text-white'} mb-4 line-clamp-3`}
            style={{ color: isLight ? '#000000' : '#ffffff', ...(descriptionStyle || {}) }}
          >
            {description}
          </Text>
        )}

        {/* 价格 */}
        {price && (
          <div className="flex items-center gap-4 mb-4">
            <Text size="sm" className={`${isLight ? 'text-black' : 'text-white'} font-medium`} style={{ color: isLight ? '#000000' : '#ffffff' }}>
              {price}
            </Text>
          </div>
        )}

      </div>
    </Card>
  );
};
