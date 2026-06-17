import Link from 'next/link';
import { getArticleCanonicalPath, getArticleCategoryLabel } from '@/lib/articleCategories';
import { getRenderableImageUrl } from '@/lib/imageUtils';
import type { Article } from '@/types/article';

export type SidebarArticle = Pick<
	Article,
	'id' | 'slug' | 'title' | 'category' | 'coverImage' | 'heroImage' | 'readingTime'
>;

interface CompactRelatedArticleItemProps {
	article: SidebarArticle;
}

export default function CompactRelatedArticleItem({ article }: CompactRelatedArticleItemProps) {
	const href = getArticleCanonicalPath(article);
	const imageUrl = getRenderableImageUrl(article.coverImage || article.heroImage);
	const categoryLabel = getArticleCategoryLabel(article).toUpperCase();
	const readingTime = article.readingTime?.trim() || '12 min read';

	return (
		<Link
			href={href}
			className="group grid grid-cols-[104px_minmax(0,1fr)] gap-4 py-5 first:pt-0 last:pb-0 border-b border-gray-200/80 last:border-b-0 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3b32] focus-visible:ring-offset-2"
		>
			<div className="relative w-[104px] aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 shrink-0">
				<img
					src={imageUrl}
					alt={article.title}
					sizes="104px"
					className="absolute inset-0 h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
					loading="lazy"
				/>
			</div>
			<div className="min-w-0 flex flex-col justify-center">
				<p className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-500 mb-1.5 leading-snug">
					{categoryLabel}
				</p>
				<h3
					className="font-heading text-[1.05rem] leading-[1.25] text-[#111] mb-2 transition-colors group-hover:text-[#1e3b32] [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden"
					style={{ fontFamily: 'Playfair Display, serif' }}
				>
					{article.title}
				</h3>
				<p className="text-sm text-gray-500 leading-none">
					{readingTime}
					<span
						aria-hidden="true"
						className="inline-block ml-1 transition-transform duration-200 group-hover:translate-x-0.5"
					>
						→
					</span>
				</p>
			</div>
		</Link>
	);
}
