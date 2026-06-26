/**
 * PR-J1 local production HTML validation.
 * Usage: npm run build && npx tsx scripts/audit/pr-j1-html-validation.ts
 */
import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

const PORT = Number(process.env.PR_J1_PORT || 3025);
const BASE = `http://127.0.0.1:${PORT}`;

type CheckResult = {
  url: string;
  status: number;
  redirectChain: string[];
  title: string;
  canonical: string;
  robots: string;
  h1Count: number;
  h1Text: string;
  tripJsonLdCount: number;
  breadcrumbJsonLdCount: number;
  hasSkeleton: boolean;
  hasBreadcrumbNav: boolean;
  bodyTextLength: number;
  journeyLinks: number;
  dayHeading: boolean;
  duplicateContentNotes: string[];
  pass: boolean;
  notes: string[];
};

function loadActiveSlugs(): string[] {
  const summaryPath = path.join(process.cwd(), 'docs/audits/pr-j0-db-summary.json');
  if (!fs.existsSync(summaryPath)) {
    throw new Error('Missing docs/audits/pr-j0-db-summary.json');
  }
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as { activeSlugs: string[] };
  return summary.activeSlugs;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/gi, "'");
}

function countJsonLdByType(html: string, type: string): number {
  let count = 0;
  for (const match of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed['@type'] === type) count += 1;
    } catch {
      // ignore invalid JSON-LD blocks
    }
  }
  return count;
}

