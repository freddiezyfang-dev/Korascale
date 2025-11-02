// 最简单的测试路由 - 用于验证 API 路由是否工作
export async function GET() {
  return Response.json({ pong: true, timestamp: new Date().toISOString() });
}

