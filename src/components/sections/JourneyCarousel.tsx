'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Container, Section, Heading, Text } from '@/components/common';

interface JourneyItem {
  id: number;
  title: string;
  image: string;
  href?: string;
}

interface JourneyCarouselProps {
  title?: string;
  subtitle?: string;
  items: JourneyItem[];
  autoPlay?: boolean;
  interval?: number;
  showFullWidth?: boolean;
}

export default function JourneyCarousel({
  title,
  subtitle,
  items,
  autoPlay = true,
  interval = 3000,
  showFullWidth = false
}: JourneyCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 自动轮播
  useEffect(() => {
    if (!autoPlay || isHovered) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, isHovered, interval, items.length]);

  // 滚动到当前索引
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollAmount = currentIndex * (615 + 32); // 卡片宽度 + gap
      scrollContainerRef.current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  return (
    <Section background="secondary" padding="xl" className="overflow-hidden">
      <div className="max-w-screen-2xl mx-auto">
        <div className="text-center mb-16 px-4">
          {subtitle && <Text size="xl" className="mb-4 font-body text-center text-black">{subtitle}</Text>}
          {title && (
            <Heading level={2} className="text-5xl font-heading text-center text-black">
              {title}
            </Heading>
          )}
        </div>

        {/* Carousel Container */}
        <div 
          ref={scrollContainerRef}
          className="flex gap-8 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide pl-4"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ 
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`bg-white h-[300px] w-[615px] flex-shrink-0 border-2 border-black rounded-lg overflow-hidden snap-start transition-all duration-300 hover:scale-105 hover:shadow-2xl group ${index === items.length - 1 ? 'mr-4' : ''}`}
            >
              {item.href ? (
                <Link href={item.href}>
                  <div className="flex h-full">
                    <div 
                      className="w-[344px] h-[225px] bg-center bg-cover bg-no-repeat m-4 transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundImage: `url('${item.image}')` }}
                    />
                    <div className="flex-1 p-4 flex flex-col justify-center">
                      <h3 className="text-lg font-subheading text-black mb-4 group-hover:text-primary-500 transition-colors duration-300">
                        {item.title}
                      </h3>
                      <span className="text-black underline text-sm font-body hover:opacity-80 group-hover:text-primary-500 transition-colors duration-300">
                        VIEW MORE
                      </span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="flex h-full cursor-pointer">
                  <div 
                    className="w-[344px] h-[225px] bg-center bg-cover bg-no-repeat m-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundImage: `url('${item.image}')` }}
                  />
                  <div className="flex-1 p-4 flex flex-col justify-center">
                    <h3 className="text-lg font-subheading text-black mb-4 group-hover:text-primary-500 transition-colors duration-300">
                      {item.title}
                    </h3>
                    <span className="text-black underline text-sm font-body hover:opacity-80 group-hover:text-primary-500 transition-colors duration-300">
                      VIEW MORE
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mt-8 px-4">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'w-8 bg-primary-500' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}