function checkDuplicatePrimaryContent(html: string, h1Text: string, pageKind: 'detail' | 'type'): string[] {
  const notes: string[] = [];
  const plainH1 = decodeHtmlEntities(h1Text).trim();

  const h1Tags = [...html.matchAll(/<h1[\s>][^>]*>([\s\S]*?)<\/h1>/gi)];
  if (h1Tags.length > 1) {
    notes.push(`multiple h1 tags (${h1Tags.length})`);
  }

  if (pageKind === 'detail') {
    if (html.includes('id="journey-itinerary"') || html.includes("id='journey-itinerary'")) {
      notes.push('legacy server itinerary block id present');
    }

    const itineraryIds =
      (html.match(/id=["']itinerary["']/gi) ?? []).length +
      (html.match(/id=["']journey-itinerary["']/gi) ?? []).length;
    if (itineraryIds > 1) {
      notes.push(`multiple itinerary section ids (${itineraryIds})`);
    }

    const dayTitles = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)]
      .map((m) => decodeHtmlEntities(m[1].replace(/<[^>]+>/g, '').trim()))
      .filter((t) => t.length > 12);
    const titleCounts = new Map<string, number>();
    for (const t of dayTitles) {
      titleCounts.set(t, (titleCounts.get(t) ?? 0) + 1);
    }
    for (const [t, c] of titleCounts) {
      if (c > 1) {
        notes.push(`duplicate itinerary day title "${t.slice(0, 48)}" x${c}`);
      }
    }

    if (/sr-only[\s\S]{0,400}<h1/i.test(html)) notes.push('sr-only h1 detected');
    if (/aria-hidden=["']true["'][\s\S]{0,500}<h1/i.test(html)) {
      notes.push('aria-hidden h1 detected');
    }
    if (/display:\s*none[\s\S]{0,400}<h1/i.test(html)) notes.push('display:none h1 detected');
  }

  if (/BAILOUT_TO_CLIENT_SIDE_RENDERING|data-hydration-error/i.test(html)) {
    notes.push('hydration bailout marker');
  }

  if (plainH1 && pageKind === 'detail') {
    const duplicateH1 = h1Tags.filter((m) => {
      const text = decodeHtmlEntities(m[1].replace(/<[^>]+>/g, '').trim());
      return text === plainH1;
    });
    if (duplicateH1.length > 1) {
      notes.push('duplicate h1 text blocks');
    }
  }

  return notes;
}

async function fetchWithRedirects(url: string) {
  const chain: string[] = [];
  let current = url;
  for (let i = 0; i < 6; i++) {
    const res = await fetch(current, { redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) break;
      const next = loc.startsWith('http') ? loc : new URL(loc, current).href;
      chain.push(`${res.status} ${current} -> ${next}`);
      current = next;
      continue;
    }
    const html = await res.text();
    return { status: res.status, finalUrl: current, html, redirectChain: chain };
  }
  throw new Error(`Too many redirects for ${url}`);
}

function parseHtml(html: string, pageKind: 'detail' | 'type' = 'detail') {
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? '';
  const canonical =
    html.match(/rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
    html.match(/href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1] ??
    '';
  const robots =
    html.match(/name=["']robots["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/content=["']([^"']+)["'][^>]+name=["']robots["']/i)?.[1] ??
    '';
  const h1Matches = [...html.matchAll(/<h1[\s>][^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1Text = h1Matches.map((m) => m[1].replace(/<[^>]+>/g, '').trim()).join(' | ');
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const tripJsonLdCount = countJsonLdByType(html, 'Trip');
  const breadcrumbJsonLdCount = countJsonLdByType(html, 'BreadcrumbList');
  const hasRouteSkeleton =
    /<main[^>]*>[\s\S]*?animate-pulse/.test(html) && h1Matches.length === 0;

  return {
    title,
    canonical,
    robots,
    h1Count: h1Matches.length,
    h1Text,
    tripJsonLdCount,
    breadcrumbJsonLdCount,
    hasSkeleton: hasRouteSkeleton,
    hasBreadcrumbNav: /aria-label=["']Breadcrumb["']/i.test(html),
    bodyTextLength: body.length,
    journeyLinks: new Set(
      [...html.matchAll(/href=["'](\/journeys\/[^"'#?]+)["']/gi)].map((m) => m[1])
    ).size,
    dayHeading: /Day\s*\d+/i.test(body),
    duplicateContentNotes: checkDuplicatePrimaryContent(html, h1Text, pageKind),
  };
}

async function checkDetail(slug: string): Promise<CheckResult> {
  const res = await fetchWithRedirects(`${BASE}/journeys/${slug}`);
  const parsed = parseHtml(res.html);
  const notes: string[] = [...parsed.duplicateContentNotes];
  if (parsed.h1Count !== 1) notes.push(`expected 1 h1, got ${parsed.h1Count}`);
  if (parsed.hasSkeleton) notes.push('skeleton-only main detected');
  if (parsed.tripJsonLdCount !== 1) notes.push(`expected 1 Trip JSON-LD, got ${parsed.tripJsonLdCount}`);
  if (parsed.breadcrumbJsonLdCount !== 1) {
    notes.push(`expected 1 BreadcrumbList JSON-LD, got ${parsed.breadcrumbJsonLdCount}`);
  }
  if (!parsed.hasBreadcrumbNav) notes.push('missing breadcrumb nav');
  if (parsed.bodyTextLength < 1200) notes.push(`body too short (${parsed.bodyTextLength})`);

  return {
    url: res.finalUrl,
    status: res.status,
    redirectChain: res.redirectChain,
    ...parsed,
    pass:
      res.status === 200 &&
      parsed.h1Count === 1 &&
      !parsed.hasSkeleton &&
      parsed.tripJsonLdCount === 1 &&
      parsed.breadcrumbJsonLdCount === 1 &&
      parsed.hasBreadcrumbNav &&
      parsed.bodyTextLength >= 1200 &&
      parsed.duplicateContentNotes.length === 0,
    notes,
  };
}

async function checkType(typeSlug: string, expectedLinks: number): Promise<CheckResult> {
  const res = await fetchWithRedirects(`${BASE}/journeys/type/${typeSlug}`);
  const parsed = parseHtml(res.html, 'type');
  const productLinks = [
    ...new Set(
      [...res.html.matchAll(/href=["'](\/journeys\/[^"'#?]+)["']/gi)]
        .map((m) => m[1])
        .filter((href) => !href.startsWith('/journeys/type/'))
    ),
  ].length;
  const notes: string[] = [...parsed.duplicateContentNotes];
  if (!parsed.canonical.includes(`/journeys/type/${typeSlug}`)) notes.push('canonical mismatch');
  if (productLinks < expectedLinks) {
    notes.push(`expected >=${expectedLinks} product links, got ${productLinks}`);
  }

  return {
    url: res.finalUrl,
    status: res.status,
    redirectChain: res.redirectChain,
    ...parsed,
    journeyLinks: productLinks,
    pass:
      res.status === 200 &&
      parsed.canonical.includes(`/journeys/type/${typeSlug}`) &&
      productLinks >= expectedLinks &&
      parsed.duplicateContentNotes.length === 0,
    notes,
  };
}

async function checkLegacyRedirect(legacyPath: string, expectedTarget: string): Promise<CheckResult> {
  const res = await fetchWithRedirects(`${BASE}${legacyPath}`);
  const notes: string[] = [];
  if (res.redirectChain.length === 0) notes.push('no redirect chain');
  if (!res.finalUrl.endsWith(expectedTarget)) notes.push(`final URL ${res.finalUrl}`);
  return {
    url: res.finalUrl,
    status: res.status,
    redirectChain: res.redirectChain,
    title: '',
    canonical: '',
    robots: '',
    h1Count: 0,
    h1Text: '',
    tripJsonLdCount: 0,
    breadcrumbJsonLdCount: 0,
    hasSkeleton: false,
    hasBreadcrumbNav: false,
    bodyTextLength: 0,
    journeyLinks: 0,
    dayHeading: false,
    duplicateContentNotes: [],
    pass: res.status === 200 && res.finalUrl.endsWith(expectedTarget) && res.redirectChain.length > 0,
    notes,
  };
}

function startServer(): Promise<{ proc: ChildProcess; ready: Promise<void> }> {
  const proc = spawn('npm', ['start', '--', '-p', String(PORT)], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  const ready = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Server start timeout')), 120000);
    proc.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      if (text.includes('Ready')) {
        clearTimeout(timeout);
        resolve();
      }
    });
    proc.stderr?.on('data', (chunk) => {
      process.stderr.write(chunk);
    });
    proc.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Server exited early with code ${code}`));
    });
  });

  return Promise.resolve({ proc, ready });
}

async function main() {
  const activeSlugs = loadActiveSlugs();
  const skipServerStart = process.env.PR_J1_SKIP_SERVER === '1';
  let proc: ChildProcess | null = null;

  if (!skipServerStart) {
    const started = await startServer();
    proc = started.proc;
    await started.ready;
    await new Promise((r) => setTimeout(r, 1500));
  }

  try {
    const detailResults = [];
    for (const slug of activeSlugs) {
      detailResults.push(await checkDetail(slug));
    }

    const typeResults = [
      await checkType('explore-together', 8),
      await checkType('deep-discovery', 16),
      await checkType('signature-journeys', 0),
      await checkType('group-tours', 0),
    ];

    const redirectResults = [
      await checkLegacyRedirect('/journeys/explore-together', '/journeys/type/explore-together'),
      await checkLegacyRedirect('/journeys/deep-discovery', '/journeys/type/deep-discovery'),
      await checkLegacyRedirect('/journeys/signature-journeys', '/journeys/type/signature-journeys'),
      await checkLegacyRedirect('/journeys/group-tours', '/journeys/type/group-tours'),
    ];

    const signature = typeResults.find((r) => r.url.includes('signature-journeys'));
    if (signature) {
      const hasNoindex = signature.robots.toLowerCase().includes('noindex');
      if (!hasNoindex) {
        signature.pass = false;
        signature.notes.push('expected noindex on signature-journeys');
      }
    }

    const output = {
      generatedAt: new Date().toISOString(),
      baseUrl: BASE,
      detail: detailResults,
      typePages: typeResults,
      legacyRedirects: redirectResults,
      summary: {
        detailPass: detailResults.filter((r) => r.pass).length,
        detailTotal: detailResults.length,
        typePass: typeResults.filter((r) => r.pass).length,
        redirectPass: redirectResults.filter((r) => r.pass).length,
      },
    };

    const jsonPath = path.join(process.cwd(), 'docs/audits/pr-j1-html-validation.json');
    fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));

    const mdPath = path.join(process.cwd(), 'docs/audits/pr-j1-html-validation.md');
    fs.writeFileSync(
      mdPath,
      `# PR-J1 HTML Validation\n\n- Detail pass: ${output.summary.detailPass}/${output.summary.detailTotal}\n- Type pass: ${output.summary.typePass}/4\n- Legacy redirect pass: ${output.summary.redirectPass}/4\n\nDuplicate-content checks: H1 uniqueness, excerpt/day-title repetition, hidden primary blocks, JSON-LD counts.\n\nSee \`pr-j1-html-validation.json\` for full results.\n`
    );

    console.log(JSON.stringify(output.summary, null, 2));
    console.log(`Wrote ${jsonPath}`);

    if (detailResults.some((r) => !r.pass) || typeResults.some((r) => !r.pass)) {
      process.exitCode = 1;
    }
  } finally {
    proc?.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
