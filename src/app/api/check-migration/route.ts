import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 检查 journey_type 字段是否存在
export async function GET() {
  try {
    // 检查字段是否存在
    const columnCheck = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'journeys' 
        AND column_name = 'journey_type'
    `);

    // 检查索引是否存在
    const indexCheck = await query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'journeys' 
        AND indexname = 'idx_journeys_journey_type'
    `);

    // 检查现有数据的 journey_type 分布
    const dataCheck = await query(`
      SELECT journey_type, COUNT(*) as count
      FROM journeys 
      GROUP BY journey_type
    `);

    const hasColumn = columnCheck.rows.length > 0;
    const hasIndex = indexCheck.rows.length > 0;

    return NextResponse.json({
      migrationComplete: hasColumn && hasIndex,
      hasColumn,
      hasIndex,
      columnInfo: hasColumn ? columnCheck.rows[0] : null,
      indexInfo: hasIndex ? indexCheck.rows[0] : null,
      dataDistribution: dataCheck.rows,
      message: hasColumn && hasIndex 
        ? '✅ 迁移已完成！journey_type 字段和索引都已存在。' 
        : '❌ 迁移未完成，请执行迁移脚本。'
    });
  } catch (error: any) {
    console.error('Error checking migration:', error);
    return NextResponse.json({
      migrationComplete: false,
      error: error.message,
      message: '检查迁移状态时出错，可能是数据库连接问题。'
    }, { status: 500 });
  }
}


