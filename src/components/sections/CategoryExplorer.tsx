'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Journey } from '@/types';
import { Card, Text } from '@/components/common';
import { getRenderableImageUrl } from '@/lib/imageUtils';

interface CategoryItem {
  id: string;
  title: string;
  shortDescription?: string;
  description?: string;
  image: string;
  slug?: string;
  href?: string;
}

interface CategoryExplorerProps {
  journeys?: Journey[];
  destinations?: CategoryItem[];
  inspirations?: CategoryItem[];
}

type CategoryType = 'destinations' | 'journeys' | 'businessVisits' | 'inspirations';

/** Shared tab panel rhythm — keeps height stable when switching tabs */
const TAB_PANEL_MIN_H = 'min-h-[420px] md:min-h-[460px]';
const CARD_PANEL_H = 'h-[420px] md:h-[460px]';
const CARD_IMAGE_H = 'h-[220px] shrink-0';
const TAB_CONTENT_MB = 'mb-0';
const TAB_CTA_MT = 'mt-12 md:mt-16';

const BUSINESS_VISITS_CARDS = [
	{
		title: 'For overseas teams visiting China',
		body: 'Trade shows, client visits, transportation, interpreters, and post-event experiences.',
	},
	{
		title: 'For China-based companies receiving overseas clients',
		body: 'Guest reception, factory visits, business dinners, and multilingual coordination.',
	},
] as const;

