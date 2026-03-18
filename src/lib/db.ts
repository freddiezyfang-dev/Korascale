import { Pool, QueryResult, QueryResultRow } from 'pg';

// Neon/Provider 的 pooled 连接串通过 POSTGRES_URL 提供
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    // 优先使用 NEON_POSTGRES_URL，如果没有则使用 POSTGRES_URL
    const rawConnectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
    
    if (!rawConnectionString) {
      // 在开发环境中，如果没有数据库连接，返回一个友好的错误而不是抛出异常
      // 这样可以让 API 路由返回明确的错误信息，而不是导致整个模块加载失败
      const error = new Error('Missing POSTGRES_URL or NEON_POSTGRES_URL in environment');
      console.error('[DB]', error.message);
      throw error;
    }

    let connectionString = rawConnectionString;

    try {
      const normalizedUrl = new URL(rawConnectionString);
      if (!normalizedUrl.searchParams.get('sslmode')) {
        normalizedUrl.searchParams.set('sslmode', 'require');
      }
      if (!normalizedUrl.searchParams.get('connect_timeout')) {
        normalizedUrl.searchParams.set('connect_timeout', '30');
      }
      connectionString = normalizedUrl.toString();
    } catch (normalizeError) {
      console.warn('[DB] Failed to normalize connection string params:', String(normalizeError));
    }

    // 解析连接字符串以诊断问题（不显示密码）
    try {
      const url = new URL(connectionString);
      const isNeon = url.hostname.includes('neon.tech');
      const hasPooler = url.hostname.includes('-pooler');
      const hasPgbouncerParam = url.searchParams.get('pgbouncer') === 'true';
      console.log('[DB] Connection string parsed:', {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 'default',
        pathname: url.pathname,
        username: url.username || 'N/A',
        hasPassword: !!url.password,
        search: url.search || 'none',
        usingEnv: process.env.NEON_POSTGRES_URL ? 'NEON_POSTGRES_URL' : 'POSTGRES_URL',
        isNeon,
        hasPooler,
        hasPgbouncerParam,
      });

      if (isNeon && !hasPooler) {
        console.warn('[DB] Neon connection string does not appear to use a pooled host (-pooler). This can cause connection exhaustion and slow 504 responses.');
      }
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
      connectionTimeoutMillis: 10000, // 连接超时（给冷启动留空间）
      query_timeout: 30000, // 查询超时增加到30秒
    });
  }
  
  return pool;
}

// 导出 pool 的 getter，延迟初始化
export { getPool as pool };

export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  try {
    const dbPool = getPool();
    return await dbPool.query<T>(text, params);
  } catch (error) {
    console.error('[DB Query Error]', {
      query: text.substring(0, 100),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}



