import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  InquiryPersistenceError,
  InquiryValidationError,
  submitInquiry,
  type SubmitInquiryDependencies,
} from './submitInquiry';
import type { InquiryRecord } from './types';

vi.mock('./journeyRequestEnrichment', () => ({
  enrichJourneyRequestInput: vi.fn(async (input: CreateInquiryInput) => input),
}));

import type { CreateInquiryInput } from './types';
import { enrichJourneyRequestInput } from './journeyRequestEnrichment';

const baseInput = {
  intent: 'general_contact',
  sourceType: 'contact',
  channel: 'form',
  name: 'Jane Doe',
  email: 'jane@example.com',
  message: 'Need help planning',
};

function buildRecord(submissionId: string): InquiryRecord {
  const now = new Date('2026-06-19T10:00:00.000Z');
  return {
    id: '00000000-0000-4000-8000-000000000001',
    submissionId,
    intent: 'general_contact',
    sourceType: 'contact',
    sourcePage: null,
    sourceSlug: null,
    sourceContext: {},
    channel: 'form',
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: null,
    message: 'Need help planning',
    details: {},
    status: 'NEW',
    notificationStatus: 'PENDING',
    notificationProviderId: null,
    notificationError: null,
    createdAt: now,
    updatedAt: now,
  };
}

function createDeps(overrides: Partial<SubmitInquiryDependencies> = {}): SubmitInquiryDependencies {
  const submissionId = 'KS-20260619-TEST01';
  return {
    repository: {
      insertInquiry: vi.fn(async () => buildRecord(submissionId)),
      updateInquiryNotificationStatus: vi.fn(async () => undefined),
    },
    sendNotificationEmail: vi.fn(async () => ({
      status: 'sent' as const,
      providerMessageId: 'msg-123',
    })),
    generateId: vi.fn(() => submissionId),
    resolveRouting: vi.fn(() => ({
      action: 'send' as const,
      to: 'test-inbox@example.com',
      environment: 'test' as const,
    })),
    ...overrides,
  };
}

