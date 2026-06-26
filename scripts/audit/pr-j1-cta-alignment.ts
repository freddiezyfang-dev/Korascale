/**
 * Measure Plan Your Journey CTA horizontal alignment vs main content container.
 * Usage: npm run build && npx tsx scripts/audit/pr-j1-cta-alignment.ts
 */
import { chromium, type Page } from 'playwright';
import { spawn, type ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';

const PORT = Number(process.env.PR_J1_PORT || 3055);
const BASE = `http://127.0.0.1:${PORT}`;
const TOLERANCE_PX = 4;
const OUT_DIR = path.join(process.cwd(), 'docs/audits/pr-j1-cta-alignment');

const PAGES = [
  { name: 'journeys-list', url: '/journeys' },
  { name: 'explore-together', url: '/journeys/type/explore-together' },
  { name: 'deep-discovery', url: '/journeys/type/deep-discovery' },
  { name: 'signature-journeys', url: '/journeys/type/signature-journeys' },
];

type AlignmentResult = {
  viewport: string;
  mainContent: { left: number; right: number; width: number } | null;
  grid: { left: number; right: number; width: number } | null;
  cta: { left: number; right: number; width: number } | null;
  leftDelta: number | null;
  rightDelta: number | null;
  pass: boolean;
  notes: string[];
};

async function measureAlignment(
  page: Page,
  url: string,
  viewport: { width: number; height: number; label: string },
): Promise<AlignmentResult> {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`${BASE}${url}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('[data-testid="plan-your-journey-cta"]', { timeout: 30000 }).catch(() => undefined);
  await page.waitForTimeout(500);

  const data = await page.evaluate(() => {
    const main = document.querySelector('[data-testid="journey-main-content"]') as HTMLElement | null;
    const grid = document.querySelector('[data-testid="journey-grid"]') as HTMLElement | null;
    const cta = document.querySelector('[data-testid="plan-your-journey-cta"]') as HTMLElement | null;

    const mainContent = main
      ? (() => {
          const r = main.getBoundingClientRect();
          return { left: r.left, right: r.right, width: r.width };
        })()
      : null;
    const gridRect = grid
      ? (() => {
          const r = grid.getBoundingClientRect();
          return { left: r.left, right: r.right, width: r.width };
        })()
      : null;
    const ctaRect = cta
      ? (() => {
          const r = cta.getBoundingClientRect();
          return { left: r.left, right: r.right, width: r.width };
        })()
      : null;

    return {
      mainContent,
      grid: gridRect,
      cta: ctaRect,
    };
  });

  const notes: string[] = [];
  const reference = data.grid ?? data.mainContent;
  if (!reference) notes.push('missing journey-main-content and journey-grid');
  if (!data.cta) notes.push('missing plan-your-journey-cta');

  const leftDelta =
    reference && data.cta ? Math.abs(Math.round(reference.left - data.cta.left)) : null;
  const rightDelta =
    reference && data.cta ? Math.abs(Math.round(reference.right - data.cta.right)) : null;

  const pass =
    leftDelta !== null &&
    rightDelta !== null &&
    leftDelta <= TOLERANCE_PX &&
    rightDelta <= TOLERANCE_PX &&
    notes.length === 0;

  if (leftDelta !== null && leftDelta > TOLERANCE_PX) notes.push(`left delta ${leftDelta}px > ${TOLERANCE_PX}px`);
  if (rightDelta !== null && rightDelta > TOLERANCE_PX) notes.push(`right delta ${rightDelta}px > ${TOLERANCE_PX}px`);

  return {
    viewport: viewport.label,
    mainContent: data.mainContent,
    grid: data.grid,
    cta: data.cta,
    leftDelta,
    rightDelta,
    pass,
    notes,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

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
  const reports: Array<{
    page: string;
    url: string;
    desktop: AlignmentResult;
    mobile: AlignmentResult;
    screenshots: { desktop: string; mobile: string };
  }> = [];

  try {
    for (const p of PAGES) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${BASE}${p.url}`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForSelector('[data-testid="plan-your-journey-cta"]', { timeout: 30000 }).catch(() => undefined);
      await page.waitForTimeout(500);
      const desktopShot = path.join(OUT_DIR, `${p.name}-desktop-1440.png`);
      await page.screenshot({ path: desktopShot, fullPage: false });

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE}${p.url}`, { waitUntil: 'load', timeout: 120000 });
      await page.waitForSelector('[data-testid="plan-your-journey-cta"]', { timeout: 30000 }).catch(() => undefined);
      await page.waitForTimeout(500);
      const mobileShot = path.join(OUT_DIR, `${p.name}-mobile-390.png`);
      await page.screenshot({ path: mobileShot, fullPage: false });

      const desktop = await measureAlignment(page, p.url, { width: 1440, height: 900, label: '1440x900' });
      const mobile = await measureAlignment(page, p.url, { width: 390, height: 844, label: '390x844' });

      reports.push({
        page: p.name,
        url: p.url,
        desktop,
        mobile,
        screenshots: {
          desktop: path.relative(process.cwd(), desktopShot),
          mobile: path.relative(process.cwd(), mobileShot),
        },
      });
    }
  } finally {
    await browser.close();
    proc?.kill('SIGTERM');
  }

  const outPath = path.join(OUT_DIR, 'alignment-report.json');
  fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), tolerancePx: TOLERANCE_PX, reports }, null, 2));

  console.log('| Page | Desktop ΔL/ΔR | Mobile ΔL/ΔR | Pass |');
  console.log('| --- | --- | --- | --- |');
  for (const r of reports) {
    const d = `${r.desktop.leftDelta ?? 'n/a'}/${r.desktop.rightDelta ?? 'n/a'}`;
    const m = `${r.mobile.leftDelta ?? 'n/a'}/${r.mobile.rightDelta ?? 'n/a'}`;
    const pass = r.desktop.pass && r.mobile.pass ? 'yes' : 'no';
    console.log(`| ${r.page} | ${d} | ${m} | ${pass} |`);
  }

  console.log(`Wrote ${outPath}`);
  const failed = reports.filter((r) => !r.desktop.pass || !r.mobile.pass);
  if (failed.length > 0) {
    console.error('Failed alignment:', failed.map((f) => f.page).join(', '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
