import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/email/sendTransactionalEmail', () => ({
  sendTransactionalEmail: vi.fn(),
}));

vi.mock('@/lib/inquiries/environment', () => ({
  getPublicCustomerServiceEmail: vi.fn(() => 'customer-service@korascale.com'),
}));

import { sendTransactionalEmail } from '@/lib/email/sendTransactionalEmail';
import { POST } from './route';

const validPayload = {
  departureDate: '2026-09-01',
  tripDuration: 10,
  destinations: 'Chengdu, Leshan',
  customerInfo: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phoneNumber: '+86 155 0000 0000',
    additionalNotes: 'Vegetarian meals',
  },
};

function createPostRequest(body: unknown) {
  return new Request('http://localhost/api/plan-trip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/plan-trip compatibility', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns legacy success shape when email sender succeeds', async () => {
    vi.mocked(sendTransactionalEmail).mockResolvedValueOnce({
      status: 'sent',
      messageId: 'dev-mode-1234567890',
      provider: 'dev',
    });

    const response = await POST(createPostRequest(validPayload) as never);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      message: 'Travel customization request submitted successfully',
      messageId: 'dev-mode-1234567890',
    });

    expect(sendTransactionalEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'customer-service@korascale.com',
        replyTo: 'jane@example.com',
      })
    );
  });

  it('returns legacy 500 error when email sender fails', async () => {
    vi.mocked(sendTransactionalEmail).mockResolvedValueOnce({
      status: 'failed',
      error: 'Email provider is not configured',
    });

    const response = await POST(createPostRequest(validPayload) as never);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toMatch(/try again later/i);
  });
});
