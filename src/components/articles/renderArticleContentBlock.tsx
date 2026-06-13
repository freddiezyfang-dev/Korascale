import React from 'react';
import { renderRichTextContent } from '@/lib/articleRichText';
import type { ContentBlock } from '@/types/article';
import TripCtaBlockClient from './TripCtaBlockClient';

export function renderArticleContentBlock(block: ContentBlock, index: number) {
  const key = block.id || String(index);

  switch (block.type) {
    case 'heading': {
      if (!block.text || !block.level) return null;
      const headingId = `heading-${block.id}`;
      const isH2 = block.level === 2;
      const headingProps = {
        id: headingId,
        className: `font-heading text-[#111] mb-6 w-full max-w-3xl mx-auto text-left break-words ${
          isH2 ? 'mt-12' : block.level === 1 ? 'mt-0' : 'mt-8'
        } first:mt-0 ${
          block.level === 1
            ? 'text-4xl md:text-5xl'
            : block.level === 2
              ? 'text-3xl md:text-4xl'
              : block.level === 3
                ? 'text-2xl md:text-3xl'
                : 'text-xl md:text-2xl'
        }`,
        style: {
          fontFamily: 'Playfair Display, serif',
          scrollMarginTop: '80px',
          wordBreak: 'normal',
          overflowWrap: 'break-word',
          hyphens: 'none',
        } as React.CSSProperties,
      };

      const plainText = block.text.replace(/<[^>]+>/g, '');
      if (block.level === 1) return <h1 key={key} {...headingProps}>{plainText}</h1>;
      if (block.level === 2) return <h2 key={key} {...headingProps}>{plainText}</h2>;
      if (block.level === 3) return <h3 key={key} {...headingProps}>{plainText}</h3>;
      if (block.level === 4) return <h4 key={key} {...headingProps}>{plainText}</h4>;
      if (block.level === 5) return <h5 key={key} {...headingProps}>{plainText}</h5>;
      return <h6 key={key} {...headingProps}>{plainText}</h6>;
    }

    case 'paragraph': {
      if (!block.text) return null;
      return (
        <div key={key} className="w-full max-w-3xl mx-auto px-6 mb-10">
          {renderRichTextContent(block.text, '')}
        </div>
      );
    }

    case 'image': {
      if (!block.imageSrc) return null;
      return (
        <div key={key} className="w-full my-16 flex justify-center">
          <div className="w-full max-w-md">
            <img
              src={block.imageSrc}
              alt={block.caption || ''}
              className="block w-full h-auto object-contain rounded-lg shadow-md"
            />
            {block.caption && (
              <p
                className="text-sm text-gray-600 mt-3 text-center italic"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                {block.caption}
              </p>
            )}
          </div>
        </div>
      );
    }

    case 'callout': {
      const highlightColor = block.highlightColor || '#c0a273';
      return (
        <div
          key={key}
          className="my-8 p-6 border-l-4 rounded w-full"
          style={{
            borderLeftColor: highlightColor,
            backgroundColor: `${highlightColor}15`,
          }}
        >
          {block.monthTag && (
            <div
              className="text-sm uppercase tracking-widest mb-2 font-semibold"
              style={{
                color: highlightColor,
                fontFamily: 'Montserrat, sans-serif',
              }}
            >
              {block.monthTag}
            </div>
          )}
          {block.text &&
            renderRichTextContent(
              block.text,
              'prose prose-slate max-w-none w-full prose-headings:font-serif prose-headings:text-[#111] prose-h2:text-2xl md:prose-h2:text-3xl prose-h3:text-xl md:prose-h3:text-2xl prose-p:font-sans prose-p:text-gray-800 prose-p:leading-relaxed prose-p:text-base md:prose-p:text-[17px] prose-p:mb-8 prose-img:max-w-md prose-img:mx-auto prose-img:rounded-lg prose-img:shadow-md prose-img:mt-16 prose-img:mb-16'
            )}
        </div>
      );
    }

    case 'trip_cta':
      return <TripCtaBlockClient key={key} block={block} />;

    default:
      return null;
  }
}
