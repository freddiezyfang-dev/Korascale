#!/usr/bin/env node

/**
 * 快速创建 articles 表的脚本
 * 如果遇到 "Articles table does not exist" 错误，运行此脚本
 * 
 * 使用方法：
 * node scripts/create-articles-table.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 加载环境变量
(function loadLocalEnv() {
  const dotenvPathLocal = path.join(process.cwd(), '.env.local');
  const dotenvPath = path.join(process.cwd(), '.env');
  const candidatePaths = [dotenvPathLocal, dotenvPath];

  for (const p of candidatePaths) {
    if (!fs.existsSync(p)) continue;
    try {
      try {
        require('dotenv').config({ path: p });
        console.log(`🔧 已加载环境变量自 ${path.basename(p)}`);
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
        console.log(`🔧 已加载环境变量自 ${path.basename(p)}（内置解析）`);
        return;
      }
    } catch (e) {
      console.warn('⚠️ 加载环境变量失败：', e?.message);
    }
  }
})();

async function createArticlesTable() {
  console.log('🚀 开始创建 articles 表...\n');

  try {
    const connectionString = process.env.NEON_POSTGRES_URL || process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('Missing POSTGRES_URL or NEON_POSTGRES_URL in environment variables');
    }

    const pool = new Pool({ 
      connectionString, 
      ssl: { rejectUnauthorized: false } 
    });

    // 读取 SQL 文件
    const sqlPath = path.join(__dirname, '../database/QUICK_CREATE_ARTICLES_TABLE.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 读取 SQL 文件...');
    console.log('📝 执行 SQL...\n');

    // 执行 SQL
    await pool.query(sql);

    console.log('\n✅ articles 表创建成功！');
    console.log('\n📋 已创建：');
    console.log('   - articles 表');
    console.log('   - 所有必要的索引');
    console.log('   - 更新时间触发器');
    console.log('\n🎉 现在可以正常使用文章功能了！');

    await pool.end();
  } catch (error) {
    console.error('\n❌ 创建 articles 表失败：');
    console.error(error.message);
    
    if (error.message.includes('already exists')) {
      console.log('\n💡 提示：表可能已经存在，这是正常的。');
    } else {
      console.log('\n💡 请检查：');
      console.log('   1. 数据库连接字符串是否正确');
      console.log('   2. 数据库是否有创建表的权限');
      console.log('   3. 网络连接是否正常');
    }
    
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createArticlesTable();
}

module.exports = { createArticlesTable };
