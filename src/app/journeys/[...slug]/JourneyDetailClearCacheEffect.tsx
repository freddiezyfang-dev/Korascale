'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJourneyManagement } from '@/context/JourneyManagementContext';

type JourneyDetailClearCacheEffectProps = {
  normalizedSlug: string;
};

/** Isolated client effect so the main page can SSR without useSearchParams blocking. */
export default function JourneyDetailClearCacheEffect({
  normalizedSlug,
}: JourneyDetailClearCacheEffectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearStorageAndReload } = useJourneyManagement();

  useEffect(() => {
    if (searchParams.get('clearCache') !== '1') return;
    (async () => {
      await clearStorageAndReload();
      router.replace(`/journeys/${normalizedSlug}`, { scroll: true });
    })();
  }, [clearStorageAndReload, normalizedSlug, router, searchParams]);

  return null;
}
