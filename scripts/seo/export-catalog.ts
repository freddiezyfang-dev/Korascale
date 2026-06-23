#!/usr/bin/env node
import { loadLocalEnv, requireDatabaseEnv } from './loadEnv';
import { DEFAULT_CATALOG_PATH, exportContentCatalog } from '../../src/lib/seo/exportCatalog';

loadLocalEnv();
requireDatabaseEnv();

async function main() {
	try {
		const catalog = await exportContentCatalog();
		console.log(`Exported content catalog`);
		console.log(`Output: ${DEFAULT_CATALOG_PATH}`);
		console.log(`Active articles: ${catalog.activeArticles.length}`);
		console.log(`Active journeys: ${catalog.activeJourneys.length}`);
	} catch (error) {
		console.error(
			'Catalog export failed:',
			error instanceof Error ? error.message : String(error)
		);
		process.exit(1);
	}
}

main();
