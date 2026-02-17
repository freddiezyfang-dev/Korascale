import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: 获取所有 journey hotels
export async function GET() {
  try {
    const { rows } = await query('SELECT * FROM journey_hotels ORDER BY created_at DESC');
    // 将 data JSONB 中的字段展开到顶层，便于前端直接使用
    const hotels = rows.map((row: any) => {
      const data = row.data || {};
      return {
        ...row,
        galleryImages: Array.isArray(data.galleryImages) ? data.galleryImages : [],
        longDescription: typeof data.longDescription === 'string' ? data.longDescription : ''
      };
    });
    return NextResponse.json({ hotels });
  } catch (error) {
    console.error('Error fetching journey hotels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journey hotels' },
      { status: 500 }
    );
  }
}

// POST: 创建新 journey hotel
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const {
      name,
      location,
      image,
      status = 'active',
      galleryImages,
      longDescription,
      data: extraData = {}
    } = data;
    
    const { rows } = await query(
      `INSERT INTO journey_hotels (
        name, location, image, status, data, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5::jsonb, NOW(), NOW())
      RETURNING *`,
      [
        name || null,
        location || null,
        image || null,
        status || 'active',
        JSON.stringify({
          ...(extraData || {}),
          ...(Array.isArray(galleryImages) ? { galleryImages } : {}),
          ...(longDescription ? { longDescription } : {})
        })
      ]
    );
    
    const row: any = rows[0];
    const rowData = row.data || {};
    const hotel = {
      ...row,
      galleryImages: Array.isArray(rowData.galleryImages) ? rowData.galleryImages : [],
      longDescription: typeof rowData.longDescription === 'string' ? rowData.longDescription : ''
    };

    return NextResponse.json({ hotel });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error creating journey hotel:', error);
    const isTableMissing = /relation "?journey_hotels"? does not exist/i.test(message) ||
      /relation.*journey_hotels/i.test(message);
    const isNoDb = /Missing POSTGRES_URL|NEON_POSTGRES_URL/i.test(message);
    const hint = isTableMissing
      ? ' 请先在 Neon 执行 database/migrations/006_create_extensions_and_hotels.sql 创建 journey_hotels 表。'
      : isNoDb
        ? ' 请配置 .env.local 中的 NEON_POSTGRES_URL 或 POSTGRES_URL。'
        : '';
    return NextResponse.json(
      {
        error: 'Failed to create journey hotel',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
        hint: hint || undefined
      },
      { status: 500 }
    );
  }
}
