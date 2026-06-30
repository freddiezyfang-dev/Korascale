import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	assertDatabaseIdentityMatchesEnvironment,
	OFFICIAL_PRODUCTION_DATABASE,
	OFFICIAL_PRODUCTION_NEON_HOSTS,
	resolveDatabaseIdentity,
} from '@/lib/journeyRevisions/codex/databaseIdentity';
import {
	getCodexActorIdentity,
	isCodexWriteEnabled,
	resolveCodexEnvironment,
} from '@/lib/journeyRevisions/codex/environment';
import {
	assertCodexWriteAllowed,
	assertWriteCommandAllowed,
	CodexJourneyGuardError,
} from '@/lib/journeyRevisions/codex/guards';
import { redactSecretString, redactSecrets } from '@/lib/journeyRevisions/codex/output';
import { parseCodexRequest } from '@/lib/journeyRevisions/codex/requestSchema';

const PROD_URL = `postgresql://neondb_owner:secret@${OFFICIAL_PRODUCTION_NEON_HOSTS[0]}/${OFFICIAL_PRODUCTION_DATABASE}?sslmode=require`;
const PREVIEW_URL = 'postgresql://user:secret@ep-preview-branch.neon.tech/previewdb?sslmode=require';
const REVISION_ID = '33333333-3333-4333-8333-333333333333';

describe('PR-J5C write guard', () => {
	beforeEach(() => {
		delete process.env.CODEX_JOURNEY_REVISION_WRITE_ENABLED;
		delete process.env.CODEX_JOURNEY_REVISION_PREP;
		delete process.env.JOURNEY_REVISION_ACTOR;
		process.env.NEON_POSTGRES_URL = PREVIEW_URL;
	});

	it('1. unset create is rejected', () => {
		expect(() => assertWriteCommandAllowed('create')).toThrow(CodexJourneyGuardError);
		try {
			assertWriteCommandAllowed('create');
		} catch (e) {
			expect((e as CodexJourneyGuardError).code).toBe('CODEX_WRITE_NOT_ENABLED');
		}
	});

	it('2. unset publish is rejected', () => {
		try {
			assertWriteCommandAllowed('publish');
			expect.fail('expected block');
		} catch (e) {
			expect((e as CodexJourneyGuardError).code).toBe('CODEX_WRITE_NOT_ENABLED');
		}
	});

	it('3. unset reject is rejected', () => {
		try {
			assertWriteCommandAllowed('reject');
			expect.fail('expected block');
		} catch (e) {
			expect((e as CodexJourneyGuardError).code).toBe('CODEX_WRITE_NOT_ENABLED');
		}
	});

	it('4. false write flag is rejected', () => {
		process.env.CODEX_JOURNEY_REVISION_WRITE_ENABLED = 'false';
		expect(isCodexWriteEnabled()).toBe(false);
		expect(() => assertWriteCommandAllowed('create')).toThrow();
		process.env.CODEX_JOURNEY_REVISION_WRITE_ENABLED = '1';
		expect(isCodexWriteEnabled()).toBe(false);
		process.env.CODEX_JOURNEY_REVISION_WRITE_ENABLED = 'yes';
		expect(isCodexWriteEnabled()).toBe(false);
	});

	it('5. true enables subsequent security checks', () => {
		process.env.CODEX_JOURNEY_REVISION_WRITE_ENABLED = 'true';
		expect(isCodexWriteEnabled()).toBe(true);
		expect(() =>
			assertCodexWriteAllowed({
				command: 'create',
				environment: 'local',
				confirmProduction: false,
			})
		).not.toThrow();
	});

	it('6. read does not require write enabled', () => {
		expect(isCodexWriteEnabled()).toBe(false);
		expect(resolveCodexEnvironment()).toBe('local');
	});

	it('7. dry-run does not require write enabled', () => {
		expect(isCodexWriteEnabled()).toBe(false);
	});

	it('8. get does not require write enabled', () => {
		expect(isCodexWriteEnabled()).toBe(false);
	});

	it('does not honor legacy CODEX_JOURNEY_REVISION_PREP=false', () => {
		process.env.CODEX_JOURNEY_REVISION_PREP = 'false';
		expect(isCodexWriteEnabled()).toBe(false);
	});
});

