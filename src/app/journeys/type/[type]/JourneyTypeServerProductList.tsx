import Link from 'next/link';
import { resolveJourneyCardHref } from '@/lib/journeySeo.server';
import type { Journey } from '@/types';

type JourneyTypeServerProductListProps = {
  journeys: Journey[];
  heading?: string;
};

export default function JourneyTypeServerProductList({
  journeys,
  heading = 'Journeys in this collection',
}: JourneyTypeServerProductListProps) {
  if (journeys.length === 0) {
    return (
      <section className="bg-white border-b border-[#e0d7c4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
          <p className="text-gray-600">No journeys are currently published in this collection.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border-b border-[#e0d7c4]" aria-label={heading}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <h2 className="sr-only">{heading}</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {journeys.map((journey) => {
            const href = resolveJourneyCardHref(journey);
            const title = journey.pageTitle || journey.title;
            return (
              <li key={journey.id}>
                <Link
                  href={href}
                  className="block rounded-lg border border-[#e0d7c4] bg-[#f5f1e6] p-4 hover:border-[#1e3b32] transition-colors"
                >
                  <span className="text-lg text-[#111]" style={{ fontFamily: 'var(--font-playfair), "Playfair Display", serif' }}>
                    {title}
                  </span>
                  {journey.duration ? (
                    <span className="mt-2 block text-xs uppercase tracking-widest text-gray-500">
                      {journey.duration}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
