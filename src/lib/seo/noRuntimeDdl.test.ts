import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const RUNTIME_PATHS = [
	'src/app/api/articles/route.ts',
	'src/app/api/articles/[id]/route.ts',
	'src/lib/mapArticleApiRow.ts',
	'src/lib/seo/revisionAdmin.server.ts',
];

const DDL_PATTERN = /\bALTER\s+TABLE\b|\bADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\b/i;

describe('runtime code must not execute schema DDL', () => {
	for (const relativePath of RUNTIME_PATHS) {
		it(`${relativePath} contains no ALTER TABLE or ADD COLUMN IF NOT EXISTS`, () => {
			const absolutePath = path.join(process.cwd(), relativePath);
			const source = fs.readFileSync(absolutePath, 'utf8');
			expect(source).not.toMatch(DDL_PATTERN);
			expect(source).not.toMatch(/ensureArticleCtaConfigColumn/);
		});
	}
});
