import { describe, expect, it } from 'vitest';

import { normalizeArticleWhitespace } from './normalizeArticleWhitespace';
import { processArticleHtml } from './articleRichText';

describe('normalizeArticleWhitespace', () => {
  it('converts &nbsp; entities in paragraph text to normal spaces', () => {
    const input = '<p>In&nbsp;Chengdu,&nbsp;teahouses&nbsp;invite&nbsp;people&nbsp;to&nbsp;stay.</p>';
    const output = normalizeArticleWhitespace(input);

    expect(output).toBe('<p>In Chengdu, teahouses invite people to stay.</p>');
    expect(output).not.toContain('&nbsp;');
    expect(output).not.toContain('\u00A0');
  });

  it('converts Unicode NBSP in paragraph text to normal spaces', () => {
    const input = '<p>newspapers\u00A0friends\u00A0playing</p>';
    const output = normalizeArticleWhitespace(input);

    expect(output).toBe('<p>newspapers friends playing</p>');
  });

  it('leaves normal English spaces unchanged', () => {
    const input = '<p>Normal English spaces remain unchanged.</p>';
    expect(normalizeArticleWhitespace(input)).toBe(input);
  });

  it('does not modify href attribute values', () => {
    const input = '<p>Visit <a href="https://example.com/a?x=1&nbsp;y=2">example</a></p>';
    const output = normalizeArticleWhitespace(input);

    expect(output).toContain('href="https://example.com/a?x=1&nbsp;y=2"');
    expect(output).toBe(
      '<p>Visit <a href="https://example.com/a?x=1&nbsp;y=2">example</a></p>'
    );
  });

  it('preserves NBSP inside pre/code blocks', () => {
    const input = '<pre><code>const value&nbsp;=&nbsp;1;</code></pre>';
    expect(normalizeArticleWhitespace(input)).toBe(input);
  });

  it('normalizes NBSP in mixed Chinese and English body text', () => {
    const input = '<p>成都&nbsp;Chengdu&nbsp;teahouse culture</p>';
    expect(normalizeArticleWhitespace(input)).toBe('<p>成都 Chengdu teahouse culture</p>');
  });

  it('handles numeric and hex NBSP entities', () => {
    const input = '<p>one&#160;two&#xA0;three</p>';
    expect(normalizeArticleWhitespace(input)).toBe('<p>one two three</p>');
  });
});

describe('processArticleHtml', () => {
  it('normalizes NBSP before injecting article HTML', () => {
    const input = '<p>A&nbsp;traditional&nbsp;teahouse&nbsp;can&nbsp;hold</p>';
    const output = processArticleHtml(input);

    expect(output).toBe('<p>A traditional teahouse can hold</p>');
    expect(output).not.toContain('&nbsp;');
  });
});
