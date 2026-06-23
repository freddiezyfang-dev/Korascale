import {
	insertArticleRevision,
	supersedePendingRevisions,
} from './articleRevisionQuery.server';
import { computeFieldChanges, countUnresolvedFactCheckItems, formatFieldChangeSummary } from './revisionDiff';
import { mapArticleToEditableFields } from './mapArticle';
import { toEditableFields, toReviewMetadata, validateSeoRevisionSubmission } from './schema';
import { SeoRevisionConflictError, validateArticleSourceVersion } from './sourceVersion';
import type { SeoRevisionSubmitSummary } from './types';

export type SubmitRevisionOptions = {
	fileContent: unknown;
	dryRun: boolean;
	createdBy: string;
};

export type SubmitRevisionResult =
	| { success: true; summary: SeoRevisionSubmitSummary }
	| { success: false; error: string; errors?: Record<string, string> };

export async function submitSeoRevision(
	options: SubmitRevisionOptions
): Promise<SubmitRevisionResult> {
	const validation = validateSeoRevisionSubmission(options.fileContent);
	if (!validation.success) {
		return { success: false, error: 'Revision file validation failed.', errors: validation.errors };
	}

	const submission = validation.data;
	let article: Awaited<ReturnType<typeof validateArticleSourceVersion>>;

	try {
		article = await validateArticleSourceVersion(submission);
	} catch (error) {
		if (error instanceof SeoRevisionConflictError) {
			return { success: false, error: error.message };
		}
		throw error;
	}

	const currentEditable = mapArticleToEditableFields(article);
	const proposedContent = toEditableFields(submission);
	const reviewMetadata = toReviewMetadata(submission);
	const fieldChanges = computeFieldChanges(currentEditable, proposedContent);
	const unresolvedFactCheckCount = countUnresolvedFactCheckItems(submission.factCheckItems);
	const warnings: string[] = [];

	if (unresolvedFactCheckCount > 0) {
		warnings.push(
			`${unresolvedFactCheckCount} unresolved factCheckItems — revision can be saved as pending, but admin should review before publishing.`
		);
	}

	if (fieldChanges.length === 0) {
		return {
			success: false,
			error: 'No editable field changes detected between the live article and proposed revision.',
		};
	}

	const summary: SeoRevisionSubmitSummary = {
		articleSlug: article.slug,
		status: options.dryRun ? 'dry-run' : 'pending',
		fieldChanges,
		unresolvedFactCheckCount,
		supersededRevisionIds: [],
		warnings,
	};

	if (options.dryRun) {
		return { success: true, summary };
	}

	const supersededRevisionIds = await supersedePendingRevisions(article.id, options.createdBy);
	summary.supersededRevisionIds = supersededRevisionIds;

	const revisionId = await insertArticleRevision({
		articleId: article.id,
		sourceSlug: article.slug,
		sourceSnapshot: currentEditable,
		proposedContent,
		reviewMetadata,
		createdBy: options.createdBy,
	});

	summary.revisionId = revisionId;
	summary.status = 'pending';

	return { success: true, summary };
}

export function printSubmitSummary(summary: SeoRevisionSubmitSummary): void {
	console.log(`Article slug: ${summary.articleSlug}`);
	console.log(`Status: ${summary.status}`);
	if (summary.revisionId) {
		console.log(`Revision ID: ${summary.revisionId}`);
	}
	if (summary.supersededRevisionIds.length > 0) {
		console.log(
			`Superseded pending revision(s): ${summary.supersededRevisionIds.join(', ')}`
		);
	}
	console.log('Field changes:');
	for (const line of formatFieldChangeSummary(summary.fieldChanges)) {
		console.log(`  - ${line}`);
	}
	if (summary.unresolvedFactCheckCount > 0) {
		console.log(
			`⚠ Unresolved factCheckItems: ${summary.unresolvedFactCheckCount}`
		);
	}
	for (const warning of summary.warnings) {
		console.log(`⚠ ${warning}`);
	}
}
