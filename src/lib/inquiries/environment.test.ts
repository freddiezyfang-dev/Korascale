import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('resolveInquiryNotificationRouting', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('never routes preview traffic to INQUIRY_NOTIFICATION_TO without test inbox', async () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.INQUIRY_NOTIFICATION_TO = 'real-ops@korascale.com';
    delete process.env.INQUIRY_TEST_NOTIFICATION_TO;

    const { resolveInquiryNotificationRouting } = await import('./environment');
    expect(resolveInquiryNotificationRouting()).toEqual({
      action: 'skip',
      reason: 'Preview/development without INQUIRY_TEST_NOTIFICATION_TO',
    });
  });

  it('uses test inbox in preview even when production inbox is configured', async () => {
    process.env.VERCEL_ENV = 'preview';
    process.env.INQUIRY_NOTIFICATION_TO = 'real-ops@korascale.com';
    process.env.INQUIRY_TEST_NOTIFICATION_TO = 'preview-inbox@example.com';

    const { resolveInquiryNotificationRouting } = await import('./environment');
    expect(resolveInquiryNotificationRouting()).toEqual({
      action: 'send',
      to: 'preview-inbox@example.com',
      environment: 'test',
    });
  });

  it('marks production routing as fail when internal inbox is missing', async () => {
    process.env.VERCEL_ENV = 'production';
    process.env.NODE_ENV = 'production';
    delete process.env.INQUIRY_NOTIFICATION_TO;
    delete process.env.INQUIRY_TEST_NOTIFICATION_TO;

    const { resolveInquiryNotificationRouting } = await import('./environment');
    expect(resolveInquiryNotificationRouting()).toEqual({
      action: 'fail',
      reason: 'Production INQUIRY_NOTIFICATION_TO is not configured',
    });
  });
});
