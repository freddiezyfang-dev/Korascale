/**
 * 区域 ID 映射配置
 * 
 * 将页面中的区域 ID 映射到 GeoJSON feature.id
 * 用于匹配 sidebar 区域和地图上的行政区
 */

export interface RegionMapping {
  /** 页面中的区域 ID（用于 sidebar 和 URL） */
  pageId: string;
  /** GeoJSON 中的 feature.id（通常是省份 adcode） */
  geojsonIds: string[];
  /** 区域所属类别（用于页面过滤） */
  category: 'southwest' | 'northwest' | 'north' | 'south' | 'east-central';
  /** 区域显示名称 */
  name: string;
}

/**
 * 区域映射配置表
 * 
 * 注意：
 * - pageId 必须与 sidebar 中的 id 匹配
 * - geojsonIds 是数组，因为一个区域可能包含多个省份
 * - 如果 GeoJSON 中只有一个 feature，可以直接使用单个 ID
 */
export const REGION_MAPPING: RegionMapping[] = [
  // Southwest China
  {
    pageId: 'tibetan-plateau',
    geojsonIds: ['540000', '630000'],
    category: 'southwest',
    name: 'Tibetan Plateau & Kham Region',
  },
  {
    pageId: 'yunnan-guizhou-highlands',
    geojsonIds: ['530000', '520000'],
    category: 'southwest',
    name: 'Yunnan–Guizhou Highlands',
  },
  {
    pageId: 'sichuan-basin',
    geojsonIds: ['510000'],
    category: 'southwest',
    name: 'Sichuan Basin & Mountains',
  },
  {
    pageId: 'chongqing-gorges',
    geojsonIds: ['500000'],
    category: 'southwest',
    name: 'Chongqing & Three Gorges',
  },
  // Northwest China
  {
    pageId: 'silk-road-corridor',
    geojsonIds: ['620000', '640000'],
    category: 'northwest',
    name: 'Silk Road Corridor',
  },
  {
    pageId: 'qinghai-tibet-plateau',
    geojsonIds: ['630000', '540000'],
    category: 'northwest',
    name: 'Qinghai-Tibet Plateau',
  },
  {
    pageId: 'xinjiang-oases-deserts',
    geojsonIds: ['650000'],
    category: 'northwest',
    name: 'Xinjiang Oases & Deserts',
  },
  {
    pageId: 'xian',
    geojsonIds: ['610000'],
    category: 'northwest',
    name: 'Xi\'an',
  },
  // North China
  {
    pageId: 'inner-mongolian-grasslands',
    geojsonIds: ['150000'],
    category: 'north',
    name: 'Inner Mongolian Grasslands',
  },
  {
    pageId: 'beijing',
    geojsonIds: ['110000'],
    category: 'north',
    name: 'Beijing',
  },
  {
    pageId: 'loess-shanxi-heritage',
    geojsonIds: ['140000'],
    category: 'north',
    name: 'Loess & Shanxi Heritage',
  },
  {
    pageId: 'northeastern-forests',
    geojsonIds: ['230000', '220000', '210000'],
    category: 'north',
    name: 'Northeastern Forests',
  },
  // South China
  {
    pageId: 'canton',
    geojsonIds: ['440000'],
    category: 'south',
    name: 'Canton',
  },
  {
    pageId: 'zhangjiajie',
    geojsonIds: ['430000'],
    category: 'south',
    name: 'Zhangjiajie',
  },
  {
    pageId: 'guilin',
    geojsonIds: ['450000'],
    category: 'south',
    name: 'Guilin',
  },
  {
    pageId: 'hakka-fujian',
    geojsonIds: ['350000'],
    category: 'south',
    name: 'Hakka Fujian',
  },
  // East and Central China
  {
    pageId: 'wuhan',
    geojsonIds: ['420000'],
    category: 'east-central',
    name: 'Wuhan',
  },
  {
    pageId: 'shanghai',
    geojsonIds: ['310000'],
    category: 'east-central',
    name: 'Shanghai',
  },
  {
    pageId: 'hangzhou',
    geojsonIds: ['330000'],
    category: 'east-central',
    name: 'Hangzhou',
  },
  {
    pageId: 'water-towns',
    geojsonIds: ['320000'],
    category: 'east-central',
    name: 'Water Towns',
  },
  {
    pageId: 'yellow-mountain-southern-anhui',
    geojsonIds: ['340000'],
    category: 'east-central',
    name: 'Yellow Mountain & Southern Anhui',
  }
];

