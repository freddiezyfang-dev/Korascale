'use client';

import React from 'react';
import { Journey } from '@/types';
import { DYNAMIC_PADDING } from './journeySectionLayout';
import { Check } from 'lucide-react';

const CONTENT_WRAPPER = `max-w-7xl mx-auto ${DYNAMIC_PADDING}`;

/** 主题绿（Explore Together 专用），仅在本组件内使用 */
const THEME_GREEN = '#2D4033';
const SERIF_FONT = 'Playfair Display, Montaga, serif';

interface ExploreTogetherLayoutProps {
  journey: Journey;
}

function getPriceDisplay(price: number | undefined | null, originalPrice?: number | null) {
  const num = typeof price === 'number' ? price : Number((price as any) ?? NaN);
  const formatted = !Number.isNaN(num) ? `$${num.toLocaleString()}` : '';
  if (originalPrice != null && originalPrice > (num || 0)) {
    return { from: formatted, was: `$${Number(originalPrice).toLocaleString()}` };
  }
  return { from: formatted, was: null };
}

export default function ExploreTogetherLayout({ journey }: ExploreTogetherLayoutProps) {
  const title = journey.pageTitle || journey.title;
  const subtitle = journey.shortDescription || journey.description;
  const introText = journey.overview?.description || journey.description || '';
  const overviewHighlights = journey.overview?.highlights ?? [];
  const stringHighlights = journey.highlights ?? [];
  const hasHighlights = overviewHighlights.length > 0 || stringHighlights.length > 0;
  const heroImage = journey.heroImage || journey.image || journey.images?.[0] || '';
  const mainContentImage = journey.mainContentImage || '';
  const itinerary = journey.itinerary || [];
  // 兼容 price（API/类型）、data.price、priceFrom 字符串；支持 number 或可解析的字符串
  const rawPrice = journey.price ?? (journey as any).data?.price ?? (journey as any).price;
  const priceNum =
    typeof rawPrice === 'number' ? rawPrice : (typeof rawPrice === 'string' && rawPrice !== '' ? Number(rawPrice) : NaN);
  const numPrice = !Number.isNaN(priceNum) ? priceNum : undefined;
  const priceValue = typeof (journey as any).priceFrom === 'string' ? (journey as any).priceFrom : undefined;
  const { from: priceFrom, was: priceWas } = getPriceDisplay(numPrice, journey.originalPrice);
  const priceDisplay = (priceFrom && priceFrom.trim() !== '') ? priceFrom : (priceValue && priceValue.trim() !== '') ? priceValue : null;

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Hero Banner: heroImage，主副标题下紧跟价格，大号衬线 + 简洁数字；不设 overflow-hidden 避免底部被裁切 */}
      <header className="relative w-full min-h-[50vh] md:min-h-[60vh] flex flex-col justify-end">
        {heroImage ? (
          <>
            <div
              className="absolute inset-0 bg-center bg-cover bg-no-repeat"
              style={{ backgroundImage: `url('${heroImage}')` }}
            />
            <div
              className="absolute inset-0 z-0"
              style={{
                background: 'linear-gradient(to top, rgba(45,64,51,0.88) 0%, rgba(45,64,51,0.35) 45%, transparent 72%)',
              }}
            />
          </>
        ) : (
          <div className="absolute inset-0 z-0" style={{ backgroundColor: THEME_GREEN }} />
        )}
        <div className={`relative z-10 ${DYNAMIC_PADDING} pb-12 md:pb-16 pt-24`}>
          <div className={CONTENT_WRAPPER}>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl text-white mb-4 tracking-tight"
              style={{ fontFamily: SERIF_FONT, fontWeight: 400, lineHeight: 1.1 }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-lg md:text-xl text-white/90 max-w-2xl leading-relaxed"
                style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}
              >
                {subtitle}
              </p>
            )}
            <div className="mt-8 pt-6 border-t border-white/20 w-full max-w-md">
              <span className="text-xs uppercase tracking-[0.2em] text-white/70 block mb-1">
                Price From
              </span>
              <span
                className="text-xl md:text-2xl text-white font-light tabular-nums"
                style={{ fontFamily: SERIF_FONT }}
              >
                {priceDisplay || '—'}
              </span>
              {priceWas && (
                <span className="text-base text-white/60 line-through tabular-nums ml-2">{priceWas}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Overview & Highlights: 主题绿背景，衬线 Overview 加大行距，Sans 小字 Highlights + Check */}
      <section
        className="w-full py-12 md:py-16"
        style={{ backgroundColor: THEME_GREEN }}
      >
        <div className={CONTENT_WRAPPER}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div>
              <h2
                className="text-xl md:text-2xl text-white mb-4"
                style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}
              >
                Overview
              </h2>
              <p
                className="text-white/95 text-lg md:text-xl leading-[1.75] whitespace-pre-line"
                style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}
              >
                {introText}
              </p>
            </div>
            {hasHighlights && (
              <div>
                <h2
                  className="text-xl md:text-2xl text-white mb-4"
                  style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}
                >
                  Highlights
                </h2>
                <ul className="space-y-3 font-sans text-sm text-white/90">
                  {overviewHighlights.map((h, i) => (
                    <li key={`o-${i}`} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                      <div>
                        {h.title && <span className="font-medium text-white">{h.title}</span>}
                        {h.description && <span className="text-white/85"> {h.description}</span>}
                      </div>
                    </li>
                  ))}
                  {stringHighlights.map((s, i) => (
                    <li key={`s-${i}`} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 2b. Main Content 大图：Overview 下方，留白 + 浅色细边框 */}
          {mainContentImage && (
            <div className="mt-12 md:mt-16">
              <div className="w-full py-6 md:py-10 px-4 md:px-8">
                <div className="relative w-full aspect-[21/9] mx-auto rounded-sm overflow-hidden border border-white/25 shadow-xl">
                  <img
                    src={mainContentImage}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Destination Itinerary: 无 Day 标签，轴线 + 节点为目的地名称，左时间+目的地名、右描述+4:3 图 */}
      {itinerary.length > 0 && (
        <section id="itinerary" className="w-full py-12 md:py-16 bg-[#FAF9F6]">
          <div className={CONTENT_WRAPPER}>
            <h2
              className="text-2xl md:text-3xl text-gray-900 mb-12"
              style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}
            >
              Destination Itinerary
            </h2>

            <div className="relative pl-10 md:pl-12">
              <div
                className="absolute left-[11px] top-6 bottom-6 w-px hidden md:block"
                style={{ backgroundColor: THEME_GREEN, opacity: 0.45 }}
              />
              {itinerary.map((day, index) => (
                <article
                  key={day.day ?? index}
                  className="relative flex flex-col lg:flex-row lg:items-start gap-6 py-8 md:py-10 border-b border-gray-200 last:border-b-0"
                >
                  <div
                    className="absolute w-6 h-6 rounded-full border-2 flex-shrink-0 z-10 mt-1 md:mt-2"
                    style={{
                      backgroundColor: '#FAF9F6',
                      borderColor: THEME_GREEN,
                      left: '11px',
                      transform: 'translateX(-50%)',
                    }}
                  />
                  <div className="flex-1 min-w-0 pl-4 md:pl-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 space-y-2">
                      <h3
                        className="text-lg md:text-xl text-gray-900"
                        style={{ fontFamily: SERIF_FONT, fontWeight: 400 }}
                      >
                        {day.title}
                      </h3>
                      {day.description && (
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm md:text-base">
                          {day.description}
                        </p>
                      )}
                    </div>
                    <div className="lg:col-span-5 flex justify-start lg:justify-end">
                      {day.image ? (
                        <div className="relative w-full max-w-sm aspect-[4/3] rounded overflow-hidden bg-gray-200 border border-gray-200">
                          <img
                            src={day.image}
                            alt={day.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full max-w-sm aspect-[4/3] rounded bg-gray-100 border border-gray-200" />
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
