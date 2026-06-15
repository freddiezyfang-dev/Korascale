'use client';

import { Text } from '@/components/common';

function getPageTitleLengthHint(length: number): { label: string; className: string } {
	if (length === 0) return { label: 'Missing', className: 'text-gray-500' };
	if (length < 50) return { label: 'Short', className: 'text-amber-600' };
	if (length <= 65) return { label: 'Good', className: 'text-green-600' };
	return { label: 'Long', className: 'text-amber-600' };
}

function getMetaDescriptionLengthHint(length: number): { label: string; className: string } {
	if (length === 0) return { label: 'Missing', className: 'text-gray-500' };
	if (length < 140) return { label: 'Short', className: 'text-amber-600' };
	if (length <= 160) return { label: 'Good', className: 'text-green-600' };
	return { label: 'Long', className: 'text-amber-600' };
}

interface ArticleSeoFieldsProps {
	pageTitle: string;
	metaDescription: string;
	onPageTitleChange: (value: string) => void;
	onMetaDescriptionChange: (value: string) => void;
}

export default function ArticleSeoFields({
	pageTitle,
	metaDescription,
	onPageTitleChange,
	onMetaDescriptionChange,
}: ArticleSeoFieldsProps) {
	const pageTitleHint = getPageTitleLengthHint(pageTitle.length);
	const metaHint = getMetaDescriptionLengthHint(metaDescription.length);

	return (
		<div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-white">
			<h4 className="text-sm font-semibold text-gray-800">SEO Fields</h4>
			<div>
				<label className="block text-sm text-gray-600 mb-1">SEO Page Title</label>
				<input
					className="w-full border rounded px-3 py-2"
					value={pageTitle}
					onChange={(e) => onPageTitleChange(e.target.value)}
					placeholder="Custom title for search results and metadata"
				/>
				<div className="mt-1 flex items-center justify-between gap-2">
					<Text size="sm" className="text-gray-500">
						Recommended 50–65 characters. Used for search result title and metadata.
					</Text>
					<span className={`text-xs shrink-0 ${pageTitleHint.className}`}>
						{pageTitle.length} chars · {pageTitleHint.label}
					</span>
				</div>
			</div>
			<div>
				<label className="block text-sm text-gray-600 mb-1">Meta Description</label>
				<textarea
					className="w-full border rounded px-3 py-2"
					value={metaDescription}
					onChange={(e) => onMetaDescriptionChange(e.target.value)}
					rows={3}
					placeholder="Short summary for search snippets and social previews"
				/>
				<div className="mt-1 flex items-center justify-between gap-2">
					<Text size="sm" className="text-gray-500">
						Recommended 140–160 characters. Used for search snippets and social previews.
					</Text>
					<span className={`text-xs shrink-0 ${metaHint.className}`}>
						{metaDescription.length} chars · {metaHint.label}
					</span>
				</div>
			</div>
		</div>
	);
}
