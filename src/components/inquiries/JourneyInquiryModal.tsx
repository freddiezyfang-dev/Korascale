'use client';

import { useEffect, useMemo } from 'react';

import { useUser } from '@/context/UserContext';
import type { Journey } from '@/types';

import { getInquiryFormConfig, buildJourneyRequestContext } from './inquiryFormConfig';
import { InquiryForm } from './InquiryForm';
import { InquiryModal } from './InquiryModal';
import { JourneyInquirySummary } from './JourneyInquirySummary';
import type {
  JourneyInquiryClickPayload,
  JourneyInquiryFormMeta,
  JourneyInquirySourceCta,
  JourneyInquirySummaryData,
} from './journeyInquiryTypes';

type JourneyInquiryModalProps = {
  journey: Journey;
  isOpen: boolean;
  onClose: () => void;
  selection: JourneyInquiryClickPayload | null;
  sourceCta?: JourneyInquirySourceCta;
};

function formatLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildJourneyPath(slug: string): string {
  const normalized = slug.replace(/^journeys\//i, '').replace(/^\/+/, '').trim();
  if (!normalized) return '/journeys';
  return `/journeys/${normalized.split('/').filter(Boolean).map(encodeURIComponent).join('/')}`;
}

export function JourneyInquiryModal({
  journey,
  isOpen,
  onClose,
  selection,
  sourceCta = 'journey_detail_request',
}: JourneyInquiryModalProps) {
  const { user } = useUser();
  const config = getInquiryFormConfig('journey_request');

  const journeyPath = useMemo(() => buildJourneyPath(journey.slug), [journey.slug]);

  const context = useMemo(
    () =>
      buildJourneyRequestContext({
        sourcePage: journeyPath,
        sourceSlug: journey.slug,
        sourceCta,
      }),
    [journey.slug, journeyPath, sourceCta]
  );

  const journeyRequestMeta: JourneyInquiryFormMeta | undefined = useMemo(() => {
    if (!selection) return undefined;
    return {
      selectedDepartureId: selection.selectedDepartureId,
      preferredDate: formatLocalYmd(selection.date),
    };
  }, [selection]);

  const summary: JourneyInquirySummaryData = useMemo(() => {
    const preferredDate = selection ? formatLocalYmd(selection.date) : undefined;
    return {
      title: journey.title,
      image: journey.image || journey.images?.[0],
      duration: journey.duration,
      selectedDepartureLabel: selection?.departureLabel,
      preferredDate: selection?.selectedDepartureId ? undefined : preferredDate,
      estimatedPricePerPerson: selection?.pricePerPerson ?? journey.price,
      currency: 'USD',
    };
  }, [journey, selection]);

  const initialValues = useMemo(() => {
    return {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: user?.phone ?? '',
    };
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    const body = document.querySelector('.inquiry-modal__body');
    body?.scrollTo({ top: 0, behavior: 'instant' in window ? ('instant' as ScrollBehavior) : 'auto' });
  }, [isOpen, selection]);

  return (
    <InquiryModal isOpen={isOpen} onClose={onClose} title={config.title}>
      <div className="space-y-5">
        <JourneyInquirySummary summary={summary} />
        <InquiryForm
          config={config}
          context={context}
          journeyRequestMeta={journeyRequestMeta}
          initialValues={initialValues}
          hidePreferredDate={Boolean(selection?.selectedDepartureId)}
          resetKey={`${isOpen}-${selection?.date?.toISOString() ?? 'none'}`}
          showCloseOnSuccess
          onClose={onClose}
        />
      </div>
    </InquiryModal>
  );
}
