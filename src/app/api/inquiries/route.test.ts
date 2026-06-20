import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/inquiries/submitInquiry', () => {
  class InquiryValidationError extends Error {
    errors: Record<string, string>;

    constructor(errors: Record<string, string>) {
      super('Inquiry validation failed');
      this.name = 'InquiryValidationError';
      this.errors = errors;
    }
  }

  class InquiryPersistenceError extends Error {
    constructor(message = 'Failed to persist inquiry') {
      super(message);
      this.name = 'InquiryPersistenceError';
    }
  }

  return {
    InquiryValidationError,
    InquiryPersistenceError,
    submitInquiry: vi.fn(),
  };
});

import { POST, GET } from './route';
import {
  InquiryPersistenceError,
  InquiryValidationError,
  submitInquiry,
} from '@/lib/inquiries/submitInquiry';

function createPostRequest(body: unknown) {
  return new Request('http://localhost/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/inquiries', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 201 for valid request', async () => {
    vi.mocked(submitInquiry).mockResolvedValueOnce({
      submissionId: 'KS-20260619-API001',
      notificationStatus: 'sent',
    });

    const response = await POST(createPostRequest({
      intent: 'general_contact',
      sourceType: 'contact',
      channel: 'form',
      name: 'Jane Doe',
      email: 'jane@example.com',
    }) as never);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      submissionId: 'KS-20260619-API001',
      notificationStatus: 'sent',
    });
  });

  it('returns 400 for validation failures', async () => {
    vi.mocked(submitInquiry).mockRejectedValueOnce(
      new InquiryValidationError({ email: 'Invalid email format' })
    );

    const response = await POST(createPostRequest({ email: 'bad' }) as never);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.errors.email).toBeTruthy();
  });

  it('returns safe 500 for persistence failures', async () => {
    vi.mocked(submitInquiry).mockRejectedValueOnce(new InquiryPersistenceError());

    const response = await POST(
      createPostRequest({
        intent: 'general_contact',
        sourceType: 'contact',
        channel: 'form',
        name: 'Jane Doe',
        email: 'jane@example.com',
      }) as never
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toMatch(/try again later/i);
    expect(JSON.stringify(body)).not.toMatch(/POSTGRES/i);
  });

  it('returns success=true when notification failed but inquiry saved', async () => {
    vi.mocked(submitInquiry).mockResolvedValueOnce({
      submissionId: 'KS-20260619-API002',
      notificationStatus: 'failed',
    });

    const response = await POST(
      createPostRequest({
        intent: 'general_contact',
        sourceType: 'contact',
        channel: 'form',
        name: 'Jane Doe',
        email: 'jane@example.com',
      }) as never
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.notificationStatus).toBe('failed');
    expect(body.submissionId).toBeTruthy();
    expect(body).not.toHaveProperty('notificationError');
  });

  it('rejects unsupported methods', async () => {
    const response = await GET();
    expect(response.status).toBe(405);
  });

  it('returns 400 for malformed JSON', async () => {
    const response = await POST(
      new Request('http://localhost/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not-json',
      }) as never
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.errors._form).toMatch(/invalid json/i);
  });
});
