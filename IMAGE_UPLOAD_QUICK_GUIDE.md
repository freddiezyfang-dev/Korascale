# 📸 图片上传快速指南

## ✅ 新图片如何上传到 Vercel Blob

### 方法1：使用上传按钮（推荐）⭐

1. **进入后台管理页面**
   - 添加新 Journey：`/admin/journeys/add`
   - 编辑现有 Journey：`/admin/journeys/edit/[id]` → 点击 "Edit" 按钮

2. **上传图片**
   - 找到 "Images" 卡片
   - 点击 "上传" 或 "上传图片到云存储" 按钮
   - 选择图片文件（支持 JPG, PNG, GIF, WebP 等格式）
   - 等待上传完成（会显示 "上传中..."）

3. **自动填充 URL**
   - 上传成功后，图片 URL 会自动填充到输入框
   - URL 格式：`https://xxx.public.blob.vercel-storage.com/journeys/xxx.jpg`
   - 图片预览会自动更新

4. **保存**
   - 点击 "Save Changes" 或 "Submit" 保存
   - 图片 URL 会保存到数据库

### 方法2：手动输入 URL

如果你已经有图片 URL，可以直接输入：

- **云存储 URL**：`https://xxx.public.blob.vercel-storage.com/journeys/xxx.jpg`
- **本地路径**：`/images/journey-cards/xxx.jpg`（存储在 public 目录）
- **外部 URL**：`https://example.com/image.jpg`

---

## 🔄 Image URL 字段说明

### ✅ **不需要修改现有逻辑**

系统已经支持两种存储方式：

1. **本地路径**（现有图片）
   - 格式：`/images/journey-cards/xxx.jpg`
   - 存储在 `public/images/` 目录
   - 会随代码一起部署

2. **云存储 URL**（新上传的图片）
   - 格式：`https://xxx.public.blob.vercel-storage.com/journeys/xxx.jpg`
   - 存储在 Vercel Blob 云存储
   - 不会因部署而丢失

### 📋 **系统会自动识别**

- ✅ 系统会自动识别 URL 类型（本地路径 vs 云存储）
- ✅ 两种格式都可以正常显示图片
- ✅ 不需要修改数据库结构或代码逻辑

---

## 💡 最佳实践

### ✅ **推荐做法**

1. **新图片一律使用上传按钮**
   - 上传到云存储，不占用代码仓库空间
   - 可以随时修改，无需重新部署
   - 享受 CDN 加速

2. **现有本地图片**
   - 可以继续使用，无需立即迁移
   - 如需迁移，在编辑页面重新上传即可

### ⚠️ **注意事项**

1. **文件大小限制**
   - Vercel Blob Hobby 计划：每个文件最大 4.5MB
   - 如果图片太大，需要先压缩

2. **URL 格式识别**
   - 系统会自动识别 URL 类型并显示相应提示
   - 云存储 URL：显示 ✅ 云存储URL
   - 本地路径：显示 💡 本地路径提示

---

## 🔍 如何验证上传成功

### 检查步骤

1. **查看 URL 格式**
   - 上传成功后，URL 应该是 Blob 格式
   - 例如：`https://xxx.public.blob.vercel-storage.com/journeys/1728123456789-image.jpg`

2. **查看提示信息**
   - 输入框下方会显示：`✅ 云存储URL（已上传到 Vercel Blob 云存储）`

3. **访问图片**
   - 复制 URL 到浏览器地址栏
   - 图片应该可以正常显示

4. **持久化验证**
   - 重新部署后，图片 URL 仍然有效
   - 证明图片存储在云存储中，不会丢失

---

## 📝 总结

### ✅ **回答您的问题**

1. **新图片如何上传到 Vercel Blob？**
   - ✅ 使用后台管理页面的"上传"按钮
   - ✅ 选择图片文件，系统自动上传到云存储
   - ✅ URL 自动填充，无需手动输入

2. **Image URL 字段是否需要修改？**
   - ✅ **不需要修改**
   - ✅ 系统已支持本地路径和云存储 URL 两种格式
   - ✅ 会自动识别并正确显示
   - ✅ 可以混合使用两种格式

### 🎯 **当前状态**

- ✅ 上传功能已完全实现
- ✅ 支持本地路径和云存储 URL
- ✅ 自动识别 URL 类型
- ✅ 显示清晰的提示信息
- ✅ 无需修改现有代码逻辑

**开始使用吧！** 🎉

