#!/usr/bin/env node
import fs from 'node:fs/promises';

import { loadLocalEnv, getCreatedBy, parseArgs, requireDatabaseEnv } from './loadEnv';
import { printSubmitSummary, submitSeoRevision } from '../../src/lib/seo/revisionSubmit';

loadLocalEnv();
requireDatabaseEnv();

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const filePath = typeof args.file === 'string' ? args.file : '';
	const dryRun = args['dry-run'] === true;

	if (!filePath) {
		console.error(
			'Usage: npm run seo:submit-revision -- --file <revision-file> [--dry-run]'
		);
		process.exit(1);
	}

	let fileContent: unknown;
	try {
		const raw = await fs.readFile(filePath, 'utf8');
		fileContent = JSON.parse(raw) as unknown;
	} catch (error) {
		console.error(
			'Failed to read revision file:',
			error instanceof Error ? error.message : String(error)
		);
		process.exit(1);
	}

	try {
		const result = await submitSeoRevision({
			fileContent,
			dryRun,
			createdBy: getCreatedBy(),
		});

		if (!result.success) {
			console.error(`Submit failed: ${result.error}`);
			if (result.errors) {
				for (const [field, message] of Object.entries(result.errors)) {
					console.error(`  - ${field}: ${message}`);
				}
			}
			process.exit(1);
		}

		printSubmitSummary(result.summary);
		if (dryRun) {
			console.log('Dry-run complete — no database writes performed.');
		}
	} catch (error) {
		console.error('Submit failed:', error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
}

main();
