# 📊 如何查看 Vercel Function Logs

## 🔍 查看诊断日志的步骤

### 步骤 1：访问 Vercel Dashboard

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目 `my-travel-web`

### 步骤 2：找到 Function Logs

有两种方式查看日志：

#### 方式 A：通过 Functions 页面（推荐）

1. 在项目 Dashboard 左侧菜单，点击 **"Functions"**
2. 找到 `/api/journeys` 函数
3. 点击进入，查看 **"Logs"** 标签页

#### 方式 B：通过 Deployments 页面

1. 在项目 Dashboard，点击 **"Deployments"**
2. 点击最新的部署（最上面的那个）
3. 在部署详情页面，点击 **"Functions"** 标签
4. 找到 `/api/journeys` 函数
5. 点击查看日志

### 步骤 3：触发 API 调用以生成日志

⚠️ **重要**：日志只有在 API 被调用时才会出现！

你需要先触发 API 调用：

#### 方法 1：在浏览器中访问 API

打开浏览器，访问：
```
https://your-project.vercel.app/api/journeys
```

#### 方法 2：使用 curl 命令

```bash
curl https://your-project.vercel.app/api/journeys
```

#### 方法 3：在前端页面触发

访问你的 Vercel 网站首页或任何会调用 `/api/journeys` 的页面。

### 步骤 4：查看日志输出

触发 API 调用后，立即返回 Vercel Dashboard → Functions → `/api/journeys` → Logs

你应该能看到以下日志：

```
[API /journeys] Fetching journeys from database...
[API /journeys] Database connection info: {
  hasPostgresUrl: true/false,
  hasNeonPostgresUrl: true/false,
  postgresUrlPrefix: "postgresql://...",
  neonPostgresUrlPrefix: "postgresql://..." or "N/A"
}
[API /journeys] Table exists check: true/false
[API /journeys] Available tables: ["table1", "table2", ...]
```

---

## 🚨 如果看不到日志

### 问题 1：日志是空的

**原因**：API 还没有被调用

**解决**：
1. 先访问 `https://your-project.vercel.app/api/journeys`
2. 然后立即查看 Logs

### 问题 2：只看到旧的日志

**原因**：需要刷新页面或等待几秒

**解决**：
1. 刷新 Vercel Dashboard 的 Logs 页面
2. 或者等待 5-10 秒后再次查看

### 问题 3：看到错误日志但没有诊断信息

**原因**：代码可能还没有部署，或者部署失败

**解决**：
1. 检查 Deployments 页面，确认最新部署是成功的（绿色 ✅）
2. 如果部署失败，查看 Build Logs
3. 如果部署成功，等待 1-2 分钟后再试

### 问题 4：找不到 Functions 页面

**原因**：可能是 Vercel 界面版本不同

**解决**：
1. 尝试在项目 Dashboard 顶部搜索 "Functions"
2. 或者直接访问：`https://vercel.com/[your-team]/[your-project]/functions`

---

## 📋 快速检查清单

- [ ] 已访问 Vercel Dashboard
- [ ] 已找到 Functions 页面
- [ ] 已找到 `/api/journeys` 函数
- [ ] 已触发 API 调用（访问了 API URL）
- [ ] 已查看 Logs 标签页
- [ ] 看到了 `[API /journeys]` 开头的日志

---

## 💡 提示

1. **实时日志**：Vercel 的 Function Logs 是实时的，但可能需要几秒钟才会显示
2. **日志保留**：Vercel 会保留最近一段时间的日志（通常是 24-48 小时）
3. **过滤日志**：在 Logs 页面可以使用搜索框过滤特定的日志内容
4. **多个环境**：如果有 Production、Preview、Development 环境，确保查看正确的环境

---

## 🎯 下一步

看到日志后，请告诉我：

1. **Database connection info** 显示的内容：
   - `hasPostgresUrl`: true/false
   - `hasNeonPostgresUrl`: true/false
   - `postgresUrlPrefix`: 显示的前缀是什么

2. **Table exists check** 的结果：
   - `true` 还是 `false`

3. **Available tables**（如果表不存在）：
   - 列出了哪些表名

有了这些信息，我就能准确定位问题！

