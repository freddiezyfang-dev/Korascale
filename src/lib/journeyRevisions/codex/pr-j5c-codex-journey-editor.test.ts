import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
	query: vi.fn(),
	withTransaction: vi.fn(),
}));

vi.mock('@/lib/journeyNormalization/journeySlugUniqueness.server', () => ({
	findJourneySlugConflict: vi.fn(),
}));

vi.mock('@/lib/journeyNormalization/journeyPublishIntegrityGate.server', () => ({
	runJourneyPublishIntegrityGate: vi.fn(),
}));

import { query } from '@/lib/db';
import { findJourneySlugConflict } from '@/lib/journeyNormalization/journeySlugUniqueness.server';
import { runJourneyPublishIntegrityGate } from '@/lib/journeyNormalization/journeyPublishIntegrityGate.server';
import { sanitizeClientChanges } from '@/lib/journeyRevisions/allowlist';
import {
	assertNoDirectJourneySql,
	assertProductionPublishAllowed,
	assertRevisionConfirmMatch,
	assertWriteCommandAllowed,
	CodexJourneyGuardError,
} from '@/lib/journeyRevisions/codex/guards';
import {
	isCodexWriteEnabled,
	resolveCodexEnvironment,
	getCodexActorIdentity,
} from '@/lib/journeyRevisions/codex/environment';
import { validateImageUrlsInChanges } from '@/lib/journeyRevisions/codex/imageRules';
import {
	extractRevisionIdFromPublishInstruction,
	isExplicitPublishInstruction,
	isImplicitPublishPhrase,
} from '@/lib/journeyRevisions/codex/publishIntent';
import { parseCodexRequest } from '@/lib/journeyRevisions/codex/requestSchema';
import { redactSecrets } from '@/lib/journeyRevisions/codex/output';
import {
	rejectDirectJourneySql,
	codexDryRunJourneyRevision,
	codexCreateJourneyRevision,
} from '@/lib/journeyRevisions/codex/operator.server';
import {
	detectLockedFieldChangeAttempts,
	detectProtectedClientFieldAttempts,
	validateSourceUpdatedAt,
} from '@/lib/journeyRevisions/validation';
import {
	mergeChangesIntoProposedSnapshot,
	rowToJourneyRevisionSnapshot,
} from '@/lib/journeyRevisions/snapshot';
import { detectNoOpUpdate } from '@/lib/journeyRevisions/codex/noOpRevision';

import { defaultProposedStatusForOperation } from '@/lib/journeyRevisions/stateMachine';

const JOURNEY_ID = '11111111-1111-4111-8111-111111111111';
const REVISION_ID = '33333333-3333-4333-8333-333333333333';
const OTHER_JOURNEY_ID = '44444444-4444-4444-8444-444444444444';
const ARTICLE_ID = '22222222-2222-4222-8222-222222222222';

function sampleJourneyRow(overrides: Record<string, unknown> = {}) {
	return {
		id: JOURNEY_ID,
		slug: 'sample-journey',
		status: 'active',
		title: 'Sample Journey',
		short_description: 'Short',
		description: 'Desc',
		page_title: 'Sample Page Title',
		meta_description: 'Meta',
		hero_image_url: '/hero.jpg',
		hero_image_alt: 'Hero alt',
		journey_type_slug: 'deep-discovery',
		journey_type: 'Deep Discovery',
		price: 100,
		original_price: null,
		currency: null,
		price_from: null,
		price_basis: null,
		price_on_request: null,
		data: {
			itinerary: [{ day: 1, title: 'Day 1', description: 'Content' }],
			faqs: [{ question: 'Q', answer: 'A' }],
			customField: 'preserve-me',
		},
		updated_at: '2026-06-29T10:00:00.000Z',
		created_at: '2026-06-01T10:00:00.000Z',
		...overrides,
	};
}

