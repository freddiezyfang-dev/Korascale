import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { pickFirstValidImagePath, sanitizeImageList, sanitizeImagePath } from '@/lib/imageUtils';
import { Journey } from '@/types';

/** 标准化 availableDates：确保每项含 enabled（缺省 true），与其他单日游格式一致 */
function normalizeAvailableDates(items: unknown[] | undefined): typeof items {
  if (!Array.isArray(items)) return items ?? [];
  return items.map((item: any) => ({
    ...item,
    enabled: item && typeof item.enabled === 'boolean' ? item.enabled : true,
  }));
}

function sanitizeJourneyBaseData(baseData: any) {
  const safeImages = sanitizeImageList(baseData?.images);
  const safeOverview = baseData?.overview
    ? {
        ...baseData.overview,
        sideImage: sanitizeImagePath(baseData.overview.sideImage),
      }
    : undefined;
  const safeItinerary = Array.isArray(baseData?.itinerary)
    ? baseData.itinerary.map((item: any) => ({
        ...item,
        image: sanitizeImagePath(item?.image),
      }))
    : [];

  return {
    ...baseData,
    images: safeImages,
    overview: safeOverview,
    itinerary: safeItinerary,
    heroImage: sanitizeImagePath(baseData?.heroImage),
    mainContentImage: sanitizeImagePath(baseData?.mainContentImage),
    availableDates: normalizeAvailableDates(baseData?.availableDates),
  };
}

async function queryJourneyBySlug(slugForQuery: string) {
  const timeoutLimitMs = 30000;
  const queryPromise = query('SELECT * FROM journeys WHERE slug = $1', [slugForQuery]);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Database query timeout after ${timeoutLimitMs / 1000} seconds`)),
      timeoutLimitMs
    )
  );

  return (await Promise.race([queryPromise, timeoutPromise])) as Awaited<typeof queryPromise>;
}

// GET: 根据slug获取journey (catch-all route for slugs with /)；支持带前缀的 slug fallback 避免 404
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug: slugParam } = await context.params;
    // 多段路径时一律用最后一段作为查库 slug，强力适配前端传错路径
    const arr = Array.isArray(slugParam) ? slugParam : [slugParam].filter(Boolean);
    const lastSegment = arr.length > 0 ? arr[arr.length - 1] : null;
    const slugForQuery =
      lastSegment != null
        ? decodeURIComponent(String(lastSegment).trim())
        : '';
    
    console.log('[API] Fetching journey by slug (catch-all):', {
      slugParam,
      lastSegment,
      slugForQuery,
      url: request.url
    });
    
    if (!slugForQuery) {
      return NextResponse.json(
        { error: 'Journey not found', searchedSlug: '' },
        { status: 404 }
      );
    }
    
    const { rows } = await queryJourneyBySlug(slugForQuery);
    
    console.log('[API] Query result (catch-all):', {
      rowsCount: rows.length,
      found: rows.length > 0
    });
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Journey not found', searchedSlug: slugForQuery },
        { status: 404 }
      );
    }
    
    const row = rows[0];
    const baseData = sanitizeJourneyBaseData(row.data || {});
    const safePrimaryImage = pickFirstValidImagePath(
      row.image,
      baseData.image,
      baseData.heroImage,
      baseData.mainContentImage,
      baseData.images?.[0]
    );
    const journey: Journey = {
      ...baseData,
      // 基础字段（结构化列）
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      shortDescription: row.short_description,
      price: row.price,
      originalPrice: row.original_price,
      category: row.category,
      journeyType: row.journey_type || undefined, // 版面分类
      region: row.region,
      place: row.place || undefined,
      city: row.city,
      location: row.location,
      duration: row.duration,
      difficulty: row.difficulty,
      maxParticipants: row.max_participants,
      minParticipants: row.min_participants,
      image: safePrimaryImage,
      status: row.status,
      featured: row.featured,
      rating: row.rating,
      reviewCount: row.review_count,
      // 确保这些字段存在（即使为空也要返回）
      standardInclusions: baseData.standardInclusions || {},
      standardInclusionsList: baseData.standardInclusionsList || [],
      offers: baseData.offers || [],
      destinationCount: baseData.destinationCount,
      maxGuests: baseData.maxGuests,
      heroImage: pickFirstValidImagePath(baseData.heroImage, row.image, safePrimaryImage),
      mainContentImage: sanitizeImagePath(baseData.mainContentImage),
      images: sanitizeImageList(baseData.images),
      priceDetails: baseData.priceDetails ?? undefined,
      availableDates: normalizeAvailableDates(baseData.availableDates),
      // 时间戳
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    } as Journey;
    
    return NextResponse.json({ journey });
  } catch (error) {
    console.error('Error fetching journey by slug:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: errorMessage.includes('timeout')
          ? 'Database query timeout. The database may be slow or overloaded. Please try again later.'
          : 'Failed to fetch journey',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: errorMessage.includes('timeout') ? 504 : 500 }
    );
  }
}

