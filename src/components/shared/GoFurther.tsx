'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Journey } from '@/types';
import { DYNAMIC_PADDING, DYNAMIC_GAP } from '@/components/journey/journeySectionLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CONTENT_WRAPPER = `max-w-7xl mx-auto ${DYNAMIC_PADDING}`;
const CARD_WIDTH = 320;
const CARD_GAP = 24;

interface GoFurtherProps {
  journeys: Journey[];
  excludeJourneyId: string;
}

export default function GoFurther({ journeys, excludeJourneyId }: GoFurtherProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const list = React.useMemo(
    () => journeys.filter((j) => j.id !== excludeJourneyId && j.slug),
    [journeys, excludeJourneyId]
  );

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [list.length, updateScrollState]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -(CARD_WIDTH + CARD_GAP) : CARD_WIDTH + CARD_GAP, behavior: 'smooth' });
  };

  if (list.length === 0) return null;

  return (
    <section className="w-full py-12 md:py-16 bg-white overflow-hidden">
      <div className={CONTENT_WRAPPER}>
        <h2
          className="text-2xl md:text-3xl text-gray-900 mb-8"
          style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif', fontWeight: 400 }}
        >
          Go Further
        </h2>
      </div>
      <div
        className="relative w-full group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-lg transition-all ${isHovering ? 'opacity-100' : 'opacity-0'}`}
            aria-label="向左滚动"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll('right')}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-lg transition-all ${isHovering ? 'opacity-100' : 'opacity-0'}`}
            aria-label="向右滚动"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden scroll-smooth w-full scrollbar-hide"
        >
          <div className={`flex flex-nowrap items-stretch ${DYNAMIC_GAP} ${DYNAMIC_PADDING} pb-4`}>
            {list.map((j) => (
              <Link
                key={j.id}
                href={`/journeys/${j.slug}`}
                className="flex-shrink-0 w-[280px] md:w-[320px] rounded-sm overflow-hidden border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
                  <img
                    src={j.heroImage || j.image || j.images?.[0] || ''}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 text-left">
                  <h3 className="font-serif text-gray-900 line-clamp-2 text-lg" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                    {j.pageTitle || j.title}
                  </h3>
                  {j.duration && (
                    <p className="text-sm text-gray-500 mt-1">{j.duration}</p>
                  )}
                  {typeof j.price === 'number' && (
                    <p className="text-sm font-medium text-gray-700 mt-1">
                      From ${j.price.toLocaleString()}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