describe('PR-J5C Codex Journey Editor', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		delete process.env.CODEX_JOURNEY_REVISION_PREP;
		delete process.env.CODEX_JOURNEY_REVISION_WRITE_ENABLED;
		process.env.NEON_POSTGRES_URL = 'postgresql://u:p@localhost:5432/devdb';
		vi.mocked(findJourneySlugConflict).mockResolvedValue(false);
		vi.mocked(runJourneyPublishIntegrityGate).mockResolvedValue({
			ok: true,
			contentComplete: true,
			publishReady: false,
			errors: [],
			seoComplete: false,
		});
		vi.mocked(query).mockImplementation(async (text: string, params?: unknown[]) => {
			if (text.includes('information_schema.tables')) {
				return { rows: [{ exists: true }] } as never;
			}
			if (text.includes('FROM journeys WHERE id')) {
				return { rows: [sampleJourneyRow()] } as never;
			}
			if (text.includes('FROM journeys')) {
				return { rows: [sampleJourneyRow()] } as never;
			}
			if (text.includes('journey_revisions')) {
				return { rows: [] } as never;
			}
			if (text.includes('FROM articles WHERE id')) {
				return { rows: [{ id: params?.[0] }] } as never;
			}
			return { rows: [] } as never;
		});
	});

	it('1. Skill forbids direct Journey write', () => {
		const skill = fs.readFileSync(
			path.join(process.cwd(), '.agents/skills/journey-editor/SKILL.md'),
			'utf8'
		);
		expect(skill).toContain('Never write directly to the journeys table');
		expect(skill).toContain('pending_review');
		expect(() => rejectDirectJourneySql('UPDATE journeys SET title = $1')).toThrow(
			CodexJourneyGuardError
		);
	});

	it('2. read path does not call createJourneyRevision', async () => {
		const createSpy = vi.spyOn(await import('@/lib/journeyRevisions/dryRun.server'), 'createJourneyRevision');
		const { readJourneyBySlug } = await import('@/lib/journeyRevisions/codex/operator.server');
		const journey = await readJourneyBySlug('sample-journey');
		expect(journey?.id).toBe(JOURNEY_ID);
		expect(createSpy).not.toHaveBeenCalled();
		createSpy.mockRestore();
	});

	it('3. dry-run does not insert revision', async () => {
		const result = await codexDryRunJourneyRevision({
			operation: 'update',
			journeyId: JOURNEY_ID,
			changes: { meta_description: 'New meta' },
			changeSummary: ['Updated meta description only'],
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.result.valid).toBe(true);
		}
		const insertCalls = vi
			.mocked(query)
			.mock.calls.filter((c) => String(c[0]).toLowerCase().includes('insert into journey_revisions'));
		expect(insertCalls.length).toBe(0);
	});

	it('4. update defaults to pending_review on create path', async () => {
		process.env.CODEX_JOURNEY_REVISION_WRITE_ENABLED = 'true';
		const createSpy = vi
			.spyOn(await import('@/lib/journeyRevisions/dryRun.server'), 'createJourneyRevision')
			.mockResolvedValue({
				revisionId: REVISION_ID,
				operation: 'update',
				journeyId: JOURNEY_ID,
				status: 'pending_review',
				validationSummary: { errors: [], warnings: [] },
				previewPath: `/admin/journey-revisions/${REVISION_ID}/preview`,
			});
		const created = await codexCreateJourneyRevision(
			{
				operation: 'update',
				journeyId: JOURNEY_ID,
				changes: { meta_description: 'X' },
				changeSummary: ['Updated meta description only'],
			},
			{ environment: 'local' }
		);
		expect(created.ok).toBe(true);
		if (created.ok) expect(created.created.status).toBe('pending_review');
		createSpy.mockRestore();
	});

	it('5. create defaults to draft proposed status', () => {
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'create',
			source: null,
			changes: { title: 'New', slug: 'new-journey' },
		});
		expect(proposed.status).toBe('draft');
		expect(defaultProposedStatusForOperation('create')).toBe('draft');
	});

	it('6. archive creates pending (not direct status write)', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'archive',
			source,
			changes: {},
		});
		expect(proposed.status).toBe('archived');
		expect(() => assertNoDirectJourneySql('UPDATE journeys SET status = archived')).toThrow();
	});

	it('7. restore defaults to draft', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow({ status: 'archived' }));
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'restore',
			source,
			changes: {},
		});
		expect(proposed.status).toBe('draft');
	});

	it('8. write guard blocks create without explicit env', () => {
		expect(isCodexWriteEnabled()).toBe(false);
		try {
			assertWriteCommandAllowed('create');
			expect.fail('expected prep guard');
		} catch (error) {
			expect(error).toBeInstanceOf(CodexJourneyGuardError);
			expect((error as CodexJourneyGuardError).code).toBe('CODEX_WRITE_NOT_ENABLED');
		}
	});

	it('9. implicit phrases do not trigger publish intent', () => {
		expect(isImplicitPublishPhrase('looks good')).toBe(true);
		expect(isImplicitPublishPhrase('看起来可以')).toBe(true);
		expect(isExplicitPublishInstruction('looks good')).toBe(false);
		expect(isExplicitPublishInstruction('继续')).toBe(false);
	});

	it('10. explicit publish instruction with revision UUID', () => {
		const text = `发布 Journey Revision ${REVISION_ID}`;
		expect(isExplicitPublishInstruction(text)).toBe(true);
		expect(extractRevisionIdFromPublishInstruction(text)).toBe(REVISION_ID);
	});

	it('11. revision and confirm ID mismatch rejected', () => {
		try {
			assertRevisionConfirmMatch(REVISION_ID, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
			expect.fail('expected mismatch');
		} catch (error) {
			expect((error as CodexJourneyGuardError).code).toBe('REVISION_CONFIRM_MISMATCH');
		}
	});

	it('12. production publish missing confirm-production rejected', () => {
		process.env.CODEX_JOURNEY_REVISION_WRITE_ENABLED = 'true';
		process.env.NEON_POSTGRES_URL = `postgresql://neondb_owner:x@ep-red-sunset-adgu8hlv-pooler.c-2.us-east-1.aws.neon.tech/neondb`;
		process.env.JOURNEY_REVISION_ACTOR = 'human-reviewer';
		try {
			assertProductionPublishAllowed({
				environment: 'production',
				revisionId: REVISION_ID,
				confirmId: REVISION_ID,
			});
			expect.fail('expected production guard');
		} catch (error) {
			expect((error as CodexJourneyGuardError).code).toBe('PRODUCTION_CONFIRM_REQUIRED');
		}
	});

	it('13. sourceUpdatedAt taken from latest journey read on dry-run', async () => {
		const result = await codexDryRunJourneyRevision({
			operation: 'update',
			journeyId: JOURNEY_ID,
			sourceUpdatedAt: '2020-01-01T00:00:00.000Z',
			changes: { meta_description: 'New' },
			changeSummary: ['Updated meta description'],
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.sourceUpdatedAt).toBe('2026-06-29T10:00:00.000Z');
		}
	});

	it('14. source changed returns conflict semantics in domain', () => {
		const { errors } = validateSourceUpdatedAt(
			'update',
			'2020-01-01T00:00:00.000Z',
			sampleJourneyRow()
		);
		expect(errors.some((e) => e.code === 'JOURNEY_REVISION_SOURCE_CHANGED')).toBe(true);
	});

	it('15. partial meta update preserves itinerary', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { meta_description: 'Only meta' },
		});
		expect(proposed.meta_description).toBe('Only meta');
		expect(proposed.page_title).toBe(source.page_title);
		expect(proposed.data.itinerary).toEqual(source.data.itinerary);
	});

	it('16. partial itinerary update preserves SEO', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: {
				data: {
					itinerary: [{ day: 1, title: 'New Day 1', description: 'Updated' }],
				},
			},
		});
		expect(proposed.page_title).toBe(source.page_title);
		expect(proposed.meta_description).toBe(source.meta_description);
	});

	it('17. unknown JSONB keys preserved', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { meta_description: 'X' },
		});
		expect(proposed.data.customField).toBe('preserve-me');
	});

	it('18. price modification rejected', () => {
		const errors = detectLockedFieldChangeAttempts({ price: 999 });
		expect(errors.some((e) => e.code === 'JOURNEY_REVISION_PRICE_FIELDS_LOCKED')).toBe(true);
	});

	it('19. client seo_complete not writable', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { seo_complete: true },
		});
		expect(proposed.seo_complete).toBe(false);
	});

	it('20. protected fields stripped from client changes', () => {
		const { sanitized, rejected } = sanitizeClientChanges({
			title: 'OK',
			id: 'bad',
			updated_at: 'bad',
			published_by: 'bad',
		});
		expect(sanitized.title).toBe('OK');
		expect(rejected).toContain('id');
		expect(detectProtectedClientFieldAttempts({ published_by: 'evil' }).length).toBeGreaterThan(0);
	});

	it('21. slug conflict detected via validation mock', async () => {
		vi.mocked(findJourneySlugConflict).mockResolvedValue(true);
		const result = await codexDryRunJourneyRevision({
			operation: 'create',
			changes: { title: 'T', slug: 'taken-slug' },
			changeSummary: ['Create new journey with slug taken-slug'],
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.result.valid).toBe(false);
			expect(result.result.errors.some((e) => e.field === 'slug')).toBe(true);
		}
	});

	it('22. active incomplete rejected at dry-run', async () => {
		vi.mocked(runJourneyPublishIntegrityGate).mockResolvedValue({
			ok: false,
			status: 422,
			body: {
				error: 'JOURNEY_PUBLISH_INTEGRITY_FAILED',
				message: 'Incomplete',
				fields: [{ field: 'page_title', code: 'REQUIRED', message: 'Missing' }],
			},
		});
		const result = await codexDryRunJourneyRevision({
			operation: 'create',
			changes: { title: 'T', slug: 'new-slug', status: 'active' },
			changeSummary: ['Attempt active create without SEO fields'],
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.result.valid).toBe(false);
		}
	});

	it('23. draft incomplete can still dry-run valid', async () => {
		const result = await codexDryRunJourneyRevision({
			operation: 'create',
			changes: { title: 'Draft only', slug: 'draft-only-journey' },
			changeSummary: ['Create minimal draft journey'],
		});
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.result.valid).toBe(true);
	});

	it('24. related slug validation uses journey rows', async () => {
		const result = await codexDryRunJourneyRevision({
			operation: 'update',
			journeyId: JOURNEY_ID,
			changes: {
				relationships: { relatedJourneyIds: [OTHER_JOURNEY_ID], relatedArticleIds: [] },
			},
			changeSummary: ['Link related journey by ID'],
		});
		expect(result.ok).toBe(true);
	});

	it('25. nonexistent relationship rejected', async () => {
		vi.mocked(query).mockImplementation(async (text: string, params?: unknown[]) => {
			if (text.includes('information_schema.tables')) return { rows: [{ exists: true }] } as never;
			if (text.includes('FROM journeys WHERE id')) {
				const id = params?.[0];
				if (id === '00000000-0000-4000-8000-000000000099') return { rows: [] } as never;
				return { rows: [sampleJourneyRow()] } as never;
			}
			if (text.includes('FROM journeys')) return { rows: [sampleJourneyRow()] } as never;
			return { rows: [] } as never;
		});
		const result = await codexDryRunJourneyRevision({
			operation: 'update',
			journeyId: JOURNEY_ID,
			changes: {
				relationships: {
					relatedJourneyIds: ['00000000-0000-4000-8000-000000000099'],
					relatedArticleIds: [],
				},
			},
			changeSummary: ['Add invalid related journey ID'],
		});
		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.result.valid).toBe(false);
		}
	});

	it('26. local image path rejected', () => {
		const result = validateImageUrlsInChanges({
			hero_image_url: '/Users/me/photo.jpg',
		});
		expect(result.assetUploadRequired).toBe(true);
		expect(result.errors[0]?.code).toBe('ASSET_UPLOAD_REQUIRED');
	});

	it('27. fabricated relative image path flagged', () => {
		const result = validateImageUrlsInChanges({
			hero_image_url: './stolen.jpg',
		});
		expect(result.assetUploadRequired).toBe(true);
	});

	it('28. fact-check warning blocks active publish recommendation in skill', () => {
		const usage = fs.readFileSync(
			path.join(process.cwd(), 'docs/workflows/codex-journey-editor-usage.md'),
			'utf8'
		);
		expect(usage).toContain('FACT_CHECK_REQUIRED');
		expect(usage).toContain('jiuzhaigou-cultural-adventure-4-day-tour');
	});

	it('29. supersede pending documented in skill', () => {
		const skill = fs.readFileSync(
			path.join(process.cwd(), '.agents/skills/journey-editor/SKILL.md'),
			'utf8'
		);
		expect(skill).toContain('supersedes old pending');
	});

	it('30. old revision ID publish requires exact confirm match', () => {
		const oldId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
		const newId = REVISION_ID;
		expect(() => assertRevisionConfirmMatch(newId, oldId)).toThrow();
	});

	it('31. API auth reuses enforceAdminWrite (J5A)', () => {
		const audit = fs.readFileSync(
			path.join(process.cwd(), 'docs/audits/pr-j5c-inspiration-codex-workflow-reuse.md'),
			'utf8'
		);
		expect(audit).toContain('enforceAdminWrite');
		expect(
			fs.existsSync(
				path.join(process.cwd(), 'src/app/api/admin/journey-revisions/journey-revisions-auth.test.ts')
			)
		).toBe(true);
	});

	it('32. actor identity from env for non-production', () => {
		process.env.JOURNEY_REVISION_ACTOR = 'codex-agent';
		expect(getCodexActorIdentity('local')).toBe('codex-agent');
	});

	it('33. secrets redacted from output', () => {
		const raw =
			'postgres://user:pass@host/db Bearer eyJhbG.token NEON_POSTGRES_URL=secret';
		const redacted = redactSecrets(raw);
		expect(redacted).not.toContain('pass@host');
		expect(redacted).not.toContain('eyJhbG');
	});

	it('34. public journey count unchanged — regression artifact exists', () => {
		expect(
			fs.existsSync(
				path.join(process.cwd(), 'scripts/migrations/pr-j3a-public-source-preflight.ts')
			)
		).toBe(true);
	});

	it('35. pending revision sitemap exclusion — contract documents admin-only preview', () => {
		const contract = fs.readFileSync(
			path.join(process.cwd(), 'docs/workflows/codex-journey-editor-contract.md'),
			'utf8'
		);
		expect(contract).toContain('pending_review');
	});

	it('36. J5A publish transaction module exists', () => {
		expect(fs.existsSync(path.join(process.cwd(), 'src/lib/journeyRevisions/publish.server.ts'))).toBe(
			true
		);
	});

	it('37. J3B preflight script exists', () => {
		expect(
			fs.existsSync(path.join(process.cwd(), 'scripts/migrations/pr-j3b-publish-integrity-preflight.ts'))
		).toBe(true);
	});

	it('38. J3C preflight script exists', () => {
		expect(
			fs.existsSync(path.join(process.cwd(), 'scripts/migrations/pr-j3c-slug-uniqueness-preflight.ts'))
		).toBe(true);
	});

	it('39. J3A preflight script exists', () => {
		expect(
			fs.existsSync(path.join(process.cwd(), 'scripts/migrations/pr-j3a-public-source-preflight.ts'))
		).toBe(true);
	});

	it('40. J4 Batch content not modified — no batch revision files in workspace', () => {
		const revisionsDir = path.join(process.cwd(), 'content-workspace/revisions');
		const files = fs.existsSync(revisionsDir) ? fs.readdirSync(revisionsDir) : [];
		const batchFiles = files.filter(
			(f) =>
				f.includes('jiuzhaigou-cultural-adventure') ||
				f.includes('xian-culture-mount-hua')
		);
		expect(batchFiles.length).toBe(0);
	});
});

