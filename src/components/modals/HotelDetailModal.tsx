'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Heading, Text } from '@/components/common';
import { buildMailtoHref } from '@/lib/contactChannels';

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

  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modalOpen: true }, '', window.location.pathname);

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

  if (!isOpen || !hotel) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % hotel.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + hotel.images.length) % hotel.images.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} aria-hidden />

      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden m-4 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <Heading level={2} className="text-2xl font-bold">
              {hotel.name}
            </Heading>
            <Text className="text-gray-600">{hotel.location}</Text>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2" aria-label="Close">
            ✕
          </Button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-500">★</span>
              <Text className="text-lg font-semibold">{hotel.rating}</Text>
            </div>
            <Text className="text-gray-700 mb-4">{hotel.description}</Text>
          </div>

          {hotel.images.length > 0 && (
            <div className="mb-6">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={hotel.images[currentImageIndex]}
                  alt={`${hotel.name} - Image ${currentImageIndex + 1}`}
                  className="w-full h-64 object-cover transition-opacity duration-300"
                />

                {hotel.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white hover:bg-opacity-90 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold z-10"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white hover:bg-opacity-90 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold z-10"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {hotel.images.length > 1 && (
                <div className="flex justify-center space-x-2 mt-4">
                  {hotel.images.map((_, index) => (
                    <button
                      key={index}
                      type="button"
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
                    <Text className="text-gray-600 text-sm">{room.description}</Text>
                  </div>
                </div>

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

          <div className="flex gap-3">
            <a
              href={buildMailtoHref(`Accommodation inquiry: ${hotel.name}`)}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
            >
              ENQUIRE BY EMAIL
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
