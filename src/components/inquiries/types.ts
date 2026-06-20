import type {
  JourneyInquiryFormMeta,
  JourneyInquirySummaryData,
} from './journeyInquiryTypes';
import type {
  CreateInquiryInput,
  InquiryIntent,
  InquirySourceType,
} from '@/lib/inquiries/types';

export type InquiryFormVariant =
  | 'custom_journey'
  | 'corporate_visit'
  | 'general_contact'
  | 'journey_request';

export type InquiryFormFieldKey =
  | 'name'
  | 'email'
  | 'phone'
  | 'message'
  | 'travelDates'
  | 'groupSize'
  | 'destinations'
  | 'travelStyle'
  | 'company'
  | 'visitDates'
  | 'visitorCount'
  | 'cities'
  | 'visitPurpose'
  | 'requiredServices'
  | 'subject'
  | 'adults'
  | 'children'
  | 'preferredDate';

export type InquiryFormValues = {
  name: string;
  email: string;
  phone: string;
  message: string;
  travelDates: string;
  groupSize: string;
  destinations: string;
  travelStyle: string;
  company: string;
  visitDates: string;
  visitorCount: string;
  cities: string;
  visitPurpose: string;
  requiredServices: string[];
  subject: string;
  adults: string;
  children: string;
  preferredDate: string;
};

export type InquirySubmissionContext = {
  intent: InquiryIntent;
  sourceType: InquirySourceType;
  sourcePage?: string | null;
  sourceSlug?: string | null;
  sourceContext?: Record<string, unknown>;
};

export type InquiryFormConfig = {
  variant: InquiryFormVariant;
  title: string;
  description: string;
  submitLabel: string;
  successTitle: string;
  successMessage: string;
  visibleFields: InquiryFormFieldKey[];
  requiredFields: InquiryFormFieldKey[];
  fieldLabels: Partial<Record<InquiryFormFieldKey, string>>;
};

export type InquiryClientFieldErrors = Partial<Record<InquiryFormFieldKey | '_form', string>>;

export type InquiryApiSuccessResponse = {
  success: true;
  submissionId: string;
  notificationStatus?: string;
};

export type InquiryApiErrorResponse =
  | { success: false; errors: Record<string, string> }
  | { success: false; error: string };

export type BuildInquiryPayloadInput = {
  config: InquiryFormConfig;
  context: InquirySubmissionContext;
  values: InquiryFormValues;
  journeyRequestMeta?: JourneyInquiryFormMeta;
};

export type { JourneyInquiryFormMeta, JourneyInquirySummaryData };

export type { CreateInquiryInput };
