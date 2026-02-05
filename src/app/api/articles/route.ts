import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Article, ContentBlock, RecommendedItem } from '@/types/article';

// Route Segment Config - 确保路由被正确识别（Next.js 15 必需）
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// GET: 获取所有articles
export async function GET(request: NextRequest) {
  // 简化日志，避免打印过多信息导致崩溃
  console.log('[API /articles] GET request received');
  
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
    let rows;
    try {
      // 首先检查表是否存在，如果不存在则返回空数组
      const tableCheck = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'articles'
        );
      `, []);
      
      if (!tableCheck.rows[0]?.exists) {
        console.warn('[API /articles] Articles table does not exist');
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
      
      // 检查 recommended_items 列是否存在
      const columnCheck = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'articles'
          AND column_name = 'recommended_items'
        );
      `, []);
      
      const hasRecommendedItemsColumn = columnCheck.rows[0]?.exists;
      
      // 根据列是否存在构建查询
      const recommendedItemsSelect = hasRecommendedItemsColumn ? 'recommended_items,' : '';
      
      const result = await query(`
        SELECT 
          id,
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
          ${recommendedItemsSelect}
          tags,
          status,
          created_at,
          updated_at
        FROM articles
        ORDER BY updated_at DESC
      `, []);
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
    const articles: Article[] = rows.map((row: any) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      author: row.author,
      coverImage: row.cover_image || '',
      heroImage: row.hero_image || undefined,
      readingTime: row.reading_time || undefined,
      category: row.category as Article['category'],
      content: row.content || undefined,
      contentBlocks: row.content_blocks ? (row.content_blocks as ContentBlock[]) : undefined,
      excerpt: row.excerpt || undefined,
      relatedJourneyIds: row.related_journey_ids ? (row.related_journey_ids as string[]) : [],
      recommendedItems: row.recommended_items ? (row.recommended_items as RecommendedItem[]) : undefined,
      tags: row.tags ? (row.tags as string[]) : undefined,
      status: row.status as Article['status'],
      pageTitle: row.page_title || undefined,
      metaDescription: row.meta_description || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
    
    console.log(`[API /articles] Found ${articles.length} articles`);
    
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
export async function OPTIONS(request: NextRequest) {
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
        tags,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
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
      JSON.stringify(article.tags || []),
      article.status || 'draft'
    ]);
    
    // 如果 recommended_items 列不存在，尝试添加它（可选）
    try {
      await query(`
        ALTER TABLE articles 
        ADD COLUMN IF NOT EXISTS recommended_items JSONB DEFAULT '[]'::jsonb;
      `, []);
    } catch (alterError) {
      // 忽略错误，列可能已经存在或没有权限
      console.warn('[API /articles] Could not add recommended_items column:', alterError);
    }
    
    const row = rows[0];
    const newArticle: Article = {
      id: row.id,
      slug: row.slug,
      title: row.title,
      author: row.author,
      coverImage: row.cover_image || '',
      heroImage: row.hero_image || undefined,
      readingTime: row.reading_time || undefined,
      category: row.category as Article['category'],
      content: row.content || undefined,
      contentBlocks: row.content_blocks ? (row.content_blocks as ContentBlock[]) : undefined,
      excerpt: row.excerpt || undefined,
      relatedJourneyIds: row.related_journey_ids ? (row.related_journey_ids as string[]) : [],
      recommendedItems: row.recommended_items ? (row.recommended_items as RecommendedItem[]) : undefined,
      tags: row.tags ? (row.tags as string[]) : undefined,
      status: row.status as Article['status'],
      pageTitle: row.page_title || undefined,
      metaDescription: row.meta_description || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
    
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
