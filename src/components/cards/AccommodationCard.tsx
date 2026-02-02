'use client';

import React, { useState, useCallback, useEffect, CSSProperties } from 'react';
import { Button, Card, Heading, Text } from '@/components/common';
import { Calendar, Star, MapPin, Wifi, Car, Coffee } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  showWishlist?: boolean;
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
  showWishlist = true,
  titleStyle,
  descriptionStyle,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageSrc, setImageSrc] = useState(image);
  const router = useRouter();
  
  // 当 image prop 改变时，重置错误状态
  useEffect(() => {
    setImageSrc(image);
    setImageError(false);
  }, [image]);
  
  const handleBookNow = useCallback(() => {
    // 跳转到 accommodation 预订页面
    router.push(`/booking/accommodation?hotelId=${id}&adults=2&children=0`);
  }, [router, id]);

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

        {/* 按钮组 */}
        <div className="mt-auto">
          {/* 预订按钮 */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleBookNow();
            }}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-100 text-black font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            style={{ color: '#000000' }}
          >
            <Calendar className="w-5 h-5" />
            REQUEST TO BOOK
          </Button>
        </div>
      </div>

    </Card>
  );
};
