'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { useExperienceManagement } from '@/context/ExperienceManagementContext';
import {
  SplitHeroBanner,
  RecommendedJourneySection,
  ExperienceCardsGrid,
  JourneyFilterSidebar
} from '@/components/place';
import { getRegionMapping } from '@/lib/regionMapping';

// 根据 regionCategory 获取对应的 region 名称和 URL
const getRegionInfo = (category: string): { name: string; slug: string } => {
  const regionMap: { [key: string]: { name: string; slug: string } } = {
    'southwest': { name: 'Southwest China', slug: 'southwest-china' },
    'northwest': { name: 'Northwest & Northern Frontier', slug: 'northwest' },
    'north': { name: 'North China', slug: 'north' },
    'south': { name: 'South China', slug: 'south' },
    'east-central': { name: 'East & Central China', slug: 'east-central' }
  };
  return regionMap[category] || { name: 'Destinations', slug: 'destinations' };
};

// Place 元数据映射 - 用于获取页面信息
const placeMetadata: { [key: string]: {
  name: string;
  image: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  title: string;
  content: string[];
  regionCategory?: string;
} } = {
  // Southwest China
  'tibetan-plateau': {
    name: 'Tibetan Plateau & Kham Region',
    image: '/images/hero/place-hero/tibetan-plateau.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'Southwest China', href: '/destinations/southwest-china#tibetan-plateau' },
      { label: 'Tibetan Plateau & Kham Region' }
    ],
    title: 'Tibetan Plateau & Kham Region',
    content: [
      'Tibet, often called the "Roof of the World," is a land of breathtaking landscapes, ancient monasteries, and profound spiritual traditions. From the sacred Potala Palace in Lhasa to the pristine lakes of Namtso, Tibet offers an unparalleled journey into one of the world\'s most mystical regions.',
      'Our carefully curated journeys take you beyond the tourist trails, connecting you with local communities, Buddhist monks, and the timeless traditions that have shaped this extraordinary land for centuries.',
      'Whether you seek spiritual enlightenment, adventure in the high Himalayas, or simply the chance to witness some of the planet\'s most stunning natural beauty, Tibet promises an experience that will transform your understanding of the world.'
    ],
    regionCategory: 'southwest'
  },
  'yunnan-guizhou-highlands': {
    name: 'Yunnan–Guizhou Highlands',
    image: '/images/hero/place-hero/yunnna-guizhou.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'Southwest China', href: '/destinations/southwest-china#yunnan-guizhou-highlands' },
      { label: 'Yunnan–Guizhou Highlands' }
    ],
    title: 'Yunnan–Guizhou Highlands',
    content: [
      'Terraced rice fields, karst mountains, and diverse ethnic minority cultures create a stunning mosaic across these highland provinces.',
      'Experience the unique traditions of Yunnan and Guizhou, from the ancient tea-horse trading routes to the vibrant festivals of local communities.',
      'Discover hidden villages, explore dramatic landscapes, and immerse yourself in the rich cultural heritage that makes this region one of China\'s most fascinating destinations.'
    ],
    regionCategory: 'southwest'
  },
  'sichuan-basin': {
    name: 'Sichuan Basin & Mountains',
    image: '/images/hero/place-hero/sichuan-basin.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'Southwest China', href: '/destinations/southwest-china#sichuan-basin' },
      { label: 'Sichuan Basin & Mountains' }
    ],
    title: 'Sichuan Basin & Mountains',
    content: [
      'From the fertile Chengdu Plain to the dramatic peaks of the Tibetan Plateau foothills, experience the contrast of basin and mountain landscapes.',
      'Sichuan offers a perfect blend of natural beauty, cultural heritage, and world-renowned cuisine. Explore ancient irrigation systems, visit giant pandas, and discover the spiritual significance of sacred mountains.',
      'Whether you\'re seeking adventure in the highlands or cultural immersion in bustling cities, Sichuan promises unforgettable experiences at every turn.'
    ],
    regionCategory: 'southwest'
  },
  'chongqing-gorges': {
    name: 'Chongqing & Three Gorges',
    image: '/images/hero/place-hero/chongqing.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'Southwest China', href: '/destinations/southwest-china#chongqing-gorges' },
      { label: 'Chongqing & Three Gorges' }
    ],
    title: 'Chongqing & Three Gorges',
    content: [
      'The mighty Yangtze River carves through dramatic gorges, while the mountain city of Chongqing offers vibrant urban culture and spicy cuisine.',
      'Experience the breathtaking beauty of the Three Gorges, explore the unique architecture of this 8D city, and discover the rich history that flows along China\'s longest river.',
      'From ancient temples to modern skyscrapers, from tranquil river cruises to bustling night markets, Chongqing and the Three Gorges region offers a journey through time and culture.'
    ],
    regionCategory: 'southwest'
  },
  // Northwest China
  'silk-road-corridor': {
    name: 'Silk Road Corridor',
    image: '/images/hero/place-hero/Silk-road.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'Northwest & Northern Frontier', href: '/destinations/northwest#silk-road-corridor' },
      { label: 'Silk Road Corridor' }
    ],
    title: 'Silk Road Corridor',
    content: [
      'Follow the ancient trade routes through Gansu and Ningxia, where history and culture converge along the legendary Silk Road.',
      'Discover the remnants of ancient civilizations, explore stunning desert landscapes, and experience the cultural exchange that shaped the world for centuries.',
      'From the colorful Danxia landforms to ancient Buddhist caves, the Silk Road Corridor offers a journey through history, culture, and breathtaking natural beauty.'
    ],
    regionCategory: 'northwest'
  },
  'qinghai-tibet-plateau': {
    name: 'Qinghai–Tibet Plateau',
    image: '/images/hero/place-hero/qinghai.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'Northwest & Northern Frontier', href: '/destinations/northwest#qinghai-tibet-plateau' },
      { label: 'Qinghai–Tibet Plateau' }
    ],
    title: 'Qinghai–Tibet Plateau',
    content: [
      'Experience the high-altitude landscapes, pristine lakes, and rich Tibetan culture of the world\'s highest plateau.',
      'From the crystal-clear waters of Qinghai Lake to the sacred mountains and monasteries, this region offers an unparalleled journey into one of the world\'s most unique environments.',
      'Discover the traditions of nomadic herders, witness stunning natural phenomena, and immerse yourself in the spiritual heritage that has flourished in this challenging yet beautiful landscape.'
    ],
    regionCategory: 'northwest'
  },
  'xinjiang-oases-deserts': {
    name: 'Xinjiang Oases & Deserts',
    image: '/images/hero/place-hero/xinjiang.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'Northwest & Northern Frontier', href: '/destinations/northwest#xinjiang-oases-deserts' },
      { label: 'Xinjiang Oases & Deserts' }
    ],
    title: 'Xinjiang Oases & Deserts',
    content: [
      'Explore the vast deserts, stunning oases, and rich Uyghur culture in China\'s largest province.',
      'From the ancient cities along the Silk Road to the breathtaking natural wonders of the Taklamakan Desert, Xinjiang offers a journey through diverse landscapes and cultures.',
      'Experience the unique traditions of Central Asian peoples, sample delicious regional cuisine, and discover the natural beauty that makes Xinjiang one of China\'s most fascinating destinations.'
    ],
    regionCategory: 'northwest'
  },
  'xian': {
    name: 'Xi\'an',
    image: '/images/hero/place-hero/xian.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'Northwest & Northern Frontier', href: '/destinations/northwest#xian' },
      { label: 'Xi\'an' }
    ],
    title: 'Xi\'an',
    content: [
      'Discover the ancient capital where the Silk Road begins, home to the Terracotta Army and rich historical heritage.',
      'Xi\'an served as the capital for 13 dynasties and remains one of China\'s most historically significant cities. Explore ancient city walls, visit imperial tombs, and walk in the footsteps of emperors.',
      'From the world-famous Terracotta Warriors to ancient pagodas and bustling Muslim Quarter, Xi\'an offers a perfect blend of history, culture, and modern Chinese life.'
    ],
    regionCategory: 'northwest'
  },
  // North China
  'inner-mongolian-grasslands': {
    name: 'Inner Mongolian Grasslands',
    image: '/images/hero/place-hero/inner-mongolian.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'North China', href: '/destinations/north#inner-mongolian-grasslands' },
      { label: 'Inner Mongolian Grasslands' }
    ],
    title: 'Inner Mongolian Grasslands',
    content: [
      'Experience the vast grasslands, nomadic culture, and unique traditions of Inner Mongolia.',
      'From the endless steppes to traditional yurts, discover the lifestyle of Mongolian herders and experience the freedom of the open grasslands.',
      'Participate in traditional festivals, enjoy authentic Mongolian cuisine, and witness the stunning natural beauty that has shaped this unique culture for centuries.'
    ],
    regionCategory: 'north'
  },
  'beijing': {
    name: 'Beijing',
    image: '/images/hero/place-hero/beijing.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'North China', href: '/destinations/north#beijing' },
      { label: 'Beijing' }
    ],
    title: 'Beijing',
    content: [
      'Explore China\'s capital with its imperial palaces, ancient temples, and modern architecture.',
      'From the Forbidden City to the Great Wall, Beijing offers a journey through China\'s imperial past and dynamic present.',
      'Discover world-renowned landmarks, experience traditional hutong culture, and witness the perfect blend of ancient traditions and modern innovation that defines this remarkable city.'
    ],
    regionCategory: 'north'
  },
  'loess-shanxi-heritage': {
    name: 'Loess & Shanxi Heritage',
    image: '/images/hero/place-hero/shanxi.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'North China', href: '/destinations/north#loess-shanxi-heritage' },
      { label: 'Loess & Shanxi Heritage' }
    ],
    title: 'Loess & Shanxi Heritage',
    content: [
      'Discover ancient Buddhist caves, traditional architecture, and the unique loess plateau landscapes.',
      'Shanxi is home to some of China\'s most important historical sites, from ancient cave temples to well-preserved traditional architecture.',
      'Explore the unique loess plateau terrain, visit ancient monasteries, and discover the rich cultural heritage that has been preserved in this remarkable region for over a thousand years.'
    ],
    regionCategory: 'north'
  },
  'northeastern-forests': {
    name: 'Northeastern Forests',
    image: '/images/hero/place-hero/northeast.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'North China', href: '/destinations/north#northeastern-forests' },
      { label: 'Northeastern Forests' }
    ],
    title: 'Northeastern Forests',
    content: [
      'Explore the vast forests, rich natural resources, and unique culture of China\'s northeastern provinces.',
      'From the dense forests of Heilongjiang to the industrial heritage of Liaoning, discover the diverse landscapes and cultures of China\'s northeast.',
      'Experience the unique traditions of the region, enjoy seasonal natural beauty, and learn about the important role this area has played in China\'s modern development.'
    ],
    regionCategory: 'north'
  },
  // South China
  'canton': {
    name: 'Canton',
    image: '/images/hero/place-hero/canton.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'South China', href: '/destinations/south#canton' },
      { label: 'Canton' }
    ],
    title: 'Canton',
    content: [
      'Explore the economic powerhouse of China, from bustling Guangzhou to the modern metropolis of Shenzhen, and savor authentic Cantonese cuisine.',
      'Guangdong Province offers a perfect blend of traditional culture and cutting-edge innovation, from ancient temples to futuristic skylines.',
      'Experience the vibrant food scene, explore historic sites, and witness the dynamic energy that has made this region one of the world\'s most important economic centers.'
    ],
    regionCategory: 'south'
  },
  'zhangjiajie': {
    name: 'Zhangjiajie',
    image: '/images/hero/place-hero/zhangjiajie.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'South China', href: '/destinations/south#zhangjiajie' },
      { label: 'Zhangjiajie' }
    ],
    title: 'Zhangjiajie',
    content: [
      'Marvel at the stunning sandstone pillars, deep ravines, and breathtaking natural beauty that inspired the movie Avatar.',
      'Zhangjiajie National Forest Park is home to some of the world\'s most unique geological formations, with towering sandstone pillars rising from misty valleys.',
      'Explore glass walkways suspended over deep gorges, ride cable cars through the clouds, and discover the natural wonders that have captivated visitors for generations.'
    ],
    regionCategory: 'south'
  },
  'guilin': {
    name: 'Guilin',
    image: '/images/hero/place-hero/guilin.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'South China', href: '/destinations/south#guilin' },
      { label: 'Guilin' }
    ],
    title: 'Guilin',
    content: [
      'Experience the iconic karst landscapes, serene Li River, and the picturesque countryside of Guangxi.',
      'Guilin\'s dramatic limestone peaks and winding rivers have inspired poets and artists for centuries, creating one of China\'s most recognizable landscapes.',
      'Cruise along the Li River, explore ancient villages, and immerse yourself in the natural beauty that has made Guilin one of China\'s most beloved destinations.'
    ],
    regionCategory: 'south'
  },
  'hakka-fujian': {
    name: 'Hakka Fujian',
    image: '/images/hero/place-hero/fujian.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'South China', href: '/destinations/south#hakka-fujian' },
      { label: 'Hakka Fujian' }
    ],
    title: 'Hakka Fujian',
    content: [
      'Discover the unique Hakka architecture, traditional tulou buildings, tea culture, and coastal cities of Fujian.',
      'Fujian is home to the remarkable Hakka tulou, circular earthen buildings that represent a unique architectural tradition and way of life.',
      'Explore ancient tea plantations, visit traditional villages, and discover the rich cultural heritage of the Hakka people, while also experiencing the modern coastal cities that showcase Fujian\'s dynamic present.'
    ],
    regionCategory: 'south'
  },
  // East and Central China
  'wuhan': {
    name: 'Wuhan',
    image: '/images/hero/place-hero/wuhan.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'East & Central China', href: '/destinations/east-central#wuhan' },
      { label: 'Wuhan' }
    ],
    title: 'Wuhan',
    content: [
      'Explore the central hub of China, where the Yangtze and Han rivers meet, rich in history and modern development.',
      'Wuhan, the capital of Hubei Province, is a major transportation hub and cultural center, offering a blend of historical sites and modern innovation.',
      'Discover ancient temples, explore vibrant neighborhoods, and experience the unique character of this important central Chinese city that bridges tradition and modernity.'
    ],
    regionCategory: 'east-central'
  },
  'shanghai': {
    name: 'Shanghai',
    image: '/images/hero/place-hero/shanghai.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'East & Central China', href: '/destinations/east-central#shanghai' },
      { label: 'Shanghai' }
    ],
    title: 'Shanghai',
    content: [
      'Experience the economic and cultural hub of modern China, from the Bund to the futuristic skyline.',
      'Shanghai represents the dynamic energy of modern China, with its iconic skyline, historic colonial architecture, and cutting-edge innovation.',
      'Explore the famous Bund, visit world-class museums, experience the vibrant food scene, and witness the perfect blend of East and West that defines this remarkable metropolis.'
    ],
    regionCategory: 'east-central'
  },
  'hangzhou': {
    name: 'Hangzhou',
    image: '/images/hero/place-hero/hangzhou.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'East & Central China', href: '/destinations/east-central#hangzhou' },
      { label: 'Hangzhou' }
    ],
    title: 'Hangzhou',
    content: [
      'Discover the beautiful West Lake, ancient temples, tea plantations, and the birthplace of Chinese e-commerce.',
      'Hangzhou has been celebrated for its natural beauty for over a thousand years, with West Lake inspiring countless poets and artists.',
      'Experience the tranquility of ancient temples, visit world-famous tea plantations, and discover how this historic city has become a center of modern innovation while preserving its timeless charm.'
    ],
    regionCategory: 'east-central'
  },
  'water-towns': {
    name: 'Water Towns',
    image: '/images/hero/place-hero/watertown.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'East & Central China', href: '/destinations/east-central#water-towns' },
      { label: 'Water Towns' }
    ],
    title: 'Water Towns',
    content: [
      'Step back in time in the charming ancient water towns of Jiangsu and Zhejiang, where canals and bridges create picturesque scenes.',
      'These historic towns preserve the traditional architecture and way of life of ancient China, with stone bridges, wooden houses, and winding canals.',
      'Explore narrow alleys, take boat rides through the canals, and experience the peaceful atmosphere of these well-preserved gems that offer a glimpse into China\'s past.'
    ],
    regionCategory: 'east-central'
  },
  'yellow-mountain-southern-anhui': {
    name: 'Yellow Mountain & Southern Anhui',
    image: '/images/hero/place-hero/yellow-mountain-southern-anhui.jpg',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Destinations', href: '/destinations' },
      { label: 'East & Central China', href: '/destinations/east-central#yellow-mountain-southern-anhui' },
      { label: 'Yellow Mountain & Southern Anhui' }
    ],
    title: 'Yellow Mountain & Southern Anhui',
    content: [
      'Visit the iconic Yellow Mountain, ancient villages, traditional architecture, and stunning mountain scenery of southern Anhui.',
      'Huangshan (Yellow Mountain) is one of China\'s most famous mountains, renowned for its dramatic peaks, ancient pine trees, and sea of clouds.',
      'Explore traditional Huizhou architecture in ancient villages, experience the rich cultural heritage of the region, and discover the natural and cultural treasures that have made this area a UNESCO World Heritage site.'
    ],
    regionCategory: 'east-central'
  }
};

