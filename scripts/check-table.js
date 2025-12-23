#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 加载环境变量
(function loadLocalEnv() {
  const dotenvPathLocal = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(dotenvPathLocal)) {
    const content = fs.readFileSync(dotenvPathLocal, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    });
  }
})();

async function checkTable() {
  const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ 未找到数据库连接字符串');
    return;
  }

  console.log('🔍 检查数据库连接和表...\n');
  console.log('连接字符串:', connectionString.substring(0, 50) + '...');

  const pool = new Pool({ 
    connectionString, 
    ssl: { rejectUnauthorized: false } 
  });

  try {
    // 检查 journeys 表是否存在
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'journeys'
    `);

    if (result.rows.length > 0) {
      console.log('✅ journeys 表存在！');
      
      // 检查表中有多少数据
      const countResult = await pool.query('SELECT COUNT(*) as count FROM journeys');
      console.log(`📊 表中的数据量: ${countResult.rows[0].count}`);
    } else {
      console.log('❌ journeys 表不存在！');
      console.log('\n需要运行迁移脚本：');
      console.log('  node scripts/init-database.js');
    }

    // 列出所有表
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 数据库中的所有表:');
    allTables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  } finally {
    await pool.end();
  }
}

checkTable();







