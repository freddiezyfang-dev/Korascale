"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ARTICLE_CATEGORIES,
  ArticleCategoryToSlug,
  ArticleCategoryToCardTitle,
} from '@/types/article';
import { solutionsNavItems } from '@/config/navigation';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function Dropdown({ trigger, children, className = "" }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div 
          className={`absolute top-full left-0 z-[1001] ${
            className.includes('right-0') ? 'right-0 left-auto' : ''
          }`}
          style={{ paddingTop: '8px' }}
        >
          <div
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export function DestinationsDropdown() {
  return (
    <div className="bg-white p-[20px] min-w-[200px] shadow-lg border border-gray-300 border-t-0" data-name="Destinations Dropdown" data-node-id="236:90">
      <div className="flex flex-col gap-[8px]">
        <Link prefetch={true} href="/destinations/southwest-china" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal capitalize group-hover:text-black transition-colors duration-200">
              Southwest China
            </p>
          </div>
        </Link>
        <Link prefetch={true} href="/destinations/northwest" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal capitalize group-hover:text-black transition-colors duration-200">
              Northwest & Northern Frontier
            </p>
          </div>
        </Link>
        <Link prefetch={true} href="/destinations/north" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal capitalize group-hover:text-black transition-colors duration-200">
              North China
            </p>
          </div>
        </Link>
        <Link prefetch={true} href="/destinations/south" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal capitalize group-hover:text-black transition-colors duration-200">
              South China
            </p>
          </div>
        </Link>
        <Link prefetch={true} href="/destinations/east-central" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal capitalize group-hover:text-black transition-colors duration-200">
              East & Central China
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function JourneysDropdown() {
  return (
    <div className="bg-white p-[20px] min-w-[220px] shadow-lg border border-gray-300 border-t-0" data-name="Journeys dropdowns" data-node-id="236:116">
      <div className="flex flex-col gap-[8px]">
        <Link prefetch={true} href="/journeys/type/explore-together" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal group-hover:text-black transition-colors duration-200">
              Explore Together
            </p>
          </div>
        </Link>
        <Link prefetch={true} href="/journeys/type/deep-discovery" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal group-hover:text-black transition-colors duration-200">
              Deep Discovery
            </p>
          </div>
        </Link>
        <Link prefetch={true} href="/journeys/type/signature-journeys" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal group-hover:text-black transition-colors duration-200">
              Signature Journeys
            </p>
          </div>
        </Link>
        <Link prefetch={true} href="/journeys/type/group-tours" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal group-hover:text-black transition-colors duration-200">
              Group Tours
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function InspirationsDropdown() {
  return (
    <div className="bg-white p-[20px] min-w-[260px] shadow-lg border border-gray-300 border-t-0" data-name="Inspirations dropdowns" data-node-id="776:402">
      <div className="flex flex-col gap-[4px]">
        {ARTICLE_CATEGORIES.map((cat) => (
          <Link
            prefetch={true}
            key={cat}
            href={`/inspirations/${ArticleCategoryToSlug[cat]}`}
            className="block px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group rounded-sm"
          >
            <p className="text-gray-800 text-[17px] font-serif leading-snug group-hover:text-black transition-colors duration-200">
              {ArticleCategoryToCardTitle[cat]}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SolutionsDropdown() {
  return (
    <div className="bg-white p-[20px] min-w-[260px] shadow-lg border border-gray-300 border-t-0" data-name="Solutions dropdown">
      <div className="flex flex-col gap-[8px]">
        {solutionsNavItems.map((item) => (
          <Link prefetch={true} key={item.href} href={item.href} className="block">
            <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
              <p className="text-gray-700 text-[18px] font-subheading leading-normal group-hover:text-black transition-colors duration-200">
                {item.label}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}