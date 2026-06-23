import { getArticleCanonicalPath } from '@/lib/articleCategories';

export type RevisionCanonicalPathWarning = {
	currentPath: string;
	proposedPath: string;
	message: string;
};

export function getRevisionCanonicalPathWarning(params: {
	slug: string;
	publishedCategory: string;
	proposedCategory: string;
}): RevisionCanonicalPathWarning | null {
	if (params.publishedCategory === params.proposedCategory) {
		return null;
	}

	const currentPath = getArticleCanonicalPath({
		slug: params.slug,
		category: params.publishedCategory,
	});
	const proposedPath = getArticleCanonicalPath({
		slug: params.slug,
		category: params.proposedCategory,
	});

	return {
		currentPath,
		proposedPath,
		message:
			'Publishing will change the article category. The public URL will follow existing redirect rules from the current canonical path to the new path.',
	};
}

export function formatPublishConfirmMessage(
	baseMessage: string,
	warning: RevisionCanonicalPathWarning | null
): string {
	if (!warning) return baseMessage;
	return `${baseMessage}\n\nCanonical path change:\nCurrent: ${warning.currentPath}\nAfter publish: ${warning.proposedPath}\n\n${warning.message}`;
}
