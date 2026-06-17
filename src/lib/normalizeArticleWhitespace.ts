const SKIP_CONTENT_TAGS = new Set(['pre', 'code', 'script', 'style']);

function normalizeNbspInText(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ')
    .replace(/&#x0*a0;/gi, ' ')
    .replace(/\u00A0/g, ' ');
}

/**
 * Converts Quill NBSP word separators to normal spaces in article body HTML.
 * Skips text inside pre/code/script/style so literal spacing in code blocks is preserved.
 * Does not modify HTML tag names or attribute values (only text between tags).
 */
export function normalizeArticleWhitespace(html: string): string {
  if (!html) return '';

  const skipStack: string[] = [];
  let out = '';
  let i = 0;

  while (i < html.length) {
    if (html[i] === '<') {
      const close = html.indexOf('>', i);
      if (close === -1) {
        out += skipStack.length > 0 ? html.slice(i) : normalizeNbspInText(html.slice(i));
        break;
      }

      const tagContent = html.slice(i + 1, close).trim();
      const tagMatch = /^(\/?)([\w:-]+)/.exec(tagContent);
      if (tagMatch) {
        const isClosing = tagMatch[1] === '/';
        const tagName = tagMatch[2].toLowerCase();

        if (isClosing) {
          if (skipStack.length > 0 && skipStack[skipStack.length - 1] === tagName) {
            skipStack.pop();
          }
        } else if (!tagContent.endsWith('/') && SKIP_CONTENT_TAGS.has(tagName)) {
          skipStack.push(tagName);
        }
      }

      out += html.slice(i, close + 1);
      i = close + 1;
      continue;
    }

    const nextTag = html.indexOf('<', i);
    const text = nextTag === -1 ? html.slice(i) : html.slice(i, nextTag);
    out += skipStack.length > 0 ? text : normalizeNbspInText(text);
    i = nextTag === -1 ? html.length : nextTag;
  }

  return out;
}
