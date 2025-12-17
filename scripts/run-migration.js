#!/usr/bin/env node

/**
 * 运行数据库迁移脚本
 * 使用方法：node scripts/run-migration.js [migration-file-name]
 * 例如：node scripts/run-migration.js 004_add_place_field.sql
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 加载本地环境变量
(function loadLocalEnv() {
  const dotenvPathLocal = path.join(process.cwd(), '.env.local');
  const dotenvPath = path.join(process.cwd(), '.env');
  const candidatePaths = [dotenvPathLocal, dotenvPath];

  for (const p of candidatePaths) {
    if (!fs.existsSync(p)) continue;
    try {
      try {
        require('dotenv').config({ path: p });
        console.log(`🔧 已加载本地环境变量自 ${path.basename(p)}`);
        return;
      } catch (_) {
        const content = fs.readFileSync(p, 'utf8');
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
        console.log(`🔧 已加载本地环境变量自 ${path.basename(p)}（内置解析）`);
        return;
      }
    } catch (e) {
      console.warn('⚠️ 加载环境变量失败（可忽略）：', e?.message);
    }
  }
  console.log('ℹ️ 未找到 .env.local 或 .env，将使用进程环境变量');
})();

async function runMigration(migrationFileName) {
  console.log(`🚀 开始运行迁移: ${migrationFileName}\n`);

  try {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('Missing POSTGRES_URL environment variable');
    }

    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    // 读取迁移脚本
    const migrationPath = path.join(__dirname, '../database/migrations', migrationFileName);
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 读取迁移脚本...');
    console.log('📝 执行SQL迁移...\n');

    // 执行迁移
    await pool.query(migrationSQL);
    
    console.log(`\n✅ 迁移 ${migrationFileName} 执行成功！`);
    
    await pool.end();
  } catch (error) {
    console.error('\n❌ 迁移执行失败：');
    console.error(error.message);
    if (error.code) {
      console.error(`错误代码: ${error.code}`);
    }
    if (error.detail) {
      console.error(`详细信息: ${error.detail}`);
    }
    process.exit(1);
  }
}

// 获取命令行参数
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ 请指定迁移文件名');
  console.error('使用方法: node scripts/run-migration.js [migration-file-name]');
  console.error('例如: node scripts/run-migration.js 004_add_place_field.sql');
  process.exit(1);
}

// 如果直接运行此脚本
if (require.main === module) {
  runMigration(migrationFile);
}

module.exports = { runMigration };

