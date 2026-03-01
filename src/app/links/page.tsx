'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useArticleManagement } from '@/context/ArticleManagementContext';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { ArticleCategoryToSlug } from '@/types/article';
import { Journey } from '@/types';
import { ChevronRight } from 'lucide-react';

const THEME_GREEN = '#2D4033';
const BG_LINKS = '#FAF9F6';

export default function LinksPage() {
  const { articles, isLoading: articlesLoading } = useArticleManagement();
  const { journeys, isLoading: journeysLoading } = useJourneyManagement();

  const seoArticles = useMemo(() => {
    return articles
      .filter((a) => a.status === 'active')
      .sort((a, b) => (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0))
      .slice(0, 3);
  }, [articles]);

  const featuredJourneys = useMemo((): Journey[] => {
    const active = journeys.filter((j) => j.status === 'active');
    const featured = active.filter((j) => j.featured);
    if (featured.length >= 2) return featured.slice(0, 2);
    if (featured.length === 1) return featured;
    return active.slice(0, 2);
  }, [journeys]);

  return (
    <div
      className="min-h-screen w-full max-w-md mx-auto px-4 sm:px-6 py-12"
      style={{ backgroundColor: BG_LINKS }}
    >
      <header className="text-center mb-10">
        <h1
          className="font-serif uppercase tracking-[0.25em] text-xl sm:text-2xl text-gray-900"
          style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
        >
          KORASCALE
        </h1>
      </header>

      <section className="mb-10">
        <h2 className="sr-only">Insights</h2>
        {articlesLoading ? (
          <div className="font-serif text-lg py-4 text-gray-500">Loading…</div>
        ) : seoArticles.length === 0 ? (
          <div className="font-serif text-lg py-4 text-gray-500 border-b border-gray-100">
            No articles yet.
          </div>
        ) : (
          <ul className="border-t border-gray-100">
            {seoArticles.map((article) => {
              const href = `/inspirations/${ArticleCategoryToSlug[article.category]}/${article.slug}`;
              return (
                <li key={article.id}>
                  <Link
                    href={href}
                    className="min-h-[44px] flex justify-between items-center font-serif text-lg py-4 border-b border-gray-100 text-gray-900 hover:text-[#2D4033] transition-colors"
                    style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}
                  >
                    <span className="flex-1 pr-2 line-clamp-2">{article.title}</span>
                    <ChevronRight className="w-5 h-5 flex-shrink-0 text-gray-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-lg font-medium text-gray-900 mb-4" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
          Featured Journeys
        </h2>
        {journeysLoading ? (
          <div className="text-gray-500 text-sm">Loading…</div>
        ) : featuredJourneys.length === 0 ? (
          <div className="text-gray-500 text-sm">No journeys yet.</div>
        ) : (
          <ul className="space-y-6">
            {featuredJourneys.map((journey) => {
              const img = journey.heroImage || journey.image || journey.images?.[0] || '';
              const href = `/journeys/${journey.slug || journey.id}`;
              return (
                <li key={journey.id}>
                  <Link href={href} className="block group">
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-200">
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <span className="font-serif text-base text-gray-900 block mb-2" style={{ fontFamily: 'var(--font-playfair), Playfair Display, serif' }}>
                        {journey.title}
                      </span>
                      <span
                        className="inline-flex items-center justify-center min-h-[44px] px-5 py-3 font-sans uppercase tracking-widest text-xs text-white rounded transition-opacity hover:opacity-90"
                        style={{ backgroundColor: THEME_GREEN }}
                      >
                        View Journey
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="mt-16 text-center">
        <p className="text-xs text-gray-500">Korascale · Craft Your Own Adventure</p>
      </footer>
    </div>
  );
}
