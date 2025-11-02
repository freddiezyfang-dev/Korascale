# 🔧 修复 API 404 错误指南

## 问题症状

访问 `/api/journeys` 时显示 404 错误。

## 可能的原因

1. **数据库连接初始化失败** - 在模块加载时抛出错误，导致路由无法注册
2. **Vercel 部署问题** - 代码没有正确部署
3. **环境变量缺失** - `POSTGRES_URL` 未配置

## ✅ 已实施的修复

### 1. 延迟数据库连接初始化

修改了 `src/lib/db.ts`，从模块加载时初始化改为运行时初始化，避免在环境变量缺失时导致整个模块无法加载。

### 2. 添加了测试路由

创建了 `/api/test` 路由用于验证 API 路由是否正常工作。

### 3. 改进了错误处理

在 `/api/journeys` 中添加了数据库配置检查，返回更明确的错误信息。

---

## 🔍 诊断步骤

### 步骤 1：测试 API 路由是否工作

访问测试路由：
```
https://your-project.vercel.app/api/test
```

**预期结果**：
- ✅ 返回 JSON：`{"success": true, "message": "API routes are working!", ...}`
- ❌ 如果还是 404，说明是 Vercel 部署问题

### 步骤 2：检查 `/api/journeys`

如果测试路由工作，但 `/api/journeys` 不工作：

访问：
```
https://your-project.vercel.app/api/journeys
```

**可能的结果**：

1. **404 错误** - 路由未注册
   - 检查 Vercel 部署日志
   - 确认代码已正确推送和部署

2. **500 错误** - 路由存在但执行失败
   - 检查错误信息
   - 查看 Vercel Function Logs

3. **返回数据** - 正常工作 ✅

---

## 🔧 解决方案

### 方案 1：重新部署

1. **推送最新代码**：
   ```bash
   git add .
   git commit -m "fix: 修复 API 路由 404 错误"
   git push origin main
   ```

2. **在 Vercel Dashboard 手动触发重新部署**：
   - Deployments → 最新部署 → "..." → "Redeploy"

### 方案 2：检查环境变量

在 Vercel Dashboard：

1. **Settings** → **Environment Variables**
2. 确认 `POSTGRES_URL` 存在且正确
3. 如果没有，添加：
   - 从 Neon Dashboard 复制连接字符串
   - 或从 Vercel Storage → Postgres 查看连接信息

### 方案 3：检查部署日志

在 Vercel Dashboard：

1. **Deployments** → 选择最新部署
2. **View Function Logs**
3. 查看是否有错误信息

---

## 🧪 本地测试

在本地验证修复是否有效：

1. **启动开发服务器**：
   ```bash
   npm run dev
   ```

2. **测试路由**：
   - `http://localhost:3000/api/test` - 应该返回成功
   - `http://localhost:3000/api/journeys` - 应该返回数据或明确的错误信息

3. **检查 Console**：
   - 如果有数据库连接错误，应该看到明确的错误信息

---

## 📝 修改的文件

1. ✅ `src/lib/db.ts` - 延迟数据库连接初始化
2. ✅ `src/app/api/journeys/route.ts` - 添加环境变量检查
3. ✅ `src/app/api/test/route.ts` - 新增测试路由

---

## ✅ 验证清单

- [ ] 测试路由 `/api/test` 工作正常
- [ ] `/api/journeys` 返回数据或明确的错误信息（不是 404）
- [ ] Vercel 环境变量 `POSTGRES_URL` 已配置
- [ ] 最新代码已部署到 Vercel

---

## 🐛 如果问题仍然存在

### 检查清单：

1. **确认代码已部署**
   - Vercel Dashboard → Deployments
   - 确认最新部署包含修复代码

2. **检查 Function Logs**
   - Vercel Dashboard → Functions → Logs
   - 查看 `/api/journeys` 的错误信息

3. **验证环境变量**
   - Settings → Environment Variables
   - 确认 `POSTGRES_URL` 存在

4. **检查数据库连接**
   - Storage → Postgres → Tables
   - 确认数据库可以访问

5. **清除 Vercel 缓存**
   - 在 Vercel Dashboard 触发重新部署
   - 或推送新的 commit

---

## 📞 需要更多帮助？

如果以上步骤都无法解决问题，请提供：

1. **测试路由的结果**（`/api/test`）
2. **Vercel Function Logs** 中的错误信息
3. **环境变量配置截图**（隐藏敏感信息）
4. **部署日志**中的错误信息

