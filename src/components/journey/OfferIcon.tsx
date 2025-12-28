'use client';

import React from 'react';

// Offer 图标组件
export default function OfferIcon() {
  return (
    <svg 
      className="w-5 h-5" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      stroke="#333"
      strokeWidth="1"
    >
      <path 
        d="M12 2L2 7L12 12L22 7L12 2Z" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M2 17L12 22L22 17" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M2 12L12 17L22 12" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}

