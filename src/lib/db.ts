import { Pool, QueryResult } from 'pg';

// Neon/Provider 的 pooled 连接串通过 POSTGRES_URL 提供
const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('Missing POSTGRES_URL in environment');
}

// 在无证书的 serverless 环境中关闭严格校验证书
export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}



