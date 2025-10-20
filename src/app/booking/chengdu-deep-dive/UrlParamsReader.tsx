'use client';

import React, { useEffect } from 'react';

interface UrlParamsReaderProps {
  onParsed: (params: { [k: string]: string | null }) => void;
}

export default function UrlParamsReader({ onParsed }: UrlParamsReaderProps) {
  useEffect(() => {
    const keys = ['checkIn','checkOut','adults','children','roomType','hotelId','hotelName'];
    const parsed: { [k: string]: string | null } = {};
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      keys.forEach(k => { parsed[k] = sp.get(k); });
      onParsed(parsed);
    }
  }, [onParsed]);

  return null;
}


