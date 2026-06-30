'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container, Section, Heading, Text, Card, Button } from '@/components/common';
import { useUser } from '@/context/UserContext';
import type { JourneyRevisionListItem, JourneyRevisionStatus } from '@/lib/journeyRevisions/types';
import { Eye, Filter } from 'lucide-react';

const STATUS_OPTIONS: Array<{ value: JourneyRevisionStatus | 'all'; label: string }> = [
	{ value: 'pending_review', label: 'Pending review' },
	{ value: 'published', label: 'Published' },
	{ value: 'rejected', label: 'Rejected' },
	{ value: 'superseded', label: 'Superseded' },
	{ value: 'all', label: 'All statuses' },
];

function statusBadgeClass(status: JourneyRevisionStatus): string {
	switch (status) {
		case 'pending_review':
			return 'bg-amber-100 text-amber-900 border-amber-200';
		case 'published':
			return 'bg-green-100 text-green-800 border-green-200';
		case 'rejected':
			return 'bg-red-100 text-red-800 border-red-200';
		case 'superseded':
			return 'bg-gray-100 text-gray-700 border-gray-200';
		default:
			return 'bg-slate-100 text-slate-700 border-slate-200';
	}
}

export default function AdminJourneyRevisionsPage() {
	const { user } = useUser();
	const router = useRouter();
	const [statusFilter, setStatusFilter] = useState<JourneyRevisionStatus | 'all'>('pending_review');
	const [revisions, setRevisions] = useState<JourneyRevisionListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadRevisions = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const statuses: JourneyRevisionStatus[] =
				statusFilter === 'all'
					? ['pending_review', 'published', 'rejected', 'superseded', 'draft']
					: [statusFilter];
			const batches = await Promise.all(
				statuses.map(async (status) => {
					const res = await fetch(`/api/admin/journey-revisions?status=${status}&sort=createdAtDesc`, {
						credentials: 'include',
					});
					if (!res.ok) {
						const data = await res.json().catch(() => ({}));
						throw new Error(data.message ?? `Failed to load revisions (${res.status})`);
					}
					const data = (await res.json()) as { revisions: JourneyRevisionListItem[] };
					return data.revisions;
				})
			);
			const merged = batches
				.flat()
				.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
			setRevisions(merged);
		} catch (err) {
			setRevisions([]);
			setError(err instanceof Error ? err.message : 'Failed to load revisions');
		} finally {
			setLoading(false);
		}
	}, [statusFilter]);

	useEffect(() => {
		if (!user?.isAdmin) return;
		void loadRevisions();
	}, [user?.isAdmin, loadRevisions]);

	if (!user?.isAdmin) {
		return (
			<Container>
				<Section className="py-12">
					<Text>Admin access required.</Text>
				</Section>
			</Container>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Section background="primary" padding="xl">
				<Container size="xl">
					<div className="mb-8 flex flex-wrap items-center justify-between gap-4">
						<div>
							<Heading level={1} className="text-3xl font-bold mb-2">
								Journey Revisions
							</Heading>
							<Text size="lg" className="text-gray-600">
								Review pending changes before publishing to live Journeys
							</Text>
						</div>
						<Button variant="secondary" onClick={() => router.push('/admin/journeys')}>
							Back to Journeys
						</Button>
					</div>

					<Card className="p-4 mb-6">
						<div className="flex flex-wrap items-center gap-3">
							<Filter className="w-4 h-4 text-gray-500" />
							<label className="text-sm text-gray-700" htmlFor="revision-status-filter">
								Status
							</label>
							<select
								id="revision-status-filter"
								className="border border-gray-300 rounded-md px-3 py-2 text-sm"
								value={statusFilter}
								onChange={(e) =>
									setStatusFilter(e.target.value as JourneyRevisionStatus | 'all')
								}
							>
								{STATUS_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
							<Button variant="secondary" size="sm" onClick={() => void loadRevisions()}>
								Refresh
							</Button>
						</div>
					</Card>

					{loading ? <Text size="sm">Loading revisions…</Text> : null}
					{error ? <Text size="sm" className="text-red-700">{error}</Text> : null}

					{!loading && !error && revisions.length === 0 ? (
						<Card className="p-8 text-center">
							<Text size="sm" className="text-gray-600">
								No journey revisions in this filter. Revisions created via the admin API or Codex
								workflow will appear here.
							</Text>
						</Card>
					) : null}

					<div className="space-y-4">
						{revisions.map((revision) => (
							<Card key={revision.id} className="p-5">
								<div className="flex flex-wrap items-start justify-between gap-4">
									<div className="space-y-2">
										<div className="flex flex-wrap items-center gap-2">
											<span
												className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(revision.status)}`}
											>
												{revision.status}
											</span>
											<span className="text-xs uppercase tracking-wide text-gray-500">
												{revision.operation}
											</span>
										</div>
										<Heading level={3} className="text-lg font-semibold">
											{revision.proposedTitle || '(untitled)'}
										</Heading>
										<Text size="sm" className="text-gray-600">
											Slug: {revision.proposedSlug || '(empty)'}
										</Text>
										{revision.journeyTitle ? (
											<Text size="sm" className="text-gray-600">
												Journey: {revision.journeyTitle}
												{revision.journeySlug ? ` (${revision.journeySlug})` : ''}
											</Text>
										) : null}
										<Text size="sm" className="text-gray-500">
											Created by {revision.createdBy} ·{' '}
											{new Date(revision.createdAt).toLocaleString()}
										</Text>
										{revision.changeSummary.length > 0 ? (
											<ul className="list-disc pl-5 text-sm text-gray-700">
												{revision.changeSummary.slice(0, 3).map((line) => (
													<li key={line}>{line}</li>
												))}
											</ul>
										) : null}
										{revision.hasSourceConflict ? (
											<Text size="sm" className="text-amber-700">
												{revision.sourceConflictMessage}
											</Text>
										) : null}
									</div>
									<div className="flex flex-wrap gap-2">
										<Link href={revision.previewPath}>
											<Button variant="primary" size="sm">
												<Eye className="w-4 h-4 mr-1" />
												Preview / Diff
											</Button>
										</Link>
										{revision.journeyId ? (
											<Link href={`/admin/journeys/edit/${revision.journeyId}`}>
												<Button variant="secondary" size="sm">
													Edit Journey
												</Button>
											</Link>
										) : null}
									</div>
								</div>
							</Card>
						))}
					</div>
				</Container>
			</Section>
		</div>
	);
}