/**
 * 根据 pageId 查找映射配置
 */
export function getRegionMapping(pageId: string): RegionMapping | undefined {
  return REGION_MAPPING.find(mapping => mapping.pageId === pageId);
}

/**
 * 根据 geojsonId 查找对应的 pageId
 */
export function getPageIdByGeoJsonId(geojsonId: string): string | undefined {
  const mapping = REGION_MAPPING.find(m => m.geojsonIds.includes(geojsonId));
  return mapping?.pageId;
}

/**
 * 检查 geojsonId 是否属于某个区域
 */
export function isGeoJsonIdInRegion(geojsonId: string, pageId: string): boolean {
  const mapping = getRegionMapping(pageId);
  return mapping ? mapping.geojsonIds.includes(geojsonId) : false;
}

/**
 * 根据 category 获取所有区域映射
 */
export function getRegionsByCategory(category: RegionMapping['category']): RegionMapping[] {
  return REGION_MAPPING.filter(mapping => mapping.category === category);
}

/**
 * 获取所有可用的 category 列表
 */
export function getAllCategories(): RegionMapping['category'][] {
  const categories = new Set<RegionMapping['category']>();
  REGION_MAPPING.forEach(mapping => {
    categories.add(mapping.category);
  });
  return Array.from(categories);
}

/**
 * 根据 category 获取所有相关的 geojsonIds（去重）
 * 用于初始地图过滤，只显示该 category 的省份
 */
export function getCategoryIds(category: string): string[] {
  const ids = new Set<string>();
  REGION_MAPPING.forEach(mapping => {
    if (mapping.category === category) {
      // 确保所有 ID 都是字符串
      mapping.geojsonIds.forEach(id => ids.add(String(id)));
    }
  });
  return Array.from(ids);
}

/**
 * Sidebar 数据接口
 */
export interface SidebarRegionData {
  id: string;
  title: string;
  description: string;
  image: string;
}

/**
 * 子区域描述映射（用于 sidebar 显示）
 */
