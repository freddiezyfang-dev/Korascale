'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';

const BG = '#F5F2ED';

/** 统一用于远程 Unsplash 的轻量模糊占位（placeholder="blur"） */
const BLUR_DATA_URL =
	'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAgDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

const img = (id: string, w: number, q = 80) =>
	`https://images.unsplash.com/${id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=${w}&q=${q}`;

/** Hero：本地桂林山水底图（public/images/guilin.jpg） */
const HERO_IMG = '/images/guilin.jpg';
/** 首屏后第一节侧边图：成都茶馆（public/images/chengdu-teahouse.jpg） */
const SOLVE_SIDE_IMG = '/images/chengdu-teahouse.jpg';
/** Operational capacity 区块背景（public/images/city-activity.jpg） */
const STATS_BG_IMG = '/images/city-activity.jpg';

const SERVICE_GRID = [
	{
		title: 'Group Route Design',
		body: 'Sequencing, pacing, and contingency layers built for cohort scale—not generic sightseeing loops.',
		image: img('photo-1451187580459-43490279c0fa', 1200),
		alt: 'Earth from orbit with city lights — global routing and cohort-scale planning metaphor',
	},
	{
		title: 'On-Ground Execution',
		body: 'Single command chain from meet-and-greet through departures, with daily run-of-show governance.',
		image: img('photo-1544620347-c4fd4a3d5957', 1200),
		alt: 'Highway interchange with vehicles from above — convoy and ground movement',
	},
	{
		title: 'Quality & Safety Protocols',
		body: 'Audited suppliers, escalation paths, and duty-of-care standards matched to institutional duty.',
		image: img('photo-1601584115197-04ecc0da31d7', 1200),
		alt: 'Industrial logistics yard with equipment — compliance, chain of custody, and supplier discipline',
	},
	{
		title: 'Post-Trip Reporting',
		body: 'Structured debriefs, KPI snapshots, and documentation your procurement team can file.',
		image: img('photo-1551288049-bebda4e38f71', 1200),
		alt: 'Multiple monitors with charts and dashboards — metrics and reporting, no portraits',
	},
];

const STATS = [
	{ value: '500+', line: 'Travelers', sub: 'Up to 500 inbound travelers per month under managed programs' },
	{ value: '30+', line: 'Windows', sub: 'Concurrent departure windows coordinated across regions' },
	{ value: '1', line: 'Lead', sub: 'Single accountable delivery lead per engagement' },
];

const WORK_STEPS: {
	step: number;
	title: string;
	detail: string;
	image: string;
	alt: string;
}[] = [
	{
		step: 1,
		title: 'Initial Request',
		detail:
			'We align on cohort profile, risk posture, learning or brand outcomes, and the non-negotiables of your operating window—captured as a single scope brief.',
		image: img('photo-1454165804606-c3d57bc86b40', 900),
		alt: 'Laptop, notebook, and coffee on a wooden desk — brief and scope capture, top-down',
	},
	{
		step: 2,
		title: 'Concept Design',
		detail:
			'Route logic, anchor experiences, and service tiers are drafted as a coherent system—not a stitched itinerary—using map-first planning and corridor analysis.',
		image: img('photo-1519681393784-d120267933ba', 900),
		alt: 'Snow-covered peaks and alpine ridges — corridor-scale landscape planning metaphor',
	},
	{
		step: 3,
		title: 'Proposal',
		detail:
			'Transparent pricing bands, change rules, and SLAs arrive as a polished, client-ready proposal—your procurement team can circulate without reformatting.',
		image: img('photo-1450101499163-c8848c66ca85', 900),
		alt: 'Keyboard, glasses, and notebook on a desk — polished proposal documents',
	},
	{
		step: 4,
		title: 'Pre-Trip',
		detail:
			'Run-of-show, staffing roster, comms cadence, and contingency triggers are locked; kits, radios, and manifests are staged before the first guest lands.',
		image: img('photo-1551632811-561732d1e306', 900),
		alt: 'Hiking boots and outdoor gear laid out — staging and pre-departure kit',
	},
	{
		step: 5,
		title: 'Execution',
		detail:
			'Field delivery with war-room monitoring during travel, then a structured debrief with metrics, incidents (if any), and renewal options.',
		image: img('photo-1483728642387-6c3bdd6c93e5', 1200),
		alt: 'Dense city skyline at dusk — field execution at metropolitan scale, no portraits',
	},
];