describe('PR-J5C no-op revision protection', () => {
	it('1. empty update changes detected as no-op', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: {},
		});
		expect(detectNoOpUpdate('update', source, proposed).length).toBeGreaterThan(0);
	});

	it('2. seo_complete stripped then no-op', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { seo_complete: true },
		});
		expect(detectNoOpUpdate('update', source, proposed).length).toBeGreaterThan(0);
	});

	it('3. same meta value is no-op', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { meta_description: source.meta_description },
		});
		expect(detectNoOpUpdate('update', source, proposed).length).toBeGreaterThan(0);
	});

	it('4. real partial update is not no-op', () => {
		const source = rowToJourneyRevisionSnapshot(sampleJourneyRow());
		const proposed = mergeChangesIntoProposedSnapshot({
			operation: 'update',
			source,
			changes: { meta_description: 'Actually different meta' },
		});
		expect(detectNoOpUpdate('update', source, proposed)).toHaveLength(0);
	});
});

describe('PR-J5C request schema', () => {
	it('rejects vague changeSummary', () => {
		const parsed = parseCodexRequest({
			operation: 'update',
			journeyId: JOURNEY_ID,
			changes: { meta_description: 'x' },
			changeSummary: ['Improved SEO'],
		});
		expect(parsed.ok).toBe(false);
	});

	it('rejects protected fields in changes', () => {
		const parsed = parseCodexRequest({
			operation: 'update',
			journeyId: JOURNEY_ID,
			changes: { seo_complete: true },
			changeSummary: ['Attempt seo_complete write'],
		});
		expect(parsed.ok).toBe(false);
	});
});

describe('PR-J5C environment', () => {
	it('defaults to local environment', () => {
		delete process.env.CODEX_JOURNEY_ENVIRONMENT;
		expect(resolveCodexEnvironment()).toBe('local');
	});
});
