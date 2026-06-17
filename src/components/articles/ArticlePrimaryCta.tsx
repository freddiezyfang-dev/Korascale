import Link from 'next/link';

import { getCtaDisplayBody, type ResolvedArticleCta } from '@/lib/articleCta';

import styles from './ArticlePrimaryCta.module.css';

interface ArticlePrimaryCtaProps {
	cta: ResolvedArticleCta;
}

function isExternalHref(href: string): boolean {
	return /^https?:\/\//i.test(href);
}

export default function ArticlePrimaryCta({ cta }: ArticlePrimaryCtaProps) {
	const headingId = 'article-primary-cta-title';
	const hasSecondary = Boolean(cta.secondaryLabel?.trim() && cta.secondaryHref?.trim());
	const bodyCopy = getCtaDisplayBody(cta);

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
						>
							{cta.primaryLabel}
						</Link>

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
		</section>
	);
}
