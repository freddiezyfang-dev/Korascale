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

