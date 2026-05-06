import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, CalendarRange, Home, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
	title: 'Corporate Travel & Experiences - Korascale',
	description:
		'Structured Bleisure experiences for business travel in China — client visits, executive travel, and delegations.',
};

const scenarios = [
	{
		title: 'Client Visit to China',
		subtitle: 'Client hosting & factory visits',
		recommendation: 'During Business + Post Extension',
	},
	{
		title: 'Executive Travel',
		subtitle: 'Executive visits to China',
		recommendation: 'Executive Bleisure + Long Stay',
	},
	{
		title: 'Events & Delegations',
		subtitle: 'Trade shows & business delegations',
		recommendation: 'Group Extension',
	},
] as const;

const bodyClass = 'text-[18px] leading-[1.75] text-[#33413E]';

function KeyPoints({ items, tone = 'dark' }: { items: readonly string[]; tone?: 'dark' | 'light' }) {
	const textTone = tone === 'light' ? 'text-[18px] leading-[1.75] text-white/95' : bodyClass;
	const dotTone = tone === 'light' ? 'bg-white/55' : 'bg-[#1D302E]/50';
	return (
		<ul className={`mt-6 space-y-3 ${textTone} list-none p-0`}>
			{items.map((line) => (
				<li key={line} className="flex gap-3">
					<span className={`mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full ${dotTone}`} aria-hidden />
					<span>{line}</span>
				</li>
			))}
		</ul>
	);
}

