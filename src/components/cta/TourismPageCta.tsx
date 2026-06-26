'use client';

import Link from 'next/link';
import { useState } from 'react';

import { cn } from '@/design-system/utils/cn';
import {
	PlanTripModal,
	type PlanTripModalInquiryConfig,
} from '@/components/modals/PlanTripModal';

const FONT_SERIF = 'var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif';
const FONT_SANS = 'var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif';

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

function BrandCurveOverlay() {
	return (
		<svg
			className="pointer-events-none absolute inset-y-0 left-0 z-[1] hidden h-full w-[38%] md:block"
			viewBox="0 0 120 320"
		 preserveAspectRatio="none"
		 aria-hidden="true"
		>
			<path
				d="M120 0 C72 48 88 128 64 176 C40 224 72 272 120 320 L120 0 Z"
				fill="#1e3b32"
			/>
			<path
				d="M120 0 C84 56 96 120 72 168 C48 216 76 264 120 320"
				fill="none"
				stroke="rgba(245, 242, 233, 0.18)"
				strokeWidth="1.5"
			/>
		</svg>
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

	const buttonClassName =
		'inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#f5f2e9] px-8 py-3 text-sm font-medium uppercase tracking-widest text-[#1e3b32] transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f2e9]';

	return (
		<>
			<section
				data-testid="tourism-page-cta"
				className={cn('w-full bg-[#1e3b32]', className)}
				aria-labelledby="tourism-page-cta-title"
			>
				<div className="mx-auto w-full max-w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-10 md:py-12">
					<div className="overflow-hidden rounded-lg bg-[#1e3b32]">
						<div className="flex flex-col md:flex-row md:min-h-[320px]">
							<div className="flex flex-col justify-center px-6 py-10 md:w-[45%] md:px-10 lg:px-14">
								<h2
									id="tourism-page-cta-title"
									className="mb-4 text-2xl leading-tight text-white sm:text-3xl lg:text-4xl"
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
										{trimmedButtonLabel}
									</Link>
								) : (
									<button type="button" className={buttonClassName} onClick={handleButtonClick}>
										{trimmedButtonLabel}
									</button>
								)}
							</div>

							<div className="relative min-h-[220px] md:min-h-0 md:w-[55%]">
								<BrandCurveOverlay />
								<img
									src={imageSrc}
									alt={imageAlt}
									className="absolute inset-0 h-full w-full object-cover"
								/>
								<div
									className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1e3b32]/80 via-[#1e3b32]/20 to-transparent md:from-[#1e3b32]/60 md:via-transparent"
									aria-hidden="true"
								/>
							</div>
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
