import { Journey } from '@/types';

/**
 * 页面迁移工具
 * 帮助将现有页面迁移到新的模板系统
 */

/**
 * 从现有页面提取数据并转换为新的格式
 */
export function migrateExistingPage(existingJourney: Journey): Partial<Journey> {
  return {
    // 基础页面字段
    slug: existingJourney.slug || generateSlugFromTitle(existingJourney.title),
    pageTitle: existingJourney.pageTitle || existingJourney.title,
    metaDescription: existingJourney.metaDescription || generateMetaDescription(existingJourney.description),
    heroImage: existingJourney.heroImage || existingJourney.image,
    
    // 英雄统计数据
    heroStats: existingJourney.heroStats || {
      days: extractDaysFromDuration(existingJourney.duration),
      destinations: existingJourney.itinerary?.length || 1,
      maxGuests: existingJourney.maxParticipants || 12
    },
    
    // 导航菜单
    navigation: existingJourney.navigation || [
      { name: 'Overview', href: '#overview' },
      { name: 'Itinerary', href: '#itinerary' },
      ...(existingJourney.accommodations && existingJourney.accommodations.length > 0 
        ? [{ name: 'Stays', href: '#stays' }] 
        : []),
      { name: 'Details', href: '#details' }
    ],
    
    // 概述区域
    overview: existingJourney.overview || {
      breadcrumb: ['Home', 'Journey', existingJourney.category, existingJourney.title],
      description: existingJourney.description,
      highlights: generateHighlightsFromArray(existingJourney.highlights),
      sideImage: existingJourney.images[1] || existingJourney.image
    },
    
    // 包含项目
    inclusions: existingJourney.inclusions || generateInclusionsFromJourney(existingJourney),
    
    // 相关推荐
    relatedTrips: existingJourney.relatedTrips || []
  };
}

/**
 * 从标题生成slug
 */
function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * 生成meta描述
 */
function generateMetaDescription(description: string, maxLength: number = 160): string {
  if (description.length <= maxLength) {
    return description;
  }
  
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
 * 从持续时间提取天数
 */
function extractDaysFromDuration(duration: string): number {
  const match = duration.match(/(\d+)\s*day/i);
  return match ? parseInt(match[1]) : 1;
}

/**
 * 从亮点数组生成结构化亮点
 */
function generateHighlightsFromArray(highlights: string[]) {
  const iconMap: { [key: string]: string } = {
    'panda': '🐼',
    'food': '🥢',
    'cooking': '👨‍🍳',
    'opera': '🎭',
    'hot pot': '🍲',
    'buddha': '🙏',
    'nature': '🌿',
    'mountain': '⛰️',
    'lake': '🏞️',
    'city': '🏙️',
    'temple': '🏛️',
    'adventure': '🎯'
  };
  
  return highlights.map(highlight => {
    const lowerHighlight = highlight.toLowerCase();
    let icon = '⭐';
    
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
 * 从旅行卡片生成包含项目
 */
function generateInclusionsFromJourney(journey: Journey) {
  const inclusions = [];
  
  // 检查交通
  if (journey.included.some(item => 
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
  
  // 检查住宿
  if (journey.included.some(item => 
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
  
  // 检查导游
  if (journey.included.some(item => 
    item.toLowerCase().includes('guide') || 
    item.toLowerCase().includes('tour guide')
  )) {
    inclusions.push({
      icon: 'User',
      title: 'Guide',
      description: 'Professional local guides are available to serve you.'
    });
  }
  
  // 检查餐饮
  if (journey.included.some(item => 
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
 * 批量迁移多个旅行卡片
 */
export function batchMigrateJourneys(journeys: Journey[]): Journey[] {
  return journeys.map(journey => ({
    ...journey,
    ...migrateExistingPage(journey)
  }));
}

/**
 * 验证迁移后的页面配置
 */
export function validateMigratedPage(journey: Journey): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  if (!journey.slug) warnings.push('Missing slug');
  if (!journey.pageTitle) warnings.push('Missing page title');
  if (!journey.metaDescription) warnings.push('Missing meta description');
  if (!journey.heroImage) warnings.push('Missing hero image');
  if (!journey.heroStats) warnings.push('Missing hero stats');
  if (!journey.navigation || journey.navigation.length === 0) warnings.push('Missing navigation');
  if (!journey.overview) warnings.push('Missing overview');
  if (!journey.inclusions || journey.inclusions.length === 0) warnings.push('Missing inclusions');
  
  return {
    isValid: warnings.length === 0,
    warnings
  };
}

