// 体验状态类型
export type ExperienceStatus = 'active' | 'inactive' | 'draft';

// 体验类型
export type ExperienceType = 'cooking' | 'cultural' | 'adventure' | 'nature' | 'spiritual' | 'entertainment' | 'educational';

// 体验难度
export type ExperienceDifficulty = 'Easy' | 'Medium' | 'Hard';

// 体验接口
export interface Experience {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  image: string;
  images: string[];
  price: number;
  originalPrice?: number;
  duration: string; // 如 "3 Hours", "Half Day", "Full Day"
  type: ExperienceType;
  difficulty: ExperienceDifficulty;
  location: string;
  city: string;
  region: string;
  maxParticipants: number;
  minParticipants: number;
  included: string[];
  excluded: string[];
  requirements: string[];
  highlights: string[];
  itinerary: {
    step: number;
    title: string;
    description: string;
    duration: string;
    image?: string;
  }[];
  bestTimeToVisit: string[];
  rating: number;
  reviewCount: number;
  status: ExperienceStatus;
  featured: boolean;
  tags: string[];
  // 页面生成相关字段
  slug: string;
  pageTitle: string;
  metaDescription: string;
  createdAt: Date;
  updatedAt: Date;
}

// 体验管理Context类型
export interface ExperienceManagementContextType {
  experiences: Experience[];
  updateExperienceStatus: (experienceId: string, status: ExperienceStatus) => void;
  updateExperience: (experienceId: string, updates: Partial<Omit<Experience, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  addExperience: (experience: Omit<Experience, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteExperience: (experienceId: string) => void;
  getExperiencesByStatus: (status: ExperienceStatus) => Experience[];
  getExperiencesByType: (type: ExperienceType) => Experience[];
  getExperiencesByRegion: (region: string) => Experience[];
  getFeaturedExperiences: () => Experience[];
  isLoading: boolean;
}





