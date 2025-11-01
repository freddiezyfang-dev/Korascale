import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Journey } from '@/types';

// GET: 根据slug获取journey
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    // 对 slug 进行 URL 解码，处理可能的编码字符
    const decodedSlug = decodeURIComponent(slug);
    const { rows } = await query('SELECT * FROM journeys WHERE slug = $1', [decodedSlug]);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Journey not found' },
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
      region: row.region,
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

