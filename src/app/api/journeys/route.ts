import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Journey } from '@/types';

// GET: 获取所有journeys
export async function GET(request: NextRequest) {
  try {
    // 检查数据库连接（支持 NEON_POSTGRES_URL 或 POSTGRES_URL）
    const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      console.error('[API /journeys] Both POSTGRES_URL and NEON_POSTGRES_URL are missing');
      return NextResponse.json(
        { error: 'Database not configured. POSTGRES_URL or NEON_POSTGRES_URL is missing.' },
        { status: 500 }
      );
    }
    
    console.log('[API /journeys] Fetching journeys from database...');
    
    // 解析连接字符串以诊断问题
    let connectionInfo: any = {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasNeonPostgresUrl: !!process.env.NEON_POSTGRES_URL,
      usingConnection: process.env.NEON_POSTGRES_URL ? 'NEON_POSTGRES_URL' : 'POSTGRES_URL',
      connectionStringLength: connectionString?.length || 0,
    };
    
    // 尝试解析连接字符串
    if (connectionString) {
      try {
        const url = new URL(connectionString);
        connectionInfo.parsed = {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || 'default',
          database: url.pathname?.replace('/', '') || 'N/A',
          username: url.username || 'N/A',
          hasPassword: !!url.password,
        };
      } catch (parseError) {
        connectionInfo.parseError = String(parseError);
        connectionInfo.rawPrefix = connectionString.substring(0, 100);
      }
    }
    
    console.log('[API /journeys] Database connection info:', connectionInfo);
    
    // 先检查表是否存在
    let tableExists = false;
    try {
      const checkTableResult = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'journeys'
        );
      `);
      tableExists = checkTableResult.rows[0]?.exists || false;
      console.log('[API /journeys] Table exists check:', tableExists);
      
      if (!tableExists) {
        // 列出所有表用于调试
        const allTablesResult = await query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `);
        console.log('[API /journeys] Available tables:', allTablesResult.rows.map(r => r.table_name));
        
        return NextResponse.json(
          { 
            error: 'Journeys table does not exist. Please run database migrations.',
            availableTables: allTablesResult.rows.map(r => r.table_name),
            details: process.env.NODE_ENV === 'development' ? 'Table check failed' : undefined
          },
          { status: 500 }
        );
      }
    } catch (checkError) {
      console.error('[API /journeys] Error checking table existence:', checkError);
      return NextResponse.json(
        { 
          error: 'Database connection error',
          details: process.env.NODE_ENV === 'development' ? String(checkError) : undefined
        },
        { status: 500 }
      );
    }
    
    let rows;
    try {
      const result = await query('SELECT * FROM journeys ORDER BY created_at DESC');
      rows = result.rows;
      console.log('[API /journeys] Found', rows.length, 'journeys');
    } catch (dbError) {
      console.error('[API /journeys] Database query error:', dbError);
      throw dbError; // 重新抛出其他错误
    }
    
    // 转换数据库格式到应用格式
    const journeys = rows.map(row => {
      const baseData = row.data || {};
      return {
        // 基础字段
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
        // JSONB数据
        ...baseData,
        // 时间戳
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };
    });
    
    // 设置响应头，禁用缓存
    return NextResponse.json(
      { journeys },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching journeys:', error);
    
    // 提供更详细的错误信息
    let errorMessage = 'Failed to fetch journeys';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// POST: 创建新journey
export async function POST(request: NextRequest) {
  try {
    const journey: Omit<Journey, 'id' | 'createdAt' | 'updatedAt'> = await request.json();
    
    // 提取结构化字段
    const {
      title,
      slug,
      description,
      shortDescription,
      price,
      originalPrice,
      category,
      journeyType,
      region,
      city,
      location,
      duration,
      difficulty,
      maxParticipants,
      minParticipants,
      image,
      status,
      featured,
      rating,
      reviewCount,
    } = journey;
    
    // 提取JSONB字段（复杂嵌套结构）
    const jsonbData = {
      itinerary: journey.itinerary || [],
      overview: journey.overview || {},
      includes: journey.includes || '',
      excludes: journey.excludes || '',
      modules: journey.modules || [],
      heroStats: journey.heroStats || {},
      images: journey.images || [],
      availableExperiences: journey.availableExperiences || [],
      availableAccommodations: journey.availableAccommodations || [],
      experiences: journey.experiences || [],
      accommodations: journey.accommodations || [],
      highlights: journey.highlights || [],
      included: journey.included || [],
      excluded: journey.excluded || [],
      requirements: journey.requirements || [],
      bestTimeToVisit: journey.bestTimeToVisit || [],
      tags: journey.tags || [],
      navigation: journey.navigation || [],
    };
    
    // 插入数据库
    const insertSql = `
      INSERT INTO journeys (
        title, slug, description, short_description, 
        price, original_price, category, journey_type, region, city, location,
        duration, difficulty, max_participants, min_participants,
        image, status, featured, rating, review_count,
        data, created_at, updated_at
      ) VALUES (
        $2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
        $13,$14,$15,$16,$17,$18,$19,$20,$21,
        $1::jsonb,NOW(),NOW()
      ) RETURNING id, created_at, updated_at
    `;
    const params = [
      JSON.stringify(jsonbData),
      title,
      slug,
      description || null,
      shortDescription || null,
      price || 0,
      originalPrice || null,
      category || null,
      journeyType || null, // journey_type
      region || null,
      city || null,
      location || null,
      duration || null,
      difficulty || 'Easy',
      maxParticipants || 12,
      minParticipants || 2,
      image || null,
      status || 'draft',
      featured || false,
      rating || 0,
      reviewCount || 0,
    ];
    const { rows } = await query(insertSql, params);
    
    return NextResponse.json({
      success: true,
      journey: {
        ...journey,
        id: rows[0].id,
        createdAt: new Date(rows[0].created_at),
        updatedAt: new Date(rows[0].updated_at),
      },
    });
  } catch (error) {
    console.error('Error creating journey:', error);
    return NextResponse.json(
      { error: 'Failed to create journey' },
      { status: 500 }
    );
  }
}

