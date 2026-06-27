import {
	JOURNEY_STATUSES,
	LEGACY_INACTIVE_STATUS,
	type JourneyCanonicalStatus,
} from './constants';
import { JOURNEY_TYPE_LABEL_TO_SLUG } from './constants';
import type { JourneyTypeSlug } from './constants';

export type JourneyWriteStatus = JourneyCanonicalStatus;

/** Expanded journey columns introduced in 025A — never reference in SQL unless flag is on. */
export const EXPANDED_JOURNEY_COLUMN_NAMES = [
	'page_title',
	'meta_description',
	'hero_image_url',
	'hero_image_alt',
	'journey_type_slug',
	'currency',
	'price_basis',
	'price_from',
	'price_on_request',
	'price_note',
	'price_valid_until',
	'seo_complete',
	'display_order',
] as const;

export function normalizeJourneyStatusForWrite(
	status: unknown,
	defaultStatus: JourneyWriteStatus = 'draft'
): JourneyWriteStatus {
	if (status == null || status === '') return defaultStatus;
	const normalized = String(status).trim().toLowerCase();
	if (normalized === LEGACY_INACTIVE_STATUS) return 'archived';
	if ((JOURNEY_STATUSES as readonly string[]).includes(normalized)) {
		return normalized as JourneyWriteStatus;
	}
	throw new Error(`Invalid journey status for write: ${status}`);
}

export function normalizeJourneyStatusForRead(status: unknown): string {
	if (status == null) return 'draft';
	const normalized = String(status).trim().toLowerCase();
	if (normalized === LEGACY_INACTIVE_STATUS) return 'archived';
	return normalized;
}

export function isLegacyInactiveStatus(status: unknown): boolean {
	return (
		normalizeJourneyStatusForRead(status) === 'archived' &&
		String(status).trim().toLowerCase() === LEGACY_INACTIVE_STATUS
	);
}

export function validateJourneyStatusForApiWrite(status: unknown): {
	ok: boolean;
	value?: JourneyWriteStatus;
	error?: string;
} {
	try {
		return { ok: true, value: normalizeJourneyStatusForWrite(status) };
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : 'Invalid status',
		};
	}
}

export const JOURNEY_ADMIN_STATUS_OPTIONS: Array<{ value: JourneyWriteStatus; label: string }> = [
	{ value: 'draft', label: 'Draft' },
	{ value: 'active', label: 'Active' },
	{ value: 'archived', label: 'Archived' },
];

export function journeyTypeLabelToSlug(label: unknown): JourneyTypeSlug | null {
	if (typeof label !== 'string' || !label.trim()) return null;
	return JOURNEY_TYPE_LABEL_TO_SLUG[label.trim()] ?? null;
}

export type JourneyDualWritePayload = {
	jsonb: Record<string, unknown>;
	expandedColumns: Record<string, unknown>;
};

export function buildJourneyDualWritePayload(input: {
	pageTitle?: string;
	metaDescription?: string;
	heroImage?: string;
	heroAlt?: string;
	journeyType?: string;
	shortDescription?: string;
}): JourneyDualWritePayload {
	const jsonb: Record<string, unknown> = {};
	if (input.pageTitle !== undefined) jsonb.pageTitle = input.pageTitle;
	if (input.metaDescription !== undefined) jsonb.metaDescription = input.metaDescription;
	if (input.heroImage !== undefined) jsonb.heroImage = input.heroImage;
	if (input.heroAlt !== undefined) {
		jsonb.heroAlt = input.heroAlt;
		jsonb.heroImageAlt = input.heroAlt;
	}
	if (input.journeyType !== undefined) jsonb.journeyType = input.journeyType;

	const expandedColumns: Record<string, unknown> = {};
	if (input.pageTitle !== undefined) expandedColumns.page_title = input.pageTitle;
	if (input.metaDescription !== undefined) {
		expandedColumns.meta_description = input.metaDescription;
	}
	if (input.heroImage !== undefined) expandedColumns.hero_image_url = input.heroImage;
	if (input.heroAlt !== undefined) expandedColumns.hero_image_alt = input.heroAlt;
	if (input.journeyType !== undefined) {
		const slug = journeyTypeLabelToSlug(input.journeyType);
		if (slug) expandedColumns.journey_type_slug = slug;
	}
	if (input.shortDescription !== undefined) {
		expandedColumns.meta_description =
			expandedColumns.meta_description ?? input.shortDescription;
	}

	return { jsonb, expandedColumns };
}

