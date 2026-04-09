"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';

const heroPoster = '/images/hero/slide2.jpg';
const heroVideo = '/videos/solution-hero.mp4';
const corporateImage = '/images/hero/wuyuan.jpg';
const healthcareImage = '/images/healthcare.jpg';

const fadeInUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-[#F5F2ED]">
      {/* Hero Banner */}
      <section className="relative h-[60vh] min-h-[520px] w-full overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={heroPoster}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gray-900/20" />
        <div className="relative z-10 h-full">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-center px-6 text-center lg:justify-start lg:text-left">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="max-w-3xl"
            >
              <h1 className="font-serif text-4xl md:text-5xl leading-[1.1] text-white">
                Beyond Travel — Designed Experiences Across China
              </h1>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <motion.section
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full py-16 mb-20"
      >
        <div className="mx-auto max-w-[850px] px-6 text-center">
          <p className="font-sans text-[18px] md:text-[19px] leading-[1.75] text-[#333]">
            From corporate travel to healthcare access, Korascale delivers integrated
            solutions for those who need more than a standard journey. We design seamless,
            high-standard experiences tailored to individuals, teams, and organizations
            navigating China.
          </p>
          <div className="w-20 h-[1.5px] bg-gray-300 mx-auto mt-10" />
        </div>
      </motion.section>

      {/* Core Sections */}
      <section className="mx-auto max-w-7xl px-6">
        {/* Section 1 */}
        <div className="py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm"
            >
              <div
                className="aspect-[16/11] w-full bg-cover bg-center"
                style={{ backgroundImage: `url('${corporateImage}')` }}
              />
            </motion.div>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
              className="max-w-xl"
            >
              <h3 className="mb-6 font-serif text-3xl text-gray-900">
                Corporate Travel &amp; Experiences
              </h3>
              <p className="text-lg leading-relaxed text-gray-800">
                Elevating corporate retreats and MICE with exclusive access to private venues,
                heritage sites, and seamless logistics across China’s Tier-1 cities and hidden
                gems.
              </p>
              <div className="mt-8">
                <Link
                  prefetch={true}
                  href="/solutions/corporate-travel-experiences"
                  className="inline-flex items-center text-sm font-subheading font-semibold text-gray-900 underline underline-offset-4 hover:opacity-80"
                >
                  Learn More
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="max-w-xl lg:order-2"
            >
              <h3 className="mb-6 font-serif text-3xl text-gray-900">
                Healthcare Access in China
              </h3>
              <p className="text-lg leading-relaxed text-gray-800">
                Navigating China's premier medical landscape. We provide high-net-worth
                individuals and expatriates with direct channels to top-tier specialists and
                international-standard care.
              </p>
              <div className="mt-8">
                <Link
                  prefetch={true}
                  href="/solutions/healthcare-access-china"
                  className="inline-flex items-center text-sm font-subheading font-semibold text-gray-900 underline underline-offset-4 hover:opacity-80"
                >
                  Learn More
                </Link>
              </div>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
              className="relative overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm lg:order-1"
            >
              <div
                className="aspect-[16/11] w-full bg-cover bg-center"
                style={{ backgroundImage: `url('${healthcareImage}')` }}
              />
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}
