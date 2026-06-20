import { generateSubmissionId } from './submissionId';

/** Hidden field name — must match client InquiryForm honeypot input. */
export const INQUIRY_HONEYPOT_FIELD = '_companyWebsite';

export function isHoneypotTriggered(body: unknown): boolean {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return false;
  }
  const value = (body as Record<string, unknown>)[INQUIRY_HONEYPOT_FIELD];
  if (value == null) return false;
  return String(value).trim().length > 0;
}

export function stripHoneypotField(body: Record<string, unknown>): Record<string, unknown> {
  const { [INQUIRY_HONEYPOT_FIELD]: _ignored, ...rest } = body;
  return rest;
}

export function buildHoneypotSuccessResponse(): {
  success: true;
  submissionId: string;
  notificationStatus: 'skipped';
} {
  return {
    success: true,
    submissionId: generateSubmissionId(),
    notificationStatus: 'skipped',
  };
}
