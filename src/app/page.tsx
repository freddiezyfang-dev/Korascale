'use client';

import { useEffect, useState } from 'react';
import { Container, Section } from '@/components/common';
import { CategoryExplorer, EditorialMosaic } from '@/components/sections';
import OurPerspectiveSection from '@/components/sections/OurPerspectiveSection';
import TheLensBehindKorascaleSection from '@/components/sections/TheLensBehindKorascaleSection';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { articleAPI } from '@/lib/databaseClient';
import {
  Article,
  ArticleCategoryToSlug,
  ArticleCategoryToHeroImage,
  ArticleCategoryToCardTitle,
  ArticleCategoryToCardDescription,
  type ArticleCategory,
} from '@/types/article';

const HOME_INSPIRATION_CATEGORIES: ArticleCategory[] = [
  'Food Journey',
  'The Western Corridor',
  'Ancient Chinese Culture',
  'Spiritual Retreat',
];

const homeInspirationCards = HOME_INSPIRATION_CATEGORIES.map((cat, i) => ({
  id: String(i + 1),
  title: ArticleCategoryToCardTitle[cat],
  shortDescription: ArticleCategoryToCardDescription[cat],
  image: ArticleCategoryToHeroImage[cat],
  slug: ArticleCategoryToSlug[cat],
  href: `/inspirations/${ArticleCategoryToSlug[cat]}`,
}));

const imgJourneyCard1 = "/images/journey-cards/chengdu-deep-dive.jpeg";
const imgJourneyCard2 = "/images/journey-cards/chongqing-cyber-city.jpg";
const imgJourneyCard3 = "/images/journey-cards/tibet-buddhist-journey.jpg";
const imgJourneyCard4 = "/images/journey-cards/food-tour.jpg";
const imgJourneyCard5 = "/images/journey-cards/chongqing-wulong-karst-national-park.jpg";
const imgJourneyCard6 = "/images/journey-cards/jiuzhaigou-huanglong-national-park-tour.jpg";

const FALLBACK_CONTENT = [
  { title: 'Adventures Custom Made For You', image: '/images/article-cards/adventures-custom-made.jpg', href: '/journeys' },
  { title: 'Cyber-City Chongqing', image: '/images/article-cards/cyber-city-chongqing.jpg', href: '/destinations' },
  { title: 'Chinese Food Tour', image: '/images/article-cards/chinese-food-tour.jpg', href: '/inspirations' },
  { title: 'Sacred Horizons · A Tibetan Buddhist Journey', image: '/images/article-cards/tibet-buddhist-journey.jpg', href: '/journeys' },
  { title: 'Sacred Horizons', image: '/images/article-cards/sacred-horizons.jpg', href: '/inspirations' },
];

export default function Home() {
  const { journeys } = useJourneyManagement();
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    articleAPI.getFeatured().then(setFeaturedArticles);
  }, []);

  const contentItems = featuredArticles.length > 0
    ? featuredArticles.map((a) => ({
        title: a.title,
        image: a.heroImage || a.coverImage || '',
        href: `/inspirations/${ArticleCategoryToSlug[a.category]}/${a.slug}`,
        category: a.category,
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
            image: '/images/journey-cards/Northwest.jpg',
            slug: 'northwest',
            href: '/destinations/northwest'
          },
          {
            id: '3',
            title: 'North China',
            shortDescription: 'Experience the historical heartland of ancient China',
            image: '/images/journey-cards/North China.jpg',
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
        inspirations={homeInspirationCards}
      />

      {/* Editorial mosaic — featured inspirations / SEO articles */}
      <Section background="tertiary" padding="xl">
        <Container size="xl">
          <EditorialMosaic items={contentItems} />
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
