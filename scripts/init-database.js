#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 在首次设置时运行此脚本来创建所有数据库表
 * 
 * 使用方法：
 * 1. 在Vercel Dashboard连接Postgres数据库
 * 2. 复制环境变量到本地 .env.local
 * 3. 运行: node scripts/init-database.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 加载本地环境变量，优先读取 .env.local，其次读取 .env
(function loadLocalEnv() {
  const dotenvPathLocal = path.join(process.cwd(), '.env.local');
  const dotenvPath = path.join(process.cwd(), '.env');
  const candidatePaths = [dotenvPathLocal, dotenvPath];

  for (const p of candidatePaths) {
    if (!fs.existsSync(p)) continue;
    try {
      // 优先尝试使用 dotenv
      try {
        require('dotenv').config({ path: p });
        console.log(`🔧 已加载本地环境变量自 ${path.basename(p)}`);
        return;
      } catch (_) {
        // 若未安装 dotenv，采用最小实现解析
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

async function initDatabase() {
  console.log('🚀 开始初始化数据库...\n');

  try {
    const connectionString = process.env.POSTGRES_URL;
    if (!connectionString) {
      throw new Error('Missing POSTGRES_URL');
    }

    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

    // 读取迁移脚本
    const migrationPath = path.join(__dirname, '../database/migrations/001_create_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 读取迁移脚本...');
    console.log('📝 执行SQL迁移...\n');

    // 智能拆分 SQL（支持 $$...$$、字符串与注释，避免错误切分函数/触发器体）
    function splitSQLStatements(sql) {
      const statements = [];
      let current = '';
      let inSingle = false;
      let inDouble = false;
      let inLineComment = false;
      let inBlockComment = false;
      let inDollarTag = null; // like $tag$

      for (let i = 0; i < sql.length; i++) {
        const ch = sql[i];
        const next = sql[i + 1];

        // 处理换行终结行注释
        if (inLineComment) {
          current += ch;
          if (ch === '\n') inLineComment = false;
          continue;
        }

        // 处理块注释结束
        if (inBlockComment) {
          current += ch;
          if (ch === '*' && next === '/') {
            current += next; i++;
            inBlockComment = false;
          }
          continue;
        }

        // 进入行注释
        if (!inSingle && !inDouble && !inDollarTag && ch === '-' && next === '-') {
          current += ch + next; i++;
          inLineComment = true;
          continue;
        }

        // 进入块注释
        if (!inSingle && !inDouble && !inDollarTag && ch === '/' && next === '*') {
          current += ch + next; i++;
          inBlockComment = true;
          continue;
        }

        // 进入/退出字符串
        if (!inDouble && !inDollarTag && ch === "'" ) {
          inSingle = !inSingle;
          current += ch;
          continue;
        }
        if (!inSingle && !inDollarTag && ch === '"') {
          inDouble = !inDouble;
          current += ch;
          continue;
        }

        // 进入/退出 $$tag$$ 块
        if (!inSingle && !inDouble) {
          if (inDollarTag) {
            // 检查结束符
            if (sql.slice(i).startsWith(inDollarTag)) {
              current += inDollarTag;
              i += inDollarTag.length - 1;
              inDollarTag = null;
              continue;
            }
          } else if (ch === '$') {
            // 捕获 $tag$ 或 $$
            const match = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
            if (match) {
              inDollarTag = match[0];
              current += inDollarTag;
              i += inDollarTag.length - 1;
              continue;
            }
          }
        }

        // 分号作为语句结束（仅在不在字符串/注释/$$块中时）
        if (!inSingle && !inDouble && !inDollarTag && ch === ';') {
          const stmt = current.trim();
          if (stmt.length > 0 && !/^--/.test(stmt)) {
            statements.push(stmt);
          }
          current = '';
          continue;
        }

        current += ch;
      }

      const tail = current.trim();
      if (tail.length > 0 && !/^--/.test(tail)) statements.push(tail);
      return statements;
    }

    const rawStatements = splitSQLStatements(migrationSQL)
      .filter(s => !s.includes('RAISE NOTICE'));

    // 去掉每条语句开头的注释行，防止 "-- 注释\nCREATE TABLE ..." 被误判为注释而丢弃
    function stripLeadingComments(s) {
      const lines = s.split(/\r?\n/);
      let i = 0;
      while (i < lines.length && lines[i].trim().startsWith('--')) i++;
      return lines.slice(i).join('\n').trim();
    }

    const statements = rawStatements
      .map(stripLeadingComments)
      .filter(s => s.length > 0);

    // 分类执行，确保先建扩展/表，再建索引/触发器
    const isType = (s, reg) => reg.test(s.trim().toUpperCase());
    const ext = [];
    const tables = [];
    const functions = [];
    const indexes = [];
    const triggersDrops = [];
    const triggersCreates = [];
    const others = [];

    for (const s of statements) {
      const stmt = s.trim();
      const upper = stmt.toUpperCase();
      if (upper.startsWith('CREATE EXTENSION')) ext.push(s);
      else if (upper.startsWith('CREATE TABLE')) tables.push(s);
      else if (upper.startsWith('CREATE OR REPLACE FUNCTION')) functions.push(s);
      else if (upper.startsWith('DROP TRIGGER')) triggersDrops.push(s);
      else if (upper.startsWith('CREATE TRIGGER')) triggersCreates.push(s);
      else if (upper.startsWith('CREATE INDEX')) indexes.push(s);
      else others.push(s);
    }

    const ordered = [...ext, ...tables, ...functions, ...others, ...indexes, ...triggersDrops, ...triggersCreates];

    for (const statement of ordered) {
      try {
        // 跳过空语句和注释
        if (statement.length === 0 || statement.startsWith('--')) {
          continue;
        }

        // 执行SQL语句
        await pool.query(statement);
        console.log(`✅ 执行: ${statement.substring(0, 50)}...`);
      } catch (error) {
        // 忽略已存在的错误（表已存在）
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`⚠️  跳过（已存在）: ${statement.substring(0, 50)}...`);
        } else {
          console.error(`❌ 错误: ${error.message}`);
          console.error(`   语句: ${statement.substring(0, 100)}...`);
        }
      }
    }

    console.log('\n✅ 数据库初始化完成！');
    console.log('\n📋 已创建以下表：');
    console.log('   - users');
    console.log('   - journeys');
    console.log('   - experiences');
    console.log('   - accommodations');
    console.log('   - orders');
    console.log('   - user_login_records');
    console.log('\n🎉 现在您可以开始使用数据库了！');
  } catch (error) {
    console.error('\n❌ 数据库初始化失败：');
    console.error(error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };



