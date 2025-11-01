# 🚀 Vercel 部署完整指南

本指南将帮助您将项目部署到 Vercel，并配置数据库和云存储，确保数据持久化。

---

## 📋 部署前准备

### 1. 检查项目状态

确保所有代码已提交到 Git 仓库：

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. 确认依赖已安装

项目已包含必要的依赖：
- ✅ `@vercel/postgres` - 数据库客户端
- ✅ `@vercel/blob` - 云存储客户端
- ✅ `next` 15.5.3 - Next.js 框架

---

## 🌐 步骤1：连接 GitHub 仓库到 Vercel

### 1.1 登录 Vercel

1. 访问 [https://vercel.com](https://vercel.com)
2. 使用 GitHub 账户登录
3. 在 Dashboard 点击 **"Add New Project"**

### 1.2 导入项目

1. 选择您的 GitHub 仓库 `my-travel-web`
2. Vercel 会自动检测项目配置：
   - **Framework Preset**: Next.js
   - **Build Command**: `next build` (自动检测)
   - **Output Directory**: `.next` (自动检测)
3. 点击 **"Deploy"**（先不设置环境变量，后续再配置）

---

## 🗄️ 步骤2：配置 PostgreSQL 数据库

### 2.1 创建数据库

1. 在 Vercel Dashboard，进入您的项目
2. 点击 **"Storage"** 标签
3. 点击 **"Create Database"**
4. 选择 **"Postgres"**
5. 选择 **"Hobby"** 计划（免费，256MB存储）
6. 点击 **"Create"**
7. 等待数据库创建完成（约1-2分钟）

### 2.2 验证环境变量

Vercel 会自动添加以下环境变量到您的项目：

- ✅ `POSTGRES_URL`
- ✅ `POSTGRES_PRISMA_URL`
- ✅ `POSTGRES_URL_NON_POOLING`
- ✅ `POSTGRES_USER`
- ✅ `POSTGRES_HOST`
- ✅ `POSTGRES_PASSWORD`
- ✅ `POSTGRES_DATABASE`

**无需手动配置！** 这些变量会自动在 Production、Preview 和 Development 环境中可用。

### 2.3 初始化数据库表

#### 方法A：使用 Vercel Dashboard SQL Editor（推荐）

1. 在项目页面，进入 **"Storage"** → **"Postgres"**
2. 点击 **"Tables"** 标签
3. 点击 **"SQL Editor"** 标签
4. 打开文件 `database/migrations/001_create_tables.sql`
5. 复制所有 SQL 内容
6. 粘贴到 SQL 编辑器
7. 点击 **"Run"**
8. ✅ 等待执行完成，确认所有表已创建

#### 方法B：使用 Vercel CLI（可选）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 获取环境变量
vercel env pull .env.local

# 运行初始化脚本
npm run db:init
```

---

## 📦 步骤3：配置 Vercel Blob 存储

### 3.1 创建 Blob 存储

1. 在项目页面，点击 **"Storage"** 标签
2. 点击 **"Create Database"**
3. 选择 **"Blob"**
4. 选择 **"Hobby"** 计划（免费）
5. 点击 **"Create"**
6. 等待存储创建完成

### 3.2 验证环境变量

Vercel 会自动添加：

- ✅ `BLOB_READ_WRITE_TOKEN`

这个 token 会自动用于图片上传 API (`/api/upload`)

---

## ⚙️ 步骤4：配置其他环境变量（可选）

### 4.1 NEXT_PUBLIC_API_URL

**生产环境建议留空**（使用相对路径）

1. 进入项目 → **"Settings"** → **"Environment Variables"**
2. 添加变量（仅用于特殊情况）：
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: （留空或设置为您的域名，如 `https://your-project.vercel.app`）
   - **Environments**: Production, Preview, Development

**注意**: 代码中已使用相对路径 (`/api/...`)，生产环境通常不需要此变量。

---

## 🚀 步骤5：重新部署

### 5.1 触发部署

配置完数据库和存储后，需要重新部署以应用环境变量：

1. 在 Vercel Dashboard，进入项目
2. 点击 **"Deployments"** 标签
3. 找到最新的部署，点击 **"..."** → **"Redeploy"**
4. 或推送新的 commit 触发自动部署

### 5.2 验证部署

部署完成后：

1. ✅ 访问您的域名（如 `https://your-project.vercel.app`）
2. ✅ 检查控制台是否有错误
3. ✅ 测试 API 端点：
   - `https://your-project.vercel.app/api/journeys` - 应返回 journeys 数组

---

## ✅ 步骤6：验证数据持久化

### 6.1 测试数据库连接

1. 访问后台管理页面（需要登录）
2. 添加一个新的 Journey
3. 保存后，检查：
   - ✅ 数据是否成功保存
   - ✅ 刷新页面后数据是否还在
   - ✅ 在 Vercel Dashboard → Storage → Postgres → Tables 中查看数据

### 6.2 测试云存储

1. 在后台编辑页面，上传一张图片
2. 确认：
   - ✅ 图片上传成功
   - ✅ 返回的 URL 是 Vercel Blob 格式（通常以 `https://xxx.public.blob.vercel-storage.com/` 开头）
   - ✅ 图片可以正常访问

### 6.3 验证持久化

**重要测试**：

1. 在 Vercel Dashboard，手动触发一次新的部署
2. 部署完成后，检查：
   - ✅ 之前保存的 Journey 数据是否还在
   - ✅ 上传的图片是否还能正常显示
   - ✅ 所有数据都保存在数据库中，不会因为部署而丢失

---

## 🔍 故障排除

### 问题1：数据库连接失败

**症状**: API 返回 500 错误或 "Failed to fetch journeys"

**解决**:
1. 检查环境变量是否已正确添加
2. 在 Vercel Dashboard → Settings → Environment Variables 确认 `POSTGRES_URL` 存在
3. 确认数据库表已创建（使用 SQL Editor 检查）

### 问题2：图片上传失败

**症状**: 上传图片时返回错误

**解决**:
1. 检查 `BLOB_READ_WRITE_TOKEN` 环境变量是否存在
2. 确认 Blob 存储已创建
3. 检查 API 路由 `/api/upload` 的日志

### 问题3：数据在部署后丢失

**症状**: 部署后之前的数据不见了

**可能原因**:
- ❌ 数据保存在了本地文件系统（不应该这样做）
- ✅ 数据保存在数据库中（正确）

**验证**:
- 检查数据是否在 Vercel Postgres 中
- 确认所有写入操作都通过 `/api/journeys` API
- 确认图片都通过 `/api/upload` 上传到 Blob

### 问题4：环境变量未生效

**解决**:
1. 重新部署项目（环境变量变更需要重新部署）
2. 检查环境变量的作用域（Production/Preview/Development）
3. 确认变量名称拼写正确

---

## 📊 数据持久化确认清单

部署后，请确认：

- ✅ **PostgreSQL 数据库已连接**
  - 环境变量已自动配置
  - 数据库表已创建（journeys, experiences, accommodations, orders, users, user_login_records）

- ✅ **Vercel Blob 存储已连接**
  - `BLOB_READ_WRITE_TOKEN` 已配置
  - 图片上传功能正常

- ✅ **数据写入流程正确**
  - Journey 创建 → 保存到 PostgreSQL
  - 图片上传 → 保存到 Vercel Blob
  - 所有数据都通过 API 保存，不依赖本地文件系统

- ✅ **数据在部署后持久化**
  - 重新部署后，数据仍然存在
  - 图片仍然可以访问

---

## 🎯 快速验证脚本

部署完成后，运行以下测试：

```bash
# 1. 检查 API 端点
curl https://your-project.vercel.app/api/journeys

# 2. 应该返回 journeys 数组（可能为空）
# {"journeys": [...]}

# 3. 如果返回 500 错误，检查数据库连接
# 4. 如果返回空数组，这是正常的（还没有数据）
```

---

## 📝 重要提示

### ✅ 正确做法

- ✅ 所有文本数据 → PostgreSQL 数据库
- ✅ 所有图片 → Vercel Blob 存储
- ✅ 使用 API 路由进行数据操作
- ✅ 环境变量由 Vercel 自动管理

### ❌ 避免的做法

- ❌ 不要在代码中写入本地文件
- ❌ 不要将敏感数据提交到 Git
- ❌ 不要在 `public/` 目录动态写入文件
- ❌ 不要依赖服务器文件系统存储数据

---

## 🎉 部署完成！

如果以上步骤都完成，您的应用已经：

- ✅ 部署到 Vercel
- ✅ 数据库配置完成（PostgreSQL）
- ✅ 云存储配置完成（Vercel Blob）
- ✅ 数据持久化机制正常工作

**下次部署时，您的数据不会丢失！** 🚀

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 Vercel Dashboard 的部署日志
2. 检查 Function Logs 中的错误信息
3. 参考 [Vercel 文档](https://vercel.com/docs)
4. 参考 [DATABASE_SETUP_GUIDE.md](./DATABASE_SETUP_GUIDE.md)

