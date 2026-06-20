export const INQUIRY_INTENTS = [
  'journey_request',
  'custom_journey',
  'corporate_visit',
  'article_inquiry',
  'healthcare',
  'group_tour',
  'accommodation_inquiry',
  'general_contact',
] as const;

export const INQUIRY_SOURCE_TYPES = [
  'journey',
  'article',
  'homepage',
  'solution',
  'contact',
  'support',
  'direct',
  'unknown',
] as const;

export const INQUIRY_CHANNELS = ['form', 'email', 'whatsapp'] as const;

export const INQUIRY_STATUSES = ['NEW'] as const;

export const INQUIRY_NOTIFICATION_STATUSES = [
  'PENDING',
  'SENT',
  'FAILED',
  'SKIPPED',
] as const;

export type InquiryIntent = (typeof INQUIRY_INTENTS)[number];
export type InquirySourceType = (typeof INQUIRY_SOURCE_TYPES)[number];
export type InquiryChannel = (typeof INQUIRY_CHANNELS)[number];
export type InquiryStatus = string;
export type InquiryNotificationStatus = (typeof INQUIRY_NOTIFICATION_STATUSES)[number];

export type InquirySourceContext = Record<string, unknown>;
export type InquiryDetails = Record<string, unknown>;

/** Client/API payload before persistence (camelCase). */
export type CreateInquiryInput = {
  intent: InquiryIntent;
  sourceType: InquirySourceType;
  sourcePage?: string | null;
  sourceSlug?: string | null;
  sourceContext?: InquirySourceContext | null;
  channel: InquiryChannel;
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  details?: InquiryDetails | null;
};

export type InquiryRecord = {
  id: string;
  submissionId: string;
  intent: InquiryIntent;
  sourceType: InquirySourceType;
  sourcePage: string | null;
  sourceSlug: string | null;
  sourceContext: InquirySourceContext;
  channel: InquiryChannel;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  details: InquiryDetails;
  status: InquiryStatus;
  notificationStatus: InquiryNotificationStatus;
  notificationProviderId: string | null;
  notificationError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SubmitInquiryResult = {
  submissionId: string;
  notificationStatus: Lowercase<InquiryNotificationStatus>;
};
