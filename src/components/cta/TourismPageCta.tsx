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
					<div className="overflow-hidden rounded-lg bg-[#1e3b32]">
						<div className="flex flex-col md:grid md:min-h-[400px] md:max-h-[460px] md:grid-cols-[44%_56%]">
							<div className="flex flex-col justify-center bg-[#1e3b32] px-2 py-8 sm:px-6 md:px-10 md:py-10 lg:px-14">
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

							<div className="relative h-[220px] shrink-0 sm:h-[260px] md:h-full md:min-h-[400px]">
								<img
									src={imageSrc}
									alt={imageAlt}
									className="absolute inset-0 h-full w-full object-cover object-center"
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
