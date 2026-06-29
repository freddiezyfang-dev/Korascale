/**
 * PR-J3A Preview post-cutover page snapshot (read-only HTTP fetch).
 *
 * Usage:
 *   PR_J3A_PREVIEW_URL=https://your-preview.vercel.app \
 *     npx tsx --tsconfig tsconfig.json scripts/migrations/pr-j3a-preview-post-cutover-page-snapshot.ts
 */
import fs from 'fs';
import path from 'path';

const SLUGS = [
	'badaling-great-wall-day-tour',
	'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour',
	'grand-china-highlights-16-day-multi-city-journey',
];

function resolveSiteUrl(): string {
	const fromEnv = process.env.PR_J3A_PREVIEW_URL?.trim();
	if (!fromEnv) {
		throw new Error('Set PR_J3A_PREVIEW_URL to the Vercel Preview deployment origin.');
	}
	return fromEnv.replace(/\/+$/, '');
}

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

async function snapshotSlug(siteUrl: string, slug: string) {
	const url = `${siteUrl}/journeys/${slug}`;
	const response = await fetch(url, { redirect: 'follow' });
	const html = await response.text();
	const jsonLd = extractJsonLdTrip(html);

	return {
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

async function main() {
	const siteUrl = resolveSiteUrl();
	const entries = [];
	for (const slug of SLUGS) {
		entries.push({ slug, ...(await snapshotSlug(siteUrl, slug)) });
	}

	const payload = {
		phase: 'PR-J3A-preview-post-cutover',
		previewOrigin: siteUrl,
		generatedAt: new Date().toISOString(),
		entries,
	};

	const outPath = path.join(
		process.cwd(),
		'docs/audits/pr-j3a-preview-post-cutover-page-snapshot.json'
	);
	fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
	console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
