'use client';

import { useMemo } from 'react';

import { Text } from '@/components/common';
import {
	getResolvedCtaPreviewLabel,
	resolveArticleCtaPreview,
	validateArticleCtaCustomFields,
	type ArticleCtaConfig,
	type ArticleCtaMode,
} from '@/lib/articleCta';
import type { ArticleCategory } from '@/types/article';

const MODE_OPTIONS: { value: ArticleCtaMode; label: string }[] = [
	{ value: 'auto', label: 'Automatic by category' },
	{ value: 'private_journey', label: 'Private Journey' },
	{ value: 'corporate_travel', label: 'Corporate Travel' },
	{ value: 'custom', label: 'Custom' },
	{ value: 'hidden', label: 'Hidden' },
];

const CHAR_HINTS = {
	eyebrow: 40,
	heading: 90,
	body: 240,
	supportingText: 160,
	buttonLabel: 40,
} as const;

interface ArticleCtaAdminSectionProps {
	category: ArticleCategory;
	ctaConfig: ArticleCtaConfig;
	onChange: (next: ArticleCtaConfig) => void;
	fieldErrors?: ReturnType<typeof validateArticleCtaCustomFields>;
}

export function createDefaultArticleCtaConfig(): ArticleCtaConfig {
	return { mode: 'auto' };
}

export function validateArticleCtaForSubmit(config: ArticleCtaConfig) {
	if (config.mode !== 'custom') {
		return { valid: true as const, errors: {} };
	}
	const errors = validateArticleCtaCustomFields(config);
	return { valid: Object.keys(errors).length === 0, errors };
}

export default function ArticleCtaAdminSection({
	category,
	ctaConfig,
	onChange,
	fieldErrors = {},
}: ArticleCtaAdminSectionProps) {
	const mode: ArticleCtaMode = ctaConfig.mode ?? 'auto';

	const preview = useMemo(
		() => resolveArticleCtaPreview({ category, ctaConfig }),
		[category, ctaConfig]
	);

	const updateField = <K extends keyof ArticleCtaConfig>(key: K, value: ArticleCtaConfig[K]) => {
		onChange({ ...ctaConfig, [key]: value });
	};

	return (
		<div className="space-y-4">
			<div>
				<label className="block text-sm font-semibold text-gray-700 mb-2">Article CTA</label>
				<Text size="sm" className="text-gray-500 mb-3">
					Choose how the call-to-action at the end of this article is generated.
				</Text>
				<select
					className="w-full border rounded px-3 py-2 text-sm"
					value={mode}
					onChange={(e) => updateField('mode', e.target.value as ArticleCtaMode)}
				>
					{MODE_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			{mode === 'hidden' ? (
				<div className="p-3 bg-gray-50 border border-gray-200 rounded">
					<Text size="sm" className="text-gray-700">
						The article will not display a primary CTA.
					</Text>
				</div>
			) : null}

			{mode === 'auto' ? (
				<div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
					<Text size="sm" className="text-gray-700 font-medium">
						Resolved template: {getResolvedCtaPreviewLabel('auto', category)}
					</Text>
					{preview ? (
						<>
							<Text size="sm" className="text-gray-600">
								{preview.heading}
							</Text>
							<Text size="sm" className="text-gray-500">
								{preview.body}
							</Text>
							<Text size="sm" className="text-gray-500">
								{preview.primaryLabel} · {preview.secondaryLabel}
							</Text>
						</>
					) : null}
				</div>
			) : null}

			{(mode === 'private_journey' || mode === 'corporate_travel') && preview ? (
				<div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-1">
					<Text size="sm" className="text-gray-700 font-medium">
						Template preview: {getResolvedCtaPreviewLabel(mode, category)}
					</Text>
					<Text size="sm" className="text-gray-600">
						{preview.heading}
					</Text>
					<Text size="sm" className="text-gray-500">
						{preview.body}
					</Text>
					<Text size="sm" className="text-gray-500">
						{preview.primaryLabel} · {preview.secondaryLabel}
					</Text>
				</div>
			) : null}

			{mode === 'custom' ? (
				<div className="space-y-3">
					{(
						[
							['eyebrow', 'Eyebrow', 'text'],
							['heading', 'Heading', 'text'],
							['body', 'Body', 'textarea'],
							['supportingText', 'Supporting text', 'textarea'],
							['primaryLabel', 'Primary button label', 'text'],
							['primaryHref', 'Primary button URL', 'text'],
							['secondaryLabel', 'Secondary button label', 'text'],
							['secondaryHref', 'Secondary button URL', 'text'],
						] as const
					).map(([key, label, inputType]) => {
						const hintKey =
							key === 'primaryLabel' || key === 'secondaryLabel'
								? 'buttonLabel'
								: key;
						const hint = CHAR_HINTS[hintKey as keyof typeof CHAR_HINTS];
						const error = fieldErrors[key as keyof typeof fieldErrors];
						const value = ctaConfig[key] ?? '';

						return (
							<div key={key}>
								<label className="block text-xs text-gray-600 mb-1">
									{label}
									{hint ? ` (suggested max ${hint} chars)` : ''}
								</label>
								{inputType === 'textarea' ? (
									<textarea
										className={`w-full border rounded px-3 py-2 text-sm ${error ? 'border-red-400' : ''}`}
										rows={key === 'body' ? 4 : 3}
										value={value}
										onChange={(e) => updateField(key, e.target.value)}
									/>
								) : (
									<input
										className={`w-full border rounded px-3 py-2 text-sm ${error ? 'border-red-400' : ''}`}
										value={value}
										onChange={(e) => updateField(key, e.target.value)}
									/>
								)}
								{error ? (
									<Text size="sm" className="text-red-600 mt-1">
										{error}
									</Text>
								) : null}
							</div>
						);
					})}
				</div>
			) : null}

			{mode !== 'hidden' && preview ? (
				<div className="p-4 bg-[#1e3b32] text-[#f5f1e6] rounded-xl space-y-3">
					<Text size="sm" className="uppercase tracking-[0.16em] text-[#f5f1e6]/70">
						CTA preview
					</Text>
					{preview.eyebrow ? (
						<Text size="sm" className="uppercase tracking-[0.14em] text-[#f5f1e6]/70">
							{preview.eyebrow}
						</Text>
					) : null}
					<p className="font-heading text-xl leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
						{preview.heading}
					</p>
					<Text size="sm" className="text-[#f5f1e6]/90">
						{preview.body}
					</Text>
					{preview.supportingText ? (
						<Text size="sm" className="text-[#f5f1e6]/75">
							{preview.supportingText}
						</Text>
					) : null}
					<div className="flex flex-wrap gap-2 pt-1">
						<span className="inline-flex rounded-lg bg-[#f5f1e6] px-3 py-2 text-xs font-semibold text-[#1e3b32]">
							{preview.primaryLabel}
						</span>
						{preview.secondaryLabel ? (
							<span className="inline-flex rounded-lg border border-[#f5f1e6]/45 px-3 py-2 text-xs font-medium text-[#f5f1e6]">
								{preview.secondaryLabel}
							</span>
						) : null}
					</div>
				</div>
			) : null}
		</div>
	);
}
