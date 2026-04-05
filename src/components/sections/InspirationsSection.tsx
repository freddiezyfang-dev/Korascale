'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Container, Section, Heading, Text } from '@/components/common';
import {
  ARTICLE_CATEGORIES,
  ArticleCategoryToCardTitle,
  ArticleCategoryToHeroImage,
  ArticleCategoryToSlug,
} from '@/types/article';

const inspirations = ARTICLE_CATEGORIES.map((category, index) => ({
  id: index + 1,
  title: ArticleCategoryToCardTitle[category],
  image: ArticleCategoryToHeroImage[category],
  href: `/inspirations/${ArticleCategoryToSlug[category]}`,
}));

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
              Get inspired
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
                className="relative w-[280px] sm:w-[320px] md:w-[389px] aspect-[389/672] flex-shrink-0 overflow-hidden rounded-lg group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl snap-start"
              >
                <img
                  src={inspiration.image}
                  alt={inspiration.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 flex flex-col justify-end p-8 transition-all duration-300">
                  <Heading
                    level={3}
                    className="text-2xl md:text-3xl font-serif text-white text-center mb-8 group-hover:text-yellow-300 transition-colors duration-300 drop-shadow-md"
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

