"use client";

import { useState, useEffect, useRef } from "react";

// 视频源配置：
// 1. 优先使用环境变量 NEXT_PUBLIC_HERO_VIDEO_URL（Vercel Blob URL）
// 2. 如果没有环境变量，使用本地路径（仅用于开发环境）
// 3. 如果都没有，使用占位符
const heroVideo = 
  typeof window !== 'undefined' && process.env.NEXT_PUBLIC_HERO_VIDEO_URL
    ? process.env.NEXT_PUBLIC_HERO_VIDEO_URL
    : "/videos/Herobanner1.mp4"; // 本地路径（开发环境）

interface HeroCarouselProps {
  autoSlide?: boolean;
  slideInterval?: number;
  showIndicators?: boolean;
  showArrows?: boolean;
  videoSrc?: string; // 可选：自定义视频路径
}

export default function HeroCarousel({ 
  autoSlide = true, 
  slideInterval = 5000,
  showIndicators = true,
  showArrows = true,
  videoSrc = heroVideo
}: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [videoErrors, setVideoErrors] = useState<Set<number>>(new Set());
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  
  // 如果有多个视频，可以在这里定义
  const videos = [
    { 
      id: "Video1", 
      src: videoSrc,
      title: "Unveil the beauty. Embrace the culture. Explore Western China like never before.",
      fallbackBg: "linear-gradient(135deg, #1e3b32 0%, #c99a44 100%)"
    }
  ];

  // 视频播放控制 - 当切换视频时，播放当前视频，暂停其他视频
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      
      if (index === currentSlide) {
        video.play().catch(err => {
          console.error(`视频 ${index} 播放失败:`, err);
          setVideoErrors(prev => new Set(prev).add(index));
        });
      } else {
        video.pause();
        video.currentTime = 0; // 重置到开头
      }
    });
  }, [currentSlide]);

  // 视频加载错误处理
  const handleVideoError = (index: number) => {
    setVideoErrors(prev => new Set(prev).add(index));
  };

  // 自动轮播（如果将来需要多个视频）
  useEffect(() => {
    if (!autoSlide || videos.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % videos.length);
    }, slideInterval);

    return () => clearInterval(timer);
  }, [autoSlide, slideInterval, videos.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % videos.length);
  };

  const getBackgroundStyle = (video: typeof videos[0], index: number) => {
    if (videoErrors.has(index)) {
      return { background: video.fallbackBg };
    }
    return {};
  };

  return (
    <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden -mx-0" data-name="Hero Banner/Homepage" data-node-id="186:81">
      {/* 视频播放区域 */}
      <div className="relative w-full h-full">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {!videoErrors.has(index) ? (
              <video
                ref={(el) => {
                  videoRefs.current[index] = el;
                }}
                className="w-full h-full object-cover m-0 p-0 block"
                style={{ margin: 0, padding: 0, display: 'block' }}
                loop
                muted
                playsInline
                onError={() => handleVideoError(index)}
              >
                <source src={video.src} type="video/mp4" />
                <source src={video.src.replace('.mp4', '.webm')} type="video/webm" />
                您的浏览器不支持视频播放。
              </video>
            ) : (
              <div 
                className="w-full h-full bg-center bg-cover bg-no-repeat opacity-80"
                style={getBackgroundStyle(video, index)}
              />
            )}
          </div>
        ))}
      </div>

      {/* 内容层文字与按钮移除，保留纯视觉背景 */}

      {/* 导航箭头 - 仅在多个视频时显示 */}
      {showArrows && videos.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 sm:p-3 rounded-full transition-all duration-200 z-10 touch-manipulation"
            aria-label="上一个视频"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 sm:p-3 rounded-full transition-all duration-200 z-10 touch-manipulation"
            aria-label="下一个视频"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* 指示器 - 仅在多个视频时显示 */}
      {showIndicators && videos.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {videos.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentSlide 
                  ? 'bg-[#c99a44] scale-125' 
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`跳转到第 ${index + 1} 个视频`}
            />
          ))}
        </div>
      )}
    </div>
  );
}


