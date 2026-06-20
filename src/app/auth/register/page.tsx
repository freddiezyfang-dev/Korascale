import type { Metadata } from 'next';
import Link from 'next/link';

import { Container, Section, Heading, Text, Button } from '@/components/common';

export const metadata: Metadata = {
  title: 'Client Access - KoraScale',
  description:
    'KoraScale client access is available by invitation for confirmed journeys and corporate visits.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-white">
      <Section background="primary" padding="xl">
        <Container size="sm">
          <div className="text-left mb-8 space-y-4">
            <Heading level={1}>Client Access Is Available by Invitation</Heading>
            <Text size="lg" className="text-gray-700 leading-relaxed">
              KoraScale creates client access for confirmed journeys and corporate visits. To start
              planning, send us your travel or visit requirements first.
            </Text>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/plan-your-journey">
              <Button variant="primary" className="w-full sm:w-auto">
                Plan Your Journey
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" className="w-full sm:w-auto">
                Contact KoraScale
              </Button>
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
