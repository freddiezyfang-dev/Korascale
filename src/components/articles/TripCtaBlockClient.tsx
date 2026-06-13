'use client';

import Link from 'next/link';
import { Heading, Text } from '@/components/common';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { getRenderableImageUrl } from '@/lib/imageUtils';
import type { ContentBlock } from '@/types/article';

interface TripCtaBlockClientProps {
  block: ContentBlock;
}

export default function TripCtaBlockClient({ block }: TripCtaBlockClientProps) {
  const { journeys } = useJourneyManagement();

  if (!block.journeyId) return null;

  const journey = journeys.find((j) => j.id === block.journeyId);
  if (!journey) return null;

  return (
    <div className="my-12 p-8 bg-[#f5f1e6] rounded-lg border border-[#1e3b32]/10">
      <Heading
        level={3}
        className="text-2xl mb-4"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        {block.ctaText || 'Trip Inspiration'}
      </Heading>
      <Link href={`/journeys/${journey.slug}`} className="block group">
        <div className="flex flex-col md:flex-row gap-4">
          <img
            src={getRenderableImageUrl(journey.image)}
            alt={journey.title}
            className="w-full md:w-48 h-48 object-cover rounded-lg"
          />
          <div className="flex-1">
            <Heading
              level={4}
              className="text-xl mb-2 group-hover:text-[#1e3b32] transition-colors"
            >
              {journey.title}
            </Heading>
            <Text className="text-gray-600 mb-2">
              {journey.duration} • ¥{journey.price}
            </Text>
            <Text className="text-sm text-[#1e3b32] underline">View Journey →</Text>
          </div>
        </div>
      </Link>
    </div>
  );
}
