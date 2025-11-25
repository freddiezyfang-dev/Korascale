// 检查数据库迁移状态的脚本
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkMigration() {
  try {
    console.log('🔍 正在检查数据库迁移状态...\n');

    // 检查字段是否存在
    const columnCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'journeys' 
        AND column_name = 'journey_type'
    `);

    // 检查索引是否存在
    const indexCheck = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'journeys' 
        AND indexname = 'idx_journeys_journey_type'
    `);

    // 检查现有数据的 journey_type 分布
    const dataCheck = await pool.query(`
      SELECT journey_type, COUNT(*) as count
      FROM journeys 
      GROUP BY journey_type
    `);

    const hasColumn = columnCheck.rows.length > 0;
    const hasIndex = indexCheck.rows.length > 0;
    const migrationComplete = hasColumn && hasIndex;

    console.log('📊 迁移状态检查结果：\n');
    console.log(`字段存在: ${hasColumn ? '✅' : '❌'}`);
    if (hasColumn) {
      console.log(`  - 字段信息: ${JSON.stringify(columnCheck.rows[0])}`);
    }

    console.log(`\n索引存在: ${hasIndex ? '✅' : '❌'}`);
    if (hasIndex) {
      console.log(`  - 索引信息: ${JSON.stringify(indexCheck.rows[0])}`);
    }

    console.log(`\n数据分布:`);
    if (dataCheck.rows.length > 0) {
      dataCheck.rows.forEach(row => {
        console.log(`  - ${row.journey_type || '(NULL)'}: ${row.count} 条记录`);
      });
    } else {
      console.log('  - 暂无数据');
    }

    console.log(`\n${migrationComplete ? '✅ 迁移已完成！' : '❌ 迁移未完成，请执行迁移脚本。'}`);
    
    if (!migrationComplete) {
      console.log('\n📝 执行迁移：');
      console.log('   方法1: 在 Vercel Dashboard → Storage → Postgres → SQL Editor');
      console.log('   方法2: psql $POSTGRES_URL -f database/migrations/002_add_journey_type.sql');
    }

    await pool.end();
    process.exit(migrationComplete ? 0 : 1);
  } catch (error) {
    console.error('❌ 检查迁移时出错:', error.message);
    if (error.message.includes('relation "journeys" does not exist')) {
      console.log('\n💡 提示: journeys 表不存在，请先执行 database/migrations/001_create_tables.sql');
    } else if (error.message.includes('POSTGRES_URL')) {
      console.log('\n💡 提示: 请确保 .env.local 文件中设置了 POSTGRES_URL');
    }
    await pool.end();
    process.exit(1);
  }
}

checkMigration();


