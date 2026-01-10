'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { InspirationsSection, CategoryExplorer } from '@/components/sections';
import OurPerspectiveSection from '@/components/sections/OurPerspectiveSection';
import TheLensBehindKorascaleSection from '@/components/sections/TheLensBehindKorascaleSection';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import hotelsData from '@/data/hotels.json';

// 使用本地图片资源 - 按功能分类的图片路径
// 1. 主页主要功能卡片 (Main Action Cards)
const imgDestinationsButton = "/images/main-cards/destinations.jpeg"; // 目的地卡片
const imgJourneysButton = "/images/main-cards/journeys.jpeg"; // 旅程卡片
const imgInspirationsButton = "/images/main-cards/inspirations.png"; // 灵感卡片
const imgAccommodationsButton = "/images/main-cards/accommodations.jpg"; // 住宿卡片

// 2. 旅程精选卡片 (用于首页 \"What do you want to travel\" 区域，样式与 journeys filter 卡片保持一致)
const imgJourneyCard1 = "/images/journey-cards/chengdu-deep-dive.jpeg";
const imgJourneyCard2 = "/images/journey-cards/chongqing-cyber-city.jpg";
const imgJourneyCard3 = "/images/journey-cards/tibet-buddhist-journey.jpg";
const imgJourneyCard4 = "/images/journey-cards/food-tour.jpg";
const imgJourneyCard5 = "/images/journey-cards/chongqing-wulong-karst-national-park.jpg";
const imgJourneyCard6 = "/images/journey-cards/jiuzhaigou-huanglong-national-park-tour.jpg";

// 3. 文章卡片 (Article Cards)
const imgArticle1 = "/images/article-cards/adventures-custom-made.jpg"; // 定制冒险
const imgArticle2 = "/images/article-cards/cyber-city-chongqing.jpg"; // 赛博城市重庆
const imgArticle3 = "/images/article-cards/chinese-food-tour.jpg"; // 中国美食之旅
const imgArticle4 = "/images/article-cards/tibet-buddhist-journey.jpg"; // 西藏佛教之旅
const imgArticle5 = "/images/article-cards/sacred-horizons.jpg"; // 神圣地平线

