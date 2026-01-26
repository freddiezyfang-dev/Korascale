import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Journey } from '@/types';

// GET: 获取单个journey
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // 如果 id 看起来像 slug（包含连字符或斜杠），应该使用 slug 路由
    // UUID 格式：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36字符，包含连字符)
    // 如果 id 很短或包含斜杠，可能是 slug，应该返回 404 让 slug 路由处理
    if (id.length < 36 || id.includes('/')) {
      return NextResponse.json(
        { error: 'Journey not found. Use /api/journeys/slug/[slug] for slug-based queries.' },
        { status: 404 }
      );
    }
    
    const { rows } = await query('SELECT * FROM journeys WHERE id = $1', [id]);
    
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
    console.error('Error fetching journey:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journey' },
      { status: 500 }
    );
  }
}

// PUT: 更新journey
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const updates: Partial<Journey> = await request.json();
    
    // 构建更新查询
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;
    
    // JSONB字段更新（提前声明，以便在检查place列时使用）
    const jsonbUpdates: any = {};
    
    // 基础字段
    if (updates.title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      updateValues.push(updates.title);
    }
    if ((updates as any).slug !== undefined) {
      updateFields.push(`slug = $${paramIndex++}`);
      updateValues.push((updates as any).slug);
    }
    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(updates.description);
    }
    if ((updates as any).shortDescription !== undefined) {
      updateFields.push(`short_description = $${paramIndex++}`);
      updateValues.push((updates as any).shortDescription);
    }
    if ((updates as any).price !== undefined) {
      updateFields.push(`price = $${paramIndex++}`);
      updateValues.push((updates as any).price);
    }
    if ((updates as any).originalPrice !== undefined) {
      updateFields.push(`original_price = $${paramIndex++}`);
      updateValues.push((updates as any).originalPrice);
    }
    if ((updates as any).category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      updateValues.push((updates as any).category);
    }
    if ((updates as any).journeyType !== undefined) {
      updateFields.push(`journey_type = $${paramIndex++}`);
      updateValues.push((updates as any).journeyType);
    }
    if (updates.location !== undefined) {
      updateFields.push(`location = $${paramIndex++}`);
      updateValues.push(updates.location as any);
    }
    if (updates.city !== undefined) {
      updateFields.push(`city = $${paramIndex++}`);
      updateValues.push(updates.city as any);
    }
    if (updates.region !== undefined) {
      updateFields.push(`region = $${paramIndex++}`);
      updateValues.push(updates.region as any);
    }
    if ((updates as any).place !== undefined) {
      // 检查 place 列是否存在（如果不存在，跳过更新该字段）
      try {
        // 先检查列是否存在
        const { rows: columnCheck } = await query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'journeys' AND column_name = 'place'
        `);
        
        if (columnCheck.length > 0) {
          updateFields.push(`place = $${paramIndex++}`);
          updateValues.push((updates as any).place);
        } else {
          console.warn('place column does not exist in journeys table. Storing in JSONB data field. Please run migration 004_add_place_field.sql');
          // 如果列不存在，将 place 数据存储到 JSONB data 字段中作为临时方案
          if (!jsonbUpdates.place) {
            jsonbUpdates.place = (updates as any).place;
          }
        }
      } catch (checkError) {
        console.warn('Could not check for place column:', checkError);
        // 如果检查失败，使用 JSONB 作为安全的后备方案，而不是尝试直接更新
        console.warn('Using JSONB data field as fallback for place');
        if (!jsonbUpdates.place) {
          jsonbUpdates.place = (updates as any).place;
        }
      }
    }
    if ((updates as any).duration !== undefined) {
      updateFields.push(`duration = $${paramIndex++}`);
      updateValues.push((updates as any).duration);
    }
    if ((updates as any).difficulty !== undefined) {
      updateFields.push(`difficulty = $${paramIndex++}`);
      updateValues.push((updates as any).difficulty);
    }
    if ((updates as any).maxParticipants !== undefined) {
      updateFields.push(`max_participants = $${paramIndex++}`);
      updateValues.push((updates as any).maxParticipants);
    }
    if ((updates as any).minParticipants !== undefined) {
      updateFields.push(`min_participants = $${paramIndex++}`);
      updateValues.push((updates as any).minParticipants);
    }
    if ((updates as any).image !== undefined) {
      updateFields.push(`image = $${paramIndex++}`);
      updateValues.push((updates as any).image);
    }
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(updates.status);
    }
    if (updates.featured !== undefined) {
      updateFields.push(`featured = $${paramIndex++}`);
      updateValues.push(updates.featured);
    }
    if ((updates as any).rating !== undefined) {
      updateFields.push(`rating = $${paramIndex++}`);
      updateValues.push((updates as any).rating);
    }
    if ((updates as any).reviewCount !== undefined) {
      updateFields.push(`review_count = $${paramIndex++}`);
      updateValues.push((updates as any).reviewCount);
    }
    
    // JSONB字段更新（继续添加其他JSONB字段）
    if (updates.itinerary !== undefined) jsonbUpdates.itinerary = updates.itinerary;
    if (updates.overview !== undefined) jsonbUpdates.overview = updates.overview;
    if (updates.includes !== undefined) jsonbUpdates.includes = updates.includes;
    if (updates.excludes !== undefined) jsonbUpdates.excludes = updates.excludes;
    if ((updates as any).images !== undefined) jsonbUpdates.images = (updates as any).images;
    if ((updates as any).highlights !== undefined) jsonbUpdates.highlights = (updates as any).highlights;
    if ((updates as any).experiences !== undefined) jsonbUpdates.experiences = (updates as any).experiences;
    if ((updates as any).accommodations !== undefined) jsonbUpdates.accommodations = (updates as any).accommodations;
    if ((updates as any).availableExperiences !== undefined) jsonbUpdates.availableExperiences = (updates as any).availableExperiences;
    if ((updates as any).availableAccommodations !== undefined) jsonbUpdates.availableAccommodations = (updates as any).availableAccommodations;
    if ((updates as any).availableDates !== undefined) jsonbUpdates.availableDates = (updates as any).availableDates;
    if ((updates as any).included !== undefined) jsonbUpdates.included = (updates as any).included;
    if ((updates as any).excluded !== undefined) jsonbUpdates.excluded = (updates as any).excluded;
    if ((updates as any).heroStats !== undefined) jsonbUpdates.heroStats = (updates as any).heroStats;
    if ((updates as any).navigation !== undefined) jsonbUpdates.navigation = (updates as any).navigation;
    if ((updates as any).pageTitle !== undefined) jsonbUpdates.pageTitle = (updates as any).pageTitle;
    if ((updates as any).heroImage !== undefined) jsonbUpdates.heroImage = (updates as any).heroImage;
    if ((updates as any).destinationCount !== undefined) jsonbUpdates.destinationCount = (updates as any).destinationCount;
    if ((updates as any).maxGuests !== undefined) jsonbUpdates.maxGuests = (updates as any).maxGuests;
    if ((updates as any).modules !== undefined) jsonbUpdates.modules = (updates as any).modules;
    if ((updates as any).relatedTrips !== undefined) jsonbUpdates.relatedTrips = (updates as any).relatedTrips;
    if ((updates as any).offers !== undefined) jsonbUpdates.offers = (updates as any).offers;
    if ((updates as any).standardInclusions !== undefined) jsonbUpdates.standardInclusions = (updates as any).standardInclusions;
    if ((updates as any).extensions !== undefined) jsonbUpdates.extensions = (updates as any).extensions;
    if ((updates as any).hotels !== undefined) jsonbUpdates.hotels = (updates as any).hotels;
    
    // 先获取journey ID并验证journey是否存在
    const { id } = await context.params;
    
    // 验证journey是否存在
    const { rows: existingRows } = await query('SELECT id FROM journeys WHERE id = $1', [id]);
    if (existingRows.length === 0) {
      return NextResponse.json(
        { error: 'Journey not found' },
        { status: 404 }
      );
    }
    
    if (Object.keys(jsonbUpdates).length > 0) {
      // 合并现有的JSONB数据
      try {
        const { rows } = await query('SELECT data FROM journeys WHERE id = $1', [id]);
        const existingData = rows[0]?.data || {};
        // 深度合并，确保所有字段都被正确保存
        const mergedData = {
          ...existingData,
          ...jsonbUpdates,
          // 确保这些字段被正确保存（即使为空也要保存）
          standardInclusions: jsonbUpdates.standardInclusions !== undefined 
            ? jsonbUpdates.standardInclusions 
            : existingData.standardInclusions,
          offers: jsonbUpdates.offers !== undefined 
            ? jsonbUpdates.offers 
            : existingData.offers,
          maxGuests: jsonbUpdates.maxGuests !== undefined 
            ? jsonbUpdates.maxGuests 
            : existingData.maxGuests,
        };
        
        updateFields.push(`data = $${paramIndex++}`);
        updateValues.push(JSON.stringify(mergedData));
      } catch (jsonbError: any) {
        console.error('Error merging JSONB data:', jsonbError);
        // 如果合并失败，直接使用新的数据
        updateFields.push(`data = $${paramIndex++}`);
        updateValues.push(JSON.stringify(jsonbUpdates));
      }
    }
    
    if (updateFields.length === 0) {
      return NextResponse.json({ success: true, message: 'No updates provided' });
    }
    
    // 更新updated_at
    updateFields.push(`updated_at = NOW()`);
    
    const updateSql = `
      UPDATE journeys 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, updated_at
    `;
    updateValues.push(id);
    
    try {
      await query(updateSql, updateValues);
    } catch (dbError: any) {
      // 如果是数据库约束错误，提供更详细的错误信息
      if (dbError.code === '23505') { // 唯一约束违反
        throw new Error(`Duplicate value: ${dbError.detail || 'Unique constraint violation'}`);
      } else if (dbError.code === '23503') { // 外键约束违反
        throw new Error(`Foreign key constraint violation: ${dbError.detail || 'Referenced record does not exist'}`);
      } else if (dbError.code === '23502') { // 非空约束违反
        throw new Error(`Not null constraint violation: ${dbError.detail || 'Required field is missing'}`);
      }
      throw dbError;
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating journey:', error);
    
    // 提取更详细的错误信息
    let errorMessage = 'Failed to update journey';
    if (error?.message) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // 如果是数据库错误，提取更具体的信息
    if (error?.code) {
      errorMessage = `Database error: ${error.code} - ${errorMessage}`;
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error?.stack || null },
      { status: 500 }
    );
  }
}

// DELETE: 删除journey
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await query('DELETE FROM journeys WHERE id = $1', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting journey:', error);
    return NextResponse.json(
      { error: 'Failed to delete journey' },
      { status: 500 }
    );
  }
}



