'use client';

import { useEffect, type ReactNode } from 'react';
import { CategoryExplorer } from '@/components/sections';
import OurPerspectiveSection from '@/components/sections/OurPerspectiveSection';
import TheLensBehindKorascaleSection from '@/components/sections/TheLensBehindKorascaleSection';
import { useJourneyManagement } from '@/context/JourneyManagementContext';
import {
	CANONICAL_ARTICLE_CATEGORIES,
	CANONICAL_CATEGORY_TO_DESCRIPTION,
	CANONICAL_CATEGORY_TO_HERO_IMAGE,
	getCanonicalCategorySlug,
} from '@/lib/articleCategories';

const homeInspirationCards = CANONICAL_ARTICLE_CATEGORIES.map((cat, i) => ({
	id: String(i + 1),
	title: cat,
	shortDescription: CANONICAL_CATEGORY_TO_DESCRIPTION[cat],
	image: CANONICAL_CATEGORY_TO_HERO_IMAGE[cat],
	slug: getCanonicalCategorySlug(cat),
	href: `/inspirations/${getCanonicalCategorySlug(cat)}`,
}));

interface HomePageClientProps {
	mosaicSection: ReactNode;
}

export default function HomePageClient({ mosaicSection }: HomePageClientProps) {
	const { journeys } = useJourneyManagement();

	useEffect(() => {
		if (!window.location.hash) window.scrollTo(0, 0);
	}, []);

	return (
		<div className="min-h-screen bg-white">
			<div className="w-full flex flex-col">
				<div className="relative w-full h-[85vh] min-h-[600px] overflow-hidden">
					<div className="absolute inset-0 z-0">
						<video
							src={process.env.NEXT_PUBLIC_HERO_VIDEO_URL || '/videos/Herobanner1.mp4'}
							autoPlay
							loop
							muted
							playsInline
							className="w-full h-full object-cover"
						/>
						<div className="absolute inset-0 bg-black/20 z-10" />
					</div>

					<div className="relative z-20 flex items-center justify-center h-full">
						<div className="text-center text-white px-6 max-w-6xl">
							<h1
								className="text-5xl md:text-8xl font-heading leading-[1.05] tracking-tight drop-shadow-2xl text-white"
								style={{ color: '#FFFFFF' }}
							>
								Korascale designs journeys through a <br className="hidden md:block" /> China
								that is still in motion.
							</h1>
						</div>
					</div>
				</div>

				<section className="w-full bg-[#FAF9F6] py-24 md:py-48 border-b border-gray-100">
					<div className="max-w-7xl mx-auto px-8 text-center flex flex-col gap-16 md:gap-20">
						<p className="text-3xl md:text-5xl font-heading italic text-[#111] leading-[1.3] tracking-tight max-w-5xl mx-auto">
							&quot;China is often presented in extremes — ancient civilizations or futuristic
							megacities. We work in the space in between.&quot;
						</p>
						<p className="text-lg md:text-xl font-body font-light text-[#555] leading-[2.0] tracking-wide max-w-3xl mx-auto opacity-90">
							Our journeys move through borderlands, highlands, and evolving communities, where
							traditions are negotiated rather than preserved, and landscapes are lived in rather
							than staged. We choose places carefully, return to them often, and leave when they
							no longer make sense.
						</p>
					</div>
				</section>
			</div>

			<CategoryExplorer
				journeys={journeys}
				destinations={[
					{
						id: '1',
						title: 'Southwest China',
						shortDescription: 'Explore the diverse landscapes and rich cultural heritage',
						image: '/images/journey-cards/chengdu-deep-dive.jpeg',
						slug: 'southwest-china',
						href: '/destinations/southwest-china',
					},
					{
						id: '2',
						title: 'Northwest & Northern Frontier',
						shortDescription: 'Discover the frontier regions with stunning natural beauty',
						image: '/images/journey-cards/Northwest.jpg',
						slug: 'northwest',
						href: '/destinations/northwest',
					},
					{
						id: '3',
						title: 'North China',
						shortDescription: 'Experience the historical heartland of ancient China',
						image: '/images/journey-cards/North China.jpg',
						slug: 'north',
						href: '/destinations/north',
					},
					{
						id: '4',
						title: 'South China',
						shortDescription: 'Immerse yourself in the vibrant culture and cuisine',
						image: '/images/journey-cards/chengdu-deep-dive.jpeg',
						slug: 'south',
						href: '/destinations/south',
					},
					{
						id: '5',
						title: 'East & Central China',
						shortDescription: 'Journey through the economic and cultural centers',
						image: '/images/journey-cards/chengdu-deep-dive.jpeg',
						slug: 'east-central',
						href: '/destinations/east-central',
					},
				]}
				inspirations={homeInspirationCards}
			/>

			{mosaicSection}

			<OurPerspectiveSection
				imageSrc="/images/brand-philosophy/WechatIMG160.jpg"
				videoSrc="/videos/brand-philosophy/1月7日 .mp4"
			/>

			<TheLensBehindKorascaleSection backgroundImage="/images/brand-philosophy/WechatIMG160.jpg" />
		</div>
	);
}
