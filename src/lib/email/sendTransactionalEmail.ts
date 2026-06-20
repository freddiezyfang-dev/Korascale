import { trySendWithNodemailer, trySendWithResend } from '@/lib/optionalEmail';

export type TransactionalEmailResult =
  | { status: 'sent'; messageId: string; provider: 'resend' | 'smtp' | 'dev' }
  | { status: 'failed'; error: string };

export type SendTransactionalEmailInput = {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  from?: string;
  /** When true (default), unconfigured providers return dev-mode success for legacy plan-trip behavior. */
  allowDevFallback?: boolean;
};

/**
 * Shared transactional email sender used by plan-trip and inquiry notifications.
 * Preserves legacy plan-trip fallback: console log + dev-mode messageId when unconfigured.
 */
export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput
): Promise<TransactionalEmailResult> {
  const from =
    input.from ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    'noreply@korascale.com';
  const replyTo = input.replyTo || from;
  let providerError: string | null = null;

  if (process.env.RESEND_API_KEY) {
    const result = await trySendWithResend(
      process.env.RESEND_API_KEY,
      from,
      input.to,
      replyTo,
      input.subject,
      input.text
    );
    if (result?.success) {
      return {
        status: 'sent',
        messageId: result.messageId || 'sent',
        provider: 'resend',
      };
    }
    if (result && !result.success) {
      providerError = result.error;
    }
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const result = await trySendWithNodemailer(
      {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      from,
      input.to,
      replyTo,
      input.subject,
      input.text
    );
    if (result?.success) {
      return {
        status: 'sent',
        messageId: result.messageId || 'sent',
        provider: 'smtp',
      };
    }
    if (result && !result.success) {
      providerError = result.error;
    }
  }

  const allowDevFallback = input.allowDevFallback !== false;
  if (!allowDevFallback) {
    return {
      status: 'failed',
      error: providerError || 'Email provider is not configured',
    };
  }

  console.log('[Email] Dev/unconfigured send fallback', {
    toDomain: input.to.includes('@') ? input.to.split('@')[1] : 'unknown',
    subject: input.subject.slice(0, 120),
  });

  return {
    status: 'sent',
    messageId: `dev-mode-${Date.now()}`,
    provider: 'dev',
  };
}