// Place slug 到 Place 名称的映射
const placeSlugToName: { [key: string]: string } = {
  'tibetan-plateau': 'Tibetan Plateau & Kham Region',
  'yunnan-guizhou-highlands': 'Yunnan–Guizhou Highlands',
  'sichuan-basin': 'Sichuan Basin & Mountains',
  'chongqing-gorges': 'Chongqing & Three Gorges',
  'silk-road-corridor': 'Silk Road Corridor',
  'qinghai-tibet-plateau': 'Qinghai–Tibet Plateau',
  'xinjiang-oases-deserts': 'Xinjiang Oases & Deserts',
  'xian': 'Xi\'an',
  'inner-mongolian-grasslands': 'Inner Mongolian Grasslands',
  'beijing': 'Beijing',
  'loess-shanxi-heritage': 'Loess & Shanxi Heritage',
  'northeastern-forests': 'Northeastern Forests',
  'canton': 'Canton',
  'zhangjiajie': 'Zhangjiajie',
  'guilin': 'Guilin',
  'hakka-fujian': 'Hakka Fujian',
  'wuhan': 'Wuhan',
  'shanghai': 'Shanghai',
  'hangzhou': 'Hangzhou',
  'water-towns': 'Water Towns',
  'yellow-mountain-southern-anhui': 'Yellow Mountain & Southern Anhui'
};

