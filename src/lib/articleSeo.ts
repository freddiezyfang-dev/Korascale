/**
 * Server-safe article SEO helpers. No browser APIs.
 */
import type { Article, ContentBlock } from '@/types/article';

const SEO_DESCRIPTION_MIN = 150;
const SEO_DESCRIPTION_MAX = 160;

const NAMED_HTML_ENTITIES: Record<string, string> = {
	nbsp: ' ',
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	'#39': "'",
};

function decodeHtmlEntities(input: string): string {
	let text = input;

	text = text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
		const lower = entity.toLowerCase();
		if (lower.startsWith('#x')) {
			const code = parseInt(lower.slice(2), 16);
			return Number.isFinite(code) ? String.fromCodePoint(code) : match;
		}
		if (lower.startsWith('#')) {
			const code = parseInt(lower.slice(1), 10);
			return Number.isFinite(code) ? String.fromCodePoint(code) : match;
		}
		return NAMED_HTML_ENTITIES[lower] ?? match;
	});

	return text
		.replace(/\u00A0/g, ' ')
		.replace(/&shy;|\u00AD/g, '')
		.replace(/\u200B/g, '')
		.replace(/\u200C/g, '')
		.replace(/\u200D/g, '');
}

function stripHtmlTags(html: string): string {
	return html.replace(/<[^>]*>/g, ' ');
}

function htmlToPlainText(html: string): string {
	const withoutTags = stripHtmlTags(html);
	const decoded = decodeHtmlEntities(withoutTags);
	return decoded.replace(/\s+/g, ' ').trim();
}

const TRAILING_BAD_PUNCT = /[,;:\u2013\u2014\-–—]+$/;
const SENTENCE_END_PATTERN = /[.!?](?:['""])?(?=\s|$)/g;
const CONNECTOR_WORDS = new Set([
	'instead',
	'however',
	'because',
	'and',
	'but',
	'or',
	'with',
	'for',
	'to',
]);

function endsWithConnector(text: string): boolean {
	const lastWord = text
		.split(/\s+/)
		.pop()
		?.replace(/[^\w']/g, '')
		.toLowerCase();
	return lastWord ? CONNECTOR_WORDS.has(lastWord) : false;
}

function stripTrailingBadPunctuation(text: string): string {
	let result = text.trim();
	while (TRAILING_BAD_PUNCT.test(result)) {
		result = result.replace(TRAILING_BAD_PUNCT, '').trim();
	}
	return result;
}

function finalizeDescription(text: string, wasTruncated: boolean): string {
	let result = stripTrailingBadPunctuation(text);

	while (endsWithConnector(result) && result.includes(' ')) {
		result = stripTrailingBadPunctuation(result.slice(0, result.lastIndexOf(' ')));
	}

	if (wasTruncated && !/[.!?]["']?$/.test(result)) {
		result = stripTrailingBadPunctuation(result);
		if (!result.endsWith('...')) {
			result += '...';
		}
	}

	return result;
}

function findSentenceCut(
	text: string,
	minLength: number,
	maxLength: number
): string | null {
	const window = text.slice(0, maxLength);
	let bestEnd = -1;

	SENTENCE_END_PATTERN.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = SENTENCE_END_PATTERN.exec(window)) !== null) {
		const endPos = match.index + match[0].length;
		if (endPos >= minLength && endPos <= maxLength) {
			bestEnd = endPos;
		}
	}

	if (bestEnd > 0) {
		return window.slice(0, bestEnd).trim();
	}

	return null;
}

function findWordCut(text: string, minLength: number, maxLength: number): string {
	const slice = text.slice(0, maxLength);
	const lastSpace = slice.lastIndexOf(' ');

	if (lastSpace >= minLength) {
		return slice.slice(0, lastSpace).trim();
	}
	if (lastSpace > 0) {
		return slice.slice(0, lastSpace).trim();
	}
	return slice.trim();
}

function truncateSeoDescription(
	text: string,
	maxLength = SEO_DESCRIPTION_MAX,
	minLength = SEO_DESCRIPTION_MIN
): string {
	const trimmed = text.trim();
	if (trimmed.length <= maxLength) {
		return finalizeDescription(trimmed, false);
	}

	const sentenceCut = findSentenceCut(trimmed, minLength, maxLength);
	if (sentenceCut) {
		return finalizeDescription(sentenceCut, true);
	}

	const wordCut = findWordCut(trimmed, minLength, maxLength);
	return finalizeDescription(wordCut, true);
}

function normalizeOptionalText(value: string | undefined): string | undefined {
	if (value == null) return undefined;
	const plain = htmlToPlainText(value);
	return plain || undefined;
}

function getContentBlocks(article: Article): ContentBlock[] | undefined {
	if (article.contentBlocks?.length) return article.contentBlocks;
	const raw = (article as Article & { content_blocks?: ContentBlock[] }).content_blocks;
	return raw?.length ? raw : undefined;
}

function getFirstParagraphPlainText(article: Article): string | undefined {
	const blocks = getContentBlocks(article);
	if (!blocks) return undefined;

	for (const block of blocks) {
		if (block.type !== 'paragraph') continue;
		const plain = normalizeOptionalText(block.text);
		if (plain) return plain;
	}

	return undefined;
}

function getMetaDescriptionField(article: Article): string | undefined {
	const fromCamel = normalizeOptionalText(article.metaDescription);
	if (fromCamel) return fromCamel;

	const raw = (article as Article & { meta_description?: string }).meta_description;
	return normalizeOptionalText(raw);
}

/**
 * SEO description fallback:
 * metaDescription → excerpt → first paragraph block → legacy content HTML → title suffix
 */
export function getArticleSeoDescription(article: Article): string {
	const fromMeta = getMetaDescriptionField(article);
	if (fromMeta) return truncateSeoDescription(fromMeta);

	const fromExcerpt = normalizeOptionalText(article.excerpt);
	if (fromExcerpt) return truncateSeoDescription(fromExcerpt);

	const fromParagraph = getFirstParagraphPlainText(article);
	if (fromParagraph) return truncateSeoDescription(fromParagraph);

	const fromContent = normalizeOptionalText(article.content);
	if (fromContent) return truncateSeoDescription(fromContent);

	return `${article.title} | KoraScale`;
}

export { htmlToPlainText, truncateSeoDescription };
