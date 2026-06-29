import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

const FORBIDDEN_PUBLIC_IMPORTS = [
	"@/lib/journeyNormalization/adminCompatFields",
	"@/lib/journeyNormalization/fields",
	"@/lib/journeyAdminCompatMapper.server",
	"./adminCompatFields",
	"./fields",
];

/** Public runtime modules must not import admin compat resolvers (PR-J3A). */
const PUBLIC_RUNTIME_FILES = [
	'src/lib/journeyListQuery.server.ts',
	'src/lib/journeyDetailQuery.server.ts',
	'src/lib/journeySeo.server.ts',
	'src/lib/journeyServer.ts',
	'src/lib/journeyNormalization/publicNormalizedFields.ts',
	'src/lib/journeyNormalization/sitemap.ts',
	'src/app/journeys/page.tsx',
	'src/app/journeys/[...slug]/page.tsx',
	'src/app/journeys/type/[type]/page.tsx',
];

/** Admin compat and deprecated fields.ts consumers (allowed). */
const ADMIN_OR_HISTORICAL_IMPORTERS = [
	'src/lib/journeyAdminCompatMapper.server.ts',
	'src/lib/journeyNormalization/fields.ts',
	'src/lib/journeyNormalization/seo.ts',
	'src/app/api/journeys/route.ts',
	'src/app/api/journeys/[id]/route.ts',
];

function readSource(relativePath: string): string {
	return readFileSync(join(repoRoot, relativePath), 'utf8');
}

function importsForbiddenModule(source: string): string[] {
	return FORBIDDEN_PUBLIC_IMPORTS.filter((token) => source.includes(token));
}

describe('PR-J3A public/admin import boundary', () => {
	it('public runtime files do not import adminCompatFields, fields.ts, or admin mapper', () => {
		for (const file of PUBLIC_RUNTIME_FILES) {
			const violations = importsForbiddenModule(readSource(file));
			expect(violations, `${file} must not import ${violations.join(', ')}`).toEqual([]);
		}
	});

	it('public journeyListQuery only references publicNormalizedFields for SEO columns', () => {
		const source = readSource('src/lib/journeyListQuery.server.ts');
		expect(source).toContain('publicNormalizedFields');
		expect(source).not.toContain('adminCompatFields');
		expect(source).not.toContain("from '@/lib/journeyNormalization/fields'");
	});

	it('admin mapper is isolated in journeyAdminCompatMapper.server.ts', () => {
		const source = readSource('src/lib/journeyAdminCompatMapper.server.ts');
		expect(source).toContain('adminCompatFields');
		expect(source).not.toContain('publicNormalizedFields');
	});

	it('fields.ts remains admin-compat re-export only', () => {
		const source = readSource('src/lib/journeyNormalization/fields.ts');
		expect(source).toContain('adminCompatFields');
		expect(source).toMatch(/deprecated/i);
	});

	it('authenticated admin API route may import admin compat mapper', () => {
		const source = readSource('src/app/api/journeys/route.ts');
		expect(source).toContain('journeyAdminCompatMapper.server');
		expect(source).toContain('isAuthenticatedAdmin');
	});

	it('historical/admin importers are explicitly allowlisted', () => {
		for (const file of ADMIN_OR_HISTORICAL_IMPORTERS) {
			expect(() => readSource(file)).not.toThrow();
		}
	});
});
