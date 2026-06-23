import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { CANONICAL_ARTICLE_CATEGORIES } from '@/lib/articleCategories';

import validRevisionFixture from './fixtures/valid-revision.fixture.json';
import { SEO_ALLOWED_REVISION_KEYS } from './schema';
import { validateSeoRevisionSubmission } from './schema';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SKILLS_ROOT = path.join(REPO_ROOT, '.agents/skills');
const SHARED_REFS = path.join(SKILLS_ROOT, 'korascale-seo-shared/references');

const REQUIRED_REFERENCES = [
	'brand-positioning.md',
	'article-categories.md',
	'seo-standards.md',
	'writing-style.md',
	'article-structure.md',
	'internal-linking.md',
	'cta-rules.md',
	'factual-safety.md',
	'revision-schema.md',
];

const SKILL_DIRS = ['korascale-seo-revise', 'korascale-seo-write'] as const;

function readSkill(name: string): string {
	return fs.readFileSync(path.join(SKILLS_ROOT, name, 'SKILL.md'), 'utf8');
}

function parseFrontmatter(content: string): Record<string, string> {
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return {};
	const fields: Record<string, string> = {};
	const body = match[1];
	const descMatch = body.match(/^description:\s*>-?\s*\n([\s\S]*?)(?=\n[A-Za-z_]+:|\s*$)/m);
	if (descMatch) {
		fields.description = descMatch[1]
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean)
			.join(' ');
	}
	for (const line of body.split('\n')) {
		if (line.startsWith('description:')) continue;
		const idx = line.indexOf(':');
		if (idx === -1) continue;
		const key = line.slice(0, idx).trim();
		if (key === 'description') continue;
		fields[key] = line.slice(idx + 1).trim();
	}
	return fields;
}

describe('KoraScale SEO skills infrastructure', () => {
	it('has valid skill frontmatter and directories', () => {
		for (const dir of SKILL_DIRS) {
			const skillPath = path.join(SKILLS_ROOT, dir, 'SKILL.md');
			expect(fs.existsSync(skillPath), `${dir}/SKILL.md missing`).toBe(true);
			const content = readSkill(dir);
			const fm = parseFrontmatter(content);
			expect(fm.name).toBe(dir);
			expect(fm.description?.length).toBeGreaterThan(20);
		}
	});

	it('has all shared reference files', () => {
		for (const file of REQUIRED_REFERENCES) {
			expect(fs.existsSync(path.join(SHARED_REFS, file)), `missing ${file}`).toBe(true);
		}
	});

	it('skill markdown links point to existing reference files', () => {
		for (const dir of SKILL_DIRS) {
			const content = readSkill(dir);
			const links = [...content.matchAll(/\]\(\.\.\/korascale-seo-shared\/references\/([^)]+)\)/g)];
			expect(links.length).toBeGreaterThan(0);
			for (const [, refFile] of links) {
				expect(fs.existsSync(path.join(SHARED_REFS, refFile))).toBe(true);
			}
		}
	});

	it('revision-schema.md lists the same allowed keys as schema.ts', () => {
		const schemaDoc = fs.readFileSync(path.join(SHARED_REFS, 'revision-schema.md'), 'utf8');
		for (const key of SEO_ALLOWED_REVISION_KEYS) {
			expect(schemaDoc).toContain(`\`${key}\``);
		}
	});

	it('article-categories.md contains exact canonical category strings', () => {
		const categoriesDoc = fs.readFileSync(
			path.join(SHARED_REFS, 'article-categories.md'),
			'utf8'
		);
		for (const category of CANONICAL_ARTICLE_CATEGORIES) {
			expect(categoriesDoc).toContain(`\`${category}\``);
		}
	});

	it('valid revision fixture passes validateSeoRevisionSubmission', () => {
		const result = validateSeoRevisionSubmission(validRevisionFixture);
		expect(result.success).toBe(true);
	});

	it('revise skill documents contentBlocks priority and forbids direct article updates', () => {
		const revise = readSkill('korascale-seo-revise');
		expect(revise).toContain('contentBlocks');
		expect(revise.toLowerCase()).toContain('dry-run');
		expect(revise).not.toMatch(/UPDATE\s+articles/i);
		expect(revise).not.toMatch(/openai/i);
		expect(revise).not.toMatch(/auto-?publish/i);
	});

	it('write skill states new article submission is unsupported', () => {
		const write = readSkill('korascale-seo-write');
		expect(write).toContain(
			'New article backend submission is not supported by the current revision infrastructure.'
		);
		expect(write).toContain('Forbidden');
		expect(write).toContain('Calling `seo:submit-revision`');
	});

	it('internal-linking rules forbid inventing IDs', () => {
		const linking = fs.readFileSync(path.join(SHARED_REFS, 'internal-linking.md'), 'utf8');
		expect(linking).toMatch(/Never.*guess UUIDs/i);
		expect(linking).toContain('seo:export-catalog');
	});

	it('article-structure matches frontend render priority', () => {
		const structure = fs.readFileSync(path.join(SHARED_REFS, 'article-structure.md'), 'utf8');
		expect(structure).toContain('ArticleBodyContent');
		expect(structure).toContain('contentBlocks.length > 0');
		expect(structure).toContain('`contentBlocks` is primary when present');
	});
});
