'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useArticleManagement } from '@/context/ArticleManagementContext';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import { ArticleCategoryToSlug } from '@/types/article';
import { Journey } from '@/types';
import { getRenderableImageUrl } from '@/lib/imageUtils';

const THEME_GREEN = '#2D4033';
const BG_LINKS = '#FAF9F6';
const SERIF_FONT = 'var(--font-playfair), Playfair Display, serif';
/** 所有图片卡片底部文字遮罩，确保白色 Playfair 清晰可见 */
const CARD_GRADIENT = 'bg-gradient-to-t from-black/60 to-transparent';
/** 卡片内图片统一：block 填满定位层，w-full h-full object-cover 消除白边 */
const IMG_FILL = 'block w-full h-full object-cover object-center';
/** 图片定位层：必须包在 relative 容器内，确保手机端无白边 */
const IMG_WRAPPER = 'absolute inset-0 min-w-0 min-h-0';

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
    if (featured.length >= 1) return featured.slice(0, 1);
    return active.slice(0, 1);
  }, [journeys]);

  const journeyHeroImage = featuredJourneys[0]?.heroImage || featuredJourneys[0]?.image || featuredJourneys[0]?.images?.[0] || '';

  return (
    <div
      className="min-h-screen w-full max-w-md mx-auto px-2 py-8 bg-[#FAF9F6]"
    >
      <header className="text-center mb-6">
        <h1
          className="font-serif uppercase tracking-[0.25em] text-xl sm:text-2xl text-gray-900"
          style={{ fontFamily: SERIF_FONT }}
        >
          KORASCALE
        </h1>
      </header>

      {(articlesLoading || journeysLoading) ? (
        <div className="font-sans text-gray-500 py-8 text-center text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-2 gap-2 min-w-0">
          {/* Featured Journey: 整行，4:5 比例，文字遮罩 */}
          {featuredJourneys[0] && (
            <Link
              href={`/journeys/${featuredJourneys[0].slug || featuredJourneys[0].id}`}
              className="col-span-2 block relative w-full min-w-0 min-h-0 aspect-[4/5] rounded-lg overflow-hidden bg-gray-200"
            >
              {journeyHeroImage ? (
                <div className={IMG_WRAPPER}>
                  <img src={journeyHeroImage} alt="" className={IMG_FILL} />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#2D4033] to-[#1a2820]" />
              )}
              <div className={`absolute inset-0 flex flex-col items-center justify-end p-4 ${CARD_GRADIENT}`}>
                <span
                  className="font-serif text-lg sm:text-xl text-white drop-shadow-md text-center line-clamp-2"
                  style={{ fontFamily: SERIF_FONT }}
                >
                  {featuredJourneys[0].title}
                </span>
                <span className="mt-2 font-sans uppercase tracking-widest text-xs text-white/90">
                  View Journey
                </span>
              </div>
            </Link>
          )}

          {/* SEO 文章：两小一大错位网格。前两篇 1:1，第三篇 col-span-2 大卡 */}
          {seoArticles[0] && (
            <Link
              href={`/inspirations/${ArticleCategoryToSlug[seoArticles[0].category]}/${seoArticles[0].slug}`}
              className="block relative w-full min-w-0 min-h-0 aspect-square rounded-lg overflow-hidden bg-gray-200"
            >
              {seoArticles[0].coverImage ? (
                <div className={IMG_WRAPPER}>
                  <img src={getRenderableImageUrl(seoArticles[0].coverImage)} alt="" className={IMG_FILL} />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gray-300" />
              )}
              <div className={`absolute inset-x-0 bottom-0 p-3 pt-12 text-white ${CARD_GRADIENT}`}>
                <span
                  className="font-serif text-sm sm:text-base line-clamp-2 leading-tight"
                  style={{ fontFamily: SERIF_FONT }}
                >
                  {seoArticles[0].title}
                </span>
              </div>
            </Link>
          )}
          {seoArticles[1] && (
            <Link
              href={`/inspirations/${ArticleCategoryToSlug[seoArticles[1].category]}/${seoArticles[1].slug}`}
              className="block relative w-full min-w-0 min-h-0 aspect-square rounded-lg overflow-hidden bg-gray-200"
            >
              {seoArticles[1].coverImage ? (
                <div className={IMG_WRAPPER}>
                  <img src={getRenderableImageUrl(seoArticles[1].coverImage)} alt="" className={IMG_FILL} />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gray-300" />
              )}
              <div className={`absolute inset-x-0 bottom-0 p-3 pt-12 text-white ${CARD_GRADIENT}`}>
                <span
                  className="font-serif text-sm sm:text-base line-clamp-2 leading-tight"
                  style={{ fontFamily: SERIF_FONT }}
                >
                  {seoArticles[1].title}
                </span>
              </div>
            </Link>
          )}
          {seoArticles[2] && (
            <Link
              href={`/inspirations/${ArticleCategoryToSlug[seoArticles[2].category]}/${seoArticles[2].slug}`}
              className="col-span-2 block relative w-full min-w-0 min-h-0 aspect-[4/5] rounded-lg overflow-hidden bg-gray-200"
            >
              {seoArticles[2].coverImage ? (
                <div className={IMG_WRAPPER}>
                  <img src={getRenderableImageUrl(seoArticles[2].coverImage)} alt="" className={IMG_FILL} />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gray-300" />
              )}
              <div className={`absolute inset-x-0 bottom-0 p-4 pt-16 text-white ${CARD_GRADIENT}`}>
                <span
                  className="font-serif text-base sm:text-lg line-clamp-2 leading-tight"
                  style={{ fontFamily: SERIF_FONT }}
                >
                  {seoArticles[2].title}
                </span>
              </div>
            </Link>
          )}

          {/* 双入口：SEO 下方 grid-cols-2，左 JOURNEYS 右 INSPIRATIONS，1:1 */}
          <Link
            href="/journeys"
            className="col-span-1 block relative w-full min-w-0 min-h-0 aspect-square rounded-lg overflow-hidden bg-gray-200"
          >
            {journeyHeroImage ? (
              <div className={IMG_WRAPPER}>
                <img src={journeyHeroImage} alt="" className={IMG_FILL} />
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#2D4033] to-[#1a2820]" />
            )}
            <div className={`absolute inset-0 flex items-center justify-center ${CARD_GRADIENT}`}>
              <span
                className="font-serif uppercase tracking-[0.2em] text-white text-sm sm:text-base"
                style={{ fontFamily: SERIF_FONT }}
              >
                JOURNEYS
              </span>
            </div>
          </Link>
          <Link
            href="/inspirations"
            className="col-span-1 block relative w-full min-w-0 min-h-0 aspect-square rounded-lg overflow-hidden bg-[#2D4033]"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-serif uppercase tracking-[0.2em] text-white text-sm sm:text-base"
                style={{ fontFamily: SERIF_FONT }}
              >
                INSPIRATIONS
              </span>
            </div>
          </Link>
        </div>
      )}

      <footer className="mt-10 text-center">
        <p className="font-sans text-xs text-gray-500">Korascale · Craft Your Own Adventure</p>
      </footer>
    </div>
  );
}
