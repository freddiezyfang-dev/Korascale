'use client';

import React from 'react';
import Link from 'next/link';
import { Container, Section, Heading, Text, Button } from '@/components/common';
import { CheckCircle } from 'lucide-react';

export default function BookingSuccessPage() {
  return (
    <main className="min-h-screen bg-[#24332d] flex items-center justify-center py-16">
      <Section padding="xl" className="w-full">
        <Container size="sm" className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 text-[#a8d5ba] mb-8">
            <CheckCircle className="w-10 h-10" />
          </div>
          <Heading level={1} className="text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Request Received
          </Heading>
          <Text className="text-white/90 text-lg leading-relaxed max-w-md mx-auto mb-8">
            Our travel experts will send you the contract and payment link shortly. Please check your email for next steps.
          </Text>
          <Text size="sm" className="text-white/70 mb-10">
            专家将尽快向您发送合同及付款链接，请留意邮箱。
          </Text>
          <Link href="/journeys">
            <Button variant="outline" className="border-white text-white hover:bg-white/10">
              Back to Journeys
            </Button>
          </Link>
        </Container>
      </Section>
    </main>
  );
}
