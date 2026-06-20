import { query } from '@/lib/db';

import type {
  CreateInquiryInput,
  InquiryNotificationStatus,
  InquiryRecord,
} from './types';

type InquiryRow = {
  id: string;
  submission_id: string;
  intent: InquiryRecord['intent'];
  source_type: InquiryRecord['sourceType'];
  source_page: string | null;
  source_slug: string | null;
  source_context: InquiryRecord['sourceContext'];
  channel: InquiryRecord['channel'];
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  details: InquiryRecord['details'];
  status: string;
  notification_status: InquiryNotificationStatus;
  notification_provider_id: string | null;
  notification_error: string | null;
  created_at: Date;
  updated_at: Date;
};

function mapRow(row: InquiryRow): InquiryRecord {
  return {
    id: row.id,
    submissionId: row.submission_id,
    intent: row.intent,
    sourceType: row.source_type,
    sourcePage: row.source_page,
    sourceSlug: row.source_slug,
    sourceContext: row.source_context ?? {},
    channel: row.channel,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    details: row.details ?? {},
    status: row.status as InquiryRecord['status'],
    notificationStatus: row.notification_status,
    notificationProviderId: row.notification_provider_id,
    notificationError: row.notification_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function insertInquiry(
  submissionId: string,
  input: CreateInquiryInput
): Promise<InquiryRecord> {
  const { rows } = await query<InquiryRow>(
    `INSERT INTO inquiries (
      submission_id, intent, source_type, source_page, source_slug,
      source_context, channel, name, email, phone, message, details,
      status, notification_status
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6::jsonb, $7, $8, $9, $10, $11, $12::jsonb,
      'NEW', 'PENDING'
    )
    RETURNING *`,
    [
      submissionId,
      input.intent,
      input.sourceType,
      input.sourcePage,
      input.sourceSlug,
      JSON.stringify(input.sourceContext ?? {}),
      input.channel,
      input.name,
      input.email,
      input.phone,
      input.message,
      JSON.stringify(input.details ?? {}),
    ]
  );

  if (!rows[0]) {
    throw new Error('Inquiry insert returned no rows');
  }

  return mapRow(rows[0]);
}

export async function updateInquiryNotificationStatus(params: {
  submissionId: string;
  notificationStatus: InquiryNotificationStatus;
  notificationProviderId?: string | null;
  notificationError?: string | null;
}): Promise<void> {
  await query(
    `UPDATE inquiries
     SET notification_status = $2,
         notification_provider_id = $3,
         notification_error = $4,
         updated_at = NOW()
     WHERE submission_id = $1`,
    [
      params.submissionId,
      params.notificationStatus,
      params.notificationProviderId ?? null,
      params.notificationError ?? null,
    ]
  );
}

export type InquiryRepository = {
  insertInquiry: typeof insertInquiry;
  updateInquiryNotificationStatus: typeof updateInquiryNotificationStatus;
};

export const defaultInquiryRepository: InquiryRepository = {
  insertInquiry,
  updateInquiryNotificationStatus,
};