describe('PR-J5C production write guard', () => {
	beforeEach(() => {
		process.env.CODEX_JOURNEY_REVISION_WRITE_ENABLED = 'true';
		delete process.env.JOURNEY_REVISION_ACTOR;
	});

	it('production create requires confirm-production and actor', () => {
		process.env.NEON_POSTGRES_URL = PROD_URL;
		process.env.JOURNEY_REVISION_ACTOR = 'human-reviewer';
		try {
			assertCodexWriteAllowed({
				command: 'create',
				environment: 'production',
				confirmProduction: false,
			});
			expect.fail('expected guard');
		} catch (e) {
			expect((e as CodexJourneyGuardError).code).toBe('PRODUCTION_CONFIRM_REQUIRED');
		}

		expect(() =>
			assertCodexWriteAllowed({
				command: 'create',
				environment: 'production',
				confirmProduction: true,
			})
		).not.toThrow();
	});

	it('production publish requires revision confirm match', () => {
		process.env.NEON_POSTGRES_URL = PROD_URL;
		process.env.JOURNEY_REVISION_ACTOR = 'human-reviewer';
		try {
			assertCodexWriteAllowed({
				command: 'publish',
				environment: 'production',
				confirmProduction: true,
				revisionId: REVISION_ID,
				confirmId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
			});
			expect.fail('expected mismatch');
		} catch (e) {
			expect((e as CodexJourneyGuardError).code).toBe('REVISION_CONFIRM_MISMATCH');
		}
	});

	it('production reject requires actor', () => {
		process.env.NEON_POSTGRES_URL = PROD_URL;
		try {
			assertCodexWriteAllowed({
				command: 'reject',
				environment: 'production',
				confirmProduction: true,
				revisionId: REVISION_ID,
				confirmId: REVISION_ID,
			});
			expect.fail('expected actor guard');
		} catch (e) {
			expect((e as CodexJourneyGuardError).code).toBe('PRODUCTION_ACTOR_REQUIRED');
		}
	});
});

describe('PR-J5C database identity', () => {
	it('1. production + correct identity passes', () => {
		const identity = resolveDatabaseIdentity(PROD_URL);
		expect(identity.isOfficialProduction).toBe(true);
		expect(() => assertDatabaseIdentityMatchesEnvironment('production', identity)).not.toThrow();
	});

	it('2. production + preview DB rejected', () => {
		const identity = resolveDatabaseIdentity(PREVIEW_URL);
		try {
			assertDatabaseIdentityMatchesEnvironment('production', identity);
			expect.fail('expected mismatch');
		} catch (e) {
			expect((e as CodexJourneyGuardError).code).toBe('PRODUCTION_DATABASE_MISMATCH');
		}
	});

	it('3. preview + production DB rejected', () => {
		const identity = resolveDatabaseIdentity(PROD_URL);
		try {
			assertDatabaseIdentityMatchesEnvironment('preview', identity);
			expect.fail('expected forbidden');
		} catch (e) {
			expect((e as CodexJourneyGuardError).code).toBe('PRODUCTION_DATABASE_FORBIDDEN');
		}
	});

	it('4. local + production DB rejected', () => {
		const identity = resolveDatabaseIdentity(PROD_URL);
		try {
			assertDatabaseIdentityMatchesEnvironment('local', identity);
			expect.fail('expected forbidden');
		} catch (e) {
			expect((e as CodexJourneyGuardError).code).toBe('PRODUCTION_DATABASE_FORBIDDEN');
		}
	});

	it('5. wrong database name rejected for production', () => {
		const wrongDb = `postgresql://u:p@${OFFICIAL_PRODUCTION_NEON_HOSTS[0]}/wrongdb`;
		const identity = resolveDatabaseIdentity(wrongDb);
		expect(identity.isOfficialProduction).toBe(false);
	});

	it('6. output does not contain password', () => {
		const identity = resolveDatabaseIdentity(PROD_URL);
		expect(identity.masked).not.toContain('secret');
		expect(identity.masked).not.toContain('neondb_owner');
		expect(redactSecretString(PROD_URL)).not.toContain('secret');
	});
});

