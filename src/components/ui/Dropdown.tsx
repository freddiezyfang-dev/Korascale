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
        <div className={`absolute top-full z-[1001] mt-2 ${
          className.includes('right-0') ? 'right-0' : 'left-0'
        }`}>
          {children}
        </div>
      )}
    </div>
  );
}

export function DestinationsDropdown() {
  return (
    <div className="bg-[#f5f1e6] p-[20px] min-w-[200px] shadow-lg border border-[#c99a44] border-t-0" data-name="Destinations Dropdown" data-node-id="236:90">
      <div className="flex flex-col gap-[8px]">
        <Link href="/destinations/sichuan" className="block">
          <div className="px-3 py-3 hover:bg-[#e6d9c7] cursor-pointer transition-all duration-200 group">
            <p className="text-[#c99a44] text-[18px] font-subheading leading-normal capitalize group-hover:text-[#1e3b32] transition-colors duration-200">
              Sichuan & Chongqing
            </p>
          </div>
        </Link>
        <Link href="/destinations/gansu" className="block">
          <div className="px-3 py-3 hover:bg-[#e6d9c7] cursor-pointer transition-all duration-200 group">
            <p className="text-[#c99a44] text-[18px] font-subheading leading-normal capitalize group-hover:text-[#1e3b32] transition-colors duration-200">
              Gansu & Qinghai
            </p>
          </div>
        </Link>
        <Link href="/destinations/shaanxi" className="block">
          <div className="px-3 py-3 hover:bg-[#e6d9c7] cursor-pointer transition-all duration-200 group">
            <p className="text-[#c99a44] text-[18px] font-subheading leading-normal capitalize group-hover:text-[#1e3b32] transition-colors duration-200">
              Shaanxi
            </p>
          </div>
        </Link>
        <Link href="/destinations/xinjiang" className="block">
          <div className="px-3 py-3 hover:bg-[#e6d9c7] cursor-pointer transition-all duration-200 group">
            <p className="text-[#c99a44] text-[18px] font-subheading leading-normal capitalize group-hover:text-[#1e3b32] transition-colors duration-200">
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
    <div className="bg-[#f5f1e6] p-[20px] min-w-[180px] shadow-lg border border-[#c99a44] border-t-0" data-name="Journeys dropdowns" data-node-id="236:116">
      <div className="flex flex-col gap-[8px]">
        <div className="px-3 py-3 hover:bg-[#e6d9c7] cursor-pointer transition-all duration-200 group">
          <p className="text-[#c99a44] text-[18px] font-[Inknut_Antiqua] leading-normal capitalize group-hover:text-[#1e3b32] transition-colors duration-200">
            Travel Style
          </p>
        </div>
        <div className="px-3 py-3 hover:bg-[#e6d9c7] cursor-pointer transition-all duration-200 group">
          <p className="text-[#c99a44] text-[18px] font-[Inknut_Antiqua] leading-normal capitalize group-hover:text-[#1e3b32] transition-colors duration-200">
            Interests
          </p>
        </div>
        <div className="px-3 py-3 hover:bg-[#e6d9c7] cursor-pointer transition-all duration-200 group">
          <p className="text-[#c99a44] text-[18px] font-[Inknut_Antiqua] leading-normal capitalize group-hover:text-[#1e3b32] transition-colors duration-200">
            Months
          </p>
        </div>
        <div className="px-3 py-3 hover:bg-[#e6d9c7] cursor-pointer transition-all duration-200 group">
          <p className="text-[#c99a44] text-[18px] font-[Inknut_Antiqua] leading-normal capitalize group-hover:text-[#1e3b32] transition-colors duration-200">
            Duration
          </p>
        </div>
      </div>
    </div>
  );
}

export function InspirationsDropdown() {
  return (
    <div className="bg-[#f5f1e6] p-[20px] min-w-[220px] shadow-lg border border-[#c99a44] border-t-0" data-name="Inspirations dropdowns" data-node-id="776:402">
      <div className="flex flex-col gap-[8px]">
        <div className="px-3 py-3 hover:bg-[#e6d9c7] cursor-pointer transition-all duration-200 group">
          <p className="text-[#c99a44] text-[18px] font-[Inknut_Antiqua] leading-normal capitalize group-hover:text-[#1e3b32] transition-colors duration-200">
            Food Journeys
          </p>
        </div>
        <div className="px-3 py-3 hover:bg-[#e6d9c7] cursor-pointer transition-all duration-200 group">
          <p className="text-[#c99a44] text-[18px] font-[Inknut_Antiqua] leading-normal capitalize group-hover:text-[#1e3b32] transition-colors duration-200">
            Great Outdoors
          </p>
        </div>
        <div className="px-3 py-3 hover:bg-[#e6d9c7] cursor-pointer transition-all duration-200 group">
          <p className="text-[#c99a44] text-[18px] font-[Inknut_Antiqua] leading-normal capitalize group-hover:text-[#1e3b32] transition-colors duration-200">
            Immersive Encounters
          </p>
        </div>
        <div className="px-3 py-3 hover:bg-[#e6d9c7] cursor-pointer transition-all duration-200 group">
          <p className="text-[#c99a44] text-[18px] font-[Inknut_Antiqua] leading-normal capitalize group-hover:text-[#1e3b32] transition-colors duration-200">
            Spiritual Retreat
          </p>
        </div>
        <div className="px-3 py-3 hover:bg-[#e6d9c7] cursor-pointer transition-all duration-200 group">
          <p className="text-[#c99a44] text-[18px] font-[Inknut_Antiqua] leading-normal capitalize group-hover:text-[#1e3b32] transition-colors duration-200">
            Nightscapes
          </p>
        </div>
        <div className="px-3 py-3 hover:bg-[#e6d9c7] cursor-pointer transition-all duration-200 group">
          <p className="text-[#c99a44] text-[18px] font-[Inknut_Antiqua] leading-normal capitalize group-hover:text-[#1e3b32] transition-colors duration-200">
            Seasonal Highlights
          </p>
        </div>
      </div>
    </div>
  );
}