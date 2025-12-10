import { Journey } from '@/types';

/**
 * 生成旅行卡片的slug
 * 将标题转换为URL友好的格式
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-') // 将空格替换为连字符
    .replace(/-+/g, '-') // 将多个连字符合并为一个
    .trim();
}

/**
 * 生成页面标题
 * 基于旅行卡片标题生成SEO友好的页面标题
 */
export function generatePageTitle(title: string): string {
  return `${title} | Korascale Travel`;
}

/**
 * 生成meta描述
 * 基于旅行卡片描述生成SEO友好的meta描述
 */
export function generateMetaDescription(description: string, maxLength: number = 160): string {
  if (!description) {
    return '';
  }
  if (description.length <= maxLength) {
    return description;
  }
  
  // 在最后一个完整句子处截断
  const truncated = description.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?')
  );
  
  if (lastSentenceEnd > maxLength * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  return truncated + '...';
}

/**
 * 生成英雄统计数据
 * 基于旅行卡片信息生成英雄区域的统计数据
 */
export function generateHeroStats(journey: Journey) {
  const days = journey.duration ? parseInt(journey.duration.split(' ')[0]) || 1 : 1;
  const destinations = (journey.itinerary && Array.isArray(journey.itinerary)) ? journey.itinerary.length : 1;
  // 优先使用 maxGuests，如果没有则使用 maxParticipants
  const maxGuests = journey.maxGuests || journey.maxParticipants || 12;
  
  return {
    days,
    destinations,
    maxGuests
  };
}

/**
 * 生成导航菜单
 * 基于旅行卡片内容生成页面导航
 */
export function generateNavigation(journey: Journey) {
  const navigation = [
    { name: 'Overview', href: '#overview' },
    { name: 'Itinerary', href: '#itinerary' }
  ];
  
  if (journey.accommodations && journey.accommodations.length > 0) {
    navigation.push({ name: 'Stays', href: '#stays' });
  }
  
  navigation.push({ name: 'Details', href: '#details' });
  
  return navigation;
}

/**
 * 生成面包屑导航
 * 基于旅行卡片信息生成面包屑导航
 */
export function generateBreadcrumb(journey: Journey) {
  return [
    'Home',
    'Journey',
    journey.category || 'Journey',
    journey.title || ''
  ];
}

/**
 * 生成概述亮点
 * 基于旅行卡片亮点生成概述区域的亮点列表
 */
export function generateOverviewHighlights(journey: Journey) {
  // 如果 journey.overview?.highlights 已存在，直接返回（保持用户输入的内容）
  if (journey.overview?.highlights && Array.isArray(journey.overview.highlights) && journey.overview.highlights.length > 0) {
    return journey.overview.highlights;
  }
  
  // 如果没有 highlights 或为空，返回空数组
  if (!journey.highlights || !Array.isArray(journey.highlights) || journey.highlights.length === 0) {
    return [];
  }
  
  const iconMap: { [key: string]: string } = {
    'panda': '🐼',
    'food': '🥢',
    'culture': '🎭',
    'hot pot': '🍲',
    'cooking': '👨‍🍳',
    'buddha': '🙏',
    'nature': '🌿',
    'mountain': '⛰️',
    'lake': '🏞️',
    'city': '🏙️',
    'temple': '🏛️',
    'adventure': '🎯'
  };
  
  return journey.highlights.map(highlight => {
    const lowerHighlight = highlight.toLowerCase();
    let icon = '⭐'; // 默认图标
    
    // 根据关键词匹配图标
    for (const [keyword, emoji] of Object.entries(iconMap)) {
      if (lowerHighlight.includes(keyword)) {
        icon = emoji;
        break;
      }
    }
    
    return {
      icon,
      title: highlight,
      description: `Experience ${highlight.toLowerCase()} during your journey.`
    };
  });
}

/**
 * 生成包含项目
 * 基于旅行卡片包含/排除信息生成包含项目列表
 */
