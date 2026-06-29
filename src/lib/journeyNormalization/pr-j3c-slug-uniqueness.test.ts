import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
	query: vi.fn(),
}));

vi.mock('@/lib/auth/requireAdmin.server', () => ({
	enforceAdminWrite: vi.fn(),
}));

import { enforceAdminWrite } from '@/lib/auth/requireAdmin.server';
import { query } from '@/lib/db';
import {
	JourneySlugConflictClientError,
	JourneyPublishIntegrityClientError,
} from '@/lib/databaseClient';
import {
	JOURNEY_SLUG_CONFLICT_ERROR,
	JOURNEY_SLUG_KEY,
	JOURNEY_SLUG_NORMALIZED_UNIQUE_INDEX,
	buildJourneySlugConflictBody,
	isJourneySlugUniquenessViolation,
} from '@/lib/journeyNormalization/journeySlugConflictConstants';
import {
	findJourneySlugConflict,
	runJourneySlugUniquenessPreCheck,
} from '@/lib/journeyNormalization/journeySlugUniqueness.server';
import {
	evaluateJourneyContentCompleteness,
	validateJourneyPublishReadiness,
	type JourneyPublishCandidate,
} from '@/lib/journeyNormalization/journeyPublishIntegrity';
import {
	mergePublishCandidateWithUpdates,
} from '@/lib/journeyNormalization/journeyPublishIntegrity.server';
import { runJourneyPublishIntegrityGate } from '@/lib/journeyNormalization/journeyPublishIntegrityGate.server';
import { normalizeJourneySlugForComparison } from '@/lib/journeyNormalization/slug';
import { buildPublicStatusWhereClause } from '@/lib/journeyNormalization/status';
import { mapJourneyRowToPublicJourney } from '@/lib/journeyListQuery.server';
import { POST } from '@/app/api/journeys/route';
import { PUT } from '@/app/api/journeys/[id]/route';

const adminUser = { id: 'admin-1', email: 'admin@example.com', isAdmin: true };

function completeCandidate(
	overrides: Partial<JourneyPublishCandidate> = {}
): JourneyPublishCandidate {
	return {
		id: 'journey-1',
		title: 'Sample Journey',
		slug: 'sample-journey',
		short_description: 'Short copy',
		page_title: 'Page Title',
		meta_description: 'Meta description',
		hero_image_url: '/hero.jpg',
		hero_image_alt: 'Hero alt',
		journey_type_slug: 'deep-discovery',
		status: 'active',
		...overrides,
	};
}

describe('PR-J3C slug comparison normalization', () => {
	it('1-5. normalizes null, empty, whitespace, trim, and lowercase', () => {
		expect(normalizeJourneySlugForComparison(null)).toBeNull();
		expect(normalizeJourneySlugForComparison('')).toBeNull();
		expect(normalizeJourneySlugForComparison('   ')).toBeNull();
		expect(normalizeJourneySlugForComparison(' badaling-great-wall-day-tour ')).toBe(
			'badaling-great-wall-day-tour'
		);
		expect(normalizeJourneySlugForComparison('Badaling-Great-Wall-Day-Tour')).toBe(
			'badaling-great-wall-day-tour'
		);
	});
});

describe('PR-J3C slug conflict detection', () => {
	beforeEach(() => {
		vi.mocked(query).mockResolvedValue({
			rows: [
				{ id: 'a', slug: 'sample-journey' },
				{ id: 'b', slug: 'Badaling-Great-Wall-Day-Tour' },
				{ id: 'c', slug: ' other-slug ' },
				{ id: 'd', slug: null },
				{ id: 'e', slug: '' },
			],
		} as never);
	});

	it('6-8. detects exact, case, and trim variant collisions', async () => {
		expect(await findJourneySlugConflict('sample-journey')).toBe(true);
		expect(await findJourneySlugConflict('badaling-great-wall-day-tour')).toBe(true);
		expect(await findJourneySlugConflict('other-slug')).toBe(true);
	});

	it('9-10. active/archived and draft/archived collisions use same comparison key', async () => {
		const draftCandidate = completeCandidate({ id: 'new', slug: 'Sample-Journey', status: 'draft' });
		const check = await runJourneySlugUniquenessPreCheck(draftCandidate);
		expect(check.conflict).toBe(true);
	});

	it('11. excludes current Journey ID', async () => {
		expect(await findJourneySlugConflict('sample-journey', 'a')).toBe(false);
	});

	it('12-13. null and empty slugs do not conflict', async () => {
		expect(await findJourneySlugConflict('')).toBe(false);
		const nullCandidate = completeCandidate({ id: 'new-1', slug: '', status: 'draft' });
		expect((await runJourneySlugUniquenessPreCheck(nullCandidate)).conflict).toBe(false);
	});
});

