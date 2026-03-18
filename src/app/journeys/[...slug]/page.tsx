import { Suspense } from 'react';
import { journeyAPI } from '@/lib/databaseClient';
import ClientJourneyPage from './ClientJourneyPage';

export const dynamicParams = true;

/**
 * 为 [...slug] 生成静态路径参数
 * 返回格式必须为 { slug: string[] }
 */
export async function generateStaticParams() {
  try {
    const journeys = await journeyAPI.getAll();

    const activeJourneys = journeys.filter((j) => j.status === 'active');

    return activeJourneys.map((journey) => {
      const slugArray = journey.slug.split('/').filter(Boolean);
      return {
        slug: slugArray,
      };
    });
  } catch (error) {
    console.error('[Journeys Detail] Failed to generate static params:', error);
    return [];
  }
}

export default function DynamicJourneyPage() {
  return (
    <Suspense fallback={<div>Loading journey...</div>}>
      <ClientJourneyPage />
    </Suspense>
  );
}

