'use client';

import Link from "next/link";
import { Container, Section, Heading, Text, Button, Breadcrumb } from '@/components/common';
import { PlanningSectionNew } from '@/components/sections';
import { useState, useEffect } from 'react';

// 图片资源
const imgHeroBanner = "/images/hero/slide7-emeishan.jpg";
const imgFoodJourney = "/images/inspirations/food-journey.jpg";
const imgGreatOutdoors = "/images/inspirations/great-outdoors.jpeg";
const imgImmersiveEncounters = "/images/inspirations/traditional%20craft.png";
const imgSpiritualRetreat = "/images/inspirations/spiritual%20retreat.webp";
const imgVibrantNightscapes = "/images/inspirations/nightscapes.jpg";
const imgSeasonalHighlights = "/images/inspirations/seasonal-highlights.jpg";

// 灵感分类数据
const inspirations = [
  {
    id: 1,
    title: "Food Journey",
    image: imgFoodJourney,
    description: "Embark on a flavorful journey through Western China's soul. From the smoky night markets of Chengdu to the bustling bazaars of Kashgar, our guides unlock a world of taste. Explore handpicked culinary adventures that connect you with Uyghur, Tibetan, Hui, and Han traditions—one unforgettable bite at a time.",
    isFullWidth: true
  },
  {
    id: 2,
    title: "Great Outdoors",
    image: imgGreatOutdoors,
    description: "Answer the call of the wild where China's epic landscapes unfold. Korascale curates journeys for every pace: trekking routes to sacred summits like Gongga Shan, self-drive adventures along the legendary G318 highway, and silent moments before turquoise alpine lakes. Our expertise turns remote trails and breathtaking vistas into your personal playground."
  },
  {
    id: 3,
    title: "Immersive Encounters",
    image: imgImmersiveEncounters,
    description: "Go beyond observation and step into the role of an apprentice. Under the guidance of master artisans, learn the ancient techniques that have defined our cultures for generations. Shape your own thangka painting, feel the rhythm of traditional loom weaving, or forge a piece of nomadic silverware. These are not just souvenirs; they are your stories, crafted by your own hands."
  },
  {
    id: 4,
    title: "Spiritual Retreat",
    image: imgSpiritualRetreat,
    description: "Approach with respect and an open heart. This is a space for quiet observation and profound learning. Gain a deeper understanding of Tibetan Buddhist culture through guided moments: witnessing the morning debates of monks at a monastic academy, walking the kora (pilgrimage path) alongside devoted locals, or simply sitting in contemplation within ancient temple walls. These encounters offer a rare glimpse into a world of devotion and philosophy."
  },
  {
    id: 5,
    title: "Vibrant Nightscapes",
    image: imgVibrantNightscapes,
    description: "As the sun sets, a new energy emerges. Experience the pulse of modern China through rooftop bars in Shanghai, sizzling street food markets in Chengdu, traditional opera performances, and dazzling light shows on the Victoria Harbour. Your night is just beginning.",
    isRightAligned: true
  },
  {
    id: 6,
    title: "Seasonal Highlights",
    image: imgSeasonalHighlights,
    description: "From the cherry blossoms of a Wuhan spring to the ice festivals of a Harbin winter, discover the best times to visit and experience China's ever-changing beauty. Plan your journey around these unforgettable seasonal spectacles."
  }
];

