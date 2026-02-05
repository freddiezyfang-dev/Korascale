import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Article, ContentBlock, RecommendedItem } from '@/types/article';

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
    // recommendedItems 字段（如果数据库列不存在，会在错误处理中跳过）
    let hasRecommendedItems = false;
    let recommendedItemsValue: any = null;
    if (updates.recommendedItems !== undefined) {
      hasRecommendedItems = true;
      recommendedItemsValue = JSON.stringify(updates.recommendedItems);
      updateFields.push(`recommended_items = $${paramIndex++}`);
      values.push(recommendedItemsValue);
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
    
    let rows;
    try {
      const result = await query(
        `UPDATE articles SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      rows = result.rows;
    } catch (dbError: any) {
      const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
      console.error('[API /articles/[id]] Database update error:', errorMessage);
      
      // 检查是否是字段不存在的错误（recommended_items 字段可能不存在）
      if (errorMessage.includes('does not exist') && errorMessage.includes('recommended_items') && hasRecommendedItems) {
        console.warn('[API /articles/[id]] recommended_items column does not exist, skipping it and retrying without it');
        
        // 重新构建更新字段和值（排除 recommended_items）
        const retryUpdateFields: string[] = [];
        const retryValues: any[] = [];
        let retryParamIndex = 1;
        
        // 重新添加所有字段（除了 recommended_items）
        if (updates.title !== undefined) {
          retryUpdateFields.push(`title = $${retryParamIndex++}`);
          retryValues.push(updates.title);
        }
        if (updates.slug !== undefined) {
          retryUpdateFields.push(`slug = $${retryParamIndex++}`);
          retryValues.push(updates.slug);
        }
        if (updates.author !== undefined) {
          retryUpdateFields.push(`author = $${retryParamIndex++}`);
          retryValues.push(updates.author);
        }
        if (updates.coverImage !== undefined) {
          retryUpdateFields.push(`cover_image = $${retryParamIndex++}`);
          retryValues.push(updates.coverImage);
        }
        if (updates.heroImage !== undefined) {
          retryUpdateFields.push(`hero_image = $${retryParamIndex++}`);
          retryValues.push(updates.heroImage);
        }
        if (updates.readingTime !== undefined) {
          retryUpdateFields.push(`reading_time = $${retryParamIndex++}`);
          retryValues.push(updates.readingTime);
        }
        if (updates.category !== undefined) {
          retryUpdateFields.push(`category = $${retryParamIndex++}`);
          retryValues.push(updates.category);
        }
        if (updates.content !== undefined) {
          retryUpdateFields.push(`content = $${retryParamIndex++}`);
          retryValues.push(updates.content);
        }
        if (updates.contentBlocks !== undefined) {
          retryUpdateFields.push(`content_blocks = $${retryParamIndex++}`);
          retryValues.push(JSON.stringify(updates.contentBlocks));
        }
        if (updates.excerpt !== undefined) {
          retryUpdateFields.push(`excerpt = $${retryParamIndex++}`);
          retryValues.push(updates.excerpt);
        }
        if (updates.pageTitle !== undefined) {
          retryUpdateFields.push(`page_title = $${retryParamIndex++}`);
          retryValues.push(updates.pageTitle);
        }
        if (updates.metaDescription !== undefined) {
          retryUpdateFields.push(`meta_description = $${retryParamIndex++}`);
          retryValues.push(updates.metaDescription);
        }
        if (updates.relatedJourneyIds !== undefined) {
          retryUpdateFields.push(`related_journey_ids = $${retryParamIndex++}`);
          retryValues.push(JSON.stringify(updates.relatedJourneyIds));
        }
        // 跳过 recommendedItems
        if (updates.tags !== undefined) {
          retryUpdateFields.push(`tags = $${retryParamIndex++}`);
          retryValues.push(JSON.stringify(updates.tags));
        }
        if (updates.status !== undefined) {
          retryUpdateFields.push(`status = $${retryParamIndex++}`);
          retryValues.push(updates.status);
        }
        
        retryUpdateFields.push(`updated_at = NOW()`);
        retryValues.push(id);
        
        // 重试更新（不包含 recommended_items）
        const retryResult = await query(
          `UPDATE articles SET ${retryUpdateFields.join(', ')} WHERE id = $${retryParamIndex} RETURNING *`,
          retryValues
        );
        rows = retryResult.rows;
      } else {
        throw dbError;
      }
    }
    
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
      recommendedItems: row.recommended_items ? (row.recommended_items as RecommendedItem[]) : (row.recommended_items === null ? undefined : []),
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
