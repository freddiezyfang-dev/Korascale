import { describe, expect, it } from 'vitest';
import { normalizeSlugFromParams } from '@/lib/journeyDetailQuery.server';
import { JOURNEY_TYPE_SLUGS } from '@/config/journeyTypeRoutes';

function resolveTypeRedirectPath(slugParts: ReturnType<typeof normalizeSlugFromParams>): string | null {
  const { slug, isJourneyTypeSlug, isTypeRoute } = slugParts;
  if (isTypeRoute) {
    const typeValue = slug.replace(/^type\/?/i, '').trim();
    if (typeValue) return `/journeys/type/${typeValue}`;
  }
  if (isJourneyTypeSlug) {
    return `/journeys/type/${slug}`;
  }
  return null;
}

function journeyHasRenderableContent(journey?: { id?: string; title?: string; itinerary?: unknown[]; description?: string; shortDescription?: string } | null): boolean {
  if (!journey?.id) return false;
  return (
    (journey.itinerary?.length ?? 0) > 0 ||
    !!journey.description?.trim() ||
    !!journey.shortDescription?.trim() ||
    !!journey.title?.trim()
  );
}

function shouldShowDetailSkeleton(options: {
  initialJourney?: { id: string; title: string; itinerary?: unknown[] } | null;
  contextJourney?: { id: string; title: string } | null;
  journeyFromApi?: { id: string; title: string } | null;
  journeysLoading: boolean;
  isLoadingFromApi: boolean;
}): boolean {
  return (
    !journeyHasRenderableContent(options.initialJourney) &&
    !journeyHasRenderableContent(options.contextJourney) &&
    !journeyHasRenderableContent(options.journeyFromApi) &&
    (options.journeysLoading || options.isLoadingFromApi)
  );
}

describe('journey indexability helpers', () => {
  it('maps legacy type slug to canonical type redirect path', () => {
    for (const type of JOURNEY_TYPE_SLUGS) {
      const parts = normalizeSlugFromParams([type]);
      expect(resolveTypeRedirectPath(parts)).toBe(`/journeys/type/${type}`);
    }
  });

  it('does not show skeleton when server initialJourney has content', () => {
    expect(
      shouldShowDetailSkeleton({
        initialJourney: { id: '1', title: 'Tour', itinerary: [{ day: 1, title: 'Day 1' }] },
        journeysLoading: true,
        isLoadingFromApi: false,
      })
    ).toBe(false);
  });

  it('shows skeleton only when no renderable data and still loading', () => {
    expect(
      shouldShowDetailSkeleton({
        initialJourney: null,
        journeysLoading: true,
        isLoadingFromApi: false,
      })
    ).toBe(true);
  });

  it('treats title-only server journey as renderable', () => {
    expect(journeyHasRenderableContent({ id: '1', title: 'Tour' })).toBe(true);
  });
});
