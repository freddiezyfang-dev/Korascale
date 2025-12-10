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

    // 在无证书的 serverless 环境中关闭严格校验证书
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
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



