"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// 使用本地图片资源 - 你可以将图片放在 /public/images/hero/ 文件夹中
const imgProperty1Slide1 = "/images/hero/slide1.jpg"; // 四川风光
const imgProperty1Slide2 = "/images/hero/slide2.jpg"; // 甘肃青海
const imgProperty1Slide3 = "/images/hero/slide3.jpeg"; // 陕西古都 (注意：实际文件是.jpeg格式)
const imgProperty1Slide4 = "/images/hero/slide4.jpg"; // 新疆风光

interface HeroCarouselProps {
  autoSlide?: boolean;
  slideInterval?: number;
  showIndicators?: boolean;
  showArrows?: boolean;
}

export default function HeroCarousel({ 
  autoSlide = true, 
  slideInterval = 5000,
  showIndicators = true,
  showArrows = true 
}: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  
  const slides = [
    { 
      id: "Slide1", 
      image: imgProperty1Slide1, 
      title: "Unveil the beauty. Embrace the culture. Explore Western China like never before.",
      fallbackBg: "linear-gradient(135deg, #1e3b32 0%, #c99a44 100%)"
    },
    { 
      id: "Slide2", 
      image: imgProperty1Slide2, 
      title: "Unveil the beauty. Embrace the culture. Explore Western China like never before.",
      fallbackBg: "linear-gradient(135deg, #c99a44 0%, #1e3b32 100%)"
    },
    { 
      id: "Slide3", 
      image: imgProperty1Slide3, 
      title: "Unveil the beauty. Embrace the culture. Explore Western China like never before.",
      fallbackBg: "linear-gradient(135deg, #1e3b32 0%, #f5f1e6 50%, #c99a44 100%)"
    },
    { 
      id: "Slide4", 
      image: imgProperty1Slide4, 
      title: "Unveil the beauty. Embrace the culture. Explore Western China like never before.",
      fallbackBg: "linear-gradient(135deg, #c99a44 0%, #f5f1e6 50%, #1e3b32 100%)"
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

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  const getBackgroundStyle = (slide: typeof slides[0], index: number) => {
    if (imageErrors.has(index)) {
      return { background: slide.fallbackBg };
    }
    return { backgroundImage: `url('${slide.image}')` };
  };

  return (
    <div className="relative w-full h-[600px] overflow-hidden" data-name="Hero Banner/Homepage" data-node-id="186:81">
      {/* 轮播图片 */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div 
              className="bg-center bg-cover bg-no-repeat w-full h-full opacity-80"
              style={getBackgroundStyle(slide, index)}
            >
              {/* 隐藏的图片元素用于检测加载错误 */}
              <img
                src={slide.image}
                alt=""
                className="hidden"
                onError={() => handleImageError(index)}
              />
            </div>
          </div>
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
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200 z-10"
            aria-label="上一张"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200 z-10"
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
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
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


