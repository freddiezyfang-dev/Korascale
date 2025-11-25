# 🗄️ 数据库设置完整指南

## 📋 步骤概览

1. ✅ 安装依赖包
2. ✅ 在Vercel Dashboard连接Postgres数据库
3. ✅ 连接Vercel Blob存储
4. ✅ 运行数据库初始化脚本
5. ✅ 验证数据库连接

---

## 🔧 步骤1：安装依赖包

依赖已添加到 `package.json`，运行：

```bash
npm install
```

这将安装：
- `@vercel/postgres` - PostgreSQL数据库客户端
- `@vercel/blob` - 图片云存储客户端

---

## 🔧 步骤2：在Vercel Dashboard连接Postgres数据库

### 2.1 进入Vercel Dashboard

1. 访问 [https://vercel.com](https://vercel.com)
2. 登录您的账户
3. 选择您的项目

### 2.2 连接Postgres数据库

1. 在项目页面，点击 **"Storage"** 标签
2. 点击 **"Create Database"**
3. 选择 **"Postgres"**
4. 选择 **"Hobby"** 计划（免费，256MB存储）
5. 点击 **"Create"**

### 2.3 自动配置环境变量

Vercel会自动添加以下环境变量：
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

这些变量会自动在Vercel部署中使用，无需手动配置！

---

## 🖼️ 步骤3：连接Vercel Blob存储

### 3.1 创建Blob存储

1. 在项目页面，点击 **"Storage"** 标签
2. 点击 **"Create Database"**
3. 选择 **"Blob"**
4. 选择 **"Hobby"** 计划（免费）
5. 点击 **"Create"**

### 3.2 获取访问令牌

Blob存储会自动配置，并添加：
- `BLOB_READ_WRITE_TOKEN`

---

## 🗄️ 步骤4：运行数据库初始化脚本

### 4.1 方法一：使用Vercel Dashboard（推荐）

1. 进入Vercel Dashboard
2. 点击项目 → **"Settings"** → **"Environment Variables"**
3. 确认所有Postgres变量已存在
4. 进入 **"Storage"** → **"Postgres"** → **"Tables"**
5. 点击 **"SQL Editor"**
6. 复制 `database/migrations/001_create_tables.sql` 的内容
7. 粘贴到SQL编辑器
8. 点击 **"Run"**

### 4.2 方法二：使用本地脚本

如果您想在本地测试：

1. 在Vercel Dashboard复制所有环境变量
2. 创建 `.env.local` 文件，添加所有变量：
   ```env
   POSTGRES_URL=postgres://...
   POSTGRES_PRISMA_URL=postgres://...
   POSTGRES_URL_NON_POOLING=postgres://...
   POSTGRES_USER=...
   POSTGRES_HOST=...
   POSTGRES_PASSWORD=...
   POSTGRES_DATABASE=...
   BLOB_READ_WRITE_TOKEN=vercel_blob_...
   ```

3. 运行初始化脚本：
   ```bash
   node scripts/init-database.js
   ```

---

## ✅ 步骤5：验证数据库连接

### 5.1 检查表是否创建成功

在Vercel Dashboard：
1. 进入 **"Storage"** → **"Postgres"** → **"Tables"**
2. 您应该看到以下表：
   - ✅ `users`
   - ✅ `journeys`
   - ✅ `experiences`
   - ✅ `accommodations`
   - ✅ `orders`
   - ✅ `user_login_records`

### 5.2 测试API端点

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问 `http://localhost:3000/api/journeys`
   - 如果返回 `{ journeys: [] }`，说明数据库连接成功！

### 5.3 测试后台功能

1. 访问 `http://localhost:3000/admin/journeys`
2. 尝试添加一个新journey
3. 检查数据是否保存到数据库

---

## 🎯 数据自动保存流程

### ✅ 已实现的自动保存功能

1. **后台录入文本** → 自动保存到PostgreSQL ✅
2. **图片上传** → 自动上传到Vercel Blob ✅
3. **用户信息** → 自动保存到PostgreSQL ✅

### 📊 数据库表结构

#### `journeys` 表
- **结构化字段**: title, slug, price, category, region, city等
- **JSONB字段**: itinerary, overview, inclusions等复杂嵌套数据
- **全文搜索**: 自动创建搜索索引
- **时间戳**: created_at, updated_at自动更新

#### `experiences` 表
- 与journeys类似的结构
- 支持类型、难度、时长等字段

#### `accommodations` 表
- 酒店/住宿信息
- 位置、价格、评级等

#### `orders` 表
- 订单信息
- 关联用户、订单项等

#### `users` 表
- 用户信息
- 登录记录

---

## 🚨 故障排除

### 问题1: 数据库连接失败

**错误**: `Failed to connect to database`

**解决**:
1. 检查Vercel Dashboard中的环境变量是否正确
2. 确认Postgres数据库已创建并运行
3. 检查网络连接

### 问题2: 表已存在错误

**错误**: `relation already exists`

**解决**:
- 这是正常的，说明表已创建，可以忽略

### 问题3: 环境变量未找到

**错误**: `Environment variable POSTGRES_URL not found`

**解决**:
1. 在Vercel Dashboard确认所有变量已添加
2. 如果本地开发，检查 `.env.local` 文件
3. 重启开发服务器

### 问题4: 权限错误

**错误**: `permission denied`

**解决**:
1. 检查数据库用户权限
2. 确认使用正确的连接字符串

---

## 📊 数据库管理

### 查看数据

在Vercel Dashboard：
1. **Storage** → **Postgres** → **Tables**
2. 点击表名查看数据

### 执行SQL查询

1. **Storage** → **Postgres** → **SQL Editor**
2. 输入SQL查询
3. 点击 **"Run"**

### 导出数据

1. **Storage** → **Postgres** → **Data**
2. 选择表
3. 点击 **"Export"**

---

## 🎉 完成！

您的数据库已经设置完成，所有功能都可以正常工作了！

### ✅ 现在您可以：

1. **在后台录入内容** → 自动保存到数据库
2. **上传图片** → 自动上传到云存储
3. **管理用户** → 自动保存到数据库
4. **查看订单** → 数据持久化存储

### 📝 下一步：

1. 开始在后台录入您的journey内容
2. 上传图片
3. 所有数据会自动保存，无需担心！

---

## 💡 提示

- **免费计划限制**: Hobby计划有256MB存储，对于起步足够使用
- **自动备份**: Vercel Postgres自动备份，无需担心数据丢失
- **扩展**: 当数据增长时，可以轻松升级到更高计划

---

**🎊 恭喜！您的数据库系统已经准备就绪！**







