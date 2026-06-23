'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Heading, Text } from '@/components/common';
import { computeFieldChanges, countUnresolvedFactCheckItems } from '@/lib/seo/revisionDiff';
import {
	formatPublishConfirmMessage,
	getRevisionCanonicalPathWarning,
} from '@/lib/seo/revisionCanonical';
import type { SeoEditableArticleFields, SeoRevisionReviewMetadata } from '@/lib/seo/types';

type RevisionDetailResponse = {
	ok: boolean;
	revision: {
		id: string;
		status: string;
		createdBy: string;
		createdAt: string;
		publishedAt: string | null;
	};
	article: { id: string; slug: string; title: string; updatedAt: string };
	proposedContent: SeoEditableArticleFields;
	sourceSnapshot: SeoEditableArticleFields;
	reviewMetadata: SeoRevisionReviewMetadata;
	hasSourceConflict: boolean;
	sourceConflictMessage?: string;
	unresolvedFactCheckCount: number;
};

type ViewMode = 'published' | 'revision' | 'compare';

type Props = {
	articleId: string;
	publishedSnapshot: SeoEditableArticleFields;
	onPublishedRefresh?: () => void;
};

function adminFetch(url: string, init?: RequestInit) {
	return fetch(url, {
		...init,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...(init?.headers ?? {}),
		},
	});
}

function summarizeContentBlocks(blocks: SeoEditableArticleFields['contentBlocks']) {
	const headings = blocks.filter((b) => b.type === 'heading').map((b) => b.text ?? '');
	return {
		blockCount: blocks.length,
		headingCount: headings.length,
		headings,
	};
}

