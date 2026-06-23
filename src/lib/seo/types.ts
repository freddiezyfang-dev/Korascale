import type { ArticleCtaConfig, ContentBlock } from '@/types/article';

export type ArticleRevisionStatus = 'pending' | 'published' | 'rejected' | 'superseded';

export type SeoFactCheckItem = {
	item: string;
	resolved: boolean;
	note?: string;
};

/** Editable article fields allowed in export and revision proposals. */
export type SeoEditableArticleFields = {
	title: string;
	pageTitle: string;
	metaDescription: string;
	excerpt: string;
	category: string;
	tags: string[];
	content: string | null;
	contentBlocks: ContentBlock[];
	faqs: { question: string; answer: string }[];
	ctaConfig: ArticleCtaConfig;
	relatedArticles: string[];
	relatedJourneys: string[];
	recommendedSlug?: string;
};

export type SeoArticleExport = SeoEditableArticleFields & {
	exportedAt: string;
	sourceUpdatedAt: string;
	sourceArticleId: string;
	sourceSlug: string;
};

export type SeoRevisionSubmission = SeoEditableArticleFields & {
	sourceArticleId: string;
	sourceSlug: string;
	sourceUpdatedAt: string;
	changeSummary: string;
	factCheckItems: SeoFactCheckItem[];
};

export type SeoFieldChange = {
	field: keyof SeoEditableArticleFields;
	before: unknown;
	after: unknown;
};

export type SeoRevisionValidationResult =
	| { success: true; data: SeoRevisionSubmission }
	| { success: false; errors: Record<string, string> };

export type SeoRevisionSubmitSummary = {
	revisionId?: string;
	articleSlug: string;
	status: ArticleRevisionStatus | 'dry-run';
	fieldChanges: SeoFieldChange[];
	unresolvedFactCheckCount: number;
	supersededRevisionIds: string[];
	warnings: string[];
};

/** Admin review metadata stored in article_revisions.review_metadata (not in proposed_content). */
export type SeoRevisionReviewMetadata = {
	changeSummary: string;
	factCheckItems: SeoFactCheckItem[];
};

export type ArticleRevisionRecord = {
	id: string;
	articleId: string;
	sourceSlug: string;
	sourceSnapshot: Record<string, unknown>;
	proposedContent: Record<string, unknown>;
	reviewMetadata: SeoRevisionReviewMetadata;
	status: ArticleRevisionStatus;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	publishedAt: Date | null;
};
