import Link from 'next/link';
import { Container, Section, Heading, Text, Breadcrumb } from '@/components/common';
import FeaturedArticlesCarousel from '@/components/articles/FeaturedArticlesCarousel';
import { TourismPageCta } from '@/components/cta/TourismPageCta';
import {
	INSPIRATIONS_LIST_CTA,
	TOURISM_CTA_FALLBACK_IMAGE,
} from '@/lib/tourismPageCtaContent';
import { getRenderableImageUrl } from '@/lib/imageUtils';
import type { ArticleListItem } from '@/lib/articleQuery.server';
import {
	getArticleCanonicalPath,
	getArticleCategoryLabel,
	CANONICAL_ARTICLE_CATEGORIES,
	CANONICAL_CATEGORY_TO_DESCRIPTION,
	CANONICAL_CATEGORY_TO_HERO_IMAGE,
	getCanonicalCategorySlug,
} from '@/lib/articleCategories';

const imgHeroBanner = '/images/hero/slide7-emeishan.jpg';

const inspirations = CANONICAL_ARTICLE_CATEGORIES.map((category, index) => ({
	id: index + 1,
	category,
	title: category,
	slug: getCanonicalCategorySlug(category),
	image: CANONICAL_CATEGORY_TO_HERO_IMAGE[category],
	description: CANONICAL_CATEGORY_TO_DESCRIPTION[category],
	isFullWidth: index === 0,
}));

interface InspirationsPageViewProps {
	featuredArticles: ArticleListItem[];
}

