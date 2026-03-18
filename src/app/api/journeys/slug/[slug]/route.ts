import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { pickFirstValidImagePath, sanitizeImageList, sanitizeImagePath } from '@/lib/imageUtils';
import { Journey } from '@/types';

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
  };
}

async function queryJourneyBySlug(decodedSlug: string) {
  const timeoutLimitMs = 30000;
  const queryPromise = query('SELECT * FROM journeys WHERE slug = $1', [decodedSlug]);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error(`Database query timeout after ${timeoutLimitMs / 1000} seconds`)),
      timeoutLimitMs
    )
  );

  return (await Promise.race([queryPromise, timeoutPromise])) as Awaited<typeof queryPromise>;
}

// GET: 根据slug获取journey
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    // 对 slug 进行 URL 解码，处理可能的编码字符
    const decodedSlug = decodeURIComponent(slug);
    
    console.log('[API] Fetching journey by slug:', {
      originalSlug: slug,
      decodedSlug: decodedSlug,
      url: request.url
    });
    
    const { rows } = await queryJourneyBySlug(decodedSlug);
    
    console.log('[API] Query result:', {
      rowsCount: rows.length,
      found: rows.length > 0,
      allSlugs: rows.length > 0 ? rows.map(r => r.slug) : 'N/A'
    });
    
    if (rows.length === 0) {
      // 尝试查询所有 journeys 的 slug，用于调试
      const allRows = await query('SELECT id, slug, title FROM journeys LIMIT 10', []);
      console.log('[API] Available journeys:', allRows.rows.map(r => ({ id: r.id, slug: r.slug, title: r.title })));
      
      return NextResponse.json(
        { error: 'Journey not found', searchedSlug: decodedSlug },
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
      offers: baseData.offers || [],
      destinationCount: baseData.destinationCount,
      maxGuests: baseData.maxGuests,
      heroImage: pickFirstValidImagePath(baseData.heroImage, row.image, safePrimaryImage),
      mainContentImage: sanitizeImagePath(baseData.mainContentImage),
      images: sanitizeImageList(baseData.images),
      // 时间戳
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    } as Journey;
    
    // 设置响应头，禁用缓存
    return NextResponse.json(
      { journey },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
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

