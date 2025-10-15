"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface HeroBannerProps {
  autoSlide?: boolean;
  slideInterval?: number;
  showIndicators?: boolean;
  showArrows?: boolean;
}

export default function HeroBannerSimple({ 
  autoSlide = true, 
  slideInterval = 5000,
  showIndicators = true,
  showArrows = true 
}: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    { 
      id: "Slide1", 
      background: "linear-gradient(135deg, #1e3b32 0%, #c99a44 100%)",
      title: "Unveil the beauty. Embrace the culture. Explore Western China like never before."
    },
    { 
      id: "Slide2", 
      background: "linear-gradient(135deg, #c99a44 0%, #1e3b32 100%)",
      title: "Unveil the beauty. Embrace the culture. Explore Western China like never before."
    },
    { 
      id: "Slide3", 
      background: "linear-gradient(135deg, #1e3b32 0%, #f5f1e6 50%, #c99a44 100%)",
      title: "Unveil the beauty. Embrace the culture. Explore Western China like never before."
    },
    { 
      id: "Slide4", 
      background: "linear-gradient(135deg, #c99a44 0%, #f5f1e6 50%, #1e3b32 100%)",
      title: "Unveil the beauty. Embrace the culture. Explore Western China like never before."
    }
  ];

  // 自动轮播
  useEffect(() => {
    if (!autoSlide) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, slideInterval);

    return () => clearInterval(timer);
  }, [autoSlide, slideInterval, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative w-full h-[600px] overflow-hidden" data-name="Hero Banner/Homepage" data-node-id="186:81">
      {/* 轮播背景 */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ background: slide.background }}
          />
        ))}
      </div>

      {/* 内容层 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-4 max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-normal mb-8 font-[Montserrat] max-w-4xl">
            {slides[currentSlide].title}
          </h1>
          <Link 
            href="/destinations"
            className="bg-white text-black px-8 py-3 rounded-lg font-bold text-xl hover:bg-gray-100 transition-colors"
          >
            Explore now
          </Link>
        </div>
      </div>

      {/* 导航箭头 */}
      {showArrows && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200"
            aria-label="上一张"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200"
            aria-label="下一张"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* 指示器 */}
      {showIndicators && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentSlide 
                  ? 'bg-[#c99a44] scale-125' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`跳转到第 ${index + 1} 张图片`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
