# 🚀 快速部署到 Vercel

## 第一步：提交代码到 Git

在部署之前，请先提交所有更改：

```bash
# 添加所有更改
git add .

# 提交更改
git commit -m "准备部署到 Vercel"

# 推送到远程仓库
git push origin main
```

## 第二步：在 Vercel 上部署

### 方法 1：通过 Vercel Dashboard（推荐）

1. **访问 Vercel**
   - 打开 [https://vercel.com](https://vercel.com)
   - 使用 GitHub 账户登录

2. **导入项目**
   - 点击 **"Add New Project"** 或 **"New Project"**
   - 选择您的 GitHub 仓库 `my-travel-web`
   - Vercel 会自动检测到 Next.js 项目

3. **配置项目**
   - **Framework Preset**: Next.js（自动检测）
   - **Build Command**: `next build`（自动检测）
   - **Output Directory**: `.next`（自动检测）
   - **Install Command**: `npm install`（自动检测）

4. **首次部署**
   - 点击 **"Deploy"** 按钮
   - 等待部署完成（约 2-5 分钟）

### 方法 2：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 在项目目录中部署
cd /Users/freddiefang/my-travel-web
vercel

# 部署到生产环境
vercel --prod
```

## 第三步：配置数据库

部署完成后，需要配置 PostgreSQL 数据库：

1. **创建数据库**
   - 在 Vercel Dashboard，进入您的项目
   - 点击 **"Storage"** 标签
   - 点击 **"Create Database"**
   - 选择 **"Postgres"**
   - 选择 **"Hobby"** 计划（免费）
   - 点击 **"Create"**

2. **初始化数据库表**
   - 在 **"Storage"** → **"Postgres"** 页面
   - 点击 **"Tables"** 标签
   - 点击 **"SQL Editor"** 标签
   - 打开文件 `database/migrations/001_create_tables.sql`
   - 复制所有 SQL 内容并粘贴到 SQL 编辑器
   - 点击 **"Run"** 执行

3. **运行其他迁移（可选）**
   - 依次执行：
     - `database/migrations/002_add_journey_type.sql`
     - `database/migrations/003_create_tailor_made_china.sql`
     - `database/migrations/004_update_classification_names.sql`

## 第四步：配置云存储

1. **创建 Blob 存储**
   - 在项目页面，点击 **"Storage"** 标签
   - 点击 **"Create Database"**
   - 选择 **"Blob"**
   - 选择 **"Hobby"** 计划（免费）
   - 点击 **"Create"**

2. **验证环境变量**
   - Vercel 会自动添加 `BLOB_READ_WRITE_TOKEN`
   - 无需手动配置

## 第五步：重新部署

配置完数据库和存储后，需要重新部署：

1. 在 Vercel Dashboard，进入项目
2. 点击 **"Deployments"** 标签
3. 找到最新的部署，点击 **"..."** → **"Redeploy"**
4. 或推送新的 commit 触发自动部署

## 第六步：验证部署

### 测试 API
访问：`https://your-project.vercel.app/api/journeys`
- 应该返回 JSON 数据（可能为空数组）
- 不应该有 500 错误

### 测试数据库
1. 访问后台管理页面
2. 添加一个 Journey
3. 刷新页面，确认数据仍在

### 测试云存储
1. 在后台编辑页面，上传一张图片
2. 确认图片 URL 是 Vercel Blob 格式
3. 确认图片可以正常访问

## ✅ 部署完成！

如果以上步骤都完成，您的应用已经成功部署到 Vercel！

**重要提示**：
- ✅ 所有数据保存在 PostgreSQL 数据库中
- ✅ 所有图片保存在 Vercel Blob 存储中
- ✅ 重新部署不会丢失数据

## 🔧 故障排除

### 问题：构建失败
- 检查 `package.json` 中的依赖是否正确
- 查看 Vercel 部署日志中的错误信息

### 问题：数据库连接失败
- 确认 PostgreSQL 数据库已创建
- 检查环境变量 `POSTGRES_URL` 是否存在
- 确认数据库表已创建

### 问题：图片上传失败
- 确认 Blob 存储已创建
- 检查环境变量 `BLOB_READ_WRITE_TOKEN` 是否存在

## 📞 需要帮助？

- 查看详细部署指南：`VERCEL_DEPLOYMENT_GUIDE.md`
- 查看部署检查清单：`DEPLOYMENT_CHECKLIST.md`
- 查看 Vercel 文档：https://vercel.com/docs

