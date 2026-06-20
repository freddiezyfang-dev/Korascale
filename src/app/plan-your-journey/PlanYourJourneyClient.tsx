'use client';

import Link from 'next/link';

import { InquiryForm } from '@/components/inquiries/InquiryForm';
import {
  buildCustomJourneyContext,
  getInquiryFormConfig,
} from '@/components/inquiries/inquiryFormConfig';
import { Container, Heading, Text } from '@/components/common';
import {
  CUSTOMER_SERVICE_EMAIL,
  CUSTOMER_SERVICE_MAILTO,
  WHATSAPP_NUMBER_DISPLAY,
  WHATSAPP_URL,
} from '@/lib/contactChannels';
import type { PlanYourJourneyQueryContext } from '@/lib/inquiries/planYourJourneyQuery';

type PlanYourJourneyClientProps = {
  queryContext: PlanYourJourneyQueryContext;
};

export function PlanYourJourneyClient({ queryContext }: PlanYourJourneyClientProps) {
  const config = getInquiryFormConfig('custom_journey');
  const context = buildCustomJourneyContext({
    sourceType: queryContext.sourceType,
    sourcePage: queryContext.sourcePage,
    sourceSlug: queryContext.sourceSlug,
    sourceContext: queryContext.sourceContext,
  });

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-[#1e3b32] text-white py-16 md:py-20">
        <Container size="xl">
          <Heading level={1} align="center" className="text-white mb-4">
            Plan Your Journey
          </Heading>
          <Text align="center" size="lg" className="text-white/85 max-w-2xl mx-auto">
            Tell us about your dates, group, and destinations. Our travel team will follow up by
            email.
          </Text>
        </Container>
      </section>

      <section className="py-12 md:py-16 bg-[#f5f1e6]">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-6 md:p-8">
              <InquiryForm config={config} context={context} />
            </div>

            <aside className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <Heading level={3} className="mb-4 text-lg">
                  Prefer direct contact?
                </Heading>
                <div className="space-y-4">
                  <div>
                    <Text size="sm" className="text-gray-500 mb-1">
                      Email
                    </Text>
                    <a
                      href={CUSTOMER_SERVICE_MAILTO}
                      className="text-[#1e3b32] underline decoration-[#1e3b32]/30 underline-offset-2 hover:opacity-80"
                    >
                      {CUSTOMER_SERVICE_EMAIL}
                    </a>
                  </div>
                  <div>
                    <Text size="sm" className="text-gray-500 mb-1">
                      WhatsApp
                    </Text>
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1e3b32] underline decoration-[#1e3b32]/30 underline-offset-2 hover:opacity-80"
                    >
                      {WHATSAPP_NUMBER_DISPLAY}
                    </a>
                  </div>
                </div>
              </div>

              <Text size="sm" className="text-gray-600">
                You can also{' '}
                <Link href="/journeys" className="text-[#1e3b32] underline underline-offset-2">
                  browse journeys
                </Link>{' '}
                or read{' '}
                <Link href="/inspirations" className="text-[#1e3b32] underline underline-offset-2">
                  travel inspirations
                </Link>
                .
              </Text>
            </aside>
          </div>
        </Container>
      </section>
    </main>
  );
}
