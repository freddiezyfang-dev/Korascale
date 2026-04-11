'use client';

import { motion } from 'framer-motion';

const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.12,
			delayChildren: 0.08,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 18 },
	show: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.6, ease: 'easeOut' },
	},
};

function LineIcon({ path }: { path: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-[#1F3B3A]">
			<path d={path} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

export default function HealthcareAccessChinaClient() {
	return (
		<main className="min-h-screen bg-[#F5F2ED] text-[#1E2725]">
			<section
				className="relative overflow-hidden border-b border-black/10"
				style={{
					backgroundImage:
						'linear-gradient(120deg, rgba(20,31,30,0.70), rgba(20,31,30,0.35)), url("https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=2200&q=80")',
					backgroundSize: 'cover',
					backgroundPosition: 'center',
				}}
			>
				<div className="mx-auto max-w-6xl px-6 py-28 md:py-36">
					<motion.div
						className="space-y-8 text-white"
						variants={containerVariants}
						initial="hidden"
						whileInView="show"
						viewport={{ once: true, amount: 0.25 }}
					>
						<motion.p variants={itemVariants} className="text-xs uppercase tracking-[0.24em] text-white/80">
							Korascale Healthcare
						</motion.p>
						<motion.h1 variants={itemVariants} className="max-w-4xl text-5xl leading-tight font-serif md:text-6xl">
							Medical Travel, Reimagined in China
						</motion.h1>
						<motion.p variants={itemVariants} className="max-w-2xl text-lg leading-relaxed text-white/90">
							Access China&apos;s top-tier hospitals through a fully managed, English-supported medical journey -
							from diagnosis to recovery, seamlessly integrated with travel, privacy, and comfort.
						</motion.p>
					</motion.div>
				</div>
			</section>

			<motion.section
				className="mx-auto max-w-6xl px-6 py-20"
				variants={containerVariants}
				initial="hidden"
				whileInView="show"
				viewport={{ once: true, amount: 0.18 }}
			>
				<motion.div variants={itemVariants} className="bg-[#FEFCF8] p-8 text-center md:p-12">
					<h2 className="mt-3 text-3xl font-serif md:text-4xl">Not just treatment. A complete medical experience.</h2>
					<p className="mx-auto mt-5 max-w-4xl text-base leading-relaxed text-[#33413E] md:text-lg">
						Korascale connects international travelers with China&apos;s leading hospitals and transforms complex
						medical procedures into a structured, stress-free journey. From the moment you land in China to your
						full recovery, every step is designed around medical precision, operational clarity, and cultural comfort.
					</p>
				</motion.div>
			</motion.section>

			<motion.section
				className="mx-auto max-w-6xl px-6 pb-20"
				variants={containerVariants}
				initial="hidden"
				whileInView="show"
				viewport={{ once: true, amount: 0.18 }}
			>
				<motion.div variants={itemVariants} className="rounded-3xl border border-black/10 bg-[#FEFCF8] p-8 shadow-[0_12px_36px_rgba(25,37,35,0.06)] md:p-12">
					<h2 className="mt-3 text-3xl font-serif md:text-4xl">Our Hospital Network</h2>
					<p className="mt-5 max-w-4xl leading-relaxed text-[#33413E]">
						We partner with <span className="font-semibold text-[#1D302E]">25 top-tier hospitals</span> across China,
						all selected for national-level accreditation, advanced specialty strengths, and proven international patient
						experience.
					</p>

					<div className="mt-10 grid gap-8 rounded-2xl border border-black/10 bg-white/60 p-4 md:grid-cols-[1.15fr_1fr] md:p-6">
						<div
							className="min-h-[280px] rounded-xl bg-cover bg-center"
							style={{
								backgroundImage:
									'url("https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=1400&q=80")',
							}}
						/>
						<div className="space-y-4">
							<p className="text-xs uppercase tracking-[0.22em] text-[#4B5A58]">Featured Partner</p>
							<h3 className="text-2xl font-serif">南方医科大学珠江医院</h3>
							<ul className="space-y-2 text-sm text-[#33413E] md:text-base">
								<li>National Grade A Tertiary Hospital accreditation</li>
								<li>
									<span className="font-semibold text-[#1D302E]">90+ clinical specialties</span> and 600+ senior
									medical experts
								</li>
								<li>Leading capabilities in neurosurgery, oncology, cardiovascular care, and complex surgery</li>
								<li>
									Its <span className="font-semibold text-[#1D302E]">International Medical Center</span> has served
									200,000+ patients from 50+ countries
								</li>
								<li>VIP wards, MDT diagnosis, and personalized private medical services</li>
							</ul>
							<p className="pt-1 text-sm font-semibold text-[#1D302E]">
								This is the level of institution you will be accessing through Korascale.
							</p>
						</div>
					</div>
				</motion.div>
			</motion.section>

			<motion.section
				className="mx-auto max-w-6xl px-6 pb-20"
				variants={containerVariants}
				initial="hidden"
				whileInView="show"
				viewport={{ once: true, amount: 0.16 }}
			>
				<motion.div variants={itemVariants} className="mb-7">
					<h2 className="text-3xl font-serif md:text-4xl">What We Offer</h2>
				</motion.div>
				<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
					{[
						{
							title: 'Specialist Access',
							desc: 'Direct appointments with leading experts, priority scheduling, and multidisciplinary MDT evaluation.',
							icon: 'M4 12h16M12 4v16',
						},
						{
							title: 'End-to-End Medical Coordination',
							desc: 'Diagnosis planning before arrival, hospital documentation support, and on-site medical translation.',
							icon: 'M5 7h14M5 12h14M5 17h9',
						},
						{
							title: 'VIP Medical Experience',
							desc: 'Private consultation pathways, dedicated medical assistant, and fast-track access across procedures.',
							icon: 'M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17.8 6.6 19.8l1-6.1-4.4-4.3 6.1-.9L12 3z',
						},
						{
							title: 'High-End Health Check Programs',
							desc: 'Fully customized health screening, preventive care tracking, and executive-level reports in English.',
							icon: 'M4 19h16M6 16V8m6 8V5m6 11v-6',
						},
						{
							title: 'Recovery & Travel Integration',
							desc: 'Post-treatment recovery stays, low-intensity cultural experiences, and private transport with curated accommodation.',
							icon: 'M3 12h5l2 6 4-12 2 6h5',
							highlight: true,
						},
					].map((item) => (
						<motion.article
							key={item.title}
							variants={itemVariants}
							className={`rounded-2xl border p-6 shadow-sm ${
								item.highlight
									? 'border-[#1B3230] bg-[#1B3230] text-white md:col-span-2 xl:col-span-1'
									: 'border-black/10 bg-[#FEFCF8]'
							}`}
						>
							<div className={`mb-4 inline-flex rounded-full p-2 ${item.highlight ? 'bg-white/14' : 'bg-[#EDE7DE]'}`}>
								<LineIcon path={item.icon} />
							</div>
							<h3 className={`text-xl font-serif ${item.highlight ? 'text-white' : 'text-[#1E2725]'}`}>{item.title}</h3>
							<p className={`mt-3 text-sm leading-relaxed md:text-base ${item.highlight ? 'text-white/85' : 'text-[#3A4A47]'}`}>
								{item.desc}
							</p>
						</motion.article>
					))}
				</div>
			</motion.section>

			<motion.section
				className="mx-auto max-w-6xl px-6 pb-20"
				variants={containerVariants}
				initial="hidden"
				whileInView="show"
				viewport={{ once: true, amount: 0.16 }}
			>
				<div className="grid gap-8 lg:grid-cols-2">
					<motion.div variants={itemVariants} className="rounded-3xl border border-black/10 bg-[#FEFCF8] p-8 shadow-[0_10px_26px_rgba(25,37,35,0.06)]">
						<h2 className="mt-3 text-3xl font-serif">One Patient. One System.</h2>
						<p className="mt-4 leading-relaxed text-[#33413E]">
							We operate on a fully integrated care model combining hospital-level clinical expertise, dedicated GP
							coordination, and full-cycle health management.
						</p>
						<div className="mt-8 grid grid-cols-4 gap-2 text-center text-xs md:text-sm">
							{['Pre-arrival', 'Treatment', 'Recovery', 'Follow-up'].map((step, index) => (
								<div key={step} className="relative">
									<div className="mx-auto mb-2 h-8 w-8 rounded-full border border-[#1F3B3A] bg-[#F5F2ED] text-[#1F3B3A] leading-8">
										{index + 1}
									</div>
									<p className="font-medium text-[#2E3F3C]">{step}</p>
									{index < 3 && <span className="absolute left-[calc(50%+1.1rem)] top-4 hidden h-px w-[calc(100%-2.2rem)] bg-[#99A8A5] md:block" />}
								</div>
							))}
						</div>
					</motion.div>

					<motion.div variants={itemVariants} className="rounded-3xl border border-black/10 bg-[#FEFCF8] p-8 shadow-[0_10px_26px_rgba(25,37,35,0.06)]">
						<h2 className="mt-3 text-3xl font-serif">Why China, Why Korascale</h2>
						<div className="mt-6 grid gap-6 md:grid-cols-2">
							<div>
								<h3 className="text-lg font-semibold text-[#1E2725]">Why China</h3>
								<ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#33413E]">
									<li>Advanced medical technologies at competitive cost</li>
									<li>Strong specialization in complex conditions</li>
									<li>Rapid access compared to Western systems</li>
								</ul>
							</div>
							<div>
								<h3 className="text-lg font-semibold text-[#1E2725]">Why Korascale</h3>
								<ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#33413E]">
									<li>We are not a hospital. We are your system integrator inside China.</li>
									<li>We filter the right hospitals for your condition and timeline</li>
									<li>We remove language, logistics, and system barriers end-to-end</li>
								</ul>
							</div>
						</div>
						<p className="mt-6 text-lg font-semibold text-[#1D302E]">You focus on recovery. We handle everything else.</p>
					</motion.div>
				</div>
			</motion.section>

			<motion.section
				className="mx-auto max-w-6xl px-6 pb-24"
				variants={containerVariants}
				initial="hidden"
				whileInView="show"
				viewport={{ once: true, amount: 0.16 }}
			>
				<div className="grid gap-8 lg:grid-cols-[1fr_1.25fr]">
					<motion.div variants={itemVariants} className="rounded-3xl border border-black/10 bg-[#FEFCF8] p-8 shadow-[0_10px_26px_rgba(25,37,35,0.06)]">
						<h2 className="mt-3 text-3xl font-serif">Ideal For</h2>
						<ul className="mt-5 space-y-3 text-sm leading-relaxed text-[#33413E] md:text-base">
							<li>Patients seeking advanced treatment options</li>
							<li>High-net-worth individuals requiring privacy and efficiency</li>
							<li>Overseas Chinese returning for medical care</li>
							<li>Clients combining health checkups with travel</li>
						</ul>
					</motion.div>

					<motion.div
						variants={itemVariants}
						className="rounded-3xl border border-[#17302E] bg-[radial-gradient(circle_at_top_left,_#355754_0%,_#203C3A_45%,_#132B29_100%)] p-8 text-white shadow-[0_18px_44px_rgba(19,43,41,0.35)] md:p-10"
					>
						<h2 className="mt-3 text-3xl font-serif md:text-4xl">Start Your Medical Journey</h2>
						<p className="mt-4 max-w-xl leading-relaxed text-white/85">
							Tell us your condition, timeline, and expectations. We will design a personalized medical plan within
							48 hours.
						</p>
						<div className="mt-8">
							<a
								href="mailto:customer-service@korascale.com?subject=Medical%20journey%20inquiry"
								className="inline-flex rounded-full border border-white/70 px-6 py-3 text-sm font-semibold !text-white visited:!text-white hover:border-white hover:bg-white/10 hover:!text-white"
							>
								Speak to our medical advisor
							</a>
						</div>
					</motion.div>
				</div>
			</motion.section>
		</main>
	);
}
