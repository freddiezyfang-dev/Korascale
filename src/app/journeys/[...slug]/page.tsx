'use client';

import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Container, Section, Heading, Text, Button, Card, Breadcrumb } from '@/components/common';
import { ExperienceCard } from '@/components/cards/ExperienceCard';
import { AccommodationCard } from '@/components/cards/AccommodationCard';
// import { HotelDetailModal } from '@/components/modals/HotelDetailModal';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { useExperienceManagement } from '@/context/ExperienceManagementContext';
import { useHotelManagement } from '@/context/HotelManagementContext';
import { generateStandardPageConfig, JOURNEY_PAGE_TEMPLATE } from '@/lib/journeyPageTemplate';
import { useCart } from '@/context/CartContext';
import { Journey } from '@/types';
import { MapPin, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import JourneyMap from '@/components/map/JourneyMap';
import StandardInclusions from '@/components/journey/StandardInclusions';
import OfferCard from '@/components/journey/OfferCard';
import OfferIcon from '@/components/journey/OfferIcon';
import InclusionsAndOffers from '@/components/journey/InclusionsAndOffers';
import Extensions from '@/components/journey/Extensions';
import Hotels from '@/components/journey/Hotels';

// Details Accordion 组件 - 用于可折叠的技术细节
function DetailsAccordion({ meals, accommodation, transportation }: { meals?: string[]; accommodation?: string; transportation?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasDetails = (meals && meals.length > 0) || accommodation || transportation;
  
  if (!hasDetails) return null;
  
  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <span className="font-medium">Details</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {isOpen && (
        <div className="mt-3 space-y-2 text-xs text-gray-500">
          {meals && meals.length > 0 && (
            <div>
              <span className="font-medium text-gray-600">Meals: </span>
              {meals.join(', ')}
            </div>
          )}
          {accommodation && (
            <div>
              <span className="font-medium text-gray-600">Accommodation: </span>
              {accommodation}
            </div>
          )}
          {transportation && (
            <div>
              <span className="font-medium text-gray-600">Transportation: </span>
              {transportation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Journey Type slugs 映射（移到组件外部，避免每次渲染都创建新数组）
// 注意：这里用于路由识别和重定向，必须包含所有 journey type 的 slug
const JOURNEY_TYPE_SLUGS = ['explore-together', 'deep-discovery', 'signature-journeys', 'group-tours'] as const;

// 通用地理坐标知识库（Geo Dictionary）
// 支持中英文关键词匹配，可随时扩展新地点
const CITY_GEO_DB: Record<string, { lng: number; lat: number; name: string }> = {
  // 四川地区
  'jiuzhaigou': { lng: 103.92, lat: 33.26, name: 'Jiuzhaigou' },
  '九寨沟': { lng: 103.92, lat: 33.26, name: 'Jiuzhaigou' },
  'chengdu': { lng: 104.06, lat: 30.67, name: 'Chengdu' },
  '成都': { lng: 104.06, lat: 30.67, name: 'Chengdu' },
  'chongqing': { lng: 106.55, lat: 29.5628, name: 'Chongqing' },
  '重庆': { lng: 106.55, lat: 29.5628, name: 'Chongqing' },
  'chongqing city': { lng: 106.55, lat: 29.5628, name: 'Chongqing' },
  // 华东地区
  'shanghai': { lng: 121.469170, lat: 31.224361, name: 'Shanghai' },
  '上海': { lng: 121.469170, lat: 31.224361, name: 'Shanghai' },
  'shanghai city': { lng: 121.469170, lat: 31.224361, name: 'Shanghai' },
  'suzhou': { lng: 120.5954, lat: 31.3041, name: 'Suzhou' },
  '苏州': { lng: 120.5954, lat: 31.3041, name: 'Suzhou' },
  'suzhou city': { lng: 120.5954, lat: 31.3041, name: 'Suzhou' },
  'nanjing': { lng: 118.77889, lat: 32.06083, name: 'Nanjing' },
  '南京': { lng: 118.77889, lat: 32.06083, name: 'Nanjing' },
  'nanjing city': { lng: 118.77889, lat: 32.06083, name: 'Nanjing' },
  'hangzhou': { lng: 120.16142, lat: 30.29365, name: 'Hangzhou' },
  '杭州': { lng: 120.16142, lat: 30.29365, name: 'Hangzhou' },
  'hangzhou city': { lng: 120.16142, lat: 30.29365, name: 'Hangzhou' },
  'qiandao lake': { lng: 118.99000, lat: 29.60917, name: 'Qiandao Lake' },
  'qiandaohu': { lng: 118.99000, lat: 29.60917, name: 'Qiandao Lake' },
  '千岛湖': { lng: 118.99000, lat: 29.60917, name: 'Qiandao Lake' },
  'thousand island lake': { lng: 118.99000, lat: 29.60917, name: 'Qiandao Lake' },
  'chunan': { lng: 119.04, lat: 29.61, name: 'Chun\'an County' },
  '淳安': { lng: 119.04, lat: 29.61, name: 'Chun\'an County' },
  '淳安县': { lng: 119.04, lat: 29.61, name: 'Chun\'an County' },
  // 安徽黄山地区
  'huangshan': { lng: 118.3376, lat: 29.7114, name: 'Huangshan' },
  '黄山': { lng: 118.3376, lat: 29.7114, name: 'Huangshan' },
  'huangshan city': { lng: 118.3376, lat: 29.7114, name: 'Huangshan City' },
  '黄山市': { lng: 118.3376, lat: 29.7114, name: 'Huangshan City' },
  'hongcun': { lng: 117.9905, lat: 30.0033, name: 'Hongcun' },
  '宏村': { lng: 117.9905, lat: 30.0033, name: 'Hongcun' },
  'hongcun village': { lng: 117.9905, lat: 30.0033, name: 'Hongcun Ancient Village' },
  '宏村古村落': { lng: 117.9905, lat: 30.0033, name: 'Hongcun Ancient Village' },
  'yixian': { lng: 117.9905, lat: 30.0033, name: 'Yixian County' },
  '黟县': { lng: 117.9905, lat: 30.0033, name: 'Yixian County' },
  '黟县宏村': { lng: 117.9905, lat: 30.0033, name: 'Hongcun, Yixian' },
  'xixinan': { lng: 118.25, lat: 29.75, name: 'Xixinan Ancient Village' },
  '西溪南': { lng: 118.25, lat: 29.75, name: 'Xixinan Ancient Village' },
  'xixinan ancient village': { lng: 118.25, lat: 29.75, name: 'Xixinan Ancient Village' },
  '西溪南古村落': { lng: 118.25, lat: 29.75, name: 'Xixinan Ancient Village' },
  'huizhou': { lng: 118.3376, lat: 29.7114, name: 'Huizhou' },
  '徽州': { lng: 118.3376, lat: 29.7114, name: 'Huizhou' },
  // 华南地区
  'guangzhou': { lng: 113.253250, lat: 23.128994, name: 'Guangzhou' },
  '广州': { lng: 113.253250, lat: 23.128994, name: 'Guangzhou' },
  'guangzhou city': { lng: 113.253250, lat: 23.128994, name: 'Guangzhou' },
  'chaozhou': { lng: 116.6225970, lat: 23.6569720, name: 'Chaozhou' },
  '潮州': { lng: 116.6225970, lat: 23.6569720, name: 'Chaozhou' },
  'chaozhou city': { lng: 116.6225970, lat: 23.6569720, name: 'Chaozhou' },
  'shantou': { lng: 116.682, lat: 23.354, name: 'Shantou' },
  '汕头': { lng: 116.682, lat: 23.354, name: 'Shantou' },
  'shantou city': { lng: 116.682, lat: 23.354, name: 'Shantou' },
  'jieyang': { lng: 116.3655, lat: 23.5418, name: 'Jieyang' },
  '揭阳': { lng: 116.3655, lat: 23.5418, name: 'Jieyang' },
  'jieyang city': { lng: 116.3655, lat: 23.5418, name: 'Jieyang' },
  'chaoshan': { lng: 116.6225970, lat: 23.6569720, name: 'Chaoshan' },
  '潮汕': { lng: 116.6225970, lat: 23.6569720, name: 'Chaoshan' },
  'xiamen': { lng: 118.082, lat: 24.4798, name: 'Xiamen' },
  '厦门': { lng: 118.082, lat: 24.4798, name: 'Xiamen' },
  'xiamen city': { lng: 118.082, lat: 24.4798, name: 'Xiamen' },
  'longyan': { lng: 117.017, lat: 25.076, name: 'Longyan' },
  '龙岩': { lng: 117.017, lat: 25.076, name: 'Longyan' },
  'longyan city': { lng: 117.017, lat: 25.076, name: 'Longyan' },
  '龙岩市': { lng: 117.017, lat: 25.076, name: 'Longyan' },
  // 广西地区
  'nanning': { lng: 108.3167, lat: 22.8167, name: 'Nanning' },
  '南宁': { lng: 108.3167, lat: 22.8167, name: 'Nanning' },
  'nanning city': { lng: 108.3167, lat: 22.8167, name: 'Nanning' },
  'pingxiang': { lng: 106.766, lat: 22.094, name: 'Pingxiang' },
  '凭祥': { lng: 106.766, lat: 22.094, name: 'Pingxiang' },
  'pingxiang city': { lng: 106.766, lat: 22.094, name: 'Pingxiang' },
  'chongzuo': { lng: 107.365, lat: 22.377, name: 'Chongzuo' },
  '崇左': { lng: 107.365, lat: 22.377, name: 'Chongzuo' },
  'chongzuo city': { lng: 107.365, lat: 22.377, name: 'Chongzuo' },
  '崇左市': { lng: 107.365, lat: 22.377, name: 'Chongzuo' },
  'detian waterfall': { lng: 106.7220, lat: 22.8564, name: 'Detian Waterfall' },
  'detian': { lng: 106.7220, lat: 22.8564, name: 'Detian Waterfall' },
  '德天瀑布': { lng: 106.7220, lat: 22.8564, name: 'Detian Waterfall' },
  'ban gioc detian falls': { lng: 106.7220, lat: 22.8564, name: 'Detian Waterfall' },
  'guilin': { lng: 110.2964, lat: 25.2802, name: 'Guilin' },
  '桂林': { lng: 110.2964, lat: 25.2802, name: 'Guilin' },
  'guilin city': { lng: 110.2964, lat: 25.2802, name: 'Guilin' },
  'yangshuo': { lng: 110.500, lat: 24.783, name: 'Yangshuo' },
  '阳朔': { lng: 110.500, lat: 24.783, name: 'Yangshuo' },
  'yangshuo county': { lng: 110.500, lat: 24.783, name: 'Yangshuo County' },
  '阳朔县': { lng: 110.500, lat: 24.783, name: 'Yangshuo County' },
  // 新疆地区
  'urumqi': { lng: 87.616852, lat: 43.825592, name: 'Urumqi' },
  '乌鲁木齐': { lng: 87.616852, lat: 43.825592, name: 'Urumqi' },
  'urumqi city': { lng: 87.616852, lat: 43.825592, name: 'Urumqi' },
  'sayram lake': { lng: 81.2, lat: 44.6, name: 'Sayram Lake' },
  'sairam lake': { lng: 81.2, lat: 44.6, name: 'Sayram Lake' },
  '赛里木湖': { lng: 81.2, lat: 44.6, name: 'Sayram Lake' },
  'yining': { lng: 81.2777, lat: 43.9080, name: 'Yining' },
  '伊宁': { lng: 81.2777, lat: 43.9080, name: 'Yining' },
  'yining city': { lng: 81.2777, lat: 43.9080, name: 'Yining' },
  'ili': { lng: 81.2777, lat: 43.9080, name: 'Ili' },
  '伊犁': { lng: 81.2777, lat: 43.9080, name: 'Ili' },
  'kurdening': { lng: 82.3, lat: 43.3, name: 'Kurdening Nature Reserve' },
  '库尔德宁': { lng: 82.3, lat: 43.3, name: 'Kurdening Nature Reserve' },
  'kurdening nature reserve': { lng: 82.3, lat: 43.3, name: 'Kurdening Nature Reserve' },
  '库尔德宁自然保护区': { lng: 82.3, lat: 43.3, name: 'Kurdening Nature Reserve' },
  'gongliu': { lng: 82.14889, lat: 43.46667, name: 'Gongliu County' },
  '巩留': { lng: 82.14889, lat: 43.46667, name: 'Gongliu County' },
  '巩留县': { lng: 82.14889, lat: 43.46667, name: 'Gongliu County' },
  'nalati': { lng: 85.22, lat: 43.08, name: 'Nalati Grassland' },
  '那拉提': { lng: 85.22, lat: 43.08, name: 'Nalati Grassland' },
  'nalati grassland': { lng: 85.22, lat: 43.08, name: 'Nalati Grassland' },
  '那拉提草原': { lng: 85.22, lat: 43.08, name: 'Nalati Grassland' },
  'altay': { lng: 88.13083, lat: 47.82694, name: 'Altay City' },
  'altay city': { lng: 88.13083, lat: 47.82694, name: 'Altay City' },
  '阿勒泰': { lng: 88.13083, lat: 47.82694, name: 'Altay City' },
  '阿勒泰市': { lng: 88.13083, lat: 47.82694, name: 'Altay City' },
  'hemu': { lng: 87.434361, lat: 48.5695, name: 'Hemu Village' },
  'hemu village': { lng: 87.434361, lat: 48.5695, name: 'Hemu Village' },
  '禾木': { lng: 87.434361, lat: 48.5695, name: 'Hemu Village' },
  '禾木村': { lng: 87.434361, lat: 48.5695, name: 'Hemu Village' },
  'kanas': { lng: 87.04000, lat: 48.81500, name: 'Kanas Lake' },
  'kanas lake': { lng: 87.04000, lat: 48.81500, name: 'Kanas Lake' },
  '喀纳斯': { lng: 87.04000, lat: 48.81500, name: 'Kanas Lake' },
  '喀纳斯湖': { lng: 87.04000, lat: 48.81500, name: 'Kanas Lake' },
  'baihaba': { lng: 86.8, lat: 48.6, name: 'Baihaba Village' },
  'baihaba village': { lng: 86.8, lat: 48.6, name: 'Baihaba Village' },
  '白哈巴': { lng: 86.8, lat: 48.6, name: 'Baihaba Village' },
  '白哈巴村': { lng: 86.8, lat: 48.6, name: 'Baihaba Village' },
  // 甘肃/新疆地区
  'dunhuang': { lng: 94.661880, lat: 40.142132, name: 'Dunhuang' },
  'dunhuang city': { lng: 94.661880, lat: 40.142132, name: 'Dunhuang' },
  '敦煌': { lng: 94.661880, lat: 40.142132, name: 'Dunhuang' },
  '敦煌市': { lng: 94.661880, lat: 40.142132, name: 'Dunhuang' },
  'hami': { lng: 93.497772, lat: 42.821594, name: 'Hami' },
  'hami city': { lng: 93.497772, lat: 42.821594, name: 'Hami' },
  '哈密': { lng: 93.497772, lat: 42.821594, name: 'Hami' },
  '哈密市': { lng: 93.497772, lat: 42.821594, name: 'Hami' },
  'kumul': { lng: 93.497772, lat: 42.821594, name: 'Hami' },
  'turpan': { lng: 89.1895, lat: 42.9512, name: 'Turpan' },
  'turpan city': { lng: 89.1895, lat: 42.9512, name: 'Turpan' },
  '吐鲁番': { lng: 89.1895, lat: 42.9512, name: 'Turpan' },
  '吐鲁番市': { lng: 89.1895, lat: 42.9512, name: 'Turpan' },
  'kumtag desert': { lng: 90.2667, lat: 42.7, name: 'Kumtag Desert' },
  '库姆塔格': { lng: 90.2667, lat: 42.7, name: 'Kumtag Desert' },
  '库姆塔格沙漠': { lng: 90.2667, lat: 42.7, name: 'Kumtag Desert' },
  'shanshan': { lng: 90.2046, lat: 42.8675, name: 'Shanshan County' },
  'shanshan county': { lng: 90.2046, lat: 42.8675, name: 'Shanshan County' },
  '鄯善': { lng: 90.2046, lat: 42.8675, name: 'Shanshan County' },
  '鄯善县': { lng: 90.2046, lat: 42.8675, name: 'Shanshan County' },
  // 青海/甘肃地区
  'xining': { lng: 101.778, lat: 36.6212, name: 'Xining' },
  'xining city': { lng: 101.778, lat: 36.6212, name: 'Xining' },
  '西宁': { lng: 101.778, lat: 36.6212, name: 'Xining' },
  '西宁市': { lng: 101.778, lat: 36.6212, name: 'Xining' },
  'qinghai lake': { lng: 100.189819, lat: 36.844460, name: 'Qinghai Lake' },
  '青海湖': { lng: 100.189819, lat: 36.844460, name: 'Qinghai Lake' },
  'gangcha': { lng: 100.150, lat: 37.317, name: 'Gangcha County' },
  'gangcha county': { lng: 100.150, lat: 37.317, name: 'Gangcha County' },
  '刚察': { lng: 100.150, lat: 37.317, name: 'Gangcha County' },
  '刚察县': { lng: 100.150, lat: 37.317, name: 'Gangcha County' },
  'qilian': { lng: 99.767, lat: 38.150, name: 'Qilian County' },
  'qilian county': { lng: 99.767, lat: 38.150, name: 'Qilian County' },
  '祁连': { lng: 99.767, lat: 38.150, name: 'Qilian County' },
  '祁连县': { lng: 99.767, lat: 38.150, name: 'Qilian County' },
  'zhangye': { lng: 100.449, lat: 38.925, name: 'Zhangye' },
  'zhangye city': { lng: 100.449, lat: 38.925, name: 'Zhangye' },
  '张掖': { lng: 100.449, lat: 38.925, name: 'Zhangye' },
  '张掖市': { lng: 100.449, lat: 38.925, name: 'Zhangye' },
  'zhangye danxia': { lng: 100.133240, lat: 38.913769, name: 'Zhangye Danxia' },
  'zhangye danxia national geopark': { lng: 100.133240, lat: 38.913769, name: 'Zhangye Danxia National Geopark' },
  '张掖丹霞': { lng: 100.133240, lat: 38.913769, name: 'Zhangye Danxia' },
  '张掖丹霞山': { lng: 100.133240, lat: 38.913769, name: 'Zhangye Danxia' },
  '丹霞': { lng: 100.133240, lat: 38.913769, name: 'Zhangye Danxia' },
  '丹霞山': { lng: 100.133240, lat: 38.913769, name: 'Zhangye Danxia' },
  'jiayuguan': { lng: 98.2882, lat: 39.7732, name: 'Jiayuguan' },
  'jiayuguan city': { lng: 98.2882, lat: 39.7732, name: 'Jiayuguan' },
  'jiayu pass': { lng: 98.2882, lat: 39.7732, name: 'Jiayu Pass' },
  '嘉峪关': { lng: 98.2882, lat: 39.7732, name: 'Jiayuguan' },
  '嘉峪关市': { lng: 98.2882, lat: 39.7732, name: 'Jiayuguan' },
  'wuzhen': { lng: 120.487778, lat: 30.74275, name: 'Wuzhen' },
  '乌镇': { lng: 120.487778, lat: 30.74275, name: 'Wuzhen' },
  'wuzhen town': { lng: 120.487778, lat: 30.74275, name: 'Wuzhen' },
  'wuzhen ancient town': { lng: 120.487778, lat: 30.74275, name: 'Wuzhen Ancient Town' },
  '乌镇古镇': { lng: 120.487778, lat: 30.74275, name: 'Wuzhen Ancient Town' },
  'jiaxing': { lng: 120.75, lat: 30.7522, name: 'Jiaxing' },
  '嘉兴': { lng: 120.75, lat: 30.7522, name: 'Jiaxing' },
  'jiaxing city': { lng: 120.75, lat: 30.7522, name: 'Jiaxing' },
  // 湖南张家界地区
  'zhangjiajie': { lng: 110.478996, lat: 29.117001, name: 'Zhangjiajie' },
  '张家界': { lng: 110.478996, lat: 29.117001, name: 'Zhangjiajie' },
  'zhangjiajie city': { lng: 110.478996, lat: 29.117001, name: 'Zhangjiajie' },
  'tianmen mountain': { lng: 110.4788889, lat: 29.0498806, name: 'Tianmen Mountain' },
  'tianmen': { lng: 110.4788889, lat: 29.0498806, name: 'Tianmen Mountain' },
  '天门山': { lng: 110.4788889, lat: 29.0498806, name: 'Tianmen Mountain' },
  '72奇楼': { lng: 110.478996, lat: 29.117001, name: '72 Qi Lou' },
  '72 qi lou': { lng: 110.478996, lat: 29.117001, name: '72 Qi Lou' },
  'seventy-two strange building': { lng: 110.478996, lat: 29.117001, name: '72 Qi Lou' },
  'wulingyuan': { lng: 110.481133, lat: 29.335520, name: 'Wulingyuan' },
  '武陵源': { lng: 110.481133, lat: 29.335520, name: 'Wulingyuan' },
  'wulingyuan scenic area': { lng: 110.481133, lat: 29.335520, name: 'Wulingyuan Scenic Area' },
  '武陵源区': { lng: 110.481133, lat: 29.335520, name: 'Wulingyuan District' },
  'wulingyuan district': { lng: 110.481133, lat: 29.335520, name: 'Wulingyuan District' },
  'fenghuang': { lng: 109.598479, lat: 27.947978, name: 'Fenghuang County' },
  'fenghuang county': { lng: 109.598479, lat: 27.947978, name: 'Fenghuang County' },
  'fenghuang ancient town': { lng: 109.598479, lat: 27.947978, name: 'Fenghuang Ancient Town' },
  '凤凰': { lng: 109.598479, lat: 27.947978, name: 'Fenghuang County' },
  '凤凰县': { lng: 109.598479, lat: 27.947978, name: 'Fenghuang County' },
  '凤凰古城': { lng: 109.598479, lat: 27.947978, name: 'Fenghuang Ancient Town' },
  'xiangxi': { lng: 109.598479, lat: 27.947978, name: 'Xiangxi Tujia and Miao Autonomous Prefecture' },
  '湘西': { lng: 109.598479, lat: 27.947978, name: 'Xiangxi Tujia and Miao Autonomous Prefecture' },
  '湘西土家族自治州': { lng: 109.598479, lat: 27.947978, name: 'Xiangxi Tujia and Miao Autonomous Prefecture' },
  // 贵州地区
  'guiyang': { lng: 106.630, lat: 26.647, name: 'Guiyang' },
  '贵阳': { lng: 106.630, lat: 26.647, name: 'Guiyang' },
  'guiyang city': { lng: 106.630, lat: 26.647, name: 'Guiyang' },
  'xijiang': { lng: 108.17000, lat: 26.49667, name: 'Xijiang Miao Village' },
  'xijiang miao village': { lng: 108.17000, lat: 26.49667, name: 'Xijiang Miao Village' },
  'xijiang qianhu miao village': { lng: 108.17000, lat: 26.49667, name: 'Xijiang Qianhu Miao Village' },
  '西江': { lng: 108.17000, lat: 26.49667, name: 'Xijiang Miao Village' },
  '西江千户苗寨': { lng: 108.17000, lat: 26.49667, name: 'Xijiang Qianhu Miao Village' },
  'leishan': { lng: 108.17000, lat: 26.49667, name: 'Leishan County' },
  '雷山': { lng: 108.17000, lat: 26.49667, name: 'Leishan County' },
  '雷山县': { lng: 108.17000, lat: 26.49667, name: 'Leishan County' },
  'libo': { lng: 107.8988, lat: 25.4238, name: 'Libo County' },
  'libo county': { lng: 107.8988, lat: 25.4238, name: 'Libo County' },
  '荔波': { lng: 107.8988, lat: 25.4238, name: 'Libo County' },
  '荔波县': { lng: 107.8988, lat: 25.4238, name: 'Libo County' },
  'daqikong': { lng: 107.85, lat: 25.35, name: 'Daqikong Scenic Area' },
  'daqikong scenic area': { lng: 107.85, lat: 25.35, name: 'Daqikong Scenic Area' },
  '大七孔': { lng: 107.85, lat: 25.35, name: 'Daqikong Scenic Area' },
  'big seven arches': { lng: 107.85, lat: 25.35, name: 'Daqikong Scenic Area' },
  'zhaoxing': { lng: 109.1749306, lat: 25.9098500, name: 'Zhaoxing Dong Village' },
  'zhaoxing dong village': { lng: 109.1749306, lat: 25.9098500, name: 'Zhaoxing Dong Village' },
  '肇兴': { lng: 109.1749306, lat: 25.9098500, name: 'Zhaoxing Dong Village' },
  '肇兴侗寨': { lng: 109.1749306, lat: 25.9098500, name: 'Zhaoxing Dong Village' },
  'liping': { lng: 109.1749306, lat: 25.9098500, name: 'Liping County' },
  '黎平': { lng: 109.1749306, lat: 25.9098500, name: 'Liping County' },
  '黎平县': { lng: 109.1749306, lat: 25.9098500, name: 'Liping County' },
  'luodian': { lng: 106.7520, lat: 25.4258, name: 'Luodian County' },
  'luodian county': { lng: 106.7520, lat: 25.4258, name: 'Luodian County' },
  '罗甸': { lng: 106.7520, lat: 25.4258, name: 'Luodian County' },
  '罗甸县': { lng: 106.7520, lat: 25.4258, name: 'Luodian County' },
  'xingyi': { lng: 104.894997, lat: 25.091999, name: 'Xingyi' },
  '兴义': { lng: 104.894997, lat: 25.091999, name: 'Xingyi' },
  'xingyi city': { lng: 104.894997, lat: 25.091999, name: 'Xingyi' },
  '兴义市': { lng: 104.894997, lat: 25.091999, name: 'Xingyi' },
  'zhenning': { lng: 105.7703, lat: 26.0581, name: 'Zhenning County' },
  'zhenning county': { lng: 105.7703, lat: 26.0581, name: 'Zhenning County' },
  '镇宁': { lng: 105.7703, lat: 26.0581, name: 'Zhenning County' },
  '镇宁县': { lng: 105.7703, lat: 26.0581, name: 'Zhenning County' },
  'anshun': { lng: 105.9333, lat: 26.2500, name: 'Anshun' },
  '安顺': { lng: 105.9333, lat: 26.2500, name: 'Anshun' },
  'anshun city': { lng: 105.9333, lat: 26.2500, name: 'Anshun' },
  'huangguoshu': { lng: 105.666, lat: 25.992, name: 'Huangguoshu Waterfall' },
  'huangguoshu waterfall': { lng: 105.666, lat: 25.992, name: 'Huangguoshu Waterfall' },
  '黄果树': { lng: 105.666, lat: 25.992, name: 'Huangguoshu Waterfall' },
  '黄果树瀑布': { lng: 105.666, lat: 25.992, name: 'Huangguoshu Waterfall' },
  'wulong': { lng: 107.70000, lat: 29.38000, name: 'Wulong' },
  '武隆': { lng: 107.70000, lat: 29.38000, name: 'Wulong' },
  'wulong district': { lng: 107.70000, lat: 29.38000, name: 'Wulong' },
  'wulong karst': { lng: 107.70000, lat: 29.38000, name: 'Wulong Karst' },
  '武隆喀斯特': { lng: 107.70000, lat: 29.38000, name: 'Wulong Karst' },
  'pengshui': { lng: 108.16361, lat: 29.29417, name: 'Pengshui' },
  '彭水': { lng: 108.16361, lat: 29.29417, name: 'Pengshui' },
  'pengshui county': { lng: 108.16361, lat: 29.29417, name: 'Pengshui County' },
  '彭水县': { lng: 108.16361, lat: 29.29417, name: 'Pengshui County' },
  'dujiangyan': { lng: 103.647, lat: 30.988, name: 'Dujiangyan' },
  '都江堰': { lng: 103.647, lat: 30.988, name: 'Dujiangyan' },
  'dujiangyan city': { lng: 103.647, lat: 30.988, name: 'Dujiangyan' },
  'dujiangyan irrigation system': { lng: 103.647, lat: 30.988, name: 'Dujiangyan Irrigation System' },
  '都江堰水利工程': { lng: 103.647, lat: 30.988, name: 'Dujiangyan Irrigation System' },
  'leshan': { lng: 103.766, lat: 29.552, name: 'Leshan' },
  '乐山': { lng: 103.766, lat: 29.552, name: 'Leshan' },
  'leshan city': { lng: 103.766, lat: 29.552, name: 'Leshan' },
  'leshan giant buddha': { lng: 103.768, lat: 29.541, name: 'Leshan Giant Buddha' },
  '乐山大佛': { lng: 103.768, lat: 29.541, name: 'Leshan Giant Buddha' },
  'emeishan': { lng: 103.33250, lat: 29.51972, name: 'Mount Emei' },
  'mount emei': { lng: 103.33250, lat: 29.51972, name: 'Mount Emei' },
  'emei mountain': { lng: 103.33250, lat: 29.51972, name: 'Mount Emei' },
  '峨眉山': { lng: 103.33250, lat: 29.51972, name: 'Mount Emei' },
  'emei shan': { lng: 103.33250, lat: 29.51972, name: 'Mount Emei' },
  'songpan': { lng: 103.59, lat: 32.65, name: 'Songpan' },
  '松潘': { lng: 103.59, lat: 32.65, name: 'Songpan' },
  'huanglong': { lng: 103.82, lat: 32.75, name: 'Huanglong' },
  '黄龙': { lng: 103.82, lat: 32.75, name: 'Huanglong' },
  'meishan': { lng: 103.85, lat: 30.05, name: 'Meishan' },
  '眉山': { lng: 103.85, lat: 30.05, name: 'Meishan' },
  // 凉山州地区
  'xichang': { lng: 102.264450, lat: 27.894505, name: 'Xichang' },
  '西昌': { lng: 102.264450, lat: 27.894505, name: 'Xichang' },
  'xichang city': { lng: 102.264450, lat: 27.894505, name: 'Xichang' },
  'lushan xichang': { lng: 102.3, lat: 27.9, name: 'Lushan Xichang' },
  '泸山': { lng: 102.3, lat: 27.9, name: 'Lushan Xichang' },
  'lushan mountain xichang': { lng: 102.3, lat: 27.9, name: 'Lushan Xichang' },
  '西昌泸山': { lng: 102.3, lat: 27.9, name: 'Lushan Xichang' },
  'luojishan': { lng: 102.43250, lat: 27.58389, name: 'Luojishan' },
  '螺髻山': { lng: 102.43250, lat: 27.58389, name: 'Luojishan' },
  'luoji mountain': { lng: 102.43250, lat: 27.58389, name: 'Luojishan' },
  'qionghai': { lng: 102.31028, lat: 27.82139, name: 'Qionghai Lake' },
  'qionghai lake': { lng: 102.31028, lat: 27.82139, name: 'Qionghai Lake' },
  '邛海': { lng: 102.31028, lat: 27.82139, name: 'Qionghai Lake' },
  'qiong lake': { lng: 102.31028, lat: 27.82139, name: 'Qionghai Lake' },
  'liangshan': { lng: 102.264450, lat: 27.894505, name: 'Liangshan Prefecture' },
  '凉山': { lng: 102.264450, lat: 27.894505, name: 'Liangshan Prefecture' },
  '凉山州': { lng: 102.264450, lat: 27.894505, name: 'Liangshan Prefecture' },
  // 川西地区
  'ganzi': { lng: 99.9887, lat: 31.6273, name: 'Ganzi' },
  'garze': { lng: 99.9887, lat: 31.6273, name: 'Ganzi' },
  'garzê': { lng: 99.9887, lat: 31.6273, name: 'Ganzi' },
  'kardze': { lng: 99.9887, lat: 31.6273, name: 'Ganzi' },
  '甘孜': { lng: 99.9887, lat: 31.6273, name: 'Ganzi' },
  'ganzi prefecture': { lng: 99.9887, lat: 31.6273, name: 'Ganzi' },
  '甘孜州': { lng: 99.9887, lat: 31.6273, name: 'Ganzi' },
  'daocheng': { lng: 100.2974, lat: 29.0379, name: 'Daocheng' },
  '稻城': { lng: 100.2974, lat: 29.0379, name: 'Daocheng' },
  'daocheng county': { lng: 100.2974, lat: 29.0379, name: 'Daocheng' },
  'yading': { lng: 100.0603, lat: 29.3163, name: 'Yading' },
  '亚丁': { lng: 100.0603, lat: 29.3163, name: 'Yading' },
  'yading nature reserve': { lng: 100.0603, lat: 29.3163, name: 'Yading Nature Reserve' },
  '亚丁自然保护区': { lng: 100.0603, lat: 29.3163, name: 'Yading Nature Reserve' },
  'daocheng yading': { lng: 100.0603, lat: 29.3163, name: 'Yading' },
  '稻城亚丁': { lng: 100.0603, lat: 29.3163, name: 'Yading' },
  'kangding': { lng: 101.9641, lat: 30.0500, name: 'Kangding' },
  '康定': { lng: 101.9641, lat: 30.0500, name: 'Kangding' },
  'litang': { lng: 100.2692, lat: 30.0058, name: 'Litang' },
  '理塘': { lng: 100.2692, lat: 30.0058, name: 'Litang' },
  'tagong': { lng: 101.5000, lat: 30.2833, name: 'Tagong' },
  '塔公': { lng: 101.5000, lat: 30.2833, name: 'Tagong' },
  'tagong grassland': { lng: 101.5000, lat: 30.2833, name: 'Tagong Grassland' },
  '塔公草原': { lng: 101.5000, lat: 30.2833, name: 'Tagong Grassland' },
  // 阿坝州四姑娘山镇 (Siguniangshan Town, Aba Prefecture)
  'siguniangshan': { lng: 102.83028, lat: 30.99250, name: 'Siguniangshan Town' },
  'siguniangshan town': { lng: 102.83028, lat: 30.99250, name: 'Siguniangshan Town' },
  'siguniang': { lng: 102.83028, lat: 30.99250, name: 'Siguniangshan Town' },
  'mount siguniang': { lng: 102.83028, lat: 30.99250, name: 'Siguniangshan Town' },
  '四姑娘山': { lng: 102.83028, lat: 30.99250, name: 'Siguniangshan Town' },
  '四姑娘山镇': { lng: 102.83028, lat: 30.99250, name: 'Siguniangshan Town' },
  'rilong': { lng: 102.83028, lat: 30.99250, name: 'Siguniangshan Town' },
  '日隆': { lng: 102.83028, lat: 30.99250, name: 'Siguniangshan Town' },
  '日隆镇': { lng: 102.83028, lat: 30.99250, name: 'Siguniangshan Town' },
  // 甘孜丹巴县 (Danba County, Ganzi)
  'danba': { lng: 101.850, lat: 30.950, name: 'Danba County' },
  'danba county': { lng: 101.850, lat: 30.950, name: 'Danba County' },
  '丹巴': { lng: 101.850, lat: 30.950, name: 'Danba County' },
  '丹巴县': { lng: 101.850, lat: 30.950, name: 'Danba County' },
  'chaggo': { lng: 101.850, lat: 30.950, name: 'Danba County' },
  '章谷': { lng: 101.850, lat: 30.950, name: 'Danba County' },
  '章谷镇': { lng: 101.850, lat: 30.950, name: 'Danba County' },
  // 康定色龙村 (Selong Village, Kangding)
  'selong': { lng: 101.85, lat: 30.12, name: 'Selong Village' },
  'selong village': { lng: 101.85, lat: 30.12, name: 'Selong Village' },
  '色龙': { lng: 101.85, lat: 30.12, name: 'Selong Village' },
  '色龙村': { lng: 101.85, lat: 30.12, name: 'Selong Village' },
  'secret village': { lng: 101.85, lat: 30.12, name: 'Selong Village' },
  // 甘孜八美镇 (Bamei Town, Ganzi)
  'bamei': { lng: 101.3, lat: 30.5, name: 'Bamei Town' },
  'bamei town': { lng: 101.3, lat: 30.5, name: 'Bamei Town' },
  '八美': { lng: 101.3, lat: 30.5, name: 'Bamei Town' },
  '八美镇': { lng: 101.3, lat: 30.5, name: 'Bamei Town' },
  // 白玉县 (Baiyu County)
  'baiyu': { lng: 98.817, lat: 31.217, name: 'Baiyu County' },
  'baiyu county': { lng: 98.817, lat: 31.217, name: 'Baiyu County' },
  '白玉': { lng: 98.817, lat: 31.217, name: 'Baiyu County' },
  '白玉县': { lng: 98.817, lat: 31.217, name: 'Baiyu County' },
  // 德格县 (Dege County)
  'dege': { lng: 98.5809, lat: 31.8061, name: 'Dege County' },
  'dege county': { lng: 98.5809, lat: 31.8061, name: 'Dege County' },
  'derge': { lng: 98.5809, lat: 31.8061, name: 'Dege County' },
  '德格': { lng: 98.5809, lat: 31.8061, name: 'Dege County' },
  '德格县': { lng: 98.5809, lat: 31.8061, name: 'Dege County' },
  // 马尼干戈 (Manigango)
  'manigango': { lng: 99.20639, lat: 31.92972, name: 'Manigango' },
  '马尼干戈': { lng: 99.20639, lat: 31.92972, name: 'Manigango' },
  '马尼干戈县': { lng: 99.20639, lat: 31.92972, name: 'Manigango' },
  
  // 北京地区
  'beijing': { lng: 116.4074, lat: 39.9042, name: 'Beijing' },
  '北京': { lng: 116.4074, lat: 39.9042, name: 'Beijing' },
  'peking': { lng: 116.4074, lat: 39.9042, name: 'Beijing' },
  'forbidden city': { lng: 116.3972, lat: 39.9163, name: 'Forbidden City' },
  '故宫': { lng: 116.3972, lat: 39.9163, name: 'Forbidden City' },
  'tiananmen': { lng: 116.3974, lat: 39.9037, name: 'Tiananmen Square' },
  'tiananmen square': { lng: 116.3974, lat: 39.9037, name: 'Tiananmen Square' },
  'tian anmen': { lng: 116.3974, lat: 39.9037, name: 'Tiananmen Square' },
  '天安门': { lng: 116.3974, lat: 39.9037, name: 'Tiananmen Square' },
  '天安门广场': { lng: 116.3974, lat: 39.9037, name: 'Tiananmen Square' },
  'temple of heaven': { lng: 116.4075, lat: 39.8823, name: 'Temple of Heaven' },
  '天坛': { lng: 116.4075, lat: 39.8823, name: 'Temple of Heaven' },
  'summer palace': { lng: 116.2734, lat: 39.9990, name: 'Summer Palace' },
  '颐和园': { lng: 116.2734, lat: 39.9990, name: 'Summer Palace' },
  'great wall': { lng: 116.5704, lat: 40.4319, name: 'Great Wall' },
  '长城': { lng: 116.5704, lat: 40.4319, name: 'Great Wall' },
  'badaling': { lng: 116.0147, lat: 40.3592, name: 'Badaling' },
  '八达岭': { lng: 116.0147, lat: 40.3592, name: 'Badaling' },
  'mutianyu': { lng: 116.5704, lat: 40.4319, name: 'Mutianyu' },
  '慕田峪': { lng: 116.5704, lat: 40.4319, name: 'Mutianyu' },
  'beihai park': { lng: 116.3883, lat: 39.9254, name: 'Beihai Park' },
  '北海公园': { lng: 116.3883, lat: 39.9254, name: 'Beihai Park' },
  'hutong': { lng: 116.3974, lat: 39.9042, name: 'Hutong' },
  '胡同': { lng: 116.3974, lat: 39.9042, name: 'Hutong' },
  
  // 山西地区
  'shanxi': { lng: 112.5624, lat: 37.8739, name: 'Shanxi' },
  '山西': { lng: 112.5624, lat: 37.8739, name: 'Shanxi' },
  'taiyuan': { lng: 112.5492, lat: 37.8570, name: 'Taiyuan' },
  '太原': { lng: 112.5492, lat: 37.8570, name: 'Taiyuan' },
  'datong': { lng: 113.2953, lat: 40.0903, name: 'Datong' },
  '大同': { lng: 113.2953, lat: 40.0903, name: 'Datong' },
  'yungang grottoes': { lng: 113.2953, lat: 40.0903, name: 'Yungang Grottoes' },
  '云冈石窟': { lng: 113.2953, lat: 40.0903, name: 'Yungang Grottoes' },
  'pingyao': { lng: 112.1781, lat: 37.1988, name: 'Pingyao' },
  '平遥': { lng: 112.1781, lat: 37.1988, name: 'Pingyao' },
  'pingyao ancient city': { lng: 112.1781, lat: 37.1988, name: 'Pingyao Ancient City' },
  '平遥古城': { lng: 112.1781, lat: 37.1988, name: 'Pingyao Ancient City' },
  'wutai mountain': { lng: 113.5901, lat: 38.9944, name: 'Wutai Mountain' },
  '五台山': { lng: 113.5901, lat: 38.9944, name: 'Wutai Mountain' },
  'wutai': { lng: 113.5901, lat: 38.9944, name: 'Wutai Mountain' },
  'hanging temple': { lng: 113.5901, lat: 39.6167, name: 'Hanging Temple' },
  '悬空寺': { lng: 113.5901, lat: 39.6167, name: 'Hanging Temple' },
  'xuan kong si': { lng: 113.5901, lat: 39.6167, name: 'Hanging Temple' },
  'jinci temple': { lng: 112.5492, lat: 37.8570, name: 'Jinci Temple' },
  '晋祠': { lng: 112.5492, lat: 37.8570, name: 'Jinci Temple' },
  'qiao family compound': { lng: 112.1781, lat: 37.1988, name: 'Qiao Family Compound' },
  '乔家大院': { lng: 112.1781, lat: 37.1988, name: 'Qiao Family Compound' },
  'wang family compound': { lng: 111.7521, lat: 36.6908, name: 'Wang Family Compound' },
  '王家大院': { lng: 111.7521, lat: 36.6908, name: 'Wang Family Compound' },
  'yanmen pass': { lng: 112.5624, lat: 39.0167, name: 'Yanmen Pass' },
  '雁门关': { lng: 112.5624, lat: 39.0167, name: 'Yanmen Pass' },
  'changzhi': { lng: 113.1136, lat: 36.1911, name: 'Changzhi' },
  '长治': { lng: 113.1136, lat: 36.1911, name: 'Changzhi' },
  'jincheng': { lng: 112.8513, lat: 35.4976, name: 'Jincheng' },
  '晋城': { lng: 112.8513, lat: 35.4976, name: 'Jincheng' },
  'yangquan': { lng: 113.5833, lat: 37.8612, name: 'Yangquan' },
  '阳泉': { lng: 113.5833, lat: 37.8612, name: 'Yangquan' },
  'xi county': { lng: 110.93, lat: 36.69, name: 'Xi County' },
  '隰县': { lng: 110.93, lat: 36.69, name: 'Xi County' },
  'xi xian': { lng: 110.93, lat: 36.69, name: 'Xi County' },
  'xixian': { lng: 110.93, lat: 36.69, name: 'Xi County' },
  'xian': { lng: 108.9398, lat: 34.3416, name: 'Xi\'an' },
  'xi\'an': { lng: 108.9398, lat: 34.3416, name: 'Xi\'an' },
  '西安': { lng: 108.9398, lat: 34.3416, name: 'Xi\'an' },
  'xian city': { lng: 108.9398, lat: 34.3416, name: 'Xi\'an' },
  'terracotta warriors': { lng: 109.2778, lat: 34.3853, name: 'Terracotta Warriors' },
  '兵马俑': { lng: 109.2778, lat: 34.3853, name: 'Terracotta Warriors' },
  
  // 内蒙古呼伦贝尔地区
  'hailar': { lng: 119.76, lat: 49.21, name: 'Hailar' },
  '海拉尔': { lng: 119.76, lat: 49.21, name: 'Hailar' },
  'genhe': { lng: 121.52, lat: 50.77, name: 'Genhe' },
  '根河': { lng: 121.52, lat: 50.77, name: 'Genhe' },
  'erguna': { lng: 120.18, lat: 50.24, name: 'Erguna' },
  '额尔古纳': { lng: 120.18, lat: 50.24, name: 'Erguna' },
  'manzhouli': { lng: 117.44, lat: 49.58, name: 'Manzhouli' },
  '满洲里': { lng: 117.44, lat: 49.58, name: 'Manzhouli' },
  'hulunbuir': { lng: 119.76, lat: 49.21, name: 'Hulunbuir' },
  '呼伦贝尔': { lng: 119.76, lat: 49.21, name: 'Hulunbuir' },
  'shiwei': { lng: 120.27, lat: 51.34, name: 'Shiwei' },
  '室韦': { lng: 120.27, lat: 51.34, name: 'Shiwei' },
  'heishantou': { lng: 119.29, lat: 50.21, name: 'Heishantou' },
  '黑山头': { lng: 119.29, lat: 50.21, name: 'Heishantou' },
  'arxan': { lng: 120.32, lat: 47.17, name: 'Arxan' },
  '阿尔山': { lng: 120.32, lat: 47.17, name: 'Arxan' },
  'arxan national forest park': { lng: 120.44, lat: 47.30, name: 'Arxan National Forest Park' },
  '阿尔山国家森林公园': { lng: 120.44, lat: 47.30, name: 'Arxan National Forest Park' },
  
  // 云南地区
  'yunnan': { lng: 102.7123, lat: 25.0406, name: 'Yunnan' },
  '云南': { lng: 102.7123, lat: 25.0406, name: 'Yunnan' },
  'kunming': { lng: 102.7123, lat: 25.0406, name: 'Kunming' },
  '昆明': { lng: 102.7123, lat: 25.0406, name: 'Kunming' },
  'dali': { lng: 100.2676, lat: 25.6065, name: 'Dali' },
  '大理': { lng: 100.2676, lat: 25.6065, name: 'Dali' },
  'dali ancient city': { lng: 100.2676, lat: 25.6065, name: 'Dali Ancient City' },
  '大理古城': { lng: 100.2676, lat: 25.6065, name: 'Dali Ancient City' },
  'lijiang': { lng: 100.2277, lat: 26.8550, name: 'Lijiang' },
  '丽江': { lng: 100.2277, lat: 26.8550, name: 'Lijiang' },
  'lijiang ancient town': { lng: 100.2277, lat: 26.8550, name: 'Lijiang Ancient Town' },
  '丽江古城': { lng: 100.2277, lat: 26.8550, name: 'Lijiang Ancient Town' },
  'shangri-la': { lng: 99.7020, lat: 27.8297, name: 'Shangri-La' },
  '香格里拉': { lng: 99.7020, lat: 27.8297, name: 'Shangri-La' },
  'zhongdian': { lng: 99.7020, lat: 27.8297, name: 'Shangri-La' },
  '中甸': { lng: 99.7020, lat: 27.8297, name: 'Shangri-La' },
  'xishuangbanna': { lng: 100.7979, lat: 22.0094, name: 'Xishuangbanna' },
  '西双版纳': { lng: 100.7979, lat: 22.0094, name: 'Xishuangbanna' },
  'jinghong': { lng: 100.7979, lat: 22.0094, name: 'Jinghong' },
  '景洪': { lng: 100.7979, lat: 22.0094, name: 'Jinghong' },
  'tengchong': { lng: 98.4973, lat: 25.0206, name: 'Tengchong' },
  '腾冲': { lng: 98.4973, lat: 25.0206, name: 'Tengchong' },
  'heshun': { lng: 98.4569, lat: 25.0114, name: 'Heshun Ancient Town' },
  '和顺': { lng: 98.4569, lat: 25.0114, name: 'Heshun Ancient Town' },
  'heshun ancient town': { lng: 98.4569, lat: 25.0114, name: 'Heshun Ancient Town' },
  '和顺古镇': { lng: 98.4569, lat: 25.0114, name: 'Heshun Ancient Town' },
  'stone forest': { lng: 103.3333, lat: 24.8167, name: 'Stone Forest' },
  '石林': { lng: 103.3333, lat: 24.8167, name: 'Stone Forest' },
  'shilin': { lng: 103.3333, lat: 24.8167, name: 'Stone Forest' },
  'erhai': { lng: 100.1833, lat: 25.6167, name: 'Erhai Lake' },
  '洱海': { lng: 100.1833, lat: 25.6167, name: 'Erhai Lake' },
  'erhai lake': { lng: 100.1833, lat: 25.6167, name: 'Erhai Lake' },
  'yulong snow mountain': { lng: 100.2667, lat: 27.1000, name: 'Yulong Snow Mountain' },
  '玉龙雪山': { lng: 100.2667, lat: 27.1000, name: 'Yulong Snow Mountain' },
  'tiger leaping gorge': { lng: 100.1167, lat: 27.2000, name: 'Tiger Leaping Gorge' },
  '虎跳峡': { lng: 100.1167, lat: 27.2000, name: 'Tiger Leaping Gorge' },
  
  // 西藏地区
  'tibet': { lng: 91.1172, lat: 29.6475, name: 'Tibet' },
  '西藏': { lng: 91.1172, lat: 29.6475, name: 'Tibet' },
  'tibetan': { lng: 91.1172, lat: 29.6475, name: 'Tibet' },
  'lhasa': { lng: 91.1172, lat: 29.6475, name: 'Lhasa' },
  '拉萨': { lng: 91.1172, lat: 29.6475, name: 'Lhasa' },
  'potala palace': { lng: 91.1172, lat: 29.6558, name: 'Potala Palace' },
  '布达拉宫': { lng: 91.1172, lat: 29.6558, name: 'Potala Palace' },
  'jokhang temple': { lng: 91.1324, lat: 29.6531, name: 'Jokhang Temple' },
  '大昭寺': { lng: 91.1324, lat: 29.6531, name: 'Jokhang Temple' },
  'samye': { lng: 91.5037, lat: 29.3255, name: 'Samye Monastery' },
  'samye monastery': { lng: 91.5037, lat: 29.3255, name: 'Samye Monastery' },
  '桑耶寺': { lng: 91.5037, lat: 29.3255, name: 'Samye Monastery' },
  'namtso': { lng: 90.5000, lat: 30.8333, name: 'Namtso Lake' },
  '纳木错': { lng: 90.5000, lat: 30.8333, name: 'Namtso Lake' },
  'namtso lake': { lng: 90.5000, lat: 30.8333, name: 'Namtso Lake' },
  'yamdrok lake': { lng: 90.6833, lat: 28.9500, name: 'Yamdrok Lake' },
  '羊卓雍错': { lng: 90.6833, lat: 28.9500, name: 'Yamdrok Lake' },
  'yamdrok': { lng: 90.6833, lat: 28.9500, name: 'Yamdrok Lake' },
  'holy lake': { lng: 90.6833, lat: 28.9500, name: 'Yamdrok Lake' },
  '圣湖': { lng: 90.6833, lat: 28.9500, name: 'Yamdrok Lake' },
  'damxung': { lng: 91.1012, lat: 30.4731, name: 'Damxung' },
  '当雄': { lng: 91.1012, lat: 30.4731, name: 'Damxung' },
  'damxung county': { lng: 91.1012, lat: 30.4731, name: 'Damxung' },
  'basum tso': { lng: 93.9503, lat: 30.0142, name: 'Basum Tso' },
  'basum tsho': { lng: 93.9503, lat: 30.0142, name: 'Basum Tso' },
  'basum lake': { lng: 93.9503, lat: 30.0142, name: 'Basum Tso' },
  'pagsum lake': { lng: 93.9503, lat: 30.0142, name: 'Basum Tso' },
  'pagsum co': { lng: 93.9503, lat: 30.0142, name: 'Basum Tso' },
  '巴松措': { lng: 93.9503, lat: 30.0142, name: 'Basum Tso' },
  '巴松错': { lng: 93.9503, lat: 30.0142, name: 'Basum Tso' },
  'nyingchi': { lng: 94.3566, lat: 29.6518, name: 'Nyingchi' },
  'nyingchi city': { lng: 94.3566, lat: 29.6518, name: 'Nyingchi' },
  '林芝': { lng: 94.3566, lat: 29.6518, name: 'Nyingchi' },
  '林芝市': { lng: 94.3566, lat: 29.6518, name: 'Nyingchi' },
  'mount everest': { lng: 86.9250, lat: 27.9881, name: 'Mount Everest' },
  '珠穆朗玛峰': { lng: 86.9250, lat: 27.9881, name: 'Mount Everest' },
  'everest': { lng: 86.9250, lat: 27.9881, name: 'Mount Everest' },
  'gyantse': { lng: 89.6045, lat: 28.9148, name: 'Gyantse' },
  'gyangtse': { lng: 89.6045, lat: 28.9148, name: 'Gyantse' },
  'gyangzê': { lng: 89.6045, lat: 28.9148, name: 'Gyantse' },
  '江孜': { lng: 89.6045, lat: 28.9148, name: 'Gyantse' },
  'gyantse county': { lng: 89.6045, lat: 28.9148, name: 'Gyantse' },
  '江孜县': { lng: 89.6045, lat: 28.9148, name: 'Gyantse' },
  'pelkor': { lng: 89.6045, lat: 28.9148, name: 'Pelkor Chode Monastery' },
  'pelkor chode': { lng: 89.6045, lat: 28.9148, name: 'Pelkor Chode Monastery' },
  'pelkor monastery': { lng: 89.6045, lat: 28.9148, name: 'Pelkor Chode Monastery' },
  'kumbum': { lng: 89.6045, lat: 28.9148, name: 'Pelkor Chode Monastery' },
  '白居寺': { lng: 89.6045, lat: 28.9148, name: 'Pelkor Chode Monastery' },
  'shigatse': { lng: 88.8833, lat: 29.2667, name: 'Shigatse' },
  '日喀则': { lng: 88.8833, lat: 29.2667, name: 'Shigatse' },
  'xigaze': { lng: 88.8833, lat: 29.2667, name: 'Shigatse' },
  'tashilhunpo monastery': { lng: 88.8833, lat: 29.2667, name: 'Tashilhunpo Monastery' },
  '扎什伦布寺': { lng: 88.8833, lat: 29.2667, name: 'Tashilhunpo Monastery' },
  
  // 青海地区
  'qinghai': { lng: 101.778, lat: 36.6212, name: 'Qinghai' },
  '青海': { lng: 101.778, lat: 36.6212, name: 'Qinghai' },
  'koko nor': { lng: 100.1333, lat: 36.9000, name: 'Qinghai Lake' },
  'chaka': { lng: 99.0833, lat: 36.8000, name: 'Chaka' },
  '茶卡': { lng: 99.0833, lat: 36.8000, name: 'Chaka' },
  'chaka salt lake': { lng: 99.0833, lat: 36.8000, name: 'Chaka Salt Lake' },
  '茶卡盐湖': { lng: 99.0833, lat: 36.8000, name: 'Chaka Salt Lake' },
  'qarhan salt lake': { lng: 99.0833, lat: 36.8000, name: 'Chaka Salt Lake' },
  'golmud': { lng: 94.9053, lat: 36.4019, name: 'Golmud' },
  '格尔木': { lng: 94.9053, lat: 36.4019, name: 'Golmud' },
  'geermu': { lng: 94.9053, lat: 36.4019, name: 'Golmud' },
  'tuotuo river': { lng: 92.4333, lat: 34.2167, name: 'Tuotuo River' },
  '沱沱河': { lng: 92.4333, lat: 34.2167, name: 'Tuotuo River' },
  'tangula': { lng: 91.9333, lat: 33.2000, name: 'Tangula Pass' },
  '唐古拉': { lng: 91.9333, lat: 33.2000, name: 'Tangula Pass' },
  'tangula pass': { lng: 91.9333, lat: 33.2000, name: 'Tangula Pass' },
  'nagqu': { lng: 92.0500, lat: 31.4667, name: 'Nagqu' },
  '那曲': { lng: 92.0500, lat: 31.4667, name: 'Nagqu' },
  'naqu': { lng: 92.0500, lat: 31.4667, name: 'Nagqu' },
  
  // 可以继续添加其他地区...
};

export default function DynamicJourneyPage() {
  const { journeys, isLoading: journeysLoading } = useJourneyManagement();
  const { experiences } = useExperienceManagement();
  const { hotels } = useHotelManagement();
  const [extensionsData, setExtensionsData] = useState<any[]>([]);
  const [hotelsData, setHotelsData] = useState<any[]>([]);
  const router = useRouter();
  const params = useParams();
  // catch-all 路由返回数组，需要合并
  const slugArray = params.slug as string[];
  const slug = Array.isArray(slugArray) ? slugArray.join('/') : (slugArray || '');
  
  // 检查是否是 journey type slug（在组件早期检查，避免执行后续逻辑）
  const isJourneyTypeSlug = slug && JOURNEY_TYPE_SLUGS.includes(slug as any);
  const isTypeRoute = slug && (slug.startsWith('type/') || slug === 'type');
  
  // 调试信息：检查 journey type slug 识别
  if (slug) {
    const directCheck = JOURNEY_TYPE_SLUGS.includes(slug as any);
    console.log('[DynamicJourneyPage] Slug check:', {
      slug,
      isJourneyTypeSlug,
      isTypeRoute,
      directCheck,
      JOURNEY_TYPE_SLUGS: Array.from(JOURNEY_TYPE_SLUGS),
      willRedirect: directCheck || isTypeRoute
    });
  }
  
  // 使用 useLayoutEffect 同步执行重定向（在 DOM 更新之前）
  // 这样可以确保在 useEffect 执行之前就完成重定向
  useLayoutEffect(() => {
    if (isTypeRoute) {
      // 提取 type 值并重定向
      const typeValue = slug.replace('type/', '');
      if (typeValue) {
        router.replace(`/journeys/type/${typeValue}`);
      }
    } else if (isJourneyTypeSlug) {
      // 如果是 journey type slug，立即重定向到 type 路由
      router.replace(`/journeys/type/${slug}`);
    }
  }, [slug, router, isTypeRoute, isJourneyTypeSlug]);
  
  // 如果路径是 type/* 或者是 journey type slug，不渲染任何内容，等待重定向
  if (isTypeRoute || isJourneyTypeSlug) {
    return null;
  }
  
  // 直接从API获取journey（如果context中没有）
  const [journeyFromApi, setJourneyFromApi] = useState<Journey | null>(null);
  const [isLoadingFromApi, setIsLoadingFromApi] = useState(false);

  // 已移除酒店详情弹窗状态

  // 根据slug查找对应的旅行卡片（优先从context，其次从API）
  const journey = useMemo(() => {
    const foundInContext = journeys.find(j => j.slug === slug);
    return foundInContext || journeyFromApi;
  }, [journeys, slug, journeyFromApi]);

  // 判断 journey 是 day tour 还是 multi-day journey
  const isDayTour = useMemo(() => {
    if (!journey) return false;
    const duration = journey.duration || '';
    // 检查是否包含 "1 Day" 或类似的一天游标识
    return /1\s*day/i.test(duration) || 
           journey.journeyType === 'Explore Together' ||
           (journey.itinerary && journey.itinerary.length === 1);
  }, [journey]);

  // 为 JourneyMap 准备 locations 数据
  const journeyLocations = useMemo(() => {
    if (!journey) return [];
    
    if (isDayTour) {
      // Day tour: 使用 city 或 location 作为单点
      const journeyData = journey as any;
      return [{
        id: journey.id,
        lng: journeyData.longitude || journeyData.data?.longitude || 104.0,
        lat: journeyData.latitude || journeyData.data?.latitude || 30.0
      }];
    } else {
      // Multi-day: 从 itinerary 中提取每个 day 的位置
      if (!journey.itinerary || journey.itinerary.length === 0) return [];
      
      return journey.itinerary.map((day, index) => {
        const dayData = day as any;
        return {
          id: `${journey.id}-day-${day.day}`,
          lng: dayData.longitude || dayData.data?.longitude || (104.0 + (index * 0.1)),
          lat: dayData.latitude || dayData.data?.latitude || (30.0 + (index * 0.1))
        };
      });
    }
  }, [journey, isDayTour]);

  // 为 multi-day journey 准备 dayLocations - 使用通用地理字典 + 行程区域感知兜底
  const dayLocations = useMemo(() => {
    if (!journey || isDayTour || !journey.itinerary) return undefined;
    
    // 【关键修复点】：获取行程的总中心点作为保底（行程区域感知）
    // 如果 journey 有 longitude/latitude，使用它；否则根据城市、标题或 region 判断
    let baseLng = 116.4074; // 默认北京经度
    let baseLat = 39.9042; // 默认北京纬度
    
    // 如果 journey 有明确的坐标，使用它
    if ((journey as any).longitude && (journey as any).latitude) {
      baseLng = Number((journey as any).longitude);
      baseLat = Number((journey as any).latitude);
    } else {
      // 根据 region、城市或标题判断区域（优先级：region > city > title）
      const searchText = `${journey.region || ''} ${journey.city || ''} ${journey.title || ''}`.toLowerCase();
      
      // 云南地区
      if (searchText.includes('yunnan') || searchText.includes('云南') || 
          searchText.includes('kunming') || searchText.includes('昆明') ||
          searchText.includes('dali') || searchText.includes('大理') ||
          searchText.includes('lijiang') || searchText.includes('丽江') ||
          searchText.includes('shangri-la') || searchText.includes('香格里拉') ||
          searchText.includes('xishuangbanna') || searchText.includes('西双版纳') ||
          searchText.includes('tengchong') || searchText.includes('腾冲')) {
        baseLng = 102.7123; // 昆明经度（云南中心）
        baseLat = 25.0406; // 昆明纬度
      }
      // 西藏地区
      else if (searchText.includes('tibet') || searchText.includes('西藏') ||
               searchText.includes('lhasa') || searchText.includes('拉萨') ||
               searchText.includes('tibetan')) {
        baseLng = 91.1172; // 拉萨经度
        baseLat = 29.6475; // 拉萨纬度
      }
      // 北京地区
      else if (searchText.includes('beijing') || searchText.includes('北京')) {
        baseLng = 116.4074;
        baseLat = 39.9042;
      }
      // 山西地区
      else if (searchText.includes('shanxi') || searchText.includes('山西')) {
        baseLng = 112.5624;
        baseLat = 37.8739;
      }
      // 四川/成都地区
      else if (searchText.includes('chengdu') || searchText.includes('成都') ||
               searchText.includes('sichuan') || searchText.includes('四川')) {
        baseLng = 104.06;
        baseLat = 30.67;
      }
      // 川西/甘孜地区
      else if (searchText.includes('ganzi') || searchText.includes('甘孜') ||
               searchText.includes('garze') || searchText.includes('kardze') ||
               searchText.includes('western sichuan') || searchText.includes('川西') ||
               searchText.includes('daocheng') || searchText.includes('稻城') ||
               searchText.includes('yading') || searchText.includes('亚丁')) {
        baseLng = 100.0603; // 亚丁经度（川西中心）
        baseLat = 29.3163; // 亚丁纬度
      }
      // 青海/西宁地区
      else if (searchText.includes('qinghai') || searchText.includes('青海') ||
               searchText.includes('xining') || searchText.includes('西宁')) {
        baseLng = 101.7574; // 西宁经度
        baseLat = 36.6255; // 西宁纬度
      }
      // 根据 region 字段判断（如果存在）
      else if (journey.region) {
        const regionLower = journey.region.toLowerCase();
        if (regionLower.includes('southwest') || regionLower.includes('yunnan')) {
          baseLng = 102.7123; // 云南
          baseLat = 25.0406;
        } else if (regionLower.includes('tibet') || regionLower.includes('tibetan')) {
          baseLng = 91.1172; // 西藏
          baseLat = 29.6475;
        } else if (regionLower.includes('north') && !regionLower.includes('west')) {
          baseLng = 116.4074; // 北京
          baseLat = 39.9042;
        }
      }
    }
    
    // 调试：打印原始数据和行程中心点
    console.log('[page.tsx] Processing dayLocations with Geo Dictionary + Region-Aware Fallback', {
      itineraryLength: journey.itinerary.length,
      journeyCenter: { baseLng, baseLat },
      journeyCity: journey.city
    });
    
    return journey.itinerary.map((day, index) => {
      // 整合标题、描述和活动列表进行模糊搜索（activities 可能包含地点信息）
      const activitiesText = Array.isArray((day as any).activities) 
        ? (day as any).activities.join(' ') 
        : '';
      
      // 【优先级最高】特殊处理：对于北京路线，如果包含 tiananmen 相关关键词，直接匹配到天安门
      const journeyRegionText = `${journey.region || ''} ${journey.city || ''} ${journey.title || ''}`.toLowerCase();
      const isBeijingRoute = journeyRegionText.includes('beijing') || journeyRegionText.includes('北京');
      const dayText = `${day.title || ''} ${day.description || ''} ${activitiesText}`.toLowerCase();
      
      if (isBeijingRoute && (dayText.includes('tiananmen') || dayText.includes('天安门') || dayText.includes('tiananmen square'))) {
        const tiananmenCoords = CITY_GEO_DB['tiananmen'];
        if (tiananmenCoords) {
          console.log(`[page.tsx] Day ${day.day}: PRIORITY Tiananmen Square match (before all other matching):`, {
            dayTitle: day.title,
            dayText: dayText.substring(0, 100),
            coords: tiananmenCoords
          });
          // 直接返回天安门坐标，跳过所有其他匹配逻辑
          return {
            day: day.day,
            title: day.title,
            locations: [{
              id: `${journey.id}-day-${day.day}-step-0`,
              lng: tiananmenCoords.lng,
              lat: tiananmenCoords.lat,
              name: tiananmenCoords.name,
              city: tiananmenCoords.name,
              label: tiananmenCoords.name,
              day: day.day
            }]
          };
        }
      }
      const searchText = `${day.title || ''} ${day.description || ''} ${activitiesText}`.toLowerCase();
      
      console.log(`[page.tsx] Day ${day.day} search text:`, {
        title: day.title,
        description: day.description,
        activities: (day as any).activities,
        searchText: searchText.substring(0, 300), // 显示前300个字符
        hasGyantse: searchText.includes('gyantse') || searchText.includes('gyangtse') || searchText.includes('江孜') || searchText.includes('pelkor') || searchText.includes('kumbum')
      });
      
      // 优先级 1: 使用数据库中存储的坐标（如果存在）
      let finalLng: number | undefined = undefined;
      let finalLat: number | undefined = undefined;
      let finalCity: string | undefined = undefined;
      
      if ((day as any).longitude && (day as any).latitude) {
        finalLng = Number((day as any).longitude);
        finalLat = Number((day as any).latitude);
        finalCity = (day as any).city || day.title || `Day ${day.day}`;
        console.log(`[page.tsx] Day ${day.day}: Using database coordinates`, { finalCity, finalLng, finalLat });
      }
      
      // 优先级 2: 从地理字典中匹配（精确匹配优先，避免误匹配）
      if (!finalLng || !finalLat) {
        // 根据 journey 的区域信息，排除不相关的地点
        const journeyRegionText = `${journey.region || ''} ${journey.city || ''} ${journey.title || ''}`.toLowerCase();
        const isTibetRoute = journeyRegionText.includes('tibet') || journeyRegionText.includes('西藏') || 
                            journeyRegionText.includes('xining') || journeyRegionText.includes('西宁') ||
                            journeyRegionText.includes('lhasa') || journeyRegionText.includes('拉萨') ||
                            journeyRegionText.includes('qinghai') || journeyRegionText.includes('青海');
        const isBeijingRoute = journeyRegionText.includes('beijing') || journeyRegionText.includes('北京');
        
        // 特殊处理：针对 "Xining to Qinghai Lake, Zhangye & Dunhuang Grand 10-Day Tour" 行程的 Day 2 和 Day 3 直接定位到青海湖
        const isXiningQinghaiZhangyeRoute = (journeyRegionText.includes('xining') && journeyRegionText.includes('qinghai')) ||
                                            (journeyRegionText.includes('西宁') && journeyRegionText.includes('青海')) ||
                                            (journeyRegionText.includes('xining') && journeyRegionText.includes('zhangye')) ||
                                            (journeyRegionText.includes('西宁') && journeyRegionText.includes('张掖'));
        if (isXiningQinghaiZhangyeRoute && (day.day === 2 || day.day === 3)) {
          const qinghaiLakeEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
            const lowerKey = key.toLowerCase();
            return lowerKey === 'qinghai lake' || lowerKey === '青海湖';
          });
          if (qinghaiLakeEntry) {
            const [, geoData] = qinghaiLakeEntry;
            finalLng = geoData.lng;
            finalLat = geoData.lat;
            finalCity = geoData.name;
            console.log(`[page.tsx] Day ${day.day}: Direct Qinghai Lake match (Day 2/3 rule - priority):`, { 
              key: qinghaiLakeEntry[0], 
              finalCity, 
              finalLng, 
              finalLat 
            });
          }
        }
        
        // 特殊处理：如果标题中包含 "to Gyantse" 或 "Gyantse to"，优先匹配 Gyantse
        const titleLower = day.title?.toLowerCase() || '';
        if ((titleLower.includes('to gyantse') || titleLower.includes('gyantse to') || 
             titleLower.includes('to gyangtse') || titleLower.includes('gyangtse to') ||
             searchText.includes('gyantse') || searchText.includes('gyangtse') || 
             searchText.includes('江孜') || searchText.includes('pelkor') || searchText.includes('kumbum')) &&
            !finalLng && !finalLat) {
          // 直接匹配 Gyantse
          const gyantseEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
            const lowerKey = key.toLowerCase();
            return lowerKey === 'gyantse' || lowerKey === 'gyangtse' || lowerKey === '江孜' || 
                   lowerKey === 'pelkor' || lowerKey === 'kumbum';
          });
          if (gyantseEntry) {
            const [, geoData] = gyantseEntry;
            finalLng = geoData.lng;
            finalLat = geoData.lat;
            finalCity = geoData.name;
            console.log(`[page.tsx] Day ${day.day}: Direct Gyantse match:`, { 
              key: gyantseEntry[0], 
              finalCity, 
              finalLng, 
              finalLat 
            });
          }
        }
        
        // 特殊处理：针对 "Shanghai, Suzhou, Nanjing & Hangzhou Loop 8-Day Tour" 行程的特定地点匹配
        const isLoop8DayRoute = (journeyRegionText.includes('shanghai') && journeyRegionText.includes('suzhou') && 
                                 journeyRegionText.includes('nanjing') && journeyRegionText.includes('hangzhou')) ||
                                (journeyRegionText.includes('上海') && journeyRegionText.includes('苏州') &&
                                 journeyRegionText.includes('南京') && journeyRegionText.includes('杭州')) ||
                                journeyRegionText.includes('loop') || journeyRegionText.includes('环线');
        if (isLoop8DayRoute && !finalLng && !finalLat) {
          // 如果搜索文本中包含上海相关关键词，匹配到上海
          if (searchText.includes('shanghai') || searchText.includes('上海')) {
            const shanghaiEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'shanghai' || lowerKey === 'shanghai city' || lowerKey === '上海';
            });
            if (shanghaiEntry) {
              const [, geoData] = shanghaiEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Shanghai match:`, { 
                key: shanghaiEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含苏州相关关键词，匹配到苏州
          if ((!finalLng || !finalLat) && (searchText.includes('suzhou') || searchText.includes('苏州'))) {
            const suzhouEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'suzhou' || lowerKey === 'suzhou city' || lowerKey === '苏州';
            });
            if (suzhouEntry) {
              const [, geoData] = suzhouEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Suzhou match:`, { 
                key: suzhouEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含南京相关关键词，匹配到南京
          if ((!finalLng || !finalLat) && (searchText.includes('nanjing') || searchText.includes('南京'))) {
            const nanjingEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'nanjing' || lowerKey === 'nanjing city' || lowerKey === '南京';
            });
            if (nanjingEntry) {
              const [, geoData] = nanjingEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Nanjing match:`, { 
                key: nanjingEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含杭州相关关键词，匹配到杭州
          if ((!finalLng || !finalLat) && (searchText.includes('hangzhou') || searchText.includes('杭州'))) {
            const hangzhouEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'hangzhou' || lowerKey === 'hangzhou city' || lowerKey === '杭州';
            });
            if (hangzhouEntry) {
              const [, geoData] = hangzhouEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Hangzhou match:`, { 
                key: hangzhouEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Xining to Qinghai Lake, Zhangye & Dunhuang Grand 10-Day Tour" 行程的特定地点匹配（Day 2/3 已在前面处理）
        // 如果搜索文本中包含嘉峪关相关关键词，匹配到嘉峪关
        if (isXiningQinghaiZhangyeRoute && !finalLng && !finalLat) {
          if ((!finalLng || !finalLat) && (searchText.includes('jiayuguan') || searchText.includes('嘉峪关'))) {
            const jiayuguanEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'jiayuguan' || lowerKey === 'jiayuguan city' ||
                     lowerKey === 'jiayu pass' || lowerKey === '嘉峪关' || lowerKey === '嘉峪关市';
            });
            if (jiayuguanEntry) {
              const [, geoData] = jiayuguanEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Jiayuguan match:`, { 
                key: jiayuguanEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含张掖丹霞相关关键词，匹配到张掖丹霞
          if ((!finalLng || !finalLat) && (searchText.includes('zhangye') || searchText.includes('张掖') ||
              searchText.includes('danxia') || searchText.includes('丹霞'))) {
            const danxiaEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'zhangye danxia' || lowerKey === 'zhangye danxia national geopark' ||
                     lowerKey === '张掖丹霞' || lowerKey === '张掖丹霞山' ||
                     lowerKey === '丹霞' || lowerKey === '丹霞山';
            });
            if (danxiaEntry) {
              const [, geoData] = danxiaEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Zhangye Danxia match:`, { 
                key: danxiaEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            } else {
              // 如果没有找到丹霞，尝试匹配张掖市
              const zhangyeEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
                const lowerKey = key.toLowerCase();
                return lowerKey === 'zhangye' || lowerKey === 'zhangye city' ||
                       lowerKey === '张掖' || lowerKey === '张掖市';
              });
              if (zhangyeEntry) {
                const [, geoData] = zhangyeEntry;
                finalLng = geoData.lng;
                finalLat = geoData.lat;
                finalCity = geoData.name;
                console.log(`[page.tsx] Day ${day.day}: Direct Zhangye match:`, { 
                  key: zhangyeEntry[0], 
                  finalCity, 
                  finalLng, 
                  finalLat 
                });
              }
            }
          }
          // 如果搜索文本中包含祁连相关关键词，匹配到祁连
          if ((!finalLng || !finalLat) && (searchText.includes('qilian') || searchText.includes('祁连'))) {
            const qilianEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'qilian' || lowerKey === 'qilian county' ||
                     lowerKey === '祁连' || lowerKey === '祁连县';
            });
            if (qilianEntry) {
              const [, geoData] = qilianEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Qilian match:`, { 
                key: qilianEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含刚察相关关键词，匹配到刚察
          if ((!finalLng || !finalLat) && (searchText.includes('gangcha') || searchText.includes('刚察'))) {
            const gangchaEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'gangcha' || lowerKey === 'gangcha county' ||
                     lowerKey === '刚察' || lowerKey === '刚察县';
            });
            if (gangchaEntry) {
              const [, geoData] = gangchaEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Gangcha match:`, { 
                key: gangchaEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含青海湖相关关键词，匹配到青海湖
          if ((!finalLng || !finalLat) && (searchText.includes('qinghai lake') || searchText.includes('青海湖'))) {
            const qinghaiLakeEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'qinghai lake' || lowerKey === '青海湖';
            });
            if (qinghaiLakeEntry) {
              const [, geoData] = qinghaiLakeEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Qinghai Lake match:`, { 
                key: qinghaiLakeEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含西宁相关关键词，匹配到西宁
          if ((!finalLng || !finalLat) && (searchText.includes('xining') || searchText.includes('西宁'))) {
            const xiningEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'xining' || lowerKey === 'xining city' ||
                     lowerKey === '西宁' || lowerKey === '西宁市';
            });
            if (xiningEntry) {
              const [, geoData] = xiningEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Xining match:`, { 
                key: xiningEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含敦煌相关关键词，匹配到敦煌
          if ((!finalLng || !finalLat) && (searchText.includes('dunhuang') || searchText.includes('敦煌'))) {
            const dunhuangEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'dunhuang' || lowerKey === 'dunhuang city' ||
                     lowerKey === '敦煌' || lowerKey === '敦煌市';
            });
            if (dunhuangEntry) {
              const [, geoData] = dunhuangEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Dunhuang match:`, { 
                key: dunhuangEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Dunhuang to Turpan & Kumtag Desert 8-Day Off-Road Adventure Tour" 行程的特定地点匹配
        const isDunhuangTurpanRoute = (journeyRegionText.includes('dunhuang') && journeyRegionText.includes('turpan')) ||
                                      (journeyRegionText.includes('敦煌') && journeyRegionText.includes('吐鲁番')) ||
                                      (journeyRegionText.includes('dunhuang') && journeyRegionText.includes('kumtag')) ||
                                      (journeyRegionText.includes('敦煌') && journeyRegionText.includes('库姆塔格'));
        if (isDunhuangTurpanRoute && !finalLng && !finalLat) {
          // 如果搜索文本中包含鄯善相关关键词，匹配到鄯善
          if (searchText.includes('shanshan') || searchText.includes('鄯善')) {
            const shanshanEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'shanshan' || lowerKey === 'shanshan county' ||
                     lowerKey === '鄯善' || lowerKey === '鄯善县';
            });
            if (shanshanEntry) {
              const [, geoData] = shanshanEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Shanshan match:`, { 
                key: shanshanEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含库姆塔格沙漠相关关键词，匹配到库姆塔格沙漠
          if ((!finalLng || !finalLat) && (searchText.includes('kumtag') || searchText.includes('库姆塔格'))) {
            const kumtagEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'kumtag desert' || lowerKey === 'kumtag' ||
                     lowerKey === '库姆塔格' || lowerKey === '库姆塔格沙漠';
            });
            if (kumtagEntry) {
              const [, geoData] = kumtagEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Kumtag Desert match:`, { 
                key: kumtagEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含吐鲁番相关关键词，匹配到吐鲁番
          if ((!finalLng || !finalLat) && (searchText.includes('turpan') || searchText.includes('吐鲁番'))) {
            const turpanEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'turpan' || lowerKey === 'turpan city' ||
                     lowerKey === '吐鲁番' || lowerKey === '吐鲁番市';
            });
            if (turpanEntry) {
              const [, geoData] = turpanEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Turpan match:`, { 
                key: turpanEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含哈密相关关键词，匹配到哈密
          if ((!finalLng || !finalLat) && (searchText.includes('hami') || searchText.includes('哈密') ||
              searchText.includes('kumul'))) {
            const hamiEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'hami' || lowerKey === 'hami city' ||
                     lowerKey === '哈密' || lowerKey === '哈密市' || lowerKey === 'kumul';
            });
            if (hamiEntry) {
              const [, geoData] = hamiEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Hami match:`, { 
                key: hamiEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含敦煌相关关键词，匹配到敦煌
          if ((!finalLng || !finalLat) && (searchText.includes('dunhuang') || searchText.includes('敦煌'))) {
            const dunhuangEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'dunhuang' || lowerKey === 'dunhuang city' ||
                     lowerKey === '敦煌' || lowerKey === '敦煌市';
            });
            if (dunhuangEntry) {
              const [, geoData] = dunhuangEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Dunhuang match:`, { 
                key: dunhuangEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Urumqi to Altay Winter Wonderland 8-Day Tour" 行程的特定地点匹配
        const isUrumqiAltayRoute = (journeyRegionText.includes('urumqi') && journeyRegionText.includes('altay')) ||
                                  (journeyRegionText.includes('乌鲁木齐') && journeyRegionText.includes('阿勒泰')) ||
                                  (journeyRegionText.includes('altay') && journeyRegionText.includes('winter'));
        if (isUrumqiAltayRoute && !finalLng && !finalLat) {
          // 如果搜索文本中包含白哈巴相关关键词，匹配到白哈巴
          if (searchText.includes('baihaba') || searchText.includes('白哈巴')) {
            const baihabaEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'baihaba' || lowerKey === 'baihaba village' ||
                     lowerKey === '白哈巴' || lowerKey === '白哈巴村';
            });
            if (baihabaEntry) {
              const [, geoData] = baihabaEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Baihaba match:`, { 
                key: baihabaEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含禾木相关关键词，匹配到禾木
          if ((!finalLng || !finalLat) && (searchText.includes('hemu') || searchText.includes('禾木'))) {
            const hemuEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'hemu' || lowerKey === 'hemu village' ||
                     lowerKey === '禾木' || lowerKey === '禾木村';
            });
            if (hemuEntry) {
              const [, geoData] = hemuEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Hemu match:`, { 
                key: hemuEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含喀纳斯相关关键词，匹配到喀纳斯
          if ((!finalLng || !finalLat) && (searchText.includes('kanas') || searchText.includes('喀纳斯'))) {
            const kanasEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'kanas' || lowerKey === 'kanas lake' ||
                     lowerKey === '喀纳斯' || lowerKey === '喀纳斯湖';
            });
            if (kanasEntry) {
              const [, geoData] = kanasEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Kanas match:`, { 
                key: kanasEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含阿勒泰相关关键词，匹配到阿勒泰
          if ((!finalLng || !finalLat) && (searchText.includes('altay') || searchText.includes('阿勒泰'))) {
            const altayEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'altay' || lowerKey === 'altay city' ||
                     lowerKey === '阿勒泰' || lowerKey === '阿勒泰市';
            });
            if (altayEntry) {
              const [, geoData] = altayEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Altay match:`, { 
                key: altayEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含乌鲁木齐相关关键词，匹配到乌鲁木齐
          if ((!finalLng || !finalLat) && (searchText.includes('urumqi') || searchText.includes('乌鲁木齐'))) {
            const urumqiEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'urumqi' || lowerKey === 'urumqi city' || lowerKey === '乌鲁木齐';
            });
            if (urumqiEntry) {
              const [, geoData] = urumqiEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Urumqi match:`, { 
                key: urumqiEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Urumqi to Ili Grassland Nature Loop Tour 7-Day" 行程的特定地点匹配
        const isUrumqiIliRoute = (journeyRegionText.includes('urumqi') && journeyRegionText.includes('ili')) ||
                                (journeyRegionText.includes('乌鲁木齐') && journeyRegionText.includes('伊犁')) ||
                                (journeyRegionText.includes('urumqi') && journeyRegionText.includes('grassland'));
        if (isUrumqiIliRoute && !finalLng && !finalLat) {
          // 如果搜索文本中包含那拉提相关关键词，匹配到那拉提
          if (searchText.includes('nalati') || searchText.includes('那拉提')) {
            const nalatiEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'nalati' || lowerKey === 'nalati grassland' ||
                     lowerKey === '那拉提' || lowerKey === '那拉提草原';
            });
            if (nalatiEntry) {
              const [, geoData] = nalatiEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Nalati match:`, { 
                key: nalatiEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含库尔德宁相关关键词，匹配到库尔德宁
          if ((!finalLng || !finalLat) && (searchText.includes('kurdening') || searchText.includes('库尔德宁') ||
              searchText.includes('gongliu') || searchText.includes('巩留'))) {
            const kurdeningEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'kurdening' || lowerKey === 'kurdening nature reserve' ||
                     lowerKey === '库尔德宁' || lowerKey === '库尔德宁自然保护区' ||
                     lowerKey === 'gongliu' || lowerKey === '巩留';
            });
            if (kurdeningEntry) {
              const [, geoData] = kurdeningEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Kurdening match:`, { 
                key: kurdeningEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含赛里木湖相关关键词，匹配到赛里木湖
          if ((!finalLng || !finalLat) && (searchText.includes('sairam') || searchText.includes('sayram') ||
              searchText.includes('赛里木湖'))) {
            const sairamEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'sairam lake' || lowerKey === 'sayram lake' ||
                     lowerKey === '赛里木湖';
            });
            if (sairamEntry) {
              const [, geoData] = sairamEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Sayram Lake match:`, { 
                key: sairamEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含伊宁相关关键词，匹配到伊宁
          if ((!finalLng || !finalLat) && (searchText.includes('yining') || searchText.includes('伊宁') ||
              searchText.includes('ili') || searchText.includes('伊犁'))) {
            const yiningEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'yining' || lowerKey === 'yining city' ||
                     lowerKey === '伊宁' || lowerKey === 'ili' || lowerKey === '伊犁';
            });
            if (yiningEntry) {
              const [, geoData] = yiningEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Yining match:`, { 
                key: yiningEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含乌鲁木齐相关关键词，匹配到乌鲁木齐
          if ((!finalLng || !finalLat) && (searchText.includes('urumqi') || searchText.includes('乌鲁木齐'))) {
            const urumqiEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'urumqi' || lowerKey === 'urumqi city' || lowerKey === '乌鲁木齐';
            });
            if (urumqiEntry) {
              const [, geoData] = urumqiEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Urumqi match:`, { 
                key: urumqiEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Guilin to Yangshuo Classic 7-Day Tour" 行程的特定地点匹配
        const isGuilinYangshuoRoute = (journeyRegionText.includes('guilin') && journeyRegionText.includes('yangshuo')) ||
                                      (journeyRegionText.includes('桂林') && journeyRegionText.includes('阳朔')) ||
                                      (journeyRegionText.includes('guilin') && journeyRegionText.includes('classic'));
        if (isGuilinYangshuoRoute && !finalLng && !finalLat) {
          // 如果搜索文本中包含阳朔相关关键词，匹配到阳朔
          if (searchText.includes('yangshuo') || searchText.includes('阳朔')) {
            const yangshuoEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'yangshuo' || lowerKey === 'yangshuo county' ||
                     lowerKey === '阳朔' || lowerKey === '阳朔县';
            });
            if (yangshuoEntry) {
              const [, geoData] = yangshuoEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Yangshuo match:`, { 
                key: yangshuoEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含桂林相关关键词，匹配到桂林
          if ((!finalLng || !finalLat) && (searchText.includes('guilin') || searchText.includes('桂林'))) {
            const guilinEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'guilin' || lowerKey === 'guilin city' || lowerKey === '桂林';
            });
            if (guilinEntry) {
              const [, geoData] = guilinEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Guilin match:`, { 
                key: guilinEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Nanning to Sino-Vietnamese Border Nature 6-Day Tour" 行程的特定地点匹配
        const isNanningBorderRoute = (journeyRegionText.includes('nanning') && journeyRegionText.includes('sino-vietnamese')) ||
                                    (journeyRegionText.includes('南宁') && journeyRegionText.includes('中越')) ||
                                    (journeyRegionText.includes('nanning') && journeyRegionText.includes('border nature'));
        if (isNanningBorderRoute && !finalLng && !finalLat) {
          // 如果搜索文本中包含南宁相关关键词，匹配到南宁
          if (searchText.includes('nanning') || searchText.includes('南宁')) {
            const nanningEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'nanning' || lowerKey === 'nanning city' || lowerKey === '南宁';
            });
            if (nanningEntry) {
              const [, geoData] = nanningEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Nanning match:`, { 
                key: nanningEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含凭祥相关关键词，匹配到凭祥
          if ((!finalLng || !finalLat) && (searchText.includes('pingxiang') || searchText.includes('凭祥'))) {
            const pingxiangEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'pingxiang' || lowerKey === 'pingxiang city' || lowerKey === '凭祥';
            });
            if (pingxiangEntry) {
              const [, geoData] = pingxiangEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Pingxiang match:`, { 
                key: pingxiangEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含德天瀑布相关关键词，匹配到德天瀑布
          if ((!finalLng || !finalLat) && (searchText.includes('detian') || searchText.includes('德天') ||
              searchText.includes('waterfall') || searchText.includes('瀑布'))) {
            const detianEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'detian waterfall' || lowerKey === 'detian' ||
                     lowerKey === '德天瀑布' || lowerKey === 'ban gioc detian falls';
            });
            if (detianEntry) {
              const [, geoData] = detianEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Detian Waterfall match:`, { 
                key: detianEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含崇左相关关键词，匹配到崇左
          if ((!finalLng || !finalLat) && (searchText.includes('chongzuo') || searchText.includes('崇左'))) {
            const chongzuoEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'chongzuo' || lowerKey === 'chongzuo city' ||
                     lowerKey === '崇左' || lowerKey === '崇左市';
            });
            if (chongzuoEntry) {
              const [, geoData] = chongzuoEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Chongzuo match:`, { 
                key: chongzuoEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Chaoshan Region Cultural Heritage 6-Day Tour" 行程的特定地点匹配
        const isChaoshanHeritageRoute = journeyRegionText.includes('chaoshan region') || journeyRegionText.includes('潮汕地区') ||
                                       (journeyRegionText.includes('chaoshan') && journeyRegionText.includes('cultural heritage')) ||
                                       (journeyRegionText.includes('潮汕') && journeyRegionText.includes('文化遗产'));
        if (isChaoshanHeritageRoute && !finalLng && !finalLat) {
          // 如果搜索文本中包含汕头相关关键词，匹配到汕头
          if (searchText.includes('shantou') || searchText.includes('汕头')) {
            const shantouEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'shantou' || lowerKey === 'shantou city' || lowerKey === '汕头';
            });
            if (shantouEntry) {
              const [, geoData] = shantouEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Shantou match:`, { 
                key: shantouEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含揭阳相关关键词，匹配到揭阳
          if ((!finalLng || !finalLat) && (searchText.includes('jieyang') || searchText.includes('揭阳'))) {
            const jieyangEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'jieyang' || lowerKey === 'jieyang city' || lowerKey === '揭阳';
            });
            if (jieyangEntry) {
              const [, geoData] = jieyangEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Jieyang match:`, { 
                key: jieyangEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含潮州相关关键词，匹配到潮州
          if ((!finalLng || !finalLat) && (searchText.includes('chaozhou') || searchText.includes('潮州') ||
              searchText.includes('chaoshan') || searchText.includes('潮汕'))) {
            const chaozhouEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'chaozhou' || lowerKey === 'chaozhou city' ||
                     lowerKey === '潮州' || lowerKey === 'chaoshan' || lowerKey === '潮汕';
            });
            if (chaozhouEntry) {
              const [, geoData] = chaozhouEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Chaozhou match:`, { 
                key: chaozhouEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Guangzhou, Chaoshan & Xiamen Cultural Loop 8-Day Tour" 行程的特定地点匹配
        const isGuangzhouChaoshanXiamenRoute = (journeyRegionText.includes('guangzhou') && journeyRegionText.includes('chaoshan') && journeyRegionText.includes('xiamen')) ||
                                               (journeyRegionText.includes('广州') && journeyRegionText.includes('潮汕') && journeyRegionText.includes('厦门')) ||
                                               (journeyRegionText.includes('guangzhou') && journeyRegionText.includes('xiamen') && journeyRegionText.includes('cultural loop'));
        if (isGuangzhouChaoshanXiamenRoute && !finalLng && !finalLat) {
          // Day 1 & 2: 广州
          if ((day.day === 1 || day.day === 2) && (searchText.includes('guangzhou') || searchText.includes('广州'))) {
            const guangzhouEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'guangzhou' || lowerKey === 'guangzhou city' || lowerKey === '广州';
            });
            if (guangzhouEntry) {
              const [, geoData] = guangzhouEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Guangzhou match:`, { 
                key: guangzhouEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 3 & 4: 潮州
          if ((day.day === 3 || day.day === 4) && (searchText.includes('chaozhou') || searchText.includes('潮州') ||
              searchText.includes('chaoshan') || searchText.includes('潮汕'))) {
            const chaozhouEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'chaozhou' || lowerKey === 'chaozhou city' ||
                     lowerKey === '潮州' || lowerKey === 'chaoshan' || lowerKey === '潮汕';
            });
            if (chaozhouEntry) {
              const [, geoData] = chaozhouEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Chaozhou match:`, { 
                key: chaozhouEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 5 & 6: 厦门
          if ((day.day === 5 || day.day === 6) && (searchText.includes('xiamen') || searchText.includes('厦门'))) {
            const xiamenEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'xiamen' || lowerKey === 'xiamen city' || lowerKey === '厦门';
            });
            if (xiamenEntry) {
              const [, geoData] = xiamenEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Xiamen match:`, { 
                key: xiamenEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 7: 福建龙岩市
          if (day.day === 7 && (searchText.includes('longyan') || searchText.includes('龙岩') ||
              searchText.includes('fujian') || searchText.includes('福建'))) {
            const longyanEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'longyan' || lowerKey === 'longyan city' ||
                     lowerKey === '龙岩' || lowerKey === '龙岩市';
            });
            if (longyanEntry) {
              const [, geoData] = longyanEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Longyan match:`, { 
                key: longyanEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Huangshan to Huizhou Ancient Villages 6-Day Tour" 行程的特定地点匹配
        const isHuangshanHuizhouRoute = (journeyRegionText.includes('huangshan') && journeyRegionText.includes('huizhou')) ||
                                       (journeyRegionText.includes('黄山') && journeyRegionText.includes('徽州')) ||
                                       (journeyRegionText.includes('huangshan') && journeyRegionText.includes('ancient villages'));
        if (isHuangshanHuizhouRoute && !finalLng && !finalLat) {
          // 如果搜索文本中包含宏村相关关键词，匹配到宏村
          if (searchText.includes('hongcun') || searchText.includes('宏村') ||
              searchText.includes('yixian') || searchText.includes('黟县')) {
            const hongcunEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'hongcun' || lowerKey === 'hongcun village' ||
                     lowerKey === '宏村' || lowerKey === '宏村古村落' ||
                     lowerKey === 'yixian' || lowerKey === '黟县' || lowerKey === '黟县宏村';
            });
            if (hongcunEntry) {
              const [, geoData] = hongcunEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Hongcun match:`, { 
                key: hongcunEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含西溪南相关关键词，匹配到西溪南
          if ((!finalLng || !finalLat) && (searchText.includes('xixinan') || searchText.includes('西溪南'))) {
            const xixinanEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'xixinan' || lowerKey === 'xixinan ancient village' ||
                     lowerKey === '西溪南' || lowerKey === '西溪南古村落';
            });
            if (xixinanEntry) {
              const [, geoData] = xixinanEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Xixinan match:`, { 
                key: xixinanEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含黄山相关关键词，匹配到黄山市
          if ((!finalLng || !finalLat) && (searchText.includes('huangshan') || searchText.includes('黄山') ||
              searchText.includes('huizhou') || searchText.includes('徽州'))) {
            const huangshanEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'huangshan' || lowerKey === 'huangshan city' ||
                     lowerKey === '黄山' || lowerKey === '黄山市' ||
                     lowerKey === 'huizhou' || lowerKey === '徽州';
            });
            if (huangshanEntry) {
              const [, geoData] = huangshanEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Huangshan match:`, { 
                key: huangshanEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Hangzhou to Qiandao Lake Leisure 5-Day Tour" 行程的特定地点匹配
        const isQiandaoLakeRoute = journeyRegionText.includes('qiandao lake') || journeyRegionText.includes('千岛湖') ||
                                   journeyRegionText.includes('qiandaohu') || journeyRegionText.includes('thousand island') ||
                                   (journeyRegionText.includes('hangzhou') && journeyRegionText.includes('leisure'));
        if (isQiandaoLakeRoute && !finalLng && !finalLat) {
          // Day 3 & 4: 千岛湖
          if ((day.day === 3 || day.day === 4) && (searchText.includes('qiandao') || searchText.includes('千岛湖') ||
              searchText.includes('qiandaohu') || searchText.includes('thousand island') ||
              searchText.includes('chunan') || searchText.includes('淳安'))) {
            const qiandaoEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'qiandao lake' || lowerKey === 'qiandaohu' ||
                     lowerKey === '千岛湖' || lowerKey === 'thousand island lake' ||
                     lowerKey === 'chunan' || lowerKey === '淳安';
            });
            if (qiandaoEntry) {
              const [, geoData] = qiandaoEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Qiandao Lake match:`, { 
                key: qiandaoEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Hangzhou Cultural & Water Town In-Depth 6-Day Tour" 行程的特定地点匹配
        const isHangzhouWaterTownRoute = (journeyRegionText.includes('hangzhou') && journeyRegionText.includes('water town')) ||
                                         (journeyRegionText.includes('杭州') && journeyRegionText.includes('水乡')) ||
                                         (journeyRegionText.includes('hangzhou') && journeyRegionText.includes('cultural'));
        if (isHangzhouWaterTownRoute && !finalLng && !finalLat) {
          // Day 4: 浙江省嘉兴市乌镇
          if (day.day === 4 && (searchText.includes('wuzhen') || searchText.includes('乌镇') ||
              searchText.includes('jiaxing') || searchText.includes('嘉兴') ||
              searchText.includes('water town') || searchText.includes('水乡'))) {
            const wuzhenEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'wuzhen' || lowerKey === 'wuzhen town' ||
                     lowerKey === 'wuzhen ancient town' || lowerKey === '乌镇' ||
                     lowerKey === '乌镇古镇';
            });
            if (wuzhenEntry) {
              const [, geoData] = wuzhenEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Wuzhen match:`, { 
                key: wuzhenEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Shanghai & Suzhou Classic Dual-City 7-Day" 行程的特定地点匹配
        const isShanghaiSuzhouRoute = (journeyRegionText.includes('shanghai') && journeyRegionText.includes('suzhou')) ||
                                      (journeyRegionText.includes('上海') && journeyRegionText.includes('苏州')) ||
                                      journeyRegionText.includes('dual-city') || journeyRegionText.includes('双城');
        if (isShanghaiSuzhouRoute && !finalLng && !finalLat) {
          // 如果搜索文本中包含上海相关关键词，匹配到上海
          if (searchText.includes('shanghai') || searchText.includes('上海')) {
            const shanghaiEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'shanghai' || lowerKey === 'shanghai city' || lowerKey === '上海';
            });
            if (shanghaiEntry) {
              const [, geoData] = shanghaiEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Shanghai match:`, { 
                key: shanghaiEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // 如果搜索文本中包含苏州相关关键词，匹配到苏州
          if ((!finalLng || !finalLat) && (searchText.includes('suzhou') || searchText.includes('苏州'))) {
            const suzhouEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'suzhou' || lowerKey === 'suzhou city' || lowerKey === '苏州';
            });
            if (suzhouEntry) {
              const [, geoData] = suzhouEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Suzhou match:`, { 
                key: suzhouEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Zhangjiajie & Fenghuang Classic 7-Day Dual-Destination Tour" 行程的特定地点匹配
        const isZhangjiajieFenghuangRoute = (journeyRegionText.includes('zhangjiajie') && journeyRegionText.includes('fenghuang')) ||
                                           (journeyRegionText.includes('张家界') && journeyRegionText.includes('凤凰')) ||
                                           journeyRegionText.includes('dual-destination') || journeyRegionText.includes('双目的地');
        if (isZhangjiajieFenghuangRoute && !finalLng && !finalLat) {
          // Day 5 & 6: 湘西土家族自治州凤凰县
          if ((day.day === 5 || day.day === 6) && (searchText.includes('fenghuang') || searchText.includes('凤凰') ||
              searchText.includes('xiangxi') || searchText.includes('湘西'))) {
            const fenghuangEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'fenghuang' || lowerKey === 'fenghuang county' ||
                     lowerKey === 'fenghuang ancient town' || lowerKey === '凤凰' ||
                     lowerKey === '凤凰县' || lowerKey === '凤凰古城' ||
                     lowerKey === 'xiangxi' || lowerKey === '湘西';
            });
            if (fenghuangEntry) {
              const [, geoData] = fenghuangEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Fenghuang match:`, { 
                key: fenghuangEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 7: 张家界（无条件匹配，即使搜索文本中没有关键词）
          if (day.day === 7) {
            const zhangjiajieEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'zhangjiajie' || lowerKey === 'zhangjiajie city' || lowerKey === '张家界';
            });
            if (zhangjiajieEntry) {
              const [, geoData] = zhangjiajieEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Zhangjiajie match (unconditional):`, { 
                key: zhangjiajieEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Zhangjiajie 5-Day Highlights Tour" 行程的特定地点匹配
        const isZhangjiajieHighlightsRoute = journeyRegionText.includes('zhangjiajie') || journeyRegionText.includes('张家界') ||
                                            journeyRegionText.includes('highlights');
        if (isZhangjiajieHighlightsRoute && !finalLng && !finalLat) {
          // Day 2: 张家界天门山和72奇楼
          // 优先匹配天门山，如果搜索文本中有72奇楼关键词则匹配72奇楼
          if (day.day === 2) {
            // 先检查是否有72奇楼关键词
            if (searchText.includes('72奇楼') || searchText.includes('72 qi lou') ||
                searchText.includes('seventy-two strange building') || searchText.includes('奇楼')) {
              const qiLouEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
                const lowerKey = key.toLowerCase();
                return lowerKey === '72奇楼' || lowerKey === '72 qi lou' ||
                       lowerKey === 'seventy-two strange building';
              });
              if (qiLouEntry) {
                const [, geoData] = qiLouEntry;
                finalLng = geoData.lng;
                finalLat = geoData.lat;
                finalCity = geoData.name;
                console.log(`[page.tsx] Day ${day.day}: Direct 72 Qi Lou match:`, { 
                  key: qiLouEntry[0], 
                  finalCity, 
                  finalLng, 
                  finalLat 
                });
              }
            }
            // 如果没有匹配到72奇楼，匹配天门山
            if (!finalLng || !finalLat) {
              const tianmenEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
                const lowerKey = key.toLowerCase();
                return lowerKey === 'tianmen mountain' || lowerKey === 'tianmen' ||
                       lowerKey === '天门山';
              });
              if (tianmenEntry) {
                const [, geoData] = tianmenEntry;
                finalLng = geoData.lng;
                finalLat = geoData.lat;
                finalCity = geoData.name;
                console.log(`[page.tsx] Day ${day.day}: Direct Tianmen Mountain match:`, { 
                  key: tianmenEntry[0], 
                  finalCity, 
                  finalLng, 
                  finalLat 
                });
              }
            }
          }
          // Day 3: 张家界武陵源区
          if (day.day === 3 && (searchText.includes('wulingyuan') || searchText.includes('武陵源'))) {
            const wulingyuanEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'wulingyuan' || lowerKey === 'wulingyuan scenic area' ||
                     lowerKey === 'wulingyuan district' || lowerKey === '武陵源' || lowerKey === '武陵源区';
            });
            if (wulingyuanEntry) {
              const [, geoData] = wulingyuanEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Wulingyuan match:`, { 
                key: wulingyuanEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Guizhou to Waterfalls, Karst & Minority Cultures 8-Day Panorama Tour" 行程的特定地点匹配
        const isGuizhouPanoramaRoute = journeyRegionText.includes('waterfalls') || journeyRegionText.includes('karst') ||
                                       journeyRegionText.includes('minority cultures') || journeyRegionText.includes('panorama') ||
                                       (journeyRegionText.includes('guizhou') && journeyRegionText.includes('panorama'));
        if (isGuizhouPanoramaRoute && !finalLng && !finalLat) {
          // Day 4: 荔波县大七孔和黔东南州黎平县肇兴侗寨
          // 优先匹配肇兴侗寨，如果搜索文本中有大七孔关键词则匹配大七孔
          if (day.day === 4) {
            // 先检查是否有大七孔关键词（优先匹配）
            if (searchText.includes('daqikong') || searchText.includes('大七孔') || 
                searchText.includes('big seven arches')) {
              const daqikongEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
                const lowerKey = key.toLowerCase();
                return lowerKey === 'daqikong' || lowerKey === 'daqikong scenic area' ||
                       lowerKey === '大七孔' || lowerKey === 'big seven arches';
              });
              if (daqikongEntry) {
                const [, geoData] = daqikongEntry;
                finalLng = geoData.lng;
                finalLat = geoData.lat;
                finalCity = geoData.name;
                console.log(`[page.tsx] Day ${day.day}: Direct Daqikong match:`, { 
                  key: daqikongEntry[0], 
                  finalCity, 
                  finalLng, 
                  finalLat 
                });
              }
            }
            // 如果没有匹配到大七孔，匹配肇兴侗寨
            if (!finalLng || !finalLat) {
              const zhaoxingEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
                const lowerKey = key.toLowerCase();
                return lowerKey === 'zhaoxing' || lowerKey === 'zhaoxing dong village' ||
                       lowerKey === '肇兴' || lowerKey === '肇兴侗寨' ||
                       lowerKey === 'liping' || lowerKey === '黎平';
              });
              if (zhaoxingEntry) {
                const [, geoData] = zhaoxingEntry;
                finalLng = geoData.lng;
                finalLat = geoData.lat;
                finalCity = geoData.name;
                console.log(`[page.tsx] Day ${day.day}: Direct Zhaoxing match:`, { 
                  key: zhaoxingEntry[0], 
                  finalCity, 
                  finalLng, 
                  finalLat 
                });
              }
            }
          }
        }
        
        // 特殊处理：针对 "Guiyang to Qiannan Panoramic Explorer 9-Day Tour" 行程的特定地点匹配
        const isQiannanRoute = journeyRegionText.includes('qiannan') || journeyRegionText.includes('黔南') ||
                               journeyRegionText.includes('guiyang') || journeyRegionText.includes('贵阳') ||
                               (journeyRegionText.includes('panoramic') && journeyRegionText.includes('explorer'));
        if (isQiannanRoute && !finalLng && !finalLat) {
          // Day 1: 贵阳市
          if (day.day === 1 && (searchText.includes('guiyang') || searchText.includes('贵阳'))) {
            const guiyangEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'guiyang' || lowerKey === 'guiyang city' || lowerKey === '贵阳';
            });
            if (guiyangEntry) {
              const [, geoData] = guiyangEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Guiyang match:`, { 
                key: guiyangEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 2: 黔东南州雷山县西江镇
          if (day.day === 2 && (searchText.includes('xijiang') || searchText.includes('西江') ||
              searchText.includes('leishan') || searchText.includes('雷山') ||
              searchText.includes('miao village') || searchText.includes('苗寨'))) {
            const xijiangEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'xijiang' || lowerKey === 'xijiang miao village' || 
                     lowerKey === 'xijiang qianhu miao village' || lowerKey === '西江' ||
                     lowerKey === '西江千户苗寨' || lowerKey === 'leishan' || lowerKey === '雷山';
            });
            if (xijiangEntry) {
              const [, geoData] = xijiangEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Xijiang match:`, { 
                key: xijiangEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 3: 黔东南州荔波县
          if (day.day === 3 && (searchText.includes('libo') || searchText.includes('荔波'))) {
            const liboEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'libo' || lowerKey === 'libo county' || lowerKey === '荔波' || lowerKey === '荔波县';
            });
            if (liboEntry) {
              const [, geoData] = liboEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Libo match:`, { 
                key: liboEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 5: 罗甸县
          if (day.day === 5 && (searchText.includes('luodian') || searchText.includes('罗甸'))) {
            const luodianEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'luodian' || lowerKey === 'luodian county' || lowerKey === '罗甸' || lowerKey === '罗甸县';
            });
            if (luodianEntry) {
              const [, geoData] = luodianEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Luodian match:`, { 
                key: luodianEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 6: 兴义县
          if (day.day === 6 && (searchText.includes('xingyi') || searchText.includes('兴义'))) {
            const xingyiEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'xingyi' || lowerKey === 'xingyi city' || lowerKey === '兴义' || lowerKey === '兴义市';
            });
            if (xingyiEntry) {
              const [, geoData] = xingyiEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Xingyi match:`, { 
                key: xingyiEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 7: 安顺市镇宁县
          if (day.day === 7 && (searchText.includes('zhenning') || searchText.includes('镇宁') ||
              searchText.includes('anshun') || searchText.includes('安顺'))) {
            const zhenningEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'zhenning' || lowerKey === 'zhenning county' || 
                     lowerKey === '镇宁' || lowerKey === '镇宁县';
            });
            if (zhenningEntry) {
              const [, geoData] = zhenningEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Zhenning match:`, { 
                key: zhenningEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 8: 黄果树瀑布
          if (day.day === 8 && (searchText.includes('huangguoshu') || searchText.includes('黄果树') ||
              searchText.includes('waterfall') || searchText.includes('瀑布'))) {
            const huangguoshuEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'huangguoshu' || lowerKey === 'huangguoshu waterfall' ||
                     lowerKey === '黄果树' || lowerKey === '黄果树瀑布';
            });
            if (huangguoshuEntry) {
              const [, geoData] = huangguoshuEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Huangguoshu match:`, { 
                key: huangguoshuEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Chongqing & Wulong Classic 6-Day Tour" 行程的特定地点匹配
        const isWulongClassicRoute = journeyRegionText.includes('wulong') || journeyRegionText.includes('武隆') ||
                                     (journeyRegionText.includes('chongqing') && journeyRegionText.includes('wulong')) ||
                                     (journeyRegionText.includes('重庆') && journeyRegionText.includes('武隆'));
        if (isWulongClassicRoute && !finalLng && !finalLat) {
          // Day 4: 重庆武隆
          if (day.day === 4 && (searchText.includes('wulong') || searchText.includes('武隆'))) {
            const wulongEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'wulong' || lowerKey === 'wulong district' || lowerKey === 'wulong karst' ||
                     lowerKey === '武隆' || lowerKey === '武隆喀斯特';
            });
            if (wulongEntry) {
              const [, geoData] = wulongEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Wulong match:`, { 
                key: wulongEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 5: 重庆彭水
          if (day.day === 5 && (searchText.includes('pengshui') || searchText.includes('彭水'))) {
            const pengshuiEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'pengshui' || lowerKey === 'pengshui county' || 
                     lowerKey === '彭水' || lowerKey === '彭水县';
            });
            if (pengshuiEntry) {
              const [, geoData] = pengshuiEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Pengshui match:`, { 
                key: pengshuiEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 6: 通常返回重庆或离开，如果没有特定地点则匹配到重庆
          if (day.day === 6) {
            // 如果搜索文本中包含重庆相关关键词，匹配到重庆
            if (searchText.includes('chongqing') || searchText.includes('重庆') || 
                searchText.includes('return') || searchText.includes('departure') ||
                searchText.includes('返回') || searchText.includes('离开')) {
              const chongqingEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
                const lowerKey = key.toLowerCase();
                return lowerKey === 'chongqing' || lowerKey === 'chongqing city' || lowerKey === '重庆';
              });
              if (chongqingEntry) {
                const [, geoData] = chongqingEntry;
                finalLng = geoData.lng;
                finalLat = geoData.lat;
                finalCity = geoData.name;
                console.log(`[page.tsx] Day ${day.day}: Direct Chongqing match (Day 6):`, { 
                  key: chongqingEntry[0], 
                  finalCity, 
                  finalLng, 
                  finalLat 
                });
              }
            }
          }
        }
        
        // 特殊处理：针对 "Chengdu & Chongqing Double Cities 6-Day Tour" 行程的特定地点匹配
        const isDoubleCitiesRoute = journeyRegionText.includes('chongqing') || journeyRegionText.includes('重庆') ||
                                    journeyRegionText.includes('double cities') || journeyRegionText.includes('双城') ||
                                    (journeyRegionText.includes('chengdu') && journeyRegionText.includes('chongqing'));
        if (isDoubleCitiesRoute && !finalLng && !finalLat) {
          // 如果搜索文本中包含重庆相关关键词，匹配到重庆
          if (searchText.includes('chongqing') || searchText.includes('重庆')) {
            const chongqingEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'chongqing' || lowerKey === 'chongqing city' || lowerKey === '重庆';
            });
            if (chongqingEntry) {
              const [, geoData] = chongqingEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Chongqing match:`, { 
                key: chongqingEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Sichuan, Chengdu Classic Heritage 7-Day Tour" 行程的特定地点匹配
        const isChengduHeritageRoute = journeyRegionText.includes('chengdu classic') || journeyRegionText.includes('成都经典') ||
                                       journeyRegionText.includes('classic heritage') || journeyRegionText.includes('经典遗产') ||
                                       (journeyRegionText.includes('chengdu') && journeyRegionText.includes('heritage'));
        if (isChengduHeritageRoute && !finalLng && !finalLat) {
          // Day 4: 都江堰
          if (day.day === 4 && (searchText.includes('dujiangyan') || searchText.includes('都江堰'))) {
            const dujiangyanEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'dujiangyan' || lowerKey === 'dujiangyan city' || 
                     lowerKey === '都江堰' || lowerKey === 'dujiangyan irrigation system' ||
                     lowerKey === '都江堰水利工程';
            });
            if (dujiangyanEntry) {
              const [, geoData] = dujiangyanEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Dujiangyan match:`, { 
                key: dujiangyanEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 5: 乐山
          if (day.day === 5 && (searchText.includes('leshan') || searchText.includes('乐山') ||
              searchText.includes('giant buddha') || searchText.includes('大佛'))) {
            const leshanEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'leshan' || lowerKey === 'leshan city' || lowerKey === '乐山' ||
                     lowerKey === 'leshan giant buddha' || lowerKey === '乐山大佛';
            });
            if (leshanEntry) {
              const [, geoData] = leshanEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Leshan match:`, { 
                key: leshanEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 6: 峨眉山
          if (day.day === 6 && (searchText.includes('emeishan') || searchText.includes('emei') ||
              searchText.includes('峨眉山') || searchText.includes('mount emei'))) {
            const emeiEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'emeishan' || lowerKey === 'mount emei' || lowerKey === 'emei mountain' ||
                     lowerKey === '峨眉山' || lowerKey === 'emei shan';
            });
            if (emeiEntry) {
              const [, geoData] = emeiEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Mount Emei match:`, { 
                key: emeiEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Chengdu to Xichang & Luojishan 6-Day Tour" 行程的特定地点匹配
        const isXichangLuojishanRoute = journeyRegionText.includes('xichang') || journeyRegionText.includes('西昌') ||
                                        journeyRegionText.includes('luojishan') || journeyRegionText.includes('螺髻山') ||
                                        journeyRegionText.includes('luoji');
        if (isXichangLuojishanRoute && !finalLng && !finalLat) {
          // Day 2: 西昌和西昌泸山
          if (day.day === 2 && (searchText.includes('xichang') || searchText.includes('西昌') ||
              searchText.includes('lushan') || searchText.includes('泸山'))) {
            // 优先匹配泸山，如果没有则匹配西昌
            const lushanEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'lushan xichang' || lowerKey === 'lushan mountain xichang' || 
                     lowerKey === '泸山' || lowerKey === '西昌泸山';
            });
            if (lushanEntry) {
              const [, geoData] = lushanEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Lushan Xichang match:`, { 
                key: lushanEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            } else {
              // 如果没有找到泸山，使用西昌
              const xichangEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
                const lowerKey = key.toLowerCase();
                return lowerKey === 'xichang' || lowerKey === 'xichang city' || lowerKey === '西昌';
              });
              if (xichangEntry) {
                const [, geoData] = xichangEntry;
                finalLng = geoData.lng;
                finalLat = geoData.lat;
                finalCity = geoData.name;
                console.log(`[page.tsx] Day ${day.day}: Direct Xichang match:`, { 
                  key: xichangEntry[0], 
                  finalCity, 
                  finalLng, 
                  finalLat 
                });
              }
            }
          }
          // Day 3: 螺髻山和邛海
          if (day.day === 3 && (searchText.includes('luojishan') || searchText.includes('luoji') ||
              searchText.includes('螺髻山') || searchText.includes('qionghai') || searchText.includes('邛海') ||
              searchText.includes('liangshan') || searchText.includes('凉山'))) {
            // 优先匹配螺髻山，如果没有则匹配邛海
            const luojiEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'luojishan' || lowerKey === 'luoji mountain' || lowerKey === '螺髻山';
            });
            if (luojiEntry) {
              const [, geoData] = luojiEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Luojishan match:`, { 
                key: luojiEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            } else {
              // 如果没有找到螺髻山，使用邛海
              const qionghaiEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
                const lowerKey = key.toLowerCase();
                return lowerKey === 'qionghai' || lowerKey === 'qionghai lake' || lowerKey === 'qiong lake' || 
                       lowerKey === '邛海';
              });
              if (qionghaiEntry) {
                const [, geoData] = qionghaiEntry;
                finalLng = geoData.lng;
                finalLat = geoData.lat;
                finalCity = geoData.name;
                console.log(`[page.tsx] Day ${day.day}: Direct Qionghai match:`, { 
                  key: qionghaiEntry[0], 
                  finalCity, 
                  finalLng, 
                  finalLat 
                });
              }
            }
          }
        }
        
        // 特殊处理：针对 "Western Sichuan & Daocheng Yading Nature 9-Day Tour" 行程的特定地点匹配
        const isWesternSichuanRoute = journeyRegionText.includes('western sichuan') || journeyRegionText.includes('川西') ||
                                     journeyRegionText.includes('daocheng yading') || journeyRegionText.includes('稻城亚丁') ||
                                     journeyRegionText.includes('yading nature');
        if (isWesternSichuanRoute && !finalLng && !finalLat) {
          // Day 2: 四姑娘山镇
          if (day.day === 2 && (searchText.includes('siguniangshan') || searchText.includes('siguniang') || 
              searchText.includes('四姑娘山') || searchText.includes('日隆') || searchText.includes('rilong') ||
              searchText.includes('aba') || searchText.includes('阿坝'))) {
            const siguniangEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'siguniangshan' || lowerKey === 'siguniangshan town' || lowerKey === 'siguniang' ||
                     lowerKey === '四姑娘山' || lowerKey === '四姑娘山镇' || lowerKey === '日隆' || lowerKey === '日隆镇' ||
                     lowerKey === 'rilong';
            });
            if (siguniangEntry) {
              const [, geoData] = siguniangEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Siguniangshan match:`, { 
                key: siguniangEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 3 & 4: 丹巴县
          if ((day.day === 3 || day.day === 4) && (searchText.includes('danba') || searchText.includes('丹巴') ||
              searchText.includes('chaggo') || searchText.includes('章谷'))) {
            const danbaEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'danba' || lowerKey === 'danba county' || lowerKey === '丹巴' || lowerKey === '丹巴县' ||
                     lowerKey === 'chaggo' || lowerKey === '章谷' || lowerKey === '章谷镇';
            });
            if (danbaEntry) {
              const [, geoData] = danbaEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Danba match:`, { 
                key: danbaEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 特殊处理：针对 "Chengdu to Ganzi Tibetan Buddhism Pilgrimage" 行程的特定地点匹配
        const isGanziPilgrimageRoute = journeyRegionText.includes('ganzi') || journeyRegionText.includes('甘孜') ||
                                      journeyRegionText.includes('tibetan buddhism') || journeyRegionText.includes('pilgrimage');
        if (isGanziPilgrimageRoute && !finalLng && !finalLat) {
          // Day 2: secret village / 色龙村
          if (day.day === 2 && (searchText.includes('secret village') || searchText.includes('色龙') || searchText.includes('selong'))) {
            const selongEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'selong' || lowerKey === 'selong village' || lowerKey === '色龙' || lowerKey === '色龙村' || lowerKey === 'secret village';
            });
            if (selongEntry) {
              const [, geoData] = selongEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Selong Village match:`, { 
                key: selongEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 3: 八美镇
          if (day.day === 3 && (searchText.includes('bamei') || searchText.includes('八美'))) {
            const bameiEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'bamei' || lowerKey === 'bamei town' || lowerKey === '八美' || lowerKey === '八美镇';
            });
            if (bameiEntry) {
              const [, geoData] = bameiEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Bamei match:`, { 
                key: bameiEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 5: 白玉县
          if (day.day === 5 && (searchText.includes('baiyu') || searchText.includes('白玉') || 
              (searchText.includes('ganzi') && searchText.includes('to') && searchText.includes('baiyu')))) {
            const baiyuEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'baiyu' || lowerKey === 'baiyu county' || lowerKey === '白玉' || lowerKey === '白玉县';
            });
            if (baiyuEntry) {
              const [, geoData] = baiyuEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Baiyu match:`, { 
                key: baiyuEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 6 & 7: 德格县
          if ((day.day === 6 || day.day === 7) && (searchText.includes('dege') || searchText.includes('derge') || searchText.includes('德格'))) {
            const degeEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'dege' || lowerKey === 'dege county' || lowerKey === 'derge' || lowerKey === '德格' || lowerKey === '德格县';
            });
            if (degeEntry) {
              const [, geoData] = degeEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Dege match:`, { 
                key: degeEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
          // Day 9: 马尼干戈
          if (day.day === 9 && (searchText.includes('manigango') || searchText.includes('马尼干戈'))) {
            const manigangoEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'manigango' || lowerKey === '马尼干戈' || lowerKey === '马尼干戈县';
            });
            if (manigangoEntry) {
              const [, geoData] = manigangoEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Direct Manigango match:`, { 
                key: manigangoEntry[0], 
                finalCity, 
                finalLng, 
                finalLat 
              });
            }
          }
        }
        
        // 如果还没有匹配到，继续常规匹配流程
        if (!finalLng || !finalLat) {
          // 【最高优先级】特殊处理：对于北京路线，优先匹配 Tiananmen Square（避免误匹配到 Tianmen Mountain）
          // 检查多种可能的 tiananmen 关键词变体
          const hasTiananmenKeyword = searchText.includes('tiananmen') || 
                                      searchText.includes('天安门') || 
                                      searchText.includes('tiananmen square') ||
                                      searchText.includes('tian anmen') ||
                                      day.title?.toLowerCase().includes('tiananmen') ||
                                      day.title?.toLowerCase().includes('天安门') ||
                                      day.description?.toLowerCase().includes('tiananmen') ||
                                      day.description?.toLowerCase().includes('天安门');
          
          if (isBeijingRoute && hasTiananmenKeyword) {
            const tiananmenEntry = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              return lowerKey === 'tiananmen' || lowerKey === '天安门';
            });
            if (tiananmenEntry) {
              const [, geoData] = tiananmenEntry;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: PRIORITY Tiananmen Square match (Beijing route):`, { 
                key: tiananmenEntry[0], 
                finalCity, 
                finalLng, 
                finalLat,
                searchText: searchText.substring(0, 200),
                dayTitle: day.title
              });
            }
          }
          
          // 如果还没有匹配到，继续常规匹配流程
          if (!finalLng || !finalLat) {
            // 首先尝试精确匹配（完整词匹配）
            const exactMatch = Object.entries(CITY_GEO_DB).find(([key]) => {
              const lowerKey = key.toLowerCase();
              
              // 排除逻辑：如果行程是西藏/青海路线，排除所有北京相关地点
              if (isTibetRoute) {
                const beijingKeys = ['beijing', '北京', 'summer palace', '颐和园', 'forbidden city', '故宫', 
                                   'tiananmen', '天安门', 'temple of heaven', '天坛', 'great wall', '长城',
                                   'badaling', '八达岭', 'mutianyu', '慕田峪', 'beihai park', '北海公园', 'hutong', '胡同'];
                if (beijingKeys.some(bk => lowerKey.includes(bk))) {
                  return false;
                }
              }
              
              // 排除逻辑：如果行程是北京路线，排除所有西藏/青海相关地点
              if (isBeijingRoute) {
                const tibetKeys = ['tibet', '西藏', 'lhasa', '拉萨', 'qinghai', '青海', 'xining', '西宁'];
                if (tibetKeys.some(tk => lowerKey.includes(tk))) {
                  return false;
                }
              }
              
              // 【强制排除】如果搜索文本包含任何 "tiananmen" 相关关键词，强制排除 "tianmen" 和 "天门山" 的匹配
              const hasTiananmenKeyword = searchText.includes('tiananmen') || 
                                          searchText.includes('天安门') || 
                                          searchText.includes('tiananmen square') ||
                                          searchText.includes('tian anmen');
              if (hasTiananmenKeyword && 
                  (lowerKey === 'tianmen' || lowerKey === 'tianmen mountain' || lowerKey === '天门山')) {
                console.log(`[page.tsx] Day ${day.day}: EXCLUDING Tianmen Mountain match because Tiananmen keyword found`);
                return false;
              }
              
              // 精确匹配：作为完整词出现（前后有空格、标点或字符串边界）
              const exactPattern = new RegExp(`\\b${lowerKey.replace(/[.*+?^${'$'}{}()|[\]\\]/g, '\\$&')}\\b`, 'i');
              return exactPattern.test(searchText) ||
                     ((day as any).city && exactPattern.test((day as any).city.toLowerCase())) ||
                     ((day as any).location && exactPattern.test((day as any).location.toLowerCase()));
            });
            
            if (exactMatch) {
              const [, geoData] = exactMatch;
              finalLng = geoData.lng;
              finalLat = geoData.lat;
              finalCity = geoData.name;
              console.log(`[page.tsx] Day ${day.day}: Exact match from Geo Dictionary:`, { 
                key: exactMatch[0], 
                finalCity, 
                finalLng, 
                finalLat,
                isTibetRoute,
                isBeijingRoute
              });
            } else {
              // 如果没有精确匹配，尝试模糊匹配（但排除容易误匹配的词）
              const fuzzyMatch = Object.entries(CITY_GEO_DB).find(([key]) => {
                const lowerKey = key.toLowerCase();
                
                // 排除逻辑：如果行程是西藏/青海路线，排除所有北京相关地点
                if (isTibetRoute) {
                  const beijingKeys = ['beijing', '北京', 'summer palace', '颐和园', 'forbidden city', '故宫', 
                                     'tiananmen', '天安门', 'temple of heaven', '天坛', 'great wall', '长城',
                                     'badaling', '八达岭', 'mutianyu', '慕田峪', 'beihai park', '北海公园', 'hutong', '胡同'];
                  if (beijingKeys.some(bk => lowerKey.includes(bk))) {
                    return false;
                  }
                }
                
                // 排除逻辑：如果行程是北京路线，排除所有西藏/青海相关地点
                if (isBeijingRoute) {
                  const tibetKeys = ['tibet', '西藏', 'lhasa', '拉萨', 'qinghai', '青海', 'xining', '西宁'];
                  if (tibetKeys.some(tk => lowerKey.includes(tk))) {
                    return false;
                  }
                }
                
                // 【强制排除】如果搜索文本包含任何 "tiananmen" 相关关键词，强制排除 "tianmen" 和 "天门山" 的匹配
                const hasTiananmenKeyword = searchText.includes('tiananmen') || 
                                            searchText.includes('天安门') || 
                                            searchText.includes('tiananmen square') ||
                                            searchText.includes('tian anmen');
                if (hasTiananmenKeyword && 
                    (lowerKey === 'tianmen' || lowerKey === 'tianmen mountain' || lowerKey === '天门山')) {
                  console.log(`[page.tsx] Day ${day.day}: EXCLUDING Tianmen Mountain match in fuzzy search because Tiananmen keyword found`);
                  return false;
                }
                
                // 如果 key 包含 "palace" 但搜索文本中没有完整的 "summer palace"，则跳过
                if (lowerKey.includes('palace') && !searchText.includes('summer palace') && !searchText.includes('颐和园')) {
                  return false;
                }
                
                return searchText.includes(lowerKey) || 
                       ((day as any).city && (day as any).city.toLowerCase().includes(lowerKey)) ||
                       ((day as any).location && (day as any).location.toLowerCase().includes(lowerKey));
              });
              
              if (fuzzyMatch) {
                const [, geoData] = fuzzyMatch;
                finalLng = geoData.lng;
                finalLat = geoData.lat;
                finalCity = geoData.name;
                console.log(`[page.tsx] Day ${day.day}: Fuzzy match from Geo Dictionary:`, { 
                  key: fuzzyMatch[0], 
                  finalCity, 
                  finalLng, 
                  finalLat,
                  isTibetRoute,
                  isBeijingRoute
                });
              } else {
                // 如果没有匹配到，记录调试信息
                if (day.day === 4 || day.day === 5) {
                  // 特别关注 day4 和 day5
                  console.warn(`[page.tsx] Day ${day.day}: No match found in Geo Dictionary`, {
                    searchText: searchText.substring(0, 300),
                    hasGyantseKeywords: searchText.includes('gyantse') || searchText.includes('gyangtse') || 
                                       searchText.includes('江孜') || searchText.includes('pelkor') || 
                                       searchText.includes('kumbum'),
                    availableGyantseKeys: Object.keys(CITY_GEO_DB).filter(k => {
                      const lowerK = k.toLowerCase();
                      return lowerK.includes('gyantse') || lowerK.includes('pelkor') || lowerK.includes('kumbum');
                    }),
                    allAvailableKeys: Object.keys(CITY_GEO_DB).slice(0, 20) // 显示前20个key作为参考
                  });
                }
              }
            }
          }
        }
      }
      
      // 优先级 3: 使用行程总中心点（行程区域感知兜底）
      // 【关键修复点】：优先参考整个行程的中心点，而不是死守固定坐标
      if (!finalLng || !finalLat) {
        // 如果仍然无法匹配，尝试从标题中提取更多信息
        const titleLower = day.title?.toLowerCase() || '';
        const descLower = day.description?.toLowerCase() || '';
        const combinedText = `${titleLower} ${descLower}`;
        
        // 根据 journey 的区域信息，排除不相关的地点
        const journeyRegionText = `${journey.region || ''} ${journey.city || ''} ${journey.title || ''}`.toLowerCase();
        const isTibetRoute = journeyRegionText.includes('tibet') || journeyRegionText.includes('西藏') || 
                            journeyRegionText.includes('xining') || journeyRegionText.includes('西宁') ||
                            journeyRegionText.includes('lhasa') || journeyRegionText.includes('拉萨') ||
                            journeyRegionText.includes('qinghai') || journeyRegionText.includes('青海');
        const isBeijingRoute = journeyRegionText.includes('beijing') || journeyRegionText.includes('北京');
        
        // 再次尝试匹配（可能标题格式不同），但排除容易误匹配的地点
        const retryMatch = Object.entries(CITY_GEO_DB).find(([key]) => {
          const lowerKey = key.toLowerCase();
          
          // 排除逻辑：如果行程是西藏/青海路线，排除所有北京相关地点
          if (isTibetRoute) {
            const beijingKeys = ['beijing', '北京', 'summer palace', '颐和园', 'forbidden city', '故宫', 
                               'tiananmen', '天安门', 'temple of heaven', '天坛', 'great wall', '长城',
                               'badaling', '八达岭', 'mutianyu', '慕田峪', 'beihai park', '北海公园', 'hutong', '胡同'];
            if (beijingKeys.some(bk => lowerKey.includes(bk))) {
              return false;
            }
          }
          
          // 排除逻辑：如果行程是北京路线，排除所有西藏/青海相关地点
          if (isBeijingRoute) {
            const tibetKeys = ['tibet', '西藏', 'lhasa', '拉萨', 'qinghai', '青海', 'xining', '西宁'];
            if (tibetKeys.some(tk => lowerKey.includes(tk))) {
              return false;
            }
          }
          
          // 【强制排除】如果搜索文本包含任何 "tiananmen" 相关关键词，强制排除 "tianmen" 和 "天门山" 的匹配
          const hasTiananmenKeyword = combinedText.includes('tiananmen') || 
                                      combinedText.includes('天安门') || 
                                      combinedText.includes('tiananmen square') ||
                                      combinedText.includes('tian anmen');
          if (hasTiananmenKeyword && 
              (lowerKey === 'tianmen' || lowerKey === 'tianmen mountain' || lowerKey === '天门山')) {
            console.log(`[page.tsx] Day ${day.day}: EXCLUDING Tianmen Mountain match in retry search because Tiananmen keyword found`);
            return false;
          }
          
          // 【优先匹配】如果搜索文本包含 tiananmen 相关关键词，优先匹配天安门
          if (hasTiananmenKeyword && (lowerKey === 'tiananmen' || lowerKey === '天安门')) {
            return true; // 优先返回天安门
          }
          
          // 排除容易误匹配的词：如果 key 包含 "palace" 但搜索文本中没有完整的 "summer palace"
          if (lowerKey.includes('palace') && !combinedText.includes('summer palace') && !combinedText.includes('颐和园')) {
            return false;
          }
          
          // 精确匹配优先
          const exactPattern = new RegExp(`\\b${lowerKey.replace(/[.*+?^${'$'}{}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (exactPattern.test(combinedText)) {
            return true;
          }
          
          // 模糊匹配作为备选
          return combinedText.includes(lowerKey);
        });
        
        if (retryMatch) {
          const [, geoData] = retryMatch;
          finalLng = geoData.lng;
          finalLat = geoData.lat;
          finalCity = geoData.name;
          console.log(`[page.tsx] Day ${day.day}: Retry match from Geo Dictionary:`, { 
            key: retryMatch[0], 
            finalCity, 
            finalLng, 
            finalLat,
            isTibetRoute,
            isBeijingRoute
          });
        } else {
          // 如果仍然无法匹配，使用行程中心点，但确保 finalCity 有值
          finalLng = baseLng;
          finalLat = baseLat;
          // 从标题中提取城市名称（处理 "Day X — 城市名" 格式）
          const titleParts = day.title?.split('—') || day.title?.split('-') || day.title?.split(' ') || [];
          // 尝试从标题中提取最后一个部分作为城市名
          finalCity = titleParts[titleParts.length - 1]?.trim() || day.title || `Day ${day.day}`;
          console.log(`[page.tsx] Day ${day.day}: Using journey center point (region-aware fallback)`, { 
            finalCity, 
            finalLng, 
            finalLat,
            source: 'journey center',
            title: day.title
          });
        }
      }
      
      // 优先级 4: 绝对默认值（仅在以上都失败时使用）
      if (!finalLng || !finalLat || isNaN(finalLng) || isNaN(finalLat)) {
        finalLng = baseLng; // 使用行程中心点，而不是固定的成都
        finalLat = baseLat;
        finalCity = day.title || `Day ${day.day}`;
        console.warn(`[page.tsx] Day ${day.day}: Using journey center as absolute default`, { finalCity, finalLng, finalLat });
      }
      
      // 最终坐标验证
      if (finalLng < -180 || finalLng > 180 || finalLat < -90 || finalLat > 90) {
        console.warn(`[page.tsx] Day ${day.day}: Coordinates out of range, using journey center`, { finalLng, finalLat });
        finalLng = baseLng;
        finalLat = baseLat;
      }

      // 确保 finalCity 有值，如果没有则从标题中提取
      if (!finalCity || finalCity.trim() === '') {
        // 尝试从标题中提取城市名
        const titleParts = day.title?.split('—') || day.title?.split('-') || day.title?.split(' ') || [];
        finalCity = titleParts[titleParts.length - 1]?.trim() || day.title || `Day ${day.day}`;
      }

      const locationData = {
        id: `${journey.id}-day-${day.day}-step-0`,
        lng: finalLng,
        lat: finalLat,
        name: finalCity,
        city: finalCity,
        label: finalCity, // 确保 label 字段也有值，用于 Marker 显示
        day: day.day
      };
      
      console.log(`[page.tsx] Day ${day.day} location data:`, locationData);
      
      return {
        day: day.day,
        title: day.title,
        locations: [locationData]
      };
    });
  }, [journey, isDayTour]);

  // Intersection Observer: 监听当前在视口中央的 Day
  const [activeDay, setActiveDay] = useState<number | undefined>(undefined);
  const [currentDay, setCurrentDay] = useState<number | undefined>(undefined);
  const dayRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  
  // Sticky Map Section: 检测 section 是否固定在顶部
  const [isPinned, setIsPinned] = useState(false);
  const itinerarySectionRef = useRef<HTMLElement | null>(null);
  const itineraryListRef = useRef<HTMLDivElement | null>(null);
  
  // Navigation Scroll-Spy: 监听当前激活的导航项
  const [activeNav, setActiveNav] = useState<string>('overview');
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  
  // 如果context中找不到，尝试从API获取
  useEffect(() => {
    // 如果是 journey type slug，立即返回，不执行任何 API 调用
    // 使用更严格的检查，确保不会误判
    if (!slug) {
      console.log('[DynamicJourneyPage] No slug, skipping API call');
      return;
    }
    
    // 直接检查 slug 是否在 JOURNEY_TYPE_SLUGS 中（不依赖变量）
    const isTypeSlug = JOURNEY_TYPE_SLUGS.includes(slug as any);
    if (isTypeSlug) {
      console.log('[DynamicJourneyPage] Journey type slug detected, skipping API call:', slug, {
        slug,
        isTypeSlug,
        JOURNEY_TYPE_SLUGS: Array.from(JOURNEY_TYPE_SLUGS)
      });
      return; // 立即返回，不执行后续任何代码
    }
    
    console.log('[DynamicJourneyPage] Proceeding with API call for slug:', slug, {
      slug,
      isTypeSlug,
      JOURNEY_TYPE_SLUGS: Array.from(JOURNEY_TYPE_SLUGS)
    });
    
    const fetchJourneyBySlug = async () => {
      // 验证 slug 是否有效
      if (!slug || slug.trim() === '') {
        return;
      }
      
      // 再次检查是否是 journey type slug（双重保险，直接检查常量）
      if (JOURNEY_TYPE_SLUGS.includes(slug as any)) {
        console.log('[DynamicJourneyPage] Aborting API call - journey type slug detected:', slug);
        return;
      }
      
      // 如果还在加载context数据，等待一下
      if (journeysLoading) return;
      
      // 如果已经在context中找到，不需要API查询
      const foundInContext = journeys.find(j => j.slug === slug);
      if (foundInContext) return;
      
      // 最后一次检查是否是 journey type slug（三重保险）
      if (JOURNEY_TYPE_SLUGS.includes(slug as any)) {
        console.log('[DynamicJourneyPage] Final check - journey type slug, aborting:', slug);
        return;
      }
      
      // 如果已经查询过且结果为null，不需要重复查询
      // 添加 slug 验证，避免无效请求
      if (journeyFromApi === null && !isLoadingFromApi && journeys.length > 0 && slug && slug.length > 1) {
        // 最后一次检查（四重保险）
        if (JOURNEY_TYPE_SLUGS.includes(slug as any)) {
          console.log('[DynamicJourneyPage] Pre-fetch check - journey type slug, aborting:', slug);
          return;
        }
        
        setIsLoadingFromApi(true);
        try {
          // 创建超时控制器
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(`/api/journeys/slug/${encodeURIComponent(slug)}`, {
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          if (response.ok) {
            const data = await response.json();
            console.log('[API Response] Journey data from API:', {
              id: data.journey?.id,
              destinationCount: data.journey?.destinationCount,
              maxGuests: data.journey?.maxGuests,
              duration: data.journey?.duration,
              dataField: data.journey?.data,
              fullJourney: data.journey
            });
            setJourneyFromApi(data.journey);
          } else {
            setJourneyFromApi(null);
          }
        } catch (error) {
          // 如果是 AbortError，不记录错误
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error fetching journey by slug:', error);
          }
          setJourneyFromApi(null);
        } finally {
          setIsLoadingFromApi(false);
        }
      }
    };
    
    fetchJourneyBySlug();
  }, [slug, journeys, journeysLoading, journeyFromApi, isLoadingFromApi]);

  // 生成标准化的页面配置（必须在 Intersection Observer 之前定义）
  const pageConfig = useMemo(() => {
    if (!journey) return null;
    
    // 解析 duration 获取天数
    const days = parseInt((journey.duration || '').split(' ')[0]) || 1;
    
    // 获取 destinationCount（优先使用显式设置的值，否则回退到 itinerary 长度）
    const destinations = journey.destinationCount !== undefined && journey.destinationCount !== null
      ? journey.destinationCount
      : (journey.itinerary ? journey.itinerary.length : 1) || 1;
    
    // 获取 maxGuests（如果没有设置则为 0）
    const maxGuests = journey.maxGuests !== undefined && journey.maxGuests !== null
      ? journey.maxGuests
      : 0;
    
    // 调试日志 - 详细检查 journey 对象
    console.log('[pageConfig] Hero stats calculation:', {
      journeyId: journey.id,
      duration: journey.duration,
      days,
      destinationCount: journey.destinationCount,
      destinationCountType: typeof journey.destinationCount,
      destinations,
      maxGuests: journey.maxGuests,
      maxGuestsType: typeof journey.maxGuests,
      maxGuestsFinal: maxGuests,
      itineraryLength: journey.itinerary?.length,
      // 检查 journey 对象的所有属性
      journeyKeys: Object.keys(journey),
      // 检查 data 字段（如果存在）
      dataField: (journey as any).data,
      // 检查是否有 heroStats
      heroStats: journey.heroStats
    });
    
    // 额外检查：查看 journey 对象的完整结构
    console.log('[pageConfig] Full journey object:', journey);
    
    // 直接使用 journey 的页面内容，而不是模板生成
    return {
      // Hero区域 - 使用后台设置的内容
      hero: {
        // 优先使用后台 main image（image 字段），没有时再回退到 heroImage
        image: journey.image || journey.heroImage,
        title: journey.pageTitle || journey.title,
        stats: (() => {
          // 始终使用计算的值（基于最新的 destinationCount 和 maxGuests）
          // 这样可以确保后台修改的值能正确显示
          const calculatedStats = {
            days,
            destinations,
            maxGuests
          };
          console.log('[pageConfig] Using calculated stats (always):', calculatedStats);
          
          // 如果存在 heroStats，记录它但不使用（用于调试）
          if (journey.heroStats) {
            console.log('[pageConfig] Found existing heroStats (ignored):', journey.heroStats);
          }
          
          return calculatedStats;
        })()
      },

      // 导航 - 使用后台设置的导航
      navigation: journey.navigation || [
        { name: 'Overview', href: '#overview' },
        { name: 'Itinerary', href: '#itinerary' },
        ...(journey.accommodations && journey.accommodations.length > 0 
          ? [{ name: 'Stays', href: '#stays' }] 
          : []),
        { name: 'Details', href: '#details' }
      ],

      // 概述区域 - 使用后台设置的 overview 内容
      overview: {
        breadcrumb: journey.overview?.breadcrumb || [
          'Home', 'Journey', journey.category, journey.title
        ],
        description: journey.overview?.description || journey.description,
        highlights: journey.overview?.highlights || [],
        sideImage: journey.overview?.sideImage || journey.images?.[1] || journey.image,
        routeGeojson: journey.overview?.routeGeojson, // 从后台获取 GeoJSON 路径
        mapInitialBounds: journey.overview?.mapInitialBounds // 从后台获取地图初始边界
      },

      // 行程区域 - 使用后台设置的 itinerary
      itinerary: (journey.itinerary || []).map(day => ({
        ...day,
        image: day.image || journey.images?.[0] || journey.image
      })),

      // 体验区域 - 使用后台设置的 experiences（仅作为可选项清单）
      experiences: journey.experiences || [],

      // 住宿区域 - 使用后台设置的 accommodations
      accommodations: journey.accommodations || [],

      // 包含和排除项目
      includes: journey.includes || '',
      excludes: journey.excludes || '',

      // 包含和排除项目
      included: journey.included || [],
      excluded: journey.excluded || [],

      // 标准化 Inclusions 和 Offers
      standardInclusions: journey.standardInclusions,
      offers: journey.offers || [],

      // 相关推荐
      relatedTrips: journey.relatedTrips || []
    };
  }, [journey]);

  // Intersection Observer: 监听导航栏对应的各个 section（Scroll-Spy）
  useEffect(() => {
    if (!pageConfig || !pageConfig.navigation) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            if (sectionId) {
              setActiveNav(sectionId);
              console.log(`[Navigation] Active section changed to: ${sectionId}`);
            }
          }
        });
      },
      { 
        threshold: 0.3, // 当 section 的 30% 进入视口时触发
        rootMargin: "-100px 0px -50% 0px" // 考虑导航栏高度，优先显示在视口上方的 section
      }
    );

    // 观察所有导航对应的 section
    pageConfig.navigation.forEach((navItem) => {
      const sectionId = navItem.href.replace('#', '');
      const sectionElement = document.getElementById(sectionId);
      if (sectionElement) {
        sectionRefs.current.set(sectionId, sectionElement);
        observer.observe(sectionElement);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [pageConfig]);

  // Intersection Observer: 监听右侧所有的行程卡片
  useEffect(() => {
    if (!pageConfig || !pageConfig.itinerary || pageConfig.itinerary.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // 当卡片进入视口中间位置时触发
          if (entry.isIntersecting) {
            const day = parseInt(entry.target.getAttribute('data-day') || '1');
            setCurrentDay(day);
            setActiveDay(day);
            console.log(`[Itinerary] Current day changed to: ${day}`);
          }
        });
      },
      { 
        threshold: 0.6, 
        rootMargin: "-20% 0px -20% 0px" // 当元素在视口中央 60% 区域时触发
      }
    );

    // 观察所有带有 data-day 属性的卡片
    const cards = document.querySelectorAll('[data-day]');
    cards.forEach((card) => {
      observer.observe(card);
    });

    return () => {
      observer.disconnect();
    };
  }, [pageConfig]);

  // Intersection Observer: 检测 Itinerary Section 是否固定在顶部
  useEffect(() => {
    const section = itinerarySectionRef.current;
    if (!section) return;

    // 使用滚动监听器来检测 section 是否固定在顶部
    const handleScroll = () => {
      const rect = section.getBoundingClientRect();
      // 当 section 的 top 小于等于 0 时（考虑导航栏高度），说明它已经固定在顶部
      // 使用一个小的阈值来避免抖动
      const threshold = 1;
      const pinned = rect.top <= threshold;
      setIsPinned(pinned);
    };

    // 初始检查
    handleScroll();

    // 使用 requestAnimationFrame 来优化滚动性能
    let ticking = false;
    const optimizedHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // 监听滚动事件
    window.addEventListener('scroll', optimizedHandleScroll, { passive: true });
    window.addEventListener('resize', optimizedHandleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', optimizedHandleScroll);
      window.removeEventListener('resize', optimizedHandleScroll);
    };
  }, []);

  // 智能滚动传播：当右侧列表在顶部时，允许向上滚动传播到主页面
  useEffect(() => {
    const listElement = itineraryListRef.current;
    if (!listElement) return;

    // 处理鼠标滚轮事件
    const handleWheel = (e: WheelEvent) => {
      if (!isPinned) return; // 只在固定状态下处理

      const scrollTop = listElement.scrollTop;
      const scrollHeight = listElement.scrollHeight;
      const clientHeight = listElement.clientHeight;
      
      const isAtTop = scrollTop <= 1; // 使用小阈值避免边界问题
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 1;
      const isScrollingUp = e.deltaY < 0;
      const isScrollingDown = e.deltaY > 0;

      // 如果列表在顶部且用户向上滚动，让主页面处理滚动
      if (isAtTop && isScrollingUp) {
        // 手动滚动主页面
        window.scrollBy({
          top: -Math.abs(e.deltaY),
          behavior: 'auto'
        });
        return;
      }

      // 如果列表在底部且用户向下滚动，也让主页面处理滚动
      if (isAtBottom && isScrollingDown) {
        // 手动滚动主页面
        window.scrollBy({
          top: Math.abs(e.deltaY),
          behavior: 'auto'
        });
        return;
      }

      // 否则，正常处理列表内的滚动（不阻止默认行为）
    };

    // 处理触摸手势
    let touchStartY = 0;
    let touchStartScrollTop = 0;
    let lastTouchY = 0;
    let touchMoved = false;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
      lastTouchY = touchStartY;
      touchStartScrollTop = listElement.scrollTop;
      touchMoved = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPinned) return;

      const touchY = e.touches[0].clientY;
      const deltaY = lastTouchY - touchY; // 向上滑动时 deltaY 为正
      lastTouchY = touchY;
      
      const scrollTop = listElement.scrollTop;
      const scrollHeight = listElement.scrollHeight;
      const clientHeight = listElement.clientHeight;
      
      const isAtTop = scrollTop <= 1;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 1;
      const isScrollingUp = deltaY > 0; // 向上滑动时 deltaY 为正
      const isScrollingDown = deltaY < 0;

      // 如果列表在顶部且用户向上滑动，让主页面处理滚动
      if (isAtTop && isScrollingUp) {
        if (!touchMoved) {
          touchMoved = true;
        }
        // 手动滚动主页面
        window.scrollBy({
          top: -Math.abs(deltaY),
          behavior: 'auto'
        });
        return;
      }

      // 如果列表在底部且用户向下滑动，也让主页面处理滚动
      if (isAtBottom && isScrollingDown) {
        if (!touchMoved) {
          touchMoved = true;
        }
        // 手动滚动主页面
        window.scrollBy({
          top: Math.abs(deltaY),
          behavior: 'auto'
        });
        return;
      }
    };

    const handleTouchEnd = () => {
      touchMoved = false;
    };

    // 添加事件监听器
    listElement.addEventListener('wheel', handleWheel, { passive: true });
    listElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    listElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    listElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      listElement.removeEventListener('wheel', handleWheel);
      listElement.removeEventListener('touchstart', handleTouchStart);
      listElement.removeEventListener('touchmove', handleTouchMove);
      listElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPinned]);
  
  console.log('DynamicJourneyPage Debug:', {
    journeysLoading,
    journeysCount: journeys.length,
    experiencesCount: experiences.length,
    hotelsCount: hotels.length,
    slug,
    journeyFound: !!journey,
    journeyTitle: journey?.title,
    allSlugs: journeys.map(j => j.slug),
    localStorageJourneys: typeof window !== 'undefined' ? localStorage.getItem('journeys') : 'N/A'
  });

  // 获取相关的体验和住宿 - 基于availableExperiences和availableAccommodations
  const relatedExperiences = useMemo(() => {
    if (!journey || !journey.availableExperiences) return [];
    return experiences.filter(exp => 
      journey.availableExperiences.includes(exp.id) && exp.status === 'active'
    );
  }, [journey, experiences]);

  const relatedAccommodations = useMemo(() => {
    if (!journey) return [];
    // 优先使用accommodations，如果没有则使用availableAccommodations
    const accommodationIds = journey.accommodations && journey.accommodations.length > 0 
      ? journey.accommodations 
      : (journey.availableAccommodations || []);
    
    return hotels.filter(hotel => 
      accommodationIds.includes(hotel.id) && hotel.status === 'active'
    );
  }, [journey, hotels]);

  // 获取 Extensions 和 Hotels 完整数据
  useEffect(() => {
    const fetchExtensionsAndHotels = async () => {
      if (!journey) {
        setExtensionsData([]);
        setHotelsData([]);
        return;
      }

      // 获取 Extensions
      if (journey.extensions && journey.extensions.length > 0) {
        try {
          const extensionsPromises = journey.extensions.map(async (id) => {
            const res = await fetch(`/api/extensions/${id}`);
            if (res.ok) {
              const data = await res.json();
              return data.extension;
            }
            return null;
          });
          const extensions = await Promise.all(extensionsPromises);
          setExtensionsData(extensions.filter(Boolean));
        } catch (error) {
          console.error('Error fetching extensions:', error);
          setExtensionsData([]);
        }
      } else {
        setExtensionsData([]);
      }

      // 获取 Hotels
      if (journey.hotels && journey.hotels.length > 0) {
        try {
          const hotelsPromises = journey.hotels.map(async (id) => {
            const res = await fetch(`/api/journey-hotels/${id}`);
            if (res.ok) {
              const data = await res.json();
              return data.hotel;
            }
            return null;
          });
          const hotels = await Promise.all(hotelsPromises);
          setHotelsData(hotels.filter(Boolean));
        } catch (error) {
          console.error('Error fetching journey hotels:', error);
          setHotelsData([]);
        }
      } else {
        setHotelsData([]);
      }
    };

    fetchExtensionsAndHotels();
  }, [journey]);

  // =============== Select Your Date: 动态月历（未来一年） =================
  const today = useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = useState(0); // 相对当前月份的偏移，0..11
  const baseDate = useMemo(() => {
    const d = new Date(today);
    d.setMonth(d.getMonth() + monthOffset, 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [today, monthOffset]);

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const getMonthMatrix = (year: number, month: number) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const daysInMonth = last.getDate();
    const startWeekday = first.getDay();
    const blanks = Array.from({ length: startWeekday }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
    return [...blanks, ...days];
  };

  const monthMatrix = useMemo(() => getMonthMatrix(baseDate.getFullYear(), baseDate.getMonth()), [baseDate]);

  const isPastDate = (d: Date | null) => !d || d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isBeyondOneYear = (d: Date | null) => {
    if (!d) return false;
    const limit = new Date(today);
    limit.setFullYear(limit.getFullYear() + 1);
    return d > limit;
  };
  const isAvailable = (d: Date | null) => d && !isPastDate(d) && !isBeyondOneYear(d);

  // 悬浮可交互弹层状态（保持打开以便点击）
  const [activePopoverDate, setActivePopoverDate] = useState<Date | null>(null);
  const [guestAdults, setGuestAdults] = useState<number>(2);
  const [guestChildren, setGuestChildren] = useState<number>(0);
  const [confirmedDate, setConfirmedDate] = useState<Date | null>(null);
  const popoverTimer = useRef<number | null>(null);

  // 加入预订
  const { addJourney, addExperienceToJourney } = useCart();
  const handleAddToCart = () => {
    if (!journey) return;
    try {
      localStorage.setItem('last_selected_journey_slug', journey.slug);
    } catch {}
    addJourney({
      journeyId: journey.id,
      slug: journey.slug,
      title: journey.title,
      image: journey.image,
      basePrice: journey.price,
      travelers: { adults: 2, children: 0 },
    });
    router.push('/booking/cart');
  };

  // 直接预订：加入购物车后跳转到 Your Booking 页面
  const handleDirectBooking = () => {
    if (!journey) return;
    try {
      localStorage.setItem('last_selected_journey_slug', journey.slug);
    } catch {}
    const days = getDurationDays();
    const start = confirmedDate ? confirmedDate : new Date();
    const end = addDays(start, Math.max(0, days - 1));

    addJourney({
      journeyId: journey.id,
      slug: journey.slug,
      title: journey.title,
      image: journey.image,
      basePrice: journey.price,
      travelers: { adults: guestAdults, children: guestChildren },
      dates: confirmedDate ? { start: formatLocalYmd(start), end: formatLocalYmd(end) } : undefined,
    });
    router.push('/booking/cart');
  };

  // 如果找不到对应的旅行卡片，显示404（延迟判断，给API查询时间）
  useEffect(() => {
    // 只有在确认加载完成且确实找不到时才跳转404
    if (!journeysLoading && !isLoadingFromApi && journeys.length > 0 && !journey && journeyFromApi === null) {
      // 延迟一下，避免过快跳转
      const timer = setTimeout(() => {
        router.push('/404');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [journeys, journey, journeyFromApi, journeysLoading, isLoadingFromApi, router]);

  if (journeysLoading || isLoadingFromApi) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Text className="text-gray-600">Loading journey...</Text>
        </div>
      </div>
    );
  }

  if (!journey || !pageConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Text className="text-gray-600">Journey not found</Text>
        </div>
      </div>
    );
  }

  const openPopover = (d: Date | null) => {
    if (!d) return;
    if (popoverTimer.current) window.clearTimeout(popoverTimer.current);
    setActivePopoverDate(d);
  };
  const scheduleClosePopover = () => {
    if (popoverTimer.current) window.clearTimeout(popoverTimer.current);
    popoverTimer.current = window.setTimeout(() => setActivePopoverDate(null), 120);
  };

  const formatLocalYmd = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };
  const getDurationDays = (): number => {
    if (!journey?.duration) return 1;
    const match = journey.duration.match(/\d+/);
    const n = match ? parseInt(match[0], 10) : 1;
    return Math.max(1, n);
  };

  const submitBookingForDate = (d: Date) => {
    const checkIn = formatLocalYmd(d);
    const travelers = guestAdults + guestChildren;
    router.push(`/booking/${journey.slug}?checkIn=${encodeURIComponent(checkIn)}&adults=${guestAdults}&children=${guestChildren}&travelers=${travelers}`);
  };

  // 已移除酒店点击弹窗逻辑

  // 已移除酒店详情弹窗关闭逻辑

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner - 底部对齐布局 */}
      <section className={`relative ${JOURNEY_PAGE_TEMPLATE.hero.height} overflow-hidden`}>
        {/* 背景图片 */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: `url('${pageConfig.hero.image}')` }}
        />
        
        {/* 底部渐变遮罩 - 从透明到深绿色，增强文字可读性 */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-[#1e3b32]/90 via-[#1e3b32]/40 to-transparent z-0"
        />
        
        {/* 内容容器 - 底部对齐 */}
        <div className="relative z-10 flex items-end h-full pb-16 px-8 lg:px-16">
          <div className="w-full flex flex-col lg:flex-row justify-between items-end gap-8">
            {/* 左侧：标题区域 - 左下角 */}
            <div className="flex-1 max-w-2xl prose-force-wrap">
              <Heading 
                level={1} 
                className="text-4xl lg:text-5xl xl:text-6xl mb-4 tracking-tight leading-[1.1]"
                style={{ 
                  fontFamily: 'Playfair Display, serif',
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                  lineHeight: '1.1',
                  color: '#ffffff'
                }}
              >
                {pageConfig.hero.title}
              </Heading>
            </div>
            
            {/* 右侧：核心参数 - 右下角，用细线分割 */}
            {/* 桌面端：垂直排列，移动端：水平居中分布 */}
            <div className="flex flex-row lg:flex-row items-center lg:items-end justify-center lg:justify-end gap-6 lg:gap-8">
              {/* 天数 */}
              <div className="flex flex-col items-center lg:items-end">
                <div 
                  className="text-4xl lg:text-5xl font-light text-white mb-1"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {pageConfig.hero.stats.days}
                </div>
                <div className="text-xs uppercase tracking-widest text-white/80 font-light">
                  DAYS
                </div>
              </div>
              
              {/* 分割线 - 移动端隐藏，桌面端显示 */}
              <div className="hidden lg:block h-16 w-px bg-white/30" />
              
              {/* 目的地数量 */}
              <div className="flex flex-col items-center lg:items-end">
                <div 
                  className="text-4xl lg:text-5xl font-light text-white mb-1"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {pageConfig.hero.stats.destinations}
                </div>
                <div className="text-xs uppercase tracking-widest text-white/80 font-light">
                  DESTINATIONS
                </div>
              </div>
              
              {/* 分割线 - 移动端隐藏，桌面端显示 */}
              <div className="hidden lg:block h-16 w-px bg-white/30" />
              
              {/* 最大客人 */}
              <div className="flex flex-col items-center lg:items-end">
                <div 
                  className="text-4xl lg:text-5xl font-light text-white mb-1"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {pageConfig.hero.stats.maxGuests}
                </div>
                <div className="text-xs uppercase tracking-widest text-white/80 font-light">
                  GUESTS MAX
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Navigation - A&K 风格精致导航栏 */}
      <nav className="bg-tertiary py-4 sticky top-0 z-50 backdrop-blur-sm bg-tertiary/95">
        <Container size="xl">
          <div className="flex justify-center gap-12">
            {pageConfig.navigation.map((item) => {
              // 从 href 中提取 section ID（例如 #overview -> overview）
              const sectionId = item.href.replace('#', '');
              const isActive = activeNav === sectionId;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    relative pb-2 text-white hover:text-accent transition-colors 
                    font-medium tracking-widest uppercase text-sm
                    ${isActive ? 'text-white' : 'text-white/80'}
                  `}
                  onClick={(e) => {
                    e.preventDefault();
                    const targetId = item.href.replace('#', '');
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                      const offsetTop = targetElement.offsetTop - 80; // 考虑导航栏高度
                      window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                      });
                      setActiveNav(targetId);
                    }
                  }}
                >
                  {item.name}
                  {/* 下方横线动画指示器 - 从中间向两边展开 */}
                  <span
                    className={`
                      absolute bottom-0 left-1/2 w-full h-0.5 bg-white
                      transition-transform duration-300 ease-out origin-center
                    `}
                    style={{
                      transform: isActive 
                        ? 'translateX(-50%) scaleX(1)' 
                        : 'translateX(-50%) scaleX(0)'
                    }}
                  />
                </Link>
              );
            })}
          </div>
        </Container>
      </nav>

      {/* Journey Overview */}
      <section id="overview" className="w-full bg-[#FAF9F6] overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-10 py-24 flex flex-col lg:flex-row items-start justify-between gap-12">
          {/* 左侧内容 - 文字区域，设置最大宽度避免行太长 */}
          <div className="lg:w-[60%] flex flex-col w-full max-w-2xl">
            {/* 标题和描述 */}
            <div className="space-y-8 prose-force-wrap">
              <h2 
                className="text-2xl lg:text-3xl text-gray-900 leading-relaxed"
                style={{ 
                  fontFamily: 'Playfair Display, serif',
                  fontWeight: 400,
                  lineHeight: '1.6'
                }}
              >
                {pageConfig.overview.description}
              </h2>
              {journey.shortDescription && (
                <p 
                  className="text-xl text-gray-600 font-light leading-relaxed prose-force-wrap"
                  style={{ lineHeight: '1.6' }}
                >
                  {journey.shortDescription}
                </p>
              )}
            </div>

            {/* 特色亮点 - 两列 Grid 布局，统一使用十字星图标 */}
            {(() => {
              const highlights = pageConfig.overview?.highlights || [];
              
              if (highlights.length === 0) {
                return (
                  <div className="text-gray-500 text-sm mt-16">
                    No highlights available. Please add highlights in the admin panel.
                  </div>
                );
              }
              
              // 十字星图标 SVG - 1px 细线
              const StarIcon = () => (
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline-block mr-2"
                >
                  <path 
                    d="M8 0L9.5 5.5L15 7L9.5 8.5L8 14L6.5 8.5L1 7L6.5 5.5L8 0Z" 
                    stroke="currentColor" 
                    strokeWidth="1" 
                    fill="none"
                    className="text-gray-900"
                  />
                </svg>
              );
              
              return (
                <div className="grid grid-cols-2 gap-x-12 gap-y-10 mt-16">
                  {highlights.map((highlight, index) => {
                    // 优先使用title作为标题，description作为描述
                    const title = highlight.title || `Highlight ${index + 1}`;
                    const description = highlight.description || '';
                    
                    return (
                      <div key={index} className="space-y-2">
                        <h4 
                          className="text-xs tracking-widest font-bold text-gray-900 flex items-center uppercase prose-force-wrap"
                          style={{ letterSpacing: '0.1em' }}
                        >
                          <StarIcon />
                          {title}
                        </h4>
                        {description && (
                          <p className="text-sm text-gray-600 leading-normal prose-force-wrap">
                            {description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* 右侧图片 - 固定高度，与左侧文字区域高度匹配 */}
          <div className="lg:w-[40%] relative flex items-start">
            <div className="w-full h-[600px] lg:h-[700px] relative group">
              <img 
                src={pageConfig.overview.sideImage} 
                alt={journey.title || 'Journey image'}
                className="w-full h-full object-cover shadow-2xl transition-transform duration-1000 group-hover:scale-105"
              />
              {/* 遮罩层 */}
              <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors pointer-events-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Itinerary - 固定高度双栏布局：左侧 Mapbox 地图 + 右侧浅色卡片行程 */}
      <section 
        ref={(el) => {
          itinerarySectionRef.current = el;
        }}
        id="itinerary" 
        className="w-full bg-[#f5f1e6] h-[calc(100vh-80px)] flex flex-col lg:flex-row items-stretch overflow-hidden sticky top-0 z-10"
        style={{ 
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        {/* 左侧：地图容器 (40%) - 高度与父容器一致 */}
        <div className="w-full lg:w-[40%] h-[300px] lg:h-full relative" style={{ minHeight: '300px' }}>
          {journey && journeyLocations.length > 0 ? (
            <JourneyMap
              mode={isDayTour ? 'single-location' : 'multi-stop-route'}
              locations={journeyLocations}
              radius={5000}
              dayLocations={dayLocations}
              currentDay={currentDay}
              activeDay={activeDay}
              className="w-full h-full"
              routeGeoJsonPath={(() => {
                // 优先使用后台配置的 routeGeojson（如果存在且非空）
                if (pageConfig?.overview?.routeGeojson && pageConfig.overview.routeGeojson.trim() !== '') {
                  return pageConfig.overview.routeGeojson;
                }
                
                // 不再使用硬编码的 GeoJSON 路径，因为现在使用地理字典自动匹配坐标
                // 如果需要特定路线的 GeoJSON，请在后台配置 routeGeojson 字段
                
                return undefined;
              })()}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500">Loading map...</p>
            </div>
          )}
        </div>

        {/* 右侧：行程详情 (60%) - 固定高度内独立滚动 */}
        <div 
          ref={(el) => {
            itineraryListRef.current = el;
          }}
          className={`w-full lg:w-[60%] h-full bg-[#f5f1e6] py-12 px-6 lg:px-16 scrollbar-hide transition-all duration-200 ${
            isPinned ? 'overflow-y-auto' : 'overflow-y-hidden'
          }`}
          style={{
            overscrollBehavior: isPinned ? 'contain' : 'auto'
          }}
        >
          <div className="max-w-7xl mx-auto">
            <h2 className="text-gray-900 text-3xl mb-12" style={{ fontFamily: 'Montaga, serif', fontWeight: 400 }}>Daily Itinerary</h2>
          
          {pageConfig && pageConfig.itinerary && pageConfig.itinerary.map((day, index) => {
            const cityName = (day as any).city || 
                             (day as any).location || 
                             (journey?.city) || 
                             null;
            
            return (
              <div 
                key={index} 
                ref={(el) => {
                  if (el) {
                    dayRefs.current.set(day.day, el);
                  } else {
                    dayRefs.current.delete(day.day);
                  }
                }}
                data-day={day.day}
                className="itinerary-card bg-white text-gray-900 rounded-lg p-8 mb-10 shadow-sm border border-gray-100 transition-all hover:shadow-md flex flex-col md:flex-row gap-8 items-start"
              >
                {/* 左侧文字内容 */}
                <div className="flex-1 min-w-0">
                  {/* Day 标签 - 优化后的样式 */}
                  <span className="text-gray-500 font-medium text-xs tracking-widest uppercase block mb-3">
                    DAY {day.day}
                  </span>
                  
                  {/* 城市标签 - 橙棕色 Badge（如果有） */}
                  {cityName && (
                    <div className="mb-3">
                      <span 
                        className="inline-block px-3 py-1 text-xs font-semibold rounded-full"
                        style={{ 
                          backgroundColor: '#d4a574',
                          color: '#ffffff'
                        }}
                      >
                        {cityName}
                      </span>
                    </div>
                  )}

                  {/* 标题 - 使用 Montaga，与 hero banner 保持一致 */}
                  <h3 
                    className="text-3xl text-gray-900 mt-2 mb-6 leading-tight"
                    style={{ fontFamily: 'Montaga, serif', fontWeight: 400 }}
                  >
                    {day.title}
                  </h3>
                  
                  {/* 核心体验描述 - 只保留核心内容 */}
                  <p className="text-gray-700 leading-relaxed text-base mb-6 whitespace-pre-line">
                    {day.description}
                  </p>
                  
                  {/* 活动列表（如果有） */}
                  {(day as any).activities && Array.isArray((day as any).activities) && (day as any).activities.length > 0 && (
                    <div className="mt-6 space-y-2">
                      {(day as any).activities.map((activity: string, actIndex: number) => (
                        <div key={actIndex} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <p className="text-gray-700 text-sm">{activity}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 可折叠 Details 部分 - 用于技术细节 */}
                  {((day as any).meals || (day as any).accommodation || (day as any).transportation) && (
                    <DetailsAccordion
                      meals={(day as any).meals}
                      accommodation={(day as any).accommodation}
                      transportation={(day as any).transportation}
                    />
                  )}
                </div>
                
                {/* 右侧图片 - 优化后的尺寸和比例 */}
                {day.image && (
                  <div className="w-full md:w-[45%] flex-shrink-0">
                    <img 
                      src={day.image} 
                      alt={day.title || 'Itinerary image'} 
                      className="w-full aspect-[16/9] rounded-sm object-cover" 
                    />
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      </section>

      {/* Extensions Section - 条件渲染 */}
      {extensionsData.length > 0 && (
        <Extensions extensions={extensionsData} />
      )}

      {/* Hotels Section - 条件渲染 */}
      {hotelsData.length > 0 && (
        <Hotels hotels={hotelsData} />
      )}

      {/* Add Experiences */}
      {relatedExperiences.length > 0 && (
        <Section background="secondary" padding="xl">
          <Container size="xl">
            <Heading level={2} align="center" className="mb-4">
              ENHANCE YOUR JOURNEY WITH ADD-ON EXPERIENCES
            </Heading>
            <Text align="center" size="lg" className="mb-12 max-w-4xl mx-auto">
              Don&apos;t let any unforgettable moments pass you by—explore all the incredible add-on experiences available for your entire journey. Whether you&apos;re looking to revisit a missed adventure or want a convenient overview of every offering, this is your chance to ensure your trip is packed with every amazing experience possible.
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {relatedExperiences.map((experience) => (
                <ExperienceCard 
                  key={experience.id}
                  id={experience.id}
                  title={experience.title}
                  location={experience.location}
                  image={experience.image}
                  price={`From ¥${experience.price}`}
                  duration={experience.duration}
                  description={experience.shortDescription}
                />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Add Stay Options */}
      {relatedAccommodations.length > 0 && (
        <Section id="stays" background="tertiary" padding="xl">
          <Container size="xl">
            <Heading level={2} align="center" className="mb-4 text-white" style={{ color: '#ffffff' }}>
              YOUR STAY OPTIONS
            </Heading>
            <Text align="center" size="lg" className="mb-12 text-white max-w-4xl mx-auto" style={{ color: '#ffffff' }}>
              Hand Selected for an Unmatched Experience
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {relatedAccommodations.map((accommodation) => (
                <AccommodationCard 
                  key={accommodation.id} 
                  id={accommodation.id}
                  title={accommodation.name}
                  location={accommodation.location}
                  image={accommodation.images?.[0] || ''}
                  price="¥500/night"
                  description={accommodation.description}
                  variant="default"
                  showWishlist={true}
                />
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/accommodations">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-tertiary">
                  View More
                </Button>
              </Link>
            </div>
          </Container>
        </Section>
      )}

      {/* Inclusions & Offers Section - 新设计（包含 Select Your Date） */}
      <InclusionsAndOffers 
        journey={journey} 
        onBookingClick={(date) => {
          setConfirmedDate(date);
          setTimeout(() => {
            handleDirectBooking();
          }, 100);
        }}
      />

      {/* Related Trips */}
      {pageConfig.relatedTrips && pageConfig.relatedTrips.length > 0 && (
        <Section background="accent" padding="xl">
          <Container size="xl">
            <Heading level={2} align="center" className="mb-12">
              More {journey.region} Adventures
            </Heading>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pageConfig.relatedTrips.map((trip, index) => (
                <Link key={index} href={`/journeys/${trip.slug}`}>
                  <Card className="overflow-hidden p-0 hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                    <div
                      className="h-48 bg-center bg-cover bg-no-repeat"
                      style={{ backgroundImage: `url('${trip.image}')` }}
                    />
                    <div className="p-4 bg-white">
                      <Text className="font-medium mb-2 line-clamp-2 text-gray-900">
                        {trip.title}
                      </Text>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>{trip.duration}</span>
                        <span className="font-medium text-primary-600">{trip.price}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* 已移除酒店详情弹窗 */}
    </div>
  );
}
