'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { CategoryExplorer } from '@/components/sections';
import OurPerspectiveSection from '@/components/sections/OurPerspectiveSection';
import TheLensBehindKorascaleSection from '@/components/sections/TheLensBehindKorascaleSection';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { articleAPI } from '@/lib/databaseClient';
import { Article } from '@/types/article';
import { ArticleCategoryToSlug } from '@/types/article';
import hotelsData from '@/data/hotels.json';

const imgDestinationsButton = "/images/main-cards/destinations.jpeg";
const imgJourneysButton = "/images/main-cards/journeys.jpeg";
const imgInspirationsButton = "/images/main-cards/inspirations.png";
const imgAccommodationsButton = "/images/main-cards/accommodations.jpg";

const imgJourneyCard1 = "/images/journey-cards/chengdu-deep-dive.jpeg";
const imgJourneyCard2 = "/images/journey-cards/chongqing-cyber-city.jpg";
const imgJourneyCard3 = "/images/journey-cards/tibet-buddhist-journey.jpg";
const imgJourneyCard4 = "/images/journey-cards/food-tour.jpg";
const imgJourneyCard5 = "/images/journey-cards/chongqing-wulong-karst-national-park.jpg";
const imgJourneyCard6 = "/images/journey-cards/jiuzhaigou-huanglong-national-park-tour.jpg";

const FALLBACK_CONTENT = [
  { title: 'Adventures Custom Made For You', excerpt: 'Korascale offers fully tailored expeditions. Curate your own adventure by selecting from our unique experiences.', image: '/images/article-cards/adventures-custom-made.jpg', href: '/journeys' },
  { title: 'Cyber-City Chongqing', excerpt: 'Where neon-drenched skyscrapers pierce the mist, rising from ancient hills.', image: '/images/article-cards/cyber-city-chongqing.jpg', href: '/destinations' },
  { title: 'Chinese Food Tour', excerpt: 'Embark on the ultimate sensory adventure. Let your taste buds explode with flavors from China\'s diverse regions.', image: '/images/article-cards/chinese-food-tour.jpg', href: '/inspirations' },
  { title: 'Sacred Horizons · A Tibetan Buddhist Journey', excerpt: 'Discover the serene beauty of snow-capped mountains, ancient monasteries, and timeless Tibetan traditions.', image: '/images/article-cards/tibet-buddhist-journey.jpg', href: '/journeys' },
  { title: 'Sacred Horizons', excerpt: 'Discover the serene beauty of sacred landscapes and ancient traditions.', image: '/images/article-cards/sacred-horizons.jpg', href: '/inspirations' },
];

const CONTENT_GRADIENT = 'bg-gradient-to-t from-black/60 to-transparent';
const SERIF_FONT = 'var(--font-playfair), Playfair Display, serif';

