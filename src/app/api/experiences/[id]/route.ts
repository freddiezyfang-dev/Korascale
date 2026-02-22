import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

function mapRowToExperience(row: any) {
  const data = row.data || {};
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    mainImage: row.main_image,
    description: row.description ?? '',
    galleryImages: Array.isArray(data.galleryImages) ? data.galleryImages : [],
    status: row.status,
    data: data,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// GET: 获取单个 experience
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { rows } = await query('SELECT * FROM experiences WHERE id = $1', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
    }
    return NextResponse.json({ experience: mapRowToExperience(rows[0]) });
  } catch (error) {
    console.error('Error fetching experience:', error);
    return NextResponse.json(
      { error: 'Failed to fetch experience' },
      { status: 500 }
    );
  }
}

// PUT: 更新 experience
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const data = await request.json();

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      updateValues.push(data.title);
    }
    if (data.location !== undefined) {
      updateFields.push(`location = $${paramIndex++}`);
      updateValues.push(data.location);
    }
    if (data.mainImage !== undefined) {
      updateFields.push(`main_image = $${paramIndex++}`);
      updateValues.push(data.mainImage);
    }
    if (data.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(data.description);
    }
    if (data.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(data.status);
    }
    if (data.data !== undefined || data.galleryImages !== undefined) {
      const existing = await query('SELECT data FROM experiences WHERE id = $1', [id]);
      const currentData = (existing.rows[0] as any)?.data || {};
      const mergedData = {
        ...currentData,
        ...(data.data || {}),
        ...(Array.isArray(data.galleryImages) ? { galleryImages: data.galleryImages } : {}),
      };
      updateFields.push(`data = $${paramIndex++}::jsonb`);
      updateValues.push(JSON.stringify(mergedData));
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    await query(
      `UPDATE experiences SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      updateValues
    );
    const { rows } = await query('SELECT * FROM experiences WHERE id = $1', [id]);
    return NextResponse.json({ experience: mapRowToExperience(rows[0]) });
  } catch (error) {
    console.error('Error updating experience:', error);
    return NextResponse.json(
      { error: 'Failed to update experience' },
      { status: 500 }
    );
  }
}

// DELETE: 删除 experience
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await query('DELETE FROM experiences WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting experience:', error);
    return NextResponse.json(
      { error: 'Failed to delete experience' },
      { status: 500 }
    );
  }
}
