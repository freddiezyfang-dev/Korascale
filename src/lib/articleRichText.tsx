import React from 'react';
import { normalizeArticleWhitespace } from './normalizeArticleWhitespace';

export const ARTICLE_BODY_TEXT_CLASS =
  'font-sans text-gray-800 leading-[1.8] text-[16px] md:text-[17.5px] antialiased';

export const ARTICLE_BODY_TEXT_STYLE: React.CSSProperties = {
  textAlign: 'left',
  wordBreak: 'normal',
  overflowWrap: 'break-word',
  hyphens: 'none',
  textRendering: 'optimizeLegibility',
  fontFeatureSettings: '"liga" 0, "clig" 0',
};

export function cleanContent(content: string | undefined): string {
  if (!content) return '';
  return content
    .replace(/&shy;|\u00AD/g, '')
    .replace(/\u200B/g, '')
    .replace(/\u200C/g, '')
    .replace(/\u200D/g, '');
}

/** True when content should be injected as HTML (tags or entities like &nbsp;). */
export function hasHtmlTags(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  return (
    /<\s*\w[\w:-]*(?:\s[^>]*)?\/?>/i.test(trimmed) ||
    /&(?:#\d+|#x[\da-f]+|[a-z]+);/i.test(trimmed)
  );
}

export function processArticleHtml(html: string): string {
  return normalizeArticleWhitespace(
    cleanContent(html)
  ).replace(
    /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi,
    (match, attrs, href) => {
      if (href.startsWith('/journeys/') || href.startsWith('/inspirations/')) {
        return `<a ${attrs} class="article-internal-link" style="color: #24332d; font-weight: 600; text-decoration: none;">`;
      }
      return match;
    }
  );
}

export function renderRichTextContent(
  html: string,
  className: string,
  style: React.CSSProperties = ARTICLE_BODY_TEXT_STYLE
) {
  const processed = processArticleHtml(html);
  if (!processed) return null;

  if (hasHtmlTags(processed)) {
    return (
      <div
        className={`${ARTICLE_BODY_TEXT_CLASS} ${className}`}
        style={style}
        dangerouslySetInnerHTML={{ __html: processed }}
      />
    );
  }

  return (
    <p className={`${ARTICLE_BODY_TEXT_CLASS} ${className}`} style={style}>
      {processed}
    </p>
  );
}
