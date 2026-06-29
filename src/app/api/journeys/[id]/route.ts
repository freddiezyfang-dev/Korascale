import { NextRequest, NextResponse } from 'next/server';
import { enforceAdminWrite } from '@/lib/auth/requireAdmin.server';
import { query } from '@/lib/db';
import { pickFirstValidImagePath, sanitizeImageList, sanitizeImagePath } from '@/lib/imageUtils';
import { resolveHeroImageAlt } from '@/lib/journeyNormalization/fields';
import {
	buildJourneyUpdateMutation,
	buildUpdatePublishCandidate,
	sanitizeJourneyUpdateBody,
} from '@/lib/journeyNormalization/journeyAdminMutation.server';
import { journeyPublishIntegrityJsonResponse } from '@/lib/journeyNormalization/journeyPublishIntegrityHttp';
import {
	loadJourneyDbRowById,
} from '@/lib/journeyNormalization/journeyPublishIntegrity.server';
import { runJourneyPublishIntegrityGate } from '@/lib/journeyNormalization/journeyPublishIntegrityGate.server';
import { journeySlugConflictJsonResponse } from '@/lib/journeyNormalization/journeySlugConflictHttp';
import {
	isJourneySlugUniquenessViolation,
	runJourneySlugUniquenessPreCheck,
} from '@/lib/journeyNormalization/journeySlugUniqueness.server';
import {
  assertJourneySqlSafeForCurrentSchema,
} from '@/lib/journeyNormalization/write';
import { Journey } from '@/types';

/** 标准化 availableDates：确保每项含 enabled（缺省 true），与单日游格式一致 */
function normalizeAvailableDates(items: unknown[] | undefined): unknown[] {
  if (!Array.isArray(items)) return [];
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
    const baseData = sanitizeJourneyBaseData(row.data || {});
    const resolvedHeroAlt = resolveHeroImageAlt(row);
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
      heroAlt: resolvedHeroAlt.value || baseData.heroAlt || baseData.heroImageAlt || undefined,
      mainContentImage: sanitizeImagePath(baseData.mainContentImage),
      images: sanitizeImageList(baseData.images),
      priceDetails: baseData.priceDetails ?? undefined,
      availableDates: normalizeAvailableDates(baseData.availableDates),
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
  const guard = await enforceAdminWrite(request);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await context.params;
    const body = sanitizeJourneyUpdateBody(await request.json());

    const existingRow = await loadJourneyDbRowById(id);
    if (!existingRow) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }

    const publishCandidate = buildUpdatePublishCandidate(existingRow, body);

    if (publishCandidate.status !== 'active') {
      const slugCheck = await runJourneySlugUniquenessPreCheck(publishCandidate);
      if (slugCheck.conflict) {
        return journeySlugConflictJsonResponse();
      }
    }

    const publishGate = await runJourneyPublishIntegrityGate(publishCandidate);
    if (!publishGate.ok) {
      return journeyPublishIntegrityJsonResponse(publishGate);
    }

    const mutation = await buildJourneyUpdateMutation(
      id,
      existingRow,
      body,
      publishGate.seoComplete
    );

    if (!mutation.hasUpdates) {
      return NextResponse.json({ success: true, message: 'No updates provided' });
    }

    assertJourneySqlSafeForCurrentSchema(mutation.updateSql);

    try {
      await query(mutation.updateSql, mutation.updateValues);
    } catch (dbError: unknown) {
      if (isJourneySlugUniquenessViolation(dbError)) {
        return journeySlugConflictJsonResponse();
      }
      const err = dbError as { code?: string; detail?: string };
      if (err.code === '23505') {
        throw new Error(`Duplicate value: ${err.detail || 'Unique constraint violation'}`);
      } else if (err.code === '23503') {
        throw new Error(`Foreign key constraint violation: ${err.detail || 'Referenced record does not exist'}`);
      } else if (err.code === '23502') {
        throw new Error(`Not null constraint violation: ${err.detail || 'Required field is missing'}`);
      }
      throw dbError;
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error updating journey:', error);
    if (isJourneySlugUniquenessViolation(error)) {
      return journeySlugConflictJsonResponse();
    }
    
    // 提取更详细的错误信息
    let errorMessage = 'Failed to update journey';
    const err = error as { message?: string; code?: string; stack?: string };
    if (err?.message) {
      errorMessage = err.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // 如果是数据库错误，提取更具体的信息
    if (err?.code) {
      errorMessage = `Database error: ${err.code} - ${errorMessage}`;
    }
    
    return NextResponse.json(
      { error: errorMessage, details: err?.stack || null },
      { status: 500 }
    );
  }
}

// DELETE: 删除journey
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await enforceAdminWrite(request);
  if (!guard.ok) return guard.response;

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



