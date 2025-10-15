import Link from "next/link";
import HeroCarousel from "@/components/sections/HeroCarousel";
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
      <Section background="tertiary" padding="sm" className="py-6">
        <Container size="xl" padding="lg">
          <div className="flex gap-5 items-center justify-center">
            {/* Destinations Card */}
            <Link href="/destinations" className="group">
              <div 
                className="relative h-[463px] w-[284px] bg-center bg-cover bg-no-repeat overflow-hidden"
                style={{ backgroundImage: `url('${imgDestinationsButton}')` }}
              >
                <div className="absolute bottom-[99px] left-1/2 transform -translate-x-1/2 text-center text-white w-[222px] h-[140px] flex flex-col items-center justify-start">
                  <Heading level={3} color="inverse" className="text-2xl font-subheading mb-4 text-center">Destinations</Heading>
                  <Text size="xs" color="inverse" className="leading-normal text-center">
                    Step into the Heart of China: From the Great Wall to Pandas, Your Adventure Begins.
                  </Text>
                </div>
              </div>
            </Link>

            {/* Journeys Card */}
            <Link href="/journeys" className="group">
              <div 
                className="relative h-[463px] w-[284px] bg-center bg-cover bg-no-repeat overflow-hidden"
                style={{ backgroundImage: `url('${imgJourneysButton}')` }}
              >
                <div className="absolute bottom-[99px] left-1/2 transform -translate-x-1/2 text-center text-white w-[222px] h-[140px] flex flex-col items-center justify-start">
                  <Heading level={3} color="inverse" className="text-2xl font-subheading mb-4 text-center">Journeys</Heading>
                  <Text size="xs" color="inverse" className="leading-normal text-center">
                    Turn Your Travel Dreams into Reality: Curated Trips for Every Explorer.
                  </Text>
                </div>
              </div>
            </Link>

            {/* Inspirations Card */}
            <Link href="/inspirations" className="group">
              <div 
                className="relative h-[463px] w-[284px] bg-center bg-cover bg-no-repeat overflow-hidden"
                style={{ backgroundImage: `url('${imgInspirationsButton}')` }}
              >
                <div className="absolute bottom-[99px] left-1/2 transform -translate-x-1/2 text-center text-white w-[222px] h-[140px] flex flex-col items-center justify-start">
                  <Heading level={3} color="inverse" className="text-2xl font-subheading mb-4 text-center">Inspirations</Heading>
                  <Text size="xs" color="inverse" className="leading-normal text-center">
                    Find Your Spark: Uncover Stories, Culture, and China&apos;s Hidden Secrets.
                  </Text>
                </div>
              </div>
            </Link>

            {/* Accommodations Card */}
            <Link href="/accommodations" className="group">
              <div 
                className="relative h-[463px] w-[284px] bg-center bg-cover bg-no-repeat overflow-hidden"
                style={{ backgroundImage: `url('${imgAccommodationsButton}')` }}
              >
                <div className="absolute bottom-[99px] left-1/2 transform -translate-x-1/2 text-center text-white w-[222px] h-[140px] flex flex-col items-center justify-start">
                  <Heading level={3} color="inverse" className="text-2xl font-subheading mb-4 text-center">Accommodations</Heading>
                  <Text size="xs" color="inverse" className="leading-normal text-center">
                    Rest Your Head in Authenticity: From Luxury Hotels to Ancient Inns.
                  </Text>
                </div>
              </div>
            </Link>
          </div>
        </Container>
      </Section>

      {/* Journey Section */}
      <Section background="secondary" padding="xl">
        <Container size="xl">
          <div className="text-center mb-16">
            <Text size="xl" className="mb-4 font-[Monda] text-center text-black">Journey</Text>
            <Heading level={2} className="text-5xl font-[Montaga] text-center text-black">What do you want to travel</Heading>
          </div>

          {/* Slide Cards */}
          <div className="flex gap-8 overflow-x-auto pb-8">
            {[
              { id: 1, title: "Chengdu One-Day Deep Dive", image: imgJourneyCard1 },
              { id: 2, title: "Chongqing Cyber City", image: imgJourneyCard2 },
              { id: 3, title: "Tibet Buddhist Journey", image: imgJourneyCard3 },
              { id: 4, title: "Chinese Food Tour", image: imgJourneyCard4 },
              { id: 5, title: "Chongqing Wulong Karst National Park", image: imgJourneyCard5 },
              { id: 6, title: "Jiuzhaigou Huanglong National Park Tour", image: imgJourneyCard6 }
            ].map((item) => (
              <div key={item.id} className="bg-white h-[300px] w-[615px] flex-shrink-0 border-2 border-black rounded-lg overflow-hidden">
                <div className="flex h-full">
                  <div 
                    className="w-[344px] h-[225px] bg-center bg-cover bg-no-repeat m-4"
                    style={{ backgroundImage: `url('${item.image}')` }}
                  />
                  <div className="flex-1 p-4 flex flex-col justify-center">
                    <h3 className="text-2xl font-[Inknut_Antiqua] text-black mb-4">{item.title}</h3>
                    <Link href="/journeys" className="text-black underline text-sm font-[Monda] hover:opacity-80">
                      VIEW MORE
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Content Articles */}
      <Section background="tertiary" padding="xl">
        <Container size="xl">
          {/* Article 1 */}
          <div className="bg-[#1e3b32] flex flex-col lg:flex-row items-center gap-8 mb-16 rounded-lg overflow-hidden">
            <div 
              className="lg:w-1/2 h-[601px] bg-center bg-cover bg-no-repeat"
              style={{ backgroundImage: `url('${imgArticle1}')` }}
            />
            <div className="lg:w-1/2 p-8 text-white" style={{ color: 'white' }}>
              <h3 
                className="text-4xl font-[Barlow_Semi_Condensed] mb-6 text-white" 
                style={{ color: 'white' }}
              >
                Adventures Custom Made For You
              </h3>
              <p 
                className="text-lg mb-8 font-[Monda] text-white" 
                style={{ color: 'white' }}
              >
                Korascale offers fully tailored expeditions. Curate your own adventure by selecting from our unique experiences to build a handcrafted itinerary that is uniquely yours.
              </p>
              <Link 
                href="/journeys" 
                className="text-white underline font-[Monda] hover:opacity-80"
                style={{ color: 'white' }}
              >
                VIEW MORE
              </Link>
            </div>
          </div>

          {/* Article 2 & 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            <div className="bg-[#1e3b32] rounded-lg overflow-hidden">
              <div 
                className="h-[475px] bg-center bg-cover bg-no-repeat"
                style={{ backgroundImage: `url('${imgArticle2}')` }}
              />
              <div className="p-8 text-white" style={{ color: 'white' }}>
                <h3 
                  className="text-4xl font-[Barlow_Semi_Condensed] mb-6 text-white" 
                  style={{ color: 'white' }}
                >
                  Cyber-City Chongqing
                </h3>
                <p 
                  className="text-lg mb-8 font-[Monda] text-white" 
                  style={{ color: 'white' }}
                >
                  Where neon-drenched skyscrapers pierce the mist, rising from ancient hills. Experience the breathtaking fusion of cutting-edge lightscapes and timeless tradition.
                </p>
                <Link 
                  href="/destinations" 
                  className="text-white underline font-[Monda] hover:opacity-80"
                  style={{ color: 'white' }}
                >
                  VIEW MORE
                </Link>
              </div>
            </div>

            <div className="bg-[#1e3b32] rounded-lg overflow-hidden">
              <div 
                className="h-[479px] bg-center bg-cover bg-no-repeat"
                style={{ backgroundImage: `url('${imgArticle3}')` }}
              />
              <div className="p-8 text-white" style={{ color: 'white' }}>
                <h3 
                  className="text-4xl font-[Barlow_Semi_Condensed] mb-6 text-white" 
                  style={{ color: 'white' }}
                >
                  Chinese Food Tour
                </h3>
                <p 
                  className="text-lg mb-8 font-[Monda] text-white" 
                  style={{ color: 'white' }}
                >
                  Embark on the ultimate sensory adventure. Let your taste buds explode with flavors from China&apos;s diverse regions, guided by the wisdom of generations of culinary masters.
                </p>
                <Link 
                  href="/inspirations" 
                  className="text-white underline font-[Monda] hover:opacity-80"
                  style={{ color: 'white' }}
                >
                  VIEW MORE
                </Link>
              </div>
            </div>
          </div>

          {/* Article 4 & 5 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#1e3b32] rounded-lg overflow-hidden">
              <div 
                className="h-[479px] bg-center bg-cover bg-no-repeat"
                style={{ backgroundImage: `url('${imgArticle4}')` }}
              />
              <div className="p-8 text-white text-center" style={{ color: 'white' }}>
                <h3 
                  className="text-4xl font-[Barlow_Semi_Condensed] mb-6 text-white" 
                  style={{ color: 'white' }}
                >
                  Sacred Horizons · A Tibetan Buddhist Journey
                </h3>
                <p 
                  className="text-lg mb-8 font-[Monda] text-white" 
                  style={{ color: 'white' }}
                >
                  Discover the serene beauty of snow-capped mountains, ancient monasteries, and timeless Tibetan traditions. Immerse yourself in a cultural journey where spirituality meets breathtaking landscapes.
                </p>
                <Link 
                  href="/journeys" 
                  className="text-white underline font-[Monda] hover:opacity-80"
                  style={{ color: 'white' }}
                >
                  VIEW MORE
                </Link>
              </div>
            </div>

            <div className="bg-[#1e3b32] rounded-lg overflow-hidden">
              <div 
                className="h-[479px] bg-center bg-cover bg-no-repeat"
                style={{ backgroundImage: `url('${imgArticle5}')` }}
              />
              <div className="p-8 text-white text-center" style={{ color: 'white' }}>
                <h3 
                  className="text-4xl font-[Barlow_Semi_Condensed] mb-6 text-white" 
                  style={{ color: 'white' }}
                >
                  Sacred Horizons
                </h3>
                <p 
                  className="text-lg mb-8 font-[Monda] text-white" 
                  style={{ color: 'white' }}
                >
                  Discover the serene beauty of sacred landscapes and ancient traditions that have shaped civilizations for centuries.
                </p>
                <Link 
                  href="/inspirations" 
                  className="text-white underline font-[Monda] hover:opacity-80"
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
          <div className="text-center mb-16">
            <Text size="xl" className="mb-4 font-[Monda]">About Us</Text>
            <Heading level={2} className="text-5xl font-[Montaga]">Who will you travel with</Heading>
          </div>
        </Container>
      </Section>
    </div>
  );
}
