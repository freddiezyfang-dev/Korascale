'use client';

import { InquiryForm } from '@/components/inquiries/InquiryForm';
import {
  buildGeneralContactContext,
  getInquiryFormConfig,
} from '@/components/inquiries/inquiryFormConfig';

export function ContactInquiryForm() {
  const config = getInquiryFormConfig('general_contact');
  const context = buildGeneralContactContext();

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6 md:p-8 shadow-sm">
      <InquiryForm config={config} context={context} />
    </div>
  );
}
