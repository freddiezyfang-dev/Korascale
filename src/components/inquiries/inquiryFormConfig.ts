import type {
  InquiryFormConfig,
  InquiryFormFieldKey,
  InquiryFormValues,
  InquiryFormVariant,
  InquirySubmissionContext,
} from './types';

export const CORPORATE_REQUIRED_SERVICES = [
  { value: 'airport_transfers', label: 'Airport transfers' },
  { value: 'hotel_coordination', label: 'Hotel coordination' },
  { value: 'local_transportation', label: 'Local transportation' },
  { value: 'business_interpretation', label: 'Business interpretation' },
  { value: 'client_factory_visits', label: 'Client & factory visits' },
  { value: 'business_dinners', label: 'Business dinners' },
  { value: 'onsite_support', label: 'On-site support' },
  { value: 'bleisure_itinerary', label: 'Bleisure itinerary' },
] as const;

export const EMPTY_INQUIRY_FORM_VALUES: InquiryFormValues = {
  name: '',
  email: '',
  phone: '',
  message: '',
  travelDates: '',
  groupSize: '',
  destinations: '',
  travelStyle: '',
  company: '',
  visitDates: '',
  visitorCount: '',
  cities: '',
  visitPurpose: '',
  requiredServices: [],
  subject: '',
  adults: '2',
  children: '0',
  preferredDate: '',
};

const CUSTOM_JOURNEY_VISIBLE: InquiryFormFieldKey[] = [
  'name',
  'email',
  'travelDates',
  'groupSize',
  'destinations',
  'travelStyle',
  'message',
];

const CORPORATE_VISIBLE: InquiryFormFieldKey[] = [
  'name',
  'email',
  'company',
  'visitDates',
  'visitorCount',
  'cities',
  'visitPurpose',
  'requiredServices',
  'message',
];

const GENERAL_CONTACT_VISIBLE: InquiryFormFieldKey[] = ['name', 'email', 'subject', 'message'];

const JOURNEY_REQUEST_VISIBLE: InquiryFormFieldKey[] = [
  'name',
  'email',
  'phone',
  'preferredDate',
  'adults',
  'children',
  'message',
];

const BASE_CONFIG: Record<
  InquiryFormVariant,
  Omit<InquiryFormConfig, 'variant' | 'visibleFields' | 'requiredFields' | 'fieldLabels'>
> = {
  custom_journey: {
    title: 'Plan Your Journey',
    description:
      'Share your travel dates, group size, and destinations. Our team will follow up by email.',
    submitLabel: 'Submit Inquiry',
    successTitle: 'Inquiry Received',
    successMessage:
      'We have received your travel inquiry. Our team will contact you by email shortly.',
  },
  corporate_visit: {
    title: 'Plan Your Business Visit',
    description:
      'Tell us about your upcoming corporate visit in China. We will coordinate local support around your schedule.',
    submitLabel: 'Submit Visit Request',
    successTitle: 'Visit Request Received',
    successMessage:
      'We have received your corporate visit request. Our team will contact you by email shortly.',
  },
  general_contact: {
    title: 'Send Us a Message',
    description: 'Have a question? Send us a brief message and we will respond by email.',
    submitLabel: 'Send Message',
    successTitle: 'Message Received',
    successMessage: 'Thank you for reaching out. Our team will respond by email shortly.',
  },
  journey_request: {
    title: 'Request This Journey',
    description:
      'Share your travel dates and group size. Our team will confirm availability and pricing by email.',
    submitLabel: 'Submit Journey Request',
    successTitle: 'Journey Request Received',
    successMessage:
      'Thank you. We have received your journey request. Our team will confirm availability and pricing with you by email.',
  },
};

