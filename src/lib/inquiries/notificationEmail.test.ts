import { describe, expect, it } from 'vitest';

import {
  buildInquiryNotificationEmail,
  escapeHtml,
  sanitizeEmailSubjectPart,
  sanitizePlainTextEmailContent,
} from './notificationEmail';
import type { InquiryRecord } from './types';

function buildInquiry(overrides: Partial<InquiryRecord> = {}): InquiryRecord {
  const now = new Date('2026-06-19T10:00:00.000Z');
  return {
    id: '00000000-0000-4000-8000-000000000001',
    submissionId: 'KS-20260619-TEST01',
    intent: 'general_contact',
    sourceType: 'contact',
    sourcePage: '/contact',
    sourceSlug: null,
    sourceContext: {},
    channel: 'form',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+86 155 0000 0000',
    message: 'Hello <script>alert(1)</script>',
    details: {},
    status: 'NEW',
    notificationStatus: 'PENDING',
    notificationProviderId: null,
    notificationError: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('notificationEmail sanitization', () => {
  it('escapes HTML entities for HTML rendering helpers', () => {
    expect(escapeHtml('<b>"x"&\'</b>')).toBe('&lt;b&gt;&quot;x&quot;&amp;&#39;&lt;/b&gt;');
  });

  it('strips header injection characters from email subject parts', () => {
    const malicious = 'general_contact\r\nBcc: attacker@evil.com';
    expect(sanitizeEmailSubjectPart(malicious)).toBe('general_contact Bcc: attacker@evil.com');
    expect(sanitizeEmailSubjectPart(malicious)).not.toMatch(/\r|\n/);
  });

  it('builds a subject without CR/LF even when values contain them', () => {
    const { subject } = buildInquiryNotificationEmail(
      buildInquiry({
        submissionId: 'KS-20260619-ABC123',
        intent: 'general_contact',
        sourceType: 'contact',
      })
    );
    expect(subject).not.toMatch(/\r|\n/);
    expect(subject).toContain('KS-20260619-ABC123');
  });

  it('sanitizes user-controlled plain-text body fields', () => {
    const { text } = buildInquiryNotificationEmail(
      buildInquiry({
        name: 'Jane\u0000Doe',
        message: 'Hello <script>alert(1)</script>',
      })
    );

    expect(text).toContain('JaneDoe');
    expect(text).toContain('Hello <script>alert(1)</script>');
    expect(text).not.toContain('\u0000');
    expect(sanitizePlainTextEmailContent('a\u0007b')).toBe('ab');
  });

  it('marks journey request prices as estimates in notification email', () => {
    const { subject, text } = buildInquiryNotificationEmail(
      buildInquiry({
        intent: 'journey_request',
        sourceType: 'journey',
        sourcePage: '/journeys/tibetan-plateau-discovery',
        sourceSlug: 'tibetan-plateau-discovery',
        sourceContext: {
          sourceCta: 'journey_detail_request',
          journeyTitle: 'Tibetan Plateau Discovery',
          journeySlug: 'tibetan-plateau-discovery',
          journeyUrl: '/journeys/tibetan-plateau-discovery',
          journeyType: 'Deep Discovery',
        },
        details: {
          adults: 2,
          children: 0,
          departureLabel: 'Sep 1, 2026 – Sep 12, 2026',
          estimatedPricePerPerson: 4800,
          estimatedTotal: 9600,
          currency: 'USD',
          priceVerification: 'estimated',
        },
      })
    );

    expect(subject).toContain('Journey Request');
    expect(subject).toContain('Tibetan Plateau Discovery');
    expect(text).toContain('Estimated price:');
    expect(text).toContain('NOT a confirmed total');
    expect(text).toContain('Selected departure:');
    expect(text).not.toContain('Booking confirmed');
  });
});
