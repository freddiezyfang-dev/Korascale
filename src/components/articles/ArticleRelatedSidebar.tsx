import { Container } from '@/components/common';
import CompactRelatedArticleItem, {
	type SidebarArticle,
} from '@/components/articles/CompactRelatedArticleItem';

interface ArticleRelatedSidebarProps {
	relatedArticles: SidebarArticle[];
}

function RelatedArticlesHeading({ id }: { id?: string }) {
	return (
		<h2
			id={id}
			className="font-heading text-[1.75rem] leading-[1.1] text-[#111] mb-5"
			style={{ fontFamily: 'Playfair Display, serif' }}
		>
			Related Articles
		</h2>
	);
}

export function ArticleDesktopSidebar({ relatedArticles }: ArticleRelatedSidebarProps) {
	if (relatedArticles.length === 0) return null;

	return (
		<aside
			className="hidden lg:block lg:w-80 lg:flex-shrink-0"
			aria-labelledby="related-articles-title-desktop"
		>
			<div className="sticky top-28 self-start">
				<RelatedArticlesHeading id="related-articles-title-desktop" />
				<nav aria-label="Related articles" className="overflow-visible">
					{relatedArticles.map((article) => (
						<CompactRelatedArticleItem key={article.id} article={article} />
					))}
				</nav>
			</div>
		</aside>
	);
}

export function ArticleMobileSidebar({ relatedArticles }: ArticleRelatedSidebarProps) {
	if (relatedArticles.length === 0) return null;

	return (
		<section
			aria-labelledby="related-articles-title-mobile"
			className="bg-white py-20 w-full overflow-x-hidden lg:hidden"
		>
			<Container size="xl">
				<RelatedArticlesHeading id="related-articles-title-mobile" />
				<nav aria-label="Related articles" className="overflow-visible">
					{relatedArticles.map((article) => (
						<CompactRelatedArticleItem key={article.id} article={article} />
					))}
				</nav>
			</Container>
		</section>
	);
}
