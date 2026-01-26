import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: 获取单个 journey hotel
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { rows } = await query('SELECT * FROM journey_hotels WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Journey hotel not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ hotel: rows[0] });
  } catch (error) {
    console.error('Error fetching journey hotel:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journey hotel' },
      { status: 500 }
    );
  }
}

// PUT: 更新 journey hotel
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
    
    if (data.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(data.name);
    }
    if (data.location !== undefined) {
      updateFields.push(`location = $${paramIndex++}`);
      updateValues.push(data.location);
    }
    if (data.image !== undefined) {
      updateFields.push(`image = $${paramIndex++}`);
      updateValues.push(data.image);
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
    
    const sql = `UPDATE journey_hotels SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;
    await query(sql, updateValues);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating journey hotel:', error);
    return NextResponse.json(
      { error: 'Failed to update journey hotel' },
      { status: 500 }
    );
  }
}

// DELETE: 删除 journey hotel
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await query('DELETE FROM journey_hotels WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting journey hotel:', error);
    return NextResponse.json(
      { error: 'Failed to delete journey hotel' },
      { status: 500 }
    );
  }
}
