import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Article, ContentBlock } from '@/types/article';

// Route Segment Config - 确保路由被正确识别
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: 获取所有articles
export async function GET(request?: NextRequest) {
  try {
    // 检查数据库连接
    const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      console.error('[API /articles] Both POSTGRES_URL and NEON_POSTGRES_URL are missing');
      return NextResponse.json(
        { error: 'Database not configured. POSTGRES_URL or NEON_POSTGRES_URL is missing.' },
        { status: 500 }
      );
    }
    
    console.log('[API /articles] Fetching articles from database...');
    
    // 查询所有文章
    const { rows } = await query(`
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
        tags,
        status,
        created_at,
        updated_at
      FROM articles
      ORDER BY updated_at DESC
    `, []);
    
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
      { status: 500 }
    );
  }
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
        tags,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
      JSON.stringify(article.tags || []),
      article.status || 'draft'
    ]);
    
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
