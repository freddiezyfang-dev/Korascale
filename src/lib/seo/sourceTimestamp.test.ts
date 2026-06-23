import { afterEach, describe, expect, it, vi } from 'vitest';

import { mapArticleRevisionRow } from './articleRevisionQuery.server';
import { detectRevisionSourceConflict } from './revisionConflict';
import { serializeArticleUpdatedAt } from './sourceTimestamp';
import type { ArticleRevisionRecord } from './types';
import type { Article } from '@/types/article';

const SOURCE_ISO = '2026-06-23T01:51:14.618Z';

function buildArticle(updatedAt: Date): Article {
	return {
		id: 'article-1',
		slug: 'sample-slug',
		title: 'Title',
		author: 'Author',
		coverImage: '/cover.jpg',
		category: 'China Travel Planning',
		contentBlocks: [],
		relatedJourneyIds: [],
		status: 'active',
		createdAt: updatedAt,
		updatedAt,
	};
}

function buildRevision(sourceUpdatedAt: Date): ArticleRevisionRecord {
	return {
		id: 'rev-1',
		articleId: 'article-1',
		sourceSlug: 'sample-slug',
		sourceSnapshot: {},
		proposedContent: {},
		reviewMetadata: { changeSummary: '', factCheckItems: [] },
		sourceUpdatedAt,
		status: 'pending',
		createdBy: 'codex',
		createdAt: sourceUpdatedAt,
		updatedAt: sourceUpdatedAt,
		publishedAt: null,
	};
}

describe('serializeArticleUpdatedAt timezone semantics', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('preserves millisecond precision from ISO input', () => {
		expect(serializeArticleUpdatedAt(SOURCE_ISO)).toBe(SOURCE_ISO);
	});

	it('preserves millisecond precision from pg Date in Asia/Shanghai', () => {
		vi.stubEnv('TZ', 'Asia/Shanghai');
		const pgDate = new Date(SOURCE_ISO);
		expect(serializeArticleUpdatedAt(pgDate)).toBe(SOURCE_ISO);
	});

	it('does not apply an 8-hour offset when round-tripping revision source_updated_at', () => {
		vi.stubEnv('TZ', 'Asia/Shanghai');
		const insertedAt = new Date(SOURCE_ISO);
		const row = mapArticleRevisionRow({
			id: 'rev-1',
			article_id: 'article-1',
			source_slug: 'sample-slug',
			source_snapshot: {},
			proposed_content: {},
			review_metadata: {},
			source_updated_at: insertedAt,
			status: 'pending',
			created_by: 'codex',
			created_at: insertedAt,
			updated_at: insertedAt,
			published_at: null,
		});

		expect(serializeArticleUpdatedAt(row.sourceUpdatedAt)).toBe(SOURCE_ISO);
	});

	it('compares publish conflict at millisecond precision without false 409', () => {
		vi.stubEnv('TZ', 'Asia/Shanghai');
		const updatedAt = new Date(SOURCE_ISO);
		const revision = buildRevision(updatedAt);
		const article = buildArticle(updatedAt);

		expect(detectRevisionSourceConflict(revision, article)).toEqual({ hasConflict: false });
	});

	it('detects millisecond drift as publish conflict', () => {
		const revision = buildRevision(new Date(SOURCE_ISO));
		const article = buildArticle(new Date('2026-06-23T01:51:14.619Z'));

		const result = detectRevisionSourceConflict(revision, article);
		expect(result.hasConflict).toBe(true);
		expect(result.reason).toBe('updated_at');
	});
});
