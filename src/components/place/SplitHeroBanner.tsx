'use client';

import Link from 'next/link';
import { Breadcrumb } from '@/components/common';

interface SplitHeroBannerProps {
  image: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  title: string;
  content: string[];
  viewJourneysHref?: string;
}

export default function SplitHeroBanner({
  image,
  breadcrumbs,
  title,
  content,
  viewJourneysHref = '#journeys'
}: SplitHeroBannerProps) {
  return (
    <section className="flex flex-col md:flex-row min-h-screen">
      {/* Left: 55% - Full-height cinematic image */}
      <div className="relative w-full md:w-[55%] h-[60vh] md:h-screen overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url('${image}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            // Place 页面图片不旋转，保持自然方向
            transform: 'none',
            width: '100%',
            height: '100%'
          }}
        />
        
        {/* Overlay: VIEW JOURNEYS button */}
        <div className="absolute bottom-8 left-8 z-10">
          <Link
            href={viewJourneysHref}
            className="text-white font-serif text-lg tracking-wide hover:opacity-80 transition-opacity flex items-center gap-2"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            VIEW JOURNEYS <span className="text-xl">↓</span>
          </Link>
        </div>
      </div>

      {/* Right: 45% - White background container */}
      <div className="w-full md:w-[45%] bg-white flex flex-col justify-center px-8 md:px-12 py-12 md:py-24">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumb 
            items={breadcrumbs}
            color="#000000"
            sizeClassName="text-sm"
          />
        </div>

        {/* Title */}
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-serif mb-8 leading-tight"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          {title}
        </h1>

        {/* Content: Two to three paragraphs */}
        <div className="space-y-6">
          {content.map((paragraph, index) => (
            <p
              key={index}
              className="text-[#444] font-serif text-lg leading-relaxed"
              style={{ 
                fontFamily: 'Playfair Display, serif',
                lineHeight: '1.8'
              }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