describe('submitInquiry service', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('persists inquiry and marks notification as sent on email success', async () => {
    const deps = createDeps();
    const result = await submitInquiry(baseInput, deps);

    expect(result).toEqual({
      submissionId: 'KS-20260619-TEST01',
      notificationStatus: 'sent',
    });
    expect(deps.repository.insertInquiry).toHaveBeenCalledOnce();
    expect(deps.sendNotificationEmail).toHaveBeenCalledOnce();
    expect(deps.repository.updateInquiryNotificationStatus).toHaveBeenCalledWith(
      expect.objectContaining({ notificationStatus: 'SENT', notificationProviderId: 'msg-123' })
    );
  });

  it('keeps inquiry saved when email fails', async () => {
    const deps = createDeps({
      sendNotificationEmail: vi.fn(async () => ({
        status: 'failed' as const,
        error: 'Provider unavailable',
      })),
    });

    const result = await submitInquiry(baseInput, deps);

    expect(result.notificationStatus).toBe('failed');
    expect(deps.repository.insertInquiry).toHaveBeenCalledOnce();
    expect(deps.repository.updateInquiryNotificationStatus).toHaveBeenCalledWith(
      expect.objectContaining({ notificationStatus: 'FAILED' })
    );
  });

  it('does not send email when persistence fails', async () => {
    const deps = createDeps({
      repository: {
        insertInquiry: vi.fn(async () => {
          throw new Error('db down');
        }),
        updateInquiryNotificationStatus: vi.fn(async () => undefined),
      },
    });

    await expect(submitInquiry(baseInput, deps)).rejects.toBeInstanceOf(InquiryPersistenceError);
    expect(deps.sendNotificationEmail).not.toHaveBeenCalled();
  });

  it('skips notification in preview without test inbox', async () => {
    const deps = createDeps({
      resolveRouting: vi.fn(() => ({
        action: 'skip' as const,
        reason: 'Preview/development without INQUIRY_TEST_NOTIFICATION_TO',
      })),
    });

    const result = await submitInquiry(baseInput, deps);

    expect(result.notificationStatus).toBe('skipped');
    expect(deps.sendNotificationEmail).not.toHaveBeenCalled();
    expect(deps.repository.updateInquiryNotificationStatus).toHaveBeenCalledWith(
      expect.objectContaining({ notificationStatus: 'SKIPPED' })
    );
  });

  it('throws validation error for invalid payload', async () => {
    const deps = createDeps();
    await expect(submitInquiry({ ...baseInput, email: 'bad' }, deps)).rejects.toBeInstanceOf(
      InquiryValidationError
    );
    expect(deps.repository.insertInquiry).not.toHaveBeenCalled();
  });

  it('uses unique submissionId format from generator', async () => {
    const deps = createDeps({
      generateId: vi.fn(() => 'KS-20260619-ABC123'),
    });

    const result = await submitInquiry(baseInput, deps);
    expect(result.submissionId).toBe('KS-20260619-ABC123');
  });

  it('retries insert when submissionId unique constraint conflicts', async () => {
    const firstId = 'KS-20260619-DUP001';
    const secondId = 'KS-20260619-DUP002';
    const generateId = vi
      .fn()
      .mockReturnValueOnce(firstId)
      .mockReturnValueOnce(secondId);

    const uniqueError = Object.assign(new Error('duplicate key'), { code: '23505' });
    const insertInquiry = vi
      .fn()
      .mockRejectedValueOnce(uniqueError)
      .mockResolvedValueOnce(buildRecord(secondId));

    const deps = createDeps({
      generateId,
      repository: {
        insertInquiry,
        updateInquiryNotificationStatus: vi.fn(async () => undefined),
      },
    });

    const result = await submitInquiry(baseInput, deps);

    expect(result.submissionId).toBe(secondId);
    expect(insertInquiry).toHaveBeenCalledTimes(2);
    expect(generateId).toHaveBeenCalledTimes(2);
  });

  it('still returns success when notification status update fails after email success', async () => {
    const deps = createDeps({
      repository: {
        insertInquiry: vi.fn(async () => buildRecord('KS-20260619-TEST01')),
        updateInquiryNotificationStatus: vi.fn(async () => {
          throw new Error('update failed');
        }),
      },
    });

    const result = await submitInquiry(baseInput, deps);

    expect(result).toEqual({
      submissionId: 'KS-20260619-TEST01',
      notificationStatus: 'sent',
    });
    expect(deps.sendNotificationEmail).toHaveBeenCalledOnce();
  });

  it('keeps inquiry saved when production routing fails without internal inbox', async () => {
    const deps = createDeps({
      resolveRouting: vi.fn(() => ({
        action: 'fail' as const,
        reason: 'Production INQUIRY_NOTIFICATION_TO is not configured',
      })),
    });

    const result = await submitInquiry(baseInput, deps);

    expect(result.notificationStatus).toBe('failed');
    expect(deps.repository.insertInquiry).toHaveBeenCalledOnce();
    expect(deps.sendNotificationEmail).not.toHaveBeenCalled();
    expect(deps.repository.updateInquiryNotificationStatus).toHaveBeenCalledWith(
      expect.objectContaining({ notificationStatus: 'FAILED' })
    );
  });

  it('runs journey_request enrichment before persistence', async () => {
    const enrichedInput: CreateInquiryInput = {
      intent: 'journey_request',
      sourceType: 'journey',
      sourcePage: '/journeys/sample-journey',
      sourceSlug: 'sample-journey',
      channel: 'form',
      name: 'Jane Doe',
      email: 'jane@example.com',
      sourceContext: {
        sourceCta: 'journey_detail_request',
        journeyTitle: 'Sample Journey',
      },
      details: { adults: 2, children: 0 },
    };

    vi.mocked(enrichJourneyRequestInput).mockResolvedValueOnce(enrichedInput);

    const deps = createDeps();
    const rawInput = {
      intent: 'journey_request',
      sourceType: 'journey',
      sourcePage: '/journeys/sample-journey',
      sourceSlug: 'sample-journey',
      channel: 'form',
      name: 'Jane Doe',
      email: 'jane@example.com',
      details: { adults: 2, children: 0 },
    };

    const result = await submitInquiry(rawInput, deps);

    expect(enrichJourneyRequestInput).toHaveBeenCalledOnce();
    expect(deps.repository.insertInquiry).toHaveBeenCalledWith(
      'KS-20260619-TEST01',
      enrichedInput
    );
    expect(result.submissionId).toBe('KS-20260619-TEST01');
  });
});
