'use client';

import Link from "next/link";
import { Container, Section, Heading, Text, Button, Card, Breadcrumb } from '@/components/common';
import { InspirationsSection, PlanningSectionNew, JourneyCarousel } from '@/components/sections';
import { useState, useEffect } from 'react';

// 图片资源 - 使用本地图片
const imgHeroBanner = "/images/hero/slide6.jpeg";
const imgSichuanChongqing = "/images/journey-cards/chengdu-deep-dive.jpeg";
const imgGansuQinghai = "/images/journey-cards/gansu-zhangye.jpg";
const imgShaanxi = "/images/journey-cards/shannxi-yejing.jpg";
const imgXinjiang = "/images/journey-cards/xinjiang-altstadt.webp";

// 省份数据
const provinces = [
  {
    id: 1,
    name: "Sichuan & Chongqing",
    image: imgSichuanChongqing,
    description: "熊猫之乡，火锅之都"
  },
  {
    id: 2,
    name: "Gansu & Qinghai",
    image: imgGansuQinghai,
    description: "丝绸之路，高原风光"
  },
  {
    id: 3,
    name: "Shaanxi",
    image: imgShaanxi,
    description: "古都西安，兵马俑"
  },
  {
    id: 4,
    name: "Xinjiang",
    image: imgXinjiang,
    description: "新疆维吾尔自治区"
  }
];

// 精选推荐数据
const featuredOffers = [
  {
    id: 1,
    title: "Chengdu One-Day Deep Dive",
    image: "/images/journey-cards/chengdu-deep-dive.jpeg",
    description: "Explore the cultural heart of Sichuan"
  },
  {
    id: 2,
    title: "Chongqing Wulong Karst",
    image: "/images/journey-cards/chongqing-wulong-karst-national-park.jpg",
    description: "Discover the natural wonders"
  },
  {
    id: 3,
    title: "Tibet Buddhist Journey",
    image: "/images/journey-cards/tibet-buddhist-journey.jpg",
    description: "Spiritual journey to the roof of the world"
  },
  {
    id: 4,
    title: "Jiuzhaigou Valley Tour",
    image: "/images/journey-cards/jiuzhaigou-valley-multi-color-lake.jpeg",
    description: "Experience the colorful lakes"
  }
];


export default function Destinations() {
  // 设置页面标题
  useEffect(() => {
    document.title = "Destinations - Korascale";
  }, []);

  return (
    <main className="min-h-screen bg-white">

      {/* Hero Banner */}
      <Section background="primary" padding="none" className="relative h-[800px]">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-85"
          style={{ backgroundImage: `url('${imgHeroBanner}')` }}
        />
        <div className="relative z-10 h-full flex flex-col">
          {/* Breadcrumb */}
          <div className="px-9 pt-2">
            <Breadcrumb 
              items={[{ label: 'Home', href: '/' }, { label: 'Destinations' }]}
              color="#FFFFFF"
              fontFamily="Montserrat, sans-serif"
              sizeClassName="text-lg md:text-xl"
            />
          </div>
          
          {/* Hero Content */}
          <div className="flex-1 flex items-center px-4">
            <div className="text-white max-w-4xl">
              {/* 主标题 */}
              <Heading 
                level={1} 
                className="text-5xl md:text-6xl lg:text-7xl font-normal mb-2 tracking-tight" 
                style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  color: '#FFFFFF' // 强制白色
                }}
              >
                Destinations
              </Heading>
              
              {/* 副标题 */}
              <Heading 
                level={2} 
                className="text-5xl md:text-6xl lg:text-7xl font-normal mb-6 tracking-tight" 
                style={{ 
                  fontFamily: 'Montserrat, sans-serif',
                  color: '#FFFFFF' // 强制白色
                }}
              >
                Tours <span style={{ fontFamily: 'Dancing Script, cursive' }}>made for you</span>
              </Heading>
              
              {/* 描述文字 */}
              <p 
                className="text-lg md:text-xl lg:text-2xl mt-6 leading-relaxed max-w-2xl" 
                style={{ 
                  fontFamily: 'Montagu Slab, serif',
                  color: '#FFFFFF' // 强制白色
                }}
              >
                Inspired travel to China, designed just for you
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Provinces Section */}
      <Section background="secondary" padding="xl" className="py-24">
        <Container size="xl">
          <div className="text-center mb-16">
            <Heading level={2} className="text-5xl font-heading mb-4">
              Your Next Adventure Awaits
            </Heading>
            <Text className="text-2xl text-black max-w-4xl mx-auto">
              Select a province to discover its unique landscapes, heritage, and experiences.
            </Text>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {provinces.map((province, index) => (
              <div
                key={province.id}
                className="relative h-[380px] overflow-hidden rounded-lg group cursor-pointer transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-2xl"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500 ease-in-out group-hover:scale-110"
                  style={{ backgroundImage: `url('${province.image}')` }}
                />
                {/* 渐变遮罩 - 从透明到半黑，让底部文字区域更易读 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 group-hover:via-black/30 transition-all duration-300"></div>
                
                {/* 添加额外的hover遮罩层 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center transform group-hover:scale-105 transition-all duration-300">
                    <Heading 
                      level={3} 
                      className="text-6xl font-heading mb-2 text-center text-white font-bold drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-300" 
                      style={{ color: 'white' }}
                    >
                      {province.name}
                    </Heading>
                    {province.id === 4 && (
                      <Text 
                        className="text-3xl font-heading text-center text-white font-semibold drop-shadow-md group-hover:drop-shadow-xl transition-all duration-300" 
                        style={{ color: 'white' }}
                      >
                        Uygur Autonomous Region
                      </Text>
                    )}
                  </div>
                </div>
                
                {/* 添加hover时的边框效果 */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 rounded-lg transition-all duration-300"></div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Featured Offers Section */}
      <div className="bg-tertiary py-24">
        <Container size="xl">
          <JourneyCarousel
            subtitle="Our Featured Offers"
            title="China guides and inspirations"
            items={featuredOffers.map(offer => ({
              id: offer.id,
              title: offer.title,
              image: offer.image,
              href: "/journeys"
            }))}
            autoPlay={true}
            interval={3000}
          />
        </Container>
      </div>

      {/* Inspirations Section */}
      <InspirationsSection />

      {/* Planning Section */}
      <PlanningSectionNew />
    </main>
  );
}