function BusinessVisitsPanel() {
	return (
		<div
			className={`flex min-h-[420px] flex-col overflow-hidden rounded-sm border border-black/[0.08] bg-[#FAF9F6] shadow-sm md:h-[460px]`}
		>
			<div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-5">
				<div className="relative h-[120px] overflow-hidden sm:h-[140px] lg:col-span-2 lg:h-full">
					<img
						src="/images/hero/shenzhen.jpg"
						alt="Business travel and client reception in China"
						className="absolute inset-0 h-full w-full object-cover"
					/>
					<div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1D302E]/20 to-transparent lg:from-[#1D302E]/25" />
				</div>

				<div className="flex flex-col justify-center px-5 py-4 sm:px-6 sm:py-5 lg:col-span-3 lg:px-8 lg:py-6">
					<p className="text-[10px] font-body font-medium uppercase tracking-[0.22em] text-[#5C6A68] sm:text-xs">
						For Business Visits
					</p>
					<h3 className="mt-2 line-clamp-2 font-heading text-xl leading-snug text-[#1E2725] sm:text-[1.35rem] lg:text-2xl">
						Business Visits &amp; Client Reception in China
					</h3>
					<p className="mt-2 line-clamp-3 max-w-xl text-sm leading-relaxed text-[#4B5A58] sm:text-[15px] sm:leading-[1.6]">
						Local coordination for overseas teams and China-based companies — transportation, interpreters,
						client visits, trade shows, and post-event experiences.
					</p>
				</div>
			</div>

			<div className="grid shrink-0 grid-cols-1 border-t border-black/[0.08] md:grid-cols-2">
				{BUSINESS_VISITS_CARDS.map((card, index) => (
					<div
						key={card.title}
						className={`bg-[#F5F2ED] px-5 py-3.5 sm:px-6 sm:py-4 ${index === 0 ? 'md:border-r md:border-black/[0.08]' : ''}`}
					>
						<h4 className="line-clamp-2 font-heading text-sm text-[#1E2725] sm:text-base">{card.title}</h4>
						<p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#4B5A58] sm:text-sm sm:leading-snug">
							{card.body}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}

export default function CategoryExplorer({
  journeys = [],
  destinations = [],
  inspirations = []
}: CategoryExplorerProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryType>('destinations');
  const [displayedItems, setDisplayedItems] = useState<CategoryItem[]>([]);

  // 根据 activeCategory 更新显示的卡片
  useEffect(() => {
    // 转换 journeys 数据格式
    const journeysAsItems: CategoryItem[] = journeys.slice(0, 3).map(journey => ({
      id: journey.id,
      title: journey.title,
      shortDescription: journey.shortDescription || journey.description?.substring(0, 100),
      image: journey.image,
      slug: journey.slug,
      href: `/journeys/${journey.slug}`
    }));

    switch (activeCategory) {
      case 'destinations':
        setDisplayedItems(destinations.slice(0, 3));
        break;
      case 'journeys':
        setDisplayedItems(journeysAsItems);
        break;
      case 'businessVisits':
        setDisplayedItems([]);
        break;
      case 'inspirations':
        setDisplayedItems(inspirations.slice(0, 3));
        break;
      default:
        setDisplayedItems([]);
    }
  }, [activeCategory, destinations, journeys, inspirations]);

  const categories: { key: CategoryType; label: string; href: string }[] = [
    { key: 'destinations', label: 'Destinations', href: '/destinations' },
    { key: 'journeys', label: 'Journeys', href: '/journeys' },
    { key: 'businessVisits', label: 'Business Visits', href: '/solutions/corporate-travel' },
    { key: 'inspirations', label: 'Inspirations', href: '/inspirations' }
  ];

  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header with Tabs */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 mb-12 md:mb-16">
          {categories.map((category) => (
            <button
              key={category.key}
              onMouseEnter={() => setActiveCategory(category.key)}
              className={`text-lg font-heading transition-all duration-300 relative pb-2 ${
                activeCategory === category.key
                  ? 'opacity-100 text-[#A65E3F]'
                  : 'opacity-40 text-gray-700 hover:opacity-60'
              }`}
            >
              {category.label}
              {activeCategory === category.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#A65E3F] transition-all duration-300"></span>
              )}
            </button>
          ))}
        </div>

        {/* Content area — unified height rhythm across tabs */}
        <div className={`${TAB_PANEL_MIN_H} ${TAB_CONTENT_MB}`}>
        {activeCategory === 'businessVisits' ? (
          <BusinessVisitsPanel />
        ) : (
        <div 
          className="grid h-full grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300"
          key={activeCategory}
          style={{ opacity: displayedItems.length > 0 ? 1 : 0.5 }}
        >
          {displayedItems.map((item) => {
            const href = item.href || item.slug 
              ? (item.href || `/${activeCategory}/${item.slug}`)
              : `/${activeCategory}`;

            // Destinations — image-led overlay cards, fixed panel height
            if (activeCategory === 'destinations') {
              return (
                <Link
                  key={item.id}
                  href={href}
                  className="block h-full"
                >
                  <div className={`relative ${CARD_PANEL_H} w-full overflow-hidden group cursor-pointer rounded-sm`}>
                    <img
                      src={getRenderableImageUrl(item.image)}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />

                    <div className="absolute inset-0 flex flex-col justify-end items-center px-6 pb-10 text-center text-white md:px-8 md:pb-12">
                      <h3 className="line-clamp-2 text-2xl font-heading tracking-wide drop-shadow-sm md:text-3xl">
                        {item.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 max-w-[280px] text-sm font-body font-light leading-relaxed opacity-90 md:text-base">
                        {item.shortDescription || item.description || ''}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            }

            // Journeys & Inspirations — product / editorial cards, shared height + image ratio
            const journeyItem = journeys.find(j => j.id === item.id);
            const maxGuests = journeyItem 
              ? (('maxGuests' in journeyItem && journeyItem.maxGuests) 
                  ? journeyItem.maxGuests 
                  : (('maxParticipants' in journeyItem && journeyItem.maxParticipants) 
                      ? journeyItem.maxParticipants 
                      : null))
              : null;
            const price = journeyItem && journeyItem.price
              ? (typeof journeyItem.price === 'number' ? `$${journeyItem.price}` : journeyItem.price)
              : null;
            const duration = journeyItem?.duration || null;
            const isInspirationCard = activeCategory === 'inspirations';

            return (
              <Link
                key={item.id}
                href={href}
                className="block h-full"
              >
                <Card className={`flex ${CARD_PANEL_H} flex-col overflow-hidden bg-[#f5f1e6] cursor-pointer shadow-lg transition-shadow hover:shadow-xl`}>
                  <div 
                    className={`${CARD_IMAGE_H} bg-cover bg-center bg-no-repeat`}
                    style={{ backgroundImage: `url('${getRenderableImageUrl(item.image)}')` }}
                  />
                  
                  <div className="flex min-h-0 flex-1 flex-col p-4 md:p-5">
                    <h3 
                      className={
                        isInspirationCard
                          ? 'mb-2 line-clamp-2 flex-shrink-0 font-serif text-xl leading-snug text-[#111] font-normal md:text-2xl'
                          : 'mb-2 line-clamp-2 flex-shrink-0 font-heading text-lg leading-tight font-normal'
                      }
                    >
                      {item.title}
                    </h3>
                    
                    <Text
                      className={
                        isInspirationCard
                          ? 'mb-3 line-clamp-3 flex-shrink-0 text-[15px] leading-[1.65] text-gray-700 md:text-base md:leading-[1.7]'
                          : 'mb-3 line-clamp-2 flex-shrink-0 text-sm text-gray-600'
                      }
                    >
                      {item.shortDescription || item.description || ''}
                    </Text>
                    
                    <div className="mt-auto flex flex-shrink-0 flex-col">
                      {duration && (
                        <Text
                          className="mb-1 line-clamp-1 text-sm"
                          style={{ fontFamily: 'Monda, sans-serif', color: '#000000', fontWeight: 400, fontSize: '0.875rem' }}
                        >
                          {duration}{maxGuests ? ` • Limited to ${maxGuests} guests` : ''}
                        </Text>
                      )}
                      {price && (
                        <Text
                          className="line-clamp-1 text-sm"
                          style={{ fontFamily: 'Monda, sans-serif', color: '#000000', fontWeight: 400, fontSize: '0.875rem' }}
                        >
                          {price !== 'N/A' ? `Priced from ${price}` : ''}
                        </Text>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
        )}
        </div>

        {/* Explore All — consistent placement for all tabs */}
        <div className={`text-center ${TAB_CTA_MT}`}>
          <Link
            href={categories.find(c => c.key === activeCategory)?.href || '/journeys'}
            className="inline-block rounded-lg bg-[#1e3b32] px-8 py-3 font-body text-lg uppercase text-white transition-all duration-300 hover:bg-[#1a342c]"
            style={{ color: '#FFFFFF' }}
          >
            {activeCategory === 'businessVisits'
              ? 'EXPLORE CORPORATE TRAVEL SUPPORT'
              : `EXPLORE ALL ${categories.find(c => c.key === activeCategory)?.label.toUpperCase()}`}
          </Link>
        </div>
      </div>
    </section>
  );
}

