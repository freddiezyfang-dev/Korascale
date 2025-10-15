'use client';

import React from 'react';
import { useWishlist } from '@/context/WishlistContext';
import { Button, Card, Heading, Text } from '@/components/common';
import { Plus, Heart } from 'lucide-react';

export interface ExperienceCardProps {
  id: string;
  title: string;
  location: string;
  image: string;
  price?: string;
  duration?: string;
  description?: string;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({
  id,
  title,
  location,
  image,
  price,
  duration,
  description,
}) => {
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const inWishlist = isInWishlist(id);

  const handleWishlistToggle = () => {
    if (inWishlist) {
      removeFromWishlist(id);
    } else {
      addToWishlist({
        id,
        type: 'experience',
        title,
        location,
        image,
        price,
        duration,
      });
    }
  };

  return (
    <Card className="overflow-hidden p-0 group h-full flex flex-col">
      {/* 图片 */}
      <div className="relative h-[300px] overflow-hidden flex-shrink-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300" />
      </div>

      {/* 内容 */}
      <div className="p-4 flex-1 flex flex-col">
        {/* 位置 */}
        <Text size="xs" className="text-gray-500 font-bold uppercase tracking-wide mb-2">
          {location}
        </Text>

        {/* 标题 */}
        <Heading level={4} className="text-lg font-medium mb-3 line-clamp-2">
          {title}
        </Heading>

        {/* 描述 */}
        {description && (
          <Text size="sm" className="text-gray-600 mb-4 line-clamp-3">
            {description}
          </Text>
        )}

        {/* 价格和时长 */}
        {(price || duration) && (
          <div className="flex items-center gap-4 mb-4">
            {duration && (
              <Text size="sm" className="text-gray-500">
                {duration}
              </Text>
            )}
            {price && (
              <Text size="sm" className="text-primary-600 font-medium">
                {price}
              </Text>
            )}
          </div>
        )}

        {/* 添加到愿望清单按钮 */}
        <div className="mt-auto">
          <Button
            variant={inWishlist ? "secondary" : "outline"}
            onClick={handleWishlistToggle}
            className="w-full flex items-center justify-center gap-2"
          >
          {inWishlist ? (
            <>
              <Heart className="w-4 h-4 fill-current" />
              Added to Wishlist
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add to Wishlist
            </>
          )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
