'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Heading, Text } from '@/components/common';
import {
	computeJourneyRevisionFieldChanges,
	formatJourneyRevisionChangeSummary,
} from '@/lib/journeyRevisions/revisionDiff';
import type { JourneyRevisionRecord, JourneyRevisionSnapshot } from '@/lib/journeyRevisions/types';

type RevisionDetailResponse = {
	ok: boolean;
	revision: JourneyRevisionRecord;
	allowedActions: string[];
	hasSourceConflict: boolean;
	sourceConflictMessage?: string;
};

type ViewMode = 'source' | 'proposed' | 'compare';

type Props = {
	revisionId: string;
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

function SnapshotSummary({ snapshot, label }: { snapshot: JourneyRevisionSnapshot; label: string }) {
	return (
		<div className="space-y-2 text-sm text-gray-700">
			<Text size="sm" className="font-semibold text-gray-900">
				{label}
			</Text>
			<p>
				<strong>Title:</strong> {snapshot.title || '(empty)'}
			</p>
			<p>
				<strong>Slug:</strong> {snapshot.slug || '(empty)'}
			</p>
			<p>
				<strong>Status:</strong> {snapshot.status}
			</p>
			<p>
				<strong>Journey type:</strong> {snapshot.journey_type || snapshot.journey_type_slug || '(empty)'}
			</p>
			<p>
				<strong>Page title:</strong> {snapshot.page_title || '(empty)'}
			</p>
			<p>
				<strong>Meta description:</strong>{' '}
				{snapshot.meta_description ? `${snapshot.meta_description.slice(0, 120)}...` : '(empty)'}
			</p>
		</div>
	);
}

export default function JourneyRevisionPreviewPanel({ revisionId }: Props) {
	const [detail, setDetail] = useState<RevisionDetailResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [view, setView] = useState<ViewMode>('compare');
	const [busy, setBusy] = useState<'publish' | 'reject' | null>(null);
	const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

	const loadDetail = useCallback(async () => {
		setLoading(true);
		try {
			const res = await adminFetch(`/api/admin/journey-revisions/${revisionId}`);
			if (!res.ok) {
				setDetail(null);
				return;
			}
			setDetail((await res.json()) as RevisionDetailResponse);
		} finally {
			setLoading(false);
		}
	}, [revisionId]);

	useEffect(() => {
		void loadDetail();
	}, [loadDetail]);

	const fieldChanges = useMemo(() => {
		if (!detail) return [];
		return computeJourneyRevisionFieldChanges(
			detail.revision.sourceSnapshot,
			detail.revision.proposedSnapshot
		);
	}, [detail]);

	const changeSummary = useMemo(() => formatJourneyRevisionChangeSummary(fieldChanges), [fieldChanges]);

	const canPublish = detail?.allowedActions.includes('publish') && !detail.hasSourceConflict;
	const canReject = detail?.allowedActions.includes('reject');

	async function handlePublish() {
		if (!detail || !canPublish) return;
		if (!window.confirm('Publish this revision to the live Journey?')) return;
		setBusy('publish');
		setMessage(null);
		try {
			const res = await adminFetch(`/api/admin/journey-revisions/${detail.revision.id}/publish`, {
				method: 'POST',
			});
			const data = await res.json();
			if (!res.ok) {
				setMessage({ type: 'error', text: data.message ?? 'Publish failed.' });
				return;
			}
			setMessage({ type: 'success', text: 'Revision published.' });
			await loadDetail();
		} finally {
			setBusy(null);
		}
	}

	async function handleReject() {
		if (!detail || !canReject) return;
		setBusy('reject');
		setMessage(null);
		try {
			const res = await adminFetch(`/api/admin/journey-revisions/${detail.revision.id}/reject`, {
				method: 'POST',
				body: JSON.stringify({ reason: 'Rejected from preview UI' }),
			});
			const data = await res.json();
			if (!res.ok) {
				setMessage({ type: 'error', text: data.message ?? 'Reject failed.' });
				return;
			}
			setMessage({ type: 'success', text: 'Revision rejected.' });
			await loadDetail();
		} finally {
			setBusy(null);
		}
	}

	if (loading) {
		return <Text size="sm">Loading revision…</Text>;
	}

	if (!detail) {
		return <Text size="sm">Revision not found or access denied.</Text>;
	}

	const { revision } = detail;

	return (
		<Card className="p-6 space-y-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="space-y-1">
					<Heading level={3}>Journey Revision Preview</Heading>
					<Text size="sm" className="text-gray-600">
						{revision.operation} · {revision.status} · {revision.id}
					</Text>
					{revision.journeyId ? (
						<Text size="sm" className="text-gray-600">
							Journey ID: {revision.journeyId}
						</Text>
					) : null}
					{detail.hasSourceConflict ? (
						<Text size="sm" className="text-amber-700">
							{detail.sourceConflictMessage}
						</Text>
					) : null}
				</div>
				<div className="flex flex-wrap gap-2">
					{revision.journeyId ? (
						<Link href={`/admin/journeys/edit/${revision.journeyId}`}>
							<Button variant="secondary" size="sm">
								Edit Journey
							</Button>
						</Link>
					) : null}
					<Button
						variant="primary"
						size="sm"
						disabled={!canPublish || busy !== null}
						onClick={() => void handlePublish()}
					>
						{busy === 'publish' ? 'Publishing…' : 'Publish'}
					</Button>
					<Button
						variant="secondary"
						size="sm"
						disabled={!canReject || busy !== null}
						onClick={() => void handleReject()}
					>
						{busy === 'reject' ? 'Rejecting…' : 'Reject'}
					</Button>
				</div>
			</div>

			{message ? (
				<Text size="sm" className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
					{message.text}
				</Text>
			) : null}

			<div className="flex flex-wrap gap-2">
				<Button
					variant={view === 'source' ? 'primary' : 'secondary'}
					size="sm"
					onClick={() => setView('source')}
					disabled={!revision.sourceSnapshot}
				>
					Source Snapshot
				</Button>
				<Button
					variant={view === 'proposed' ? 'primary' : 'secondary'}
					size="sm"
					onClick={() => setView('proposed')}
				>
					Proposed Snapshot
				</Button>
				<Button
					variant={view === 'compare' ? 'primary' : 'secondary'}
					size="sm"
					onClick={() => setView('compare')}
				>
					Compare Changes
				</Button>
			</div>

			{view === 'compare' && (
				<div className="space-y-3">
					<Text size="sm" className="font-semibold text-gray-800">
						Field changes
					</Text>
					<ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
						{changeSummary.length === 0 ? (
							<li>No field differences detected.</li>
						) : (
							changeSummary.map((line) => <li key={line}>{line}</li>)
						)}
					</ul>
					{revision.changeSummary.length > 0 ? (
						<div>
							<Text size="sm" className="font-semibold text-gray-800">
								Server change summary
							</Text>
							<ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
								{revision.changeSummary.map((line) => (
									<li key={line}>{line}</li>
								))}
							</ul>
						</div>
					) : null}
				</div>
			)}

			{view === 'source' && revision.sourceSnapshot ? (
				<SnapshotSummary snapshot={revision.sourceSnapshot} label="Source snapshot" />
			) : null}

			{view === 'proposed' ? (
				<SnapshotSummary snapshot={revision.proposedSnapshot} label="Proposed snapshot" />
			) : null}

			{revision.validationReport.errors.length > 0 ? (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
					<p className="font-semibold">Validation errors</p>
					<ul className="list-disc pl-5 mt-2 space-y-1">
						{revision.validationReport.errors.map((err) => (
							<li key={`${err.field}-${err.code}`}>
								{err.field}: {err.message}
							</li>
						))}
					</ul>
				</div>
			) : null}
		</Card>
	);
}
