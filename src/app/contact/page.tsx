import Link from 'next/link';

import { Container, Section, Heading, Text } from '@/components/common';
import {
  CUSTOMER_SERVICE_EMAIL,
  WHATSAPP_NUMBER_DISPLAY,
  WHATSAPP_URL,
} from '@/lib/contactChannels';

import { ContactInquiryForm } from './ContactInquiryForm';

export const metadata = {
  title: 'Contact Us - Korascale',
  description: 'Get in touch with our travel experts for personalized assistance and support.',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <Section background="primary" padding="xl">
        <Container size="xl">
          <Heading level={1} align="center" className="mb-8">
            Contact Us
          </Heading>
          <Text align="center" size="lg" className="mb-12 max-w-2xl mx-auto">
            Ready to start your adventure? Our travel experts are here to help you plan the perfect
            journey.
          </Text>
        </Container>
      </Section>

      <Section background="secondary" padding="xl">
        <Container size="xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <Heading level={2} className="mb-8">
                Get in Touch
              </Heading>

              <div className="space-y-6">
                <div>
                  <Heading level={3} className="mb-2">
                    Email
                  </Heading>
                  <Text className="text-primary-600">
                    <a
                      href={`mailto:${CUSTOMER_SERVICE_EMAIL}`}
                      className="underline decoration-primary-600/40 underline-offset-2 hover:opacity-80"
                    >
                      {CUSTOMER_SERVICE_EMAIL}
                    </a>
                  </Text>
                </div>

                <div>
                  <Heading level={3} className="mb-2">
                    WhatsApp
                  </Heading>
                  <Text className="text-primary-600">
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-primary-600/40 underline-offset-2 hover:opacity-80"
                    >
                      {WHATSAPP_NUMBER_DISPLAY}
                    </a>
                  </Text>
                </div>

                <div>
                  <Heading level={3} className="mb-2">
                    Business Hours
                  </Heading>
                  <Text>
                    Monday - Friday: 9:00 AM - 6:00 PM
                    <br />
                    Saturday: 10:00 AM - 4:00 PM
                    <br />
                    Sunday: Closed
                  </Text>
                </div>
              </div>
            </div>

            <div>
              <Heading level={2} className="mb-4">
                Send a Message
              </Heading>
              <Text className="mb-6">
                Prefer a quick written note? Use the form below. Email and WhatsApp remain available
                if you would rather reach us directly.
              </Text>
              <ContactInquiryForm />
              <ul className="space-y-3 text-primary-600 mt-8">
                <li>
                  <Link
                    href="/journeys"
                    className="underline decoration-primary-600/40 underline-offset-2 hover:opacity-80"
                  >
                    Browse Journeys
                  </Link>
                </li>
                <li>
                  <Link
                    href="/inspirations"
                    className="underline decoration-primary-600/40 underline-offset-2 hover:opacity-80"
                  >
                    Read Inspirations
                  </Link>
                </li>
                <li>
                  <Link
                    href="/solutions/corporate-travel"
                    className="underline decoration-primary-600/40 underline-offset-2 hover:opacity-80"
                  >
                    Corporate Travel Solutions
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
