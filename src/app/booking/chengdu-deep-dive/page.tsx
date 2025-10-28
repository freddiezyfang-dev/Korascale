'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// 旧地址兼容：统一重定向到新的动态预订页
function ChengduDeepDiveRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams.toString();
    const target = `/booking/chengdu-city-one-day-deep-dive${qs ? `?${qs}` : ''}`;
    router.replace(target);
  }, [router, searchParams]);

  return null;
}

export default function ChengduDeepDiveRedirectPage() {
  return (
    <Suspense fallback={<div>Redirecting...</div>}>
      <ChengduDeepDiveRedirectContent />
    </Suspense>
  );
}


