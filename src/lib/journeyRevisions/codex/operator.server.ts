/**
 * Codex Journey revision operator — server-only.
 * Must only call Journey Revision domain services (dryRun / publish), never direct journeys writes.
 */
import {
	createJourneyRevision,
	dryRunJourneyRevision,
	getJourneyRevisionDetail,
	rejectJourneyRevision,
} from '../dryRun.server';
import { findJourneyRowByNormalizedSlug, getJourneyRowById } from '../repository.server';
import { rowToJourneyRevisionSnapshot } from '../snapshot';
import type { JourneyRevisionDryRunRequest } from '../types';
import type { CodexJourneyEnvironment } from './environment';
import { assertCodexWriteAllowed, assertNoDirectJourneySql } from './guards';
import { validateImageUrlsInChanges } from './imageRules';
import { parseCodexRequest, type CodexJourneyRevisionRequest } from './requestSchema';

export type CodexJourneyReadResult = {
	id: string;
	slug: string;
	status: string;
	updatedAt: string | null;
	snapshot: ReturnType<typeof rowToJourneyRevisionSnapshot>;
};

export type CodexWriteOptions = {
	environment: CodexJourneyEnvironment;
	confirmProduction?: boolean;
	revisionId?: string;
	confirmId?: string;
};

export async function readJourneyBySlug(slug: string): Promise<CodexJourneyReadResult | null> {
	const row = await findJourneyRowByNormalizedSlug(slug);
	if (!row) return null;
	return mapJourneyRead(row);
}

export async function readJourneyById(id: string): Promise<CodexJourneyReadResult | null> {
	const row = await getJourneyRowById(id);
	if (!row) return null;
	return mapJourneyRead(row);
}

function mapJourneyRead(row: Record<string, unknown>): CodexJourneyReadResult {
	const snapshot = rowToJourneyRevisionSnapshot(row);
	return {
		id: String(row.id),
		slug: String(row.slug),
		status: String(row.status),
		updatedAt: snapshot.updated_at,
		snapshot,
	};
}

function toDryRunRequest(
	request: CodexJourneyRevisionRequest,
	journeyId?: string,
	sourceUpdatedAt?: string | null
): JourneyRevisionDryRunRequest {
	return {
		operation: request.operation,
		journeyId,
		sourceUpdatedAt: sourceUpdatedAt ?? undefined,
		changes: request.changes ?? {},
		reviewMetadata: {
			changeSummary: request.changeSummary ?? request.reviewMetadata?.changeSummary,
			factCheckItems: request.reviewMetadata?.factCheckItems,
		},
	};
}

export async function codexDryRunJourneyRevision(request: CodexJourneyRevisionRequest | unknown) {
	const parsed = parseCodexRequest(request);
	if (!parsed.ok) {
		return { ok: false as const, errors: parsed.errors };
	}

	const imageCheck = validateImageUrlsInChanges(parsed.request.changes ?? {});
	if (imageCheck.errors.length > 0) {
		return { ok: false as const, errors: imageCheck.errors.map((e) => e.message) };
	}

	let journeyId = parsed.request.journeyId;
	let sourceUpdatedAt = parsed.request.sourceUpdatedAt ?? null;

	if (parsed.request.operation !== 'create') {
		if (!journeyId) {
			return { ok: false as const, errors: ['journeyId is required for non-create operations.'] };
		}
		const journey = await readJourneyById(journeyId);
		if (!journey) return { ok: false as const, errors: ['Journey not found.'] };
		sourceUpdatedAt = journey.updatedAt;
	}

	const result = await dryRunJourneyRevision(
		toDryRunRequest(parsed.request, journeyId, sourceUpdatedAt ?? undefined)
	);
	return { ok: true as const, request: parsed.request, result, sourceUpdatedAt };
}

export async function codexCreateJourneyRevision(
	request: CodexJourneyRevisionRequest | unknown,
	options: CodexWriteOptions
) {
	const actor = assertCodexWriteAllowed({
		command: 'create',
		environment: options.environment,
		confirmProduction: options.confirmProduction,
	});

	const dry = await codexDryRunJourneyRevision(request);
	if (!dry.ok) return dry;
	if (!dry.result.valid) {
		return {
			ok: false as const,
			errors: dry.result.errors.map((e) => `${e.field}: ${e.message}`),
		};
	}

	const created = await createJourneyRevision({
		request: toDryRunRequest(
			dry.request,
			dry.result.journeyId ?? dry.request.journeyId,
			dry.sourceUpdatedAt ?? dry.request.sourceUpdatedAt
		),
		createdBy: actor,
	});

	return { ok: true as const, created, dryRun: dry.result, actor };
}

export async function codexGetJourneyRevision(revisionId: string) {
	return getJourneyRevisionDetail(revisionId);
}

export async function codexPublishJourneyRevision(input: CodexWriteOptions & {
	revisionId: string;
	confirmId: string;
}) {
	const actor = assertCodexWriteAllowed({
		command: 'publish',
		environment: input.environment,
		confirmProduction: input.confirmProduction,
		revisionId: input.revisionId,
		confirmId: input.confirmId,
	});
	const { publishJourneyRevision } = await import('../publish.server');
	const detail = await publishJourneyRevision({
		revisionId: input.revisionId,
		publishedBy: actor,
	});
	return { ...detail, actor };
}

export async function codexRejectJourneyRevision(input: CodexWriteOptions & {
	revisionId: string;
	confirmId: string;
	reason?: string;
}) {
	const actor = assertCodexWriteAllowed({
		command: 'reject',
		environment: input.environment,
		confirmProduction: input.confirmProduction,
		revisionId: input.revisionId,
		confirmId: input.confirmId,
	});
	const detail = await rejectJourneyRevision({
		id: input.revisionId,
		reason: input.reason ?? `Rejected by ${actor}`,
	});
	return { ...detail, actor };
}

/** Guard helper for tests and CLI — Codex must never issue direct journey SQL. */
export function rejectDirectJourneySql(sql: string): void {
	assertNoDirectJourneySql(sql);
}
