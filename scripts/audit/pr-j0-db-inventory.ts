/**
 * PR-J0 read-only Journey DB inventory & anomaly audit.
 * Usage: npx tsx --tsconfig tsconfig.json scripts/audit/pr-j0-db-inventory.ts
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
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

loadEnvLocal();

const SITE_URL = 'https://www.korascale.com';
const VALID_TYPE_SLUGS = [
  'explore-together',
  'deep-discovery',
  'signature-journeys',
  'group-tours',
];
const TYPE_LABEL_TO_SLUG: Record<string, string> = {
  'Explore Together': 'explore-together',
  'Deep Discovery': 'deep-discovery',
  'Signature Journeys': 'signature-journeys',
  'Group Tours': 'group-tours',
};
const RESERVED_SLUGS = ['type', 'api', 'admin'];

type Row = Record<string, unknown>;

function csvEscape(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function parseDurationDays(duration: unknown): number | null {
  if (typeof duration !== 'string') return null;
  const m = duration.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

function countArray(v: unknown): number {
  return Array.isArray(v) ? v.length : 0;
}

function pickStr(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function isSeoReady(row: Row, data: Row): boolean {
  const status = row.status as string | null;
  const isActive = status === 'active' || status == null;
  if (!isActive) return false;
  const slug = pickStr(row.slug);
  const title = pickStr(row.title, data.pageTitle, data.name);
  const pageTitle = pickStr(data.pageTitle, row.title);
  const meta = pickStr(data.metaDescription, row.short_description);
  const excerpt = pickStr(row.short_description, data.shortDescription);
  const hero = pickStr(data.heroImage, row.image, data.image);
  if (!slug || !title || !pageTitle || !meta || !excerpt || !hero) return false;
  if (/[-]$/.test(slug) || /--/.test(slug)) return false;
  return true;
}

async function main() {
  const connectionString =
    process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('Missing POSTGRES_URL / NEON_POSTGRES_URL');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();

  try {
    await client.query('BEGIN TRANSACTION READ ONLY');

    const journeysRes = await client.query(`
      SELECT
        j.id, j.slug, j.status, j.journey_type, j.title,
        j.short_description, j.description, j.price, j.original_price,
        j.duration, j.max_participants, j.image, j.category, j.region,
        j.place, j.city, j.created_at, j.updated_at, j.data
      FROM journeys j
      ORDER BY j.created_at DESC
    `);

    const articlesRes = await client.query(`
      SELECT id, slug, status, category, title, related_journey_ids, recommended_items, updated_at
      FROM articles
      ORDER BY updated_at DESC
    `);

    await client.query('ROLLBACK');

    const journeys = journeysRes.rows as Row[];
    const articles = articlesRes.rows as Row[];

    const slugMap = new Map<string, string[]>();
    for (const j of journeys) {
      const slug = pickStr(j.slug);
      if (!slug) continue;
      const list = slugMap.get(slug) ?? [];
      list.push(String(j.id));
      slugMap.set(slug, list);
    }

    const anomalies = {
      slugNull: 0,
      slugEmpty: 0,
      slugTrim: 0,
      slugUpper: 0,
      slugNonAscii: 0,
      slugDoubleHyphen: 0,
      slugTrailingHyphen: 0,
      slugLeadingHyphen: 0,
      slugDuplicate: 0,
      slugReserved: 0,
      statusNull: 0,
      statusActive: 0,
      statusDraft: 0,
      statusInactive: 0,
      statusOther: 0,
      typeNull: 0,
      typeInvalid: 0,
      typeCounts: {} as Record<string, number>,
      activeTypeCounts: {} as Record<string, number>,
    };

    const csvLines: string[] = [
      [
        'id',
        'slug',
        'status',
        'journey_type',
        'name_title',
        'page_title',
        'meta_description',
        'excerpt',
        'duration_days',
        'max_guests',
        'price_from',
        'currency',
        'price_basis',
        'hero_image_exists',
        'hero_alt_exists',
        'itinerary_exists',
        'itinerary_day_count',
        'highlights_count',
        'faq_count',
        'related_article_count',
        'related_journey_count',
        'related_trips_count',
        'updated_at',
        'in_sitemap',
        'seo_ready',
        'slug_issues',
      ].join(','),
    ];

    for (const row of journeys) {
      const data = (row.data as Row) || {};
      const slug = pickStr(row.slug);
      const status = row.status as string | null;
      const journeyType = pickStr(row.journey_type, data.journeyType);
      const isActive = status === 'active' || status == null;
      const inSitemap = isActive && !!slug;

      const slugIssues: string[] = [];
      if (!row.slug) {
        anomalies.slugNull++;
        slugIssues.push('null');
      } else if (slug === '') {
        anomalies.slugEmpty++;
        slugIssues.push('empty');
      }
      if (typeof row.slug === 'string' && row.slug !== row.slug.trim()) {
        anomalies.slugTrim++;
        slugIssues.push('trim');
      }
      if (/[A-Z]/.test(slug)) {
        anomalies.slugUpper++;
        slugIssues.push('uppercase');
      }
      if (/[^\x00-\x7F]/.test(slug)) {
        anomalies.slugNonAscii++;
        slugIssues.push('non_ascii');
      }
      if (/--/.test(slug)) {
        anomalies.slugDoubleHyphen++;
        slugIssues.push('double_hyphen');
      }
      if (slug.endsWith('-')) {
        anomalies.slugTrailingHyphen++;
        slugIssues.push('trailing_hyphen');
      }
      if (slug.startsWith('-')) {
        anomalies.slugLeadingHyphen++;
        slugIssues.push('leading_hyphen');
      }
      if ((slugMap.get(slug)?.length ?? 0) > 1) {
        anomalies.slugDuplicate++;
        slugIssues.push('duplicate');
      }
      if (RESERVED_SLUGS.includes(slug.split('/')[0])) {
        anomalies.slugReserved++;
        slugIssues.push('reserved');
      }

      if (status == null) anomalies.statusNull++;
      else if (status === 'active') anomalies.statusActive++;
      else if (status === 'draft') anomalies.statusDraft++;
      else if (status === 'inactive' || status === 'archived')
        anomalies.statusInactive++;
      else anomalies.statusOther++;

      if (!journeyType) anomalies.typeNull++;
      else {
        anomalies.typeCounts[journeyType] =
          (anomalies.typeCounts[journeyType] ?? 0) + 1;
        if (isActive) {
          anomalies.activeTypeCounts[journeyType] =
            (anomalies.activeTypeCounts[journeyType] ?? 0) + 1;
        }
        const slugExpected = TYPE_LABEL_TO_SLUG[journeyType];
        if (!slugExpected && !VALID_TYPE_SLUGS.includes(journeyType)) {
          anomalies.typeInvalid++;
        }
      }

      const itinerary = data.itinerary;
      const itineraryCount = countArray(itinerary);
      const highlightsCount = countArray(data.highlights);
      const faqCount = countArray(data.faqs ?? data.faq);
      const relatedArticles = countArray(
        data.relatedArticles ?? data.related_articles
      );
      const relatedJourneys = countArray(
        data.relatedJourneys ?? data.related_journeys
      );
      const relatedTrips = countArray(data.relatedTrips);
      const maxGuests =
        (data.maxGuests as number | undefined) ??
        (row.max_participants as number | undefined) ??
        '';
      const pageTitle = pickStr(data.pageTitle, row.title);
      const metaDescription = pickStr(
        data.metaDescription,
        row.short_description
      );
      const excerpt = pickStr(row.short_description, data.shortDescription);
      const heroImage = pickStr(data.heroImage, row.image, data.image);
      const heroAlt = pickStr(data.heroAlt, data.heroImageAlt);
      const durationDays = parseDurationDays(row.duration);
      const price = row.price ?? data.price ?? '';
      const currency = pickStr(data.currency, data.priceCurrency) || 'unknown';
      const priceBasis = pickStr(
        data.priceBasis,
        data.price_basis,
        data.priceDetails ? 'details_field' : ''
      );

      csvLines.push(
        [
          row.id,
          slug,
          status ?? 'NULL',
          journeyType,
          pickStr(row.title, data.name),
          pageTitle,
          metaDescription.slice(0, 120),
          excerpt.slice(0, 120),
          durationDays ?? '',
          maxGuests,
          price,
          currency,
          priceBasis,
          heroImage ? 'true' : 'false',
          heroAlt ? 'true' : 'false',
          itineraryCount > 0 ? 'true' : 'false',
          itineraryCount,
          highlightsCount,
          faqCount,
          relatedArticles,
          relatedJourneys,
          relatedTrips,
          row.updated_at,
          inSitemap ? 'true' : 'false',
          isSeoReady(row, data) ? 'true' : 'false',
          slugIssues.join('|'),
        ]
          .map(csvEscape)
          .join(',')
      );
    }

    const outCsv = path.join(
      process.cwd(),
      'docs/audits/pr-j0-journey-inventory.csv'
    );
    fs.writeFileSync(outCsv, csvLines.join('\n') + '\n');

    const jsonOut = path.join(
      process.cwd(),
      'docs/audits/pr-j0-db-summary.json'
    );
    fs.writeFileSync(
      jsonOut,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          journeyTotal: journeys.length,
          activeCount: journeys.filter(
            (j) => j.status === 'active' || j.status == null
          ).length,
          sitemapEligible: journeys.filter((j) => {
            const s = pickStr(j.slug);
            return (j.status === 'active' || j.status == null) && !!s;
          }).length,
          articleTotal: articles.length,
          activeArticles: articles.filter((a) => a.status === 'active').length,
          anomalies,
          activeSlugs: journeys
            .filter((j) => j.status === 'active' || j.status == null)
            .map((j) => pickStr(j.slug))
            .filter(Boolean),
          typeLabelToSlug: TYPE_LABEL_TO_SLUG,
          siteUrl: SITE_URL,
        },
        null,
        2
      )
    );

    console.log(`Wrote ${outCsv}`);
    console.log(`Wrote ${jsonOut}`);
    console.log(
      JSON.stringify(
        {
          journeyTotal: journeys.length,
          activeCount: journeys.filter(
            (j) => j.status === 'active' || j.status == null
          ).length,
          anomalies,
        },
        null,
        2
      )
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
