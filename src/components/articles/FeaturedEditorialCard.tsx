import Link from 'next/link';

import styles from './FeaturedEditorialCard.module.css';

export interface FeaturedEditorialCardProps {
	href: string;
	title: string;
	category: string;
	image: string;
	priority?: boolean;
}

export default function FeaturedEditorialCard({
	href,
	title,
	category,
	image,
	priority = false,
}: FeaturedEditorialCardProps) {
	return (
		<Link href={href} className={styles.link}>
			<div className={styles.card}>
				<div className={styles.imageLayer}>
					<img
						src={image}
						alt={title}
						loading={priority ? 'eager' : 'lazy'}
						decoding="async"
						className={styles.image}
					/>
				</div>

				<div aria-hidden="true" className={styles.overlay} />
				<div aria-hidden="true" className={styles.frame} />

				<div className={styles.content}>
					<p className={styles.category}>{category}</p>
					<h3 className={styles.title}>{title}</h3>
					<span className={styles.action}>
						Read article
						<span aria-hidden="true">→</span>
					</span>
				</div>
			</div>
		</Link>
	);
}
