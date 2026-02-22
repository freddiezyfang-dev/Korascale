'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { JourneyExperience } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DYNAMIC_GAP, DYNAMIC_PADDING } from './journeySectionLayout';

const SCROLL_AMOUNT = 400; // 360px 卡片 + 40px gap（与 md:gap-10 一致）

interface ExperiencesProps {
  experiences: JourneyExperience[];
  onExperienceClick?: (experience: JourneyExperience) => void;
}

export default function Experiences({ experiences, onExperienceClick }: ExperiencesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

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
  }, [experiences.length, updateScrollState]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT, behavior: 'smooth' });
  };

  return (
    <section className="w-full bg-white py-16 overflow-hidden">
      {/* 标题：移除 max-w，与下方滚动区使用相同 DYNAMIC_PADDING 保证垂直对齐 */}
      <div className={`text-left mb-10 ${DYNAMIC_PADDING}`}>
        <p className="text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-3">
          Amazing Experiences
        </p>
        <h2
          className="text-3xl font-serif text-gray-900"
          style={{ fontFamily: 'Montaga, serif', fontWeight: 400 }}
        >
          Amazing Experiences
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

        {/* 滚动容器：无 -mx，用 DYNAMIC_PADDING 产生侧边留白；gap 与 padding 一致保证对齐 */}
        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden scroll-smooth w-full scrollbar-hide"
        >
          <div className={`flex flex-nowrap items-start ${DYNAMIC_GAP} ${DYNAMIC_PADDING} pb-4`}>
            {experiences.map((exp, index) => (
              <article
                key={exp.id || index}
                onClick={() => onExperienceClick?.(exp)}
                className="journey-card flex flex-col flex-shrink-0 group cursor-pointer border border-gray-200 rounded-sm overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 mb-4">
                  {exp.mainImage ? (
                    <img
                      src={exp.mainImage}
                      alt={exp.title}
                      className="journey-card__img transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                      <span className="text-4xl">✨</span>
                    </div>
                  )}
                </div>

                <div className="text-left px-2 pb-4 flex flex-col flex-1">
                  {exp.location && (
                    <p className="text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-2">
                      {exp.location}
                    </p>
                  )}
                  <h3
                    className="text-lg font-serif text-gray-900 mb-1 line-clamp-1"
                    style={{ fontFamily: 'Montaga, serif', fontWeight: 400 }}
                  >
                    {exp.title}
                  </h3>
                  {exp.description ? (
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1">
                      {exp.description}
                    </p>
                  ) : (
                    <div className="flex-1" />
                  )}
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 mt-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExperienceClick?.(exp);
                    }}
                  >
                    Learn More
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
