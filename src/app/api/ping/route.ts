// 最简单的测试路由 - 用于验证 API 路由是否工作
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    return NextResponse.json({ 
      pong: true, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('[API /ping] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

