'use client';

import { Section, Container, Heading, Text, Button } from '@/components/common';
import { PlanTripModal, type PlanTripModalInquiryConfig } from '@/components/modals/PlanTripModal';

const FONT_SERIF = 'var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif';
const FONT_SANS = 'var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif';

type PlanYourJourneyCtaSectionProps = {
  sourcePage: string;
  inquirySourceType?: PlanTripModalInquiryConfig['sourceType'];
  isModalOpen: boolean;
  onModalOpenChange: (open: boolean) => void;
};

/**
 * Plan Your Journey CTA block at the bottom of journey list/type pages.
 * Uses explicit brand green (#1e3b32) so SSR HTML is visible without relying on bg-tertiary token scanning.
 */
export function PlanYourJourneyCtaSection({
  sourcePage,
  inquirySourceType = 'journey',
  isModalOpen,
  onModalOpenChange,
}: PlanYourJourneyCtaSectionProps) {
  return (
    <Section background="primary" padding="none" className="py-12" testId="plan-your-journey-section">
      <Container
        size="xl"
        padding="none"
        className="mx-4 flex flex-col items-center justify-between gap-6 rounded-lg bg-[#1e3b32] p-8 sm:mx-8 sm:p-10 md:flex-row lg:mx-20"
        testId="plan-your-journey-cta"
      >
        <div>
          <Heading
            level={2}
            className="mb-4 text-2xl sm:text-3xl"
            style={{ color: '#FFFFFF', fontFamily: FONT_SERIF }}
          >
            Plan your journey in China with Korascale
          </Heading>
          <Text
            className="text-sm sm:text-base"
            style={{ color: '#FFFFFF', fontFamily: FONT_SANS }}
          >
            Tell us what you are looking for and our team will craft a tailored itinerary that matches your
            interests, timing and budget.
          </Text>
        </div>
        <Button
          variant="primary"
          size="lg"
          className="rounded-lg border-2 border-white bg-transparent px-8 py-3 font-body text-sm text-white transition-all duration-300 hover:bg-white hover:text-[#1e3b32]"
          onClick={() => onModalOpenChange(true)}
        >
          PLAN YOUR JOURNEY
        </Button>
      </Container>

      <PlanTripModal
        isOpen={isModalOpen}
        onClose={() => onModalOpenChange(false)}
        inquiry={{
          intent: 'custom_journey',
          sourceType: inquirySourceType,
          sourcePage,
        }}
      />
    </Section>
  );
}
