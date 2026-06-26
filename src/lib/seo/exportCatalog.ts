import fs from 'node:fs/promises';
import path from 'node:path';

import { query } from '@/lib/db';
import { getCanonicalCategoryForArticle } from '@/lib/articleCategories';
import { buildPublicStatusWhereClause } from '@/lib/journeyNormalization/status';

export type ContentCatalogArticle = {
	id: string;
	slug: string;
	title: string;
	category: string;
};

export type ContentCatalogJourney = {
	id: string;
	slug: string;
	title: string;
	type: string | null;
};

export type ContentCatalog = {
	exportedAt: string;
	activeArticles: ContentCatalogArticle[];
	activeJourneys: ContentCatalogJourney[];
};

export const DEFAULT_CATALOG_PATH = path.join(
	process.cwd(),
	'content-workspace',
	'source',
	'content-catalog.json'
);

export async function fetchActiveArticlesForCatalog(): Promise<ContentCatalogArticle[]> {
	const { rows } = await query(
		`
    SELECT id, slug, title, category
    FROM articles
    WHERE status = 'active'
    ORDER BY title ASC
  `
	);

	return rows.map((row) => {
		const category = String(row.category ?? '');
		return {
			id: String(row.id ?? ''),
			slug: String(row.slug ?? ''),
			title: String(row.title ?? ''),
			category: getCanonicalCategoryForArticle({ category }),
		};
	});
}

export async function fetchActiveJourneysForCatalog(): Promise<ContentCatalogJourney[]> {
	const { rows } = await query(
		`
    SELECT id, slug, title, journey_type
    FROM journeys
    WHERE ${buildPublicStatusWhereClause()}
    ORDER BY title ASC
    LIMIT 500
  `
	);

	return rows.map((row) => ({
		id: String(row.id ?? ''),
		slug: String(row.slug ?? ''),
		title: String(row.title ?? ''),
		type: row.journey_type != null ? String(row.journey_type) : null,
	}));
}

export async function exportContentCatalog(
	outputPath = DEFAULT_CATALOG_PATH
): Promise<ContentCatalog> {
	const [activeArticles, activeJourneys] = await Promise.all([
		fetchActiveArticlesForCatalog(),
		fetchActiveJourneysForCatalog(),
	]);

	const catalog: ContentCatalog = {
		exportedAt: new Date().toISOString(),
		activeArticles,
		activeJourneys,
	};

	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	await fs.writeFile(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

	return catalog;
}
