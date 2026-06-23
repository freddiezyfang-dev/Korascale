import fs from 'node:fs/promises';
import path from 'node:path';

import { getArticleBySlugForSeo } from './articleRevisionQuery.server';
import { buildSeoArticleExport } from './mapArticle';
import type { SeoArticleExport } from './types';

export const DEFAULT_EXPORT_DIR = path.join(process.cwd(), 'content-workspace', 'source');

export type ExportArticleResult =
	| { success: true; exportData: SeoArticleExport; outputPath: string }
	| { success: false; error: string };

export async function exportArticleBySlug(
	slug: string,
	outputDir = DEFAULT_EXPORT_DIR
): Promise<ExportArticleResult> {
	const trimmed = decodeURIComponent(slug).trim();
	if (!trimmed) {
		return { success: false, error: 'Slug is required.' };
	}

	const article = await getArticleBySlugForSeo(trimmed);
	if (!article) {
		return { success: false, error: `Article not found for slug "${trimmed}".` };
	}

	const exportData = buildSeoArticleExport(article);
	await fs.mkdir(outputDir, { recursive: true });

	const outputPath = path.join(outputDir, `${trimmed}.json`);
	await fs.writeFile(outputPath, `${JSON.stringify(exportData, null, 2)}\n`, 'utf8');

	return { success: true, exportData, outputPath };
}