export default function InspirationsPageView({ featuredArticles }: InspirationsPageViewProps) {
	const inspHeadingClass = 'text-2xl font-serif text-[#111] mb-4';
	const inspBodyClass = 'text-[17px] md:text-[18px] text-gray-700 leading-[1.7] font-sans';
	const featuredCarouselArticles = featuredArticles.map((article) => ({
		id: article.id,
		href: getArticleCanonicalPath(article),
		title: article.title,
		category: getArticleCategoryLabel(article),
		image: getRenderableImageUrl(article.heroImage || article.coverImage),
	}));

	return (
		<main>
			<Section background="primary" padding="none" className="relative h-[800px] overflow-hidden">
				<div
					className="absolute inset-0 bg-cover bg-center bg-no-repeat"
					style={{
						backgroundImage: `url('${imgHeroBanner}')`,
						filter: 'brightness(1.3) contrast(1.1)',
					}}
				/>
				<div className="absolute inset-0 bg-white/15" />
				<div className="absolute inset-0 bg-black/30" />

				<div className="relative z-10 pt-6 pl-6 md:pt-8 md:pl-12">
					<Breadcrumb
						items={[{ label: 'Home', href: '/' }, { label: 'Inspirations' }]}
						color="#FFFFFF"
						sizeClassName="text-lg md:text-xl"
					/>
				</div>

				<div className="relative z-10 h-full flex items-center justify-center px-4">
					<div className="text-center text-white max-w-4xl">
						<Heading
							level={1}
							className="text-6xl md:text-7xl lg:text-8xl font-normal mb-2 tracking-tight"
							style={{
								fontFamily: 'Montserrat, sans-serif',
								color: '#FFFFFF',
							}}
						>
							Inspirations
						</Heading>
					</div>
				</div>
			</Section>

			<Section background="secondary" padding="xl" className="py-20">
				<Container size="xl">
					<div className="max-w-4xl mx-auto text-center">
						<Text
							className="text-lg md:text-xl font-body font-light leading-relaxed text-[#4A4A4A]"
							style={{
								fontFamily: 'Monda, sans-serif',
								lineHeight: '2.0',
								letterSpacing: '0.01em',
							}}
						>
							From chic retreats nestled in ancient mountain villages to soul-stirring locations
							where tradition meets transformation, our inspirations guide you to places that
							resonate beyond the surface. Each destination we feature has been carefully selected
							not just for its beauty, but for its ability to offer genuine encounters with the
							living culture of Western China.
						</Text>
					</div>
				</Container>
			</Section>

			{featuredArticles.length > 0 && (
				<section
					aria-labelledby="featured-articles-title"
					className="w-full bg-[#f5f1e6] py-14 md:py-20 lg:py-24"
				>
					<div className="mx-auto w-full max-w-screen-2xl">
						<header className="mx-auto mb-10 max-w-2xl px-4 text-center md:mb-12">
							<h2
								id="featured-articles-title"
								className="mb-3 text-3xl md:text-4xl font-heading text-[#111] leading-tight"
								style={{ fontFamily: 'Playfair Display, serif' }}
							>
								Featured Articles
							</h2>
							<Text className="text-[17px] leading-relaxed text-gray-600 font-sans">
								Handpicked insights on China travel planning, routes, culture, and business
								travel — curated for readers who want depth before they go.
							</Text>
						</header>

						<FeaturedArticlesCarousel articles={featuredCarouselArticles} />
					</div>
				</section>
			)}

			<Section background="secondary" padding="xl" className="py-24">
				<Container size="xl">
					<Link
						href={`/inspirations/${inspirations[0].slug}`}
						className="block mb-16 group cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl"
					>
						<div className="relative min-h-[280px] md:min-h-[300px] h-auto rounded-lg overflow-hidden">
							<img
								src={inspirations[0].image}
								alt={inspirations[0].title}
								className="absolute inset-0 w-full h-full min-h-[280px] md:min-h-[300px] object-cover object-left group-hover:scale-110 transition-transform duration-300"
							/>
							<div className="relative min-h-[280px] md:min-h-[300px] flex items-center justify-start pl-5 sm:pl-6 md:pl-8 lg:pl-10 pr-4 md:pr-8 py-6 md:py-8 bg-black/20 group-hover:bg-black/40 transition-all duration-300">
								<div className="bg-white/95 backdrop-blur-sm p-7 md:p-9 rounded-lg max-w-md md:max-w-xl lg:max-w-2xl shadow-lg flex flex-col justify-center w-full sm:w-auto">
									<Heading level={3} className={`${inspHeadingClass} text-left`}>
										{inspirations[0].title}
									</Heading>
									<Text className="text-[17px] text-gray-700 leading-relaxed font-sans line-clamp-4 mb-5 md:mb-6 text-left">
										{inspirations[0].description}
									</Text>
									<span className="text-xs font-sans font-semibold uppercase tracking-wider underline group-hover:text-[#c0a273] block text-left text-[#1e3b32] transition-colors duration-300">
										View more
									</span>
								</div>
							</div>
						</div>
					</Link>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
						{inspirations.slice(1).map((inspiration) => (
							<Link
								key={inspiration.id}
								href={`/inspirations/${inspiration.slug}`}
								className="group block cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
							>
								<div className="relative h-[357px] rounded-lg overflow-hidden mb-6">
									<img
										src={inspiration.image}
										alt={inspiration.title}
										className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
									/>
								</div>
								<div className="text-center px-4 md:px-8 max-w-2xl mx-auto">
									<Heading level={3} className={inspHeadingClass}>
										{inspiration.title}
									</Heading>
									<Text className={`${inspBodyClass} mb-6 px-1`}>{inspiration.description}</Text>
									<span className="text-xs font-sans font-semibold uppercase tracking-wider underline group-hover:text-[#c0a273] text-[#1e3b32] transition-colors duration-300">
										View more
									</span>
								</div>
							</Link>
						))}
					</div>
				</Container>
			</Section>

			<TourismPageCta
				title={INSPIRATIONS_LIST_CTA.title}
				description={INSPIRATIONS_LIST_CTA.description}
				buttonLabel={INSPIRATIONS_LIST_CTA.buttonLabel}
				image={{
					src: TOURISM_CTA_FALLBACK_IMAGE,
					alt: 'Travel inspiration in China',
				}}
				sourcePage="/inspirations"
				inquiry={{
					intent: 'custom_journey',
					sourceType: 'direct',
					sourcePage: '/inspirations',
				}}
			/>
		</main>
	);
}
