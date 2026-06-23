import { NextRequest, NextResponse } from 'next/server';
import {
  isPublicRegistrationEnabled,
  publicRegistrationForbiddenResponse,
} from '@/lib/auth/publicRegistration';
import { enforceAdminRead } from '@/lib/auth/requireAdmin.server';
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

    // 验证必需字段
    if (!userData.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Default deny: anonymous callers may not INSERT or UPDATE user records.
    // Future authenticated/internal sync can be added here with a trusted credential check.
    if (!isPublicRegistrationEnabled()) {
      return NextResponse.json(publicRegistrationForbiddenResponse(), { status: 403 });
    }

    console.log('[API /users] Public registration attempt:', {
      email: userData.email,
      name: userData.name,
    });

    const existingUser = await query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [userData.email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(publicRegistrationForbiddenResponse(), { status: 403 });
    }

    const userId = crypto.randomUUID();
    const displayName = userData.name || userData.email.split('@')[0];

    await query(
      `INSERT INTO users (id, email, name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [userId, userData.email, displayName, 'user']
    );

    console.log('[API /users] User created:', userData.email);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: userId,
        email: userData.email,
        name: displayName,
      },
    });
  } catch (error) {
    console.error('[API /users] Error saving user info:', error);

    return NextResponse.json(
      {
        error: 'Failed to save user info',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// GET: 管理员查询用户（不对外暴露敏感字段）
export async function GET(request: NextRequest) {
  const guard = await enforceAdminRead();
  if (!guard.ok) return guard.response;

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
      'SELECT id, email, name, role, created_at, updated_at FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const row = result.rows[0] as {
      id: string;
      email: string;
      name: string | null;
      role: string | null;
      created_at: string;
      updated_at: string;
    };

    return NextResponse.json({
      user: {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
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
