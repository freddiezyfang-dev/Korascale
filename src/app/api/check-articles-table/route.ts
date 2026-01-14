import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 检查 articles 表是否存在
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // 检查表是否存在
    const tableCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'articles'
    `);

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
        ]
      });
    }

    // 检查表结构
    const columnsCheck = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'articles'
      ORDER BY ordinal_position
    `);

    // 检查索引
    const indexesCheck = await query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'articles'
    `);

    // 检查文章数量
    const countCheck = await query(`
      SELECT COUNT(*) as total FROM articles
    `);

    // 按状态统计
    const statusCheck = await query(`
      SELECT status, COUNT(*) as count
      FROM articles 
      GROUP BY status
    `);

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
      }
    });
  } catch (error: any) {
    console.error('Error checking articles table:', error);
    return NextResponse.json({
      tableExists: false,
      error: error.message,
      message: '检查 articles 表时出错，可能是数据库连接问题。'
    }, { status: 500 });
  }
}
