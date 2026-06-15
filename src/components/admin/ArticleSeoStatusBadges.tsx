'use client';

import {
	getArticleSeoIssueShortLabel,
	getArticleSeoStatusLabel,
	type ArticleSeoAuditResult,
} from '@/lib/articleSeoAudit';

const STATUS_STYLES: Record<ArticleSeoAuditResult['status'], string> = {
	good: 'bg-green-100 text-green-800 border-green-200',
	'needs-work': 'bg-amber-100 text-amber-800 border-amber-200',
	critical: 'bg-red-100 text-red-800 border-red-200',
};

const ISSUE_STYLES: Record<string, string> = {
	critical: 'bg-red-50 text-red-700 border-red-100',
	warning: 'bg-amber-50 text-amber-700 border-amber-100',
	info: 'bg-blue-50 text-blue-700 border-blue-100',
};

interface ArticleSeoStatusBadgesProps {
	audit: ArticleSeoAuditResult;
	maxIssueBadges?: number;
}

export default function ArticleSeoStatusBadges({
	audit,
	maxIssueBadges = 3,
}: ArticleSeoStatusBadgesProps) {
	const visibleIssues = audit.issues.slice(0, maxIssueBadges);
	const remaining = audit.issues.length - visibleIssues.length;

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap items-center gap-2">
				<span
					className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[audit.status]}`}
				>
					{getArticleSeoStatusLabel(audit.status)}
				</span>
				<span className="text-xs text-gray-500">SEO {audit.score}/100</span>
			</div>
			{audit.issues.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{visibleIssues.map((issue) => (
						<span
							key={issue.key}
							className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] ${ISSUE_STYLES[issue.severity] ?? 'bg-gray-50 text-gray-600 border-gray-100'}`}
						>
							{getArticleSeoIssueShortLabel(issue.key)}
						</span>
					))}
					{remaining > 0 && (
						<span className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-600">
							+{remaining} more
						</span>
					)}
				</div>
			)}
		</div>
	);
}
