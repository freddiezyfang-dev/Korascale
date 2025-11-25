# 🚀 执行迁移脚本指南

## 📋 迁移脚本位置

迁移脚本文件：`database/migrations/002_add_journey_type.sql`

---

## ✅ 方法一：通过 Vercel Dashboard 执行（推荐，最简单）

这是最简单、最安全的方法，适合所有用户。

### 步骤：

1. **登录 Vercel Dashboard**
   - 访问 [https://vercel.com](https://vercel.com)
   - 登录您的账户

2. **进入项目**
   - 选择您的项目 `my-travel-web`

3. **打开 SQL Editor**
   - 点击顶部菜单 **"Storage"** 标签
   - 找到 **"Postgres"** 数据库
   - 点击 **"Postgres"** 进入数据库详情页
   - 点击 **"SQL Editor"** 标签

4. **执行迁移脚本**
   - 打开本地文件：`database/migrations/002_add_journey_type.sql`
   - 复制**全部内容**（Ctrl+A / Cmd+A，然后 Ctrl+C / Cmd+C）
   - 粘贴到 Vercel SQL Editor 中
   - 点击 **"Run"** 或 **"Execute"** 按钮

5. **查看执行结果**
   - 如果成功，会显示 "Success" 或执行完成的消息
   - 如果失败，会显示错误信息（通常是字段已存在的提示，这是正常的）

### ✅ 验证迁移是否成功

在 SQL Editor 中执行以下查询：

```sql
-- 检查字段是否存在
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'journeys' 
  AND column_name = 'journey_type';

-- 检查索引是否存在
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'journeys' 
  AND indexname = 'idx_journeys_journey_type';

-- 查看数据分布
SELECT journey_type, COUNT(*) as count
FROM journeys 
GROUP BY journey_type;
```

如果查询返回结果，说明迁移成功！

---

## ✅ 方法二：通过本地命令行执行（需要 psql）

如果您在本地安装了 PostgreSQL 客户端工具（psql），可以使用此方法。

### 前提条件：

1. 安装 PostgreSQL 客户端
   ```bash
   # macOS
   brew install postgresql
   
   # 或使用 Homebrew 的 postgresql-client
   brew install libpq
   ```

2. 获取数据库连接字符串
   - 在 Vercel Dashboard → Storage → Postgres
   - 复制 `POSTGRES_URL` 或 `POSTGRES_URL_NON_POOLING`

### 执行步骤：

1. **设置环境变量**（临时）
   ```bash
   export POSTGRES_URL="postgres://user:password@host:port/database"
   ```
   
   或者直接在执行命令时使用：
   ```bash
   POSTGRES_URL="your-connection-string" psql $POSTGRES_URL -f database/migrations/002_add_journey_type.sql
   ```

2. **执行迁移脚本**
   ```bash
   cd /Users/freddiefang/my-travel-web
   psql $POSTGRES_URL -f database/migrations/002_add_journey_type.sql
   ```

3. **验证**
   ```bash
   psql $POSTGRES_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'journeys' AND column_name = 'journey_type';"
   ```

---

## ✅ 方法三：通过 Node.js 脚本执行

创建一个临时脚本来执行迁移。

### 创建执行脚本：

```bash
# 在项目根目录创建临时脚本
cat > scripts/run-migration.js << 'EOF'
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

async function runMigration() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '../database/migrations/002_add_journey_type.sql'),
      'utf8'
    );
    
    console.log('执行迁移脚本...');
    await pool.query(sql);
    console.log('✅ 迁移完成！');
    
    // 验证
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'journeys' 
        AND column_name = 'journey_type'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ 验证成功：journey_type 字段已存在');
    } else {
      console.log('❌ 验证失败：journey_type 字段不存在');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    if (error.message.includes('already exists')) {
      console.log('💡 提示：字段可能已经存在，这是正常的');
    }
    await pool.end();
    process.exit(1);
  }
}

runMigration();
EOF
```

### 执行脚本：

```bash
node scripts/run-migration.js
```

---

## ⚠️ 常见问题

### 1. 错误：column "journey_type" already exists

**原因**：字段已经存在，迁移已经执行过了。

**解决**：这是正常的，说明迁移已经完成。可以跳过此步骤。

### 2. 错误：relation "journeys" does not exist

**原因**：journeys 表还没有创建。

**解决**：先执行 `database/migrations/001_create_tables.sql` 创建表结构。

### 3. 错误：permission denied

**原因**：数据库用户权限不足。

**解决**：检查 Vercel Dashboard 中的数据库连接配置，确保使用正确的连接字符串。

### 4. 无法连接到数据库

**原因**：环境变量未设置或连接字符串错误。

**解决**：
- 检查 `.env.local` 文件中是否有 `POSTGRES_URL`
- 或在 Vercel Dashboard 中确认环境变量已正确配置

---

## 🎯 推荐执行方式

**对于大多数用户，推荐使用方法一（Vercel Dashboard）**：
- ✅ 最简单，无需安装任何工具
- ✅ 最安全，直接在 Vercel 平台执行
- ✅ 有可视化界面，容易查看结果
- ✅ 支持查看执行历史

---

## 📝 执行后的验证

执行迁移后，可以通过以下方式验证：

1. **在 Vercel SQL Editor 中查询**：
   ```sql
   SELECT journey_type, COUNT(*) 
   FROM journeys 
   GROUP BY journey_type;
   ```

2. **通过 API 检查**（如果服务器在运行）：
   ```
   http://localhost:3000/api/check-migration
   ```

3. **在管理后台查看**：
   - 访问 `/admin/journeys`
   - 查看 journey 列表，确认可以设置 `journeyType`

---

## 🚀 下一步

迁移完成后，可以继续：
- ✅ 第三阶段：更新前端显示页面
- ✅ 第四阶段：更新管理后台
- ✅ 开始添加内容和上传图片


