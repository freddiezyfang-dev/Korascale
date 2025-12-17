import { Journey } from '@/types';

/**
 * 页面模板配置
 * 定义所有旅行详情页面的统一布局和样式
 */
export const JOURNEY_PAGE_TEMPLATE = {
  // Hero区域配置
  hero: {
    height: 'h-[722px]',
    titleSize: 'text-5xl md:text-6xl',
    statsLayout: 'flex items-center justify-center gap-8',
    statsItem: {
      container: 'text-center',
      number: 'text-4xl font-bold',
      label: 'text-sm'
    }
  },

  // 导航配置
  navigation: {
    background: 'bg-tertiary',
    padding: 'py-4',
    layout: 'flex justify-center gap-8',
    linkStyle: 'text-white hover:text-accent transition-colors font-medium'
  },

  // 概述区域配置
  overview: {
    background: 'secondary',
    padding: 'xl',
    layout: 'flex gap-8 lg:flex-row md:flex-col',
    contentWidth: 'flex-1',
    sidebarWidth: 'lg:w-96 md:w-full',
    highlightItem: {
      container: 'flex items-start gap-3',
      icon: 'text-2xl',
      content: {
        title: 'font-medium',
        description: 'text-sm text-gray-600'
      }
    }
  },

  // 行程区域配置
  itinerary: {
    background: 'secondary',
    padding: 'xl',
    titleAlign: 'center',
    titleMargin: 'mb-12',
    dayItem: {
      background: 'bg-tertiary',
      padding: 'p-6',
      layout: 'flex gap-6 lg:flex-row md:flex-col',
      contentWidth: 'flex-1',
      imageWidth: 'w-80 h-48 lg:w-96 lg:h-64',
      imageStyle: 'bg-center bg-cover bg-no-repeat rounded-lg flex-shrink-0'
    }
  },

  // 体验区域配置
  experiences: {
    background: 'secondary',
    padding: 'xl',
    titleAlign: 'center',
    titleMargin: 'mb-4',
    descriptionMargin: 'mb-12',
    descriptionMaxWidth: 'max-w-4xl mx-auto',
    gridLayout: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch'
  },

  // 住宿区域配置
  accommodations: {
    background: 'tertiary',
    padding: 'xl',
    titleAlign: 'center',
    titleMargin: 'mb-4',
    titleColor: 'text-white',
    descriptionMargin: 'mb-12',
    descriptionColor: 'text-white',
    descriptionMaxWidth: 'max-w-4xl mx-auto',
    gridLayout: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch',
    viewMoreButton: {
      container: 'text-center mt-8',
      style: 'border-white text-white hover:bg-white hover:text-tertiary'
    }
  },

  // 包含和排除项目区域配置
  includesExcludes: {
    background: 'secondary',
    padding: 'xl',
    layout: 'grid grid-cols-1 lg:grid-cols-2 gap-12'
  },

  // 相关推荐区域配置
  relatedTrips: {
    background: 'accent',
    padding: 'xl',
    titleAlign: 'center',
    titleMargin: 'mb-12',
    gridLayout: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
    tripCard: {
      container: 'overflow-hidden p-0 hover:shadow-lg transition-shadow duration-300',
      image: 'h-48 bg-center bg-cover bg-no-repeat',
      content: {
        container: 'p-4 bg-white',
        title: 'font-medium mb-2 line-clamp-2 text-gray-900',
        details: 'flex justify-between items-center text-sm text-gray-600',
        price: 'font-medium text-primary-600'
      }
    }
  }
};

/**
 * 生成标准化的页面配置
 * 确保所有页面都遵循相同的布局和样式
 */
export function generateStandardPageConfig(journey: Journey) {
  return {
    // Hero区域
    hero: {
      // 优先使用后台 main image（image 字段），没有时再回退到 heroImage
      image: journey.image || journey.heroImage,
      title: journey.pageTitle || journey.title,
      stats: journey.heroStats || {
        days: parseInt(journey.duration.split(' ')[0]) || 1,
        destinations: journey.destinationCount || journey.itinerary.length || 1,
        maxGuests: journey.maxGuests || journey.maxParticipants || 12
      }
    },

    // 导航
    navigation: journey.navigation || [
      { name: 'Overview', href: '#overview' },
      { name: 'Itinerary', href: '#itinerary' },
      ...(journey.accommodations && journey.accommodations.length > 0 
        ? [{ name: 'Stays', href: '#stays' }] 
        : []),
      { name: 'Details', href: '#details' }
    ],

    // 概述区域
    overview: {
      breadcrumb: journey.overview?.breadcrumb || [
        'Home', 'Journey', journey.category, journey.title
      ],
      description: journey.overview?.description || journey.description,
      highlights: journey.overview?.highlights || journey.highlights.map(h => ({
        icon: '⭐',
        title: h,
        description: `Experience ${h.toLowerCase()} during your journey.`
      })),
      sideImage: journey.overview?.sideImage || journey.images[1] || journey.image
    },

    // 行程区域
    itinerary: journey.itinerary.map(day => ({
      ...day,
      image: day.image || journey.images[0] || journey.image
    })),

    // 体验区域
    experiences: journey.experiences || [],

    // 住宿区域
    accommodations: journey.accommodations || [],

    // 包含和排除项目
    includes: journey.includes || '',
    excludes: journey.excludes || '',

    // 相关推荐
    relatedTrips: journey.relatedTrips || []
  };
}

/**
 * 验证页面配置是否符合模板标准
 */
export function validatePageConfig(config: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.hero?.title) errors.push('Missing hero title');
  if (!config.hero?.image) errors.push('Missing hero image');
  if (!config.overview?.description) errors.push('Missing overview description');
  if (!config.itinerary || config.itinerary.length === 0) errors.push('Missing itinerary');
  if (!config.navigation || config.navigation.length === 0) errors.push('Missing navigation');

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 应用模板样式到页面配置
 */
export function applyTemplateStyles(config: any) {
  return {
    ...config,
    template: JOURNEY_PAGE_TEMPLATE
  };
}

