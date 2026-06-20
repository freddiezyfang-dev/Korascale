/** Payload when a user selects a date/departure on a Journey detail page. */
export type JourneyInquiryClickPayload = {
  date: Date;
  pricePerPerson: number;
  selectedDepartureId?: string;
  departureLabel?: string;
};

export type JourneyInquirySourceCta =
  | 'journey_detail_request'
  | 'journey_hero_request'
  | 'journey_sidebar_request'
  | 'journey_bottom_request';

export type JourneyInquirySummaryData = {
  title: string;
  image?: string;
  duration?: string;
  selectedDepartureLabel?: string;
  preferredDate?: string;
  estimatedPricePerPerson?: number;
  currency?: string;
};

export type JourneyInquiryFormMeta = {
  selectedDepartureId?: string;
  preferredDate?: string;
};
