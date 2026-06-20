import { describe, expect, it, vi } from 'vitest';

import type { Journey } from '@/types';

import { InquiryValidationError } from './errors';
import { enrichJourneyRequestInput } from './journeyRequestEnrichment';
import type { CreateInquiryInput } from './types';

const mockJourney: Journey = {
  id: 'journey-uuid-1',
  title: 'Tibetan Plateau Discovery',
  slug: 'tibetan-plateau-discovery',
  description: 'A deep journey',
  shortDescription: 'Short',
  image: '/images/tibet.jpg',
  images: [],
  duration: '12 days',
  price: 4500,
  category: 'Nature',
  journeyType: 'Deep Discovery',
  region: 'Southwest China',
  city: 'Chengdu',
  location: 'Tibet',
  difficulty: 'Medium',
  maxParticipants: 12,
  minParticipants: 4,
  excluded: [],
  highlights: [],
  itinerary: [],
  modules: [],
  accommodations: [],
  availableExperiences: [],
  availableAccommodations: [],
  requirements: [],
  bestTimeToVisit: [],
  rating: 5,
  reviewCount: 10,
  status: 'active',
  featured: false,
  tags: [],
  pageTitle: 'Tibetan Plateau Discovery',
  metaDescription: 'Meta',
  heroImage: '/images/tibet-hero.jpg',
  included: [],
  availableDates: [
    {
      id: 'dep-1',
      startDate: '2026-09-01',
      endDate: '2026-09-12',
      price: 4800,
      status: 'Available',
    },
  ],
};

function buildJourneyInput(overrides: Partial<CreateInquiryInput> = {}): CreateInquiryInput {
  return {
    intent: 'journey_request',
    sourceType: 'journey',
    sourcePage: '/journeys/tibetan-plateau-discovery',
    sourceSlug: 'tibetan-plateau-discovery',
    channel: 'form',
    name: 'Jane Doe',
    email: 'jane@example.com',
    sourceContext: {
      sourceCta: 'journey_detail_request',
      journeyTitle: 'Fake Title From Client',
      journeyId: 'fake-id',
      price: 1,
    },
    details: {
      adults: 2,
      children: 0,
      selectedDepartureId: 'dep-1',
      journeyTitle: 'Fake Detail Title',
      finalPrice: 999,
    },
    ...overrides,
  };
}

describe('enrichJourneyRequestInput', () => {
  it('enriches a valid active journey and strips client-supplied canonical fields', async () => {
    const fetchJourneyBySlug = vi.fn(async () => mockJourney);

    const result = await enrichJourneyRequestInput(buildJourneyInput(), {
      fetchJourneyBySlug,
    });

    expect(fetchJourneyBySlug).toHaveBeenCalledWith('tibetan-plateau-discovery');
    expect(result.sourceContext).toMatchObject({
      sourceCta: 'journey_detail_request',
      journeyId: 'journey-uuid-1',
      journeySlug: 'tibetan-plateau-discovery',
      journeyTitle: 'Tibetan Plateau Discovery',
      journeyType: 'Deep Discovery',
      journeyUrl: '/journeys/tibetan-plateau-discovery',
      duration: '12 days',
    });
    expect(result.sourceContext).not.toHaveProperty('price');
    expect(result.details).toMatchObject({
      adults: 2,
      children: 0,
      selectedDepartureId: 'dep-1',
      departureDate: '2026-09-01',
      departureEndDate: '2026-09-12',
      estimatedPricePerPerson: 4800,
      estimatedTotal: 9600,
      priceVerification: 'estimated',
      currency: 'USD',
    });
    expect(result.details).not.toHaveProperty('finalPrice');
    expect(result.details).not.toHaveProperty('journeyTitle');
  });

  it('rejects when journey is not found', async () => {
    await expect(
      enrichJourneyRequestInput(buildJourneyInput(), {
        fetchJourneyBySlug: vi.fn(async () => null),
      })
    ).rejects.toBeInstanceOf(InquiryValidationError);
  });

  it('rejects missing sourceSlug', async () => {
    await expect(
      enrichJourneyRequestInput(
        buildJourneyInput({ sourceSlug: '  ' }),
        { fetchJourneyBySlug: vi.fn(async () => mockJourney) }
      )
    ).rejects.toMatchObject({
      errors: { sourceSlug: expect.any(String) },
    });
  });

  it('rejects forged departure id', async () => {
    await expect(
      enrichJourneyRequestInput(
        buildJourneyInput({
          details: { adults: 2, children: 0, selectedDepartureId: 'not-real' },
        }),
        { fetchJourneyBySlug: vi.fn(async () => mockJourney) }
      )
    ).rejects.toMatchObject({
      errors: { details: expect.stringContaining('departure') },
    });
  });

  it('stores preferred date and unverified display snapshot when no departure selected', async () => {
    const result = await enrichJourneyRequestInput(
      buildJourneyInput({
        details: { adults: 3, children: 1, preferredDate: '2026-10-15' },
      }),
      { fetchJourneyBySlug: vi.fn(async () => mockJourney) }
    );

    expect(result.details).toMatchObject({
      adults: 3,
      children: 1,
      preferredDate: '2026-10-15',
      estimatedPricePerPerson: 4500,
      estimatedTotal: 18000,
      priceVerification: 'unverified_display_snapshot',
    });
    expect(result.details).not.toHaveProperty('selectedDepartureId');
  });

  it('rejects invalid adults count', async () => {
    await expect(
      enrichJourneyRequestInput(
        buildJourneyInput({ details: { adults: 0, children: 0 } }),
        { fetchJourneyBySlug: vi.fn(async () => mockJourney) }
      )
    ).rejects.toBeInstanceOf(InquiryValidationError);
  });

  it('rejects negative children count', async () => {
    await expect(
      enrichJourneyRequestInput(
        buildJourneyInput({ details: { adults: 2, children: -1 } }),
        { fetchJourneyBySlug: vi.fn(async () => mockJourney) }
      )
    ).rejects.toBeInstanceOf(InquiryValidationError);
  });

  it('passes through non-journey intents unchanged', async () => {
    const input: CreateInquiryInput = {
      intent: 'general_contact',
      sourceType: 'contact',
      channel: 'form',
      name: 'Sam',
      email: 'sam@example.com',
    };
    const fetchJourneyBySlug = vi.fn(async () => mockJourney);

    const result = await enrichJourneyRequestInput(input, { fetchJourneyBySlug });

    expect(result).toEqual(input);
    expect(fetchJourneyBySlug).not.toHaveBeenCalled();
  });
});
