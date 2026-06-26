/**
 * PR-J0 production HTML audit for Journey pages (read-only HTTP).
 * Usage: npx tsx --tsconfig tsconfig.json scripts/audit/pr-j0-html-audit.ts
 */
import fs from 'fs';
import path from 'path';

const SITE = 'https://www.korascale.com';

type FetchResult = {
  url: string;
  status: number;
  finalUrl: string;
  redirectChain: string[];
  html: string;
};

async function fetchPage(url: string): Promise<FetchResult> {
  const redirectChain: string[] = [];
  let current = url;
  for (let i = 0; i < 8; i++) {
    const res = await fetch(current, {
      redirect: 'manual',
      headers: { 'User-Agent': 'PR-J0-AuditBot/1.0 (+korascale-readonly-audit)' },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) break;
      const next = loc.startsWith('http') ? loc : new URL(loc, current).href;
      redirectChain.push(`${res.status} ${current} -> ${next}`);
      current = next;
      continue;
    }
    const html = await res.text();
    return {
      url,
      status: res.status,
      finalUrl: current,
      redirectChain,
      html,
    };
  }
  throw new Error(`Too many redirects for ${url}`);
}

function extractMeta(html: string, name: string, attr: 'name' | 'property' = 'name') {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${name}["'][^>]+content=["']([^"']*)["']`,
    'i'
  );
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${name}["']`,
    'i'
  );
  const m2 = html.match(re2);
  return m2?.[1] ?? '';
}

function extractTitle(html: string) {
  return html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? '';
}

function extractCanonical(html: string) {
  return (
    html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
    html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1] ??
    ''
  );
}

function extractRobots(html: string) {
  return extractMeta(html, 'robots');
}

function countH1(html: string) {
  const matches = html.match(/<h1[\s>]/gi);
  return matches?.length ?? 0;
}

function extractH1Texts(html: string) {
  const re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    out.push(m[1].replace(/<[^>]+>/g, '').trim());
  }
  return out;
}

function countJourneyLinks(html: string) {
  const re = /href=["'](\/journeys\/[^"'#?]+)["']/gi;
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) set.add(m[1]);
  return { count: set.size, links: [...set] };
}

function countJsonLd(html: string) {
  const blocks: { raw: string; types: string[]; valid: boolean }[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    try {
      const parsed = JSON.parse(raw);
      const types: string[] = [];
      const collect = (node: unknown) => {
        if (!node || typeof node !== 'object') return;
        const obj = node as Record<string, unknown>;
        if (typeof obj['@type'] === 'string') types.push(obj['@type']);
        if (Array.isArray(obj['@graph'])) obj['@graph'].forEach(collect);
      };
      collect(parsed);
      blocks.push({ raw: raw.slice(0, 200), types, valid: true });
    } catch {
      blocks.push({ raw: raw.slice(0, 200), types: [], valid: false });
    }
  }
  return blocks;
}

function stripTags(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function bodyContains(html: string, needle: string) {
  return stripTags(html).toLowerCase().includes(needle.toLowerCase());
}

function hasItineraryInHtml(html: string) {
  return (
    /itinerary/i.test(html) &&
    (/<h[2-4][^>]*>[^<]*day\s*\d/i.test(html) ||
      /Day\s*\d+/i.test(stripTags(html)))
  );
}

function auditListing(html: string, r: FetchResult) {
  const links = countJourneyLinks(html);
  return {
    page: 'listing',
    url: r.finalUrl,
    http: r.status,
    title: extractTitle(html),
    metaDescription: extractMeta(html, 'description'),
    canonical: extractCanonical(html),
    robots: extractRobots(html),
    h1Count: countH1(html),
    h1Texts: extractH1Texts(html),
    journeyLinkCount: links.count,
    journeyLinksSample: links.links.slice(0, 5),
    jsonLd: countJsonLd(html),
    visibleTextLength: stripTags(html).length,
    hasFilterQueryInCanonical: extractCanonical(html).includes('?'),
  };
}

function auditTypePage(typeSlug: string, html: string, r: FetchResult) {
  const links = countJourneyLinks(html);
  return {
    page: `type:${typeSlug}`,
    url: r.finalUrl,
    http: r.status,
    redirectChain: r.redirectChain,
    title: extractTitle(html),
    metaDescription: extractMeta(html, 'description'),
    canonical: extractCanonical(html),
    h1Count: countH1(html),
    h1Texts: extractH1Texts(html),
    journeyLinkCount: links.count,
    visibleTextLength: stripTags(html).length,
    jsonLd: countJsonLd(html),
    cardLikeAnchors: links.links.length,
  };
}

function auditDetail(slug: string, titleHint: string, html: string, r: FetchResult) {
  const jsonLd = countJsonLd(html);
  const h1s = extractH1Texts(html);
  const nameInHtml = bodyContains(html, titleHint.split('|')[0]?.trim() || slug);
  return {
    slug,
    url: r.finalUrl,
    http: r.status,
    redirectChain: r.redirectChain,
    title: extractTitle(html),
    metaDescription: extractMeta(html, 'description'),
    canonical: extractCanonical(html),
    robots: extractRobots(html),
    h1Count: countH1(html),
    h1: h1s[0] ?? '',
    bodyInInitialHtml: nameInHtml && stripTags(html).length > 800,
    itineraryInHtml: hasItineraryInHtml(html),
    relatedArticlesInHtml: /inspiration|related article|read more/i.test(html),
    relatedJourneysInHtml: /related trip|go further|view journey/i.test(html),
    breadcrumbInHtml: /breadcrumb|Home.*Journey/i.test(stripTags(html)),
    jsonLdTypes: jsonLd.flatMap((b) => b.types),
    jsonLdValid: jsonLd.every((b) => b.valid),
    visibleTextLength: stripTags(html).length,
    severity:
      r.status !== 200
        ? 'P0'
        : !nameInHtml
          ? 'P0'
          : stripTags(html).length < 500
            ? 'P1'
            : 'OK',
  };
}

async function fetchSitemapUrls(): Promise<string[]> {
  const res = await fetch(`${SITE}/sitemap.xml`, {
    headers: { 'User-Agent': 'PR-J0-AuditBot/1.0' },
  });
  const xml = await res.text();
  const urls: string[] = [];
  const re = /<loc>([^<]+)<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) urls.push(m[1]);
  return urls;
}