export default function Home() {
  const { journeys } = useJourneyManagement();
  
  // 确保页面加载时滚动到顶部
  useEffect(() => {
    // 如果 URL 中没有 hash，滚动到顶部
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

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
            title: 'Food Journey',
            shortDescription: 'Embark on a flavorful journey through Western China\'s soul',
            image: '/images/inspirations/food-journey.jpg',
            slug: 'food-journey',
            href: '/inspirations/food-journey'
          },
          {
            id: '2',
            title: 'Great Outdoors',
            shortDescription: 'Answer the call of the wild where China\'s epic landscapes unfold',
            image: '/images/inspirations/great-outdoors.jpeg',
            slug: 'great-outdoors',
            href: '/inspirations/great-outdoors'
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

      {/* Content Articles */}
      <Section background="tertiary" padding="xl">
        <Container size="xl">
          {/* Article 1 */}
          <div className="bg-[#1e3b32] flex flex-col lg:flex-row items-center gap-4 md:gap-8 mb-8 md:mb-16 rounded-lg overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
            <div 
              className="w-full lg:w-1/2 h-[300px] sm:h-[400px] md:h-[500px] lg:h-[601px] bg-center bg-cover bg-no-repeat transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundImage: `url('${imgArticle1}')` }}
            />
            <div className="w-full lg:w-1/2 p-4 md:p-6 lg:p-8 text-white" style={{ color: 'white' }}>
              <h3 
                className="text-2xl sm:text-3xl lg:text-4xl font-heading mb-4 md:mb-6 text-white" 
                style={{ color: 'white' }}
              >
                Adventures Custom Made For You
              </h3>
              <p 
                className="text-base sm:text-lg mb-6 md:mb-8 font-body text-white" 
                style={{ color: 'white' }}
              >
                Korascale offers fully tailored expeditions. Curate your own adventure by selecting from our unique experiences to build a handcrafted itinerary that is uniquely yours.
              </p>
              <Link 
                href="/journeys" 
                className="text-white underline font-body hover:opacity-80 text-base sm:text-lg"
                style={{ color: 'white' }}
              >
                view more
              </Link>
            </div>
          </div>

          {/* Article 2 & 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-16">
            <div className="bg-[#1e3b32] rounded-lg overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
              <Link href="/destinations">
                <div 
                  className="h-[250px] sm:h-[350px] md:h-[400px] lg:h-[475px] bg-center bg-cover bg-no-repeat transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundImage: `url('${imgArticle2}')` }}
                />
              </Link>
              <div className="p-4 md:p-6 lg:p-8 text-white" style={{ color: 'white' }}>
                <h3 
                  className="text-2xl sm:text-3xl lg:text-4xl font-heading mb-4 md:mb-6 text-white" 
                  style={{ color: 'white' }}
                >
                  Cyber-City Chongqing
                </h3>
                <p 
                  className="text-base sm:text-lg mb-6 md:mb-8 font-body text-white" 
                  style={{ color: 'white' }}
                >
                  Where neon-drenched skyscrapers pierce the mist, rising from ancient hills. Experience the breathtaking fusion of cutting-edge lightscapes and timeless tradition.
                </p>
                <Link 
                  href="/destinations" 
                  className="text-white underline font-body hover:opacity-80 group-hover:text-yellow-300 transition-colors duration-300 text-base sm:text-lg"
                  style={{ color: 'white' }}
                >
                  view more
                </Link>
              </div>
            </div>

            <div className="bg-[#1e3b32] rounded-lg overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
              <Link href="/inspirations">
                <div 
                  className="h-[250px] sm:h-[350px] md:h-[400px] lg:h-[479px] bg-center bg-cover bg-no-repeat transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundImage: `url('${imgArticle3}')` }}
                />
              </Link>
              <div className="p-4 md:p-6 lg:p-8 text-white" style={{ color: 'white' }}>
                <h3 
                  className="text-2xl sm:text-3xl lg:text-4xl font-heading mb-4 md:mb-6 text-white" 
                  style={{ color: 'white' }}
                >
                  Chinese Food Tour
                </h3>
                <p 
                  className="text-base sm:text-lg mb-6 md:mb-8 font-body text-white" 
                  style={{ color: 'white' }}
                >
                  Embark on the ultimate sensory adventure. Let your taste buds explode with flavors from China&apos;s diverse regions, guided by the wisdom of generations of culinary masters.
                </p>
                <Link 
                  href="/inspirations" 
                  className="text-white underline font-body hover:opacity-80 group-hover:text-yellow-300 transition-colors duration-300 text-base sm:text-lg"
                  style={{ color: 'white' }}
                >
                  view more
                </Link>
              </div>
            </div>
          </div>

          {/* Article 4 & 5 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            <div className="bg-[#1e3b32] rounded-lg overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
              <Link href="/journeys">
                <div 
                  className="h-[250px] sm:h-[350px] md:h-[400px] lg:h-[479px] bg-center bg-cover bg-no-repeat transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundImage: `url('${imgArticle4}')` }}
                />
              </Link>
              <div className="p-4 md:p-6 lg:p-8 text-white text-center" style={{ color: 'white' }}>
                <h3 
                  className="text-2xl sm:text-3xl lg:text-4xl font-heading mb-4 md:mb-6 text-white" 
                  style={{ color: 'white' }}
                >
                  Sacred Horizons · A Tibetan Buddhist Journey
                </h3>
                <p 
                  className="text-base sm:text-lg mb-6 md:mb-8 font-body text-white" 
                  style={{ color: 'white' }}
                >
                  Discover the serene beauty of snow-capped mountains, ancient monasteries, and timeless Tibetan traditions. Immerse yourself in a cultural journey where spirituality meets breathtaking landscapes.
                </p>
                <Link 
                  href="/journeys" 
                  className="text-white underline font-body hover:opacity-80 group-hover:text-yellow-300 transition-colors duration-300 text-sm sm:text-base"
                  style={{ color: 'white' }}
                >
                  VIEW MORE
                </Link>
              </div>
            </div>

            <div className="bg-[#1e3b32] rounded-lg overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
              <Link href="/inspirations">
                <div 
                  className="h-[250px] sm:h-[350px] md:h-[400px] lg:h-[479px] bg-center bg-cover bg-no-repeat transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundImage: `url('${imgArticle5}')` }}
                />
              </Link>
              <div className="p-4 md:p-6 lg:p-8 text-white text-center" style={{ color: 'white' }}>
                <h3 
                  className="text-2xl sm:text-3xl lg:text-4xl font-heading mb-4 md:mb-6 text-white" 
                  style={{ color: 'white' }}
                >
                  Sacred Horizons
                </h3>
                <p 
                  className="text-base sm:text-lg mb-6 md:mb-8 font-body text-white" 
                  style={{ color: 'white' }}
                >
                  Discover the serene beauty of sacred landscapes and ancient traditions that have shaped civilizations for centuries.
                </p>
                <Link 
                  href="/inspirations" 
                  className="text-white underline font-body hover:opacity-80 group-hover:text-yellow-300 transition-colors duration-300 text-base sm:text-lg"
                  style={{ color: 'white' }}
                >
                  view more
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Inspirations Section */}
      <InspirationsSection />

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