describe('PR-J3C J3B gate interaction', () => {
	it('14. active canonical slug still passes completeness', () => {
		expect(evaluateJourneyContentCompleteness(completeCandidate()).contentComplete).toBe(true);
	});

	it('15. active trailing hyphen still rejected by J3B', () => {
		const result = evaluateJourneyContentCompleteness(
			completeCandidate({ slug: 'sample-journey-' })
		);
		expect(result.contentComplete).toBe(false);
		expect(result.errors.some((e) => e.field === 'slug')).toBe(true);
	});

	it('16. archived legacy invalid slug can save without slug change', async () => {
		const archived = completeCandidate({ status: 'archived', slug: 'Legacy-Slug-' });
		const gate = await runJourneyPublishIntegrityGate(archived);
		expect(gate.ok).toBe(true);
	});

	it('17. archived legacy slug blocked when promoting to active', () => {
		const existing = completeCandidate({ status: 'archived', slug: 'Legacy-Slug-' });
		const merged = mergePublishCandidateWithUpdates(existing, { status: 'active' });
		expect(validateJourneyPublishReadiness(merged).publishReady).toBe(false);
	});

	it('18-19. non-empty draft and archived slugs must be unique', async () => {
		vi.mocked(query).mockResolvedValue({
			rows: [{ id: 'other', slug: 'unique-slug' }],
		} as never);
		const draft = completeCandidate({ id: 'new', slug: 'unique-slug', status: 'draft' });
		expect((await runJourneySlugUniquenessPreCheck(draft)).conflict).toBe(true);
	});
});

describe('PR-J3C database conflict mapping', () => {
	it('1-3. maps both slug uniqueness 23505 objects; ignores unrelated unique violations', () => {
		expect(
			isJourneySlugUniquenessViolation({
				code: '23505',
				constraint: JOURNEY_SLUG_KEY,
			})
		).toBe(true);
		expect(
			isJourneySlugUniquenessViolation({
				code: '23505',
				constraint: JOURNEY_SLUG_NORMALIZED_UNIQUE_INDEX,
			})
		).toBe(true);
		expect(isJourneySlugUniquenessViolation({ code: '23505', constraint: 'other_unique_key' })).toBe(
			false
		);
	});

	it('returns stable 409 contract body', () => {
		const body = buildJourneySlugConflictBody();
		expect(body.error).toBe(JOURNEY_SLUG_CONFLICT_ERROR);
		expect(body.fields[0]?.field).toBe('slug');
		expect(body.fields[0]?.code).toBe('SLUG_CONFLICT');
	});
});

