import type { Metadata } from 'next';
import Link from 'next/link';
import {
	Building2,
	Car,
	CheckCircle2,
	ClipboardList,
	Globe2,
	Languages,
	LayoutList,
	MapPin,
	Network,
	PlaneLanding,
	Sparkles,
	UtensilsCrossed,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const metadata: Metadata = {
	title: 'Corporate Travel & Business Visit Support in China | KoraScale',
	description:
		'KoraScale supports overseas business teams and China-based companies with corporate travel, client reception, trade show support, interpreters, transportation, hotels, business dinners, and post-event bleisure experiences across China.',
};

const bodyClass = 'text-base leading-relaxed text-[#4B5A58]';
const cardTitleClass = 'font-serif text-xl text-[#1E2725] md:text-[1.35rem]';

function KeyPoints({
	items,
	tone = 'dark',
	compact = false,
}: {
	items: readonly string[];
	tone?: 'dark' | 'light';
	compact?: boolean;
}) {
	const textTone =
		tone === 'light'
			? compact
				? 'text-sm leading-relaxed text-white/90'
				: 'text-base leading-relaxed text-white/90'
			: compact
				? 'text-sm leading-relaxed text-[#4B5A58]'
				: bodyClass;
	const dotTone = tone === 'light' ? 'bg-white/55' : 'bg-[#1D302E]/45';
	return (
		<ul className={`${compact ? 'mt-4 space-y-2' : 'mt-5 space-y-2.5'} ${textTone} list-none p-0`}>
			{items.map((line) => (
				<li key={line} className="flex gap-2.5">
					<span className={`mt-[0.5em] h-1.5 w-1.5 shrink-0 rounded-full ${dotTone}`} aria-hidden />
					<span>{line}</span>
				</li>
			))}
		</ul>
	);
}

function SectionHeader({
	eyebrow,
	title,
	description,
}: {
	eyebrow: string;
	title: string;
	description?: string;
}) {
	return (
		<header className="mx-auto max-w-3xl text-center">
			<p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5C6A68]">{eyebrow}</p>
			<h2 className="mt-3 font-serif text-3xl text-[#1E2725] md:text-4xl">{title}</h2>
			{description ? <p className={`mt-4 ${bodyClass}`}>{description}</p> : null}
		</header>
	);
}

