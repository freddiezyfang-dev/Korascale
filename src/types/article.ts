export type ArticleStatus = 'draft' | 'active' | 'inactive';

export type ArticleCategory =
  | 'Food Journey'
  | 'The Western Corridor'
  | 'Ancient Chinese Culture'
  | 'Spiritual Retreat'
  | 'Vibrant Nightscapes'
  | 'Seasonal Highlights';

/** 后台筛选、表单 value 等固定顺序 */
export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  'Food Journey',
  'The Western Corridor',
  'Ancient Chinese Culture',
  'Spiritual Retreat',
  'Vibrant Nightscapes',
  'Seasonal Highlights',
];

// Content Block Types
export type ContentBlockType = 'heading' | 'paragraph' | 'image' | 'callout' | 'trip_cta';

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  // For heading and paragraph
  text?: string; // Supports HTML or Markdown
  level?: number; // For heading (1-6)
  // For image
  imageSrc?: string;
  caption?: string;
  imageWidth?: 'contained' | 'full-bleed'; // Image width option
  // For callout (month guides, highlight boxes)
  monthTag?: string; // e.g., "January in Botswana"
  highlightColor?: string; // e.g., "#c0a273" (淡金色) or red
  // For trip_cta
  journeyId?: string; // Link to journey card
  ctaText?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverImage: string; // 文章主图
  heroImage?: string; // Hero area image (for Jacada style)
  readingTime?: string; // e.g., "12 min read"
  category: ArticleCategory; // 对应 inspirations 分类
  // Legacy content field for backward compatibility
  content?: string; // 富文本存储为 HTML 或 Markdown 字符串（已废弃，使用 contentBlocks）
  // New content blocks structure
  contentBlocks?: ContentBlock[]; // Array of content blocks
  excerpt?: string; // 可选，若未提供则由 content 自动截取
  relatedJourneyIds: string[]; // 关联 Journey IDs（向后兼容）
  recommendedItems?: RecommendedItem[]; // 推荐项（支持混合 Journey 和 Article）
  tags?: string[];
  faqs?: { question: string; answer: string }[];
  status: ArticleStatus;
  /** 首页精选：true 时出现在首页 Content Section */
  featured?: boolean;
  /** 首页展示位序号 1–5，按此字段排序展示 */
  displayOrder?: number;
  // SEO
  pageTitle?: string;
  metaDescription?: string;
  // 时间
  createdAt: Date;
  updatedAt: Date;
}

export const ArticleCategoryToHeroImage: Record<ArticleCategory, string> = {
  'Food Journey': '/images/inspirations/food-journey.jpg',
  'The Western Corridor': '/images/inspirations/great-outdoors.jpeg',
  'Ancient Chinese Culture': '/images/inspirations/traditional%20craft.png',
  'Spiritual Retreat': '/images/inspirations/spiritual%20retreat.webp',
  'Vibrant Nightscapes': '/images/inspirations/nightscapes.jpg',
  'Seasonal Highlights': '/images/inspirations/seasonal-highlights.jpg'
};

export const ArticleCategoryToSlug: Record<ArticleCategory, string> = {
  'Food Journey': 'food-journey',
  'The Western Corridor': 'the-western-corridor',
  'Ancient Chinese Culture': 'ancient-chinese-culture',
  'Spiritual Retreat': 'spiritual-retreat',
  'Vibrant Nightscapes': 'vibrant-nightscapes',
  'Seasonal Highlights': 'seasonal-highlights'
};

/** 二级类目展示名称（面包屑、类目列表页标题等）；含分号时类目页会拆成两行显示 */
export const ArticleCategoryToDisplayName: Record<ArticleCategory, string> = {
  'Food Journey': 'How to Plan a China Trip; A Logic-First Guide (2026)',
  'The Western Corridor': 'The Western Corridor',
  'Ancient Chinese Culture': 'Ancient Chinese Culture',
  'Spiritual Retreat': 'Whispers of the Water Towns',
  'Vibrant Nightscapes': 'Vibrant Nightscapes',
  'Seasonal Highlights': "The Alchemist's Kitchen",
};

/**
 * 首页 / Inspirations 卡片标题（与库内 category 值可不同；Spiritual / Seasonal 为新版展示名）
 */
export const ArticleCategoryToCardTitle: Record<ArticleCategory, string> = {
  'Food Journey': 'How to Plan a China Trip: A Logic-First Guide (2026)',
  'The Western Corridor': 'The Western Corridor',
  'Ancient Chinese Culture': 'Ancient Chinese Culture',
  'Spiritual Retreat': 'Whispers of the Water Towns',
  'Vibrant Nightscapes': 'Vibrant Nightscapes',
  'Seasonal Highlights': "The Alchemist's Kitchen",
};

/** 首页 CategoryExplorer、Inspirations 落地页等使用的短描述 */
export const ArticleCategoryToCardDescription: Record<ArticleCategory, string> = {
  'Food Journey':
    'Dissect the intricate geography of the Middle Kingdom with our proprietary frameworks. From balancing the high-altitude spiritual pulse of Tibet with the historic depth of the Central Plains, we map your journey with precision, revealing the optimal sequences for true immersion.',
  'The Western Corridor':
    'Ascend from the lush, mist-shrouded valleys of Sichuan to the spiritual heart of Tibet. Experience private encounters with giant pandas in Chengdu before tracing pilgrim trails to Lhasa\'s golden-roofed monasteries.',
  'Ancient Chinese Culture':
    'Go beyond the museum glass. Engage with national treasure artisans in their private ateliers, from the rhythmic strokes of ancient calligraphy to the intricate firing of Jingdezhen porcelain—preserving the soul of Chinese craftsmanship.',
  'Spiritual Retreat':
    'Drift through the timeless canals of Suzhou and Wuzhen. Discover a world of private Ming-style gardens and hidden silk heritage, where the gentle pace of life is dictated by the rhythmic oars of traditional wooden sculls.',
  'Vibrant Nightscapes':
    'Watch the horizon ignite from exclusive rooftop perspectives. From the historic Bund of Shanghai to the futuristic skyline of Shenzhen, witness the pulse of modern China as its ancient spirit meets a dazzling, high-tech future.',
  'Seasonal Highlights':
    "A sensory odyssey through China's diverse regional flavors. Savor the delicate, seasonal mastery of Cantonese dim sum and the bold, numbing spices of Sichuanese feasts, where ancient recipes are reimagined by master chefs.",
};

/** 后台下拉：展示名（存储值仍为 ArticleCategory） */
export function articleCategoryOptionLabel(cat: ArticleCategory): string {
  return `${ArticleCategoryToCardTitle[cat]} — ${cat}`;
}

export const ArticleSlugToCategory = (slug: string): ArticleCategory | null => {
  if (slug === 'great-outdoors') return 'The Western Corridor';
  const entry = (Object.entries(ArticleCategoryToSlug) as [ArticleCategory, string][])
    .find(([, s]) => s === slug);
  return entry ? entry[0] : null;
};

// Recommended Item Types
export type RecommendedItemType = 'journey' | 'article';

export interface RecommendedItem {
  type: RecommendedItemType;
  id: string; // Journey ID or Article ID
}


