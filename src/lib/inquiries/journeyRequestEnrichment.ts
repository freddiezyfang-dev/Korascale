import { fetchJourneyBySlugFromDb } from '@/lib/journeyDetailQuery.server';
import { buildJourneyDetailPath } from '@/lib/journeySitemap.server';

import { InquiryValidationError } from './errors';
import type { CreateInquiryInput } from './types';

export const JOURNEY_REQUEST_PARTY_LIMITS = {
  minAdults: 1,
  maxAdults: 20,
  minChildren: 0,
  maxChildren: 20,
} as const;

const FORBIDDEN_CLIENT_CONTEXT_KEYS = new Set([
  'journeyTitle',
  'journeyId',
  'price',
  'currency',
  'duration',
  'journeySlug',
  'journeyType',
  'journeyUrl',
  'estimatedPricePerPerson',
  'estimatedTotal',
]);

const FORBIDDEN_CLIENT_DETAIL_KEYS = new Set([
  'journeyTitle',
  'journeyId',
  'finalPrice',
  'currency',
  'estimatedTotal',
  'estimatedPricePerPerson',
  'journeyType',
  'journeySlug',
  'departureDate',
  'departureEndDate',
  'departureLabel',
  'priceVerification',
]);

function stripForbiddenKeys(
  obj: Record<string, unknown>,
  forbidden: Set<string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!forbidden.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

function parsePartyCount(
  value: unknown,
  field: 'adults' | 'children',
  min: number,
  max: number
): number {
  if (value == null || value === '') {
    if (field === 'adults') {
      throw new InquiryValidationError({ details: 'Number of adults is required' });
    }
    return min;
  }

  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new InquiryValidationError({
      details: `${field} must be an integer between ${min} and ${max}`,
    });
  }
  return parsed;
}

function formatDepartureLabel(startDate: string, endDate: string): string {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  } catch {
    return `${startDate} – ${endDate}`;
  }
}

export type JourneyRequestEnrichmentDeps = {
  fetchJourneyBySlug: typeof fetchJourneyBySlugFromDb;
};

export const defaultJourneyRequestEnrichmentDeps: JourneyRequestEnrichmentDeps = {
  fetchJourneyBySlug: fetchJourneyBySlugFromDb,
};

export async function enrichJourneyRequestInput(
  input: CreateInquiryInput,
  deps: JourneyRequestEnrichmentDeps = defaultJourneyRequestEnrichmentDeps
): Promise<CreateInquiryInput> {
  if (input.intent !== 'journey_request') {
    return input;
  }

  const slug = input.sourceSlug?.trim();
  if (!slug) {
    throw new InquiryValidationError({ sourceSlug: 'sourceSlug is required for journey requests' });
  }

  const journey = await deps.fetchJourneyBySlug(slug);
  if (!journey) {
    throw new InquiryValidationError({ sourceSlug: 'Journey not found or not available' });
  }

  const rawDetails = stripForbiddenKeys(
    (input.details ?? {}) as Record<string, unknown>,
    FORBIDDEN_CLIENT_DETAIL_KEYS
  );

  const adults = parsePartyCount(
    rawDetails.adults,
    'adults',
    JOURNEY_REQUEST_PARTY_LIMITS.minAdults,
    JOURNEY_REQUEST_PARTY_LIMITS.maxAdults
  );
  const children = parsePartyCount(
    rawDetails.children,
    'children',
    JOURNEY_REQUEST_PARTY_LIMITS.minChildren,
    JOURNEY_REQUEST_PARTY_LIMITS.maxChildren
  );

  const enrichedDetails: Record<string, unknown> = { adults, children };

  const selectedDepartureId =
    typeof rawDetails.selectedDepartureId === 'string'
      ? rawDetails.selectedDepartureId.trim()
      : '';
  const preferredDateRaw =
    typeof rawDetails.preferredDate === 'string' ? rawDetails.preferredDate.trim() : '';

  if (selectedDepartureId) {
    const departure = journey.availableDates?.find((item) => item.id === selectedDepartureId);
    if (!departure) {
      throw new InquiryValidationError({ details: 'Selected departure is not valid for this journey' });
    }

    enrichedDetails.selectedDepartureId = departure.id;
    enrichedDetails.departureDate = departure.startDate;
    enrichedDetails.departureEndDate = departure.endDate;
    enrichedDetails.departureLabel = formatDepartureLabel(departure.startDate, departure.endDate);
    enrichedDetails.estimatedPricePerPerson = departure.price;
    enrichedDetails.estimatedTotal = (adults + children) * departure.price;
    enrichedDetails.priceVerification = 'estimated';
    enrichedDetails.currency = 'USD';
  } else {
    if (preferredDateRaw) {
      enrichedDetails.preferredDate = preferredDateRaw;
    }
    if (journey.price > 0) {
      enrichedDetails.estimatedPricePerPerson = journey.price;
      enrichedDetails.estimatedTotal = (adults + children) * journey.price;
      enrichedDetails.priceVerification = 'unverified_display_snapshot';
      enrichedDetails.currency = 'USD';
    }
  }

  const clientContext = stripForbiddenKeys(
    (input.sourceContext ?? {}) as Record<string, unknown>,
    FORBIDDEN_CLIENT_CONTEXT_KEYS
  );

  const journeyUrl = buildJourneyDetailPath(journey.slug);

  return {
    ...input,
    sourcePage: journeyUrl,
    sourceSlug: journey.slug,
    sourceContext: {
      ...clientContext,
      journeyId: journey.id,
      journeySlug: journey.slug,
      journeyTitle: journey.title,
      journeyType: journey.journeyType ?? null,
      journeyUrl,
      duration: journey.duration,
    },
    details: enrichedDetails,
  };
}