export default function CorporateTravelPage() {
	return (
		<main className="min-h-screen bg-[#F5F2ED] text-[#1E2725]">
			{/* Hero — full-viewport image, copy left, max width for breathing room */}
			<section className="relative min-h-[100svh] w-full overflow-hidden">
				<div
					className="absolute inset-0 bg-cover bg-center"
					style={{ backgroundImage: `url('/images/hero/shenzhen.jpg')` }}
					aria-hidden
				/>
				<div className="absolute inset-0 bg-gradient-to-r from-gray-950/75 via-gray-950/45 to-gray-950/25" aria-hidden />
				<div className="relative z-10 flex min-h-[100svh] w-full items-center">
					<div className="mx-auto w-full max-w-7xl px-6 py-24 md:py-32 lg:px-10">
						<div className="max-w-[850px] text-left">
							<p className="mb-5 text-xs font-medium uppercase tracking-[0.24em] text-white/75">
								Corporate Travel &amp; Experiences
							</p>
							<h1 className="font-serif text-4xl leading-[1.12] text-white md:text-5xl lg:text-[3.25rem]">
								Business Travel, Extended.
							</h1>
							<p className="mt-8 text-lg leading-relaxed text-white/90 md:text-xl md:leading-[1.65]">
								We design structured Bleisure experiences around your business needs — transforming essential logistics
								into strategic engagement across China.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Scenario selector */}
			<section className="border-t border-black/[0.06] bg-[#F5F2ED] px-6 py-20 md:py-28">
				<div className="mx-auto max-w-7xl">
					<h2 className="text-center font-serif text-3xl text-[#1E2725] md:text-4xl">Select Your Business Scenario</h2>
					<p className="mx-auto mt-4 max-w-2xl text-center text-base leading-relaxed text-[#4B5A58]">
						Choose the context that best matches your program — we align itinerary structure, pacing, and extensions
						accordingly.
					</p>

					<ul className="mt-14 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-3 md:gap-8">
						{scenarios.map((item) => (
							<li key={item.title}>
								<article className="flex h-full flex-col rounded-2xl border border-black/[0.08] bg-[#FEFCF8] p-8 shadow-sm transition duration-300 ease-out hover:border-black/[0.14] hover:shadow-[0_12px_40px_rgba(25,37,35,0.08)] md:p-9">
									<h3 className="font-serif text-2xl text-[#1E2725] md:text-[1.35rem]">{item.title}</h3>
									<p className="mt-2 text-sm font-medium text-[#5C6A68]">{item.subtitle}</p>
									<div className="mt-8 flex flex-1 flex-col justify-end border-t border-black/[0.06] pt-6">
										<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4B5A58]">Recommended</p>
										<p className="mt-2 text-base font-medium leading-snug text-[#1D302E]">{item.recommendation}</p>
									</div>
								</article>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* Bleisure Architecture — core products */}
			<section className="border-t border-black/[0.06] bg-[#FEFCF8] px-6 py-20 md:py-28">
				<div className="mx-auto max-w-7xl">
					<header className="mx-auto max-w-3xl text-center">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5C6A68]">Core Product</p>
						<h2 className="mt-3 font-serif text-3xl text-[#1E2725]">Bleisure Architecture</h2>
						<p className={`mt-5 ${bodyClass}`}>
							Three layers structure how we extend business travel: your{' '}
							<span className="font-semibold text-[#1D302E]">Experience Architect</span> sequences logistics,
							culture, and recovery so every hour supports the deal — with{' '}
							<span className="font-semibold text-[#1D302E]">Executive Support</span> operating quietly behind the
							scenes.
						</p>
					</header>

					{/* 01 | Image left, copy right */}
					<div className="mt-16 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
						<div
							className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-cover bg-center shadow-sm lg:aspect-[5/4]"
							style={{ backgroundImage: `url('/images/westlake.jpg')` }}
							role="img"
							aria-label="Pre and post business extension — West Lake and regional depth"
						/>
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5C6A68]">01</p>
							<h3 className="mt-2 font-serif text-3xl text-[#1E2725]">Pre / Post Business Extension</h3>
							<p className={`mt-4 ${bodyClass}`}>
								Bookend intensive meetings with calibrated depth: city cores and surrounding regions, paced for
								clarity rather than volume — so arrivals and departures feel intentional, not rushed.
							</p>
							<KeyPoints
								items={[
									'2–5 day bespoke depth itineraries',
									'City and regional immersion beyond the CBD',
									'Small-group private programs',
								]}
							/>
						</div>
					</div>

					{/* 02 | Copy left, image right */}
					<div className="mt-20 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
						<div className="lg:order-1">
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5C6A68]">02</p>
							<h3 className="mt-2 font-serif text-3xl text-[#1E2725]">During-Business Experience Design</h3>
							<p className={`mt-4 ${bodyClass}`}>
								We choreograph the hours around your agenda — venues, transitions, and hosting cues — so clients
								experience consistency and care without distraction from the work at hand.
							</p>
							<KeyPoints
								items={[
									'Evening social and hosted moments',
									'Business rhythm tuned to your agenda',
									'Client reception with dignity and polish',
								]}
							/>
						</div>
						<div
							className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-cover bg-center shadow-sm lg:order-2 lg:aspect-[5/4]"
							style={{ backgroundImage: `url('/images/Chinese%20banquet.jpg')` }}
							role="img"
							aria-label="During-business experience — hosted banquet and social settings"
						/>
					</div>

					{/* 03 | Image left, copy right */}
					<div className="mt-20 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
						<div
							className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-cover bg-center shadow-sm lg:aspect-[5/4]"
							style={{ backgroundImage: `url('/images/hotels/hotel-bleisure.jpg')` }}
							role="img"
							aria-label="Executive bleisure — hotel-based private pacing and rare access"
						/>
						<div>
							<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5C6A68]">03</p>
							<h3 className="mt-2 font-serif text-3xl text-[#1E2725]">Executive Bleisure</h3>
							<p className={`mt-4 ${bodyClass}`}>
								For principals who need privacy, discretion, and room to think: scarce venues, vetted access, and a
								rhythm owned entirely by you — orchestrated by your Experience Architect with Executive Support on
								standby.
							</p>
							<KeyPoints
								items={[
									'Private itineraries and discreet movement',
									'Access to scarce, vetted resources',
									'Absolute control of pacing and downtime',
								]}
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Supporting Layer — Seamless Execution */}
			<section className="border-t border-black/[0.06] bg-[#F5F2ED] px-6 py-16 md:py-20">
				<div className="mx-auto max-w-7xl">
					<div className="rounded-3xl bg-[#2A2A2A] px-8 py-14 text-white shadow-[0_24px_60px_rgba(0,0,0,0.18)] md:px-14 md:py-20">
						<p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Supporting Layer</p>
						<h2 className="mt-3 font-serif text-3xl text-white">Seamless Execution</h2>
						<p className="mt-5 max-w-3xl text-[18px] leading-[1.75] text-white/85">
							The operational backbone behind every program: one accountable thread from first brief to final
							debrief — so your Experience Architect stays focused on outcomes, not firefighting.
						</p>
						<ul className="mt-12 grid list-none grid-cols-1 gap-10 border-t border-white/10 pt-12 p-0 md:grid-cols-3 md:gap-8">
							<li>
								<h3 className="font-serif text-xl text-white md:text-[1.35rem]">Integrated Logistics</h3>
								<p className="mt-2 text-[18px] leading-[1.75] text-white/75">End-to-end hotels &amp; ground transport</p>
							</li>
							<li>
								<h3 className="font-serif text-xl text-white md:text-[1.35rem]">Resource Integration</h3>
								<p className="mt-2 text-[18px] leading-[1.75] text-white/75">Integrated partner &amp; venue sourcing</p>
							</li>
							<li>
								<h3 className="font-serif text-xl text-white md:text-[1.35rem]">Structured Delivery</h3>
								<p className="mt-2 text-[18px] leading-[1.75] text-white/75">Project-style delivery governance</p>
							</li>
						</ul>
					</div>
				</div>
			</section>

			{/* Advanced Scenario — Long-Stay & Relocation */}
			<section className="border-t border-black/[0.06] bg-[#FEFCF8] px-6 py-20 md:py-28">
				<div className="mx-auto max-w-3xl">
					<p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#5C6A68]">Advanced Scenario</p>
					<h2 className="mt-3 text-center font-serif text-3xl text-[#1E2725]">Long-Stay &amp; Relocation</h2>
					<p className={`mt-5 text-center ${bodyClass}`}>
						For assignees and executives staying 14+ days in China — lifestyle support that runs parallel to the work.
					</p>

					<ul className="mt-12 space-y-0 divide-y divide-black/[0.08] border-y border-black/[0.08]">
						<li className="flex gap-5 py-8">
							<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#1D302E]">
								<CalendarRange className="h-6 w-6" strokeWidth={1.5} aria-hidden />
							</span>
							<div>
								<p className="font-medium text-[#1E2725]">Continuous stays &amp; weekly rhythm</p>
								<p className={`mt-2 ${bodyClass}`}>
									We weight business and recovery by the week — fewer fragmented “long stay, short use” days, and
									more alignment between objectives and rest.
								</p>
							</div>
						</li>
						<li className="flex gap-5 py-8">
							<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#1D302E]">
								<Home className="h-6 w-6" strokeWidth={1.5} aria-hidden />
							</span>
							<div>
								<p className="font-medium text-[#1E2725]">Residence, commute &amp; daily flow</p>
								<p className={`mt-2 ${bodyClass}`}>
									One thread across housing, transfers, and city-life interfaces — less decision fatigue and hidden
									time loss in an unfamiliar environment.
								</p>
							</div>
						</li>
						<li className="flex gap-5 py-8">
							<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#1D302E]">
								<Building2 className="h-6 w-6" strokeWidth={1.5} aria-hidden />
							</span>
							<div>
								<p className="font-medium text-[#1E2725]">Local resources &amp; administrative bridges</p>
								<p className={`mt-2 ${bodyClass}`}>
									For compliance, healthcare, schooling, and other non-negotiables, Executive Support provides a
									structured path and follow-through — no information silos.
								</p>
							</div>
						</li>
						<li className="flex gap-5 py-8">
							<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[#1D302E]">
								<Sparkles className="h-6 w-6" strokeWidth={1.5} aria-hidden />
							</span>
							<div>
								<p className="font-medium text-[#1E2725]">Elevation &amp; scarce-access moments</p>
								<p className={`mt-2 ${bodyClass}`}>
									Over longer horizons we weave culture and private social settings so quality stays consistent and
									the program still feels fresh — led by your Experience Architect.
								</p>
							</div>
						</li>
					</ul>
				</div>
			</section>

			{/* CTA */}
			<section className="border-t border-black/[0.06] bg-[#1e3b32] px-6 py-16 md:py-24">
				<div className="mx-auto max-w-3xl text-center">
					<h2 className="font-serif text-3xl text-white">Ready to structure your next China program?</h2>
					<p className="mx-auto mt-4 max-w-xl text-[18px] leading-[1.75] text-white/85">
						Brief your objectives — we respond with a scene-based outline and execution plan aligned to your timeline.
					</p>
					<div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:justify-center">
						<Link
							href="/contact"
							className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-white px-8 py-3 text-center text-base font-semibold text-[#1e3b32] transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
						>
							Consult Our Corporate Architect
						</Link>
						<Link
							href="/inspirations"
							className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-white px-8 py-3 text-center text-base font-semibold text-[#1e3b32] transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
						>
							Explore Case Studies
						</Link>
					</div>
				</div>
			</section>
		</main>
	);
}
