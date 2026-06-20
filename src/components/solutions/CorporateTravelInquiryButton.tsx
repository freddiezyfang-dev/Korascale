'use client';

import { useState, type ReactNode } from 'react';

import { PlanTripModal, type PlanTripModalInquiryConfig } from '@/components/modals/PlanTripModal';
import { buildCorporateVisitContext } from '@/components/inquiries/inquiryFormConfig';

interface CorporateTravelInquiryButtonProps {
  className: string;
  children: ReactNode;
  sourceCta: 'corporate_hero' | 'corporate_bottom';
}

export function CorporateTravelInquiryButton({
  className,
  children,
  sourceCta,
}: CorporateTravelInquiryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const inquiry: PlanTripModalInquiryConfig = {
    intent: 'corporate_visit',
    sourceType: 'solution',
    sourcePage: '/solutions/corporate-travel',
    sourceContext: buildCorporateVisitContext(sourceCta).sourceContext,
  };

  return (
    <>
      <button type="button" className={className} onClick={() => setIsOpen(true)}>
        {children}
      </button>
      <PlanTripModal isOpen={isOpen} onClose={() => setIsOpen(false)} inquiry={inquiry} />
    </>
  );
}
