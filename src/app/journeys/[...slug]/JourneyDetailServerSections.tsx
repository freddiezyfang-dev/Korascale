import {
  buildJourneyBreadcrumbJsonLd,
  buildJourneyTripJsonLd,
} from '@/lib/journeySeo.server';
import type { Journey } from '@/types';

type JourneyDetailServerSectionsProps = {
  journey: Journey;
};

/** Server-only JSON-LD. Primary content renders once in ClientJourneyPage (SSR via initialJourney). */
export default function JourneyDetailServerSections({ journey }: JourneyDetailServerSectionsProps) {
  const tripJsonLd = buildJourneyTripJsonLd(journey);
  const breadcrumbJsonLd = buildJourneyBreadcrumbJsonLd(journey);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tripJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}
