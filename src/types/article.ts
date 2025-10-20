export type ArticleStatus = 'draft' | 'active' | 'inactive';

export type ArticleCategory =
  | 'Food Journey'
  | 'Great Outdoors'
  | 'Immersive Encounters'
  | 'Spiritual Retreat'
  | 'Vibrant Nightscapes'
  | 'Seasonal Highlights';

export interface Article {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverImage: string; // 文章主图
  category: ArticleCategory; // 对应 inspirations 分类
  content: string; // 富文本存储为 HTML 或 Markdown 字符串
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


