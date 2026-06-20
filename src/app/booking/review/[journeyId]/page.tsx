'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Container, Section, Heading, Text, Button } from '@/components/common';

interface JourneyData {
  title: string;
  slug: string;
}

function BookingReviewLegacyContent() {
  const params = useParams();
  const journeyId = params.journeyId as string;

  const [journey, setJourney] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizedSlug = useMemo(() => {
    const slugRaw = decodeURIComponent(journeyId);
    const cleanSlug = slugRaw.replace(/^journeys\//, '').replace(/^\//, '').trim() || slugRaw;
    return cleanSlug.split('/').filter(Boolean).pop() || cleanSlug;
  }, [journeyId]);

  const journeyPath = useMemo(() => {
    if (!normalizedSlug) return '/journeys';
    return `/journeys/${encodeURIComponent(normalizedSlug)}`;
  }, [normalizedSlug]);

  useEffect(() => {
    fetch(`/api/journeys/slug/${encodeURIComponent(normalizedSlug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.journey) {
          setJourney({ title: data.journey.title, slug: data.journey.slug });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [normalizedSlug]);

  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      <Section background="secondary" padding="xl">
        <Container size="lg">
          <div className="max-w-2xl mx-auto text-left space-y-6">
            <Heading
              level={1}
              className="leading-tight"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Journey requests have moved
            </Heading>
            <Text className="text-[#1e3b32] leading-relaxed">
              This page previously collected booking requests. KoraScale now uses a unified journey
              inquiry form on each journey page. Our team will confirm availability and pricing with
              you by email — there is no online payment or reservation confirmation here.
            </Text>
            {loading ? (
              <Text className="text-gray-600">Loading journey…</Text>
            ) : journey ? (
              <Text className="text-gray-700">
                Continue with <span className="font-medium">{journey.title}</span> using{' '}
                <span className="font-medium">Request This Journey</span> on the journey page.
              </Text>
            ) : (
              <Text className="text-gray-700">
                Browse our journeys and use <span className="font-medium">Request This Journey</span>{' '}
                to send your travel dates and group size.
              </Text>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={journey ? journeyPath : '/journeys'}>
                <Button className="bg-[#1e3b32] text-white hover:bg-[#1a342c]">
                  {journey ? 'Go to Journey Page' : 'Browse Journeys'}
                </Button>
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

export default function BookingReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">Loading…</div>}>
      <BookingReviewLegacyContent />
    </Suspense>
  );
}
