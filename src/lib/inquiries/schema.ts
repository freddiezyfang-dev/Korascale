import {
  INQUIRY_CHANNELS,
  INQUIRY_INTENTS,
  INQUIRY_SOURCE_TYPES,
  type CreateInquiryInput,
  type InquiryChannel,
  type InquiryDetails,
  type InquiryIntent,
  type InquirySourceContext,
  type InquirySourceType,
} from './types';

export type InquiryValidationErrors = Partial<
  Record<
    | 'intent'
    | 'sourceType'
    | 'sourcePage'
    | 'sourceSlug'
    | 'sourceContext'
    | 'channel'
    | 'name'
    | 'email'
    | 'phone'
    | 'message'
    | 'details'
    | '_form',
    string
  >
>;

export type InquiryValidationResult =
  | { success: true; data: CreateInquiryInput }
  | { success: false; errors: InquiryValidationErrors };

const FORBIDDEN_CLIENT_KEYS = new Set([
  'id',
  'submissionId',
  'submission_id',
  'status',
  'notificationStatus',
  'notification_status',
  'notificationError',
  'notification_error',
  'notificationProviderId',
  'notification_provider_id',
  'createdAt',
  'created_at',
  'updatedAt',
  'updated_at',
]);

const MAX_NAME = 255;
const MAX_EMAIL = 255;
const MAX_PHONE = 50;
const MAX_MESSAGE = 5000;
const MAX_SOURCE_PAGE = 2048;
const MAX_SOURCE_SLUG = 255;
const MAX_JSON_BYTES = 10_000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function trimOrNull(value: unknown, maxLength: number): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

function trimOptionalField(
  value: unknown,
  field: keyof InquiryValidationErrors,
  maxLength: number,
  errors: InquiryValidationErrors
): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) {
    errors[field] = `${field} exceeds maximum length`;
    return null;
  }
  return trimmed;
}

function trimRequired(value: unknown, field: string, maxLength: number, errors: InquiryValidationErrors): string | null {
  const trimmed = trimOrNull(value, maxLength);
  if (!trimmed) {
    errors[field as keyof InquiryValidationErrors] = `${field} is required`;
    return null;
  }
  return trimmed;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function jsonByteLength(value: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(value ?? {}), 'utf8');
  } catch {
    return MAX_JSON_BYTES + 1;
  }
}

function normalizeJsonObject(
  value: unknown,
  field: keyof InquiryValidationErrors,
  errors: InquiryValidationErrors
): Record<string, unknown> {
  if (value == null || value === '') {
    return {};
  }
  if (!isPlainObject(value)) {
    errors[field] = `${field} must be a JSON object`;
    return {};
  }
  if (jsonByteLength(value) > MAX_JSON_BYTES) {
    errors[field] = `${field} exceeds maximum size`;
    return {};
  }
  return value;
}

function isAllowedEnum<T extends string>(value: string, allowed: readonly T[]): value is T {
  return (allowed as readonly string[]).includes(value);
}

function isValidSourcePage(value: string): boolean {
  if (value.startsWith('/')) {
    return value.length <= MAX_SOURCE_PAGE && !value.includes(' ');
  }
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function assertNoForbiddenClientFields(body: Record<string, unknown>): InquiryValidationErrors {
  const errors: InquiryValidationErrors = {};
  for (const key of Object.keys(body)) {
    if (FORBIDDEN_CLIENT_KEYS.has(key)) {
      errors._form = `Field "${key}" is not allowed`;
      break;
    }
  }
  return errors;
}

export function validateCreateInquiryInput(raw: unknown): InquiryValidationResult {
  const errors: InquiryValidationErrors = {};

  if (!isPlainObject(raw)) {
    return { success: false, errors: { _form: 'Request body must be a JSON object' } };
  }

  Object.assign(errors, assertNoForbiddenClientFields(raw));
  if (errors._form) {
    return { success: false, errors };
  }

  const intentRaw = trimRequired(raw.intent, 'intent', 50, errors);
  const sourceTypeRaw = trimRequired(raw.sourceType, 'sourceType', 50, errors);
  const channelRaw = trimRequired(raw.channel, 'channel', 20, errors);
  const name = trimRequired(raw.name, 'name', MAX_NAME, errors);
  const emailRaw = trimRequired(raw.email, 'email', MAX_EMAIL, errors);

  if (intentRaw && !isAllowedEnum(intentRaw, INQUIRY_INTENTS)) {
    errors.intent = 'Invalid intent';
  }
  if (sourceTypeRaw && !isAllowedEnum(sourceTypeRaw, INQUIRY_SOURCE_TYPES)) {
    errors.sourceType = 'Invalid sourceType';
  }
  if (channelRaw && !isAllowedEnum(channelRaw, INQUIRY_CHANNELS)) {
    errors.channel = 'Invalid channel';
  }

  let email: string | null = null;
  if (emailRaw) {
    email = emailRaw.toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Invalid email format';
    }
  }

  const phone = trimOptionalField(raw.phone, 'phone', MAX_PHONE, errors);
  const message = trimOptionalField(raw.message, 'message', MAX_MESSAGE, errors);
  const sourceSlug = trimOrNull(raw.sourceSlug, MAX_SOURCE_SLUG);
  const sourcePageRaw = trimOrNull(raw.sourcePage, MAX_SOURCE_PAGE);
  let sourcePage: string | null = sourcePageRaw;
  if (sourcePageRaw && !isValidSourcePage(sourcePageRaw)) {
    errors.sourcePage = 'sourcePage must be an internal path or valid http(s) URL';
    sourcePage = null;
  }

  const sourceContext = normalizeJsonObject(raw.sourceContext, 'sourceContext', errors);
  const details = normalizeJsonObject(raw.details, 'details', errors);

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      intent: intentRaw as InquiryIntent,
      sourceType: sourceTypeRaw as InquirySourceType,
      sourcePage,
      sourceSlug,
      sourceContext: sourceContext as InquirySourceContext,
      channel: channelRaw as InquiryChannel,
      name: name!,
      email: email!,
      phone,
      message,
      details: details as InquiryDetails,
    },
  };
}

export function sanitizeNotificationError(error: unknown, maxLength = 500): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unknown notification error';

  const cleaned = message
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return `${cleaned.slice(0, maxLength - 3)}...`;
}
