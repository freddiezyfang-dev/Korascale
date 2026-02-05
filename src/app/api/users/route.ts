import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Route Segment Config - 确保路由被正确识别
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

// POST: 保存用户信息（创建或更新）
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    // 检查数据库连接
    const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      console.error('[API /users] Both POSTGRES_URL and NEON_POSTGRES_URL are missing');
      return NextResponse.json(
        { error: 'Database not configured. POSTGRES_URL or NEON_POSTGRES_URL is missing.' },
        { status: 500 }
      );
    }
    
    console.log('[API /users] Saving user info:', {
      email: userData.email,
      name: userData.name,
      id: userData.id,
    });
    
    // 验证必需字段
    if (!userData.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // 检查用户是否已存在（基于 email）
    const existingUser = await query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [userData.email]
    );
    
    if (existingUser.rows.length > 0) {
      // 更新现有用户
      const userId = userData.id || existingUser.rows[0].id;
      await query(
        `UPDATE users 
         SET name = COALESCE($1, name),
             updated_at = NOW()
         WHERE email = $2`,
        [userData.name || existingUser.rows[0].name, userData.email]
      );
      
      console.log('[API /users] User updated:', userData.email);
      
      return NextResponse.json({
        success: true,
        message: 'User updated successfully',
        user: {
          id: userId,
          email: userData.email,
          name: userData.name || existingUser.rows[0].name,
        },
      });
    } else {
      // 创建新用户
      const userId = userData.id || crypto.randomUUID();
      
      await query(
        `INSERT INTO users (id, email, name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name,
             updated_at = NOW()`,
        [
          userId,
          userData.email,
          userData.name || userData.email.split('@')[0],
          userData.role || 'user',
        ]
      );
      
      console.log('[API /users] User created:', userData.email);
      
      return NextResponse.json({
        success: true,
        message: 'User created successfully',
        user: {
          id: userId,
          email: userData.email,
          name: userData.name || userData.email.split('@')[0],
        },
      });
    }
  } catch (error) {
    console.error('[API /users] Error saving user info:', error);
    
    let errorMessage = 'Failed to save user info';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// GET: 获取用户信息（可选，用于调试）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }
    
    const result = await query(
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      user: result.rows[0],
    });
  } catch (error) {
    console.error('[API /users] Error fetching user:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch user',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
