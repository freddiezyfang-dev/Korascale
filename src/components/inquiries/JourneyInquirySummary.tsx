import { Text } from '@/components/common';

import type { JourneyInquirySummaryData } from './journeyInquiryTypes';

type JourneyInquirySummaryProps = {
  summary: JourneyInquirySummaryData;
};

export function JourneyInquirySummary({ summary }: JourneyInquirySummaryProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-[#f8f6f0] p-4 text-left">
      <div className="flex gap-4">
        {summary.image ? (
          <div className="hidden sm:block shrink-0 w-24 h-24 rounded-md overflow-hidden bg-gray-200">
            <img src={summary.image} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="text-lg font-semibold text-[#1e3b32] leading-snug">{summary.title}</h3>
          {summary.duration ? (
            <Text size="sm" align="left" className="text-gray-600">
              Duration: {summary.duration}
            </Text>
          ) : null}
          {summary.selectedDepartureLabel ? (
            <Text size="sm" align="left" className="text-gray-600">
              Selected departure: {summary.selectedDepartureLabel}
            </Text>
          ) : summary.preferredDate ? (
            <Text size="sm" align="left" className="text-gray-600">
              Preferred travel date: {summary.preferredDate}
            </Text>
          ) : null}
          {summary.estimatedPricePerPerson != null ? (
            <Text size="sm" align="left" className="text-gray-700">
              Estimated from{' '}
              <span className="font-medium">
                {summary.currency ?? 'USD'} ${summary.estimatedPricePerPerson.toLocaleString()}
              </span>{' '}
              per person
            </Text>
          ) : null}
          <Text size="xs" align="left" className="text-gray-500">
            Final availability and pricing will be confirmed by our team.
          </Text>
        </div>
      </div>
    </div>
  );
}