const REGION_DESCRIPTIONS: { [pageId: string]: { description: string; image: string } } = {
  // Southwest China
  'tibetan-plateau': {
    description: 'High-altitude landscapes, ancient monasteries, and the rich cultural heritage of Tibetan communities define this vast plateau region.',
    image: '/images/hero/place-hero/tibetan-plateau.jpg'
  },
  'yunnan-guizhou-highlands': {
    description: 'Terraced rice fields, karst mountains, and diverse ethnic minority cultures create a stunning mosaic across these highland provinces.',
    image: '/images/hero/place-hero/yunnna-guizhou.jpg'
  },
  'sichuan-basin': {
    description: 'From the fertile Chengdu Plain to the dramatic peaks of the Tibetan Plateau foothills, experience the contrast of basin and mountain landscapes.',
    image: '/images/hero/place-hero/sichuan-basin.jpg'
  },
  'chongqing-gorges': {
    description: 'The mighty Yangtze River carves through dramatic gorges, while the mountain city of Chongqing offers vibrant urban culture and spicy cuisine.',
    image: '/images/hero/place-hero/chongqing.jpg'
  },
  // Northwest China
  'silk-road-corridor': {
    description: 'Follow the ancient trade routes through Gansu and Ningxia, where history and culture converge along the legendary Silk Road.',
    image: '/images/hero/place-hero/Silk-road.jpg'
  },
  'qinghai-tibet-plateau': {
    description: 'Experience the high-altitude landscapes, pristine lakes, and rich Tibetan culture of the world\'s highest plateau.',
    image: '/images/hero/place-hero/qinghai.jpg'
  },
  'xinjiang-oases-deserts': {
    description: 'Explore the vast deserts, stunning oases, and rich Uyghur culture in China\'s largest province.',
    image: '/images/hero/place-hero/xinjiang.jpg'
  },
  'xian': {
    description: 'Discover the ancient capital where the Silk Road begins, home to the Terracotta Army and rich historical heritage.',
    image: '/images/hero/place-hero/xian.jpg'
  },
  // North China
  'inner-mongolian-grasslands': {
    description: 'Experience the vast grasslands, nomadic culture, and unique traditions of Inner Mongolia.',
    image: '/images/hero/place-hero/inner-mongolian.jpg'
  },
  'beijing': {
    description: 'Explore China\'s capital with its imperial palaces, ancient temples, and modern architecture.',
    image: '/images/hero/place-hero/beijing.jpg'
  },
  'loess-shanxi-heritage': {
    description: 'Discover ancient Buddhist caves, traditional architecture, and the unique loess plateau landscapes.',
    image: '/images/hero/place-hero/shanxi.jpg'
  },
  'northeastern-forests': {
    description: 'Explore the vast forests, rich natural resources, and unique culture of China\'s northeastern provinces.',
    image: '/images/hero/place-hero/northeast.jpg'
  },
  // South China
  'canton': {
    description: 'Explore the economic powerhouse of China, from bustling Guangzhou to the modern metropolis of Shenzhen, and savor authentic Cantonese cuisine.',
    image: '/images/hero/place-hero/canton.jpg'
  },
  'zhangjiajie': {
    description: 'Marvel at the stunning sandstone pillars, deep ravines, and breathtaking natural beauty that inspired the movie Avatar.',
    image: '/images/hero/place-hero/zhangjiajie.jpg'
  },
  'guilin': {
    description: 'Experience the iconic karst landscapes, serene Li River, and the picturesque countryside of Guangxi.',
    image: '/images/hero/place-hero/guilin.jpg'
  },
  'hakka-fujian': {
    description: 'Discover the unique Hakka architecture, traditional tulou buildings, tea culture, and coastal cities of Fujian.',
    image: '/images/hero/place-hero/fujian.jpg'
  },
  // East and Central China
  'wuhan': {
    description: 'Explore the central hub of China, where the Yangtze and Han rivers meet, rich in history and modern development.',
    image: '/images/hero/place-hero/wuhan.jpg'
  },
  'shanghai': {
    description: 'Experience the economic and cultural hub of modern China, from the Bund to the futuristic skyline.',
    image: '/images/hero/place-hero/shanghai.jpg'
  },
  'hangzhou': {
    description: 'Discover the beautiful West Lake, ancient temples, tea plantations, and the birthplace of Chinese e-commerce.',
    image: '/images/hero/place-hero/hangzhou.jpg'
  },
  'water-towns': {
    description: 'Step back in time in the charming ancient water towns of Jiangsu and Zhejiang, where canals and bridges create picturesque scenes.',
    image: '/images/hero/place-hero/watertown.jpg'
  },
  'yellow-mountain-southern-anhui': {
    description: 'Visit the iconic Yellow Mountain, ancient villages, traditional architecture, and stunning mountain scenery of southern Anhui.',
    image: '/images/hero/place-hero/yellow-mountain-southern-anhui.jpg'
  }
};

/**
 * 根据 category 获取 sidebar 数据
 * 从 REGION_MAPPING 动态生成，确保数据一致性
 */
export function getSidebarDataByCategory(category: RegionMapping['category']): SidebarRegionData[] {
  const regions = getRegionsByCategory(category);
  
  return regions.map(mapping => {
    const extraData = REGION_DESCRIPTIONS[mapping.pageId] || {
      description: `Explore ${mapping.name} and discover its unique attractions and cultural heritage.`,
      image: '/images/journey-cards/chengdu-deep-dive.jpeg' // 默认图片
    };

    return {
      id: mapping.pageId,
      title: mapping.name,
      description: extraData.description,
      image: extraData.image
    };
  });
}