export default function Inspirations() {
  // 设置页面标题
  useEffect(() => {
    document.title = "Inspirations - Korascale";
  }, []);

  return (
    <main>
      {/* Hero Banner */}
      <Section background="primary" padding="none" className="relative h-[800px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${imgHeroBanner}')`, filter: 'brightness(1.3) contrast(1.1)' }}
        />
        <div className="absolute inset-0 bg-white/15" />
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Breadcrumb Navigation */}
        <div className="relative z-10 pt-6 pl-6 md:pt-8 md:pl-12">
          <Breadcrumb 
            items={[{ label: 'Home', href: '/' }, { label: 'Inspirations' }]}
            color="#FFFFFF"
            fontFamily="Montserrat, sans-serif"
            sizeClassName="text-lg md:text-xl"
          />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center px-4">
          <div className="text-center text-white max-w-4xl">
            <Heading 
              level={1} 
              className="text-6xl md:text-7xl lg:text-8xl font-normal mb-2 tracking-tight" 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                color: '#FFFFFF'
              }}
            >
              Inspirations
            </Heading>
          </div>
        </div>
      </Section>

      {/* Ways to Explore Section */}
      <Section background="secondary" padding="xl" className="py-24">
        <Container size="xl">
          {/* Food Journey - Full Width */}
          <div className="mb-16">
              <div className="relative h-[334px] rounded-lg overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <img
                src={inspirations[0].image}
                alt={inspirations[0].title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 flex items-center justify-end pr-16 transition-all duration-300">
                <div className="bg-tertiary/90 backdrop-blur-sm p-8 rounded-lg max-w-md">
                  <Heading 
                    level={3} 
                    className="text-2xl font-subheading mb-4 text-center text-white" 
                    style={{ color: '#FFFFFF' }}
                  >
                    {inspirations[0].title}
                  </Heading>
                  <Text 
                    className="text-sm mb-6 text-center text-white" 
                    style={{ color: '#FFFFFF' }}
                  >
                    {inspirations[0].description}
                  </Text>
                  <Link href={`/inspirations/${'food-journey'}`} 
                    className="text-xs font-body underline hover:no-underline mx-auto block group-hover:text-yellow-300 transition-colors duration-300 text-white" 
                    style={{ color: '#FFFFFF' }}
                  >
                    VIEW MORE
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Three Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
            {inspirations.slice(1, 4).map((inspiration) => (
              <div key={inspiration.id} className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                <div className="relative h-[357px] rounded-lg overflow-hidden mb-6">
                  <img
                    src={inspiration.image}
                    alt={inspiration.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="text-center px-8">
                  <Heading 
                    level={3} 
                    className="text-xl font-subheading mb-4" 
                    style={{ color: '#000000' }}
                  >
                    {inspiration.title}
                  </Heading>
                  <Text 
                    className="text-xs mb-6 leading-relaxed px-2" 
                    style={{ color: '#000000' }}
                  >
                    {inspiration.description}
                  </Text>
                  <Link href={`/inspirations/${inspiration.title.toLowerCase().replace(/\s+/g,'-')}`} 
                    className="text-xs font-body underline hover:no-underline group-hover:text-yellow-300 transition-colors duration-300" 
                    style={{ color: '#000000' }}
                  >
                    VIEW MORE
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Row - Two Columns (Left: Seasonal Highlights text below, Right: Nightscapes overlay card) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left - Seasonal Highlights (image with text below) */}
            <div className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="relative h-[357px] rounded-lg overflow-hidden mb-6">
                <img src={imgSeasonalHighlights} alt="Seasonal Highlights" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="text-left px-8">
                <Heading level={3} className="text-xl font-subheading mb-4" style={{ color: '#000000' }}>
                  Seasonal Highlights
                </Heading>
                <Text className="text-xs mb-6 leading-relaxed pr-6" style={{ color: '#000000' }}>
                  From the cherry blossoms of a Wuhan spring to the ice festivals of a Harbin winter, discover the best times to visit and experience China&apos;s ever-changing beauty. Plan your journey around these unforgettable seasonal spectacles.
                </Text>
                <Link href={`/inspirations/${'seasonal-highlights'}`} className="text-xs font-body underline hover:no-underline transition-colors duration-300" style={{ color: '#000000' }}>
                  VIEW MORE
                </Link>
              </div>
            </div>

            {/* Right - Vibrant Nightscapes (image with text below, consistent with others) */}
            <div className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="relative h-[357px] rounded-lg overflow-hidden mb-6">
                <img src={imgVibrantNightscapes} alt="Vibrant Nightscapes" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="text-center px-8">
                <Heading level={3} className="text-xl font-subheading mb-4" style={{ color: '#000000' }}>
                  Vibrant Nightscapes
                </Heading>
                <Text className="text-xs mb-6 leading-relaxed px-2" style={{ color: '#000000' }}>
                  As the sun sets, a new energy emerges. Experience the pulse of modern China through rooftop bars in Shanghai, sizzling street food markets in Chengdu, traditional opera performances, and dazzling light shows on the Victoria Harbour. Your night is just beginning.
                </Text>
                <Link href={`/inspirations/${'vibrant-nightscapes'}`} className="text-xs font-body underline hover:no-underline transition-colors duration-300" style={{ color: '#000000' }}>
                  VIEW MORE
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Planning Section */}
      <PlanningSectionNew />
    </main>
  );
}