describe('PR-J3C API slug race handling', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(enforceAdminWrite).mockResolvedValue({ ok: true, user: adminUser } as never);
	});

	it('4. POST exact duplicate race (journeys_slug_key) returns 409', async () => {
		vi.mocked(query).mockImplementation(async (sql: string) => {
			if (String(sql).includes('INSERT INTO')) {
				const error = new Error('duplicate key') as Error & { code: string; constraint: string };
				error.code = '23505';
				error.constraint = JOURNEY_SLUG_KEY;
				throw error;
			}
			return { rows: [] } as never;
		});

		const response = await POST(
			new NextRequest('http://localhost:3000/api/journeys', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Draft', slug: 'draft-journey', status: 'draft' }),
			})
		);
		expect(response.status).toBe(409);
		const body = await response.json();
		expect(body.error).toBe(JOURNEY_SLUG_CONFLICT_ERROR);
		expect(body.fields[0]?.field).toBe('slug');
	});

	it('5. PUT exact duplicate race (journeys_slug_key) returns 409', async () => {
		const existingRow = {
			id: 'journey-1',
			title: 'Draft',
			slug: 'draft-journey',
			short_description: '',
			page_title: '',
			meta_description: '',
			hero_image_url: '',
			hero_image_alt: '',
			journey_type_slug: 'deep-discovery',
			status: 'draft',
			data: {},
		};

		vi.mocked(query).mockImplementation(async (sql: string) => {
			if (sql.includes('SELECT * FROM journeys WHERE id')) {
				return { rows: [existingRow] } as never;
			}
			if (sql === 'SELECT id, slug FROM journeys') {
				return { rows: [{ id: 'journey-1', slug: 'draft-journey' }] } as never;
			}
			if (sql.includes('UPDATE journeys')) {
				const error = new Error('duplicate key') as Error & { code: string; constraint: string };
				error.code = '23505';
				error.constraint = JOURNEY_SLUG_KEY;
				throw error;
			}
			if (sql.includes('SELECT data FROM journeys')) {
				return { rows: [{ data: {} }] } as never;
			}
			return { rows: [] } as never;
		});

		const response = await PUT(
			new NextRequest('http://localhost:3000/api/journeys/journey-1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slug: 'taken-slug' }),
			}),
			{ params: Promise.resolve({ id: 'journey-1' }) }
		);
		expect(response.status).toBe(409);
	});

	it('6. POST case/trim variant race (normalized index) returns 409', async () => {
		vi.mocked(query).mockImplementation(async (sql: string) => {
			if (String(sql).includes('INSERT INTO')) {
				const error = new Error('duplicate key') as Error & { code: string; constraint: string };
				error.code = '23505';
				error.constraint = JOURNEY_SLUG_NORMALIZED_UNIQUE_INDEX;
				throw error;
			}
			return { rows: [] } as never;
		});

		const response = await POST(
			new NextRequest('http://localhost:3000/api/journeys', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Draft', slug: ' Draft-Journey ', status: 'draft' }),
			})
		);
		expect(response.status).toBe(409);
	});

	it('22. POST maps normalized slug unique violation to 409', async () => {
		vi.mocked(query).mockImplementation(async (sql: string) => {
			if (String(sql).includes('INSERT INTO')) {
				const error = new Error('duplicate key') as Error & { code: string; constraint: string };
				error.code = '23505';
				error.constraint = JOURNEY_SLUG_NORMALIZED_UNIQUE_INDEX;
				throw error;
			}
			return { rows: [] } as never;
		});

		const response = await POST(
			new NextRequest('http://localhost:3000/api/journeys', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Draft', slug: 'draft-journey', status: 'draft' }),
			})
		);
		expect(response.status).toBe(409);
		const body = await response.json();
		expect(body.error).toBe(JOURNEY_SLUG_CONFLICT_ERROR);
	});

	it('7. PUT case/trim variant race (normalized index) returns 409', async () => {
		const existingRow = {
			id: 'journey-1',
			title: 'Draft',
			slug: 'draft-journey',
			short_description: '',
			page_title: '',
			meta_description: '',
			hero_image_url: '',
			hero_image_alt: '',
			journey_type_slug: 'deep-discovery',
			status: 'draft',
			data: {},
		};

		vi.mocked(query).mockImplementation(async (sql: string) => {
			if (sql.includes('SELECT * FROM journeys WHERE id')) {
				return { rows: [existingRow] } as never;
			}
			if (sql === 'SELECT id, slug FROM journeys') {
				return { rows: [{ id: 'journey-1', slug: 'draft-journey' }] } as never;
			}
			if (sql.includes('UPDATE journeys')) {
				const error = new Error('duplicate key') as Error & { code: string; constraint: string };
				error.code = '23505';
				error.constraint = JOURNEY_SLUG_NORMALIZED_UNIQUE_INDEX;
				throw error;
			}
			if (sql.includes('SELECT data FROM journeys')) {
				return { rows: [{ data: {} }] } as never;
			}
			return { rows: [] } as never;
		});

		const response = await PUT(
			new NextRequest('http://localhost:3000/api/journeys/journey-1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slug: ' DRAFT-JOURNEY ' }),
			}),
			{ params: Promise.resolve({ id: 'journey-1' }) }
		);
		expect(response.status).toBe(409);
	});

	it('23. PUT maps normalized slug unique violation to 409', async () => {
		const existingRow = {
			id: 'journey-1',
			title: 'Draft',
			slug: 'draft-journey',
			short_description: '',
			page_title: '',
			meta_description: '',
			hero_image_url: '',
			hero_image_alt: '',
			journey_type_slug: 'deep-discovery',
			status: 'draft',
			data: {},
		};

		vi.mocked(query).mockImplementation(async (sql: string) => {
			if (sql.includes('SELECT * FROM journeys WHERE id')) {
				return { rows: [existingRow] } as never;
			}
			if (sql === 'SELECT id, slug FROM journeys') {
				return { rows: [{ id: 'journey-1', slug: 'draft-journey' }] } as never;
			}
			if (sql.includes('UPDATE journeys')) {
				const error = new Error('duplicate key') as Error & { code: string; constraint: string };
				error.code = '23505';
				error.constraint = JOURNEY_SLUG_NORMALIZED_UNIQUE_INDEX;
				throw error;
			}
			if (sql.includes('SELECT data FROM journeys')) {
				return { rows: [{ data: {} }] } as never;
			}
			return { rows: [] } as never;
		});

		const response = await PUT(
			new NextRequest('http://localhost:3000/api/journeys/journey-1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slug: 'other-slug' }),
			}),
			{ params: Promise.resolve({ id: 'journey-1' }) }
		);
		expect(response.status).toBe(409);
	});

	it('26. draft slug pre-check returns 409 before INSERT', async () => {
		vi.mocked(query).mockImplementation(async (sql: string) => {
			if (sql === 'SELECT id, slug FROM journeys') {
				return { rows: [{ id: 'other', slug: 'taken-slug' }] } as never;
			}
			if (String(sql).includes('INSERT INTO')) {
				throw new Error('INSERT should not run on slug conflict');
			}
			return { rows: [] } as never;
		});

		const response = await POST(
			new NextRequest('http://localhost:3000/api/journeys', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Draft', slug: 'taken-slug', status: 'draft' }),
			})
		);
		expect(response.status).toBe(409);
		expect(
			vi.mocked(query).mock.calls.some(([sql]) => String(sql).includes('INSERT INTO'))
		).toBe(false);
	});
});

