import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Journey } from '@/types';

// GET: 根据slug获取journey (catch-all route for slugs with /)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug: slugArray } = await context.params;
    // catch-all 路由返回数组，需要合并
    const slug = Array.isArray(slugArray) ? slugArray.join('/') : (slugArray || '');
    // 对 slug 进行 URL 解码，处理可能的编码字符
    const decodedSlug = decodeURIComponent(slug);
    
    console.log('[API] Fetching journey by slug (catch-all):', {
      slugArray: slugArray,
      joinedSlug: slug,
      decodedSlug: decodedSlug,
      url: request.url
    });
    
    const { rows } = await query('SELECT * FROM journeys WHERE slug = $1', [decodedSlug]);
    
    console.log('[API] Query result (catch-all):', {
      rowsCount: rows.length,
      found: rows.length > 0
    });
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Journey not found', searchedSlug: decodedSlug },
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
      offers: baseData.offers || [],
      destinationCount: baseData.destinationCount,
      maxGuests: baseData.maxGuests,
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

