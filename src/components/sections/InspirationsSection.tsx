'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Container, Section, Heading, Text } from '@/components/common';

// 灵感分类数据 - 所有6个分类
const inspirations = [
  {
    id: 1,
    title: "Food Journey",
    image: "/images/inspirations/food-journey.jpg",
    href: "/inspirations/food-journey"
  },
  {
    id: 2,
    title: "Great Outdoors",
    image: "/images/inspirations/great-outdoors.jpeg",
    href: "/inspirations/great-outdoors"
  },
  {
    id: 3,
    title: "Immersive Encounters",
    image: "/images/inspirations/traditional craft.png",
    href: "/inspirations/immersive-encounters"
  },
  {
    id: 4,
    title: "Spiritual Retreat",
    image: "/images/inspirations/spiritual retreat.webp",
    href: "/inspirations/spiritual-retreat"
  },
  {
    id: 5,
    title: "Vibrant Nightscapes",
    image: "/images/inspirations/nightscapes.jpg",
    href: "/inspirations/vibrant-nightscapes"
  },
  {
    id: 6,
    title: "Seasonal Highlights",
    image: "/images/inspirations/seasonal-highlights.jpg",
    href: "/inspirations/seasonal-highlights"
  }
];

export default function InspirationsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 自动轮播
  useEffect(() => {
    if (!isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % Math.ceil(inspirations.length / 3));
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isHovered]);

  // 滚动到当前索引
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollAmount = currentIndex * (389 + 36); // 卡片宽度 + gap
      scrollContainerRef.current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  return (
    <Section background="secondary" padding="xl" className="py-24 overflow-hidden">
      <div className="max-w-screen-2xl mx-auto">
        <Container size="xl">
          <div className="text-center mb-8">
            <Heading level={2} className="text-5xl font-heading">
              How do you want to travel
            </Heading>
          </div>
        </Container>

        <div className="bg-tertiary p-9 rounded-lg">
          <div 
            ref={scrollContainerRef}
            className="flex gap-9 justify-center overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide pl-9"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{ 
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {inspirations.map((inspiration) => (
              <Link 
                key={inspiration.id} 
                href={inspiration.href}
                className="relative w-[389px] h-[672px] overflow-hidden rounded-lg group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl flex-shrink-0 snap-start"
              >
                <img
                  src={inspiration.image}
                  alt={inspiration.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 flex flex-col justify-end p-8 transition-all duration-300">
                  <Heading 
                    level={3} 
                    className="text-4xl font-subheading text-white text-center mb-8 group-hover:text-yellow-300 transition-colors duration-300" 
                    style={{ color: '#FFFFFF' }}
                  >
                    {inspiration.title}
                  </Heading>
                  <span 
                    className="text-sm font-body text-white underline hover:no-underline mx-auto group-hover:text-yellow-300 transition-colors duration-300" 
                    style={{ color: '#FFFFFF' }}
                  >
                    view more
                  </span>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link 
              href="/inspirations"
              className="text-2xl font-body text-neutral-100 underline hover:no-underline hover:text-white transition-colors duration-300"
            >
              view all inspiration
            </Link>
          </div>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: Math.ceil(inspirations.length / 3) }).map((_, index) => (
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

