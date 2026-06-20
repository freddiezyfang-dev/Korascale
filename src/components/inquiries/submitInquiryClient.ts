import { INQUIRY_HONEYPOT_FIELD } from '@/lib/inquiries/honeypot';
import type { CreateInquiryInput } from '@/lib/inquiries/types';

import {
  GENERIC_INQUIRY_ERROR,
  shouldShowInquirySuccess,
} from './inquiryFormLogic';
import type { InquiryApiErrorResponse, InquiryApiSuccessResponse } from './types';

export type SubmitInquiryClientResult =
  | { status: 'success'; submissionId: string }
  | { status: 'validation'; errors: Record<string, string> }
  | { status: 'error'; message: string };

export async function submitInquiryClient(
  payload: CreateInquiryInput,
  honeypotValue: string
): Promise<SubmitInquiryClientResult> {
  const body = {
    ...payload,
    [INQUIRY_HONEYPOT_FIELD]: honeypotValue,
  };

  let response: Response;
  try {
    response = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { status: 'error', message: GENERIC_INQUIRY_ERROR };
  }

  let data: InquiryApiSuccessResponse | InquiryApiErrorResponse;
  try {
    data = (await response.json()) as InquiryApiSuccessResponse | InquiryApiErrorResponse;
  } catch {
    return { status: 'error', message: GENERIC_INQUIRY_ERROR };
  }

  if (response.status === 201 && data.success === true) {
    if (!shouldShowInquirySuccess(data.notificationStatus)) {
      return { status: 'error', message: GENERIC_INQUIRY_ERROR };
    }
    return { status: 'success', submissionId: data.submissionId };
  }

  if (response.status === 400 && data.success === false && 'errors' in data) {
    return { status: 'validation', errors: data.errors };
  }

  if (data.success === false && 'error' in data && data.error) {
    return { status: 'error', message: GENERIC_INQUIRY_ERROR };
  }

  return { status: 'error', message: GENERIC_INQUIRY_ERROR };
}
