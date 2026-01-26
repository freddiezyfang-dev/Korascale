import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: 获取所有 journey hotels
export async function GET() {
  try {
    const { rows } = await query('SELECT * FROM journey_hotels ORDER BY created_at DESC');
    return NextResponse.json({ hotels: rows });
  } catch (error) {
    console.error('Error fetching journey hotels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journey hotels' },
      { status: 500 }
    );
  }
}

// POST: 创建新 journey hotel
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const {
      name,
      location,
      image,
      status = 'active',
      data: extraData = {}
    } = data;
    
    const { rows } = await query(
      `INSERT INTO journey_hotels (
        name, location, image, status, data, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5::jsonb, NOW(), NOW())
      RETURNING *`,
      [name, location, image, status, JSON.stringify(extraData)]
    );
    
    return NextResponse.json({ hotel: rows[0] });
  } catch (error) {
    console.error('Error creating journey hotel:', error);
    return NextResponse.json(
      { error: 'Failed to create journey hotel' },
      { status: 500 }
    );
  }
}