async function main() {
  const summaryPath = path.join(
    process.cwd(),
    'docs/audits/pr-j0-db-summary.json'
  );
  if (!fs.existsSync(summaryPath)) {
    console.error('Run pr-j0-db-inventory.ts first');
    process.exit(1);
  }
  const dbSummary = JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as {
    activeSlugs: string[];
  };

  const listing = await fetchPage(`${SITE}/journeys`);
  const listingAudit = auditListing(listing.html, listing);

  const typeSlugs = [
    'explore-together',
    'deep-discovery',
    'signature-journeys',
    'group-tours',
  ];
  const typeAudits = [];
  for (const t of typeSlugs) {
    const r = await fetchPage(`${SITE}/journeys/type/${t}`);
    typeAudits.push(auditTypePage(t, r.html, r));
  }

  const legacyTypeUrls = [
    '/journeys/explore-together',
    '/journeys/deep-discovery',
    '/journeys/signature-journeys',
    '/journeys/group-tours',
  ];
  const legacyRedirects = [];
  for (const p of legacyTypeUrls) {
    const r = await fetchPage(`${SITE}${p}`);
    legacyRedirects.push({
      path: p,
      status: r.status,
      finalUrl: r.finalUrl,
      redirectChain: r.redirectChain,
    });
  }

  const detailAudits = [];
  for (const slug of dbSummary.activeSlugs) {
    const r = await fetchPage(`${SITE}/journeys/${slug}`);
    detailAudits.push(auditDetail(slug, slug.replace(/-/g, ' '), r.html, r));
  }

  const trailingHyphenSlug =
    'beijing-to-shanxi-ancient-architecture-with-black-myth-wukong-inspirations-6-day-tour-';
  const trailingAudit = await fetchPage(`${SITE}/journeys/${trailingHyphenSlug}`);

  const sitemapUrls = await fetchSitemapUrls();
  const journeySitemap = sitemapUrls.filter((u) => u.includes('/journeys'));
  const sitemapChecks = [];
  for (const url of journeySitemap.slice(0, 60)) {
    const r = await fetchPage(url);
    sitemapChecks.push({
      url,
      status: r.status,
      finalUrl: r.finalUrl,
      redirectChain: r.redirectChain,
    });
  }

  const robotsRes = await fetch(`${SITE}/robots.txt`);
  const robotsTxt = await robotsRes.text();

  const out = {
    generatedAt: new Date().toISOString(),
    listing: listingAudit,
    typePages: typeAudits,
    legacyTypeRedirects: legacyRedirects,
    detailPages: detailAudits,
    trailingHyphenCheck: {
      slug: trailingHyphenSlug,
      status: trailingAudit.status,
      finalUrl: trailingAudit.finalUrl,
      redirectChain: trailingAudit.redirectChain,
      inDb: dbSummary.activeSlugs.includes(trailingHyphenSlug),
    },
    sitemap: {
      totalUrls: sitemapUrls.length,
      journeyUrls: journeySitemap.length,
      journeyUrlList: journeySitemap,
      sampleChecks: sitemapChecks,
      missingFromSitemap: dbSummary.activeSlugs.filter(
        (s) => !journeySitemap.some((u) => u.endsWith(`/journeys/${s}`))
      ),
      extraInSitemapNotActive: journeySitemap
        .map((u) => u.replace(`${SITE}/journeys/`, ''))
        .filter((s) => !dbSummary.activeSlugs.includes(s) && !s.startsWith('type/')),
    },
    robotsTxt: robotsTxt.slice(0, 500),
  };

  const outPath = path.join(process.cwd(), 'docs/audits/pr-j0-html-audit.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${outPath}`);
  console.log(
    JSON.stringify(
      {
        listingCards: listingAudit.journeyLinkCount,
        detailChecked: detailAudits.length,
        detailP0: detailAudits.filter((d) => d.severity === 'P0').length,
        sitemapJourneyUrls: journeySitemap.length,
        missingFromSitemap: out.sitemap.missingFromSitemap.length,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
