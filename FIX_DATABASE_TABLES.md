# 🔧 修复数据库表不存在错误

## ❌ 错误信息

```
error: relation "journeys" does not exist
```

**原因**：数据库连接正常，但表还没有创建。

---

## ✅ 解决方案：在 Vercel Dashboard 中执行 SQL 迁移

### 方法 1：使用 Vercel Dashboard SQL Editor（推荐）

#### 步骤 1：进入 SQL Editor

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 点击 **"Storage"** 标签
4. 点击 **"Postgres"** 数据库
5. 点击 **"Tables"** 标签
6. 点击 **"SQL Editor"** 标签

#### 步骤 2：执行迁移脚本

1. **打开迁移文件**：在本地打开 `database/migrations/001_create_tables.sql`
2. **复制所有内容**（全选 `Cmd+A` / `Ctrl+A`，复制 `Cmd+C` / `Ctrl+C`）
3. **粘贴到 SQL Editor**（在 Vercel Dashboard）
4. **点击 "Run" 按钮**
5. ✅ 等待执行完成

#### 步骤 3：验证表已创建

在 SQL Editor 中执行：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

应该看到以下表：
- ✅ `users`
- ✅ `journeys`
- ✅ `experiences`
- ✅ `accommodations`
- ✅ `orders`
- ✅ `user_login_records`

---

### 方法 2：使用 Neon Dashboard（如果使用 Neon）

如果你使用的是 Neon Postgres：

1. 访问 [Neon Dashboard](https://console.neon.tech)
2. 选择你的项目
3. 点击 **"SQL Editor"**
4. 复制 `database/migrations/001_create_tables.sql` 的内容
5. 粘贴并执行

---

## 🔍 验证修复

### 测试 1：访问 API

```
https://your-project.vercel.app/api/journeys
```

**预期结果**：
```json
{
  "journeys": []
}
```
（空数组是正常的，说明表已创建，只是还没有数据）

### 测试 2：检查 Vercel Logs

在 Vercel Dashboard：
1. **Functions** → **Logs**
2. 访问 `/api/journeys`
3. 应该不再出现 `relation "journeys" does not exist` 错误

---

## 📝 迁移脚本位置

迁移脚本位于：
```
database/migrations/001_create_tables.sql
```

这个脚本会创建：
- ✅ `users` 表
- ✅ `journeys` 表（最重要的！）
- ✅ `experiences` 表
- ✅ `accommodations` 表
- ✅ `orders` 表
- ✅ `user_login_records` 表
- ✅ 所有索引和触发器

---

## 🐛 如果仍然出错

### 检查清单：

1. **确认已执行 SQL**
   - 在 SQL Editor 中检查表是否存在
   - 执行：`\dt` 或 `SELECT * FROM information_schema.tables`

2. **检查数据库连接**
   - Vercel Dashboard → Settings → Environment Variables
   - 确认 `POSTGRES_URL` 存在且正确

3. **确认环境变量已部署**
   - 在 Vercel Dashboard 重新部署一次
   - 或推送新的 commit 触发部署

4. **检查日志**
   - Functions → Logs
   - 查看是否有其他错误信息

---

## ✅ 完成后的状态

执行完成后：

- ✅ `/api/journeys` 返回 `{"journeys": []}`（不是 404 或 500）
- ✅ `/api/test` 返回成功信息
- ✅ 可以开始导入数据或创建新的 journeys

---

## 🚀 下一步

表创建完成后，你可以：

1. **导入数据**：使用 `MIGRATE_DATA_TO_VERCEL.md` 中的方法导入 localhost 数据
2. **创建新数据**：在后台添加新的 journeys
3. **验证功能**：测试所有 API 端点

---

**需要帮助？** 如果 SQL 执行时遇到错误，请告诉我具体的错误信息！

