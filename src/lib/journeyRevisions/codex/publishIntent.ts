const UUID_CAPTURE =
	/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

const IMPLICIT_PUBLISH_PHRASES = [
	'looks good',
	'look good',
	'看起来可以',
	'继续',
	'好的',
	'就这样',
	'sounds good',
	'go ahead',
	'publish it',
	'可以发布',
];

/** User must explicitly name the revision ID — vague approval is not publish. */
export function isExplicitPublishInstruction(text: string): boolean {
	const trimmed = text.trim();
	if (!trimmed || !UUID_CAPTURE.test(trimmed)) return false;
	const lower = trimmed.toLowerCase();
	const hasPublishVerb =
		/发布\s*journey\s*revision/i.test(trimmed) ||
		/publish\s*journey\s*revision/i.test(lower) ||
		/^publish\s+revision\s+/i.test(trimmed);
	return hasPublishVerb;
}

export function isImplicitPublishPhrase(text: string): boolean {
	const lower = text.trim().toLowerCase();
	return IMPLICIT_PUBLISH_PHRASES.some((phrase) => lower === phrase || lower.includes(phrase));
}

export function extractRevisionIdFromPublishInstruction(text: string): string | null {
	const match = text.match(UUID_CAPTURE);
	return match ? match[0] : null;
}
