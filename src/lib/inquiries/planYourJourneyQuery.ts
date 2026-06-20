import type { InquirySourceType } from './types';

const ALLOWED_INTENTS = new Set(['custom_journey']);
const ALLOWED_SOURCES = new Set(['article']);

export type PlanYourJourneyQueryContext = {
  intent: 'custom_journey';
  sourceType: InquirySourceType;
  sourcePage: string;
  sourceSlug: string | null;
  sourceContext: Record<string, unknown>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function sanitizeSlug(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim().slice(0, 255);
  if (!trimmed || !/^[a-z0-9-]+$/i.test(trimmed)) return null;
  return trimmed;
}

export function parsePlanYourJourneyQuery(
  searchParams: Record<string, string | string[] | undefined>
): PlanYourJourneyQueryContext {
  const intentRaw = firstString(searchParams.intent);
  const intent = intentRaw && ALLOWED_INTENTS.has(intentRaw) ? 'custom_journey' : 'custom_journey';

  const sourceRaw = firstString(searchParams.source);
  const sourceType: InquirySourceType =
    sourceRaw && ALLOWED_SOURCES.has(sourceRaw) ? 'article' : 'direct';

  const slug = sanitizeSlug(firstString(searchParams.slug));

  const sourceContext: Record<string, unknown> = {};
  if (sourceType === 'article' && slug) {
    sourceContext.articleSlug = slug;
  }

  return {
    intent,
    sourceType,
    sourcePage: '/plan-your-journey',
    sourceSlug: slug,
    sourceContext,
  };
}
