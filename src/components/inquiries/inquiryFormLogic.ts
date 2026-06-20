import type { CreateInquiryInput } from '@/lib/inquiries/types';

import type {
  BuildInquiryPayloadInput,
  InquiryClientFieldErrors,
  InquiryFormFieldKey,
  InquiryFormValues,
} from './types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ADULTS = 20;
const MAX_CHILDREN = 20;

function validatePartyField(
  value: string,
  field: 'adults' | 'children',
  min: number,
  max: number,
  required: boolean
): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return required ? 'This field is required' : null;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return `Enter a whole number between ${min} and ${max}`;
  }
  return null;
}

export function omitEmptyRecord(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value == null) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    result[key] = value;
  }
  return result;
}

export function validateInquiryFormValues(
  values: InquiryFormValues,
  requiredFields: InquiryFormFieldKey[]
): InquiryClientFieldErrors {
  const errors: InquiryClientFieldErrors = {};

  for (const field of requiredFields) {
    if (field === 'requiredServices') {
      continue;
    }
    const raw = values[field];
    if (typeof raw !== 'string' || !raw.trim()) {
      errors[field] = 'This field is required';
    }
  }

  if (values.email.trim() && !EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address';
  }

  if (requiredFields.includes('adults')) {
    const adultsError = validatePartyField(values.adults, 'adults', 1, MAX_ADULTS, true);
    if (adultsError) errors.adults = adultsError;
  }

  const childrenError = validatePartyField(values.children, 'children', 0, MAX_CHILDREN, false);
  if (childrenError) errors.children = childrenError;

  return errors;
}

export function buildInquiryPayload(input: BuildInquiryPayloadInput): CreateInquiryInput {
  const { config, context, values, journeyRequestMeta } = input;
  const trimmedMessage = values.message.trim() || null;

  const sourceContext = omitEmptyRecord({
    ...(context.sourceContext ?? {}),
  });

  let details: Record<string, unknown> = {};

  if (config.variant === 'custom_journey') {
    details = omitEmptyRecord({
      travelDates: values.travelDates.trim(),
      groupSize: values.groupSize.trim(),
      destinations: values.destinations.trim(),
      travelStyle: values.travelStyle.trim(),
    });
  } else if (config.variant === 'corporate_visit') {
    details = omitEmptyRecord({
      company: values.company.trim(),
      visitDates: values.visitDates.trim(),
      visitorCount: values.visitorCount.trim(),
      cities: values.cities.trim(),
      visitPurpose: values.visitPurpose.trim(),
      requiredServices: values.requiredServices,
    });
  } else if (config.variant === 'journey_request') {
    const preferredDate =
      values.preferredDate.trim() || journeyRequestMeta?.preferredDate?.trim() || '';
    details = omitEmptyRecord({
      preferredDate,
      selectedDepartureId: journeyRequestMeta?.selectedDepartureId,
      adults: Number.parseInt(values.adults.trim(), 10),
      children: Number.parseInt(values.children.trim() || '0', 10),
    });
  } else {
    details = omitEmptyRecord({
      subject: values.subject.trim(),
    });
  }

  return {
    intent: context.intent,
    sourceType: context.sourceType,
    sourcePage: context.sourcePage ?? null,
    sourceSlug: context.sourceSlug ?? null,
    sourceContext,
    channel: 'form',
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim() || null,
    message: trimmedMessage,
    details,
  };
}

export function mapApiErrorsToFormFields(
  apiErrors: Record<string, string>
): InquiryClientFieldErrors {
  const mapped: InquiryClientFieldErrors = {};
  const detailFieldMap: Record<string, InquiryFormFieldKey> = {
    subject: 'subject',
    travelDates: 'travelDates',
    groupSize: 'groupSize',
    destinations: 'destinations',
    travelStyle: 'travelStyle',
    company: 'company',
    visitDates: 'visitDates',
    visitorCount: 'visitorCount',
    cities: 'cities',
    visitPurpose: 'visitPurpose',
    requiredServices: 'requiredServices',
    adults: 'adults',
    children: 'children',
    preferredDate: 'preferredDate',
  };

  for (const [key, message] of Object.entries(apiErrors)) {
    if (key === 'details') {
      mapped._form = message;
      continue;
    }
    if (key in detailFieldMap) {
      mapped[detailFieldMap[key]] = message;
      continue;
    }
    if (
      key === 'name' ||
      key === 'email' ||
      key === 'phone' ||
      key === 'message' ||
      key === 'intent' ||
      key === 'sourceType' ||
      key === 'channel' ||
      key === 'sourcePage' ||
      key === 'sourceSlug' ||
      key === 'sourceContext'
    ) {
      mapped[key as InquiryFormFieldKey | '_form'] = message;
      continue;
    }
    mapped._form = message;
  }

  return mapped;
}

export function serializePayloadForDuplicateCheck(payload: CreateInquiryInput): string {
  return JSON.stringify(payload);
}

export function shouldBlockDuplicateSubmit(
  payload: CreateInquiryInput,
  lastSuccessfulPayload: string | null,
  isSubmitting: boolean
): boolean {
  if (isSubmitting) return true;
  if (!lastSuccessfulPayload) return false;
  return serializePayloadForDuplicateCheck(payload) === lastSuccessfulPayload;
}

export function shouldShowInquirySuccess(notificationStatus?: string): boolean {
  if (!notificationStatus) return true;
  const normalized = notificationStatus.toLowerCase();
  return normalized === 'sent' || normalized === 'failed' || normalized === 'skipped';
}

export const GENERIC_INQUIRY_ERROR =
  'Something went wrong while submitting your inquiry. Please try again later.';