export function generateInclusions(journey: Journey) {
  const inclusions = [];
  const included = journey.included || []; // 安全检查，确保 included 是数组
  
  // 检查是否包含交通
  if (included.some(item => 
    item.toLowerCase().includes('transport') || 
    item.toLowerCase().includes('bus') ||
    item.toLowerCase().includes('vehicle')
  )) {
    inclusions.push({
      icon: 'Car',
      title: 'Transportation',
      description: 'Transportation throughout your journey as specified in the itinerary.'
    });
  }
  
  // 检查是否包含住宿
  if (included.some(item => 
    item.toLowerCase().includes('accommodation') || 
    item.toLowerCase().includes('hotel')
  )) {
    inclusions.push({
      icon: 'Bed',
      title: 'Accommodation',
      description: 'Comfortable accommodation as specified in the itinerary.'
    });
  } else {
    inclusions.push({
      icon: 'Bed',
      title: 'Accommodation',
      description: 'Accommodation is not included in this trip.'
    });
  }
  
  // 检查是否包含导游
  if (included.some(item => 
    item.toLowerCase().includes('guide') || 
    item.toLowerCase().includes('tour guide')
  )) {
    inclusions.push({
      icon: 'User',
      title: 'Guide',
      description: 'Professional local guides are available to serve you.'
    });
  }
  
  // 检查是否包含餐饮
  if (included.some(item => 
    item.toLowerCase().includes('meal') || 
    item.toLowerCase().includes('food') ||
    item.toLowerCase().includes('dinner') ||
    item.toLowerCase().includes('lunch')
  )) {
    inclusions.push({
      icon: 'Utensils',
      title: 'Meals',
      description: 'Authentic local cuisine experiences included as specified.'
    });
  }
  
  return inclusions;
}

/**
 * 生成相关旅行
 * 基于旅行卡片信息生成相关旅行推荐
 */
export function generateRelatedTrips(journey: Journey, allJourneys: Journey[] = []) {
  if (!allJourneys || !Array.isArray(allJourneys) || allJourneys.length === 0) {
    return [];
  }
  
  return allJourneys
    .filter(j => 
      j && 
      j.id !== journey.id && 
      j.status === 'active' && 
      (j.region === journey.region || j.category === journey.category)
    )
    .slice(0, 4)
    .map(j => ({
      title: j.title,
      duration: j.duration,
      price: `From ¥${j.price}`,
      image: j.image,
      slug: j.slug
    }));
}

/**
 * 自动生成旅行卡片的页面相关字段
 * 基于现有数据自动填充页面生成所需的字段
 */
export function generateJourneyPageFields(journey: Journey, allJourneys: Journey[] = []): Partial<Journey> {
  // 安全检查：确保必要字段存在
  if (!journey.title) {
    throw new Error('Journey title is required');
  }
  
  const sideImage = (journey.images && Array.isArray(journey.images) && journey.images.length > 1) 
    ? journey.images[1] 
    : journey.image || '';
  
  return {
    slug: journey.slug || generateSlug(journey.title),
    pageTitle: journey.pageTitle || generatePageTitle(journey.title),
    metaDescription: journey.metaDescription || generateMetaDescription(journey.description || ''),
    heroImage: journey.heroImage || journey.image || '',
    heroStats: journey.heroStats || generateHeroStats(journey),
    navigation: journey.navigation || generateNavigation(journey),
    overview: journey.overview || {
      breadcrumb: generateBreadcrumb(journey),
      description: journey.description || '',
      highlights: generateOverviewHighlights(journey),
      sideImage: sideImage
    },
    includes: journey.includes || '',
    excludes: journey.excludes || '',
    relatedTrips: journey.relatedTrips || generateRelatedTrips(journey, allJourneys)
  };
}

/**
 * 验证旅行卡片是否准备好生成页面
 * 检查必要的字段是否已填写
 */
export function validateJourneyForPageGeneration(journey: Journey): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  if (!journey.title) missingFields.push('title');
  if (!journey.description) missingFields.push('description');
  if (!journey.image) missingFields.push('image');
  if (!journey.duration) missingFields.push('duration');
  if (!journey.price) missingFields.push('price');
  if (!journey.category) missingFields.push('category');
  if (!journey.region) missingFields.push('region');
  if (!journey.city) missingFields.push('city');
  if (!journey.highlights || journey.highlights.length === 0) missingFields.push('highlights');
  if (!journey.itinerary || journey.itinerary.length === 0) missingFields.push('itinerary');
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

