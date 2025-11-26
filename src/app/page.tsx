import Link from "next/link";
import HeroCarousel from "@/components/sections/HeroCarousel";
import JourneyCarousel from "@/components/sections/JourneyCarousel";
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
import { InspirationsSection } from '@/components/sections';

// 使用本地图片资源 - 按功能分类的图片路径
// 1. 主页主要功能卡片 (Main Action Cards)
const imgDestinationsButton = "/images/main-cards/destinations.jpeg"; // 目的地卡片
const imgJourneysButton = "/images/main-cards/journeys.jpeg"; // 旅程卡片
const imgInspirationsButton = "/images/main-cards/inspirations.png"; // 灵感卡片
const imgAccommodationsButton = "/images/main-cards/accommodations.jpg"; // 住宿卡片

// 2. 旅程滑动卡片 (Journey Slide Cards)
const imgJourneyCard1 = "/images/journey-cards/chengdu-deep-dive.jpeg"; // 成都一日深度游
const imgJourneyCard2 = "/images/journey-cards/chongqing-cyber-city.jpg"; // 重庆赛博城市
const imgJourneyCard3 = "/images/journey-cards/tibet-buddhist-journey.jpg"; // 西藏佛教之旅
const imgJourneyCard4 = "/images/journey-cards/food-tour.jpg"; // 美食之旅
const imgJourneyCard5 = "/images/journey-cards/chongqing-wulong-karst-national-park.jpg"; // 重庆武隆喀斯特国家公园
const imgJourneyCard6 = "/images/journey-cards/jiuzhaigou-huanglong-national-park-tour.jpg"; // 九寨沟黄龙国家公园之旅

// 3. 文章卡片 (Article Cards)
const imgArticle1 = "/images/article-cards/adventures-custom-made.jpg"; // 定制冒险
const imgArticle2 = "/images/article-cards/cyber-city-chongqing.jpg"; // 赛博城市重庆
const imgArticle3 = "/images/article-cards/chinese-food-tour.jpg"; // 中国美食之旅
const imgArticle4 = "/images/article-cards/tibet-buddhist-journey.jpg"; // 西藏佛教之旅
const imgArticle5 = "/images/article-cards/sacred-horizons.jpg"; // 神圣地平线

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Carousel - Figma Design */}
      <HeroCarousel 
        autoSlide={true}
        slideInterval={5000}
        showIndicators={true}
        showArrows={true}
      />

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
                
                <div className="absolute bottom-4 sm:bottom-8 lg:bottom-[99px] left-1/2 transform -translate-x-1/2 text-center w-[90%] sm:w-[222px] flex flex-col items-center justify-start">
                  {/* 移除内层遮罩的背景色，依赖外层渐变遮罩 */}
                  <div className="rounded-lg p-3 sm:p-4 w-full flex flex-col items-center justify-start">
                    <Heading level={3} className="text-lg sm:text-xl lg:text-2xl font-subheading mb-2 sm:mb-4 text-center text-white font-bold drop-shadow-lg" style={{ color: 'white' }}>Destinations</Heading>
                    <Text size="xs" className="leading-normal text-center text-white font-semibold drop-shadow-md text-xs sm:text-sm" style={{ color: 'white' }}>
                      Step into the Heart of China: From the Great Wall to Pandas, Your Adventure Begins.
                    </Text>
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
                
                <div className="absolute bottom-4 sm:bottom-8 lg:bottom-[99px] left-1/2 transform -translate-x-1/2 text-center w-[90%] sm:w-[222px] flex flex-col items-center justify-start">
                  {/* 移除内层遮罩的背景色，依赖外层渐变遮罩 */}
                  <div className="rounded-lg p-3 sm:p-4 w-full flex flex-col items-center justify-start">
                    <Heading level={3} className="text-lg sm:text-xl lg:text-2xl font-subheading mb-2 sm:mb-4 text-center text-white font-bold drop-shadow-lg" style={{ color: 'white' }}>Journeys</Heading>
                    <Text size="xs" className="leading-normal text-center text-white font-semibold drop-shadow-md text-xs sm:text-sm" style={{ color: 'white' }}>
                      Turn Your Travel Dreams into Reality: Curated Trips for Every Explorer.
                    </Text>
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
                
                <div className="absolute bottom-4 sm:bottom-8 lg:bottom-[99px] left-1/2 transform -translate-x-1/2 text-center w-[90%] sm:w-[222px] flex flex-col items-center justify-start">
                  {/* 移除内层遮罩的背景色，依赖外层渐变遮罩 */}
                  <div className="rounded-lg p-3 sm:p-4 w-full flex flex-col items-center justify-start">
                    <Heading level={3} className="text-lg sm:text-xl lg:text-2xl font-subheading mb-2 sm:mb-4 text-center text-white font-bold drop-shadow-lg" style={{ color: 'white' }}>Inspirations</Heading>
                    <Text size="xs" className="leading-normal text-center text-white font-semibold drop-shadow-md text-xs sm:text-sm" style={{ color: 'white' }}>
                      Find Your Spark: Uncover Stories, Culture, and China&apos;s Hidden Secrets.
                    </Text>
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
                
                <div className="absolute bottom-4 sm:bottom-8 lg:bottom-[99px] left-1/2 transform -translate-x-1/2 text-center w-[90%] sm:w-[222px] flex flex-col items-center justify-start">
                  {/* 移除内层遮罩的背景色，依赖外层渐变遮罩 */}
                  <div className="rounded-lg p-3 sm:p-4 w-full flex flex-col items-center justify-start">
                    <Heading level={3} className="text-lg sm:text-xl lg:text-2xl font-subheading mb-2 sm:mb-4 text-center text-white font-bold drop-shadow-lg" style={{ color: 'white' }}>Accommodations</Heading>
                    <Text size="xs" className="leading-normal text-center text-white font-semibold drop-shadow-md text-xs sm:text-sm" style={{ color: 'white' }}>
                      Rest Your Head in Authenticity: From Luxury Hotels to Ancient Inns.
                    </Text>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </Container>
      </Section>

      {/* Journey Section */}
      <JourneyCarousel
        subtitle="Journey"
        title="What do you want to travel"
        items={[
          { id: 1, title: "Chengdu One-Day Deep Dive", image: imgJourneyCard1, href: "/journeys" },
          { id: 2, title: "Chongqing Cyber City", image: imgJourneyCard2, href: "/journeys" },
          { id: 3, title: "Tibet Buddhist Journey", image: imgJourneyCard3, href: "/journeys" },
          { id: 4, title: "Chinese Food Tour", image: imgJourneyCard4, href: "/journeys" },
          { id: 5, title: "Chongqing Wulong Karst National Park", image: imgJourneyCard5, href: "/journeys" },
          { id: 6, title: "Jiuzhaigou Huanglong National Park Tour", image: imgJourneyCard6, href: "/journeys" }
        ]}
        autoPlay={true}
        interval={3000}
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
                className="text-white underline font-body hover:opacity-80 text-sm sm:text-base"
                style={{ color: 'white' }}
              >
                VIEW MORE
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
                  className="text-white underline font-body hover:opacity-80 group-hover:text-yellow-300 transition-colors duration-300 text-sm sm:text-base"
                  style={{ color: 'white' }}
                >
                  VIEW MORE
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
                  className="text-white underline font-body hover:opacity-80 group-hover:text-yellow-300 transition-colors duration-300 text-sm sm:text-base"
                  style={{ color: 'white' }}
                >
                  VIEW MORE
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
