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
  category: 'Food' | 'Culture & History' | 'Adventure' | 'City' | 'Nature' | 'Spiritual';
  region: string;
  city: string;
  location: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  maxParticipants: number;
  minParticipants: number;
  included: string[];
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
  inclusions?: {
    icon: string;
    title: string;
    description: string;
  }[];
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

