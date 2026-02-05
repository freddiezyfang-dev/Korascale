import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Article, ContentBlock, RecommendedItem } from '@/types/article';

// Route Segment Config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: 根据slug获取article
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const decodedSlug = decodeURIComponent(slug);
    
    console.log('[API /articles/slug/[slug]] Fetching article by slug:', decodedSlug);
    
    const { rows } = await query('SELECT * FROM articles WHERE slug = $1', [decodedSlug]);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Article not found', searchedSlug: decodedSlug },
        { status: 404 }
      );
    }
    
    const row = rows[0];
    const article: Article = {
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
    
    return NextResponse.json({ article });
  } catch (error) {
    console.error('[API /articles/slug/[slug]] Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
