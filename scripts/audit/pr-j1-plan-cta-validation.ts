/**
 * Validate Plan Your Journey CTA visibility on journey list/type pages.
 * Usage: npm run build && npx tsx scripts/audit/pr-j1-plan-cta-validation.ts
 */
import { chromium, type Page } from 'playwright';
import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

const PORT = Number(process.env.PR_J1_PORT || 3055);
const BASE = `http://127.0.0.1:${PORT}`;

const PAGES = [
  { name: 'journeys-list', url: '/journeys', expectsSection: true },
  { name: 'explore-together', url: '/journeys/type/explore-together', expectsSection: true },
  { name: 'deep-discovery', url: '/journeys/type/deep-discovery', expectsSection: true },
  { name: 'signature-journeys', url: '/journeys/type/signature-journeys', expectsSection: true },
  { name: 'group-tours', url: '/journeys/type/group-tours', expectsSection: false },
  {
    name: 'detail-1day',
    url: '/journeys/beijing-city-imperial-grandeur-urban-chic-1-day-tour',
    expectsSection: false,
  },
];

type ViewportReport = {
  viewport: string;
  sectionExists: boolean;
  ctaExists: boolean;
  ctaVisible: boolean;
  ctaText: string;
  sectionHeight: number;
  ctaHeight: number;
  ctaWidth: number;
  ctaOpacity: string;
  ctaDisplay: string;
  ctaVisibility: string;
  ctaBackground: string;
  pass: boolean;
  notes: string[];
};

type PageReport = {
  page: string;
  url: string;
  desktop: ViewportReport;
  mobile: ViewportReport;
};

async function measurePage(page: Page, url: string, viewport: { width: number; height: number; label: string }, expectsSection: boolean): Promise<ViewportReport> {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`${BASE}${url}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => {
    document.querySelector('[data-testid="plan-your-journey-section"]')?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="plan-your-journey-section"]') as HTMLElement | null;
    const cta = document.querySelector('[data-testid="plan-your-journey-cta"]') as HTMLElement | null;
    if (!section) {
      return { sectionExists: false };
    }

    const sectionRect = section.getBoundingClientRect();
    if (!cta) {
      return {
        sectionExists: true,
        ctaExists: false,
        sectionHeight: sectionRect.height,
        ctaText: section.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      };
    }

    const cs = getComputedStyle(cta);
    const rect = cta.getBoundingClientRect();
    const text = cta.textContent?.replace(/\s+/g, ' ').trim() ?? '';

    return {
      sectionExists: true,
      ctaExists: true,
      ctaText: text,
      sectionHeight: sectionRect.height,
      ctaHeight: rect.height,
      ctaWidth: rect.width,
      ctaOpacity: cs.opacity,
      ctaDisplay: cs.display,
      ctaVisibility: cs.visibility,
      ctaBackground: cs.backgroundColor,
      ctaTop: rect.top,
      ctaBottom: rect.bottom,
      sectionTop: sectionRect.top,
      sectionBottom: sectionRect.bottom,
    };
  });

  const notes: string[] = [];
  if (expectsSection && !result.sectionExists) notes.push('expected section missing');
  if (!expectsSection && result.sectionExists) notes.push('unexpected section present');

  let ctaVisible = false;
  if (result.ctaExists) {
    const opacity = Number(result.ctaOpacity ?? '0');
    ctaVisible =
      result.ctaDisplay !== 'none' &&
      result.ctaVisibility !== 'hidden' &&
      opacity > 0 &&
      (result.ctaHeight ?? 0) > 0 &&
      (result.ctaWidth ?? 0) > 0 &&
      (result.ctaText ?? '').includes('Plan your journey in China with Korascale') &&
      (result.ctaText ?? '').includes('PLAN YOUR JOURNEY');

    if (!ctaVisible) notes.push('cta not visibly rendered');
    if ((result.ctaBackground ?? '').includes('0, 0, 0') || result.ctaBackground === 'rgba(0, 0, 0, 0)') {
      notes.push('cta background transparent');
    }
  } else if (expectsSection) {
    notes.push('cta element missing');
  }

  const pass = expectsSection
    ? Boolean(result.sectionExists && result.ctaExists && ctaVisible && notes.length === 0)
    : !result.sectionExists && notes.length === 0;

  return {
    viewport: viewport.label,
    sectionExists: Boolean(result.sectionExists),
    ctaExists: Boolean(result.ctaExists),
    ctaVisible,
    ctaText: (result.ctaText ?? '').slice(0, 120),
    sectionHeight: Math.round(result.sectionHeight ?? 0),
    ctaHeight: Math.round(result.ctaHeight ?? 0),
    ctaWidth: Math.round(result.ctaWidth ?? 0),
    ctaOpacity: result.ctaOpacity ?? '',
    ctaDisplay: result.ctaDisplay ?? '',
    ctaVisibility: result.ctaVisibility ?? '',
    ctaBackground: result.ctaBackground ?? '',
    pass,
    notes,
  };
}

async function main() {
  const skipServer = process.env.PR_J1_SKIP_SERVER === '1';
  let proc: ChildProcess | null = null;

  if (!skipServer) {
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
  const reports: PageReport[] = [];

  try {
    for (const p of PAGES) {
      const desktop = await measurePage(page, p.url, { width: 1440, height: 900, label: '1440x900' }, p.expectsSection);
      const mobile = await measurePage(page, p.url, { width: 390, height: 844, label: '390x844' }, p.expectsSection);
      reports.push({ page: p.name, url: p.url, desktop, mobile });
    }
  } finally {
    await browser.close();
    proc?.kill('SIGTERM');
  }

  const outPath = path.join(process.cwd(), 'docs/audits/pr-j1-plan-cta-validation.json');
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), reports }, null, 2));

  console.log('| Page | Section | CTA exists | CTA visible (desktop) | CTA text | Section height |');
  console.log('| --- | --- | --- | --- | --- | ---: |');
  for (const r of reports) {
    console.log(
      `| ${r.page} | ${r.desktop.sectionExists} | ${r.desktop.ctaExists} | ${r.desktop.ctaVisible} | ${r.desktop.ctaText.slice(0, 40)}… | ${r.desktop.sectionHeight} |`,
    );
  }

  const failed = reports.filter((r) => !r.desktop.pass || !r.mobile.pass);
  console.log(`Wrote ${outPath}`);
  if (failed.length > 0) {
    console.error('Failed pages:', failed.map((f) => f.page).join(', '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
