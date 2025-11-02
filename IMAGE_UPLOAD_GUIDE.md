# 📸 图片上传到 Vercel Blob 使用指南

## ✅ 功能说明

现在在后台编辑页面，你可以：
1. **直接上传图片文件** → 自动上传到 Vercel Blob 云存储
2. **输入图片 URL** → 支持本地路径或外部 URL

---

## 🚀 如何使用上传功能

### 在 Journey 编辑页面

1. **进入编辑模式**
   - 访问：`/admin/journeys/edit/[id]`
   - 点击 "Edit" 按钮

2. **上传图片**
   - 找到 "Images" 卡片
   - 在 "Main Image URL" 输入框旁边，点击 "上传" 按钮
   - 选择图片文件（支持 JPG, PNG, GIF, WebP 等格式）
   - 等待上传完成（会显示 "上传中..."）

3. **自动填充 URL**
   - 上传成功后，图片 URL 会自动填充到输入框
   - URL 格式类似：`https://xxx.public.blob.vercel-storage.com/journeys/xxx.jpg`
   - 图片预览会自动更新

4. **保存**
   - 点击 "Save Changes" 保存整个 Journey
   - 图片 URL 会保存到数据库

---

## 📋 功能特性

### ✅ 支持的功能

- ✅ **文件类型验证**：只接受图片文件
- ✅ **上传进度提示**：显示 "上传中..." 状态
- ✅ **自动填充 URL**：上传成功后自动填充到输入框
- ✅ **图片预览**：实时预览上传的图片
- ✅ **错误处理**：上传失败会显示错误提示

### 📍 存储位置

- **上传的图片** → Vercel Blob 云存储
  - URL 格式：`https://xxx.public.blob.vercel-storage.com/journeys/文件名.jpg`
  - 存储在 `journeys` 文件夹下
  - 永久存储，不会因部署而丢失

---

## 🔄 迁移现有本地图片到 Blob

如果你现在使用的是 `public/` 目录中的本地图片，可以迁移到 Blob：

### 方法1：在编辑页面手动上传（推荐）

1. **打开编辑页面**
   - 进入需要更新的 Journey 编辑页面

2. **下载本地图片**
   - 从 `public/images/` 目录找到对应的图片
   - 或者在浏览器中打开图片 URL，右键保存

3. **上传到 Blob**
   - 点击 "上传" 按钮
   - 选择刚才下载的图片文件
   - 等待上传完成

4. **保存**
   - 图片 URL 会自动更新为 Blob URL
   - 点击 "Save Changes" 保存

### 方法2：保留本地图片（可选）

如果你暂时不想迁移，可以继续使用本地路径：
- 本地路径格式：`/images/journey-cards/xxx.jpg`
- 这些图片会在部署时包含在代码中
- **注意**：如果要修改这些图片，需要重新部署代码

---

## 💡 最佳实践

### ✅ 推荐做法

1. **新图片一律使用 Blob 上传**
   - 上传到云存储，不占用代码仓库空间
   - 可以随时修改，无需重新部署

2. **使用 Blob URL**
   - 格式：`https://xxx.public.blob.vercel-storage.com/...`
   - 永久有效，不会因部署而丢失

### ⚠️ 注意事项

1. **文件大小限制**
   - Vercel Blob Hobby 计划：每个文件最大 4.5MB
   - 如果图片太大，需要先压缩

2. **文件格式**
   - 推荐：JPG（适合照片）、PNG（适合透明背景）、WebP（最佳压缩）
   - 支持所有标准图片格式

3. **URL 格式**
   - Blob URL：自动生成，格式固定
   - 本地路径：`/images/...`（以 `/` 开头）
   - 外部 URL：`https://...`

---

## 🔍 验证上传成功

### 检查步骤

1. **查看 URL 格式**
   - 上传成功后，URL 应该是 Blob 格式
   - 例如：`https://xxx.public.blob.vercel-storage.com/journeys/1728123456789-image.jpg`

2. **访问图片**
   - 复制 URL 到浏览器地址栏
   - 图片应该可以正常显示

3. **持久化验证**
   - 重新部署后，图片 URL 仍然有效
   - 证明图片存储在云存储中，不会丢失

---

## 🐛 故障排除

### 问题：上传失败

**可能原因**：
1. 文件太大（超过 4.5MB）
   - **解决**：压缩图片后再上传

2. 网络问题
   - **解决**：检查网络连接，重试

3. Blob 存储未配置
   - **解决**：在 Vercel Dashboard → Storage → 创建 Blob 存储

4. 环境变量缺失
   - **解决**：确认 `BLOB_READ_WRITE_TOKEN` 已配置

### 问题：上传成功但 URL 格式不对

**检查**：
- 应该返回 Blob URL 格式
- 如果返回其他格式，检查 `/api/upload` API 实现

### 问题：图片无法访问

**检查**：
- 确认图片 URL 是正确的 Blob URL
- 在浏览器中直接访问 URL 测试
- 检查 Blob 存储是否正常工作

---

## 📝 相关文件

- 上传 API：`src/app/api/upload/route.ts`
- 上传客户端：`src/lib/databaseClient.ts` → `uploadAPI`
- 编辑页面：`src/app/admin/journeys/edit/[id]/page.tsx`

---

## ✅ 完成

现在你可以：

1. ✅ 在后台直接上传图片到 Vercel Blob
2. ✅ 图片自动保存，无需手动输入 URL
3. ✅ 图片永久存储在云存储中
4. ✅ 重新部署不会丢失图片

**开始使用吧！** 🎉

