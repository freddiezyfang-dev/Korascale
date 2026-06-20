export type InquiryNotificationRouting =
  | { action: 'send'; to: string; environment: 'production' | 'test' }
  | { action: 'skip'; reason: string }
  | { action: 'fail'; reason: string };

export function isPreviewLikeEnvironment(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === 'preview' || vercelEnv === 'development') {
    return true;
  }
  return process.env.NODE_ENV !== 'production';
}

export function resolveInquiryNotificationRouting(): InquiryNotificationRouting {
  const testRecipient = process.env.INQUIRY_TEST_NOTIFICATION_TO?.trim();
  const productionRecipient = process.env.INQUIRY_NOTIFICATION_TO?.trim();

  if (isPreviewLikeEnvironment()) {
    if (testRecipient) {
      return { action: 'send', to: testRecipient, environment: 'test' };
    }
    return {
      action: 'skip',
      reason: 'Preview/development without INQUIRY_TEST_NOTIFICATION_TO',
    };
  }

  if (productionRecipient) {
    return { action: 'send', to: productionRecipient, environment: 'production' };
  }

  return {
    action: 'fail',
    reason: 'Production INQUIRY_NOTIFICATION_TO is not configured',
  };
}

/** Public-facing customer service address (not used for internal inquiry alerts). */
export function getPublicCustomerServiceEmail(): string {
  return process.env.CUSTOMER_SERVICE_EMAIL?.trim() || 'customer-service@korascale.com';
}

export function getTransactionalFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || process.env.SMTP_FROM?.trim() || 'noreply@korascale.com';
}
