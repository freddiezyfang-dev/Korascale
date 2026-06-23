/**
 * Serialize an articles.updated_at value for SEO export and optimistic locking.
 *
 * The articles column is PostgreSQL `timestamp without time zone`. The existing
 * application relies on node-postgres to interpret that value as a JavaScript
 * Date in the Node process timezone. Preserve that established interpretation:
 * when pg supplies a Date, use it directly instead of converting through
 * Date#toString(), which drops milliseconds.
 */
export function serializeArticleUpdatedAt(value: unknown): string {
	let date: Date;

	if (value instanceof Date) {
		date = new Date(value.getTime());
	} else if (typeof value === 'string' && value.trim()) {
		date = new Date(value.trim());
	} else {
		throw new Error('articles.updated_at must be a non-empty Date or date string.');
	}

	if (Number.isNaN(date.getTime())) {
		throw new Error('articles.updated_at must be a valid date value.');
	}

	return date.toISOString();
}
