'use client';

import { TourismPageCta } from '@/components/cta/TourismPageCta';
import { getInspirationCategoryCta } from '@/lib/tourismPageCtaContent';

type InspirationCategoryCtaProps = {
	categorySlug: string;
	categoryName: string;
};

export function InspirationCategoryCta({
	categorySlug,
	categoryName,
}: InspirationCategoryCtaProps) {
	const copy = getInspirationCategoryCta(categorySlug);
	if (!copy) return null;

	return (
		<TourismPageCta
			title={copy.title}
			description={copy.description}
			buttonLabel={copy.buttonLabel}
			image={{
				src: copy.image,
				alt: `${categoryName} travel inspiration in China`,
			}}
			sourcePage={`/inspirations/${categorySlug}`}
			inquiry={{
				intent: 'custom_journey',
				sourceType: 'article',
				sourcePage: `/inspirations/${categorySlug}`,
				sourceSlug: categorySlug,
				sourceContext: {
					category: categorySlug,
					categoryName,
				},
			}}
		/>
	);
}
