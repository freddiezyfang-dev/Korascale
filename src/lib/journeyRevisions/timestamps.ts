const ISO_TIMESTAMP_WITH_ZONE_RE =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;

export function serializeTimestamp(
	value: Date | string | null | undefined,
	label = 'timestamp'
): string | null {
	if (value == null) return null;

	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid ${label}.`);
	}

	return date.toISOString();
}

export function serializeSourceTimestamp(
	value: Date | string | null | undefined,
	label = 'sourceUpdatedAt'
): string | null {
	if (value == null) return null;

	if (typeof value === 'string' && !ISO_TIMESTAMP_WITH_ZONE_RE.test(value.trim())) {
		throw new Error(`${label} must be a full ISO timestamp with timezone.`);
	}

	return serializeTimestamp(value, label);
}
