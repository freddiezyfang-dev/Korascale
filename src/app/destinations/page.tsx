'use client';

import Link from "next/link";
import { Container, Section, Heading, Text, Button, Card, Breadcrumb } from '@/components/common';
import { InspirationsSection, PlanningSectionNew } from '@/components/sections';
import { useState, useEffect } from 'react';

// 图片资源 - 使用本地图片
const imgHeroBanner = "/images/hero/slide6.jpeg";
const imgSichuanChongqing = "/images/journey-cards/chengdu-deep-dive.jpeg";
const imgGansuQinghai = "/images/journey-cards/gansu-zhangye.jpg";
const imgShaanxi = "/images/journey-cards/shannxi-yejing.jpg";
const imgXinjiang = "/images/journey-cards/xinjiang-altstadt.webp";

// 地区数据
const regions = [
  {
    id: 1,
    name: "Southwest China",
    image: imgXinjiang,
    description: "Explore the diverse landscapes and rich cultural heritage of Southwest China",
    slug: "southwest-china"
  },
  {
    id: 2,
    name: "Northwest & Northern Frontier",
    image: imgGansuQinghai,
    description: "Discover the frontier regions with stunning natural beauty",
    slug: "northwest"
  },
  {
    id: 3,
    name: "North China",
    image: imgShaanxi,
    description: "Experience the historical heartland of ancient China",
    slug: "north"
  },
  {
    id: 4,
    name: "South China",
    image: imgSichuanChongqing,
    description: "Immerse yourself in the vibrant culture and cuisine of South China",
    slug: "south"
  },
  {
    id: 5,
    name: "East & Central China",
    image: imgSichuanChongqing,
    description: "Journey through the economic and cultural centers of China",
    slug: "east-central"
  }
];

export default function Destinations() {
  const [selectedRegion, setSelectedRegion] = useState(regions[0].id);
  
  // 设置页面标题
  useEffect(() => {
    document.title = "Destinations - Korascale";
  }, []);

  const selectedRegionData = regions.find(r => r.id === selectedRegion) || regions[0];

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

      {/* Regions Section - 左右分栏布局 */}
      <Section background="secondary" padding="none" className="py-12 bg-white">
        <div className="flex flex-col md:flex-row items-stretch min-h-[720px]">
          {/* 左侧图片区域 - 竖长方形 */}
          <div className="md:w-[45%] h-[640px] flex items-center justify-center p-8">
            <div className="relative w-full h-full rounded-xl overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500 ease-in-out"
                style={{ backgroundImage: `url('${selectedRegionData.image}')` }}
              />
              {/* 图片底部位置标签 */}
              <div className="absolute bottom-6 left-6 flex items-center gap-2 text-white">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <Text className="text-sm" style={{ fontFamily: 'Monda, sans-serif', color: '#FFFFFF' }}>
                  {selectedRegionData.name}
                </Text>
              </div>
            </div>
          </div>

          {/* 右侧地区列表 */}
          <div className="md:w-[55%] bg-white flex flex-col justify-center px-8 py-12">
            <div className="space-y-2">
              {regions.map((region) => {
                const isSelected = selectedRegion === region.id;

                const label = (
                  <button
                    type="button"
                    onClick={() => setSelectedRegion(region.id)}
                    className={`
                      w-full text-left py-4 px-4 transition-all duration-200
                      ${isSelected
                        ? 'font-bold text-black'
                        : 'font-normal text-gray-400 hover:text-gray-600'
                      }
                    `}
                    style={{
                      fontFamily: 'Montaga, serif',
                      fontSize: '2rem',
                      fontWeight: isSelected ? 700 : 400
                    }}
                  >
                    {region.name}
                  </button>
                );

                // 有 slug 的地区可点击进入详情页
                if (region.slug) {
                  return (
                    <Link key={region.id} href={`/destinations/${region.slug}`} className="block">
                      {label}
                    </Link>
                  );
                }

                return (
                  <div key={region.id}>
                    {label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      {/* Inspirations Section */}
      <InspirationsSection />

      {/* Planning Section */}
      <PlanningSectionNew />
    </main>
  );
}