export default function Home() {
  const { journeys } = useJourneyManagement();
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    articleAPI.getFeatured().then(setFeaturedArticles);
  }, []);

  const contentItems = featuredArticles.length >= 5
    ? featuredArticles.slice(0, 5).map((a) => ({
        title: a.title,
        excerpt: a.excerpt || '',
        image: a.heroImage || a.coverImage || '',
        href: `/inspirations/${ArticleCategoryToSlug[a.category]}/${a.slug}`,
      }))
    : FALLBACK_CONTENT;

  return (
    <div className="min-h-screen bg-white">
      {/* 修复后的全宽容器 */}
      <div className="w-full flex flex-col">
        
        {/* 1. Hero Section */}
        <div className="relative w-full h-[85vh] min-h-[600px] overflow-hidden">
          
          {/* 核心修复：确保视频组件内部有正确的 video 标签属性 */}
          <div className="absolute inset-0 z-0">
            {/* 如果 HeroCarousel 内部有问题，可以暂时用原生 video 测试 */}
            <video
              src={process.env.NEXT_PUBLIC_HERO_VIDEO_URL || "/videos/Herobanner1.mp4"}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {/* A&K 风格遮罩层：不要太黑，20%-30% 即可 */}
            <div className="absolute inset-0 bg-black/20 z-10" />
          </div>

          {/* 2. 文字覆盖层：确保 z-index 高于视频和遮罩 */}
          <div className="relative z-20 flex items-center justify-center h-full">
            <div className="text-center text-white px-6 max-w-6xl">
              <h1 className="text-5xl md:text-8xl font-heading leading-[1.05] tracking-tight drop-shadow-2xl text-white" style={{ color: '#FFFFFF' }}>
                Korascale designs journeys through a <br className="hidden md:block" /> China that is still in motion.
              </h1>
            </div>
          </div>
        </div>

        {/* 2. Brand Philosophy Block - 平衡后的比例 */}
        <section className="w-full bg-[#FAF9F6] py-24 md:py-48 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-8 text-center flex flex-col gap-16 md:gap-20">
            
            {/* 引言：从 9xl 降至 5xl，保持精致感 */}
            <p className="text-3xl md:text-5xl font-heading italic text-[#111] leading-[1.3] tracking-tight max-w-5xl mx-auto">
              "China is often presented in extremes — ancient civilizations or futuristic megacities. We work in the space in between."
            </p>

            {/* 正文：从 3xl 降至 xl，增加行高，复刻 A&K 质感 */}
            <p className="text-lg md:text-xl font-body font-light text-[#555] leading-[2.0] tracking-wide max-w-3xl mx-auto opacity-90">
              Our journeys move through borderlands, highlands, and evolving communities, where traditions are negotiated rather than preserved, and landscapes are lived in rather than staged. We choose places carefully, return to them often, and leave when they no longer make sense.
            </p>
            
          </div>
        </section>
      </div>

      {/* Category Explorer - 替换原有的 Main Action Cards */}
      <CategoryExplorer 
        journeys={journeys}
        destinations={[
          {
            id: '1',
            title: 'Southwest China',
            shortDescription: 'Explore the diverse landscapes and rich cultural heritage',
            image: '/images/journey-cards/chengdu-deep-dive.jpeg',
            slug: 'southwest-china',
            href: '/destinations/southwest-china'
          },
          {
            id: '2',
            title: 'Northwest & Northern Frontier',
            shortDescription: 'Discover the frontier regions with stunning natural beauty',
            image: '/images/journey-cards/gansu-zhangye.jpg',
            slug: 'northwest',
            href: '/destinations/northwest'
          },
          {
            id: '3',
            title: 'North China',
            shortDescription: 'Experience the historical heartland of ancient China',
            image: '/images/journey-cards/shannxi-yejing.jpg',
            slug: 'north',
            href: '/destinations/north'
          },
          {
            id: '4',
            title: 'South China',
            shortDescription: 'Immerse yourself in the vibrant culture and cuisine',
            image: '/images/journey-cards/chengdu-deep-dive.jpeg',
            slug: 'south',
            href: '/destinations/south'
          },
          {
            id: '5',
            title: 'East & Central China',
            shortDescription: 'Journey through the economic and cultural centers',
            image: '/images/journey-cards/chengdu-deep-dive.jpeg',
            slug: 'east-central',
            href: '/destinations/east-central'
          }
        ]}
        accommodations={hotelsData.hotels.slice(0, 3).map(hotel => ({
          id: hotel.id,
          title: hotel.name,
          shortDescription: hotel.location,
          description: hotel.description,
          image: hotel.images[0] || '/images/placeholder.jpg',
          slug: hotel.id,
          href: '/accommodations'
        }))}
        inspirations={[
          {
            id: '1',
            title: 'How to Plan a China Trip: A Logic-First Guide (2026)',
            shortDescription: 'Embark on a flavorful journey through Western China\'s soul',
            image: '/images/inspirations/food-journey.jpg',
            slug: 'food-journey',
            href: '/inspirations/food-journey'
          },
          {
            id: '2',
            title: 'The Western Corridor',
            shortDescription: 'Answer the call of the wild where China\'s epic landscapes unfold',
            image: '/images/inspirations/great-outdoors.jpeg',
            slug: 'the-western-corridor',
            href: '/inspirations/the-western-corridor'
          },
          {
            id: '3',
            title: 'Immersive Encounters',
            shortDescription: 'Go beyond observation and step into the role of an apprentice',
            image: '/images/inspirations/traditional%20craft.png',
            slug: 'immersive-encounters',
            href: '/inspirations/immersive-encounters'
          },
          {
            id: '4',
            title: 'Spiritual Retreat',
            shortDescription: 'Approach with respect and an open heart',
            image: '/images/inspirations/spiritual%20retreat.webp',
            slug: 'spiritual-retreat',
            href: '/inspirations/spiritual-retreat'
          }
        ]}
      />

      {/* Content Section：后台精选 5 篇 (featured + display_order)，无则用占位；移动端单列，图片铺满无灰边 */}
      <Section background="tertiary" padding="xl">
        <Container size="xl">
          {/* 移动端单列；桌面端保持 1 大 + 2+2 网格 */}
          <div className="flex flex-col md:grid md:grid-cols-2 md:gap-6 lg:gap-8">
            {/* Slot 1：大图 aspect-[4/5]，桌面端占整行或左半 */}
            <Link
              href={contentItems[0]?.href || '#'}
              className="relative w-full overflow-hidden rounded-lg mb-6 md:mb-0 md:col-span-2 flex flex-col md:flex-row md:items-stretch group"
            >
              <div className="relative w-full md:w-1/2 aspect-[4/5] overflow-hidden bg-gray-200 flex-shrink-0">
                {contentItems[0]?.image ? (
                  <img
                    src={contentItems[0].image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#1e3b32]" />
                )}
                <div className={`absolute inset-0 flex flex-col justify-end p-4 md:hidden ${CONTENT_GRADIENT}`}>
                  <h3 className="text-xl font-serif text-white" style={{ fontFamily: SERIF_FONT }}>
                    {contentItems[0]?.title}
                  </h3>
                  <span className="text-white/90 text-sm mt-1">view more</span>
                </div>
              </div>
              <div className="w-full md:w-1/2 bg-[#1e3b32] p-4 md:p-6 lg:p-8 flex flex-col justify-center hidden md:flex">
                <h3 className="text-2xl lg:text-4xl font-serif text-white mb-4" style={{ fontFamily: SERIF_FONT }}>
                  {contentItems[0]?.title}
                </h3>
                <p className="text-white/90 font-body text-base lg:text-lg mb-4">{contentItems[0]?.excerpt}</p>
                <span className="text-white underline font-body text-base">view more</span>
              </div>
            </Link>

            {/* Slots 2–5：小图 aspect-square，强制 relative overflow-hidden + img 填满 */}
            {[1, 2, 3, 4].map((i) => (
              <Link
                key={i}
                href={contentItems[i]?.href || '#'}
                className="relative w-full overflow-hidden rounded-lg group block mb-6 md:mb-0"
              >
                <div className="relative w-full aspect-square overflow-hidden bg-gray-200">
                  {contentItems[i]?.image ? (
                    <img
                      src={contentItems[i].image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#1e3b32]" />
                  )}
                  <div className={`absolute inset-0 flex flex-col justify-end p-4 ${CONTENT_GRADIENT}`}>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-serif text-white" style={{ fontFamily: SERIF_FONT }}>
                      {contentItems[i]?.title}
                    </h3>
                    <span className="text-white/90 text-sm mt-1">view more</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* Brand Philosophy Section 1: Our Perspective */}
      <OurPerspectiveSection 
        imageSrc="/images/brand-philosophy/WechatIMG160.jpg"
        videoSrc="/videos/brand-philosophy/1月7日 .mp4"
      />

      {/* Brand Philosophy Section 2: The Lens Behind Korascale */}
      {/* 注意：如果你有专门的背景图片，请替换下面的路径 */}
      <TheLensBehindKorascaleSection 
        backgroundImage="/images/brand-philosophy/WechatIMG160.jpg"
        // backgroundVideo="/videos/brand-philosophy/1月7日 .mp4" // 如果需要使用视频作为背景，取消注释这行
      />
    </div>
  );
}
