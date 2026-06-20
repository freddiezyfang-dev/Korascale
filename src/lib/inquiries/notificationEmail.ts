import { sendTransactionalEmail } from '@/lib/email/sendTransactionalEmail';

import { getTransactionalFromEmail } from './environment';
import type { InquiryRecord } from './types';

/** Strip control chars that could break RFC 5322 headers (CR/LF injection). */
export function sanitizeEmailSubjectPart(value: string): string {
  return value.replace(/[\r\n\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Escape HTML entities for any future HTML email rendering. Inquiry emails are text/plain today. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Remove dangerous control characters from plain-text email body fields. */
export function sanitizePlainTextEmailContent(value: string): string {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
}

function formatJsonBlock(label: string, value: unknown): string {
  if (value == null) return `${label}: (none)`;
  try {
    const serialized = JSON.stringify(value, null, 2);
    return `${label}:\n${serialized}`;
  } catch {
    return `${label}: (unserializable)`;
  }
}

export function buildInquiryNotificationEmail(inquiry: InquiryRecord): {
  subject: string;
  text: string;
} {
  const subject = sanitizeEmailSubjectPart(
    `[KoraScale Inquiry ${inquiry.submissionId}] ${inquiry.intent} / ${inquiry.sourceType}`
  );

  const safeName = sanitizePlainTextEmailContent(inquiry.name);
  const safeEmail = sanitizePlainTextEmailContent(inquiry.email);
  const safePhone = inquiry.phone ? sanitizePlainTextEmailContent(inquiry.phone) : null;
  const safeMessage = inquiry.message ? sanitizePlainTextEmailContent(inquiry.message) : null;
  const safeSourcePage = inquiry.sourcePage
    ? sanitizePlainTextEmailContent(inquiry.sourcePage)
    : null;

  const text = [
    'New KoraScale Inquiry',
    '',
    `Submission ID: ${sanitizePlainTextEmailContent(inquiry.submissionId)}`,
    `Intent: ${inquiry.intent}`,
    `Source Type: ${inquiry.sourceType}`,
    `Source Page: ${safeSourcePage || '(none)'}`,
    `Source Slug: ${inquiry.sourceSlug || '(none)'}`,
    `Channel: ${inquiry.channel}`,
    '',
    `Name: ${safeName}`,
    `Email: ${safeEmail}`,
    `Phone: ${safePhone || '(none)'}`,
    '',
    `Message:`,
    safeMessage || '(none)',
    '',
    formatJsonBlock('Source Context', inquiry.sourceContext),
    '',
    formatJsonBlock('Details', inquiry.details),
    '',
    `Created At (UTC): ${inquiry.createdAt.toISOString()}`,
  ].join('\n');

  return { subject, text };
}

export type InquiryEmailSendResult =
  | { status: 'sent'; providerMessageId: string }
  | { status: 'failed'; error: string };

export async function sendInquiryNotificationEmail(
  inquiry: InquiryRecord,
  to: string
): Promise<InquiryEmailSendResult> {
  const { subject, text } = buildInquiryNotificationEmail(inquiry);
  const result = await sendTransactionalEmail({
    to,
    from: getTransactionalFromEmail(),
    replyTo: inquiry.email,
    subject,
    text,
    allowDevFallback: false,
  });

  if (result.status === 'sent') {
    return { status: 'sent', providerMessageId: result.messageId };
  }

  return { status: 'failed', error: result.error };
}

export type InquiryEmailSender = typeof sendInquiryNotificationEmail;