function IconBadge({ icon: Icon }: { icon: LucideIcon }) {
	return (
		<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/[0.08] bg-[#F5F2ED] text-[#1D302E]">
			<Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
		</span>
	);
}

const whoWeSupport = [
	{
		title: 'Overseas companies visiting China',
		summary: 'Exhibitors, procurement teams, investors, executives, and delegations coming for meetings, trade shows, or market visits.',
		icon: Globe2,
		items: [
			'Arrival coordination',
			'Hotel and transportation support',
			'Interpreters and local coordinators',
			'Meeting and visit logistics',
			'Trade show support',
			'Post-event cultural experiences',
		],
	},
	{
		title: 'China-based companies receiving overseas clients',
		summary: 'Manufacturers, technology firms, and corporate teams providing client reception in China for overseas clients, distributors, partners, or executives.',
		icon: Building2,
		items: [
			'Airport pickup and guest reception',
			'Factory or office visit coordination',
			'Business dinner arrangement',
			'Multilingual local support',
			'VIP guest handling',
			'Branded itinerary and hospitality design',
		],
	},
] as const;

const coreServices: ReadonlyArray<{ title: string; body: string; icon: LucideIcon }> = [
	{
		title: 'Arrival & Airport Coordination',
		body: 'Airport pickup, arrival assistance, hotel check-in, and first-day schedule coordination.',
		icon: PlaneLanding,
	},
	{
		title: 'Hotels & Ground Transportation',
		body: 'Business hotels, private vehicles, city transfers, and schedule-based movement planning.',
		icon: Car,
	},
	{
		title: 'Interpreters & Local Coordinators',
		body: 'Business interpreters, multilingual guides, and on-site coordinators for meetings and visits.',
		icon: Languages,
	},
	{
		title: 'Client Visits & Factory Tours',
		body: 'Factory and office visits, meeting-day logistics, site flow planning, and guest reception.',
		icon: Building2,
	},
	{
		title: 'Business Dinners & Hospitality',
		body: 'Restaurant sourcing, private dining, guest hosting flow, and executive-level hospitality.',
		icon: UtensilsCrossed,
	},
	{
		title: 'Post-event Bleisure Experiences',
		body: 'Half-day to multi-day cultural experiences designed around your business schedule.',
		icon: Sparkles,
	},
];

const businessScenarios = [
	{
		title: 'Overseas Team Attending a Trade Show in China',
		summary: 'Technology, manufacturing, medical, mobility, AI, and trade exhibitions across China.',
		image: '/images/city-activity.jpg',
		imageAlt: 'Urban business district — trade show and delegation atmosphere in China',
		items: [
			'Airport pickup and hotel coordination',
			'Daily transfers between hotel, venue, and meetings',
			'Interpreter and local coordinator support',
			'Client dinner and side-meeting arrangements',
			'Post-event city or cultural experience',
		],
	},
	{
		title: 'China-based Company Receiving Overseas Clients',
		summary: 'Factory visits, office meetings, training programs, and commercial discussions with overseas guests.',
		image: '/images/hotels/hotel-bleisure.jpg',
		imageAlt: 'Premium business hospitality — client reception and visit support',
		items: [
			'Guest arrival and welcome flow',
			'Factory or office visit coordination',
			'Meeting-day transportation and timing',
			'Business dinner and hospitality support',
			'Optional cultural experience after the business agenda',
		],
	},
	{
		title: 'Executive & VIP Business Visits',
		summary: 'Senior executives, board-level guests, investors, and high-value delegations requiring discreet management.',
		image: '/images/Chinese%20banquet.jpg',
		imageAlt: 'Executive business dinner — VIP hospitality in China',
		items: [
			'Private vehicles and discreet movement',
			'High-quality hotels, restaurants, and venues',
			'Flexible scheduling and downtime control',
			'Senior local coordinator support',
			'Tailored cultural or lifestyle experiences',
		],
	},
] as const;

const howWeWork: ReadonlyArray<{ title: string; body: string; icon: LucideIcon }> = [
	{
		title: 'Brief',
		body: 'Share city, dates, group size, guest profile, and fixed meetings or events.',
		icon: ClipboardList,
	},
	{
		title: 'Structure',
		body: 'We shape the visit flow around your business schedule and support needs.',
		icon: LayoutList,
	},
	{
		title: 'Coordinate',
		body: 'We align partners, vehicles, restaurants, venues, and timing before arrival.',
		icon: Network,
	},
	{
		title: 'Deliver',
		body: 'On-the-ground coordination with adjustments when schedules change.',
		icon: CheckCircle2,
	},
];

const whyKoraScale = [
	{
		title: 'Business-first, travel-capable',
		body: 'Travel and hospitality designed around meetings, client visits, and executive priorities.',
	},
	{
		title: 'Local coordination across China',
		body: 'Transportation, interpreters, hotels, restaurants, and partners through one contact.',
	},
	{
		title: 'Flexible for small teams and VIP guests',
		body: 'Small teams, executive visits, and event groups — without standard tour packages.',
	},
	{
		title: 'Bleisure without losing business focus',
		body: 'Cultural experiences added only where they support the visit rhythm and relationships.',
	},
	{
		title: 'Branded reception design available',
		body: 'Visual itinerary materials and guest-facing details aligned with your brand.',
	},
] as const;

const ctaClass =
	'inline-flex min-h-[48px] items-center justify-center rounded-lg px-8 py-3 text-center text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
/* !text-* overrides global `a { color: #1e3b32 }` in globals.css */
const ctaPrimaryDark = `${ctaClass} bg-[#1e3b32] !text-white shadow-[0_4px_14px_rgba(30,59,50,0.28)] hover:bg-[#173028] hover:!text-white focus-visible:outline-[#1e3b32]`;
const ctaSecondaryDark = `${ctaClass} border border-[#1e3b32]/30 bg-transparent !text-[#1e3b32] hover:bg-[#1e3b32]/5 hover:!text-[#1e3b32] focus-visible:outline-[#1e3b32]`;
const ctaPrimaryLight = `${ctaClass} bg-white !text-[#1e3b32] shadow-[0_4px_14px_rgba(0,0,0,0.12)] hover:bg-white/90 hover:!text-[#1e3b32] focus-visible:outline-white`;

export default function CorporateTravelPage() {
	return (
		<main className="min-h-screen bg-[#F5F2ED] text-[#1E2725]">
			{/* Hero — split layout */}
			<section className="border-b border-black/[0.06] bg-[#F5F2ED]">
				<div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-16 md:py-24 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-28">
					<div className="order-2 lg:order-1">
						<p className="text-xs font-medium uppercase tracking-[0.24em] text-[#5C6A68]">
							Corporate Travel in China
						</p>
						<h1 className="mt-4 font-serif text-4xl leading-[1.12] text-[#1E2725] md:text-5xl lg:text-[3.15rem]">
							Corporate Travel &amp; Business Visit Support in China
						</h1>
						<p className="mt-6 max-w-xl text-lg leading-relaxed text-[#4B5A58]">
							Local coordination for business visits, trade shows, client reception, transportation, interpreters,
							hotels, dinners, and post-event cultural experiences.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
							<Link href="/contact" className={ctaPrimaryDark}>
								Tell Us About Your Upcoming Visit
							</Link>
							<Link href="#business-scenarios" className={ctaSecondaryDark}>
								Explore Use Cases
							</Link>
						</div>
					</div>

					<div className="order-1 lg:order-2">
						<div className="relative overflow-hidden rounded-2xl shadow-[0_24px_60px_rgba(25,37,35,0.12)]">
							<div className="aspect-[4/3] w-full bg-[#1D302E]/10 lg:aspect-[5/4]">
								<img
									src="/images/hero/shenzhen.jpg"
									alt="Shenzhen skyline — international business travel and executive mobility in China"
									className="h-full w-full object-cover"
								/>
							</div>
							<div
								className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1D302E]/30 via-transparent to-transparent"
								aria-hidden
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Who We Support */}
			<section id="who-we-support" className="border-t border-black/[0.06] bg-[#FEFCF8] px-6 py-20 md:py-28">
				<div className="mx-auto max-w-7xl">
					<SectionHeader
						eyebrow="Who We Support"
						title="Two sides of the same business visit"
						description="Practical business visit support China teams can rely on — from first arrival to final departure."
					/>

					<ul className="mt-14 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 md:gap-8">
						{whoWeSupport.map((card) => (
							<li key={card.title}>
								<article className="flex h-full flex-col rounded-2xl border border-black/[0.08] bg-[#F5F2ED] p-7 shadow-sm md:p-8">
									<div className="flex items-start gap-4">
										<IconBadge icon={card.icon} />
										<div>
											<h3 className={cardTitleClass}>{card.title}</h3>
											<p className={`mt-2 ${bodyClass}`}>{card.summary}</p>
										</div>
									</div>
									<div className="mt-6 border-t border-black/[0.06] pt-5">
										<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4B5A58]">
											Support may include
										</p>
										<KeyPoints items={card.items} compact />
									</div>
								</article>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* Core Services */}
			<section id="core-services" className="border-t border-black/[0.06] bg-[#F5F2ED] px-6 py-20 md:py-28">
				<div className="mx-auto max-w-7xl">
					<SectionHeader
						eyebrow="Core Services"
						title="What we coordinate on the ground"
						description="Your local coordination partner for corporate travel in China — not a tour operator."
					/>

					<ul className="mt-14 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
						{coreServices.map((service) => (
							<li key={service.title}>
								<article className="flex h-full flex-col rounded-2xl border border-black/[0.08] bg-[#FEFCF8] p-6 shadow-sm transition duration-300 hover:border-black/[0.14] hover:shadow-[0_12px_40px_rgba(25,37,35,0.07)] md:p-7">
									<IconBadge icon={service.icon} />
									<h3 className={`mt-5 ${cardTitleClass}`}>{service.title}</h3>
									<p className={`mt-2 flex-1 ${bodyClass}`}>{service.body}</p>
								</article>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* Business Scenarios */}
			<section id="business-scenarios" className="border-t border-black/[0.06] bg-[#FEFCF8] px-6 py-20 md:py-28">
				<div className="mx-auto max-w-7xl">
					<SectionHeader
						eyebrow="Business Scenarios"
						title="Common programs we support"
						description="From trade show travel support China teams need to factory visit support China manufacturers arrange — shaped around your schedule."
					/>

					<ul className="mt-14 grid list-none grid-cols-1 gap-8 p-0 lg:grid-cols-3 lg:gap-7">
						{businessScenarios.map((scenario) => (
							<li key={scenario.title}>
								<article className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-[#F5F2ED] shadow-sm transition duration-300 hover:border-black/[0.14] hover:shadow-[0_12px_40px_rgba(25,37,35,0.08)]">
									<div className="aspect-[16/9] w-full overflow-hidden">
										<img
											src={scenario.image}
											alt={scenario.imageAlt}
											className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
										/>
									</div>
									<div className="flex flex-1 flex-col p-6 md:p-7">
										<h3 className={cardTitleClass}>{scenario.title}</h3>
										<p className={`mt-2 ${bodyClass}`}>{scenario.summary}</p>
										<div className="mt-5 flex-1 border-t border-black/[0.06] pt-4">
											<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4B5A58]">
												Typical support
											</p>
											<KeyPoints items={scenario.items} compact />
										</div>
									</div>
								</article>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* How We Work — timeline */}
			<section id="how-we-work" className="border-t border-black/[0.06] bg-[#F5F2ED] px-6 py-20 md:py-28">
				<div className="mx-auto max-w-7xl">
					<SectionHeader
						eyebrow="How We Work"
						title="A clear process from brief to delivery"
						description="Local execution alongside your internal team — without replacing your business agenda."
					/>

					<ol className="relative mt-14 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
						<div
							className="pointer-events-none absolute top-[3.25rem] hidden h-px bg-black/[0.08] lg:block lg:left-[12%] lg:right-[12%]"
							aria-hidden
						/>
						{howWeWork.map((item) => (
							<li key={item.title} className="relative">
								<article className="flex h-full flex-col items-center rounded-2xl border border-black/[0.08] bg-[#FEFCF8] p-7 text-center md:p-8">
									<IconBadge icon={item.icon} />
									<h3 className={`mt-5 ${cardTitleClass}`}>{item.title}</h3>
									<p className={`mt-2 max-w-[16rem] ${bodyClass}`}>{item.body}</p>
								</article>
							</li>
						))}
					</ol>
				</div>
			</section>

			{/* Why KoraScale — split layout */}
			<section id="why-korascale" className="border-t border-black/[0.06] bg-[#FEFCF8] px-6 py-20 md:py-28">
				<div className="mx-auto max-w-7xl">
					<div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
						<div className="relative overflow-hidden rounded-2xl shadow-[0_20px_50px_rgba(25,37,35,0.1)]">
							<div className="aspect-[4/5] w-full lg:aspect-[3/4]">
								<img
									src="/images/hotels/hotel-bleisure.jpg"
									alt="Premium business hospitality — local coordination for corporate visits in China"
									className="h-full w-full object-cover"
								/>
							</div>
							<div
								className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1D302E]/40 via-transparent to-transparent"
								aria-hidden
							/>
						</div>

						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5C6A68]">Why KoraScale</p>
							<h2 className="mt-3 font-serif text-3xl text-[#1E2725] md:text-4xl">
								Local coordination built for business visits
							</h2>
							<p className={`mt-4 ${bodyClass}`}>
								Business interpreter China access, executive travel China logistics, and China bleisure travel
								options — one accountable partner for cross-border business relationships.
							</p>
							<ul className="mt-8 space-y-5">
								{whyKoraScale.map((point) => (
									<li key={point.title} className="flex gap-3">
										<span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1e3b32]/10 text-[#1e3b32]">
											<CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
										</span>
										<div>
											<h3 className="font-medium text-[#1E2725]">{point.title}</h3>
											<p className="mt-1 text-sm leading-relaxed text-[#4B5A58]">{point.body}</p>
										</div>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</section>

			{/* Extended Business Stay — de-emphasized */}
			<section className="border-t border-black/[0.06] bg-[#F5F2ED] px-6 py-12 md:py-14">
				<div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
					<MapPin className="h-5 w-5 text-[#5C6A68]" strokeWidth={1.5} aria-hidden />
					<p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5C6A68]">Optional</p>
					<h2 className="font-serif text-2xl text-[#1E2725] md:text-[1.65rem]">Extended Business Stay Support</h2>
					<p className={`max-w-2xl ${bodyClass}`}>
						For longer business programs — weekly travel rhythm, local transportation, lifestyle recommendations, and
						selected cultural experiences.
					</p>
				</div>
			</section>

			{/* Final CTA */}
			<section id="contact-cta" className="relative overflow-hidden border-t border-black/[0.06]">
				<div
					className="absolute inset-0 bg-cover bg-center"
					style={{ backgroundImage: `url('/images/hero/shenzhen.jpg')` }}
					aria-hidden
				/>
				<div className="absolute inset-0 bg-[#1e3b32]/88" aria-hidden />
				<div className="relative mx-auto max-w-2xl px-6 py-16 text-center md:py-20">
					<h2 className="font-serif text-3xl text-white md:text-4xl">Ready to plan a business visit in China?</h2>
					<p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/85">
						Share your city, dates, group size, and business purpose. We&apos;ll shape a practical support plan.
					</p>
					<div className="mt-8">
						<Link href="/contact" className={ctaPrimaryLight}>
							Submit a Visit Request
						</Link>
					</div>
					<p className="mx-auto mt-5 max-w-md text-sm text-white/65">
						Not sure about the full schedule yet? Send us the basics and we can help shape the visit plan.
					</p>
				</div>
			</section>
		</main>
	);
}
