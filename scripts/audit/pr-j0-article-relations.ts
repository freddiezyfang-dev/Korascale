/**
 * PR-J0 Journey × Inspiration relation audit (read-only DB).
 */
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

function loadEnvLocal() {
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
loadEnvLocal();

const LEGACY_CATEGORIES = [
  'food-journey',
  'the-western-corridor',
  'ancient-chinese-culture',
  'Food Journey',
  'Great Outdoors',
  'Immersive Encounters',
];

async function main() {
  const pool = new Pool({
    connectionString: process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });
  const client = await pool.connect();
  try {
    await client.query('BEGIN TRANSACTION READ ONLY');
    const journeys = (
      await client.query(`
        SELECT id, slug, title, status, data
        FROM journeys
        WHERE status = 'active'
        ORDER BY title
      `)
    ).rows;
    const articles = (
      await client.query(`
        SELECT id, slug, title, status, category, related_journey_ids, recommended_items
        FROM articles
        ORDER BY updated_at DESC
      `)
    ).rows;
    await client.query('ROLLBACK');

    const journeyById = new Map(journeys.map((j) => [j.id, j]));
    const activeArticleIds = new Set(
      articles.filter((a) => a.status === 'active').map((a) => a.id)
    );

    const journeyRows = journeys.map((j) => {
      const data = j.data || {};
      const relatedArticles = Array.isArray(data.relatedArticles)
        ? data.relatedArticles
        : [];
      const relatedTrips = Array.isArray(data.relatedTrips)
        ? data.relatedTrips
        : [];
      return {
        journey: j.slug,
        title: j.title,
        relatedArticleCount: relatedArticles.length,
        uuidBased: relatedArticles.every(
          (x: unknown) => typeof x === 'string' && x.length > 20
        ),
        relatedTripsCount: relatedTrips.length,
      };
    });

    const articlesWithJourneys = articles.map((a) => {
      const rj = Array.isArray(a.related_journey_ids)
        ? a.related_journey_ids
        : typeof a.related_journey_ids === 'string'
          ? JSON.parse(a.related_journey_ids)
          : [];
      const rec = Array.isArray(a.recommended_items)
        ? a.recommended_items
        : [];
      const recJourneys = rec.filter(
        (i: { type?: string }) => i?.type === 'journey'
      );
      const orphanJourneyRefs = rj.filter(
        (id: string) => !journeyById.has(id)
      );
      return {
        slug: a.slug,
        category: a.category,
        status: a.status,
        relatedJourneyIds: rj.length,
        recommendedJourneyItems: recJourneys.length,
        orphanJourneyRefs,
        legacyCategory: LEGACY_CATEGORIES.some((c) =>
          String(a.category).toLowerCase().includes(c.toLowerCase())
        ),
      };
    });

    const activeWithoutRelatedArticles = journeyRows.filter(
      (j) => j.relatedArticleCount === 0
    ).length;
    const activeWithOneArticle = journeyRows.filter(
      (j) => j.relatedArticleCount === 1
    ).length;
    const articlesActiveNoJourney = articles.filter(
      (a) =>
        a.status === 'active' &&
        (!a.related_journey_ids ||
          (Array.isArray(a.related_journey_ids) &&
            a.related_journey_ids.length === 0))
    ).length;

    const out = {
      activeJourneyCount: journeys.length,
      activeWithoutRelatedArticles,
      activeWithOneArticle,
      articlesActiveNoJourneyLink: articlesActiveNoJourney,
      journeyRelationSummary: journeyRows,
      articleRelationSummary: articlesWithJourneys,
      legacyCategoryArticles: articlesWithJourneys.filter((a) => a.legacyCategory),
    };

    const outPath = path.join(
      process.cwd(),
      'docs/audits/pr-j0-article-relations.json'
    );
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log(`Wrote ${outPath}`);
    console.log(JSON.stringify(out, null, 2).slice(0, 2000));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
