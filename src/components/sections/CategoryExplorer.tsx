'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Journey } from '@/types';
import { Card, Text } from '@/components/common';
import { AccommodationCard } from '@/components/cards/AccommodationCard';

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
  accommodations?: CategoryItem[];
  inspirations?: CategoryItem[];
}

type CategoryType = 'destinations' | 'journeys' | 'accommodations' | 'inspirations';

export default function CategoryExplorer({
  journeys = [],
  destinations = [],
  accommodations = [],
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
      case 'accommodations':
        setDisplayedItems(accommodations.slice(0, 3));
        break;
      case 'inspirations':
        setDisplayedItems(inspirations.slice(0, 3));
        break;
      default:
        setDisplayedItems([]);
    }
  }, [activeCategory, destinations, journeys, accommodations, inspirations]);

  const categories: { key: CategoryType; label: string; href: string }[] = [
    { key: 'destinations', label: 'Destinations', href: '/destinations' },
    { key: 'journeys', label: 'Journeys', href: '/journeys' },
    { key: 'accommodations', label: 'Accommodations', href: '/accommodations' },
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

        {/* Cards Grid - 3张卡片并列显示 */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300"
          key={activeCategory}
          style={{ opacity: displayedItems.length > 0 ? 1 : 0.5 }}
        >
          {displayedItems.map((item) => {
            const href = item.href || item.slug 
              ? (item.href || `/${activeCategory}/${item.slug}`)
              : `/${activeCategory}`;

            // Destinations 使用特殊样式
            if (activeCategory === 'destinations') {
              return (
                <Link
                  key={item.id}
                  href={href}
                  className="block h-full"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden group cursor-pointer rounded-sm">
                    {/* 1. 背景图片层 */}
                    <img
                      src={item.image || '/images/placeholder.jpg'}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* 2. A&K 风格渐变遮罩层 - 从底部向上变深 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80" />

                    {/* 3. 文字内容层 - 位于底部并居中 */}
                    <div className="absolute inset-0 flex flex-col justify-end items-center pb-12 px-8 text-white text-center">
                      {/* 目的地标题 - 使用大字号衬线体 */}
                      <h3 className="text-3xl md:text-4xl font-heading mb-3 tracking-wide drop-shadow-sm">
                        {item.title}
                      </h3>
                      
                      {/* 描述文案 - 细体且行间距适中 */}
                      <p className="text-sm md:text-base font-body font-light leading-relaxed opacity-90 max-w-[280px]">
                        {item.shortDescription || item.description || ''}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            }

            // Accommodations 使用 AccommodationCard 组件
            if (activeCategory === 'accommodations') {
              return (
                <div key={item.id}>
                  <AccommodationCard
                    id={item.id}
                    title={item.title}
                    location={item.shortDescription || item.description || ''}
                    image={item.image || '/images/placeholder.jpg'}
                    description={item.description}
                    variant="light"
                    showWishlist={false}
                  />
                </div>
              );
            }

            // 其他类别使用原有格式
            // 获取价格信息（如果是 journey）
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

            return (
              <Link
                key={item.id}
                href={href}
                className="block h-full"
              >
                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full bg-[#f5f1e6] cursor-pointer">
                  {/* Image - 固定高度 h-48 */}
                  <div 
                    className="h-48 bg-cover bg-center bg-no-repeat flex-shrink-0"
                    style={{ backgroundImage: `url('${item.image || '/images/placeholder.jpg'}')` }}
                  />
                  
                  {/* Content - 与 journey filter 格式统一 */}
                  <div className="p-4 flex flex-col flex-1">
                    {/* Title */}
                    <h3 
                      className="text-lg font-heading mb-2 leading-tight flex-shrink-0 font-normal"
                      style={{ fontWeight: 400 }}
                    >
                      {item.title}
                    </h3>
                    
                    {/* Description */}
                    <Text className="text-sm text-gray-600 mb-3 line-clamp-2 flex-shrink-0">
                      {item.shortDescription || item.description || ''}
                    </Text>
                    
                    {/* Meta Information - 底部 */}
                    <div className="mt-auto flex flex-col flex-shrink-0">
                      {/* 第一行：Duration 和 Max Guests */}
                      {duration && (
                        <Text
                          className="text-sm mb-1"
                          style={{ fontFamily: 'Monda, sans-serif', color: '#000000', fontWeight: 400, fontSize: '0.875rem' }}
                        >
                          {duration}{maxGuests ? ` • Limited to ${maxGuests} guests` : ''}
                        </Text>
                      )}
                      {/* 第二行：价格 */}
                      {price && (
                        <Text
                          className="text-sm"
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

        {/* Explore All Button */}
        <div className="text-center mt-12 md:mt-16">
          <Link
            href={categories.find(c => c.key === activeCategory)?.href || '/journeys'}
            className="inline-block px-8 py-3 border-2 border-[#A65E3F] text-[#A65E3F] font-heading text-lg hover:bg-[#A65E3F] hover:text-white transition-all duration-300"
          >
            Explore All {categories.find(c => c.key === activeCategory)?.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

