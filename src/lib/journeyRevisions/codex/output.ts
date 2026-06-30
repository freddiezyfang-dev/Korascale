import type { JourneyRevisionDryRunResult } from '../types';
import type { CodexJourneyRevisionRequest } from './requestSchema';

export function formatDryRunOutput(input: {
	journeyLabel: string;
	operation: string;
	sourceUpdatedAt: string | null;
	result: JourneyRevisionDryRunResult;
	contentPreserved: string[];
}): string {
	const lines = [
		`Journey: ${input.journeyLabel}`,
		`Operation: ${input.operation}`,
		`Source updated_at: ${input.sourceUpdatedAt ?? '(none — create)'}`,
		`Dry-run valid: ${input.result.valid}`,
		`Errors: ${input.result.errors.length ? input.result.errors.map((e) => `${e.field}: ${e.message}`).join('; ') : '(none)'}`,
		`Warnings: ${input.result.warnings.length ? input.result.warnings.map((w) => w.message).join('; ') : '(none)'}`,
		`Fields changed: ${input.result.changeSummary.join(' | ') || '(none)'}`,
		`Content preserved: ${input.contentPreserved.join(', ') || '(baseline merge)'}`,
	];
	return lines.join('\n');
}

export function formatCreateRevisionOutput(input: {
	journeyLabel: string;
	operation: string;
	revisionId: string;
	status: string;
	sourceUpdatedAtMatched: boolean;
	validation: string;
	changeSummary: string[];
	factCheckItems: number;
	previewUrl: string;
}): string {
	return [
		`Journey: ${input.journeyLabel}`,
		`Operation: ${input.operation}`,
		`Revision ID: ${input.revisionId}`,
		`Revision status: ${input.status}`,
		`Source updated_at matched: ${input.sourceUpdatedAtMatched}`,
		`Validation: ${input.validation}`,
		`Change summary: ${input.changeSummary.join(' | ')}`,
		`Fact-check items: ${input.factCheckItems}`,
		`Preview URL: ${input.previewUrl}`,
		'Publish status: NOT PUBLISHED',
	].join('\n');
}

export function formatPublishOutput(input: {
	revisionId: string;
	journeyId: string | null;
	journeySlug: string;
	operation: string;
	previousStatus: string;
	newStatus: string;
	publishedBy: string;
	publishedAt: string;
	publicImpact: string;
}): string {
	return [
		`Revision ID: ${input.revisionId}`,
		`Journey ID: ${input.journeyId ?? '(new)'}`,
		`Journey slug: ${input.journeySlug}`,
		`Operation: ${input.operation}`,
		`Previous status: ${input.previousStatus}`,
		`New status: ${input.newStatus}`,
		`Published by: ${input.publishedBy}`,
		`Published at: ${input.publishedAt}`,
		`Public impact: ${input.publicImpact}`,
	].join('\n');
}

const SECRET_KEY_PATTERN =
	/(password|secret|token|cookie|authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|database[_-]?url|postgres[_-]?url|neon[_-]?postgres)/i;

const SECRET_VALUE_PATTERNS: RegExp[] = [
	/postgres(ql)?:\/\/[^\s]+/gi,
	/Bearer\s+[A-Za-z0-9._-]+/gi,
	/(NEON_POSTGRES_URL|POSTGRES_URL|DATABASE_URL)=[^\s]+/gi,
	/Authorization:\s*[^\s]+/gi,
	/Set-Cookie:\s*[^\n]+/gi,
	/Cookie:\s*[^\n]+/gi,
	/access_token[=:]\s*[^\s&]+/gi,
	/refresh_token[=:]\s*[^\s&]+/gi,
	/api[_-]?key[=:]\s*[^\s&]+/gi,
	/password[=:]\s*[^\s&]+/gi,
];

export function redactSecretString(text: string): string {
	let result = text;
	for (const pattern of SECRET_VALUE_PATTERNS) {
		result = result.replace(pattern, '[REDACTED]');
	}
	return result;
}

function redactUnknownValue(value: unknown, key?: string): unknown {
	if (value == null) return value;
	if (typeof value === 'string') {
		if (key && SECRET_KEY_PATTERN.test(key)) return '[REDACTED]';
		return redactSecretString(value);
	}
	if (value instanceof Error) {
		return {
			name: value.name,
			message: redactSecretString(value.message),
			cause: value.cause ? redactUnknownValue(value.cause) : undefined,
		};
	}
	if (Array.isArray(value)) {
		return value.map((item) => redactUnknownValue(item));
	}
	if (typeof value === 'object') {
		return redactSecretsObject(value as Record<string, unknown>);
	}
	return value;
}

export function redactSecretsObject(obj: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(obj)) {
		out[key] = redactUnknownValue(value, key);
	}
	return out;
}

export function redactSecrets(input: unknown): string {
	if (typeof input === 'string') return redactSecretString(input);
	if (input instanceof Error) {
		return redactSecretString(input.message);
	}
	if (Array.isArray(input)) {
		return JSON.stringify(input.map((v) => redactUnknownValue(v)));
	}
	if (input && typeof input === 'object') {
		return JSON.stringify(redactSecretsObject(input as Record<string, unknown>));
	}
	return redactSecretString(String(input));
}

export function summarizeRequestChanges(request: CodexJourneyRevisionRequest): string[] {
	return request.changeSummary ?? request.reviewMetadata?.changeSummary ?? [];
}
