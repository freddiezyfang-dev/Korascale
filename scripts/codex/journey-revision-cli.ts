#!/usr/bin/env node
import fs from 'node:fs/promises';

import { resolveDatabaseIdentity } from '../../src/lib/journeyRevisions/codex/databaseIdentity';
import {
	formatCreateRevisionOutput,
	formatDryRunOutput,
	formatPublishOutput,
	redactSecrets,
} from '../../src/lib/journeyRevisions/codex/output';
import {
	resolveCodexEnvironment,
	getApiBaseUrl,
	isCodexWriteEnabled,
} from '../../src/lib/journeyRevisions/codex/environment';
import {
	codexCreateJourneyRevision,
	codexDryRunJourneyRevision,
	codexGetJourneyRevision,
	codexPublishJourneyRevision,
	codexRejectJourneyRevision,
	readJourneyById,
	readJourneyBySlug,
} from '../../src/lib/journeyRevisions/codex/operator.server';
import { assertRevisionConfirmMatch } from '../../src/lib/journeyRevisions/codex/guards';
import { loadLocalEnv, parseArgs, requireDatabaseEnv } from './loadEnv';

loadLocalEnv();

async function readRequestJson(value: string): Promise<unknown> {
	if (value.startsWith('{')) return JSON.parse(value) as unknown;
	const raw = await fs.readFile(value, 'utf8');
	return JSON.parse(raw) as unknown;
}

function usage(): void {
	console.error(`Usage:
  npm run journey:revision -- read --slug <slug>
  npm run journey:revision -- read --id <journey-id>
  npm run journey:revision -- dry-run --request <json-or-file>
  npm run journey:revision -- create --request <json-or-file> [--environment local|preview|production] [--confirm-production]
  npm run journey:revision -- get --revision <revision-id>
  npm run journey:revision -- publish --revision <id> --confirm <same-id> --environment production --confirm-production
  npm run journey:revision -- reject --revision <id> --confirm <same-id> [--environment production] [--confirm-production]

Write commands require CODEX_JOURNEY_REVISION_WRITE_ENABLED=true.
Production write commands require --environment production --confirm-production and JOURNEY_REVISION_ACTOR.
Publish always writes normalized columns authoritatively (no JOURNEY_NORMALIZATION_COLUMNS required).`);
}

