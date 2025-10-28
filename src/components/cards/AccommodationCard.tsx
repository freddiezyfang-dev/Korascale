'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useWishlist } from '@/context/WishlistContext';
import { Button, Card, Heading, Text } from '@/components/common';
import { Plus, Heart, Calendar, Star, MapPin, Wifi, Car, Coffee } from 'lucide-react';
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
}) => {
  console.log("|" + image + "|");
  
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const [imageError, setImageError] = useState(false);
  const router = useRouter();
  
  const inWishlist = isInWishlist(id);

  const handleWishlistToggle = useCallback(() => {
    if (inWishlist) {
      removeFromWishlist(id);
    } else {
      addToWishlist({
        id,
        type: 'accommodation',
        title,
        location,
        image,
        price,
      });
    }
  }, [id, inWishlist, title, location, image, price, addToWishlist, removeFromWishlist]);

  const handleBookNow = useCallback(() => {
    // 跳转到 accommodation 预订页面
    router.push(`/booking/accommodation?hotelId=${id}&adults=2&children=0`);
  }, [router, id]);

  const handleCardClick = () => {
    console.log('AccommodationCard clicked:', { id, title, onClick: !!onClick });
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
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            console.error('Image failed to load:', image);
            e.currentTarget.style.display = 'none';
            // 显示错误占位符
            const placeholder = document.createElement('div');
            placeholder.className = 'w-full h-full flex items-center justify-center bg-gray-100';
            placeholder.innerHTML = `
              <div class="text-center text-gray-500">
                <div class="text-2xl">🏨</div>
                <div class="text-sm mt-2">图片加载失败</div>
                <div class="text-xs mt-1 opacity-75">${title}</div>
              </div>
            `;
            e.currentTarget.parentNode?.appendChild(placeholder);
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', image);
          }}
          loading="lazy"
        />
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
        <Heading level={4} className={`text-lg font-medium mb-3 line-clamp-2 ${isLight ? 'text-black' : 'text-white'}`} style={{ color: isLight ? '#000000' : '#ffffff' }}>
          {title}
        </Heading>

        {/* 描述 */}
        {description && (
          <Text size="sm" className={`${isLight ? 'text-black' : 'text-white'} mb-4 line-clamp-3`} style={{ color: isLight ? '#000000' : '#ffffff' }}>
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
        <div className="mt-auto space-y-3">
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
            Book Now
          </Button>
          
          {/* 添加到愿望清单按钮 - 仅在showWishlist为true时显示 */}
          {showWishlist && (
            <Button
              variant={inWishlist ? "secondary" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                handleWishlistToggle();
              }}
              className={`w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ${isLight ? 'border-2 border-black text-black hover:text-black' : 'border-2 border-white text-white hover:text-white'}`}
              style={{ color: isLight ? '#000000' : '#ffffff', borderColor: isLight ? '#000000' : '#ffffff' }}
            >
            {inWishlist ? (
              <>
                <Heart className="w-5 h-5 fill-current" />
                Added to Wishlist
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Add to Wishlist
              </>
            )}
            </Button>
          )}
        </div>
      </div>

    </Card>
  );
};
