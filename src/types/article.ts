export type ArticleStatus = 'draft' | 'active' | 'inactive';

export type ArticleCategory =
  | 'Food Journey'
  | 'Great Outdoors'
  | 'Immersive Encounters'
  | 'Spiritual Retreat'
  | 'Vibrant Nightscapes'
  | 'Seasonal Highlights';

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
  relatedJourneyIds: string[]; // 关联 Journey IDs
  tags?: string[];
  status: ArticleStatus;
  // SEO
  pageTitle?: string;
  metaDescription?: string;
  // 时间
  createdAt: Date;
  updatedAt: Date;
}

export const ArticleCategoryToHeroImage: Record<ArticleCategory, string> = {
  'Food Journey': '/images/inspirations/food-journey.jpg',
  'Great Outdoors': '/images/inspirations/great-outdoors.jpeg',
  'Immersive Encounters': '/images/inspirations/traditional%20craft.png',
  'Spiritual Retreat': '/images/inspirations/spiritual%20retreat.webp',
  'Vibrant Nightscapes': '/images/inspirations/nightscapes.jpg',
  'Seasonal Highlights': '/images/inspirations/seasonal-highlights.jpg'
};

export const ArticleCategoryToSlug: Record<ArticleCategory, string> = {
  'Food Journey': 'food-journey',
  'Great Outdoors': 'great-outdoors',
  'Immersive Encounters': 'immersive-encounters',
  'Spiritual Retreat': 'spiritual-retreat',
  'Vibrant Nightscapes': 'vibrant-nightscapes',
  'Seasonal Highlights': 'seasonal-highlights'
};

export const ArticleSlugToCategory = (slug: string): ArticleCategory | null => {
  const entry = (Object.entries(ArticleCategoryToSlug) as [ArticleCategory, string][])
    .find(([, s]) => s === slug);
  return entry ? entry[0] : null;
};


