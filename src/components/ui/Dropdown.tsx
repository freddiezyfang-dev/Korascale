"use client";

import { useState } from "react";
import Link from "next/link";

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
        <Link href="/destinations/sichuan" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal capitalize group-hover:text-black transition-colors duration-200">
              Sichuan & Chongqing
            </p>
          </div>
        </Link>
        <Link href="/destinations/gansu" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal capitalize group-hover:text-black transition-colors duration-200">
              Gansu & Qinghai
            </p>
          </div>
        </Link>
        <Link href="/destinations/shaanxi" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal capitalize group-hover:text-black transition-colors duration-200">
              Shaanxi
            </p>
          </div>
        </Link>
        <Link href="/destinations/xinjiang" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal capitalize group-hover:text-black transition-colors duration-200">
              Xinjiang
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
        <Link href="/journeys/type/explore-together" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal group-hover:text-black transition-colors duration-200">
              Explore Together
            </p>
          </div>
        </Link>
        <Link href="/journeys/type/deep-discovery" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal group-hover:text-black transition-colors duration-200">
              Deep Discovery
            </p>
          </div>
        </Link>
        <Link href="/journeys/type/signature-journeys" className="block">
          <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
            <p className="text-gray-700 text-[18px] font-subheading leading-normal group-hover:text-black transition-colors duration-200">
              Signature Journeys
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function InspirationsDropdown() {
  return (
    <div className="bg-white p-[20px] min-w-[220px] shadow-lg border border-gray-300 border-t-0" data-name="Inspirations dropdowns" data-node-id="776:402">
      <div className="flex flex-col gap-[8px]">
        <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
          <p className="text-gray-700 text-[18px] font-subheading leading-normal capitalize group-hover:text-black transition-colors duration-200">
            Food Journeys
          </p>
        </div>
        <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
          <p className="text-gray-700 text-[18px] font-subheading leading-normal capitalize group-hover:text-black transition-colors duration-200">
            Great Outdoors
          </p>
        </div>
        <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
          <p className="text-gray-700 text-[18px] font-subheading leading-normal capitalize group-hover:text-black transition-colors duration-200">
            Immersive Encounters
          </p>
        </div>
        <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
          <p className="text-gray-700 text-[18px] font-subheading leading-normal capitalize group-hover:text-black transition-colors duration-200">
            Spiritual Retreat
          </p>
        </div>
        <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
          <p className="text-gray-700 text-[18px] font-subheading leading-normal capitalize group-hover:text-black transition-colors duration-200">
            Nightscapes
          </p>
        </div>
        <div className="px-3 py-3 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
          <p className="text-gray-700 text-[18px] font-subheading leading-normal capitalize group-hover:text-black transition-colors duration-200">
            Seasonal Highlights
          </p>
        </div>
      </div>
    </div>
  );
}