function buildConfig(
  variant: InquiryFormVariant,
  options?: {
    visibleFields?: InquiryFormFieldKey[];
    requiredFields?: InquiryFormFieldKey[];
    fieldLabels?: Partial<Record<InquiryFormFieldKey, string>>;
    title?: string;
    description?: string;
    submitLabel?: string;
  }
): InquiryFormConfig {
  const base = BASE_CONFIG[variant];
  const visibleFields =
    options?.visibleFields ??
    (variant === 'custom_journey'
      ? CUSTOM_JOURNEY_VISIBLE
      : variant === 'corporate_visit'
        ? CORPORATE_VISIBLE
        : variant === 'journey_request'
          ? JOURNEY_REQUEST_VISIBLE
          : GENERAL_CONTACT_VISIBLE);

  const requiredFields =
    options?.requiredFields ??
    (variant === 'custom_journey'
      ? (['name', 'email'] as InquiryFormFieldKey[])
      : variant === 'corporate_visit'
        ? (['name', 'email', 'company'] as InquiryFormFieldKey[])
        : variant === 'journey_request'
          ? (['name', 'email', 'adults'] as InquiryFormFieldKey[])
          : (['name', 'email', 'subject', 'message'] as InquiryFormFieldKey[]));

  return {
    variant,
    ...base,
    title: options?.title ?? base.title,
    description: options?.description ?? base.description,
    submitLabel: options?.submitLabel ?? base.submitLabel,
    visibleFields,
    requiredFields,
    fieldLabels: {
      ...(variant === 'corporate_visit'
        ? { name: 'Contact name', email: 'Work email', message: 'Additional details' }
        : {}),
      ...(variant === 'journey_request'
        ? { message: 'Special requests', preferredDate: 'Preferred travel date' }
        : {}),
      ...options?.fieldLabels,
    },
  };
}

export function getInquiryFormConfig(variant: InquiryFormVariant): InquiryFormConfig {
  return buildConfig(variant);
}

export function buildCustomJourneyContext(
  overrides: Partial<InquirySubmissionContext> = {}
): InquirySubmissionContext {
  return {
    intent: 'custom_journey',
    sourceType: overrides.sourceType ?? 'unknown',
    sourcePage: overrides.sourcePage ?? null,
    sourceSlug: overrides.sourceSlug ?? null,
    sourceContext: overrides.sourceContext ?? {},
  };
}

export function buildCorporateVisitContext(
  sourceCta: 'corporate_hero' | 'corporate_bottom',
  overrides: Partial<Omit<InquirySubmissionContext, 'intent' | 'sourceType'>> = {}
): InquirySubmissionContext {
  return {
    intent: 'corporate_visit',
    sourceType: 'solution',
    sourcePage: overrides.sourcePage ?? '/solutions/corporate-travel',
    sourceSlug: overrides.sourceSlug ?? null,
    sourceContext: {
      sourceCta,
      ...overrides.sourceContext,
    },
  };
}

export function buildArticleInquiryContext(params: {
  intent: 'custom_journey' | 'corporate_visit';
  sourcePage: string;
  articleSlug: string;
  articleTitle: string;
  categorySlug: string;
  sourceCta: string;
}): InquirySubmissionContext {
  return {
    intent: params.intent,
    sourceType: 'article',
    sourcePage: params.sourcePage,
    sourceSlug: params.articleSlug,
    sourceContext: {
      sourceCta: params.sourceCta,
      articleSlug: params.articleSlug,
      articleTitle: params.articleTitle,
      category: params.categorySlug,
    },
  };
}

export function buildGeneralContactContext(): InquirySubmissionContext {
  return {
    intent: 'general_contact',
    sourceType: 'contact',
    sourcePage: '/contact',
    sourceContext: {},
  };
}

export function buildJourneyRequestContext(params: {
  sourcePage: string;
  sourceSlug: string;
  sourceCta: string;
}): InquirySubmissionContext {
  return {
    intent: 'journey_request',
    sourceType: 'journey',
    sourcePage: params.sourcePage,
    sourceSlug: params.sourceSlug,
    sourceContext: {
      sourceCta: params.sourceCta,
    },
  };
}

export function resolveArticleInquiryIntent(
  ctaMode: string,
  categorySlug?: string
): 'custom_journey' | 'corporate_visit' {
  if (ctaMode === 'corporate_travel') return 'corporate_visit';
  if (ctaMode === 'private_journey') return 'custom_journey';
  if (categorySlug === 'business-travel-bleisure-china') return 'corporate_visit';
  return 'custom_journey';
}

export function resolveArticleSourceCta(intent: 'custom_journey' | 'corporate_visit'): string {
  return intent === 'corporate_visit' ? 'discuss_your_visit' : 'start_planning';
}
