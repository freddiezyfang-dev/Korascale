'use client';

import React, { useMemo } from 'react';

import {
  getInquiryFormConfig,
  buildCustomJourneyContext,
  buildCorporateVisitContext,
} from '@/components/inquiries/inquiryFormConfig';
import { InquiryForm } from '@/components/inquiries/InquiryForm';
import { InquiryModal } from '@/components/inquiries/InquiryModal';
import type { InquirySubmissionContext } from '@/components/inquiries/types';
import type { InquiryIntent, InquirySourceType } from '@/lib/inquiries/types';

export type PlanTripModalInquiryConfig = {
  intent: 'custom_journey' | 'corporate_visit';
  sourceType: InquirySourceType;
  sourcePage?: string;
  sourceSlug?: string;
  sourceContext?: Record<string, unknown>;
};

export interface PlanTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  inquiry?: PlanTripModalInquiryConfig;
}

const DEFAULT_INQUIRY: PlanTripModalInquiryConfig = {
  intent: 'custom_journey',
  sourceType: 'unknown',
};

export const PlanTripModal: React.FC<PlanTripModalProps> = ({
  isOpen,
  onClose,
  inquiry = DEFAULT_INQUIRY,
}) => {
  const resolvedContext = useMemo((): InquirySubmissionContext => {
    if (inquiry.intent === 'corporate_visit') {
      const sourceCta =
        inquiry.sourceContext?.sourceCta === 'corporate_bottom'
          ? 'corporate_bottom'
          : 'corporate_hero';
      return buildCorporateVisitContext(sourceCta, {
        sourcePage: inquiry.sourcePage,
        sourceSlug: inquiry.sourceSlug,
        sourceContext: inquiry.sourceContext,
      });
    }

    return buildCustomJourneyContext({
      sourceType: inquiry.sourceType,
      sourcePage: inquiry.sourcePage,
      sourceSlug: inquiry.sourceSlug,
      sourceContext: inquiry.sourceContext,
    });
  }, [inquiry]);

  const config = useMemo(() => {
    return getInquiryFormConfig(
      inquiry.intent === 'corporate_visit' ? 'corporate_visit' : 'custom_journey'
    );
  }, [inquiry.intent]);

  return (
    <InquiryModal isOpen={isOpen} onClose={onClose} title={config.title}>
      <InquiryForm
        config={config}
        context={resolvedContext}
        showCloseOnSuccess
        onClose={onClose}
      />
    </InquiryModal>
  );
};

export type { InquiryIntent };
