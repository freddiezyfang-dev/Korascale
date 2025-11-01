'use client';

import React, { useEffect } from 'react';
import { useWishlist } from '@/context/WishlistContext';
import { Button, Card, Heading, Text } from '@/components/common';
import { X, Trash2, Heart, Calendar, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const WishlistSidebar: React.FC = () => {
  const { 
    items, 
    isOpen, 
    closeWishlist, 
    removeFromWishlist, 
    clearWishlist 
  } = useWishlist();
  const router = useRouter();

  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className={`fixed inset-0 bg-gradient-to-l from-gray-800/10 via-gray-800/5 to-transparent z-[9998] wishlist-backdrop ${isOpen ? 'open' : ''}`}
        onClick={closeWishlist}
        style={{
          background: isOpen 
            ? 'linear-gradient(to left, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.03) 50%, transparent 100%)'
            : 'transparent'
        }}
      />
      
      {/* 侧边栏 */}
      <div className={`fixed right-0 top-0 bg-white shadow-2xl z-[9999] wishlist-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="flex flex-col h-full w-full">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 md:w-6 md:h-6 text-primary-500" />
              <Heading level={3} className="text-lg md:text-xl font-bold">
                My Wishlist
              </Heading>
              <span className="bg-primary-100 text-primary-600 text-xs px-2 py-1 rounded-full">
                {items.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeWishlist}
              className="p-2 hover:bg-gray-100 rounded-full flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Heart className="w-16 h-16 text-gray-300 mb-4" />
                <Text className="text-gray-500 mb-2">Your wishlist is empty</Text>
                <Text size="sm" className="text-gray-400">
                  Add some experiences or accommodations to your wishlist
                </Text>
              </div>
            ) : (
              <div className="p-4 md:p-6 space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="p-3 md:p-4 hover:shadow-md transition-shadow">
                    <div className="flex gap-3">
                      {/* 图片 */}
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <Text className="font-medium text-sm md:text-base line-clamp-2 flex-1">
                            {item.title}
                          </Text>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromWishlist(item.id)}
                            className="p-1 hover:bg-red-50 text-red-500 hover:text-red-600 ml-2 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <Text size="sm" className="text-gray-600 mb-2 line-clamp-1">
                          {item.location}
                        </Text>
                        
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.type === 'experience' 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {item.type}
                          </span>
                          {item.price && (
                            <Text size="sm" className="font-medium text-primary-600">
                              {item.price}
                            </Text>
                          )}
                        </div>
                        
                        {/* 酒店预订详情 */}
                        {item.type === 'accommodation' && item.bookingDetails && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <Text size="xs" className="text-gray-600">
                                {item.bookingDetails.checkIn?.toLocaleDateString()} - {item.bookingDetails.checkOut?.toLocaleDateString()}
                              </Text>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <Text size="xs" className="text-gray-600">
                                {item.bookingDetails.adults} adult{item.bookingDetails.adults > 1 ? 's' : ''}
                                {item.bookingDetails.children > 0 && `, ${item.bookingDetails.children} child${item.bookingDetails.children > 1 ? 'ren' : ''}`}
                              </Text>
                            </div>
                            <Text size="xs" className="text-gray-500">
                              {item.bookingDetails.roomType}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 底部操作区 */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-4 md:p-6 bg-gray-50 flex-shrink-0">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={clearWishlist}
                  className="flex-1 flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear All</span>
                  <span className="sm:hidden">Clear</span>
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    closeWishlist();
                    router.push('/booking/cart');
                  }}
                  className="flex-1"
                >
                  <span className="hidden sm:inline">Add to Booking</span>
                  <span className="sm:hidden">Book</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};