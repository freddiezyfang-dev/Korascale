import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: 获取所有 extensions
export async function GET() {
  try {
    const { rows } = await query('SELECT * FROM extensions ORDER BY created_at DESC');
    return NextResponse.json({ extensions: rows });
  } catch (error) {
    console.error('Error fetching extensions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch extensions' },
      { status: 500 }
    );
  }
}

// POST: 创建新 extension
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const {
      title,
      description,
      days,
      image,
      longitude,
      latitude,
      link,
      status = 'active',
      data: extraData = {}
    } = data;
    
    const { rows } = await query(
      `INSERT INTO extensions (
        title, description, days, image, 
        longitude, latitude, link, status, data, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, NOW(), NOW())
      RETURNING *`,
      [title, description, days, image, longitude, latitude, link, status, JSON.stringify(extraData)]
    );
    
    return NextResponse.json({ extension: rows[0] });
  } catch (error) {
    console.error('Error creating extension:', error);
    return NextResponse.json(
      { error: 'Failed to create extension' },
      { status: 500 }
    );
  }
}
