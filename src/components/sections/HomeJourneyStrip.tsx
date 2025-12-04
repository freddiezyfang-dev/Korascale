'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, Text } from '@/components/common';

const imgJourneyCard1 = "/images/journey-cards/chengdu-deep-dive.jpeg";
const imgJourneyCard2 = "/images/journey-cards/chongqing-cyber-city.jpg";
const imgJourneyCard3 = "/images/journey-cards/tibet-buddhist-journey.jpg";
const imgJourneyCard4 = "/images/journey-cards/food-tour.jpg";
const imgJourneyCard5 = "/images/journey-cards/chongqing-wulong-karst-national-park.jpg";
const imgJourneyCard6 = "/images/journey-cards/jiuzhaigou-huanglong-national-park-tour.jpg";

const items = [
  {
    id: 1,
    title: "Chengdu One-Day Deep Dive",
    image: imgJourneyCard1,
    description: "Discover Chengdu's pandas, cuisine, and opera in a perfectly curated day of culture and flavor.",
    meta1: "1 Day • Limited to 12 guests",
    meta2: "Priced from $299",
  },
  {
    id: 2,
    title: "Chongqing Cyber City",
    image: imgJourneyCard2,
    description: "Neon skylines, vertigo-inducing bridges, and hotpot nights in China's most cinematic city.",
    meta1: "1 Day • Limited to 10 guests",
    meta2: "Priced from $249",
  },
  {
    id: 3,
    title: "Tibet Buddhist Journey",
    image: imgJourneyCard3,
    description: "Walk between monasteries, mountains, and sky, following ancient paths of pilgrimage and prayer.",
    meta1: "7 Days • Limited to 8 guests",
    meta2: "Priced from $1,899",
  },
  {
    id: 4,
    title: "Chinese Food Tour",
    image: imgJourneyCard4,
    description: "Taste your way through sizzling woks, spice markets, and family-run kitchens across China.",
    meta1: "4 Days • Limited to 10 guests",
    meta2: "Priced from $899",
  },
  {
    id: 5,
    title: "Chongqing Wulong Karst Adventure",
    image: imgJourneyCard5,
    description: "Descend into vast stone arches and dramatic karst valleys made famous on the silver screen.",
    meta1: "2 Days • Limited to 12 guests",
    meta2: "Priced from $399",
  },
  {
    id: 6,
    title: "Jiuzhaigou & Huanglong National Parks",
    image: imgJourneyCard6,
    description: "Crystal lakes, travertine pools, and alpine forests—two legendary parks in one sweeping journey.",
    meta1: "4 Days • Limited to 10 guests",
    meta2: "Priced from $1,099",
  },
];

export default function HomeJourneyStrip() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // 监听 section 是否在视口内，只有在视口内时才自动轮播，避免页面被强行拉回
  useEffect(() => {
    if (!wrapperRef.current || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: 0.3,
      }
    );

    observer.observe(wrapperRef.current);

    return () => observer.disconnect();
  }, []);

  // 自动轮播：每 4 秒滚动到下一张（仅在可见且未暂停时运行）
  useEffect(() => {
    if (!isInView || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isInView, isPaused]);

  // 当 currentIndex 变化时，滚动到对应卡片
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = container.querySelectorAll<HTMLDivElement>('[data-journey-card]');
    const target = children[currentIndex];
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [currentIndex]);

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        ref={containerRef}
        className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
      >
        {items.map((item) => (
          <div
            key={item.id}
            data-journey-card
            className="min-w-[260px] sm:min-w-[280px] md:min-w-[320px] lg:min-w-[360px] snap-start"
          >
            <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full bg-[#f5f1e6]">
              <div
                className="h-48 bg-cover bg-center bg-no-repeat flex-shrink-0"
                style={{ backgroundImage: `url('${item.image}')` }}
              />
              <div className="p-4 flex flex-col flex-1">
                <h3
                  className="text-lg font-['Montaga'] mb-2 leading-tight flex-shrink-0 font-normal"
                  style={{ fontWeight: 400 }}
                >
                  {item.title}
                </h3>
                <Text className="text-sm text-gray-600 mb-3 line-clamp-2 flex-shrink-0">
                  {item.description}
                </Text>
                <div className="mt-auto flex flex-col flex-shrink-0">
                  <Text
                    className="text-sm mb-1"
                    style={{ fontFamily: 'Monda, sans-serif', color: '#000000', fontWeight: 400, fontSize: '0.875rem' }}
                  >
                    {item.meta1}
                  </Text>
                  <Text
                    className="text-sm"
                    style={{ fontFamily: 'Monda, sans-serif', color: '#000000', fontWeight: 400, fontSize: '0.875rem' }}
                  >
                    {item.meta2}
                  </Text>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}


