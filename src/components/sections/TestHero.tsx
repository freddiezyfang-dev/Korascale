"use client";

import Link from "next/link";

export default function TestHero() {
  return (
    <div className="relative w-full h-[600px] bg-gradient-to-r from-[#1e3b32] to-[#c99a44] flex items-center justify-center">
      <div className="text-center text-white px-4 max-w-4xl">
        <h1 className="text-5xl md:text-6xl font-normal mb-8 font-heading max-w-4xl">
          Unveil the beauty. Embrace the culture. Explore Western China like never before.
        </h1>
        <Link 
          href="/destinations"
          className="bg-white text-black px-8 py-3 rounded-lg font-bold text-xl hover:bg-gray-100 transition-colors"
        >
          Explore now
        </Link>
      </div>
    </div>
  );
}
