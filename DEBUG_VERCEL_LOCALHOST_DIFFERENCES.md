# 🔍 Vercel 与 Localhost 页面差异诊断指南

## 📋 可能的原因

Vercel 和 localhost 显示不同的内容，通常由以下原因造成：

---

## 1️⃣ 数据来源不同（最常见）

### Localhost 的数据来源

**优先级顺序**：
1. ✅ 数据库数据（如果有 `POSTGRES_URL`）
2. ✅ localStorage 数据（浏览器本地存储）
3. ✅ 默认数据（`defaultJourneys`）

### Vercel 的数据来源

**优先级顺序**：
1. ✅ 数据库数据（从 Neon PostgreSQL 加载）
2. ❌ localStorage（每个访问者都是新的，没有数据）
3. ✅ 默认数据（`defaultJourneys`）- **如果没有数据库数据**

### 诊断步骤

1. **检查数据库是否有数据**
   - 在 Vercel Dashboard → Storage → Postgres → Tables
   - 查看 `journeys` 表是否有数据
   - 如果表是空的，页面会显示 `defaultJourneys`（默认数据）

2. **检查浏览器控制台**
   - 在 Vercel 网站打开开发者工具（F12）
   - 查看 Console 标签中的日志：
     ```
     JourneyManagementContext: Loading journeys from database...
     JourneyManagementContext: Loaded from database: X journeys
     或
     JourneyManagementContext: No stored journeys, using default data
     ```

3. **测试 API**
   - 访问：`https://your-project.vercel.app/api/journeys`
   - 如果返回 `{"journeys": []}` → 数据库是空的
   - 如果返回 500 错误 → 数据库连接有问题

---

## 2️⃣ API 调用问题

### 检查 API_BASE_URL

在 `src/lib/databaseClient.ts` 中：
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
```

- **Localhost**：可能是空字符串（使用相对路径 `/api/...`）
- **Vercel**：如果设置了 `NEXT_PUBLIC_API_URL`，可能指向不同的 URL

### 解决方法

**建议**：在生产环境不设置 `NEXT_PUBLIC_API_URL`（留空），使用相对路径。

检查 Vercel 环境变量：
1. Vercel Dashboard → Settings → Environment Variables
2. 如果 `NEXT_PUBLIC_API_URL` 存在且不是空的，考虑删除它
3. 重新部署

---

## 3️⃣ 数据库连接问题

### 症状

- 页面显示空白或错误
- Console 显示 API 错误
- `/api/journeys` 返回 500 错误

### 检查步骤

1. **验证环境变量**
   - Vercel Dashboard → Settings → Environment Variables
   - 确认 `POSTGRES_URL` 存在

2. **检查 Function Logs**
   - Vercel Dashboard → Functions → Logs
   - 查看 `/api/journeys` 的错误信息

3. **验证数据库表**
   - Storage → Postgres → Tables
   - 确认所有表都已创建

---

## 4️⃣ 代码版本不同

### 检查

1. **确认部署的是最新代码**
   - Vercel Dashboard → Deployments
   - 查看最新部署的 commit hash
   - 与本地 `git log` 对比

2. **强制重新部署**
   - Deployments → 最新部署 → "..." → "Redeploy"

---

## 5️⃣ 缓存问题

### 浏览器缓存

- 清除浏览器缓存
- 使用无痕模式访问 Vercel 网站
- 硬刷新：`Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac)

### Vercel 缓存

- 重新部署会清除缓存
- 检查 Deployment 是否使用了缓存

---

## 🔧 快速诊断步骤

### 步骤 1：检查数据库数据

在浏览器控制台（Vercel 网站）：
```javascript
fetch('/api/journeys').then(r => r.json()).then(console.log)
```

**预期结果**：
- `{"journeys": []}` → 数据库是空的（正常，只是还没有数据）
- `{"journeys": [...]}` → 有数据
- `500 错误` → 数据库连接问题

### 步骤 2：检查 Console 日志

查看浏览器 Console，应该看到：
```
JourneyManagementContext: Loading journeys from database...
```

然后应该是：
- `Loaded from database: X journeys` → 有数据库数据
- `No stored journeys, using default data` → 使用默认数据

### 步骤 3：检查网络请求

开发者工具 → Network 标签：
- 查看 `/api/journeys` 请求
- 检查状态码和响应内容

---

## ✅ 解决方案

### 情况 A：数据库是空的

**症状**：Vercel 显示默认数据（`defaultJourneys`），localhost 显示 localStorage 数据

**解决**：
1. 在 Vercel 后台添加数据
2. 或从 localhost 导出数据并导入到 Vercel 数据库

### 情况 B：API 调用失败

**症状**：Vercel 显示错误或空白页面

**解决**：
1. 检查环境变量配置
2. 查看 Function Logs 中的错误
3. 确认数据库连接正常

### 情况 C：代码版本不同

**症状**：功能或 UI 不同

**解决**：
1. 确认最新代码已推送
2. 等待 Vercel 自动部署
3. 或手动触发重新部署

---

## 🎯 推荐的检查清单

- [ ] Vercel 上的数据库是否有数据？
- [ ] API 端点是否正常（访问 `/api/journeys`）？
- [ ] 浏览器 Console 有什么日志？
- [ ] Network 请求是否成功？
- [ ] 环境变量是否配置正确？
- [ ] 代码是否是最新版本？

---

## 📝 常见场景

### 场景 1：数据库是空的

**本地**：使用 localStorage 或本地数据库，有数据
**Vercel**：数据库是空的，显示默认数据

**解决**：在 Vercel 后台添加数据

### 场景 2：数据在数据库但页面显示不同

**可能原因**：
- 数据库有数据，但页面使用了缓存
- 数据格式不同
- API 返回的数据结构不同

**解决**：清除缓存，检查数据格式

### 场景 3：功能不同

**可能原因**：
- 代码版本不同
- 环境变量不同
- 功能依赖某些本地配置

**解决**：确保代码和环境变量一致

---

## 💡 需要我帮助诊断？

请告诉我：

1. **Vercel 页面显示什么？**
   - 空白页面？
   - 默认数据（defaultJourneys）？
   - 错误信息？

2. **浏览器 Console 有什么日志？**
   - 复制 Console 中的日志信息

3. **API 测试结果**
   - 访问 `https://your-project.vercel.app/api/journeys` 返回什么？

4. **数据库是否有数据？**
   - Vercel Dashboard → Storage → Postgres → Tables → journeys

我可以根据这些信息帮你定位具体问题！

