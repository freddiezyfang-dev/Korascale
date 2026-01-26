import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: 获取单个 extension
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { rows } = await query('SELECT * FROM extensions WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Extension not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ extension: rows[0] });
  } catch (error) {
    console.error('Error fetching extension:', error);
    return NextResponse.json(
      { error: 'Failed to fetch extension' },
      { status: 500 }
    );
  }
}

// PUT: 更新 extension
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
    if (data.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(data.description);
    }
    if (data.days !== undefined) {
      updateFields.push(`days = $${paramIndex++}`);
      updateValues.push(data.days);
    }
    if (data.image !== undefined) {
      updateFields.push(`image = $${paramIndex++}`);
      updateValues.push(data.image);
    }
    if (data.longitude !== undefined) {
      updateFields.push(`longitude = $${paramIndex++}`);
      updateValues.push(data.longitude);
    }
    if (data.latitude !== undefined) {
      updateFields.push(`latitude = $${paramIndex++}`);
      updateValues.push(data.latitude);
    }
    if (data.link !== undefined) {
      updateFields.push(`link = $${paramIndex++}`);
      updateValues.push(data.link);
    }
    if (data.status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateValues.push(data.status);
    }
    if (data.data !== undefined) {
      updateFields.push(`data = $${paramIndex++}::jsonb`);
      updateValues.push(JSON.stringify(data.data));
    }
    
    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);
    
    const sql = `UPDATE extensions SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
    const { rows } = await query(sql, updateValues);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating extension:', error);
    return NextResponse.json(
      { error: 'Failed to update extension' },
      { status: 500 }
    );
  }
}

// DELETE: 删除 extension
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await query('DELETE FROM extensions WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting extension:', error);
    return NextResponse.json(
      { error: 'Failed to delete extension' },
      { status: 500 }
    );
  }
}
