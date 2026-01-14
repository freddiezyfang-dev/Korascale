import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Article, ContentBlock } from '@/types/article';

// Route Segment Config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET: 获取单个article
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const { rows } = await query('SELECT * FROM articles WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Article not found' },
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
      tags: row.tags ? (row.tags as string[]) : undefined,
      status: row.status as Article['status'],
      pageTitle: row.page_title || undefined,
      metaDescription: row.meta_description || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
    
    return NextResponse.json({ article });
  } catch (error) {
    console.error('[API /articles/[id]] Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

// PUT: 更新article
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const updates: Partial<Article> = await request.json();
    
    console.log('[API /articles/[id]] Updating article:', id);
    
    // 构建更新查询
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (updates.title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.slug !== undefined) {
      updateFields.push(`slug = $${paramIndex++}`);
      values.push(updates.slug);
    }
    if (updates.author !== undefined) {
      updateFields.push(`author = $${paramIndex++}`);
      values.push(updates.author);
    }
    if (updates.coverImage !== undefined) {
      updateFields.push(`cover_image = $${paramIndex++}`);
      values.push(updates.coverImage);
    }
    if (updates.heroImage !== undefined) {
      updateFields.push(`hero_image = $${paramIndex++}`);
      values.push(updates.heroImage);
    }
    if (updates.readingTime !== undefined) {
      updateFields.push(`reading_time = $${paramIndex++}`);
      values.push(updates.readingTime);
    }
    if (updates.category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      values.push(updates.category);
    }
    if (updates.content !== undefined) {
      updateFields.push(`content = $${paramIndex++}`);
      values.push(updates.content);
    }
    if (updates.contentBlocks !== undefined) {
      updateFields.push(`content_blocks = $${paramIndex++}`);
      values.push(JSON.stringify(updates.contentBlocks));
    }
    if (updates.excerpt !== undefined) {
      updateFields.push(`excerpt = $${paramIndex++}`);
      values.push(updates.excerpt);
    }
    if (updates.pageTitle !== undefined) {
      updateFields.push(`page_title = $${paramIndex++}`);
      values.push(updates.pageTitle);
    }
    if (updates.metaDescription !== undefined) {
      updateFields.push(`meta_description = $${paramIndex++}`);
      values.push(updates.metaDescription);
    }
    if (updates.relatedJourneyIds !== undefined) {
      updateFields.push(`related_journey_ids = $${paramIndex++}`);
      values.push(JSON.stringify(updates.relatedJourneyIds));
    }
    if (updates.tags !== undefined) {
      updateFields.push(`tags = $${paramIndex++}`);
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    
    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    
    // 添加 updated_at 自动更新
    updateFields.push(`updated_at = NOW()`);
    
    values.push(id);
    
    const { rows } = await query(
      `UPDATE articles SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }
    
    const row = rows[0];
    const updatedArticle: Article = {
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
    
    return NextResponse.json({ article: updatedArticle });
  } catch (error) {
    console.error('[API /articles/[id]] Error updating article:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

// DELETE: 删除article
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const { rows } = await query('DELETE FROM articles WHERE id = $1 RETURNING id', [id]);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /articles/[id]] Error deleting article:', error);
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
