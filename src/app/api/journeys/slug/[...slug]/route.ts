import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Journey } from '@/types';

/** 标准化 availableDates：确保每项含 enabled（缺省 true），与其他单日游格式一致 */
function normalizeAvailableDates(items: unknown[] | undefined): typeof items {
  if (!Array.isArray(items)) return items ?? [];
  return items.map((item: any) => ({
    ...item,
    enabled: item && typeof item.enabled === 'boolean' ? item.enabled : true,
  }));
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
    
    const { rows } = await query('SELECT * FROM journeys WHERE slug = $1', [slugForQuery]);
    
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
    const baseData = row.data || {};
    const journey: Journey = {
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
      image: row.image,
      status: row.status,
      featured: row.featured,
      rating: row.rating,
      reviewCount: row.review_count,
      // JSONB数据（复杂嵌套）
      ...baseData,
      // 确保这些字段存在（即使为空也要返回）
      standardInclusions: baseData.standardInclusions || {},
      standardInclusionsList: baseData.standardInclusionsList || [],
      offers: baseData.offers || [],
      destinationCount: baseData.destinationCount,
      maxGuests: baseData.maxGuests,
      heroImage: baseData.heroImage ?? undefined,
      mainContentImage: baseData.mainContentImage ?? undefined,
      priceDetails: baseData.priceDetails ?? undefined,
      availableDates: normalizeAvailableDates(baseData.availableDates),
      // 时间戳
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    } as Journey;
    
    return NextResponse.json({ journey });
  } catch (error) {
    console.error('Error fetching journey by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journey' },
      { status: 500 }
    );
  }
}

