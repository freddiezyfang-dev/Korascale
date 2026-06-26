/**
 * Measure unexplained white gap before footer on Journey pages.
 * Usage: npm run build && npx tsx scripts/audit/pr-j1-footer-gap-diagnosis.ts
 */
import { chromium, type Page } from 'playwright';
import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

const browserEvalSource = fs.readFileSync(
  path.join(process.cwd(), 'scripts/audit/pr-j1-footer-gap-browser.js'),
  'utf8',
);

const PORT = Number(process.env.PR_J1_PORT || 3041);
const PREVIEW_BASE = process.env.PR_J1_PREVIEW_BASE || '';
const BASE = PREVIEW_BASE || `http://127.0.0.1:${PORT}`;
const VIEWPORT = { width: 1440, height: 900 };

const PAGES = [
  { name: 'journeys-list', url: '/journeys' },
  { name: 'explore-together', url: '/journeys/type/explore-together' },
  { name: 'deep-discovery', url: '/journeys/type/deep-discovery' },
  { name: 'signature-journeys', url: '/journeys/type/signature-journeys' },
  { name: 'group-tours', url: '/journeys/type/group-tours' },
  { name: 'detail-1day', url: '/journeys/beijing-city-imperial-grandeur-urban-chic-1-day-tour' },
  { name: 'detail-multi', url: '/journeys/grand-china-highlands-nature-18-day-journey' },
];

type ElementReport = {
  tag: string;
  id: string;
  className: string;
  testId: string;
  height: number;
  docTop: number;
  docBottom: number;
  textLength: number;
  childCount: number;
  styles: Record<string, string>;
};

type GapReport = {
  page: string;
  url: string;
  scrollY: number;
  lastContentBottom: number;
  lastSectionBottom: number;
  footerPrevBottom: number;
  footerTop: number;
  wrapperInternalGap: number;
  structuralGap: number;
  unexplainedGap: number;
  footerPrevSibling: string;
  footerPrevLastChild: string;
  mainLastChild: string;
  gapElements: ElementReport[];
  emptyTallElements: ElementReport[];
  culprit: ElementReport | null;
};

async function diagnosePage(page: Page, pageName: string, url: string): Promise<GapReport> {
  await page.setViewportSize(VIEWPORT);
  await page.goto(`${BASE}${url}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(4000);
  await page.waitForSelector('[data-testid="site-footer"]', { timeout: 60000 });

  // Scroll so footer sits at bottom of viewport
  await page.evaluate(() => {
    const footer = document.querySelector('[data-testid="site-footer"]');
    if (footer) {
      const fr = footer.getBoundingClientRect();
      const target = window.scrollY + fr.top - window.innerHeight + fr.height;
      window.scrollTo(0, Math.max(0, target));
    }
  });
  await page.waitForTimeout(500);

  const result = (await page.evaluate(`(${browserEvalSource.trim().replace(/;\s*$/, '')})()`)) as Omit<
    GapReport,
    'page' | 'url'
  > & { error?: string };

  if (result.error) {
    throw new Error(`${pageName}: ${result.error}`);
  }

  // Screenshot footer area
  const screenshotDir = path.join(process.cwd(), 'docs/audits/footer-gap-screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({
    path: path.join(screenshotDir, `${pageName}.png`),
    fullPage: false,
  });

  return {
    page: pageName,
    url,
    scrollY: result.scrollY,
    lastContentBottom: result.lastContentBottom,
    lastSectionBottom: result.lastSectionBottom,
    footerPrevBottom: result.footerPrevBottom,
    footerTop: result.footerTop,
    wrapperInternalGap: result.wrapperInternalGap,
    structuralGap: result.structuralGap,
    unexplainedGap: result.unexplainedGap,
    footerPrevSibling: result.footerPrevSibling,
    footerPrevLastChild: result.footerPrevLastChild,
    mainLastChild: result.mainLastChild,
    gapElements: result.gapElements,
    emptyTallElements: result.emptyTallElements,
    culprit: result.culprit,
  };
}

async function main() {
  const skipServer = process.env.PR_J1_SKIP_SERVER === '1';
  let proc: ChildProcess | null = null;

  if (!skipServer && !PREVIEW_BASE) {
    proc = spawn('npm', ['start', '--', '-p', String(PORT)], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server timeout')), 120000);
      proc!.stdout?.on('data', (chunk) => {
        if (chunk.toString().includes('Ready')) {
          clearTimeout(timeout);
          resolve();
        }
      });
      proc!.on('exit', (code) => {
        clearTimeout(timeout);
        reject(new Error(`Server exited ${code}`));
      });
    });
    await new Promise((r) => setTimeout(r, 1500));
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const reports: GapReport[] = [];

  try {
    for (const p of PAGES) {
      reports.push(await diagnosePage(page, p.name, p.url));
    }
  } finally {
    await browser.close();
    proc?.kill('SIGTERM');
  }

  const outPath = path.join(process.cwd(), 'docs/audits/pr-j1-footer-gap-diagnosis.json');
  fs.writeFileSync(
    outPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), viewport: VIEWPORT, reports }, null, 2),
  );
  console.log(
    JSON.stringify(
      reports.map((r) => ({
        page: r.page,
        unexplainedGap: Math.round(r.unexplainedGap),
        wrapperGap: Math.round(r.wrapperInternalGap),
        structuralGap: Math.round(r.structuralGap),
        culprit: r.culprit
          ? `${r.culprit.tag}.${r.culprit.className.slice(0, 60)} h=${Math.round(r.culprit.height)}`
          : null,
      })),
      null,
      2,
    ),
  );
  console.log(`Wrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