async function main() {
	const { command, flags } = parseArgs(process.argv.slice(2));
	if (!command) {
		usage();
		process.exit(1);
	}

	const environment = resolveCodexEnvironment(
		typeof flags.environment === 'string' ? flags.environment : undefined
	);
	const confirmProduction = flags['confirm-production'] === true;

	if (command === 'read') {
		requireDatabaseEnv();
		const slug = typeof flags.slug === 'string' ? flags.slug : '';
		const id = typeof flags.id === 'string' ? flags.id : '';
		const journey = slug ? await readJourneyBySlug(slug) : id ? await readJourneyById(id) : null;
		if (!journey) {
			console.error('Journey not found.');
			process.exit(1);
		}
		const identity = resolveDatabaseIdentity();
		console.log(
			redactSecrets(
				JSON.stringify(
					{
						databaseIdentity: identity.masked,
						journeyId: journey.id,
						slug: journey.slug,
						status: journey.status,
						updatedAt: journey.updatedAt,
						snapshot: journey.snapshot,
					},
					null,
					2
				)
			)
		);
		return;
	}

	if (command === 'dry-run') {
		requireDatabaseEnv();
		const requestPath = typeof flags.request === 'string' ? flags.request : '';
		if (!requestPath) {
			console.error('dry-run requires --request <json-or-file>');
			process.exit(1);
		}
		const request = await readRequestJson(requestPath);
		const result = await codexDryRunJourneyRevision(request);
		if (!result.ok) {
			console.error(result.errors.join('\n'));
			process.exit(1);
		}
		const label = result.result.journeyId ?? '(new journey)';
		console.log(
			formatDryRunOutput({
				journeyLabel: label,
				operation: result.result.operation,
				sourceUpdatedAt: result.sourceUpdatedAt,
				result: result.result,
				contentPreserved: ['unchanged fields merged server-side'],
			})
		);
		return;
	}

	if (command === 'create') {
		requireDatabaseEnv();
		if (!isCodexWriteEnabled()) {
			console.error(
				'create blocked: set CODEX_JOURNEY_REVISION_WRITE_ENABLED=true in authorized environments.'
			);
			process.exit(1);
		}
		const requestPath = typeof flags.request === 'string' ? flags.request : '';
		if (!requestPath) {
			console.error('create requires --request <json-or-file>');
			process.exit(1);
		}
		const request = await readRequestJson(requestPath);
		const result = await codexCreateJourneyRevision(request, {
			environment,
			confirmProduction,
		});
		if (!result.ok) {
			console.error('errors' in result ? result.errors.join('\n') : 'Create failed.');
			process.exit(1);
		}
		const baseUrl = getApiBaseUrl();
		const previewUrl = `${baseUrl}${result.created.previewPath}`;
		console.log(
			formatCreateRevisionOutput({
				journeyLabel: result.created.journeyId ?? result.created.revisionId,
				operation: result.created.operation,
				revisionId: result.created.revisionId,
				status: result.created.status,
				sourceUpdatedAtMatched: result.dryRun.sourceUpdatedAtMatched,
				validation: result.dryRun.valid ? 'valid' : 'invalid',
				changeSummary: result.dryRun.changeSummary,
				factCheckItems: 0,
				previewUrl,
			})
		);
		return;
	}

	if (command === 'get') {
		requireDatabaseEnv();
		const revisionId = typeof flags.revision === 'string' ? flags.revision : '';
		if (!revisionId) {
			console.error('get requires --revision <revision-id>');
			process.exit(1);
		}
		const detail = await codexGetJourneyRevision(revisionId);
		if (!detail) {
			console.error('Revision not found.');
			process.exit(1);
		}
		const baseUrl = getApiBaseUrl();
		console.log(
			redactSecrets(
				JSON.stringify(
					{
						revisionId: detail.revision.id,
						status: detail.revision.status,
						operation: detail.revision.operation,
						journeyId: detail.revision.journeyId,
						proposedSlug: detail.revision.proposedSnapshot.slug,
						sourceUpdatedAt: detail.revision.sourceUpdatedAt,
						sourceTimestampMatches: detail.sourceTimestampMatches,
						changeSummary: detail.revision.changeSummary,
						validation: detail.revision.validationReport,
						allowedActions: detail.allowedActions,
						hasSourceConflict: detail.hasSourceConflict,
						sourceConflictMessage: detail.sourceConflictMessage,
						previewUrl: `${baseUrl}/admin/journey-revisions/${detail.revision.id}/preview`,
					},
					null,
					2
				)
			)
		);
		return;
	}

	if (command === 'publish') {
		requireDatabaseEnv();
		const revisionId = typeof flags.revision === 'string' ? flags.revision : '';
		const confirmId = typeof flags.confirm === 'string' ? flags.confirm : '';
		try {
			assertRevisionConfirmMatch(revisionId, confirmId);
		} catch (error) {
			console.error(redactSecrets(error instanceof Error ? error.message : String(error)));
			process.exit(1);
		}
		const detail = await codexGetJourneyRevision(revisionId);
		if (detail) {
			console.log(
				[
					`Revision ID: ${detail.revision.id}`,
					`Operation: ${detail.revision.operation}`,
					`Journey slug: ${detail.revision.proposedSnapshot.slug}`,
					`Revision status: ${detail.revision.status}`,
					`Validation: ${detail.revision.validationReport.errors.length === 0 ? 'valid' : 'has errors'}`,
					`databaseIdentity: ${resolveDatabaseIdentity().masked}`,
				].join('\n')
			);
		}
		const published = await codexPublishJourneyRevision({
			revisionId,
			confirmId,
			environment,
			confirmProduction,
		});
		const rev = published.revision;
		console.log(
			formatPublishOutput({
				revisionId: rev.id,
				journeyId: rev.journeyId,
				journeySlug: rev.proposedSnapshot.slug,
				operation: rev.operation,
				previousStatus: 'pending_review',
				newStatus: rev.status,
				publishedBy: rev.publishedBy ?? published.actor,
				publishedAt: rev.publishedAt ?? new Date().toISOString(),
				publicImpact:
					rev.proposedSnapshot.status === 'active'
						? 'Journey visible on public site when active'
						: 'No public listing change until active',
			})
		);
		return;
	}

	if (command === 'reject') {
		requireDatabaseEnv();
		const revisionId = typeof flags.revision === 'string' ? flags.revision : '';
		const confirmId = typeof flags.confirm === 'string' ? flags.confirm : revisionId;
		if (!revisionId) {
			console.error('reject requires --revision <revision-id>');
			process.exit(1);
		}
		const detail = await codexRejectJourneyRevision({
			revisionId,
			confirmId,
			environment,
			confirmProduction,
		});
		console.log(
			redactSecrets(
				JSON.stringify(
					{
						revisionId: detail.revision.id,
						status: detail.revision.status,
						allowedActions: detail.allowedActions,
						actor: detail.actor,
					},
					null,
					2
				)
			)
		);
		return;
	}

	usage();
	process.exit(1);
}

main().catch((error) => {
	console.error(redactSecrets(error instanceof Error ? error : String(error)));
	process.exit(1);
});
