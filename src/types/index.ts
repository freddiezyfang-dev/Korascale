export type Locale = "en" | "zh" | "de";

// 预订相关类型
export interface StayDetails {
  checkIn: Date | null;
  checkOut: Date | null;
  adults: number;
  children: number;
}

export interface GuestInfo {
  fullName: string;
  email: string;
  phoneNumber: string;
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
  }[];
  status: HotelStatus;
  createdAt: Date;
  updatedAt: Date;
}

