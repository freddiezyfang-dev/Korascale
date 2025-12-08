'use client';

import { useEffect } from 'react';
import Link from "next/link";
import HeroCarousel from "@/components/sections/HeroCarousel";
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { InspirationsSection, HomeJourneyStrip } from '@/components/sections';

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
  // 确保页面加载时滚动到顶部
  useEffect(() => {
    // 如果 URL 中没有 hash，滚动到顶部
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Carousel - Figma Design */}
      <div className="w-full overflow-hidden">
        <HeroCarousel 
        videoSrc={process.env.NEXT_PUBLIC_HERO_VIDEO_URL || "/videos/Herobanner1.mp4"}
        autoSlide={true}
        slideInterval={5000}
        showIndicators={true}
        showArrows={true}
        />
      </div>

      {/* Intro text between Hero and Main Cards */}
      <section className="bg-[#F5F1E6]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-10">
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-relaxed text-[#1e3b32] font-[Montaga]">
            Korascale crafts journeys of depth, not just distance. We specialize in immersive cultural experiences and exclusive access, guiding travelers beyond sightseeing to forge genuine connections—with places, heritage, and fellow explorers. From curated small groups to fully bespoke itineraries, we turn travel into a story that becomes part of you.
          </p>
        </div>
      </section>

      {/* Main Action Cards - Figma Design */}
      <Section background="tertiary" padding="sm" className="py-4 md:py-6">
        <Container size="xl" padding="md">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 items-center justify-center">
            {/* Destinations Card */}
            <Link href="/destinations" className="group w-full">
              <div 
                className="relative h-[300px] sm:h-[400px] lg:h-[463px] w-full bg-center bg-cover bg-no-repeat overflow-hidden transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-2xl rounded-lg"
                style={{ 
                  backgroundImage: `url('${imgDestinationsButton}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* 渐变遮罩 - 从透明到半黑，让底部文字区域更易读 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 group-hover:via-black/30 transition-all duration-300"></div>
                
                <div className="absolute bottom-4 sm:bottom-6 lg:bottom-6 left-1/2 transform -translate-x-1/2 text-center w-[90%] sm:w-[222px] flex flex-col items-center justify-end">
                  <div className="rounded-lg px-3 sm:px-4 w-full flex flex-col items-center justify-end">
                    <Heading level={3} className="text-lg sm:text-xl lg:text-2xl font-subheading text-center text-white font-bold drop-shadow-lg" style={{ color: 'white' }}>Destinations</Heading>
                  </div>
                </div>
              </div>
            </Link>

            {/* Journeys Card */}
            <Link href="/journeys" className="group w-full">
              <div 
                className="relative h-[300px] sm:h-[400px] lg:h-[463px] w-full bg-center bg-cover bg-no-repeat overflow-hidden transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-2xl rounded-lg"
                style={{ 
                  backgroundImage: `url('${imgJourneysButton}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* 渐变遮罩 - 从透明到半黑，让底部文字区域更易读 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 group-hover:via-black/30 transition-all duration-300"></div>
                
                <div className="absolute bottom-4 sm:bottom-6 lg:bottom-6 left-1/2 transform -translate-x-1/2 text-center w-[90%] sm:w-[222px] flex flex-col items-center justify-end">
                  <div className="rounded-lg px-3 sm:px-4 w-full flex flex-col items-center justify-end">
                    <Heading level={3} className="text-lg sm:text-xl lg:text-2xl font-subheading text-center text-white font-bold drop-shadow-lg" style={{ color: 'white' }}>Journeys</Heading>
                  </div>
                </div>
              </div>
            </Link>

            {/* Inspirations Card */}
            <Link href="/inspirations" className="group w-full">
              <div 
                className="relative h-[300px] sm:h-[400px] lg:h-[463px] w-full bg-center bg-cover bg-no-repeat overflow-hidden transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-2xl rounded-lg"
                style={{ 
                  backgroundImage: `url('${imgInspirationsButton}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* 渐变遮罩 - 从透明到半黑，让底部文字区域更易读 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent group-hover:from-black/50 group-hover:via-black/20 transition-all duration-300"></div>
                
                <div className="absolute bottom-4 sm:bottom-6 lg:bottom-6 left-1/2 transform -translate-x-1/2 text-center w-[90%] sm:w-[222px] flex flex-col items-center justify-end">
                  <div className="rounded-lg px-3 sm:px-4 w-full flex flex-col items-center justify-end">
                    <Heading level={3} className="text-lg sm:text-xl lg:text-2xl font-subheading text-center text-white font-bold drop-shadow-lg" style={{ color: 'white' }}>Inspirations</Heading>
                  </div>
                </div>
              </div>
            </Link>

            {/* Accommodations Card */}
            <Link href="/accommodations" className="group w-full">
              <div 
                className="relative h-[300px] sm:h-[400px] lg:h-[463px] w-full bg-center bg-cover bg-no-repeat overflow-hidden transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-2xl rounded-lg"
                style={{ 
                  backgroundImage: `url('${imgAccommodationsButton}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* 渐变遮罩 - 从透明到半黑，让底部文字区域更易读 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 group-hover:via-black/30 transition-all duration-300"></div>
                
                <div className="absolute bottom-4 sm:bottom-6 lg:bottom-6 left-1/2 transform -translate-x-1/2 text-center w-[90%] sm:w-[222px] flex flex-col items-center justify-end">
                  <div className="rounded-lg px-3 sm:px-4 w-full flex flex-col items-center justify-end">
                    <Heading level={3} className="text-lg sm:text-xl lg:text-2xl font-subheading text-center text-white font-bold drop-shadow-lg" style={{ color: 'white' }}>Accommodations</Heading>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </Container>
      </Section>

      {/* What do you want to travel - 使用与 journeys filter 相同卡片样式，单行自动轮播 */}
      <Section background="secondary" padding="xl">
        <Container size="xl">
          <div className="text-center mb-10 md:mb-12 px-4">
            <Heading 
              level={2} 
              className="text-3xl sm:text-4xl md:text-5xl font-[Montaga]"
            >
              What do you want to travel
            </Heading>
          </div>

          <HomeJourneyStrip />
        </Container>
      </Section>

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
                className="text-2xl sm:text-3xl lg:text-4xl font-[Barlow_Semi_Condensed] mb-4 md:mb-6 text-white" 
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
                  className="text-2xl sm:text-3xl lg:text-4xl font-[Barlow_Semi_Condensed] mb-4 md:mb-6 text-white" 
                  style={{ color: 'white' }}
                >
                  Cyber-City Chongqing
                </h3>
                <p 
                  className="text-base sm:text-lg mb-6 md:mb-8 font-[Monda] text-white" 
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
                  className="text-2xl sm:text-3xl lg:text-4xl font-[Barlow_Semi_Condensed] mb-4 md:mb-6 text-white" 
                  style={{ color: 'white' }}
                >
                  Chinese Food Tour
                </h3>
                <p 
                  className="text-base sm:text-lg mb-6 md:mb-8 font-[Monda] text-white" 
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
                  className="text-2xl sm:text-3xl lg:text-4xl font-[Barlow_Semi_Condensed] mb-4 md:mb-6 text-white" 
                  style={{ color: 'white' }}
                >
                  Sacred Horizons · A Tibetan Buddhist Journey
                </h3>
                <p 
                  className="text-base sm:text-lg mb-6 md:mb-8 font-[Monda] text-white" 
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
                  className="text-2xl sm:text-3xl lg:text-4xl font-[Barlow_Semi_Condensed] mb-4 md:mb-6 text-white" 
                  style={{ color: 'white' }}
                >
                  Sacred Horizons
                </h3>
                <p 
                  className="text-base sm:text-lg mb-6 md:mb-8 font-[Monda] text-white" 
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

      {/* About Us Section */}
      <Section background="tertiary" padding="xl">
        <Container size="xl">
          <div className="text-center mb-8 md:mb-16 px-4">
            <Text size="lg" className="sm:text-xl mb-3 sm:mb-4 font-body">About Us</Text>
            <Heading level={2} className="text-3xl sm:text-4xl md:text-5xl font-[Montaga]">Who will you travel with</Heading>
          </div>
        </Container>
      </Section>
    </div>
  );
}
