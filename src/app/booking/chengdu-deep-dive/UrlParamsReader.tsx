'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface UrlParamsReaderProps {
  onParsed: (params: { [k: string]: string | null }) => void;
}

export default function UrlParamsReader({ onParsed }: UrlParamsReaderProps) {
  const sp = useSearchParams();

  useEffect(() => {
    const keys = ['checkIn','checkOut','adults','children','roomType','hotelId','hotelName'];
    const parsed: { [k: string]: string | null } = {};
    keys.forEach(k => { parsed[k] = sp.get(k); });
    onParsed(parsed);
  }, [sp, onParsed]);

  return null;
}


