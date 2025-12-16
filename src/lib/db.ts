import { Pool, QueryResult, QueryResultRow } from 'pg';

// Neon/Provider 的 pooled 连接串通过 POSTGRES_URL 提供
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    // 优先使用 NEON_POSTGRES_URL，如果没有则使用 POSTGRES_URL
    const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
    
    if (!connectionString) {
      throw new Error('Missing POSTGRES_URL or NEON_POSTGRES_URL in environment');
    }

    // 解析连接字符串以诊断问题（不显示密码）
    try {
      const url = new URL(connectionString);
      console.log('[DB] Connection string parsed:', {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 'default',
        pathname: url.pathname,
        username: url.username || 'N/A',
        hasPassword: !!url.password,
        search: url.search || 'none',
        usingEnv: process.env.NEON_POSTGRES_URL ? 'NEON_POSTGRES_URL' : 'POSTGRES_URL',
      });
    } catch (parseError) {
      console.error('[DB] Failed to parse connection string:', {
        error: String(parseError),
        connectionStringLength: connectionString.length,
        connectionStringPrefix: connectionString.substring(0, 50),
      });
    }

    // 在无证书的 serverless 环境中关闭严格校验证书
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      // 优化连接池配置
      max: 10, // 最大连接数
      idleTimeoutMillis: 30000, // 空闲连接超时（30秒）
      connectionTimeoutMillis: 10000, // 连接超时（10秒）
    });
  }
  
  return pool;
}

// 导出 pool 的 getter，延迟初始化
export { getPool as pool };

export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const dbPool = getPool();
  return dbPool.query<T>(text, params);
}



