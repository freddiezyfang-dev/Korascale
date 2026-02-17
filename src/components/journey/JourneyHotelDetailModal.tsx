'use client';

import React, { useState } from 'react';
import { JourneyHotel } from '@/types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface JourneyHotelDetailModalProps {
  hotel: JourneyHotel;
  onClose: () => void;
}

export function JourneyHotelDetailModal({ hotel, onClose }: JourneyHotelDetailModalProps) {
  const images = (hotel.galleryImages && hotel.galleryImages.length > 0)
    ? hotel.galleryImages
    : (hotel.image ? [hotel.image] : []);

  const [currentIndex, setCurrentIndex] = useState(0);

  const hasMultiple = images.length > 1;

  const goPrev = () => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goNext = () => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* 背景关闭 */}
      <button
        className="absolute inset-0 w-full h-full cursor-pointer"
        onClick={onClose}
        aria-label="Close hotel detail"
      />

      {/* 内容面板：固定高度，左右布局 */}
      <div className="relative z-10 w-full max-w-5xl h-[600px] max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 rounded-full bg-black/60 text-white p-1.5 hover:bg-black/80 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 左侧图片轮播 */}
        <div className="md:w-1/2 w-full bg-gray-100 relative flex items-center justify-center">
          {images.length > 0 ? (
            <div className="relative w-full h-full min-h-[260px] flex items-center justify-center">
              <img
                src={images[currentIndex]}
                alt={hotel.name}
                className="w-full h-full object-cover"
              />
              {hasMultiple && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-2 h-2 rounded-full ${
                          idx === currentIndex ? 'bg-white' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-full min-h-[260px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">🏨</div>
                <div>No images available</div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧文案：仅允许纵向滚动，禁止横向滚动 */}
        <div className="md:w-1/2 w-full p-6 md:p-8 flex flex-col box-border overflow-y-auto overflow-x-hidden hotel-detail-text">
          <div className="mb-4">
            <h2
              className="text-2xl md:text-3xl mb-2"
              style={{ fontFamily: 'Montaga, serif', lineHeight: 1.6 }}
            >
              {hotel.name}
            </h2>
            {hotel.location && (
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {hotel.location}
              </p>
            )}
          </div>

          <div className="flex-1">
            {hotel.longDescription ? (
              <div
                className="prose prose-sm md:prose-base max-w-none text-gray-800"
                style={{ fontFamily: 'Montserrat, sans-serif', lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: hotel.longDescription }}
              />
            ) : (
              <p
                className="text-sm text-gray-600"
                style={{ fontFamily: 'Montserrat, sans-serif', lineHeight: 1.6 }}
              >
                Detailed description for this hotel will be available soon.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 自定义滚动与断行样式 */}
      <style jsx global>{`
        .hotel-detail-text {
          box-sizing: border-box;
          word-break: break-word;
          line-height: 1.6;
        }
        .hotel-detail-text::-webkit-scrollbar {
          width: 6px;
        }
        .hotel-detail-text::-webkit-scrollbar-track {
          background: transparent;
        }
        .hotel-detail-text::-webkit-scrollbar-thumb {
          background-color: rgba(15, 23, 42, 0.25);
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
}

