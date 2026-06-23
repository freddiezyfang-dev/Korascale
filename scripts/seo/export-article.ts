#!/usr/bin/env node
import { loadLocalEnv, parseArgs, requireDatabaseEnv } from './loadEnv';
import { exportArticleBySlug } from '../../src/lib/seo/exportArticle';

loadLocalEnv();
requireDatabaseEnv();

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const slug = typeof args.slug === 'string' ? args.slug : '';

	if (!slug) {
		console.error('Usage: npm run seo:export -- --slug <article-slug>');
		process.exit(1);
	}

	try {
		const result = await exportArticleBySlug(slug);
		if (!result.success) {
			console.error(`Export failed: ${result.error}`);
			process.exit(1);
		}

		console.log(`Exported article "${result.exportData.sourceSlug}"`);
		console.log(`Output: ${result.outputPath}`);
		console.log(`sourceArticleId: ${result.exportData.sourceArticleId}`);
		console.log(`sourceUpdatedAt: ${result.exportData.sourceUpdatedAt}`);
	} catch (error) {
		console.error('Export failed:', error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
}

main();
