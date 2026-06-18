'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import FeaturedEditorialCard from './FeaturedEditorialCard';
import styles from './FeaturedArticlesCarousel.module.css';

export interface FeaturedCarouselArticle {
	id: string;
	href: string;
	title: string;
	category: string;
	image: string;
}

interface FeaturedArticlesCarouselProps {
	articles: FeaturedCarouselArticle[];
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export default function FeaturedArticlesCarousel({ articles }: FeaturedArticlesCarouselProps) {
	const trackRef = useRef<HTMLDivElement>(null);
	const [activeSnap, setActiveSnap] = useState(0);
	const [snapCount, setSnapCount] = useState(1);
	const [canScrollPrev, setCanScrollPrev] = useState(false);
	const [canScrollNext, setCanScrollNext] = useState(false);

	const updateScrollState = useCallback(() => {
		const track = trackRef.current;
		if (!track || articles.length === 0) {
			setSnapCount(1);
			setCanScrollPrev(false);
			setCanScrollNext(false);
			setActiveSnap(0);
			return;
		}

		const cards = track.querySelectorAll<HTMLElement>('[data-featured-card]');
		if (cards.length === 0) return;

		const firstCard = cards[0];
		const cardWidth = firstCard.offsetWidth;
		if (cardWidth <= 0) return;

		const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0');
		const stride = cardWidth + gap;
		const visibleCards = Math.max(1, Math.floor((track.clientWidth + gap) / stride));
		const maxSnap = Math.max(0, articles.length - visibleCards);
		const nextSnapCount = maxSnap + 1;

		setSnapCount(nextSnapCount);

		const rawIndex = Math.round(track.scrollLeft / stride);
		const nextActive = clamp(rawIndex, 0, maxSnap);
		setActiveSnap(nextActive);
		setCanScrollPrev(track.scrollLeft > 4);
		setCanScrollNext(track.scrollLeft < track.scrollWidth - track.clientWidth - 4);
	}, [articles.length]);

	useEffect(() => {
		updateScrollState();
		const track = trackRef.current;
		if (!track) return;

		const observer = new ResizeObserver(() => updateScrollState());
		observer.observe(track);

		const onScroll = () => updateScrollState();
		track.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', updateScrollState);

		return () => {
			observer.disconnect();
			track.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', updateScrollState);
		};
	}, [updateScrollState, articles]);

	const scrollToSnap = useCallback((index: number) => {
		const track = trackRef.current;
		if (!track) return;

		const cards = track.querySelectorAll<HTMLElement>('[data-featured-card]');
		const target = cards[index];
		if (!target) return;

		track.scrollTo({
			left: target.offsetLeft - track.offsetLeft,
			behavior: 'smooth',
		});
	}, []);

	const scrollByCard = useCallback(
		(direction: -1 | 1) => {
			const track = trackRef.current;
			if (!track) return;

			const cards = track.querySelectorAll<HTMLElement>('[data-featured-card]');
			if (cards.length === 0) return;

			const firstCard = cards[0];
			const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0');
			const stride = firstCard.offsetWidth + gap;
			const visibleCards = Math.max(1, Math.floor((track.clientWidth + gap) / stride));
			const maxSnap = Math.max(0, articles.length - visibleCards);
			const nextSnap = clamp(activeSnap + direction, 0, maxSnap);
			scrollToSnap(nextSnap);
		},
		[activeSnap, articles.length, scrollToSnap]
	);

	const showControls = articles.length > 1 && snapCount > 1;

	if (articles.length === 1) {
		return (
			<div className={styles.singleCardWrap}>
				<FeaturedEditorialCard
					href={articles[0].href}
					title={articles[0].title}
					category={articles[0].category}
					image={articles[0].image}
					priority
				/>
			</div>
		);
	}

	return (
		<div
			className={styles.wrapper}
			role="region"
			aria-roledescription="carousel"
			aria-label="Featured articles"
			onKeyDown={(event) => {
				if (event.key === 'ArrowLeft') {
					event.preventDefault();
					if (canScrollPrev) scrollByCard(-1);
				}
				if (event.key === 'ArrowRight') {
					event.preventDefault();
					if (canScrollNext) scrollByCard(1);
				}
			}}
		>
			{showControls ? (
				<>
					<button
						type="button"
						onClick={() => scrollByCard(-1)}
						disabled={!canScrollPrev}
						aria-label="Previous featured articles"
						className={`${styles.navButton} ${styles.navPrev}`}
					>
						<ChevronLeft className="h-5 w-5" aria-hidden="true" />
					</button>
					<button
						type="button"
						onClick={() => scrollByCard(1)}
						disabled={!canScrollNext}
						aria-label="Next featured articles"
						className={`${styles.navButton} ${styles.navNext}`}
					>
						<ChevronRight className="h-5 w-5" aria-hidden="true" />
					</button>
				</>
			) : null}

			<div ref={trackRef} tabIndex={0} className={styles.track}>
				{articles.map((article, index) => (
					<div key={article.id} data-featured-card className={styles.cardShell}>
						<FeaturedEditorialCard
							href={article.href}
							title={article.title}
							category={article.category}
							image={article.image}
							priority={index < 2}
						/>
					</div>
				))}
			</div>

			{showControls ? (
				<div className={styles.dots} role="tablist" aria-label="Featured article groups">
					{Array.from({ length: snapCount }, (_, index) => (
						<button
							key={index}
							type="button"
							role="tab"
							aria-selected={index === activeSnap}
							aria-label={`Go to featured article group ${index + 1}`}
							onClick={() => scrollToSnap(index)}
							className={`${styles.dot} ${index === activeSnap ? styles.dotActive : ''}`}
						/>
					))}
				</div>
			) : null}
		</div>
	);
}
