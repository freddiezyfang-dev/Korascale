import { NextRequest, NextResponse } from 'next/server';

// Route Segment Config
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 测试路由 - 用于验证 API 路由是否工作
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API routes are working!',
    timestamp: new Date().toISOString(),
    env: {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      nodeEnv: process.env.NODE_ENV,
    }
  });
}

