/**
 * PR-J4A active Journey content & SEO audit core (read-only).
 * No DB writes, no apply/update helpers.
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

import { resolveCanonicalJourneySlug } from '@/lib/journeyNormalization/sitemap';
import { isPublicJourneyStatusStrict } from '@/lib/journeyNormalization/status';

export const SITE_URL = 'https://www.korascale.com';
export const EXPECTED_ACTIVE_COUNT = 24;

export const SEARCH_INTENTS = [
	'DAY_TOUR',
	'MULTI_DAY_ITINERARY',
	'CITY_COMBINATION',
	'REGIONAL_ROUTE',
	'CULTURE_EXPERIENCE',
	'NATURE_ADVENTURE',
	'LUXURY_PRIVATE_TOUR',
	'FIRST_TIME_CHINA',
	'SPECIAL_INTEREST',
] as const;

export type SearchIntent = (typeof SEARCH_INTENTS)[number];
export type MetaAction = 'KEEP' | 'MINOR_EDIT' | 'REWRITE' | 'MERGE_REVIEW';
export type PriorityBand = 'P0' | 'P1' | 'P2' | 'P3';
export type CannibalAction =
	| 'KEEP_SEPARATE'
	| 'DIFFERENTIATE'
	| 'REWRITE'
	| 'MERGE_REVIEW'
	| 'ARCHIVE_REVIEW'
	| 'REDIRECT_REVIEW';

export type DbRow = Record<string, unknown>;

export type JourneySnapshot = {
	id: string;
	slug: string;
	canonical_slug: string;
	status: string;
	journey_type_slug: string;
	title: string;
	h1: string;
	page_title: string;
	meta_description: string;
	short_description: string;
	hero_image_url: string;
	hero_image_alt: string;
	seo_complete: boolean;
	display_order: number | null;
	created_at: string;
	updated_at: string;
	duration_days: number | null;
	itinerary_day_count: number;
	itinerary_section_count: number;
	highlights_count: number;
	inclusions_count: number;
	exclusions_count: number;
	gallery_image_count: number;
	faq_count: number;
	related_journey_count: number;
	related_article_count: number;
	cta_presence: boolean;
	json_ld_types: string[];
	visible_body_word_count: number;
	destination_entities: string[];
	route_entities: string[];
	city_coverage: string[];
	province_region_coverage: string[];
};

export type ProductionPageAudit = {
	id: string;
	slug: string;
	url: string;
	http_status: number;
	canonical: string;
	robots: string;
	html_title: string;
	meta_description: string;
	h1: string;
	h1_count: number;
	og_title: string;
	og_description: string;
	og_image: string;
	json_ld_types: string;
	json_ld_trip_name: string;
	json_ld_trip_description: string;
	json_ld_trip_image: string;
	visible_word_count: number;
	faq_markup_present: boolean;
	faq_count_dom: number;
	breadcrumb_markup_present: boolean;
	cta_link_present: boolean;
	broken_internal_links: string;
	missing_images: string;
	duplicate_title: boolean;
	duplicate_meta: boolean;
	duplicate_h1: boolean;
	canonical_mismatch: boolean;
	hero_dom_note: string;
	notes: string;
};

export type ScoreBreakdown = {
	total_score: number;
	current_quality_score: number;
	optimization_opportunity: number;
	search_intent_score: number;
	title_meta_score: number;
	content_score: number;
	route_trust_score: number;
	technical_score: number;
	internal_link_score: number;
	conversion_score: number;
	commercial_value_score: number;
	score_evidence: string;
};

export type MatrixRow = JourneySnapshot &
	ScoreBreakdown & {
		primary_search_intent: SearchIntent;
		secondary_search_intents: string;
		primary_query_concept: string;
		secondary_query_concepts: string;
		destination_intent: string;
		route_intent: string;
		duration_intent: string;
		experience_intent: string;
		audience_intent: string;
		title_action: MetaAction;
		h1_action: MetaAction;
		page_title_action: MetaAction;
		meta_description_action: MetaAction;
		route_clarity_notes: string;
		itinerary_quality_notes: string;
		unique_value_notes: string;
		trust_notes: string;
		faq_quality_notes: string;
		faq_directions: string;
		internal_linking_notes: string;
		suggested_inspiration_links: string;
		suggested_journey_links: string;
		destination_hub_link: string;
		cta_recommendation: string;
		priority_band: PriorityBand;
		batch_wave: string;
		fact_check_flags: string;
		archived_references: string;
	};

export type CannibalGroup = {
	group_id: string;
	group_theme: string;
	journey_ids: string;
	slugs: string;
	overlap_reason: string;
	recommended_action: CannibalAction;
	};

export const BATCH0_FACT_CHECK_SLUGS = [
	'jiuzhaigou-cultural-adventure-4-day-tour',
	'xian-culture-mount-hua-in-depth-4-day-tour',
] as const;

export const BATCH1_RECOMMENDED_SLUGS = [
	'grand-china-highlights-16-day-multi-city-journey',
	'yunnan-kunming-dali-lijiang-shangri-la-9-day-tour',
	'xian-terracotta-warriors-tang-paradise-night-tour',
	'beijing-city-imperial-grandeur-urban-chic-1-day-tour',
	'xining-to-lhasa-mount-everest-tibet-grand-10-day-tour',
	'shanghai-suzhou-classic-dual-city-7-day-tour',
] as const;

const ABSTRACT_PHRASES = [
	'navigating the monumental',
	'uncovering the subterranean',
	'neon reveries',
	'discover the soul',
	'beyond imagination',
	'avant-garde ambition',
	'cultural renaissance',
	'dynastic history and the avant-garde',
];

const CITY_KEYWORDS: Record<string, string> = {
	beijing: 'Beijing',
	'xi-an': "Xi'an",
	xian: "Xi'an",
	shanghai: 'Shanghai',
	chengdu: 'Chengdu',
	chongqing: 'Chongqing',
	guilin: 'Guilin',
	yangshuo: 'Yangshuo',
	yunnan: 'Yunnan',
	kunming: 'Kunming',
	dali: 'Dali',
	lijiang: 'Lijiang',
	'shangri-la': 'Shangri-La',
	lhasa: 'Lhasa',
	tibet: 'Tibet',
	xining: 'Xining',
	everest: 'Mount Everest',
	zhangjiajie: 'Zhangjiajie',
	fenghuang: 'Fenghuang',
	suzhou: 'Suzhou',
	huangshan: 'Huangshan',
	huizhou: 'Huizhou',
	guangzhou: 'Guangzhou',
	chaoshan: 'Chaoshan',
	chaozhou: 'Chaozhou',
	xiamen: 'Xiamen',
	jiuzhaigou: 'Jiuzhaigou',
	huanglong: 'Huanglong',
	leshan: 'Leshan',
	emei: 'Emei Mountain',
	siguniang: 'Siguniang Mountain',
	badaling: 'Badaling Great Wall',
	mutianyu: 'Mutianyu Great Wall',
	shanxi: 'Shanxi',
	'great-wall': 'Great Wall',
	'great wall': 'Great Wall',
};

export function loadEnvLocal() {
	const envPath = path.join(process.cwd(), '.env.local');
	if (!fs.existsSync(envPath)) return;
	for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const idx = trimmed.indexOf('=');
		if (idx === -1) continue;
		const key = trimmed.slice(0, idx).trim();
		let value = trimmed.slice(idx + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (!(key in process.env)) process.env[key] = value;
	}
}

export function csvEscape(v: unknown): string {
	const s = v == null ? '' : String(v);
	if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
	return s;
}

export function pickStr(...vals: unknown[]): string {
	for (const v of vals) {
		if (typeof v === 'string' && v.trim()) return v.trim();
	}
	return '';
}

export function countArray(v: unknown): number {
	return Array.isArray(v) ? v.length : 0;
}

export function parseDurationDays(duration: unknown, itineraryCount: number): number | null {
	if (typeof duration === 'string') {
		const m = duration.match(/\d+/);
		if (m) return parseInt(m[0], 10);
	}
	return itineraryCount > 0 ? itineraryCount : null;
}

export function countWords(text: string): number {
	return text
		.replace(/<[^>]+>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.split(' ')
		.filter(Boolean).length;
}

export function extractEntities(text: string): string[] {
	const lower = text.toLowerCase();
	const found = new Set<string>();
	for (const [needle, label] of Object.entries(CITY_KEYWORDS)) {
		if (lower.includes(needle)) found.add(label);
	}
	return [...found].sort();
}

export function decodeHtmlEntities(text: string): string {
	return text
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#39;/g, "'")
		.replace(/&quot;/g, '"')
		.replace(/&#x27;/gi, "'");
}

export function extractMeta(html: string, property: string): string {
	const og = html.match(
		new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
	);
	if (og?.[1]) return decodeHtmlEntities(og[1].trim());
	const name = html.match(
		new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
	);
	return name?.[1] ? decodeHtmlEntities(name[1].trim()) : '';
}

export function extractTitle(html: string): string {
	const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
	return m?.[1] ? decodeHtmlEntities(m[1].trim()) : '';
}

export function extractCanonical(html: string): string {
	const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
	return m?.[1]?.trim() ?? '';
}

export function extractRobots(html: string): string {
	return extractMeta(html, 'robots');
}

export function extractAllH1(html: string): string[] {
	return [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) =>
		decodeHtmlEntities(m[1].replace(/<[^>]+>/g, '').trim())
	);
}

export function extractJsonLdBlocks(html: string): Record<string, unknown>[] {
	const blocks: Record<string, unknown>[] = [];
	for (const match of html.matchAll(
		/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
	)) {
		try {
			const parsed = JSON.parse(match[1]);
			if (Array.isArray(parsed)) blocks.push(...parsed);
			else blocks.push(parsed);
		} catch {
			// skip invalid JSON-LD
		}
	}
	return blocks;
}

export function jsonLdTypesFromBlocks(blocks: Record<string, unknown>[]): string[] {
	const types = new Set<string>();
	for (const block of blocks) {
		const t = block['@type'];
		if (typeof t === 'string') types.add(t);
	}
	return [...types].sort();
}

export function visibleBodyWordCountFromHtml(html: string): number {
	const body = html.match(/<body[\s\S]*<\/body>/i)?.[0] ?? html;
	const text = body.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ');
	return countWords(text);
}

export function hasFaqMarkup(html: string): { present: boolean; count: number } {
	const faqSection =
		/faq|frequently asked/i.test(html) &&
		(/<details[\s>]/i.test(html) || /<h[23][^>]*>[\s\S]*?\?[\s\S]*?<\/h[23]>/i.test(html));
	const faqJsonLd = extractJsonLdBlocks(html).some((b) => b['@type'] === 'FAQPage');
	const count =
		(html.match(/<details[\s>]/gi) ?? []).length +
		(faqJsonLd ? extractJsonLdBlocks(html).filter((b) => b['@type'] === 'FAQPage').length : 0);
	return { present: faqSection || faqJsonLd, count };
}

export function hasBreadcrumbMarkup(html: string): boolean {
	return (
		extractJsonLdBlocks(html).some((b) => b['@type'] === 'BreadcrumbList') ||
		/<nav[^>]*aria-label=["'][^"']*breadcrumb/i.test(html) ||
		/breadcrumb/i.test(html)
	);
}

export function detectCtaLink(html: string): boolean {
	return (
		/inquir|contact|plan your|custom journey|get in touch/i.test(html) &&
		/href=["'][^"']*(contact|inquir|#)/i.test(html)
	);
}

export function findBrokenInternalLinks(html: string): string[] {
	const broken: string[] = [];
	for (const match of html.matchAll(/href=["'](\/[^"']+)["']/gi)) {
		const href = match[1];
		if (href.includes('undefined') || href.includes('null') || href === '/journeys/') {
			broken.push(href);
		}
	}
	return [...new Set(broken)];
}

export function findMissingImages(html: string): string[] {
	const missing: string[] = [];
	for (const match of html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
		const src = match[1];
		if (!src || src === '#' || src.includes('placeholder')) missing.push(src);
	}
	return missing.slice(0, 5);
}

function countInclusions(data: DbRow): number {
	const included = countArray(data.included) + countArray(data.standardInclusionsList);
	const standard = data.standardInclusions;
	let standardCount = 0;
	if (standard && typeof standard === 'object') {
		standardCount = Object.values(standard as Record<string, unknown>).filter((v) => v === true)
			.length;
	}
	return Math.max(included, standardCount);
}

function countGalleryImages(data: DbRow, row: DbRow): number {
	const images = new Set<string>();
	for (const img of [...(Array.isArray(data.images) ? data.images : []), row.image, data.heroImage, data.mainContentImage]) {
		if (typeof img === 'string' && img.trim()) images.add(img.trim());
	}
	if (data.overview && typeof data.overview === 'object') {
		const ov = data.overview as DbRow;
		if (typeof ov.sideImage === 'string' && ov.sideImage.trim()) images.add(ov.sideImage.trim());
	}
	return images.size;
}

function itinerarySectionCount(data: DbRow, itineraryCount: number): number {
	const modules = countArray(data.modules);
	const overviewHighlights =
		data.overview && typeof data.overview === 'object'
			? countArray((data.overview as DbRow).highlights)
			: 0;
	return Math.max(modules, overviewHighlights, itineraryCount > 0 ? 1 : 0);
}

function dbVisibleWordCount(row: DbRow, data: DbRow): number {
	const chunks: string[] = [
		pickStr(row.description, data.description),
		pickStr(row.short_description, data.shortDescription),
	];
	if (Array.isArray(data.itinerary)) {
		for (const day of data.itinerary as DbRow[]) {
			chunks.push(pickStr(day.description, day.title));
			if (Array.isArray(day.activities)) chunks.push(day.activities.join(' '));
		}
	}
	if (Array.isArray(data.highlights)) chunks.push((data.highlights as string[]).join(' '));
	return countWords(chunks.join(' '));
}

function routeEntitiesFromSnapshot(snapshot: JourneySnapshot): string[] {
	const route = new Set<string>();
	for (const entity of snapshot.destination_entities) route.add(entity);
	const excerpt = snapshot.short_description.toLowerCase();
	if (/begins.*ends/.test(excerpt)) route.add(snapshot.short_description);
	return [...route];
}

export function mapRowToSnapshot(row: DbRow, relatedArticleCount: number): JourneySnapshot {
	const data = (row.data as DbRow) || {};
	const slug = pickStr(row.slug);
	const canonicalSlug = resolveCanonicalJourneySlug(slug);
	const itineraryDayCount = countArray(data.itinerary);
	const durationDays = parseDurationDays(row.duration, itineraryDayCount);
	const title = pickStr(row.title, data.title, data.name);
	const pageTitle = pickStr(row.page_title, data.pageTitle, title);
	const metaDescription = pickStr(row.meta_description, data.metaDescription);
	const shortDescription = pickStr(row.short_description, data.shortDescription);
	const heroImageUrl = pickStr(row.hero_image_url, data.heroImage, row.image, data.image);
	const heroImageAlt = pickStr(row.hero_image_alt, data.heroAlt, data.heroImageAlt);
	const journeyTypeSlug = pickStr(row.journey_type_slug, data.journeyTypeSlug);
	const region = pickStr(row.region, data.region);
	const city = pickStr(row.city, data.city);
	const place = pickStr(row.place, data.place);
	const entitySource = `${slug} ${title} ${pageTitle} ${shortDescription} ${city} ${region} ${place}`;
	const destinationEntities = extractEntities(entitySource);
	const cityCoverage = [...new Set([city, ...destinationEntities].filter(Boolean))];
	const provinceRegionCoverage = [...new Set([region, place].filter(Boolean))];

	const snapshot: JourneySnapshot = {
		id: String(row.id),
		slug,
		canonical_slug: canonicalSlug,
		status: String(row.status ?? ''),
		journey_type_slug: journeyTypeSlug,
		title,
		h1: pageTitle || title,
		page_title: pageTitle,
		meta_description: metaDescription,
		short_description: shortDescription,
		hero_image_url: heroImageUrl,
		hero_image_alt: heroImageAlt,
		seo_complete: row.seo_complete === true,
		display_order: row.display_order != null ? Number(row.display_order) : null,
		created_at: row.created_at ? new Date(String(row.created_at)).toISOString() : '',
		updated_at: row.updated_at ? new Date(String(row.updated_at)).toISOString() : '',
		duration_days: durationDays,
		itinerary_day_count: itineraryDayCount,
		itinerary_section_count: itinerarySectionCount(data, itineraryDayCount),
		highlights_count: countArray(data.highlights),
		inclusions_count: countInclusions(data),
		exclusions_count: countArray(data.excluded),
		gallery_image_count: countGalleryImages(data, row),
		faq_count: countArray(data.faqs ?? data.faq),
		related_journey_count: countArray(data.relatedTrips ?? data.relatedJourneys),
		related_article_count: relatedArticleCount,
		cta_presence: Boolean(heroImageUrl && slug),
		json_ld_types: ['Trip', 'BreadcrumbList'],
		visible_body_word_count: dbVisibleWordCount(row, data),
		destination_entities: destinationEntities,
		route_entities: [],
		city_coverage: cityCoverage,
		province_region_coverage: provinceRegionCoverage,
	};
	snapshot.route_entities = routeEntitiesFromSnapshot(snapshot);
	return snapshot;
}

export async function fetchActiveJourneyRows(): Promise<{
	active: DbRow[];
	archived: DbRow[];
	articles: DbRow[];
}> {
	loadEnvLocal();
	const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
	if (!connectionString) throw new Error('Missing POSTGRES_URL / NEON_POSTGRES_URL');

	const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
	const client = await pool.connect();
	try {
		await client.query('BEGIN TRANSACTION READ ONLY');
		const journeysRes = await client.query(`
      SELECT id, slug, status, title, short_description, description, duration, image, region, city, place,
             page_title, meta_description, hero_image_url, hero_image_alt, journey_type_slug, seo_complete,
             display_order, created_at, updated_at, data
      FROM journeys
      ORDER BY display_order NULLS LAST, slug
    `);
		const articlesRes = await client.query(`
      SELECT id, slug, status, title, related_journey_ids
      FROM articles
    `);
		await client.query('ROLLBACK');

		const journeys = journeysRes.rows as DbRow[];
		const active = journeys.filter((row) => isPublicJourneyStatusStrict(row.status));
		const archived = journeys.filter(
			(row) => String(row.status ?? '').trim().toLowerCase() === 'archived'
		);
		return { active, archived, articles: articlesRes.rows as DbRow[] };
	} finally {
		client.release();
		await pool.end();
	}
}

export function relatedArticleCountForJourney(journeyId: string, articles: DbRow[]): number {
	let count = 0;
	for (const article of articles) {
		if (String(article.status ?? '').trim().toLowerCase() !== 'active') continue;
		const ids = article.related_journey_ids;
		if (!Array.isArray(ids)) continue;
		if (ids.map(String).includes(String(journeyId))) count += 1;
	}
	return count;
}

export function buildSnapshots(
	activeRows: DbRow[],
	articles: DbRow[]
): JourneySnapshot[] {
	return activeRows.map((row) =>
		mapRowToSnapshot(row, relatedArticleCountForJourney(String(row.id), articles))
	);
}

function isAbstractCopy(text: string): boolean {
	const lower = text.toLowerCase();
	return ABSTRACT_PHRASES.some((p) => lower.includes(p));
}

export function classifyPrimarySearchIntent(snapshot: JourneySnapshot): SearchIntent {
	const text = `${snapshot.slug} ${snapshot.title} ${snapshot.page_title} ${snapshot.short_description}`.toLowerCase();
	const days = snapshot.duration_days ?? snapshot.itinerary_day_count;

	if (/black-myth|wukong|special interest|terracotta.*night|tang paradise/.test(text)) {
		return 'SPECIAL_INTEREST';
	}
	if (days === 1 || /\b1[- ]day\b|one[- ]day\b|single[- ]day/.test(text)) return 'DAY_TOUR';
	if (/grand-china-highlights|multi-city-journey|first-time|grand china highlights/.test(text)) {
		return 'FIRST_TIME_CHINA';
	}
	if (/everest|highlands|siguniang|jiuzhaigou|huanglong|zhangjiajie|mount hua|nature/.test(text)) {
		return 'NATURE_ADVENTURE';
	}
	if (/cultural|heritage|architecture|imperial|terracotta|chaoshan|huizhou/.test(text)) {
		return 'CULTURE_EXPERIENCE';
	}
	if (
		/shanghai.*suzhou|chengdu.*chongqing|guangzhou.*xiamen|zhangjiajie.*fenghuang|dual-city|double cit/.test(
			text
		)
	) {
		return 'CITY_COMBINATION';
	}
	if (/yunnan|tibet|lhasa|xining|shanxi|chaoshan|guilin|huangshan|beijing-to/.test(text) && (days ?? 0) >= 5) {
		return 'REGIONAL_ROUTE';
	}
	if ((days ?? 0) >= 7) return 'MULTI_DAY_ITINERARY';
	if (/private|limited to|deep discovery/.test(text)) return 'LUXURY_PRIVATE_TOUR';
	return days && days >= 2 ? 'MULTI_DAY_ITINERARY' : 'DAY_TOUR';
}

export function classifySecondaryIntents(snapshot: JourneySnapshot, primary: SearchIntent): SearchIntent[] {
	const secondary = new Set<SearchIntent>();
	const text = `${snapshot.slug} ${snapshot.title}`.toLowerCase();
	if (primary !== 'DAY_TOUR' && (snapshot.duration_days === 1 || snapshot.itinerary_day_count === 1)) {
		secondary.add('DAY_TOUR');
	}
	if (/culture|heritage|temple|museum/.test(text) && primary !== 'CULTURE_EXPERIENCE') {
		secondary.add('CULTURE_EXPERIENCE');
	}
	if (/nature|mountain|park|scenic/.test(text) && primary !== 'NATURE_ADVENTURE') {
		secondary.add('NATURE_ADVENTURE');
	}
	if (/deep discovery/.test(snapshot.journey_type_slug) && primary !== 'LUXURY_PRIVATE_TOUR') {
		secondary.add('LUXURY_PRIVATE_TOUR');
	}
	secondary.delete(primary);
	return [...secondary];
}

export function normalizeCompare(text: string): string {
	return text.toLowerCase().replace(/\s+/g, ' ').replace(/\| korascale travel/gi, '').trim();
}

export function auditMetaActions(
	snapshot: JourneySnapshot,
	all: JourneySnapshot[],
	page?: ProductionPageAudit
): {
	title_action: MetaAction;
	h1_action: MetaAction;
	page_title_action: MetaAction;
	meta_description_action: MetaAction;
} {
	const titleNorm = normalizeCompare(snapshot.title);
	const pageTitleNorm = normalizeCompare(snapshot.page_title);
	const metaNorm = normalizeCompare(snapshot.meta_description);
	const shortNorm = normalizeCompare(snapshot.short_description);

	const duplicateTitle = all.some(
		(j) => j.id !== snapshot.id && normalizeCompare(j.title) === titleNorm && titleNorm.length > 0
	);
	const duplicatePageTitle = all.some(
		(j) => j.id !== snapshot.id && normalizeCompare(j.page_title) === pageTitleNorm && pageTitleNorm.length > 0
	);
	const duplicateMeta = all.some(
		(j) => j.id !== snapshot.id && normalizeCompare(j.meta_description) === metaNorm && metaNorm.length > 0
	);

	let title_action: MetaAction = 'KEEP';
	if (isAbstractCopy(snapshot.title)) title_action = 'REWRITE';
	else if (duplicateTitle) title_action = 'MERGE_REVIEW';
	else if (snapshot.title.length > 90) title_action = 'MINOR_EDIT';

	let h1_action: MetaAction = 'KEEP';
	if (page && page.h1_count !== 1) h1_action = 'REWRITE';
	else if (normalizeCompare(snapshot.h1) === titleNorm && !snapshot.h1.includes('-Day')) h1_action = 'MINOR_EDIT';
	else if (isAbstractCopy(snapshot.h1)) h1_action = 'REWRITE';

	let page_title_action: MetaAction = 'KEEP';
	if (duplicatePageTitle) page_title_action = 'MERGE_REVIEW';
	else if (isAbstractCopy(snapshot.page_title)) page_title_action = 'REWRITE';
	else if (pageTitleNorm !== titleNorm && !/\d-day|\d day/i.test(snapshot.page_title)) {
		page_title_action = 'MINOR_EDIT';
	}

	let meta_description_action: MetaAction = 'KEEP';
	if (duplicateMeta) meta_description_action = 'REWRITE';
	else if (isAbstractCopy(snapshot.meta_description)) meta_description_action = 'REWRITE';
	else if (metaNorm === shortNorm) meta_description_action = 'MINOR_EDIT';
	else if (snapshot.meta_description.length < 60) meta_description_action = 'MINOR_EDIT';

	return { title_action, h1_action, page_title_action, meta_description_action };
}

function durationMismatch(snapshot: JourneySnapshot): boolean {
	const days = snapshot.duration_days ?? snapshot.itinerary_day_count;
	const titleDays = snapshot.page_title.match(/(\d+)[-\s]day/i)?.[1];
	if (!titleDays || days == null) return false;
	return Number(titleDays) !== days;
}

function requiresBatch0FactCheck(snapshot: JourneySnapshot): boolean {
	return BATCH0_FACT_CHECK_SLUGS.includes(snapshot.slug as (typeof BATCH0_FACT_CHECK_SLUGS)[number]);
}

export function buildContentNotes(snapshot: JourneySnapshot): {
	route_clarity_notes: string;
	itinerary_quality_notes: string;
	unique_value_notes: string;
	trust_notes: string;
	fact_check_flags: string[];
} {
	const flags: string[] = [];
	const routeNotes: string[] = [];
	const itineraryNotes: string[] = [];
	const uniqueNotes: string[] = [];
	const trustNotes: string[] = [];

	if (snapshot.short_description) routeNotes.push(`Route summary: ${snapshot.short_description}`);
	else routeNotes.push('Missing concise route summary in short_description.');
	if (durationMismatch(snapshot)) {
		routeNotes.push('Duration mismatch between title/slug/page_title and itinerary/duration fields.');
		flags.push('FACT_CHECK_REQUIRED:duration_consistency');
	}
	if (requiresBatch0FactCheck(snapshot) && !flags.includes('FACT_CHECK_REQUIRED:duration_consistency')) {
		routeNotes.push('Title, slug, page_title, and itinerary duration need source-of-truth confirmation.');
		flags.push('FACT_CHECK_REQUIRED:duration_consistency');
	}
	if (snapshot.slug.endsWith('-')) {
		routeNotes.push('Slug has trailing hyphen; canonical URL hygiene risk.');
		flags.push('FACT_CHECK_REQUIRED:slug_trailing_hyphen');
	}

	if (snapshot.itinerary_day_count === 0) itineraryNotes.push('No itinerary days in data.');
	else if (snapshot.visible_body_word_count < snapshot.itinerary_day_count * 80) {
		itineraryNotes.push('Itinerary copy appears thin relative to day count (proxy heuristic).');
	}
	if (snapshot.highlights_count === 0) itineraryNotes.push('No structured highlights array.');
	if (isAbstractCopy(snapshot.short_description) || isAbstractCopy(snapshot.meta_description)) {
		itineraryNotes.push('Marketing copy uses abstract phrasing instead of concrete day-by-day specifics.');
	}

	if (snapshot.journey_type_slug === 'explore-together') {
		uniqueNotes.push('Explore Together SKU; emphasize same-day logistics and private guide value.');
	} else {
		uniqueNotes.push('Deep Discovery multi-day route; differentiation should come from city sequence and pacing.');
	}

	if (/tibet|lhasa|everest|jiuzhaigou|siguniang|emei|huangshan/.test(snapshot.slug)) {
		trustNotes.push('High-altitude or seasonal route; needs explicit season, altitude, and fitness guidance.');
		flags.push('FACT_CHECK_REQUIRED:season_altitude_fitness');
	}
	if (snapshot.inclusions_count === 0) trustNotes.push('Inclusions not surfaced in structured fields.');
	if (!snapshot.hero_image_alt) trustNotes.push('Missing hero_image_alt.');
	if (snapshot.faq_count === 0) trustNotes.push('No FAQ content in Journey data.');

	return {
		route_clarity_notes: routeNotes.join(' '),
		itinerary_quality_notes: itineraryNotes.join(' '),
		unique_value_notes: uniqueNotes.join(' '),
		trust_notes: trustNotes.join(' '),
		fact_check_flags: flags,
	};
}

export function suggestFaqDirections(snapshot: JourneySnapshot): string[] {
	const dirs: string[] = [];
	const slug = snapshot.slug;
	if (/tibet|lhasa|everest|xining/.test(slug)) {
		dirs.push('Best season and altitude acclimatization', 'Permits and travel pace', 'Fitness requirements');
	}
	if (/jiuzhaigou|huanglong|siguniang/.test(slug)) {
		dirs.push('Best season and weather windows', 'High-speed rail vs road segments', 'Luggage and pacing');
	}
	if (/great-wall|badaling|mutianyu/.test(slug)) {
		dirs.push('Crowd timing and wall section choice', 'Private transfer and hiking options', 'Suitable for children/seniors');
	}
	if (/day-tour|day tour/.test(slug)) {
		dirs.push('Pickup area and daily pace', 'What is included in a private day tour', 'Customization boundaries');
	}
	if (dirs.length < 3) {
		dirs.push('Who this route suits', 'Typical hotel standard and flexibility', 'How private customization works');
	}
	return dirs.slice(0, 6);
}

export function suggestInternalLinks(snapshot: JourneySnapshot, all: JourneySnapshot[]): {
	suggested_inspiration_links: string;
	suggested_journey_links: string;
	destination_hub_link: string;
	cta_recommendation: string;
	internal_linking_notes: string;
} {
	const sameCity = all.filter(
		(j) =>
			j.id !== snapshot.id &&
			j.destination_entities.some((d) => snapshot.destination_entities.includes(d))
	);
	const complementary = sameCity
		.filter((j) => j.journey_type_slug !== snapshot.journey_type_slug)
		.slice(0, 2)
		.map((j) => j.slug);
	const peer = sameCity
		.filter((j) => j.journey_type_slug === snapshot.journey_type_slug)
		.slice(0, 2)
		.map((j) => j.slug);

	const inspiration = [
		`${snapshot.destination_entities[0] ?? 'China'} travel planning guide (Inspiration hub)`,
		`${snapshot.journey_type_slug.replace(/-/g, ' ')} route planning article`,
	].slice(0, 4);

	return {
		suggested_inspiration_links: inspiration.join('; '),
		suggested_journey_links: [...complementary, ...peer].slice(0, 3).join('; '),
		destination_hub_link: snapshot.destination_entities[0]
			? `Link to ${snapshot.destination_entities[0]} destination hub when available`
			: 'Link to regional Journeys hub',
		cta_recommendation: 'Journey-specific inquiry CTA with slug context (current page pattern)',
		internal_linking_notes:
			snapshot.related_article_count === 0 && snapshot.related_journey_count === 0
				? 'Weak contextual internal linking: missing related content and insufficient destination/article connections.'
				: `Related articles=${snapshot.related_article_count}; related journeys=${snapshot.related_journey_count}.`,
	};
}

export function scoreJourney(
	snapshot: JourneySnapshot,
	meta: ReturnType<typeof auditMetaActions>,
	contentNotes: ReturnType<typeof buildContentNotes>,
	page: ProductionPageAudit | undefined,
	primaryIntent: SearchIntent
): ScoreBreakdown {
	const evidence: string[] = [];
	let search_intent_score = 8;
	if (primaryIntent && snapshot.destination_entities.length >= 1) search_intent_score += 4;
	if (/\d-day|\d day|day tour|day-tour/.test(`${snapshot.page_title} ${snapshot.slug}`)) {
		search_intent_score += 3;
	} else search_intent_score -= 2;
	search_intent_score = Math.max(0, Math.min(15, search_intent_score));
	evidence.push(`search_intent=${search_intent_score}`);

	let title_meta_score = 15;
	for (const [field, action] of [
		['title', meta.title_action],
		['page_title', meta.page_title_action],
		['meta_description', meta.meta_description_action],
	] as const) {
		if (action === 'REWRITE') title_meta_score -= 4;
		if (action === 'MERGE_REVIEW') title_meta_score -= 3;
		if (action === 'MINOR_EDIT') title_meta_score -= 1;
		if (
			field === 'meta_description' &&
			action === 'REWRITE' &&
			/^[A-Za-z'’\s-]+ begins,\s*[A-Za-z'’\s-]+ ends$/i.test(snapshot.meta_description.trim())
		) {
			title_meta_score += 1;
		}
	}
	title_meta_score = Math.max(0, Math.min(15, title_meta_score));
	evidence.push(`title_meta=${title_meta_score}`);

	let content_score = 10;
	if (snapshot.itinerary_day_count >= (snapshot.duration_days ?? 1)) content_score += 4;
	if (snapshot.visible_body_word_count >= snapshot.itinerary_day_count * 100) content_score += 4;
	else content_score += 1;
	if (snapshot.highlights_count > 0) content_score += 2;
	if (isAbstractCopy(snapshot.short_description)) content_score -= 4;
	content_score = Math.max(0, Math.min(20, content_score));
	evidence.push(`content=${content_score}`);

	let route_trust_score = 10;
	if (!durationMismatch(snapshot)) route_trust_score += 3;
	if (snapshot.short_description.includes('begins')) route_trust_score += 2;
	if (contentNotes.fact_check_flags.length === 0) route_trust_score += 3;
	else route_trust_score -= contentNotes.fact_check_flags.length;
	if (snapshot.hero_image_alt) route_trust_score += 1;
	route_trust_score = Math.max(0, Math.min(15, route_trust_score));
	evidence.push(`route_trust=${route_trust_score}`);

	let technical_score = 0;
	if (page) {
		if (page.http_status === 200) technical_score += 2;
		if (!page.canonical_mismatch) technical_score += 2;
		if (page.breadcrumb_markup_present) technical_score += 2;
		if (page.json_ld_types.includes('Trip')) technical_score += 2;
		if (snapshot.hero_image_url) technical_score += 1;
		if (snapshot.hero_image_alt) technical_score += 1;
	} else {
		technical_score = snapshot.seo_complete ? 8 : 5;
	}
	technical_score = Math.max(0, Math.min(10, technical_score));
	evidence.push(`technical=${technical_score}`);

	let internal_link_score = 2;
	if (snapshot.related_journey_count > 0) internal_link_score += 3;
	if (snapshot.related_article_count > 0) internal_link_score += 3;
	if (page?.breadcrumb_markup_present) internal_link_score += 2;
	if (snapshot.faq_count === 0) internal_link_score -= 2;
	if (snapshot.related_article_count === 0 && snapshot.related_journey_count === 0) {
		internal_link_score -= 2;
	}
	internal_link_score = Math.max(0, Math.min(10, internal_link_score));
	evidence.push(`internal_link=${internal_link_score}`);

	let conversion_score = 4;
	if (snapshot.cta_presence) conversion_score += 3;
	if (page?.cta_link_present) conversion_score += 3;
	conversion_score = Math.max(0, Math.min(10, conversion_score));
	evidence.push(`conversion=${conversion_score}`);

	let commercial_value_score = 2;
	if (/grand-china|yunnan|tibet|beijing|shanghai|guilin|xian|jiuzhaigou|great-wall/.test(snapshot.slug)) {
		commercial_value_score += 2;
	}
	if (snapshot.journey_type_slug === 'deep-discovery') commercial_value_score += 1;
	commercial_value_score = Math.max(0, Math.min(5, commercial_value_score));
	evidence.push(`commercial=${commercial_value_score}`);

	const total_score =
		search_intent_score +
		title_meta_score +
		content_score +
		route_trust_score +
		technical_score +
		internal_link_score +
		conversion_score +
		commercial_value_score;
	const current_quality_score = total_score - commercial_value_score;
	const optimization_opportunity = Math.max(0, 100 - current_quality_score);
	evidence.push(`current_quality=${current_quality_score}`);
	evidence.push(`commercial_value_proxy=${commercial_value_score}`);
	evidence.push(`optimization_opportunity=${optimization_opportunity}`);

	return {
		total_score,
		current_quality_score,
		optimization_opportunity,
		search_intent_score,
		title_meta_score,
		content_score,
		route_trust_score,
		technical_score,
		internal_link_score,
		conversion_score,
		commercial_value_score,
		score_evidence: evidence.join('; '),
	};
}

export function assignPriorityBand(
	snapshot: JourneySnapshot,
	score: ScoreBreakdown,
	meta: ReturnType<typeof auditMetaActions>,
	page: ProductionPageAudit | undefined,
	contentNotes: ReturnType<typeof buildContentNotes>
): PriorityBand {
	if (
		(page && page.http_status !== 200) ||
		(page && page.canonical_mismatch) ||
		requiresBatch0FactCheck(snapshot) ||
		durationMismatch(snapshot) ||
		snapshot.slug.endsWith('-') ||
		contentNotes.fact_check_flags.some((f) => f.includes('duration'))
	) {
		return 'P0';
	}
	if (
		meta.title_action === 'MERGE_REVIEW' ||
		meta.page_title_action === 'MERGE_REVIEW'
	) {
		return 'P3';
	}
	if (score.total_score >= 62 && score.commercial_value_score >= 3) return 'P1';
	if (score.total_score >= 48) return 'P2';
	return 'P3';
}

export function buildCannibalizationGroups(snapshots: JourneySnapshot[]): CannibalGroup[] {
	const groups: CannibalGroup[] = [];
	let groupCounter = 1;

	const pushGroup = (
		theme: string,
		members: JourneySnapshot[],
		reason: string,
		action: CannibalAction
	) => {
		if (members.length < 2) return;
		groups.push({
			group_id: `G${String(groupCounter++).padStart(2, '0')}`,
			group_theme: theme,
			journey_ids: members.map((m) => m.id).join('|'),
			slugs: members.map((m) => m.slug).join('|'),
			overlap_reason: reason,
			recommended_action: action,
		});
	};

	const byKey = (keyFn: (s: JourneySnapshot) => string) => {
		const map = new Map<string, JourneySnapshot[]>();
		for (const s of snapshots) {
			const key = keyFn(s);
			if (!key) continue;
			const list = map.get(key) ?? [];
			list.push(s);
			map.set(key, list);
		}
		return map;
	};

	pushGroup(
		'Beijing Great Wall day tours',
		snapshots.filter((s) => /badaling|mutianyu|great-wall/.test(s.slug)),
		'Same destination (Great Wall) and 1-day private tour intent',
		'DIFFERENTIATE'
	);

	pushGroup(
		'Beijing multi-day city tours',
		snapshots.filter((s) => /beijing-cultural|beijing-city-imperial/.test(s.slug)),
		'Both target Beijing city highlights with overlapping audience',
		'DIFFERENTIATE'
	);

	pushGroup(
		'Chaoshan / Guangdong coastal loop',
		snapshots.filter((s) => /chaoshan|guangzhou-chaoshan/.test(s.slug)),
		'Primary search intent, destination, route, and itinerary overlap are all high; review whether the products have enough durable difference.',
		'MERGE_REVIEW'
	);

	pushGroup(
		'Jiuzhaigou nature routes from Chengdu',
		snapshots.filter((s) => /jiuzhaigou/.test(s.slug)),
		'Same core parks (Jiuzhaigou/Huanglong) with different durations and transport framing',
		'DIFFERENTIATE'
	);

	pushGroup(
		"Tibet / Himalaya routes",
		snapshots.filter((s) => /lhasa|tibet|everest|xining-to-lhasa|grand-china-highlands/.test(s.slug)),
		'Overlapping Tibet/Everest/Yunnan-Tibet highlands keywords',
		'DIFFERENTIATE'
	);

	pushGroup(
		"Xi'an experiences",
		snapshots.filter((s) => /xian/.test(s.slug)),
		"Both target Xi'an culture; 1-day vs multi-day cannibalization risk",
		'DIFFERENTIATE'
	);

	const metaMap = byKey((s) => normalizeCompare(s.meta_description));
	for (const [meta, members] of metaMap) {
		if (members.length > 1 && meta.length > 20) {
			pushGroup(
				'Duplicate meta descriptions (rewrite only)',
				members,
				`Identical meta_description text: "${meta.slice(0, 80)}"; metadata duplication only, not product merge evidence.`,
				'REWRITE'
			);
		}
	}

	const titleMap = byKey((s) => normalizeCompare(s.page_title.replace(/\| korascale travel/gi, '')));
	for (const [title, members] of titleMap) {
		if (members.length > 1 && title.length > 20) {
			pushGroup(
				'Duplicate page titles',
				members,
				`Identical page_title: "${title.slice(0, 80)}"`,
				'MERGE_REVIEW'
			);
		}
	}

	return groups;
}

export function findArchivedReferences(
	snapshot: JourneySnapshot,
	archivedRows: DbRow[],
	groups: CannibalGroup[]
): string {
	const inGroup = groups.some((g) => g.slugs.split('|').includes(snapshot.slug));
	if (!inGroup) return '';

	const refs: string[] = [];
	for (const row of archivedRows) {
		const slug = pickStr(row.slug);
		if (!slug) continue;
		const overlap = snapshot.destination_entities.some((d) => slug.toLowerCase().includes(d.toLowerCase().replace(/\s+/g, '-')));
		const slugOverlap = snapshot.slug.split('-').some((part) => part.length > 4 && slug.includes(part));
		if (overlap || slugOverlap) {
			refs.push(`${row.id}:${slug}:possible_archive_substitute_or_merge_candidate`);
		}
	}
	return refs.slice(0, 5).join('; ');
}

export async function fetchProductionPageAudit(
	snapshot: JourneySnapshot,
	duplicateTitles: Set<string>,
	duplicateMetas: Set<string>,
	duplicateH1s: Set<string>
): Promise<ProductionPageAudit> {
	const slug = snapshot.canonical_slug || snapshot.slug;
	const url = `${SITE_URL}/journeys/${slug}`;
	let http_status = 0;
	let html = '';
	try {
		const response = await fetch(url, { redirect: 'follow' });
		http_status = response.status;
		html = await response.text();
	} catch (err) {
		return {
			id: snapshot.id,
			slug: snapshot.slug,
			url,
			http_status: 0,
			canonical: '',
			robots: '',
			html_title: '',
			meta_description: '',
			h1: '',
			h1_count: 0,
			og_title: '',
			og_description: '',
			og_image: '',
			json_ld_types: '',
			json_ld_trip_name: '',
			json_ld_trip_description: '',
			json_ld_trip_image: '',
			visible_word_count: 0,
			faq_markup_present: false,
			faq_count_dom: 0,
			breadcrumb_markup_present: false,
			cta_link_present: false,
			broken_internal_links: '',
			missing_images: '',
			duplicate_title: false,
			duplicate_meta: false,
			duplicate_h1: false,
			canonical_mismatch: true,
			hero_dom_note: 'Fetch failed',
			notes: String(err),
		};
	}

	const blocks = extractJsonLdBlocks(html);
	const types = jsonLdTypesFromBlocks(blocks);
	const trip = blocks.find((b) => b['@type'] === 'Trip') ?? {};
	const h1s = extractAllH1(html);
	const htmlTitle = extractTitle(html);
	const metaDescription = extractMeta(html, 'description');
	const canonical = extractCanonical(html);
	const faq = hasFaqMarkup(html);
	const expectedCanonical = `${SITE_URL}/journeys/${slug}`;

	return {
		id: snapshot.id,
		slug: snapshot.slug,
		url,
		http_status,
		canonical,
		robots: extractRobots(html),
		html_title: htmlTitle,
		meta_description: metaDescription,
		h1: h1s[0] ?? '',
		h1_count: h1s.length,
		og_title: extractMeta(html, 'og:title'),
		og_description: extractMeta(html, 'og:description'),
		og_image: extractMeta(html, 'og:image') || snapshot.hero_image_url,
		json_ld_types: types.join('|'),
		json_ld_trip_name: typeof trip.name === 'string' ? trip.name : '',
		json_ld_trip_description: typeof trip.description === 'string' ? trip.description : '',
		json_ld_trip_image: Array.isArray(trip.image) ? String(trip.image[0] ?? '') : String(trip.image ?? ''),
		visible_word_count: visibleBodyWordCountFromHtml(html),
		faq_markup_present: faq.present,
		faq_count_dom: faq.count,
		breadcrumb_markup_present: hasBreadcrumbMarkup(html),
		cta_link_present: detectCtaLink(html),
		broken_internal_links: findBrokenInternalLinks(html).join('|'),
		missing_images: findMissingImages(html).join('|'),
		duplicate_title: duplicateTitles.has(normalizeCompare(htmlTitle)),
		duplicate_meta: duplicateMetas.has(normalizeCompare(metaDescription)),
		duplicate_h1: duplicateH1s.has(normalizeCompare(h1s[0] ?? '')),
		canonical_mismatch: canonical !== expectedCanonical,
		hero_dom_note: 'Hero DOM selector unavailable; og:image and DB hero_image_url used as references.',
		notes: '',
	};
}

export function selectBatch1Candidates(matrix: MatrixRow[]): MatrixRow[] {
	const batch1Slugs = new Set<string>(BATCH1_RECOMMENDED_SLUGS);
	const eligible = matrix.filter((r) => batch1Slugs.has(r.slug));
	const sorted = [...eligible].sort(
		(a, b) =>
			b.commercial_value_score - a.commercial_value_score ||
			b.total_score - a.total_score
	);

	const picked: MatrixRow[] = [];
	const usedIds = new Set<string>();
	const usedIntents = new Set<string>();

	const tryPick = (row: MatrixRow | undefined) => {
		if (!row || picked.length >= 6 || usedIds.has(row.id)) return;
		picked.push(row);
		usedIds.add(row.id);
		usedIntents.add(row.primary_search_intent);
	};

	const explore = sorted.filter((r) => r.journey_type_slug === 'explore-together');
	const deep = sorted.filter((r) => r.journey_type_slug === 'deep-discovery');
	const flagshipSlugs = [...BATCH1_RECOMMENDED_SLUGS];

	for (const slug of flagshipSlugs) {
		tryPick(sorted.find((r) => r.slug === slug));
	}

	for (const row of explore) {
		if (picked.filter((p) => p.journey_type_slug === 'explore-together').length >= 2) break;
		if (usedIntents.has(row.primary_search_intent) && picked.length >= 4) continue;
		tryPick(row);
	}

	for (const row of deep) {
		if (picked.length >= 6) break;
		if (usedIntents.has(row.primary_search_intent) && picked.some((p) => p.journey_type_slug === row.journey_type_slug)) {
			continue;
		}
		tryPick(row);
	}

	for (const row of sorted) {
		if (picked.length >= 6) break;
		tryPick(row);
	}

	return picked.slice(0, 6);
}

export function buildMatrixRow(
	snapshot: JourneySnapshot,
	all: JourneySnapshot[],
	page: ProductionPageAudit | undefined,
	groups: CannibalGroup[],
	archivedRows: DbRow[]
): MatrixRow {
	const primary = classifyPrimarySearchIntent(snapshot);
	const secondary = classifySecondaryIntents(snapshot, primary);
	const meta = auditMetaActions(snapshot, all, page);
	const contentNotes = buildContentNotes(snapshot);
	const score = scoreJourney(snapshot, meta, contentNotes, page, primary);
	const priority = assignPriorityBand(snapshot, score, meta, page, contentNotes);
	const faqDirections = suggestFaqDirections(snapshot);
	const linking = suggestInternalLinks(snapshot, all);
	const archivedRefs = findArchivedReferences(snapshot, archivedRows, groups);

	const primaryQuery = [
		snapshot.destination_entities.slice(0, 2).join(' + ') || 'China',
		snapshot.duration_days ? `${snapshot.duration_days}-day` : '',
		primary.replace(/_/g, ' ').toLowerCase(),
	]
		.filter(Boolean)
		.join(' ');

	return {
		...snapshot,
		...score,
		primary_search_intent: primary,
		secondary_search_intents: secondary.join('|'),
		primary_query_concept: primaryQuery,
		secondary_query_concepts: snapshot.route_entities.slice(0, 4).join('|'),
		destination_intent: snapshot.destination_entities.join('|'),
		route_intent: snapshot.short_description || snapshot.route_entities.join('|'),
		duration_intent: snapshot.duration_days ? `${snapshot.duration_days} days` : `${snapshot.itinerary_day_count} itinerary days`,
		experience_intent: primary.replace(/_/g, ' '),
		audience_intent:
			snapshot.journey_type_slug === 'explore-together'
				? 'Private day/multi-day explorers'
				: 'Deep Discovery private groups',
		...meta,
		route_clarity_notes: contentNotes.route_clarity_notes,
		itinerary_quality_notes: contentNotes.itinerary_quality_notes,
		unique_value_notes: contentNotes.unique_value_notes,
		trust_notes: contentNotes.trust_notes,
		fact_check_flags: contentNotes.fact_check_flags.join('|'),
		faq_quality_notes:
			snapshot.faq_count === 0
				? 'No FAQ in DB; page lacks FAQPage JSON-LD.'
				: `${snapshot.faq_count} FAQ entries in DB; verify decision-usefulness.`,
		faq_directions: faqDirections.join('; '),
		...linking,
		priority_band: priority,
		batch_wave:
			requiresBatch0FactCheck(snapshot)
				? 'Batch 0 fact check required'
				: BATCH1_RECOMMENDED_SLUGS.includes(snapshot.slug as (typeof BATCH1_RECOMMENDED_SLUGS)[number])
					? 'Batch 1 template rewrite'
					: priority === 'P2'
						? 'Batch 2'
						: priority === 'P3'
							? 'Differentiation / merge review'
							: 'Immediate fix',
		archived_references: archivedRefs,
	};
}

export function matrixToCsv(rows: MatrixRow[]): string {
	const headers = [
		'id',
		'slug',
		'canonical_slug',
		'status',
		'journey_type_slug',
		'title',
		'h1',
		'page_title',
		'meta_description',
		'short_description',
		'primary_search_intent',
		'secondary_search_intents',
		'primary_query_concept',
		'title_action',
		'h1_action',
		'page_title_action',
		'meta_description_action',
		'total_score',
		'current_quality_score',
		'optimization_opportunity',
		'search_intent_score',
		'title_meta_score',
		'content_score',
		'route_trust_score',
		'technical_score',
		'internal_link_score',
		'conversion_score',
		'commercial_value_score',
		'score_evidence',
		'priority_band',
		'batch_wave',
		'route_clarity_notes',
		'itinerary_quality_notes',
		'unique_value_notes',
		'trust_notes',
		'faq_count',
		'faq_quality_notes',
		'faq_directions',
		'related_journey_count',
		'related_article_count',
		'internal_linking_notes',
		'suggested_inspiration_links',
		'suggested_journey_links',
		'destination_hub_link',
		'cta_recommendation',
		'archived_references',
		'fact_check_flags',
	];
	return [headers.join(','), ...rows.map((r) => headers.map((h) => csvEscape((r as Record<string, unknown>)[h])).join(','))].join('\n') + '\n';
}

export function productionAuditToCsv(rows: ProductionPageAudit[]): string {
	const headers = Object.keys(rows[0] ?? {}) as (keyof ProductionPageAudit)[];
	return [headers.join(','), ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(','))].join('\n') + '\n';
}

export function cannibalGroupsToCsv(groups: CannibalGroup[]): string {
	const headers = ['group_id', 'group_theme', 'journey_ids', 'slugs', 'overlap_reason', 'recommended_action'];
	return [headers.join(','), ...groups.map((g) => headers.map((h) => csvEscape(g[h as keyof CannibalGroup])).join(','))].join('\n') + '\n';
}

export function validateAuditOutputs(input: {
	snapshots: JourneySnapshot[];
	matrix: MatrixRow[];
	batch1: MatrixRow[];
	groups: CannibalGroup[];
	production: ProductionPageAudit[];
}): string[] {
	const errors: string[] = [];
	if (input.snapshots.length !== EXPECTED_ACTIVE_COUNT) {
		errors.push(`snapshot count ${input.snapshots.length} !== ${EXPECTED_ACTIVE_COUNT}`);
	}
	if (input.matrix.length !== EXPECTED_ACTIVE_COUNT) {
		errors.push(`matrix count ${input.matrix.length} !== ${EXPECTED_ACTIVE_COUNT}`);
	}
	if (input.production.length !== EXPECTED_ACTIVE_COUNT) {
		errors.push(`production audit count ${input.production.length} !== ${EXPECTED_ACTIVE_COUNT}`);
	}
	const slugs = new Set(input.snapshots.map((s) => s.slug));
	if (slugs.size !== input.snapshots.length) errors.push('duplicate slugs in snapshot');
	for (const row of input.matrix) {
		if (!SEARCH_INTENTS.includes(row.primary_search_intent)) {
			errors.push(`invalid primary intent for ${row.slug}`);
		}
		const subtotal =
			row.search_intent_score +
			row.title_meta_score +
			row.content_score +
			row.route_trust_score +
			row.technical_score +
			row.internal_link_score +
			row.conversion_score +
			row.commercial_value_score;
		if (subtotal !== row.total_score) {
			errors.push(`score subtotal mismatch for ${row.slug}`);
		}
		if (row.total_score < 0 || row.total_score > 100) {
			errors.push(`total_score out of range for ${row.slug}`);
		}
	}
	if (input.batch1.length !== 6) errors.push(`batch1 count ${input.batch1.length} !== 6`);
	const batch0 = input.matrix.filter((r) => r.batch_wave === 'Batch 0 fact check required');
	if (batch0.length !== 2) errors.push(`batch0 count ${batch0.length} !== 2`);
	for (const slug of BATCH0_FACT_CHECK_SLUGS) {
		const row = input.matrix.find((r) => r.slug === slug);
		if (!row) errors.push(`missing batch0 slug ${slug}`);
		else if (!row.fact_check_flags.includes('FACT_CHECK_REQUIRED:duration_consistency')) {
			errors.push(`batch0 slug ${slug} missing duration fact-check flag`);
		}
	}
	for (const row of input.batch1) {
		if (BATCH0_FACT_CHECK_SLUGS.includes(row.slug as (typeof BATCH0_FACT_CHECK_SLUGS)[number])) {
			errors.push(`batch1 includes batch0 slug ${row.slug}`);
		}
	}
	for (const g of input.groups) {
		for (const id of g.journey_ids.split('|')) {
			if (!input.snapshots.some((s) => s.id === id)) errors.push(`group ${g.group_id} references unknown id ${id}`);
		}
	}
	return errors;
}
