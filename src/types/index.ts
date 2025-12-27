export type Locale = "en" | "zh" | "de";

// 预订相关类型
export interface StayDetails {
  checkIn: Date | null;
  checkOut: Date | null;
  adults: number;
  children: number;
  guests?: number;
}

export interface GuestInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
  phone?: string;
  nationality?: string;
  specialRequests: string;
}

export interface BookingData {
  accommodation: {
    id: string;
    title: string;
    location: string;
    image: string;
    price?: string;
  };
  stayDetails: StayDetails;
  guestInfo: GuestInfo;
  totalPrice: number;
  bookingId?: string;
}

export type BookingStep = 'stay-details' | 'guest-info' | 'confirmation' | 'success';

// 订单状态类型
export type OrderStatus = 'pending' | 'confirmed' | 'paid' | 'staff_confirmed' | 'completed';

// 行程模块类型
export interface JourneyModule {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  included: string[];
}

// 体验类型
export interface Experience {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  type: 'experience' | 'accommodation';
}

// 订单类型
export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  accommodation: {
    id: string;
    title: string;
    location: string;
    image: string;
    price: number;
  };
  selectedModules?: JourneyModule[];
  selectedExperiences?: Experience[];
  selectedAccommodation?: Experience;
  stayDetails: StayDetails;
  guestInfo: GuestInfo;
  totalPrice: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  paymentConfirmedAt?: Date;
  staffConfirmedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

// 用户登录记录类型
export interface UserLoginRecord {
  id: string;
  userId: string;
  userEmail: string;
  loginAt: Date;
  logoutAt?: Date;
  ipAddress?: string;
  userAgent?: string;
}

// 用户类型扩展
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  isLoggedIn: boolean;
  lastLoginAt?: Date;
  loginCount: number;
}

// 酒店状态类型
export type HotelStatus = 'active' | 'inactive';

// 旅行卡片状态类型
export type JourneyStatus = 'active' | 'inactive' | 'draft';

// 旅行卡片版面分类类型
export type JourneyType = 'Explore Together' | 'Deep Discovery' | 'Signature Journeys' | 'Group Tours';

// 定制服务类型
export type CustomizationType = 'Tailor-Made China';

// Tailor-Made China 定制服务请求状态
export type TailorMadeStatus = 'pending' | 'in_progress' | 'quoted' | 'confirmed' | 'completed' | 'cancelled';

// Tailor-Made China 定制服务请求
export interface TailorMadeRequest {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCountry?: string;
  travelDates?: {
    startDate?: string;
    endDate?: string;
    flexible: boolean;
  };
  numberOfTravelers: number;
  travelerDetails?: Array<{
    name: string;
    age?: number;
    specialNeeds?: string;
  }>;
  preferredDestinations?: string[];
  interests?: string[];
  budgetRange?: string;
  accommodationPreference?: string;
  transportationPreference?: string;
  specialRequirements?: string;
  dietaryRestrictions?: string;
  accessibilityNeeds?: string;
  itineraryPreferences?: Record<string, any>;
  experiencePreferences?: Record<string, any>;
  accommodationPreferences?: Record<string, any>;
  status: TailorMadeStatus;
  assignedTo?: string; // 分配的顾问ID
  quoteAmount?: number;
  quoteCurrency?: string;
  quoteValidUntil?: Date;
  quoteDetails?: Record<string, any>;
  communicationLog?: Array<{
    date: Date;
    type: string;
    content: string;
    userId?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  confirmedAt?: Date;
  completedAt?: Date;
}

// 旅行卡片类型
export interface Journey {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  image: string;
  images: string[];
  duration: string;
  price: number;
  originalPrice?: number;
  category: 'Nature' | 'Culture' | 'History' | 'City' | 'Cruises';
  journeyType?: JourneyType; // 版面分类：Explore Together, Deep Discovery, Signature Journeys
  region: 'Southwest China' | 'Northwest&Northern Frontier' | 'North China' | 'South China' | 'East&Central China';
  place?: string; // 具体地点：Tibetan Plateau & Kham Region, Yunnan–Guizhou Highlands, 等
  city: string;
  location: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  destinationCount?: number; // 目的地数量，用于hero banner显示
  maxGuests?: number; // 最大客人数量，用于hero banner显示
  maxParticipants: number;
  minParticipants: number;
  excluded: string[];
  highlights: string[];
  itinerary: {
    day: number;
    title: string;
    description: string;
    activities: string[];
    meals: string[];
    accommodation?: string;
    image?: string;
  }[];
  modules: JourneyModule[];
  experiences: string[]; // 存储体验ID数组
  accommodations: string[]; // 存储住宿ID数组
  availableExperiences: string[]; // 可选择的体验ID数组
  availableAccommodations: string[]; // 可选择的住宿ID数组
  requirements: string[];
  bestTimeToVisit: string[];
  rating: number;
  reviewCount: number;
  status: JourneyStatus;
  featured: boolean;
  tags: string[];
  // 页面生成相关字段
  slug: string; // URL路径，如 "chengdu-city-one-day-deep-dive"
  pageTitle: string; // 页面标题
  metaDescription: string; // SEO描述
  heroImage: string; // 主横幅图片
  heroStats?: {
    days: number;
    destinations: number;
    maxGuests: number;
  };
  navigation?: {
    name: string;
    href: string;
  }[];
  overview?: {
    breadcrumb: string[];
    description: string;
    highlights: {
      icon: string;
      title: string;
      description: string;
      image?: string;
    }[];
    sideImage: string;
  };
  includes?: string; // 包含内容，用户自定义文本（向后兼容）
  included: string[]; // 包含内容，标准化服务列表（新格式，必需字段，默认为空数组）
  excludes?: string; // 不包含内容，用户自定义文本
  relatedTrips?: {
    title: string;
    duration: string;
    price: string;
    image: string;
    slug: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// 酒店房间价格和可用性类型
export interface RoomAvailability {
  roomTypeName: string;
  date: string; // YYYY-MM-DD format
  available: boolean;
  price: number;
  maxOccupancy: number;
}

// 酒店类型扩展
export interface Hotel {
  id: string;
  name: string;
  city: string;
  location: string;
  description: string;
  rating: string;
  starRating: string;
  images: string[];
  roomTypes: {
    name: string;
    description: string;
    amenities: string[];
    basePrice: number;
    maxOccupancy: number;
  }[];
  availability: RoomAvailability[];
  status: HotelStatus;
  createdAt: Date;
  updatedAt: Date;
}

