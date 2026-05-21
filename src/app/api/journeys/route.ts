import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  mapJourneyRowToJourney,
  normalizeAvailableDates,
  queryJourneyRows,
} from '@/lib/journeyListQuery.server';
import { Journey } from '@/types';

// Route Segment Config - 确保路由被正确识别
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

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
    
    // 解析查询参数：支持 includeAll 参数来获取所有状态的 journeys（用于后台管理）
    const searchParams = request.nextUrl.searchParams;
    const includeAll = searchParams.get('includeAll') === 'true';
    const fieldsParam = searchParams.get('fields') || 'full';
    const minimalFields = fieldsParam === 'minimal';
    const listFields = fieldsParam === 'list';
    
    console.log('[API /journeys] Fetching journeys from database...', { includeAll });
    
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
          isNeon: url.hostname.includes('neon.tech'),
          hasPooler: url.hostname.includes('-pooler'),
          hasPgbouncerParam: url.searchParams.get('pgbouncer') === 'true',
        };
      } catch (parseError) {
        connectionInfo.parseError = String(parseError);
        connectionInfo.rawPrefix = connectionString.substring(0, 100);
      }
    }
    
    console.log('[API /journeys] Database connection info:', connectionInfo);
    
    let rows: Record<string, unknown>[];
    const queryStartTime = Date.now();
    const fieldsMode = minimalFields ? 'minimal' : listFields ? 'list' : 'full';
    try {
      console.time('db-query');
      rows = await queryJourneyRows({ includeAll, fields: fieldsMode });
      console.timeEnd('db-query');

      const queryDuration = Date.now() - queryStartTime;
      console.log(`[API /journeys] Found ${rows.length} journeys in ${queryDuration}ms`, {
        includeAll,
        minimalFields,
      });
    } catch (dbError) {
      const queryDuration = Date.now() - queryStartTime;
      console.error(`[API /journeys] Database query error after ${queryDuration}ms:`, dbError);
      
      // 检查是否是表不存在的错误
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || errorMessage.includes('table')) {
        return NextResponse.json(
          { 
            error: 'Journeys table does not exist. Please run database migrations.',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          },
          { status: 500 }
        );
      }
      
      // 如果是超时错误，返回更友好的错误信息
      if (errorMessage.includes('timeout')) {
        console.error(`[API /journeys] Query timed out after ${queryDuration}ms`);
        return NextResponse.json(
          { 
            error: 'Database query timeout. The database may be slow or overloaded. Please try again later.',
            details:
              process.env.NODE_ENV === 'development'
                ? `Query took ${queryDuration}ms before timeout (30s limit)`
                : undefined
          },
          { status: 504 } // Gateway Timeout
        );
      }
      
      throw dbError; // 重新抛出其他错误
    }
    
    if (minimalFields) {
      return NextResponse.json(
        {
          journeys: rows.map((row: any) => ({
            id: row.id,
            slug: row.slug,
            title: row.title,
          })),
          debug: {
            fields: 'minimal',
          },
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    const journeys = rows.map((row) => mapJourneyRowToJourney(row));
    
    // 设置响应头，禁用缓存并添加 CORS
    return NextResponse.json(
      { journeys },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
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
      place,
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
      extensions: journey.extensions || [],
      hotels: journey.hotels || [],
      heroImage: journey.heroImage || undefined,
      mainContentImage: (journey as any).mainContentImage || undefined,
      priceDetails: (journey as any).priceDetails ?? undefined,
      standardInclusionsList: (journey as any).standardInclusionsList ?? undefined,
      availableDates: normalizeAvailableDates((journey as any).availableDates),
    };
    
    // 插入数据库
    const insertSql = `
      INSERT INTO journeys (
        title, slug, description, short_description, 
        price, original_price, category, journey_type, region, place, city, location,
        duration, difficulty, max_participants, min_participants,
        image, status, featured, rating, review_count,
        data, created_at, updated_at
      ) VALUES (
        $2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,
        $14,$15,$16,$17,$18,$19,$20,$21,$22,
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
      place || null,
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