export default function PlacePage() {
  const params = useParams();
  const placeSlug = params.place as string;
  const { journeys, isLoading: journeysLoading } = useJourneyManagement();
  const { experiences, isLoading: experiencesLoading } = useExperienceManagement();

  // 获取 place 元数据
  const placeMeta = placeMetadata[placeSlug];
  const placeName = placeSlugToName[placeSlug] || placeMeta?.name || placeSlug;

  // 从数据库过滤 journeys - 根据 place 字段匹配
  const currentPlaceJourneys = useMemo(() => {
    if (!journeys || journeys.length === 0) return [];
    return journeys.filter(journey => {
      // 匹配 place 字段（精确匹配或包含）
      if (journey.place) {
        return journey.place === placeName || journey.place.includes(placeName);
      }
      return false;
    });
  }, [journeys, placeName]);

  // 从数据库过滤 experiences - 根据 region 或 location 匹配
  const currentPlaceExperiences = useMemo(() => {
    if (!experiences || experiences.length === 0) return [];
    return experiences.filter(experience => {
      // 可以根据 region, location, 或 city 匹配
      const regionMapping = getRegionMapping(placeSlug);
      if (regionMapping) {
        // 如果 place 有对应的 region mapping，可以根据 region 匹配
        return experience.region?.toLowerCase().includes(regionMapping.category) ||
               experience.location?.toLowerCase().includes(placeName.toLowerCase()) ||
               experience.city?.toLowerCase().includes(placeName.toLowerCase());
      }
      return experience.location?.toLowerCase().includes(placeName.toLowerCase()) ||
             experience.city?.toLowerCase().includes(placeName.toLowerCase());
    });
  }, [experiences, placeName, placeSlug]);

  // 如果没有找到 place 元数据，显示 Not Found
  if (!placeMeta) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <h1 
            className="text-4xl md:text-5xl font-serif mb-4" 
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            Place Not Found
          </h1>
          <p 
            className="text-gray-600 font-sans text-lg" 
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            The place "{placeSlug}" does not exist.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Component A: Split Hero Banner */}
      <SplitHeroBanner
        image={placeMeta.image}
        breadcrumbs={placeMeta.breadcrumbs}
        title={placeMeta.title}
        content={placeMeta.content}
        viewJourneysHref="#journeys"
      />

      {/* Component B: Recommended Journey Section */}
      <div id="journeys">
        <RecommendedJourneySection
          journeys={currentPlaceJourneys}
          placeName={placeMeta.name}
          isLoading={journeysLoading}
        />
      </div>

      {/* Component C: Experience Cards Grid */}
      <ExperienceCardsGrid
        experiences={currentPlaceExperiences}
        placeName={placeMeta.name}
        isLoading={experiencesLoading}
      />

      {/* Journey Filter Sidebar below Experience Cards */}
      <div id="journey-filter">
        <JourneyFilterSidebar
          journeys={journeys}
          placeName={placeMeta.name}
          autoSelectPlace={placeName}
        />
      </div>
    </main>
  );
}
