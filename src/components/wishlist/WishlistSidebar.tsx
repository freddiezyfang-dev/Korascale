'use client';

import React from 'react';
import { useWishlist } from '@/context/WishlistContext';
import { Button, Card, Heading, Text } from '@/components/common';
import { X, Trash2, Heart, Calendar, Users, Eye } from 'lucide-react';
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

  if (!isOpen) return null;

  return (
    <>
      {/* 侧边栏 */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary-500" />
              <Heading level={3} className="text-xl font-bold">
                My Wishlist
              </Heading>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeWishlist}
              className="p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Heart className="w-16 h-16 text-gray-300 mb-4" />
                <Text className="text-gray-500 mb-2">Your wishlist is empty</Text>
                <Text size="sm" className="text-gray-400">
                  Add some experiences or accommodations to your wishlist
                </Text>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex gap-3">
                      {/* 图片 */}
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <Text className="font-medium text-sm line-clamp-2 mb-1">
                              {item.title}
                            </Text>
                            <Text size="xs" className="text-gray-500 mb-2">
                              {item.location}
                            </Text>
                            
                            {/* 酒店预订详情 */}
                            {item.type === 'accommodation' && item.bookingDetails && (
                              <div className="space-y-1 mb-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  <Text size="xs" className="text-gray-600">
                                    {item.bookingDetails.checkIn?.toLocaleDateString()} - {item.bookingDetails.checkOut?.toLocaleDateString()}
                                  </Text>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-gray-400" />
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
                            
                            {/* 体验时长 */}
                            {item.type === 'experience' && item.duration && (
                              <Text size="xs" className="text-gray-500">
                                {item.duration}
                              </Text>
                            )}
                            
                            {/* 价格 */}
                            {item.price && (
                              <Text size="sm" className="text-primary-600 font-medium mt-1">
                                {item.price}
                              </Text>
                            )}
                          </div>
                          
                          {/* 操作按钮 */}
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (item.type === 'accommodation') {
                                  // 酒店类型跳转到预订页面
                                  router.push('/booking/chengdu-deep-dive');
                                } else {
                                  // 体验类型跳转到详情页面
                                  router.push('/journeys/chengdu-city-one-day-deep-dive');
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-primary-500"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromWishlist(item.id)}
                              className="p-1 text-gray-400 hover:text-red-500"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 底部操作 */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-6">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={clearWishlist}
                  className="flex-1"
                >
                  Clear All
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                >
                  View Details
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
