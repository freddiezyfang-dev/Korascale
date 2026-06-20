import type { Metadata } from 'next';
import Link from 'next/link';

import { Container, Section, Heading, Text, Button } from '@/components/common';

export const metadata: Metadata = {
  title: 'Checkout - KoraScale',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Section background="primary" padding="xl">
        <Container size="xl">
          <div className="max-w-2xl mx-auto text-center">
            <Heading level={1} className="mb-4">
              Online Checkout Unavailable
            </Heading>
            <Text size="lg" className="mb-8">
              We do not process payments through this page. To request a journey or discuss your
              travel plans, please use one of the options below.
            </Text>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/journeys">
                <Button variant="primary">Browse Journeys</Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline">Contact Us</Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
