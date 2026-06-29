/**
 * PR-J3A Production post-cutover page snapshot (read-only HTTP fetch).
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j3a-production-post-cutover-page-snapshot.ts
 */
import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://www.korascale.com';
const SLUGS = [
	'badaling-great-wall-day-tour',
	'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour',
	'grand-china-highlights-16-day-multi-city-journey',
];
const ARCHIVED_SLUG = 'dali-cangshan-mountain-with-chongsheng-three-pagodas-day-tour';

const COMPARE_FIELDS = [
	'httpStatus',
	'htmlTitle',
	'metaDescription',
	'canonical',
	'ogTitle',
	'ogDescription',
	'ogImage',
	'h1',
	'heroImageUrl',
	'jsonLdName',
	'jsonLdDescription',
	'jsonLdImage',
] as const;

function extractMeta(html: string, property: string): string | null {
	const og = html.match(
		new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
	);
	if (og?.[1]) return og[1];
	const name = html.match(
		new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')
	);
	return name?.[1] ?? null;
}

function extractTitle(html: string): string | null {
	const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
	return m?.[1]?.trim() ?? null;
}

function extractCanonical(html: string): string | null {
	const m = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
	return m?.[1] ?? null;
}

function extractH1(html: string): string | null {
	const m = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
	return m?.[1]?.trim() ?? null;
}

function extractJsonLdTrip(html: string): Record<string, unknown> | null {
	const scripts = [
		...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
	];
	for (const script of scripts) {
		try {
			const parsed = JSON.parse(script[1]);
			const items = Array.isArray(parsed) ? parsed : [parsed];
			const trip = items.find((item) => item?.['@type'] === 'Trip');
			if (trip) return trip as Record<string, unknown>;
		} catch {
			// skip invalid JSON-LD blocks
		}
	}
	return null;
}

async function snapshotSlug(slug: string) {
	const url = `${SITE_URL}/journeys/${slug}`;
	const response = await fetch(url, { redirect: 'follow' });
	const html = await response.text();
	const jsonLd = extractJsonLdTrip(html);

	return {
		slug,
		url,
		httpStatus: response.status,
		htmlTitle: extractTitle(html),
		metaDescription: extractMeta(html, 'description'),
		canonical: extractCanonical(html),
		ogTitle: extractMeta(html, 'og:title'),
		ogDescription: extractMeta(html, 'og:description'),
		ogImage: extractMeta(html, 'og:image'),
		h1: extractH1(html),
		heroImageUrl: extractMeta(html, 'og:image'),
		heroDomNote:
			'Hero DOM selector unreliable; og:image used as primary hero URL reference per J3A audit guidance.',
		visibleJourneyType: 'unavailable',
		jsonLdName: typeof jsonLd?.name === 'string' ? jsonLd.name : null,
		jsonLdDescription: typeof jsonLd?.description === 'string' ? jsonLd.description : null,
		jsonLdImage: Array.isArray(jsonLd?.image)
			? jsonLd.image[0]
			: typeof jsonLd?.image === 'string'
				? jsonLd.image
				: null,
		fetchedAt: new Date().toISOString(),
	};
}

function compareEntries(
	pre: { slug: string; [key: string]: unknown },
	post: { slug: string; [key: string]: unknown }
) {
	const mismatches: Array<{ field: string; pre: unknown; post: unknown }> = [];
	for (const field of COMPARE_FIELDS) {
		if (pre[field] !== post[field]) {
			mismatches.push({ field, pre: pre[field], post: post[field] });
		}
	}
	return { slug: pre.slug, match: mismatches.length === 0, mismatches };
}

async function runAcceptanceChecks() {
	const apiRes = await fetch(`${SITE_URL}/api/journeys`);
	const apiData = (await apiRes.json()) as { journeys?: Array<{ slug: string; journeyType?: string }> };
	const journeys = apiData.journeys ?? [];

	const includeAllRes = await fetch(`${SITE_URL}/api/journeys?includeAll=true`);
	const sitemapRes = await fetch(`${SITE_URL}/sitemap.xml`);
	const sitemapText = await sitemapRes.text();
	const journeyUrls = (sitemapText.match(/<loc>[^<]*\/journeys\/[^<]+<\/loc>/g) || []).filter(
		(u) => !u.includes('/journeys/type/')
	);

	const archivedRes = await fetch(`${SITE_URL}/journeys/${ARCHIVED_SLUG}`);

	return {
		apiPublicCount: journeys.length,
		exploreTogether: journeys.filter((j) => j.journeyType === 'Explore Together').length,
		deepDiscovery: journeys.filter((j) => j.journeyType === 'Deep Discovery').length,
		sitemapJourneyDetailUrls: journeyUrls.length,
		apiIncludeAllAnonymousStatus: includeAllRes.status,
		archivedDetailStatus: archivedRes.status,
		archivedSlugChecked: ARCHIVED_SLUG,
		apiSlugs: journeys.map((j) => j.slug),
	};
}

async function main() {
	const prePath = path.join(process.cwd(), 'docs/audits/pr-j3a-pre-cutover-page-snapshot.json');
	const preCutover = JSON.parse(fs.readFileSync(prePath, 'utf8')) as {
		entries: Array<{ slug: string; [key: string]: unknown }>;
	};

	const entries = [];
	for (const slug of SLUGS) {
		entries.push(await snapshotSlug(slug));
	}

	const comparisons = entries.map((post) => {
		const pre = preCutover.entries.find((e) => e.slug === post.slug);
		if (!pre) return { slug: post.slug, match: false, mismatches: [{ field: 'slug', pre: null, post: post.slug }] };
		return compareEntries(pre, post);
	});

	const acceptance = await runAcceptanceChecks();

	const payload = {
		phase: 'PR-J3A-production-post-cutover',
		siteUrl: SITE_URL,
		generatedAt: new Date().toISOString(),
		mergedCommit: '3cb373e',
		acceptance,
		comparisonVsPreCutover: {
			pagesCompared: comparisons.length,
			pagesMatching: comparisons.filter((c) => c.match).length,
			allKeyFieldsMatch: comparisons.every((c) => c.match),
			details: comparisons,
		},
		entries,
	};

	const outPath = path.join(
		process.cwd(),
		'docs/audits/pr-j3a-production-post-cutover-page-snapshot.json'
	);
	fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
	console.log(JSON.stringify(payload, null, 2));
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
