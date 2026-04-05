'use client';

import Link from "next/link";
import { Container, Section, Heading, Text, Breadcrumb } from '@/components/common';
import { PlanningSectionNew } from '@/components/sections';
import { useEffect } from 'react';
import { useArticleManagement } from '@/context/ArticleManagementContext';
import { getRenderableImageUrl } from '@/lib/imageUtils';
import {
  ARTICLE_CATEGORIES,
  ArticleCategoryToSlug,
  ArticleCategoryToCardTitle,
  ArticleCategoryToCardDescription,
  ArticleCategoryToHeroImage,
  type ArticleCategory,
} from '@/types/article';

const imgHeroBanner = "/images/hero/slide7-emeishan.jpg";

const inspirations = ARTICLE_CATEGORIES.map((category: ArticleCategory, index: number) => ({
  id: index + 1,
  category,
  title: ArticleCategoryToCardTitle[category],
  slug: ArticleCategoryToSlug[category],
  image: ArticleCategoryToHeroImage[category],
  description: ArticleCategoryToCardDescription[category],
  isFullWidth: category === 'Food Journey',
  isRightAligned: category === 'Vibrant Nightscapes',
}));

export default function Inspirations() {
  const { articles } = useArticleManagement();
  // 设置页面标题
  useEffect(() => {
    document.title = "Inspirations - Korascale";
  }, []);

  // 获取特色文章（取前4篇活跃文章）
  const featuredArticles = articles
    .filter(article => article.status === 'active')
    .slice(0, 4);

  const seasonalCard = inspirations[5];
  const vibrantCard = inspirations[4];

  const inspHeadingClass = 'text-2xl font-serif text-[#111] mb-4';
  const inspBodyClass =
    'text-[17px] md:text-[18px] text-gray-700 leading-[1.7] font-sans';

  return (
    <main>
      {/* Hero Banner */}
      <Section background="primary" padding="none" className="relative h-[800px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${imgHeroBanner}')`, filter: 'brightness(1.3) contrast(1.1)' }}
        />
        <div className="absolute inset-0 bg-white/15" />
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Breadcrumb Navigation */}
        <div className="relative z-10 pt-6 pl-6 md:pt-8 md:pl-12">
          <Breadcrumb 
            items={[{ label: 'Home', href: '/' }, { label: 'Inspirations' }]}
            color="#FFFFFF"
            sizeClassName="text-lg md:text-xl"
          />
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center px-4">
          <div className="text-center text-white max-w-4xl">
            <Heading 
              level={1} 
              className="text-6xl md:text-7xl lg:text-8xl font-normal mb-2 tracking-tight" 
              style={{ 
                fontFamily: 'Montserrat, sans-serif',
                color: '#FFFFFF'
              }}
            >
              Inspirations
            </Heading>
          </div>
        </div>
      </Section>

      {/* Narrative Header Section */}
      <Section background="secondary" padding="xl" className="py-20">
        <Container size="xl">
          <div className="max-w-4xl mx-auto text-center">
            <Text 
              className="text-lg md:text-xl font-body font-light leading-relaxed text-[#4A4A4A]"
              style={{
                fontFamily: 'Monda, sans-serif',
                lineHeight: '2.0',
                letterSpacing: '0.01em'
              }}
            >
              From chic retreats nestled in ancient mountain villages to soul-stirring locations where tradition meets transformation, our inspirations guide you to places that resonate beyond the surface. Each destination we feature has been carefully selected not just for its beauty, but for its ability to offer genuine encounters with the living culture of Western China.
            </Text>
          </div>
        </Container>
      </Section>

      {/* Featured Articles Grid */}
      {featuredArticles.length > 0 && (
        <Section background="secondary" padding="xl" className="py-20">
          <Container size="xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {featuredArticles.map((article) => {
                const categorySlug = ArticleCategoryToSlug[article.category];
                const articleHref = `/inspirations/${categorySlug}/${article.slug}`;
                
                return (
                  <Link 
                    key={article.id} 
                    href={articleHref}
                    className="group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                  >
                    <div className="relative w-full overflow-hidden rounded-lg mb-4">
                      {/* Image with 4:3 aspect ratio */}
                      <div className="relative w-full aspect-[4/3] overflow-hidden">
                        <img
                          src={getRenderableImageUrl(article.coverImage)}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    </div>
                    {/* Optional Title Section */}
                    <div className="px-2">
                      <p className="text-xs uppercase tracking-widest text-gray-600 mb-2 font-sans">
                        {ArticleCategoryToCardTitle[article.category]}
                      </p>
                      <Heading 
                        level={3} 
                        className="text-2xl md:text-3xl font-heading text-[#111] leading-tight"
                        style={{ fontFamily: 'Montaga, serif' }}
                      >
                        {article.title}
                      </Heading>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Container>
        </Section>
      )}

      {/* Ways to Explore Section */}
      <Section background="secondary" padding="xl" className="py-24">
        <Container size="xl">
          {/* Food Journey - Full Width */}
          <Link
            href={`/inspirations/${inspirations[0].slug}`}
            className="block mb-16 group cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl"
          >
            <div className="relative min-h-[280px] md:min-h-[300px] h-auto rounded-lg overflow-hidden">
              <img
                src={inspirations[0].image}
                alt={inspirations[0].title}
                className="absolute inset-0 w-full h-full min-h-[280px] md:min-h-[300px] object-cover object-left group-hover:scale-110 transition-transform duration-300"
              />
              <div className="relative min-h-[280px] md:min-h-[300px] flex items-center justify-start pl-5 sm:pl-6 md:pl-8 lg:pl-10 pr-4 md:pr-8 py-6 md:py-8 bg-black/20 group-hover:bg-black/40 transition-all duration-300">
                <div className="bg-white/95 backdrop-blur-sm p-7 md:p-9 rounded-lg max-w-md md:max-w-xl lg:max-w-2xl shadow-lg flex flex-col justify-center w-full sm:w-auto">
                  <Heading level={3} className={`${inspHeadingClass} text-left`}>
                    {inspirations[0].title}
                  </Heading>
                  <Text className="text-[17px] text-gray-700 leading-relaxed font-sans line-clamp-4 mb-5 md:mb-6 text-left">
                    {inspirations[0].description}
                  </Text>
                  <span className="text-xs font-sans font-semibold uppercase tracking-wider underline group-hover:text-[#c0a273] block text-left text-[#1e3b32] transition-colors duration-300">
                    View more
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Three Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
            {inspirations.slice(1, 4).map((inspiration) => (
              <Link
                key={inspiration.id}
                href={`/inspirations/${inspiration.slug}`}
                className="group block cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
              >
                <div className="relative h-[357px] rounded-lg overflow-hidden mb-6">
                  <img
                    src={inspiration.image}
                    alt={inspiration.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="text-center px-4 md:px-8 max-w-2xl mx-auto">
                  <Heading level={3} className={inspHeadingClass}>
                    {inspiration.title}
                  </Heading>
                  <Text className={`${inspBodyClass} mb-6 px-1`}>
                    {inspiration.description}
                  </Text>
                  <span className="text-xs font-sans font-semibold uppercase tracking-wider underline group-hover:text-[#c0a273] text-[#1e3b32] transition-colors duration-300">
                    View more
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom Row - Two Columns (Left: Seasonal Highlights text below, Right: Nightscapes overlay card) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left - Seasonal Highlights (image with text below) */}
            <Link
              href={`/inspirations/${seasonalCard.slug}`}
              className="group block cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
            >
              <div className="relative h-[357px] rounded-lg overflow-hidden mb-6">
                <img
                  src={seasonalCard.image}
                  alt={seasonalCard.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="text-left px-4 md:px-8 max-w-2xl">
                <Heading level={3} className={inspHeadingClass}>
                  {seasonalCard.title}
                </Heading>
                <Text className={`${inspBodyClass} mb-6 pr-2 md:pr-6`}>
                  {seasonalCard.description}
                </Text>
                <span className="text-xs font-sans font-semibold uppercase tracking-wider underline group-hover:text-[#c0a273] text-[#1e3b32] transition-colors duration-300">
                  View more
                </span>
              </div>
            </Link>

            <Link
              href={`/inspirations/${vibrantCard.slug}`}
              className="group block cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
            >
              <div className="relative h-[357px] rounded-lg overflow-hidden mb-6">
                <img
                  src={vibrantCard.image}
                  alt={vibrantCard.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="text-center px-4 md:px-8 max-w-2xl mx-auto">
                <Heading level={3} className={inspHeadingClass}>
                  {vibrantCard.title}
                </Heading>
                <Text className={`${inspBodyClass} mb-6 px-1`}>
                  {vibrantCard.description}
                </Text>
                <span className="text-xs font-sans font-semibold uppercase tracking-wider underline group-hover:text-[#c0a273] text-[#1e3b32] transition-colors duration-300">
                  View more
                </span>
              </div>
            </Link>
          </div>
        </Container>
      </Section>

      {/* Planning Section */}
      <PlanningSectionNew />
    </main>
  );
}