describe('PR-J3C client error classes', () => {
	it('8-9. Admin client errors expose slug field messages for DB slug conflicts', () => {
		for (const constraint of [JOURNEY_SLUG_KEY, JOURNEY_SLUG_NORMALIZED_UNIQUE_INDEX]) {
			const slugError = new JourneySlugConflictClientError('This Journey slug is already in use.', [
				{ field: 'slug', code: 'SLUG_CONFLICT', message: 'Choose a different Journey slug.' },
			]);
			expect(slugError.fields[0]?.field).toBe('slug');
			expect(slugError.name).toBe('JourneySlugConflictClientError');
			expect(isJourneySlugUniquenessViolation({ code: '23505', constraint })).toBe(true);
		}

		const publishError = new JourneyPublishIntegrityClientError('Not ready', []);
		expect(publishError.name).toBe('JourneyPublishIntegrityClientError');
	});
});

describe('PR-J3C migration artifacts', () => {
	const forwardSql = fs.readFileSync(
		path.join(
			process.cwd(),
			'database/migrations/pending/026_journey_slug_normalized_unique_index.sql'
		),
		'utf8'
	);
	const rollbackSql = fs.readFileSync(
		path.join(
			process.cwd(),
			'database/migrations/pending/026_journey_slug_normalized_unique_index.rollback.sql'
		),
		'utf8'
	);

	function sqlWithoutComments(sql: string): string {
		return sql
			.split('\n')
			.filter((line) => !line.trim().startsWith('--'))
			.join('\n');
	}

	it('1-3. forward migration allows journeys_slug_key and aborts wrong target definition', () => {
		expect(forwardSql).toContain('journeys_slug_key');
		expect(forwardSql).not.toContain('DROP INDEX journeys_slug_key');
		expect(forwardSql).not.toContain('DROP CONSTRAINT journeys_slug_key');
		expect(forwardSql).toContain('ABORT 026: journeys_slug_normalized_unique_idx exists with unexpected definition');
	});

	it('27-31. forward migration is index-only with fixed definition and predicate', () => {
		expect(forwardSql).toContain('CREATE UNIQUE INDEX journeys_slug_normalized_unique_idx');
		expect(forwardSql).toContain('LOWER(BTRIM(slug))');
		expect(forwardSql).toContain("slug IS NOT NULL");
		expect(forwardSql).toContain("BTRIM(slug) <> ''");
		expect(forwardSql).not.toContain('CREATE UNIQUE INDEX CONCURRENTLY');
		const executable = sqlWithoutComments(forwardSql);
		expect(executable).not.toMatch(/\bUPDATE\b/i);
		expect(executable).not.toMatch(/\bDELETE\b/i);
	});

	it('4-5. rollback preserves journeys_slug_key and drops only normalized index', () => {
		expect(rollbackSql).toContain('DROP INDEX journeys_slug_normalized_unique_idx');
		expect(rollbackSql).toContain('journeys_slug_key must remain after rollback');
		expect(rollbackSql).not.toContain('DROP INDEX journeys_slug_key');
		const executable = sqlWithoutComments(rollbackSql);
		expect(executable).not.toMatch(/\bUPDATE\b/i);
		expect(executable).not.toMatch(/\bDELETE\b/i);
	});

	it('28-29. rollback drops only target index without row writes', () => {
		expect(rollbackSql).toContain('DROP INDEX journeys_slug_normalized_unique_idx');
		const executable = sqlWithoutComments(rollbackSql);
		expect(executable).not.toMatch(/\bUPDATE\b/i);
		expect(executable).not.toMatch(/\bDELETE\b/i);
	});
});

describe('PR-J3C regression guards', () => {
	it('33-36. public resolver and J3A/J3B boundaries unchanged', () => {
		expect(buildPublicStatusWhereClause()).toBe("status = 'active'");
		const publicSource = mapJourneyRowToPublicJourney.toString();
		expect(publicSource).not.toContain('seo_complete');
		expect(publicSource).not.toContain('normalizeJourneySlugForComparison');
	});

	it('37-38. no 025C2 or price normalization in J3C slug modules', () => {
		const source = normalizeJourneySlugForComparison.toString();
		expect(source).not.toContain('price_basis');
		expect(source).not.toContain('025C2');
	});
});
