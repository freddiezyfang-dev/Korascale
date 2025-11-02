# 🚨 紧急：API 404 错误修复步骤

## 问题确认

访问 `/api/journeys` 或 `/api/test` 显示 404，说明路由未注册。

---

## ✅ 立即执行的步骤

### 步骤 1：确认代码已推送

检查本地是否有未提交的更改：

```bash
git status
```

如果有未提交的文件：
```bash
git add .
git commit -m "fix: 确保 API 路由文件已包含"
git push origin main
```

### 步骤 2：在 Vercel Dashboard 强制重新部署

1. **访问** [Vercel Dashboard](https://vercel.com/dashboard)
2. **选择项目**
3. **Deployments** → 最新部署
4. **点击 "..." → "Redeploy"**
5. **取消勾选 "Use existing Build Cache"** ⚠️ 重要！
6. **点击 "Redeploy"**
7. **等待 3-5 分钟** 部署完成

### 步骤 3：验证部署

部署完成后：

1. **测试路由**：
   ```
   https://your-project.vercel.app/api/test
   ```

2. **预期结果**：
   ```json
   {
     "success": true,
     "message": "API routes are working!",
     ...
   }
   ```

---

## 🔍 如果仍然是 404

### 检查 1：验证文件是否存在

在 Vercel Dashboard：
1. **Deployments** → 最新部署 → **"Source"**
2. 确认可以看到以下文件：
   - `src/app/api/test/route.ts`
   - `src/app/api/journeys/route.ts`

### 检查 2：查看构建日志

1. **Deployments** → 最新部署 → **"Build Logs"**
2. 查找是否有错误或警告
3. 特别注意：
   - TypeScript 编译错误
   - 文件找不到的错误
   - 路由相关的警告

### 检查 3：检查 Next.js 版本

在构建日志中确认 Next.js 版本：
- 应该是 `Next.js 15.5.3`
- 如果版本不对，可能影响路由

---

## 🛠️ 备选方案：简化测试路由

如果还是不行，我们可以创建一个更简单的测试路由来验证：

创建一个新文件 `src/app/api/ping/route.ts`：

```typescript
export async function GET() {
  return Response.json({ pong: true });
}
```

然后测试 `/api/ping`

---

## 📞 需要的信息

如果以上步骤都不工作，请提供：

1. **构建日志截图**（特别是最后几行）
2. **Function Logs**（访问 `/api/test` 时的日志）
3. **部署信息**：
   - 最新部署的 commit hash
   - 部署时间
   - 部署状态（成功/失败）

---

## ⚡ 快速操作清单

- [ ] 确认代码已推送到 GitHub
- [ ] 在 Vercel Dashboard 取消勾选构建缓存并重新部署
- [ ] 等待部署完成（3-5 分钟）
- [ ] 测试 `/api/test`
- [ ] 如果还是 404，检查构建日志

