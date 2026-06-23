import { NextRequest, NextResponse } from 'next/server';
import { enforceAdminWrite } from '@/lib/auth/requireAdmin.server';
import { filterArticlesForPublicRead, isAuthenticatedAdmin } from '@/lib/auth/articleAccess.server';
import { query } from '@/lib/db';
import { mapArticleRowFromDb } from '@/lib/mapArticleApiRow';
import { Article } from '@/types/article';

// Route Segment Config - 确保路由被正确识别（Next.js 15 必需）
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// GET: 获取所有articles；?featured=true 时仅返回首页精选，按 display_order 1–5 排序
export async function GET(request: NextRequest) {
  const featuredOnly = request.nextUrl.searchParams.get('featured') === 'true';
  const listOnly = request.nextUrl.searchParams.get('fields') === 'list';
  console.log(
    '[API /articles] GET request received',
    featuredOnly ? '(featured only)' : '',
    listOnly ? '(fields=list)' : ''
  );
  
  try {
    // 检查数据库连接
    const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      console.error('[API /articles] Both POSTGRES_URL and NEON_POSTGRES_URL are missing');
      return NextResponse.json(
        { error: 'Database not configured. POSTGRES_URL or NEON_POSTGRES_URL is missing.' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
    
    console.log('[API /articles] Fetching articles from database...');
    
    // 查询所有文章
    let rows: any[];
    let usedOptimizedFeaturedQuery = false;
    try {
      // 单次往返检查表与列（避免 4 次 information_schema 往返，降低 Neon 冷启动/读超时概率）
      const schemaRow = (
        await query<{
          articles_exists: boolean;
          has_recommended_items: boolean;
          has_featured_columns: boolean;
          has_faqs_column: boolean;
        }>(
          `
        SELECT
          EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'articles'
          ) AS articles_exists,
          EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'recommended_items'
          ) AS has_recommended_items,
          EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'is_featured'
          ) AS has_featured_columns,
          EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'articles' AND column_name = 'faqs'
          ) AS has_faqs_column;
        `,
          []
        )
      ).rows[0];

      if (!schemaRow?.articles_exists) {
        console.warn('[API /articles] Articles table does not exist');
        return NextResponse.json(
          {
            error: 'Articles table does not exist. Please run database migration.',
            details:
              process.env.NODE_ENV === 'development'
                ? 'Execute the SQL in database/migrations/005_create_articles_table.sql'
                : undefined,
            migrationFile: 'database/migrations/005_create_articles_table.sql',
          },
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      const hasRecommendedItemsColumn = schemaRow.has_recommended_items;
      const hasFeaturedColumns = schemaRow.has_featured_columns;
      const featuredSelect = hasFeaturedColumns ? 'is_featured, display_order,' : '';
      const recommendedItemsSelect = hasRecommendedItemsColumn ? 'recommended_items,' : '';
      const hasFaqsColumn = schemaRow.has_faqs_column;
      const faqsSelect = hasFaqsColumn ? 'faqs,' : '';

      const bodySelect = listOnly
        ? `NULL::text AS content, NULL::jsonb AS content_blocks,`
        : `content, content_blocks,`;

      let result;

      if (featuredOnly && hasFeaturedColumns) {
        usedOptimizedFeaturedQuery = true;
        // 首页精选：WHERE + LIMIT，且不读取正文大字段，避免全表扫描与读超时
        result = await query(
          `
        SELECT
          id,
          title,
          slug,
          author,
          cover_image,
          hero_image,
          reading_time,
          category,
          NULL::text AS content,
          NULL::jsonb AS content_blocks,
          excerpt,
          page_title,
          meta_description,
          related_journey_ids,
          ${recommendedItemsSelect}
          ${faqsSelect}
          tags,
          status,
          ${featuredSelect}
          created_at,
          updated_at
        FROM articles
        WHERE is_featured = true
        ORDER BY display_order NULLS LAST, updated_at DESC
        LIMIT 5
        `,
          []
        );
      } else {
        result = await query(
          `
        SELECT
          id,
          title,
          slug,
          author,
          cover_image,
          hero_image,
          reading_time,
          category,
          ${bodySelect}
          excerpt,
          page_title,
          meta_description,
          related_journey_ids,
          ${recommendedItemsSelect}
          ${faqsSelect}
          tags,
          status,
          ${featuredSelect}
          created_at,
          updated_at
        FROM articles
        ORDER BY updated_at DESC
      `,
          []
        );
      }
      rows = result.rows;
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      console.error('[API /articles] Database query error:', errorMessage);
      
      // 检查是否是表不存在的错误
      if (errorMessage.includes('does not exist') || 
          errorMessage.includes('relation') || 
          errorMessage.includes('table') ||
          errorMessage.includes('articles')) {
        return NextResponse.json(
          { 
            error: 'Articles table does not exist. Please run database migration.',
            details: process.env.NODE_ENV === 'development' 
              ? 'Execute the SQL in database/migrations/005_create_articles_table.sql' 
              : undefined,
            migrationFile: 'database/migrations/005_create_articles_table.sql'
          },
          { 
            status: 500,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
      }
      
      // 重新抛出其他错误
      throw dbError;
    }
    
    // 转换数据库行到 Article 类型
    let articles: Article[] = rows.map((row: Record<string, unknown>) =>
      mapArticleRowFromDb(row)
    );

    if (featuredOnly && !usedOptimizedFeaturedQuery) {
      articles = articles
        .filter((a) => a.featured)
        .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
        .slice(0, 5);
      console.log(`[API /articles] Featured articles (legacy filter): ${articles.length}`);
    } else if (featuredOnly) {
      console.log(`[API /articles] Featured articles: ${articles.length}`);
    } else {
      console.log(`[API /articles] Found ${articles.length} articles`);
    }

    const allowAllStatuses = await isAuthenticatedAdmin();
    articles = filterArticlesForPublicRead(articles, allowAllStatuses);
    
    return NextResponse.json(
      { articles },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
        },
      }
    );
  } catch (error) {
    console.error('[API /articles] Error fetching articles:', error);
    
    let errorMessage = 'Failed to fetch articles';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

// OPTIONS: 处理 CORS 预检请求
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// POST: 创建新article
export async function POST(request: NextRequest) {
  const guard = await enforceAdminWrite(request);
  if (!guard.ok) return guard.response;

  try {
    const article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'> = await request.json();
    
    console.log('[API /articles] Creating new article:', {
      title: article.title,
      slug: article.slug,
      category: article.category,
      status: article.status
    });

    // 插入文章
    const { rows } = await query(`
      INSERT INTO articles (
        title,
        slug,
        author,
        cover_image,
        hero_image,
        reading_time,
        category,
        content,
        content_blocks,
        excerpt,
        page_title,
        meta_description,
        related_journey_ids,
        recommended_items,
        faqs,
        cta_config,
        tags,
        status,
        is_featured,
        display_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `, [
      article.title,
      article.slug,
      article.author,
      article.coverImage,
      article.heroImage || null,
      article.readingTime || null,
      article.category,
      article.content || null,
      article.contentBlocks ? JSON.stringify(article.contentBlocks) : '[]',
      article.excerpt || null,
      article.pageTitle || null,
      article.metaDescription || null,
      JSON.stringify(article.relatedJourneyIds || []),
      JSON.stringify(article.recommendedItems || []),
      JSON.stringify(article.faqs || []),
      JSON.stringify(article.ctaConfig || {}),
      JSON.stringify(article.tags || []),
      article.status || 'draft',
      (article as Article).featured === true,
      (article as Article).displayOrder != null ? Number((article as Article).displayOrder) : null,
    ]);
    
    const row = rows[0];
    const newArticle = mapArticleRowFromDb(row as Record<string, unknown>);
    
    console.log('[API /articles] Article created successfully:', newArticle.id);
    
    return NextResponse.json(
      { article: newArticle },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /articles] Error creating article:', error);
    
    let errorMessage = 'Failed to create article';
    if (error instanceof Error) {
      errorMessage = error.message;
      // 检查是否是唯一约束冲突
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'Article with this slug already exists' },
          { status: 409 }
        );
      }
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
