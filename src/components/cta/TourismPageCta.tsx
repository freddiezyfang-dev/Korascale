'use client';

import Link from 'next/link';
import { useId, useState } from 'react';

import { cn } from '@/design-system/utils/cn';
import {
	PlanTripModal,
	type PlanTripModalInquiryConfig,
} from '@/components/modals/PlanTripModal';

const FONT_SERIF = 'var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif';
const FONT_SANS = 'var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif';

/** Flowing left edge for desktop image — green fills left of curve via section background. */
const DESKTOP_IMAGE_CLIP =
	'M 0.2 0 C 0.11 0.16, 0.07 0.34, 0.13 0.5 C 0.06 0.66, 0.1 0.82, 0.17 1 L 1 1 L 1 0 Z';

/** Gentle top curve on mobile — copy sits above, curve does not overlap button area. */
const MOBILE_IMAGE_CLIP =
	'M 0 0.07 C 0.22 0.01, 0.42 0.05, 0.62 0.02 C 0.8 0.06, 0.9 0.03, 1 0.08 L 1 1 L 0 1 Z';

export interface TourismPageCtaProps {
	title: string;
	description: string;
	buttonLabel: string;
	image: {
		src: string;
		alt: string;
	};
	href?: string;
	onClick?: () => void;
	inquiry?: PlanTripModalInquiryConfig;
	sourcePage?: string;
	journeyId?: string;
	journeySlug?: string;
	articleId?: string;
	destinationId?: string;
	className?: string;
}

function CtaButtonContent({ label }: { label: string }) {
	return (
		<>
			<span>{label}</span>
			<span aria-hidden="true" className="text-base leading-none">
				→
			</span>
		</>
	);
}

export function TourismPageCta({
	title,
	description,
	buttonLabel,
	image,
	href,
	onClick,
	inquiry,
	sourcePage,
	journeyId,
	journeySlug,
	articleId,
	destinationId,
	className,
}: TourismPageCtaProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const desktopClipId = useId();
	const mobileClipId = useId();

	const trimmedTitle = title?.trim();
	const trimmedDescription = description?.trim();
	const trimmedButtonLabel = buttonLabel?.trim();
	const imageSrc = image?.src?.trim();
	const imageAlt = image?.alt?.trim();

	if (
		!trimmedTitle ||
		!trimmedDescription ||
		!trimmedButtonLabel ||
		!imageSrc ||
		!imageAlt
	) {
		return null;
	}

	const useHref = Boolean(href?.trim());
	const useModal = !useHref && Boolean(inquiry || onClick);

	if (!useHref && !useModal) {
		return null;
	}

	const resolvedInquiry: PlanTripModalInquiryConfig | undefined = inquiry
		? {
				...inquiry,
				sourcePage: inquiry.sourcePage ?? sourcePage,
				sourceContext: {
					...(inquiry.sourceContext ?? {}),
					...(journeyId ? { journeyId } : {}),
					...(journeySlug ? { journeySlug } : {}),
					...(articleId ? { articleId } : {}),
					...(destinationId ? { destinationId } : {}),
				},
			}
		: undefined;

	const handleButtonClick = () => {
		if (onClick) {
			onClick();
			return;
		}
		if (resolvedInquiry) {
			setIsModalOpen(true);
		}
	};

	const buttonClassName = cn(
		'inline-flex h-[52px] md:h-[54px] w-full md:w-fit items-center justify-center gap-2.5',
		'rounded-md bg-[#f5f2e9] px-7 md:px-9',
		'text-sm font-medium uppercase tracking-widest text-[#1e3b32]',
		'transition-colors hover:bg-white',
		'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f2e9]',
	);

	return (
		<>
			<section
				data-testid="tourism-page-cta"
				className={cn('w-full overflow-x-hidden bg-[#1e3b32]', className)}
				aria-labelledby="tourism-page-cta-title"
			>
				<div className="mx-auto w-full max-w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-10 md:py-12">
					<div className="relative flex min-h-0 flex-col overflow-hidden md:min-h-[420px] md:max-h-[480px] md:flex-row">
						{/* Shared clipPath definitions */}
						<svg
							className="pointer-events-none absolute h-0 w-0 overflow-hidden"
							aria-hidden="true"
							focusable="false"
						>
							<defs>
								<clipPath id={desktopClipId} clipPathUnits="objectBoundingBox">
									<path d={DESKTOP_IMAGE_CLIP} />
								</clipPath>
								<clipPath id={mobileClipId} clipPathUnits="objectBoundingBox">
									<path d={MOBILE_IMAGE_CLIP} />
								</clipPath>
							</defs>
						</svg>

						{/* Copy — desktop left ~44% */}
						<div className="relative z-10 flex shrink-0 flex-col justify-center px-2 py-8 sm:px-4 md:w-[44%] md:py-10 md:pr-6 lg:pr-10">
							<h2
								id="tourism-page-cta-title"
								className="mb-4 text-[34px] leading-[1.1] text-white sm:text-[38px] md:text-[48px] md:leading-[1.08] lg:text-[54px] xl:text-[58px]"
								style={{ fontFamily: FONT_SERIF, fontWeight: 400 }}
							>
								{trimmedTitle}
							</h2>
							<p
								className="mb-8 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base"
								style={{ fontFamily: FONT_SANS }}
							>
								{trimmedDescription}
							</p>
							{useHref ? (
								<Link href={href!} className={buttonClassName}>
									<CtaButtonContent label={trimmedButtonLabel} />
								</Link>
							) : (
								<button type="button" className={buttonClassName} onClick={handleButtonClick}>
									<CtaButtonContent label={trimmedButtonLabel} />
								</button>
							)}
						</div>

						{/* Desktop image — ~56%, clipped flowing left edge, flush right */}
						<div className="relative hidden min-h-0 flex-1 md:block md:min-h-[420px]">
							<img
								src={imageSrc}
								alt={imageAlt}
								className="absolute inset-0 h-full w-full object-cover object-center"
								style={{ clipPath: `url(#${desktopClipId})` }}
							/>
						</div>

						{/* Mobile image — below copy, top curve only */}
						<div className="relative mt-2 h-[220px] shrink-0 sm:h-[260px] md:hidden">
							<img
								src={imageSrc}
								alt={imageAlt}
								className="absolute inset-0 h-full w-full object-cover object-center"
								style={{ clipPath: `url(#${mobileClipId})` }}
							/>
						</div>
					</div>
				</div>
			</section>

			{resolvedInquiry ? (
				<PlanTripModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					inquiry={resolvedInquiry}
				/>
			) : null}
		</>
	);
}