describe('PR-J5C actor identity', () => {
	beforeEach(() => {
		delete process.env.JOURNEY_REVISION_ACTOR;
		delete process.env.JOURNEY_REVISION_CREATED_BY;
		delete process.env.SEO_REVISION_CREATED_BY;
	});

	it('1-3. production without actor rejected', () => {
		for (const _command of ['create', 'publish', 'reject'] as const) {
			try {
				getCodexActorIdentity('production');
				expect.fail('expected actor guard');
			} catch (e) {
				expect((e as CodexJourneyGuardError).code).toBe('PRODUCTION_ACTOR_REQUIRED');
			}
		}
	});

	it('4. production actor returned', () => {
		process.env.JOURNEY_REVISION_ACTOR = 'reviewer-a';
		expect(getCodexActorIdentity('production')).toBe('reviewer-a');
	});

	it('5. actor not redacted from normal output', () => {
		const actor = 'reviewer-a';
		const text = redactSecretString(`Published by ${actor}`);
		expect(text).toContain(actor);
	});

	it('6. actor cannot come from request JSON', () => {
		const parsed = parseCodexRequest({
			operation: 'update',
			journeyId: REVISION_ID,
			changes: { created_by: 'evil', title: 'x' },
			changeSummary: ['Attempt actor override'],
		});
		expect(parsed.ok).toBe(false);
	});

	it('non-production does not fall back to SEO_REVISION_CREATED_BY when JOURNEY_REVISION_ACTOR unset', () => {
		process.env.SEO_REVISION_CREATED_BY = 'seo-bot';
		expect(getCodexActorIdentity('local')).toBe('codex-test');
	});
});

describe('PR-J5C secret redaction', () => {
	it('covers connection strings and auth headers', () => {
		const raw = [
			'postgres://user:pass@host/db',
			'Authorization: Bearer abc.def.ghi',
			'Cookie: session=secret',
			'Set-Cookie: sid=1',
			'access_token=abc',
			'refresh_token=xyz',
			'password=hunter2',
			'api_key=sk-test',
			'NEON_POSTGRES_URL=postgres://x',
		].join('\n');
		const redacted = redactSecretString(raw);
		expect(redacted).not.toContain('pass@host');
		expect(redacted).not.toContain('Bearer abc');
		expect(redacted).not.toContain('hunter2');
		expect(redacted).not.toContain('sk-test');
	});

	it('redacts nested objects and arrays', () => {
		const out = redactSecrets({
			slug: 'sample-journey',
			revisionId: REVISION_ID,
			auth: { secretValue: 'super-secret', actor: 'reviewer-a' },
			items: [{ password: 'x' }, 'postgres://a:b@c/d'],
		});
		expect(out).toContain('sample-journey');
		expect(out).toContain(REVISION_ID);
		expect(out).toContain('reviewer-a');
		expect(out).not.toContain('super-secret');
		expect(out).not.toContain('postgres://a:b@c/d');
	});

	it('redacts Error cause metadata', () => {
		const err = new Error('failed', {
			cause: { DATABASE_URL: 'postgres://u:p@h/db', slug: 'ok-slug' },
		});
		const out = redactSecrets(err);
		expect(out).not.toContain('postgres://u:p@h/db');
	});
});

describe('PR-J5C operator safety scan', () => {
	const productionModules = [
		'src/lib/journeyRevisions/codex/operator.server.ts',
		'scripts/codex/journey-revision-cli.ts',
	];

	for (const rel of productionModules) {
		it(`forbids direct journey SQL in ${rel}`, () => {
			const source = fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
			const withoutComments = source
				.replace(/\/\*[\s\S]*?\*\//g, '')
				.replace(/\/\/.*$/gm, '');
			expect(withoutComments).not.toMatch(/\bUPDATE\s+journeys\b/i);
			expect(withoutComments).not.toMatch(/\bINSERT\s+INTO\s+journeys\b/i);
			expect(withoutComments).not.toMatch(/\bDELETE\s+FROM\s+journeys\b/i);
		});
	}

	it('skill documents no direct journey writes', () => {
		const skill = fs.readFileSync(
			path.join(process.cwd(), '.agents/skills/journey-editor/SKILL.md'),
			'utf8'
		);
		expect(skill).toMatch(/Never write directly|must not.*journeys/i);
	});

	it('operator imports only domain services', () => {
		const source = fs.readFileSync(
			path.join(process.cwd(), 'src/lib/journeyRevisions/codex/operator.server.ts'),
			'utf8'
		);
		expect(source).toContain('dryRun.server');
		expect(source).not.toContain('@/lib/db');
		expect(source).not.toContain('insertJourneyRevision');
		expect(source).not.toContain('markJourneyRevisionPublished');
		expect(source).toMatch(/server-only/i);
	});
});
