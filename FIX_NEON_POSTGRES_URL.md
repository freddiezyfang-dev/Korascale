# 🔧 修复 NEON_POSTGRES_URL 环境变量

## 🚨 问题

当前 `NEON_POSTGRES_URL` 的值包含了 `psql` 命令前缀，这不是有效的连接字符串格式。

**错误的值**：
```
psql 'postgresql://neondb_owner:npg_MAJ1HBxXeuF2@ep-red-sunset-adgu8hlv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

**正确的值**（去掉 `psql '` 和末尾的 `'`）：
```
postgresql://neondb_owner:npg_MAJ1HBxXeuF2@ep-red-sunset-adgu8hlv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

---

## 🔧 修复步骤

### 步骤 1：访问 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `korascale`
3. 点击 **"Settings"** → **"Environment Variables"**

### 步骤 2：更新 NEON_POSTGRES_URL

1. 找到 `NEON_POSTGRES_URL` 环境变量
2. 点击 **"Edit"** 或 **"..."** → **"Edit"**
3. 删除 `psql '` 前缀和末尾的 `'`
4. 只保留连接字符串本身：
   ```
   postgresql://neondb_owner:npg_MAJ1HBxXeuF2@ep-red-sunset-adgu8hlv-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```
5. 点击 **"Save"**

### 步骤 3：确认环境变量作用范围

确保 `NEON_POSTGRES_URL` 在以下环境中都设置了：
- ✅ **Production**
- ✅ **Preview**（如果需要）
- ✅ **Development**（如果需要）

### 步骤 4：重新部署

更新环境变量后，Vercel 会自动触发重新部署。或者：

1. 在 **Deployments** 页面
2. 点击最新部署右侧的 **"..."** → **"Redeploy"**
3. 取消勾选 **"Use existing Build Cache"**
4. 点击 **"Redeploy"**

---

## ✅ 验证修复

部署完成后（等待 3-5 分钟）：

1. **触发 API 调用**：
   ```
   https://korascale.vercel.app/api/journeys
   ```

2. **查看 Logs**：
   - 在 Vercel Dashboard → **Logs**
   - 查找 `[DB] Connection string parsed:` 日志
   - 应该显示：
     ```
     hostname: "ep-red-sunset-adgu8hlv-pooler.c-2.us-east-1.aws.neon.tech"
     ```
   - 不应该再看到 `getaddrinfo ENOTFOUND base` 错误

3. **检查 API 响应**：
   - 如果连接成功，应该返回 `{"journeys": []}` 或包含数据的响应
   - 如果表不存在，会返回表不存在的错误（但不会再有 DNS 解析错误）

---

## 📋 连接字符串格式说明

### ✅ 正确格式

```
postgresql://username:password@hostname:port/database?sslmode=require&channel_binding=require
```

### ❌ 错误格式

```
psql 'postgresql://...'  ❌ 包含 psql 命令前缀
'postgresql://...'       ❌ 包含引号
postgresql://...'        ❌ 包含末尾引号
```

---

## 💡 为什么会出现这个错误？

- `psql` 是 PostgreSQL 的命令行工具
- 在 Neon Console 中，连接字符串可能显示为 `psql '...'` 格式，这是为了让你可以直接复制粘贴到终端使用
- 但在环境变量中，只需要连接字符串本身，不需要 `psql` 命令和引号

---

修复后，数据库连接应该就能正常工作了！











