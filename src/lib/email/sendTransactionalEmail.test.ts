import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/optionalEmail', () => ({
  trySendWithResend: vi.fn(async () => null),
  trySendWithNodemailer: vi.fn(async () => null),
}));

describe('sendTransactionalEmail', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('NODE_ENV', 'development');
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.VERCEL_ENV;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns dev-mode success when no provider is configured (plan-trip legacy behavior)', async () => {
    const { sendTransactionalEmail } = await import('./sendTransactionalEmail');
    const result = await sendTransactionalEmail({
      to: 'customer-service@korascale.com',
      replyTo: 'guest@example.com',
      subject: 'Test',
      text: 'Body',
    });

    expect(result.status).toBe('sent');
    if (result.status === 'sent') {
      expect(result.provider).toBe('dev');
      expect(result.messageId.startsWith('dev-mode-')).toBe(true);
    }
  });

  it('uses Resend when RESEND_API_KEY is configured', async () => {
    const { trySendWithResend } = await import('@/lib/optionalEmail');
    vi.mocked(trySendWithResend).mockResolvedValueOnce({
      success: true,
      messageId: 'resend-abc',
    });
    process.env.RESEND_API_KEY = 're_test_key';

    const { sendTransactionalEmail } = await import('./sendTransactionalEmail');
    const result = await sendTransactionalEmail({
      to: 'inbox@example.com',
      subject: 'Inquiry',
      text: 'Body',
    });

    expect(result).toEqual({
      status: 'sent',
      messageId: 'resend-abc',
      provider: 'resend',
    });
  });
});