const CHALLENGES = [
	'Cross-region coordination across provinces, hubs, and gateways',
	'Aligned vendors, vehicles, and venues under one operating rhythm',
	'Fixed departure windows with zero tolerance for drift',
	'Consistent multilingual briefing and guest-facing standards',
	'Real-time visibility for HQ, partners, and on-site leads',
];

function FramedImage({
	src,
	alt,
	className,
	sizes,
	priority,
	fill,
}: {
	src: string;
	alt: string;
	className?: string;
	sizes: string;
	priority?: boolean;
	fill?: boolean;
}) {
	const useFill = fill !== false;
	/* 外层只负责定位/裁剪，不在此写 relative，避免与 className 里的 absolute 冲突导致 fill 失效 */
	return (
		<div className={`group overflow-hidden ${className ?? ''}`}>
			{useFill ? (
				<div className="relative h-full min-h-[1px] w-full">
					<Image
						src={src}
						alt={alt}
						fill
						sizes={sizes}
						placeholder="blur"
						blurDataURL={BLUR_DATA_URL}
						priority={priority}
						className="object-cover transition duration-700 ease-out group-hover:scale-105"
					/>
				</div>
			) : null}
		</div>
	);
}

export default function GroupToursLandingClient() {
	const [hoveredStep, setHoveredStep] = useState<number | null>(null);
	const statsSectionRef = useRef<HTMLElement>(null);
	const [statsParallax, setStatsParallax] = useState(0);

	useEffect(() => {
		const onScroll = () => {
			const el = statsSectionRef.current;
			if (!el) return;
			const rect = el.getBoundingClientRect();
			const vh = window.innerHeight;
			const t = (rect.top + rect.height / 2 - vh / 2) / (vh + rect.height);
			setStatsParallax(Math.max(-36, Math.min(36, t * 72)));
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	return (
		<main
			className="min-h-screen font-sans text-[#333]"
			style={{ backgroundColor: BG, fontFamily: 'var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif' }}
		>
			{/* Hero — 通栏底图 + 遮罩 + 浮层文案（移动端固定 50vh 高度，避免 fill 父级高度为 0） */}
			<section className="relative isolate h-[50vh] w-full overflow-hidden border-b border-black/10 md:h-auto md:min-h-[78vh]">
				{/* 背景图层：next/image fill 的直接父级必须是 position:relative 且有明确高宽 */}
				<div className="pointer-events-none absolute inset-0 z-0">
					<div className="relative h-full min-h-full w-full">
						<Image
							src={HERO_IMG}
							alt="Guilin karst peaks and river — expansive landscape, no people in frame"
							fill
							priority
							sizes="100vw"
							placeholder="blur"
							blurDataURL={BLUR_DATA_URL}
							className="object-cover object-center"
						/>
					</div>
				</div>
				{/* 遮罩：约 black/35，略加重边缘保证白字可读 */}
				<div
					className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-black/40 via-black/30 to-black/40"
					aria-hidden
				/>
				{/* 文案层 */}
				<div className="relative z-10 mx-auto flex h-full min-h-[50vh] max-w-6xl flex-col justify-end px-6 pb-12 pt-16 md:min-h-[78vh] md:pb-20 md:pt-28 lg:pb-28 lg:pt-36">
					<p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-100">Group Programs · China Inbound</p>
					<h1
						className="mt-4 max-w-4xl text-4xl font-normal leading-tight text-white md:text-5xl lg:text-6xl"
						style={{ fontFamily: 'var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif' }}
					>
						Group Travel in China, Without Operational Chaos
					</h1>
					<p className="mt-6 max-w-3xl text-lg leading-relaxed text-gray-100">
						Korascale replaces fragmented suppliers with a single{' '}
						<strong className="font-semibold text-white">structured coordination</strong> layer—so every cohort receives the
						same briefing standards, contingency playbooks, and{' '}
						<strong className="font-semibold text-white">consistent service delivery</strong> from gateway cities to
						secondary corridors.
					</p>
				</div>
			</section>

			{/* Section 2 — What we solve: 60% copy + vertical image */}
			<section className="px-6 py-20 md:py-24" style={{ backgroundColor: BG }}>
				<div className="mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-stretch lg:gap-16">
					<div className="min-w-0 space-y-8 lg:w-[60%] lg:max-w-[60%]">
						<h2
							className="text-3xl font-normal leading-snug text-[#333] md:text-4xl"
							style={{ fontFamily: 'var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif' }}
						>
							Not a bus tour. A managed travel system.
						</h2>
						<p className="text-base leading-relaxed text-[#333]/85 md:text-lg">
							We design China inbound for institutions, brands, and professional cohorts that cannot afford variance. Your
							guests experience culture and place; your operations team sees a closed loop—clear owners, measurable handoffs,
							and predictable outcomes.
						</p>
						<div className="rounded-2xl border border-black/10 bg-white/50 p-8 shadow-sm">
							<h3
								className="text-xl font-normal text-[#333] md:text-2xl"
								style={{ fontFamily: 'var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif' }}
							>
								What breaks first at scale
							</h3>
							<ul className="mt-6 space-y-4">
								{CHALLENGES.map((line) => (
									<li key={line} className="flex gap-3 text-sm leading-relaxed text-[#333]/90 md:text-base">
										<span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#333]/25 bg-[#F5F2ED]">
											<Check className="h-3.5 w-3.5 text-[#333]" strokeWidth={2.5} aria-hidden />
										</span>
										<span>{line}</span>
									</li>
								))}
							</ul>
						</div>
					</div>
					<div className="flex flex-1 justify-center lg:justify-end lg:pt-2">
						<div className="relative aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl border border-black/10 shadow-lg lg:max-w-none lg:min-h-[min(520px,70vh)] lg:w-full">
							<FramedImage
								src={SOLVE_SIDE_IMG}
								alt="Traditional Chengdu teahouse setting — culture-forward hosting without staged portraits"
								className="absolute inset-0 h-full w-full"
								sizes="(max-width: 1024px) 100vw, 40vw"
								fill
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Sections 3 & 4 — methodology + service grid with thumbs */}
			<section className="px-6 py-20 md:py-24" style={{ backgroundColor: BG }}>
				<div className="mx-auto max-w-6xl">
					<div className="mx-auto max-w-3xl text-center">
						<h2
							className="text-3xl font-normal text-[#333] md:text-4xl"
							style={{ fontFamily: 'var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif' }}
						>
							What we provide
						</h2>
						<p className="mt-5 text-base leading-relaxed text-[#333]/85 md:text-lg">
							We run each engagement as a <strong className="font-semibold text-[#333]">project-based delivery model</strong>
							: fixed milestones, shared documentation, and one accountable Korascale lead who orchestrates partners—not a
							relay of disconnected tickets.
						</p>
					</div>
					<div className="mt-14 grid gap-6 sm:grid-cols-2">
						{SERVICE_GRID.map((item) => (
							<div
								key={item.title}
								className="overflow-hidden rounded-2xl border border-black/10 bg-white/60 shadow-sm transition hover:border-black/20 hover:shadow-md"
							>
								<div className="relative aspect-video w-full overflow-hidden">
									<FramedImage
										src={item.image}
										alt={item.alt}
										className="absolute inset-0 h-full w-full"
										sizes="(max-width: 640px) 100vw, 50vw"
										fill
									/>
								</div>
								<div className="p-8">
									<h3
										className="text-xl font-normal text-[#333]"
										style={{ fontFamily: 'var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif' }}
									>
										{item.title}
									</h3>
									<p className="mt-3 text-sm leading-relaxed text-[#333]/85 md:text-base">{item.body}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Section 5 — stats over blurred parallax background */}
			<section
				ref={statsSectionRef}
				className="relative min-h-[480px] overflow-hidden border-y border-black/10 py-20 md:min-h-[520px] md:py-24"
				style={{ backgroundColor: BG }}
			>
				<div className="pointer-events-none absolute inset-0 overflow-hidden">
					<div
						className="absolute left-0 right-0 top-[-12%] h-[124%] will-change-transform"
						style={{ transform: `translate3d(0, ${statsParallax}px, 0)` }}
					>
						<div className="relative h-full w-full">
							<Image
								src={STATS_BG_IMG}
								alt=""
								fill
								sizes="100vw"
								placeholder="blur"
								blurDataURL={BLUR_DATA_URL}
								className="scale-105 object-cover blur-[3px]"
								aria-hidden
							/>
						</div>
					</div>
					<div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/50 to-black/60" aria-hidden />
				</div>
				<div className="relative z-10 mx-auto max-w-6xl px-6">
					<h2
						className="text-center text-3xl font-normal text-white md:text-4xl"
						style={{ fontFamily: 'var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif' }}
					>
						Operational capacity
					</h2>
					<p className="mx-auto mt-4 max-w-2xl text-center text-base text-white/85">
						Numbers your B2B stakeholders can stress-test against their own duty-of-care and duty-to-deliver standards.
					</p>
					<div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
						{STATS.map((s) => (
							<div key={s.value} className="text-center text-white">
								<p
									className="text-5xl font-light tracking-tight md:text-6xl lg:text-7xl"
									style={{ fontFamily: 'var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif' }}
								>
									{s.value}
								</p>
								<p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-white/80">{s.line}</p>
								<p className="mt-3 text-sm leading-relaxed text-white/85 md:text-base">{s.sub}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Section 7 — How we work: vertical strips + numbered copy */}
			<section className="px-6 py-20 md:py-24" style={{ backgroundColor: BG }}>
				<div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
					<div>
						<h2
							className="text-3xl font-normal text-[#333] md:text-4xl"
							style={{ fontFamily: 'var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif' }}
						>
							How we work
						</h2>
						<p className="mt-5 max-w-md text-base leading-relaxed text-[#333]/85 md:text-lg">
							Five gated phases. Hover each row to reveal the operational detail—each step is paired with a vertical frame
							in the A&K editorial tradition.
						</p>
					</div>
					<div className="flex flex-col gap-4">
						{WORK_STEPS.map(({ step, title, detail, image, alt }) => {
							const active = hoveredStep === step;
							return (
								<div
									key={step}
									role="group"
									className={`overflow-hidden rounded-2xl border transition-colors ${
										active ? 'border-[#333]/40 bg-white shadow-md' : 'border-black/10 bg-white/50'
									}`}
									onMouseEnter={() => setHoveredStep(step)}
									onMouseLeave={() => setHoveredStep(null)}
									onFocus={() => setHoveredStep(step)}
									onBlur={() => setHoveredStep(null)}
									tabIndex={0}
								>
									<div className="flex flex-col sm:flex-row sm:items-stretch">
										<div className="relative h-48 w-full shrink-0 overflow-hidden sm:h-auto sm:w-36 sm:self-stretch md:w-44">
											<FramedImage
												src={image}
												alt={alt}
												className="absolute inset-0 h-full min-h-[12rem] w-full sm:min-h-0"
												sizes="(max-width: 640px) 100vw, 176px"
												fill
											/>
										</div>
										<div className="flex min-w-0 flex-1 gap-4 p-5 md:p-6">
											<div
												className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-black/15 bg-[#F5F2ED] text-xl font-light text-[#333] md:h-14 md:w-14 md:text-2xl"
												style={{ fontFamily: 'var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif' }}
												aria-hidden
											>
												{step}
											</div>
											<div className="min-w-0 flex-1">
												<p
													className="text-lg font-normal text-[#333] md:text-xl"
													style={{ fontFamily: 'var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif' }}
												>
													<span className="text-sm font-sans font-semibold uppercase tracking-wide text-[#333]/55">
														Step {step}
													</span>
													<span className="mx-2 text-[#333]/35">—</span>
													{title}
												</p>
												<div
													className={`grid transition-[grid-template-rows] duration-300 ease-out ${
														active ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
													}`}
												>
													<div className="overflow-hidden">
														<p className="mt-3 border-t border-black/10 pt-3 text-sm leading-relaxed text-[#333]/85 md:text-base">
															{detail}
														</p>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</section>

			{/* CTA — 单按钮：深色底、白字、居中 */}
			<section className="border-t border-black/10 px-6 pb-24 pt-20 md:pb-28 md:pt-24" style={{ backgroundColor: BG }}>
				<div className="mx-auto max-w-4xl text-center">
					<p
						className="text-2xl font-normal leading-snug text-[#333] md:text-3xl"
						style={{ fontFamily: 'var(--font-playfair), "Playfair Display", ui-serif, Georgia, serif' }}
					>
						<strong className="font-semibold">We are your on-ground execution system in China.</strong> You keep the
						relationship with your travelers; we own the choreography behind every handoff, briefing, and recovery move.
					</p>
					<div className="mt-10 flex justify-center">
						<a
							href="mailto:customer-service@korascale.com?subject=Group%20tours%20inquiry"
							className="inline-flex rounded-full bg-[#0f2322] px-10 py-3.5 text-sm font-semibold !text-white visited:!text-white transition hover:bg-[#152e2c] hover:!text-white"
						>
							Speak to our team
						</a>
					</div>
				</div>
			</section>
		</main>
	);
}
