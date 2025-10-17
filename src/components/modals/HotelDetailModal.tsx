'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Heading, Text } from '@/components/common';
import { useWishlist } from '@/context/WishlistContext';
import { BookingModal } from './BookingModal';
import { LoginModal } from './LoginModal';
import { BookingDetailsModal, BookingDetails } from './BookingDetailsModal';
import { useRouter } from 'next/navigation';

interface RoomType {
  name: string;
  description: string;
  amenities: string[];
}

interface Hotel {
  id: string;
  name: string;
  location: string;
  description: string;
  rating: string;
  images: string[];
  roomTypes: RoomType[];
}

interface HotelDetailModalProps {
  hotel: Hotel | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HotelDetailModal: React.FC<HotelDetailModalProps> = ({
  hotel,
  isOpen,
  onClose,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isBookingDetailsModalOpen, setIsBookingDetailsModalOpen] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const router = useRouter();

  // 管理浏览器历史，确保返回按钮返回到 accommodation 页面
  useEffect(() => {
    if (isOpen) {
      // 添加当前状态到历史记录
      window.history.pushState({ modalOpen: true }, '', window.location.pathname);
      
      // 监听浏览器返回按钮
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modalOpen) {
          onClose();
        }
      };
      
      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen, onClose]);

  console.log('HotelDetailModal render:', { 
    isOpen, 
    hotel: hotel ? {
      id: hotel.id,
      name: hotel.name,
      imagesCount: hotel.images?.length,
      firstImage: hotel.images?.[0]
    } : null,
    currentImageIndex,
    currentImage: hotel?.images?.[currentImageIndex]
  });

  if (!isOpen || !hotel) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % hotel.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + hotel.images.length) % hotel.images.length);
  };

  const handleWishlistToggle = () => {
    if (isInWishlist(hotel.id)) {
      removeFromWishlist(hotel.id);
    } else {
      addToWishlist({
        id: hotel.id,
        title: hotel.name,
        type: 'accommodation',
        image: hotel.images[0],
        location: hotel.location,
        price: '$120/night'
      });
    }
  };

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
    setIsBookingDetailsModalOpen(true);
  };

  const handleBookingDetailsContinue = (details: BookingDetails) => {
    setIsBookingDetailsModalOpen(false);
    // 跳转到结账页面，可以传递预订详情
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden m-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <Heading level={2} className="text-2xl font-bold">
              {hotel.name}
            </Heading>
            <Text className="text-gray-600">{hotel.location}</Text>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isInWishlist(hotel.id) ? "primary" : "outline"}
              size="sm"
              onClick={handleWishlistToggle}
              className="text-sm"
            >
              {isInWishlist(hotel.id) ? "Remove from Wishlist" : "Add to Wishlist"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Hotel Basic Information */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-500">★</span>
              <Text className="text-lg font-semibold">{hotel.rating}</Text>
            </div>
            <Text className="text-gray-700 mb-4">{hotel.description}</Text>
          </div>

          {/* Hotel Images */}
          {hotel.images.length > 0 && (
            <div className="mb-6">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={hotel.images[currentImageIndex]}
                  alt={`${hotel.name} - Image ${currentImageIndex + 1}`}
                  className="w-full h-64 object-cover transition-opacity duration-300"
                />
                
                {/* Image Navigation Buttons */}
                {hotel.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white hover:bg-opacity-90 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold z-10"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white hover:bg-opacity-90 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold z-10"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>
              
              {/* Image Indicators */}
              {hotel.images.length > 1 && (
                <div className="flex justify-center space-x-2 mt-4">
                  {hotel.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        index === currentImageIndex 
                          ? 'bg-primary shadow-lg scale-110' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Room Types List */}
          <div className="space-y-4 mb-6">
            <Heading level={3} className="text-xl font-semibold mb-4">
              Available Room Types
            </Heading>
            
            {hotel.roomTypes.map((room, index) => (
              <Card key={index} className="p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <Heading level={4} className="text-lg font-medium mb-1">
                      {room.name}
                    </Heading>
                    <Text className="text-gray-600 text-sm">
                      {room.description}
                    </Text>
                  </div>
                </div>
                
                {/* Amenities List */}
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity, amenityIndex) => (
                    <div
                      key={amenityIndex}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
                    >
                      <span>•</span>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              View Details
            </Button>
            <Button 
              variant="primary" 
              className="flex-1"
              onClick={() => {
                // 打开登录弹窗
                setIsLoginModalOpen(true);
              }}
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>

      {/* 登录弹窗 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 预订详情弹窗 */}
      <BookingDetailsModal
        isOpen={isBookingDetailsModalOpen}
        onClose={() => setIsBookingDetailsModalOpen(false)}
        onContinue={handleBookingDetailsContinue}
        hotel={hotel}
      />

      {/* 预订弹窗 */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        accommodation={{
          id: hotel.id,
          title: hotel.name,
          location: hotel.location,
          image: hotel.images[0],
          price: '$120/night', // 默认价格
        }}
      />
    </div>
  );
};