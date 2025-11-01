# ✅ Vercel 部署检查清单

在部署到 Vercel 之前，请完成以下检查：

---

## 📦 代码准备

- [ ] 所有代码已提交到 Git 仓库
- [ ] `.env.local` 文件已添加到 `.gitignore`（不会提交敏感信息）
- [ ] 没有硬编码的 API 密钥或敏感信息
- [ ] `package.json` 中的依赖都是正确的

---

## 🗄️ 数据库配置（在 Vercel Dashboard 完成）

- [ ] 已创建 PostgreSQL 数据库
- [ ] 已运行数据库迁移脚本（`database/migrations/001_create_tables.sql`）
- [ ] 验证了以下环境变量已自动添加：
  - [ ] `POSTGRES_URL`
  - [ ] `POSTGRES_PRISMA_URL`
  - [ ] `POSTGRES_URL_NON_POOLING`
  - [ ] `POSTGRES_USER`
  - [ ] `POSTGRES_HOST`
  - [ ] `POSTGRES_PASSWORD`
  - [ ] `POSTGRES_DATABASE`

---

## 📦 云存储配置（在 Vercel Dashboard 完成）

- [ ] 已创建 Vercel Blob 存储
- [ ] 验证了以下环境变量已自动添加：
  - [ ] `BLOB_READ_WRITE_TOKEN`

---

## 🌐 部署步骤

- [ ] 已在 Vercel 连接 GitHub 仓库
- [ ] 项目已成功部署
- [ ] 部署完成后重新部署一次（确保环境变量生效）

---

## ✅ 部署后验证

### API 端点测试

- [ ] 访问 `https://your-project.vercel.app/api/journeys` 返回数据（可能为空数组）
- [ ] 没有 500 错误

### 数据库测试

- [ ] 在后台添加一个 Journey
- [ ] 刷新页面后数据仍在
- [ ] 在 Vercel Dashboard → Storage → Postgres → Tables 中能看到数据

### 云存储测试

- [ ] 上传一张图片
- [ ] 图片返回的 URL 是 Vercel Blob 格式
- [ ] 图片可以正常访问

### 数据持久化测试

- [ ] 触发一次新的部署
- [ ] 部署完成后，之前的数据仍然存在
- [ ] 上传的图片仍然可以访问

---

## 🎯 关键确认点

**数据存储位置**：
- ✅ 文本数据 → PostgreSQL（Vercel）
- ✅ 图片文件 → Vercel Blob（Vercel）
- ❌ 不存储在本地文件系统

**环境变量**：
- ✅ 由 Vercel 自动管理
- ✅ 无需手动配置（连接数据库/存储后自动添加）
- ✅ 生产环境、预览环境、开发环境都会自动配置

---

## 🚨 常见问题

如果遇到问题，检查：

1. **数据库连接失败**
   - 检查环境变量是否已配置
   - 确认数据库表已创建
   - 查看 Function Logs 中的错误信息

2. **图片上传失败**
   - 检查 `BLOB_READ_WRITE_TOKEN` 是否存在
   - 确认 Blob 存储已创建

3. **数据在部署后丢失**
   - 确认数据保存在数据库中，不是本地文件
   - 检查 Vercel Postgres 中的数据

---

## 📝 部署命令（可选，使用 CLI）

如果需要使用 Vercel CLI：

```bash
# 安装 CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

---

## ✅ 完成

当所有项目都勾选完成后，您的应用已经：

- ✅ 成功部署到 Vercel
- ✅ 数据库和云存储配置完成
- ✅ 数据持久化机制正常工作
- ✅ 下次部署不会丢失数据

🎉 **恭喜！部署完成！**

