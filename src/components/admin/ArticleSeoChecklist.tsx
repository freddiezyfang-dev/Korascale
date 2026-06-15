'use client';

import { useMemo } from 'react';
import { Text } from '@/components/common';
import {
	getArticleSeoAudit,
	getArticleSeoStatusLabel,
	type ArticleSeoAuditInput,
} from '@/lib/articleSeoAudit';

const STATUS_STYLES = {
	good: 'border-green-200 bg-green-50',
	'needs-work': 'border-amber-200 bg-amber-50',
	critical: 'border-red-200 bg-red-50',
} as const;

const STATUS_TEXT_STYLES = {
	good: 'text-green-800',
	'needs-work': 'text-amber-800',
	critical: 'text-red-800',
} as const;

const SEVERITY_DOT = {
	critical: 'bg-red-500',
	warning: 'bg-amber-500',
	info: 'bg-blue-500',
} as const;

interface ArticleSeoChecklistProps {
	article: ArticleSeoAuditInput;
}

export default function ArticleSeoChecklist({ article }: ArticleSeoChecklistProps) {
	const audit = useMemo(() => getArticleSeoAudit(article), [article]);

	return (
		<div className={`rounded-lg border p-4 ${STATUS_STYLES[audit.status]}`}>
			<div className="flex flex-wrap items-center justify-between gap-2 mb-3">
				<Text className="text-sm font-semibold text-gray-900">SEO Checklist</Text>
				<div className="flex items-center gap-2">
					<span className={`text-sm font-medium ${STATUS_TEXT_STYLES[audit.status]}`}>
						{getArticleSeoStatusLabel(audit.status)}
					</span>
					<span className="text-sm text-gray-600">· {audit.score}/100</span>
				</div>
			</div>

			{audit.issues.length === 0 ? (
				<Text className="text-sm text-green-800">
					No SEO issues detected for the current draft.
				</Text>
			) : (
				<ul className="space-y-2">
					{audit.issues.map((issue) => (
						<li key={issue.key} className="flex items-start gap-2">
							<span
								className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[issue.severity]}`}
								aria-hidden
							/>
							<div>
								<Text className="text-sm font-medium text-gray-900">{issue.label}</Text>
								{issue.detail && (
									<Text className="text-xs text-gray-600 mt-0.5">{issue.detail}</Text>
								)}
							</div>
						</li>
					))}
				</ul>
			)}

			<Text className="text-xs text-gray-500 mt-3">
				Advisory only — saving is never blocked by SEO checks.
			</Text>
		</div>
	);
}
