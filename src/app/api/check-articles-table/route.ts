import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 检查 articles 表是否存在
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // 检查数据库连接
    const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      return NextResponse.json({
        tableExists: false,
        error: 'Database not configured',
        message: 'POSTGRES_URL or NEON_POSTGRES_URL is missing.'
      }, { status: 500 });
    }

    // 添加超时控制
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout after 30 seconds')), 30000)
    );

    // 检查表是否存在（使用超时控制）
    let tableCheck;
    try {
      const queryPromise = query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'articles'
      `);
      
      tableCheck = await Promise.race([queryPromise, timeoutPromise]) as any;
    } catch (queryError: any) {
      const errorMessage = queryError instanceof Error ? queryError.message : String(queryError);
      console.error('[API /check-articles-table] Query error:', errorMessage);
      
      if (errorMessage.includes('timeout')) {
        return NextResponse.json({
          tableExists: false,
          error: 'Query timeout',
          message: '数据库查询超时，请稍后重试。'
        }, { status: 504 });
      }
      
      throw queryError;
    }

    const tableExists = tableCheck.rows.length > 0;

    if (!tableExists) {
      return NextResponse.json({
        tableExists: false,
        message: '❌ articles 表不存在，请执行数据库迁移',
        migrationFile: 'database/migrations/005_create_articles_table.sql',
        instructions: [
          '1. 打开 Vercel Dashboard',
          '2. 进入项目 → Storage → Postgres',
          '3. 点击 "Query" 或 "SQL Editor"',
          '4. 执行 database/migrations/005_create_articles_table.sql 中的 SQL'
        ],
        responseTime: Date.now() - startTime
      });
    }

    // 表存在，获取详细信息（也添加超时）
    let columnsCheck, indexesCheck, countCheck, statusCheck;
    
    try {
      const queriesPromise = Promise.all([
        query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'articles'
          ORDER BY ordinal_position
        `),
        query(`
          SELECT indexname 
          FROM pg_indexes 
          WHERE tablename = 'articles'
        `),
        query(`SELECT COUNT(*) as total FROM articles`),
        query(`
          SELECT status, COUNT(*) as count
          FROM articles 
          GROUP BY status
        `)
      ]);
      
      [columnsCheck, indexesCheck, countCheck, statusCheck] = await Promise.race([
        queriesPromise,
        timeoutPromise
      ]) as any[];
    } catch (detailError: any) {
      // 如果获取详细信息失败，至少返回表存在的信息
      console.error('[API /check-articles-table] Error fetching details:', detailError);
      return NextResponse.json({
        tableExists: true,
        message: '✅ articles 表已存在（但获取详细信息时出错）',
        error: detailError instanceof Error ? detailError.message : String(detailError),
        responseTime: Date.now() - startTime
      });
    }

    return NextResponse.json({
      tableExists: true,
      message: '✅ articles 表已存在',
      columns: columnsCheck.rows,
      indexes: indexesCheck.rows.map((r: any) => r.indexname),
      totalArticles: parseInt(countCheck.rows[0].total),
      statusDistribution: statusCheck.rows,
      tableStructure: {
        columnCount: columnsCheck.rows.length,
        indexCount: indexesCheck.rows.length,
        hasRequiredColumns: [
          'id', 'title', 'slug', 'author', 'category', 'status'
        ].every(col => 
          columnsCheck.rows.some((c: any) => c.column_name === col)
        )
      },
      responseTime: Date.now() - startTime
    });
  } catch (error: any) {
    console.error('[API /check-articles-table] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json({
      tableExists: false,
      error: errorMessage,
      message: '检查 articles 表时出错，可能是数据库连接问题。',
      responseTime: Date.now() - startTime
    }, { status: 500 });
  }
}