export function isJourneyExpandedColumnsEnabled(): boolean {
	return process.env.JOURNEY_NORMALIZATION_COLUMNS === '1';
}

export function getExpandedColumnEntries(
	expandedColumns: Record<string, unknown>
): Array<[string, unknown]> {
	if (!isJourneyExpandedColumnsEnabled()) return [];
	return Object.entries(expandedColumns).filter(([, value]) => value !== undefined);
}

/** Guard: journey SQL must not reference 025A columns when flag is off. */
export function findExpandedColumnReferencesInSql(sql: string): string[] {
	const lower = sql.toLowerCase();
	return EXPANDED_JOURNEY_COLUMN_NAMES.filter((column) => {
		const pattern = new RegExp(`\\b${column.replace(/_/g, '_')}\\b`, 'i');
		return pattern.test(lower);
	});
}

export function assertJourneySqlSafeForCurrentSchema(sql: string): void {
	if (isJourneyExpandedColumnsEnabled()) return;
	const refs = findExpandedColumnReferencesInSql(sql);
	if (refs.length > 0) {
		throw new Error(
			`Journey SQL references expanded columns while JOURNEY_NORMALIZATION_COLUMNS is off: ${refs.join(', ')}`
		);
	}
}

export function mergeExpandedColumnSql(
	expandedColumns: Record<string, unknown>,
	startIndex: number
): { fields: string[]; values: unknown[]; nextIndex: number } {
	const fields: string[] = [];
	const values: unknown[] = [];
	let paramIndex = startIndex;
	for (const [column, value] of getExpandedColumnEntries(expandedColumns)) {
		fields.push(`${column} = $${paramIndex++}`);
		values.push(value);
	}
	return { fields, values, nextIndex: paramIndex };
}

/** Single-statement INSERT: base columns + optional expanded columns + JSONB. */
export function buildJourneyInsertSql(expandedColumns: Record<string, unknown>): {
	sql: string;
	expandedValues: unknown[];
} {
	const expandedEntries = getExpandedColumnEntries(expandedColumns);
	const expandedColumnNames = expandedEntries.map(([name]) => name);
	const expandedValues = expandedEntries.map(([, value]) => value);

	const baseColumns = [
		'title',
		'slug',
		'description',
		'short_description',
		'price',
		'original_price',
		'category',
		'journey_type',
		'region',
		'place',
		'city',
		'location',
		'duration',
		'difficulty',
		'max_participants',
		'min_participants',
		'image',
		'status',
		'featured',
		'rating',
		'review_count',
	];
	const baseParamCount = baseColumns.length;

	const allColumns = [...baseColumns, ...expandedColumnNames, 'data', 'created_at', 'updated_at'];
	const basePlaceholders = Array.from({ length: baseParamCount }, (_, i) => `$${i + 2}`);
	const expandedPlaceholders = expandedColumnNames.map(
		(_, i) => `$${baseParamCount + 2 + i}`
	);
	const orderedPlaceholders = [
		...basePlaceholders,
		...expandedPlaceholders,
		'$1::jsonb',
		'NOW()',
		'NOW()',
	];

	const sql = `
      INSERT INTO journeys (${allColumns.join(', ')})
      VALUES (${orderedPlaceholders.join(', ')})
      RETURNING id, created_at, updated_at
    `;

	return { sql, expandedValues };
}