export default function ArticleRevisionPanel({
	articleId,
	publishedSnapshot,
	onPublishedRefresh,
}: Props) {
	const [detail, setDetail] = useState<RevisionDetailResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [view, setView] = useState<ViewMode>('revision');
	const [revisionDraft, setRevisionDraft] = useState<SeoEditableArticleFields | null>(null);
	const [reviewDraft, setReviewDraft] = useState<SeoRevisionReviewMetadata | null>(null);
	const [busy, setBusy] = useState<'save' | 'reject' | 'publish' | null>(null);
	const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

	const loadPending = useCallback(async () => {
		setLoading(true);
		try {
			const listRes = await adminFetch(
				`/api/admin/article-revisions?status=pending&articleId=${encodeURIComponent(articleId)}`
			);
			if (!listRes.ok) {
				setDetail(null);
				return;
			}
			const listData = (await listRes.json()) as {
				revisions: { id: string }[];
			};
			const pending = listData.revisions[0];
			if (!pending) {
				setDetail(null);
				return;
			}

			const detailRes = await adminFetch(`/api/admin/article-revisions/${pending.id}`);
			if (!detailRes.ok) {
				setDetail(null);
				return;
			}
			const data = (await detailRes.json()) as RevisionDetailResponse;
			setDetail(data);
			setRevisionDraft(data.proposedContent);
			setReviewDraft(data.reviewMetadata);
		} finally {
			setLoading(false);
		}
	}, [articleId]);

	useEffect(() => {
		void loadPending();
	}, [loadPending]);

	const fieldChanges = useMemo(() => {
		if (!detail) return [];
		return computeFieldChanges(detail.sourceSnapshot, detail.proposedContent);
	}, [detail]);

	const unresolvedCount = useMemo(
		() => countUnresolvedFactCheckItems(reviewDraft?.factCheckItems),
		[reviewDraft?.factCheckItems]
	);

	const canonicalPathWarning = useMemo(() => {
		if (!detail) return null;
		return getRevisionCanonicalPathWarning({
			slug: detail.article.slug,
			publishedCategory: publishedSnapshot.category,
			proposedCategory: revisionDraft?.category ?? publishedSnapshot.category,
		});
	}, [detail, publishedSnapshot.category, revisionDraft?.category]);

	const publishDisabled =
		!detail ||
		detail.hasSourceConflict ||
		unresolvedCount > 0 ||
		busy !== null;

	if (loading) return null;
	if (!detail || !revisionDraft || !reviewDraft) return null;

	const handleSave = async () => {
		setBusy('save');
		setMessage(null);
		try {
			const res = await adminFetch(`/api/admin/article-revisions/${detail.revision.id}`, {
				method: 'PUT',
				body: JSON.stringify({ ...revisionDraft, ...reviewDraft }),
			});
			const data = await res.json();
			if (!res.ok) {
				setMessage({ type: 'error', text: data.message ?? 'Failed to save revision.' });
				return;
			}
			setDetail(data as RevisionDetailResponse);
			setRevisionDraft(data.proposedContent);
			setReviewDraft(data.reviewMetadata);
			setMessage({ type: 'success', text: 'Revision saved.' });
		} finally {
			setBusy(null);
		}
	};

	const handleReject = async () => {
		if (!window.confirm('Reject this AI revision? The live article will not be changed.')) return;
		setBusy('reject');
		setMessage(null);
		try {
			const res = await adminFetch(`/api/admin/article-revisions/${detail.revision.id}/reject`, {
				method: 'POST',
			});
			const data = await res.json();
			if (!res.ok) {
				setMessage({ type: 'error', text: data.message ?? 'Failed to reject revision.' });
				return;
			}
			setMessage({ type: 'success', text: 'Revision rejected.' });
			setDetail(null);
		} finally {
			setBusy(null);
		}
	};

	const handlePublish = async () => {
		if (publishDisabled) return;
		if (
			!window.confirm(
				formatPublishConfirmMessage(
					'Publish this AI revision to the live article? This cannot be undone from this panel.',
					canonicalPathWarning
				)
			)
		) {
			return;
		}
		setBusy('publish');
		setMessage(null);
		try {
			const res = await adminFetch(`/api/admin/article-revisions/${detail.revision.id}/publish`, {
				method: 'POST',
			});
			const data = await res.json();
			if (!res.ok) {
				setMessage({
					type: 'error',
					text: data.message ?? data.error ?? 'Failed to publish revision.',
				});
				return;
			}
			setMessage({ type: 'success', text: 'Revision published to live article.' });
			setDetail(null);
			onPublishedRefresh?.();
		} finally {
			setBusy(null);
		}
	};

	const publishedBlocks = summarizeContentBlocks(publishedSnapshot.contentBlocks ?? []);
	const revisionBlocks = summarizeContentBlocks(revisionDraft.contentBlocks ?? []);

	return (
		<Card className="mb-6 border-amber-300 bg-amber-50">
			<div className="flex flex-wrap items-start justify-between gap-4 mb-4">
				<div>
					<Heading level={3} className="text-lg font-semibold text-amber-900">
						AI Revision Available
					</Heading>
					<Text size="sm" className="text-amber-800 mt-1">
						Created {new Date(detail.revision.createdAt).toLocaleString()} by{' '}
						{detail.revision.createdBy} · {detail.revision.status}
					</Text>
					{reviewDraft.changeSummary ? (
						<Text size="sm" className="text-gray-700 mt-2">
							{reviewDraft.changeSummary}
						</Text>
					) : null}
					{unresolvedCount > 0 ? (
						<Text size="sm" className="text-red-700 mt-1 font-medium">
							{unresolvedCount} unresolved fact check item(s)
						</Text>
					) : null}
					{detail.hasSourceConflict ? (
						<Text size="sm" className="text-red-700 mt-1 font-medium">
							{detail.sourceConflictMessage ??
								'The live article changed after this revision was created.'}
						</Text>
					) : null}
					{canonicalPathWarning ? (
						<div className="mt-3 p-3 bg-white border border-amber-400 rounded text-sm text-amber-950">
							<p className="font-semibold">Canonical path will change after publish</p>
							<p className="mt-1">
								<strong>Current canonical path:</strong> {canonicalPathWarning.currentPath}
							</p>
							<p className="mt-1">
								<strong>Proposed canonical path:</strong> {canonicalPathWarning.proposedPath}
							</p>
							<p className="mt-2 text-amber-900">{canonicalPathWarning.message}</p>
						</div>
					) : null}
				</div>
				<div className="flex flex-wrap gap-2">
					<Button
						variant={view === 'published' ? 'primary' : 'secondary'}
						size="sm"
						onClick={() => setView('published')}
					>
						Published Version
					</Button>
					<Button
						variant={view === 'revision' ? 'primary' : 'secondary'}
						size="sm"
						onClick={() => setView('revision')}
					>
						AI Revision
					</Button>
					<Button
						variant={view === 'compare' ? 'primary' : 'secondary'}
						size="sm"
						onClick={() => setView('compare')}
					>
						Compare Changes
					</Button>
				</div>
			</div>

			{view === 'compare' && (
				<div className="mb-4 space-y-3">
					<Text size="sm" className="font-semibold text-gray-800">
						Field changes
					</Text>
					<ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
						{fieldChanges.length === 0 ? (
							<li>No field differences detected.</li>
						) : (
							fieldChanges.map((change) => (
								<li key={change.field}>
									<strong>{change.field}</strong> changed
								</li>
							))
						)}
					</ul>
					<Text size="sm" className="text-gray-700">
						Body: {publishedBlocks.blockCount} → {revisionBlocks.blockCount} blocks; headings{' '}
						{publishedBlocks.headingCount} → {revisionBlocks.headingCount}
					</Text>
					{revisionBlocks.headings.length > 0 ? (
						<Text size="sm" className="text-gray-600">
							Revision headings: {revisionBlocks.headings.join(' · ')}
						</Text>
					) : null}
				</div>
			)}

			{view === 'published' && (
				<div className="mb-4 p-3 bg-white rounded border text-sm space-y-2">
					<p>
						<strong>Title:</strong> {publishedSnapshot.title}
					</p>
					<p>
						<strong>Page title:</strong> {publishedSnapshot.pageTitle}
					</p>
					<p>
						<strong>Meta:</strong> {publishedSnapshot.metaDescription}
					</p>
					<p>
						<strong>Excerpt:</strong> {publishedSnapshot.excerpt}
					</p>
					<p>
						<strong>Blocks:</strong> {publishedBlocks.blockCount}
					</p>
				</div>
			)}

			{view === 'revision' && (
				<div className="mb-4 p-3 bg-white rounded border text-sm space-y-3">
					<label className="block">
						<span className="text-gray-600">Title</span>
						<input
							className="w-full border rounded px-2 py-1 mt-1"
							value={revisionDraft.title}
							onChange={(e) =>
								setRevisionDraft((prev) => (prev ? { ...prev, title: e.target.value } : prev))
							}
						/>
					</label>
					<label className="block">
						<span className="text-gray-600">Page title</span>
						<input
							className="w-full border rounded px-2 py-1 mt-1"
							value={revisionDraft.pageTitle}
							onChange={(e) =>
								setRevisionDraft((prev) =>
									prev ? { ...prev, pageTitle: e.target.value } : prev
								)
							}
						/>
					</label>
					<label className="block">
						<span className="text-gray-600">Meta description</span>
						<textarea
							className="w-full border rounded px-2 py-1 mt-1"
							rows={2}
							value={revisionDraft.metaDescription}
							onChange={(e) =>
								setRevisionDraft((prev) =>
									prev ? { ...prev, metaDescription: e.target.value } : prev
								)
							}
						/>
					</label>
					<label className="block">
						<span className="text-gray-600">Excerpt</span>
						<textarea
							className="w-full border rounded px-2 py-1 mt-1"
							rows={2}
							value={revisionDraft.excerpt}
							onChange={(e) =>
								setRevisionDraft((prev) => (prev ? { ...prev, excerpt: e.target.value } : prev))
							}
						/>
					</label>
					<label className="block">
						<span className="text-gray-600">Change summary</span>
						<textarea
							className="w-full border rounded px-2 py-1 mt-1"
							rows={2}
							value={reviewDraft.changeSummary}
							onChange={(e) =>
								setReviewDraft((prev) =>
									prev ? { ...prev, changeSummary: e.target.value } : prev
								)
							}
						/>
					</label>
					{reviewDraft.factCheckItems.length > 0 ? (
						<div>
							<Text size="sm" className="font-semibold text-gray-700 mb-2">
								Fact checks
							</Text>
							<ul className="space-y-2">
								{reviewDraft.factCheckItems.map((item, index) => (
									<li key={index} className="flex items-start gap-2">
										<input
											type="checkbox"
											checked={item.resolved}
											onChange={(e) =>
												setReviewDraft((prev) => {
													if (!prev) return prev;
													const factCheckItems = [...prev.factCheckItems];
													factCheckItems[index] = {
														...factCheckItems[index],
														resolved: e.target.checked,
													};
													return { ...prev, factCheckItems };
												})
											}
										/>
										<span className={item.resolved ? 'text-gray-500 line-through' : ''}>
											{item.item}
										</span>
									</li>
								))}
							</ul>
						</div>
					) : null}
					{revisionDraft.recommendedSlug ? (
						<Text size="sm" className="text-gray-600">
							Suggested slug (not published): {revisionDraft.recommendedSlug}
						</Text>
					) : null}
					<Text size="sm" className="text-gray-500">
						Revision body: {revisionBlocks.blockCount} blocks
						{revisionDraft.content ? ' + legacy HTML' : ''}
					</Text>
				</div>
			)}

			{message ? (
				<Text
					size="sm"
					className={message.type === 'error' ? 'text-red-700 mb-3' : 'text-green-700 mb-3'}
				>
					{message.text}
				</Text>
			) : null}

			<div className="flex flex-wrap gap-2">
				<Button size="sm" onClick={handleSave} disabled={busy !== null}>
					{busy === 'save' ? 'Saving…' : 'Save Revision'}
				</Button>
				<Button size="sm" variant="secondary" onClick={handleReject} disabled={busy !== null}>
					{busy === 'reject' ? 'Rejecting…' : 'Reject Revision'}
				</Button>
				<Button size="sm" variant="primary" onClick={handlePublish} disabled={publishDisabled}>
					{busy === 'publish' ? 'Publishing…' : 'Publish Revision'}
				</Button>
			</div>
		</Card>
	);
}
