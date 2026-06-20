import { resolveInquiryNotificationRouting } from './environment';
import { InquiryPersistenceError, InquiryValidationError } from './errors';
import { enrichJourneyRequestInput } from './journeyRequestEnrichment';
import { sendInquiryNotificationEmail, type InquiryEmailSender } from './notificationEmail';
import {
  defaultInquiryRepository,
  type InquiryRepository,
} from './repository';
import { sanitizeNotificationError, validateCreateInquiryInput } from './schema';
import { generateSubmissionId } from './submissionId';
import type {
  CreateInquiryInput,
  InquiryNotificationStatus,
  SubmitInquiryResult,
} from './types';

export { InquiryPersistenceError, InquiryValidationError } from './errors';

function toPublicNotificationStatus(
  status: InquiryNotificationStatus
): SubmitInquiryResult['notificationStatus'] {
  return status.toLowerCase() as SubmitInquiryResult['notificationStatus'];
}

export type SubmitInquiryDependencies = {
  repository: InquiryRepository;
  sendNotificationEmail: InquiryEmailSender;
  generateId: () => string;
  resolveRouting: typeof resolveInquiryNotificationRouting;
};

export const defaultSubmitInquiryDependencies: SubmitInquiryDependencies = {
  repository: defaultInquiryRepository,
  sendNotificationEmail: sendInquiryNotificationEmail,
  generateId: generateSubmissionId,
  resolveRouting: resolveInquiryNotificationRouting,
};

const MAX_INSERT_ATTEMPTS = 3;

function isSubmissionIdUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === '23505'
  );
}

async function safeUpdateNotificationStatus(
  deps: SubmitInquiryDependencies,
  submissionId: string,
  intent: CreateInquiryInput['intent'],
  params: Parameters<InquiryRepository['updateInquiryNotificationStatus']>[0]
): Promise<void> {
  try {
    await deps.repository.updateInquiryNotificationStatus(params);
  } catch {
    console.error('[Inquiry] notification status update failed', {
      submissionId,
      intent,
      code: 'INQUIRY_NOTIFICATION_UPDATE_FAILED',
      targetStatus: params.notificationStatus,
    });
  }
}

export async function submitInquiry(
  rawInput: unknown,
  deps: SubmitInquiryDependencies = defaultSubmitInquiryDependencies
): Promise<SubmitInquiryResult> {
  const validation = validateCreateInquiryInput(rawInput);
  if (!validation.success) {
    throw new InquiryValidationError(validation.errors);
  }

  const inputBase: CreateInquiryInput = validation.data;

  let input: CreateInquiryInput = inputBase;
  if (inputBase.intent === 'journey_request') {
    input = await enrichJourneyRequestInput(inputBase);
  }

  let record;
  let submissionId = '';
  try {
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_INSERT_ATTEMPTS; attempt += 1) {
      submissionId = deps.generateId();
      try {
        record = await deps.repository.insertInquiry(submissionId, input);
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        if (isSubmissionIdUniqueViolation(error) && attempt < MAX_INSERT_ATTEMPTS - 1) {
          continue;
        }
        throw error;
      }
    }
    if (!record) {
      throw lastError ?? new Error('Inquiry insert returned no record');
    }
  } catch {
    console.error('[Inquiry] persistence failed', {
      submissionId: submissionId || 'unknown',
      intent: input.intent,
      code: 'INQUIRY_INSERT_FAILED',
    });
    throw new InquiryPersistenceError();
  }

  const routing = deps.resolveRouting();

  if (routing.action === 'skip') {
    await safeUpdateNotificationStatus(deps, submissionId, input.intent, {
      submissionId,
      notificationStatus: 'SKIPPED',
      notificationError: routing.reason,
    });

    console.log('[Inquiry] notification skipped', {
      submissionId,
      intent: input.intent,
      notificationStatus: 'SKIPPED',
      reason: routing.reason,
    });

    return {
      submissionId,
      notificationStatus: toPublicNotificationStatus('SKIPPED'),
    };
  }

  if (routing.action === 'fail') {
    const errorSummary = sanitizeNotificationError(routing.reason);
    await safeUpdateNotificationStatus(deps, submissionId, input.intent, {
      submissionId,
      notificationStatus: 'FAILED',
      notificationError: errorSummary,
    });

    console.error('[Inquiry] notification routing failed', {
      submissionId,
      intent: input.intent,
      notificationStatus: 'FAILED',
      code: 'INQUIRY_RECIPIENT_NOT_CONFIGURED',
    });

    return {
      submissionId,
      notificationStatus: toPublicNotificationStatus('FAILED'),
    };
  }

  const emailResult = await deps.sendNotificationEmail(record, routing.to);

  if (emailResult.status === 'sent') {
    await safeUpdateNotificationStatus(deps, submissionId, input.intent, {
      submissionId,
      notificationStatus: 'SENT',
      notificationProviderId: emailResult.providerMessageId,
      notificationError: null,
    });

    console.log('[Inquiry] notification sent', {
      submissionId,
      intent: input.intent,
      notificationStatus: 'SENT',
      providerMessageId: emailResult.providerMessageId,
      environment: routing.environment,
    });

    return {
      submissionId,
      notificationStatus: toPublicNotificationStatus('SENT'),
    };
  }

  const errorSummary = sanitizeNotificationError(emailResult.error);
  await safeUpdateNotificationStatus(deps, submissionId, input.intent, {
    submissionId,
    notificationStatus: 'FAILED',
    notificationError: errorSummary,
  });

  console.error('[Inquiry] notification failed', {
    submissionId,
    intent: input.intent,
    notificationStatus: 'FAILED',
    code: 'INQUIRY_EMAIL_FAILED',
  });

  return {
    submissionId,
    notificationStatus: toPublicNotificationStatus('FAILED'),
  };
}
