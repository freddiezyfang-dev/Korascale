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

function readContextString(context: Record<string, unknown>, key: string): string | null {
  const value = context[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readDetailsString(details: Record<string, unknown>, key: string): string | null {
  const value = details[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readDetailsNumber(details: Record<string, unknown>, key: string): number | null {
  const value = details[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatEstimatedPriceLine(details: Record<string, unknown>): string {
  const perPerson = readDetailsNumber(details, 'estimatedPricePerPerson');
  const total = readDetailsNumber(details, 'estimatedTotal');
  const currency = readDetailsString(details, 'currency') ?? 'USD';
  const verification = readDetailsString(details, 'priceVerification');

  if (perPerson == null && total == null) {
    return 'Estimated price: (none — to be confirmed by team)';
  }

  const parts: string[] = [];
  if (perPerson != null) {
    parts.push(`${currency} ${perPerson.toLocaleString('en-US')} per person (estimate)`);
  }
  if (total != null) {
    parts.push(`${currency} ${total.toLocaleString('en-US')} total (estimate)`);
  }
  if (verification) {
    parts.push(`verification: ${verification}`);
  }
  return `Estimated price: ${parts.join('; ')} — NOT a confirmed total`;
}

function buildJourneyRequestNotificationText(inquiry: InquiryRecord): string {
  const context = (inquiry.sourceContext ?? {}) as Record<string, unknown>;
  const details = (inquiry.details ?? {}) as Record<string, unknown>;

  const safeName = sanitizePlainTextEmailContent(inquiry.name);
  const safeEmail = sanitizePlainTextEmailContent(inquiry.email);
  const safePhone = inquiry.phone ? sanitizePlainTextEmailContent(inquiry.phone) : null;
  const safeMessage = inquiry.message ? sanitizePlainTextEmailContent(inquiry.message) : null;
  const safeSourcePage = inquiry.sourcePage
    ? sanitizePlainTextEmailContent(inquiry.sourcePage)
    : null;

  const journeyTitle = readContextString(context, 'journeyTitle');
  const journeySlug = readContextString(context, 'journeySlug') ?? inquiry.sourceSlug;
  const journeyUrl = readContextString(context, 'journeyUrl');
  const journeyType = readContextString(context, 'journeyType');
  const departureLabel = readDetailsString(details, 'departureLabel');
  const preferredDate = readDetailsString(details, 'preferredDate');
  const adults = readDetailsNumber(details, 'adults');
  const children = readDetailsNumber(details, 'children');

  return [
    'New KoraScale Journey Request',
    '',
    `Submission ID: ${sanitizePlainTextEmailContent(inquiry.submissionId)}`,
    `Intent: ${inquiry.intent}`,
    '',
    `Journey title: ${journeyTitle || '(none)'}`,
    `Journey slug: ${journeySlug || '(none)'}`,
    `Journey URL: ${journeyUrl || safeSourcePage || '(none)'}`,
    `Journey type: ${journeyType || '(none)'}`,
    '',
    departureLabel
      ? `Selected departure: ${sanitizePlainTextEmailContent(departureLabel)}`
      : preferredDate
        ? `Preferred travel date: ${sanitizePlainTextEmailContent(preferredDate)}`
        : 'Travel date: (none)',
    `Adults: ${adults ?? '(none)'}`,
    `Children: ${children ?? '(none)'}`,
    formatEstimatedPriceLine(details),
    '',
    `Name: ${safeName}`,
    `Email: ${safeEmail}`,
    `Phone: ${safePhone || '(none)'}`,
    '',
    'Message / special requests:',
    safeMessage || '(none)',
    '',
    `Source page: ${safeSourcePage || '(none)'}`,
    `Source CTA: ${readContextString(context, 'sourceCta') || '(none)'}`,
    '',
    formatJsonBlock('Source Context', inquiry.sourceContext),
    '',
    formatJsonBlock('Details', inquiry.details),
    '',
    `Created At (UTC): ${inquiry.createdAt.toISOString()}`,
  ].join('\n');
}

export function buildInquiryNotificationEmail(inquiry: InquiryRecord): {
  subject: string;
  text: string;
} {
  const journeyTitle =
    inquiry.intent === 'journey_request'
      ? readContextString((inquiry.sourceContext ?? {}) as Record<string, unknown>, 'journeyTitle')
      : null;

  const subject = sanitizeEmailSubjectPart(
    inquiry.intent === 'journey_request' && journeyTitle
      ? `[KoraScale Journey Request ${inquiry.submissionId}] ${journeyTitle}`
      : `[KoraScale Inquiry ${inquiry.submissionId}] ${inquiry.intent} / ${inquiry.sourceType}`
  );

  if (inquiry.intent === 'journey_request') {
    return { subject, text: buildJourneyRequestNotificationText(inquiry) };
  }

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
