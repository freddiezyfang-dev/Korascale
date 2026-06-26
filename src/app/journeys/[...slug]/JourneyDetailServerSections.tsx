import Link from 'next/link';
import {
  buildJourneyBreadcrumbItems,
  buildJourneyBreadcrumbJsonLd,
  buildJourneyTripJsonLd,
} from '@/lib/journeySeo.server';
import type { Journey } from '@/types';

type JourneyDetailServerSectionsProps = {
  journey: Journey;
};

/**
 * Server-only SEO shell: structured data, breadcrumb, and related links.
 * Primary H1 / excerpt / itinerary render once in ClientJourneyPage (SSR via initialJourney).
 */
export default function JourneyDetailServerSections({ journey }: JourneyDetailServerSectionsProps) {
  const breadcrumbItems = buildJourneyBreadcrumbItems(journey);
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

      <nav aria-label="Breadcrumb" className="bg-[#f5f1e6] border-b border-[#e0d7c4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-4">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;
              return (
                <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true">/</span>}
                  {item.href && !isLast ? (
                    <Link href={item.href} className="hover:text-[#1e3b32] underline-offset-2 hover:underline">
                      {item.label}
                    </Link>
                  ) : (
                    <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}
