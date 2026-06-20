import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { validateCreateInquiryInput } from './schema';

describe('validateCreateInquiryInput', () => {
  const validBase = {
    intent: 'general_contact',
    sourceType: 'contact',
    channel: 'form',
    name: 'Jane Doe',
    email: 'jane@example.com',
  };

  it('accepts a valid general inquiry', () => {
    const result = validateCreateInquiryInput({
      ...validBase,
      message: 'Hello team',
      sourcePage: '/contact',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('jane@example.com');
      expect(result.data.message).toBe('Hello team');
    }
  });

  it('accepts a valid journey inquiry with details', () => {
    const result = validateCreateInquiryInput({
      intent: 'journey_request',
      sourceType: 'journey',
      channel: 'form',
      name: 'John Smith',
      email: 'john@example.com',
      sourcePage: '/journeys/sample-journey',
      sourceSlug: 'sample-journey',
      sourceContext: {
        journeySlug: 'sample-journey',
        journeyTitle: 'Sample Journey',
      },
      details: {
        selectedDate: '2026-09-01',
        adults: 2,
        children: 0,
        finalPrice: 1200,
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = validateCreateInquiryInput({
      ...validBase,
      email: 'not-an-email',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.email).toBeTruthy();
    }
  });

  it('rejects invalid intent', () => {
    const result = validateCreateInquiryInput({
      ...validBase,
      intent: 'book_now',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.intent).toBeTruthy();
    }
  });

  it('rejects overly long message', () => {
    const result = validateCreateInquiryInput({
      ...validBase,
      message: 'x'.repeat(5001),
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.message).toBeTruthy();
    }
  });

  it('rejects client-provided status fields', () => {
    const result = validateCreateInquiryInput({
      ...validBase,
      status: 'PROCESSED',
      notificationStatus: 'SENT',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._form).toMatch(/not allowed/i);
    }
  });

  it('rejects oversized details object', () => {
    const hugeDetails: Record<string, string> = {};
    for (let i = 0; i < 500; i += 1) {
      hugeDetails[`field_${i}`] = 'x'.repeat(40);
    }

    const result = validateCreateInquiryInput({
      ...validBase,
      details: hugeDetails,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.details).toBeTruthy();
    }
  });
});

describe('generateSubmissionId', () => {
  it('uses KS-YYYYMMDD-XXXXXX format', async () => {
    const { generateSubmissionId, isValidSubmissionIdFormat } = await import('./submissionId');
    const id = generateSubmissionId(new Date('2026-06-19T12:00:00.000Z'));
    expect(id.startsWith('KS-20260619-')).toBe(true);
    expect(isValidSubmissionIdFormat(id)).toBe(true);
  });
});

describe('resolveInquiryNotificationRouting', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('skips in preview when test inbox is missing', async () => {
    process.env.VERCEL_ENV = 'preview';
    delete process.env.INQUIRY_TEST_NOTIFICATION_TO;

    const { resolveInquiryNotificationRouting } = await import('./environment');
    expect(resolveInquiryNotificationRouting()).toEqual({
      action: 'skip',
      reason: 'Preview/development without INQUIRY_TEST_NOTIFICATION_TO',
    });
  });
});
