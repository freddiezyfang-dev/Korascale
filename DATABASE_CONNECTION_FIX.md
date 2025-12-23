# 🔧 数据库连接问题修复指南

## 🚨 当前问题

从日志中看到错误：`Error: getaddrinfo ENOTFOUND base`

这个错误表明：
- 数据库连接字符串中的主机名是 "base"，这是不正确的
- 应用无法解析数据库主机名，导致无法连接数据库

---

## 🔍 诊断步骤

### 步骤 1：检查 Vercel 环境变量

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `korascale`
3. 点击 **"Settings"** → **"Environment Variables"**
4. 查找以下环境变量：
   - `POSTGRES_URL`
   - `NEON_POSTGRES_URL`（如果存在）

### 步骤 2：检查连接字符串格式

正确的 PostgreSQL 连接字符串格式应该是：
```
postgresql://username:password@hostname:port/database?sslmode=require
```

或者：
```
postgres://username:password@hostname:port/database?sslmode=require
```

**关键检查点**：
- ✅ 协议应该是 `postgresql://` 或 `postgres://`
- ✅ 主机名应该是实际的数据库服务器地址（如 `ep-xxx-xxx.us-east-2.aws.neon.tech`）
- ❌ 主机名不应该是 "base" 或其他无效值

### 步骤 3：查看增强的诊断日志

部署完成后（等待 3-5 分钟），再次触发 API 调用：

1. 访问：`https://korascale.vercel.app/api/journeys`
2. 在 Vercel Dashboard → **Logs** 中查找以下日志：

```
[DB] Connection string parsed: {
  protocol: "postgresql:",
  hostname: "...",  // 这里应该显示实际的数据库主机名
  port: "5432" or "default",
  database: "...",
  username: "...",
  hasPassword: true/false,
  usingEnv: "NEON_POSTGRES_URL" or "POSTGRES_URL"
}
```

或者如果解析失败：
```
[DB] Failed to parse connection string: {
  error: "...",
  connectionStringLength: ...,
  connectionStringPrefix: "..."
}
```

---

## 🔧 修复方法

### 方法 1：检查并更新 POSTGRES_URL（如果使用 Vercel Postgres）

1. 在 Vercel Dashboard → **Storage** → **Postgres**
2. 查看数据库详情
3. 复制正确的连接字符串
4. 在 **Settings** → **Environment Variables** 中更新 `POSTGRES_URL`

### 方法 2：检查并更新 NEON_POSTGRES_URL（如果使用 Neon）

1. 登录 [Neon Console](https://console.neon.tech)
2. 选择你的项目
3. 在 **Connection Details** 中复制 **Connection String**
4. 确保选择的是 **Pooled connection**（不是 Direct connection）
5. 在 Vercel Dashboard → **Settings** → **Environment Variables** 中：
   - 如果 `NEON_POSTGRES_URL` 存在，更新它
   - 如果不存在，添加新的环境变量 `NEON_POSTGRES_URL`，值为复制的连接字符串

### 方法 3：重新连接数据库

如果环境变量看起来不正确：

1. **如果使用 Vercel Postgres**：
   - 在 Vercel Dashboard → **Storage** → **Postgres**
   - 断开连接（如果可能）
   - 重新连接数据库
   - Vercel 会自动更新环境变量

2. **如果使用 Neon**：
   - 在 Neon Console 中确认数据库状态正常
   - 在 Vercel Dashboard 中删除旧的 `NEON_POSTGRES_URL`
   - 重新添加正确的连接字符串

---

## 📋 常见问题

### Q1: 连接字符串中的主机名是 "base"

**原因**：环境变量可能被截断或格式错误

**解决**：
1. 检查环境变量的完整值
2. 确保没有额外的空格或换行符
3. 重新复制完整的连接字符串

### Q2: 连接字符串格式看起来正确，但仍然报错

**可能原因**：
1. 数据库服务器不可访问（防火墙、网络问题）
2. SSL 配置问题
3. 数据库凭据错误

**解决**：
1. 检查数据库服务器的可访问性
2. 确认连接字符串包含 `?sslmode=require` 或类似的 SSL 参数
3. 验证用户名和密码是否正确

### Q3: 如何确认连接字符串是否正确？

**测试方法**：
1. 使用 Neon SQL Editor 或 Vercel Postgres SQL Editor 测试连接
2. 如果能在 SQL Editor 中连接，说明连接字符串是正确的
3. 复制 SQL Editor 中使用的连接字符串到 Vercel 环境变量

---

## 🎯 下一步

1. ✅ 检查 Vercel 环境变量中的 `POSTGRES_URL` 和 `NEON_POSTGRES_URL`
2. ✅ 确认连接字符串格式正确，主机名不是 "base"
3. ✅ 等待新部署完成（3-5 分钟）
4. ✅ 触发 API 调用：`https://korascale.vercel.app/api/journeys`
5. ✅ 查看 Logs 中的诊断信息，特别是 `[DB] Connection string parsed` 部分
6. ✅ 根据诊断信息修复环境变量

---

## 💡 提示

- **不要**在日志或代码中暴露完整的连接字符串（包含密码）
- 连接字符串应该以 `postgresql://` 或 `postgres://` 开头
- Neon 的连接字符串通常包含 `ep-xxx-xxx.region.aws.neon.tech` 格式的主机名
- Vercel Postgres 的连接字符串通常包含 `pooler.supabase.com` 或类似的主机名

---

修复后，请告诉我：
1. 连接字符串中的主机名是什么？
2. `[DB] Connection string parsed` 显示了什么信息？
3. 错误是否仍然存在？











