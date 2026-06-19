'use client';

import Link from 'next/link';
import { useState } from 'react';

import { PlanTripModal } from '@/components/modals/PlanTripModal';
import { getCtaDisplayBody, isPlanTripCtaHref, type ResolvedArticleCta } from '@/lib/articleCta';

import styles from './ArticlePrimaryCta.module.css';

interface ArticlePrimaryCtaProps {
	cta: ResolvedArticleCta;
	/** Reserved for future inquiry source tracking (PR-C1). */
	articleSlug?: string;
	/** Reserved for future inquiry source tracking (PR-C1). */
	sourcePage?: string;
}

function isExternalHref(href: string): boolean {
	return /^https?:\/\//i.test(href);
}

export default function ArticlePrimaryCta({
	cta,
	articleSlug,
	sourcePage,
}: ArticlePrimaryCtaProps) {
	const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
	const headingId = 'article-primary-cta-title';
	const hasSecondary = Boolean(cta.secondaryLabel?.trim() && cta.secondaryHref?.trim());
	const bodyCopy = getCtaDisplayBody(cta);
	const usePlanTripModal = isPlanTripCtaHref(cta.primaryHref);

	const trackingProps = {
		...(articleSlug ? { 'data-article-slug': articleSlug } : {}),
		...(sourcePage ? { 'data-source-page': sourcePage } : {}),
	};

	return (
		<section
			aria-labelledby={headingId}
			className={`article-primary-cta ${styles.section}`}
		>
			<div className={styles.inner}>
				<div className={styles.content}>
					<h2 id={headingId} className={styles.heading}>
						{cta.heading}
					</h2>

					{bodyCopy ? <p className={styles.body}>{bodyCopy}</p> : null}

					<div className={styles.actions}>
						{usePlanTripModal ? (
							<button
								type="button"
								className={styles.primaryLink}
								data-cta-primary
								{...trackingProps}
								onClick={() => setIsPlanModalOpen(true)}
							>
								{cta.primaryLabel}
							</button>
						) : (
							<Link
								href={cta.primaryHref}
								target={isExternalHref(cta.primaryHref) ? '_blank' : undefined}
								rel={
									isExternalHref(cta.primaryHref)
										? 'noopener noreferrer'
										: undefined
								}
								className={styles.primaryLink}
								data-cta-primary
								{...trackingProps}
							>
								{cta.primaryLabel}
							</Link>
						)}

						{hasSecondary ? (
							<Link
								href={cta.secondaryHref!}
								target={isExternalHref(cta.secondaryHref!) ? '_blank' : undefined}
								rel={
									isExternalHref(cta.secondaryHref!)
										? 'noopener noreferrer'
										: undefined
								}
								className={styles.secondaryLink}
								data-cta-secondary
							>
								{cta.secondaryLabel}
								<span aria-hidden="true" className={styles.secondaryArrow}>
									→
								</span>
							</Link>
						) : null}
					</div>
				</div>
			</div>

			{usePlanTripModal ? (
				<PlanTripModal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} />
			) : null}
		</section>
	);
}
