# 检查文章是否保存到数据库

## 方法 1：通过 Vercel Dashboard（最简单）

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目
3. 点击 **Storage** → **Postgres**
4. 点击 **"Query"** 或 **"SQL Editor"**
5. 执行以下 SQL：

```sql
-- 查看所有文章
SELECT id, title, slug, category, status, created_at 
FROM articles 
ORDER BY created_at DESC;

-- 查看文章总数
SELECT COUNT(*) as total_articles FROM articles;

-- 查看特定状态的文章
SELECT id, title, slug, status 
FROM articles 
WHERE status = 'active';
```

## 方法 2：通过 API 端点测试

### 在浏览器中测试

打开浏览器控制台（F12），执行：

```javascript
// 获取所有文章
fetch('/api/articles')
  .then(res => res.json())
  .then(data => {
    console.log('所有文章:', data.articles);
    console.log('文章数量:', data.articles?.length || 0);
  })
  .catch(err => console.error('错误:', err));
```

### 使用 curl（终端）

```bash
# 获取所有文章
curl https://你的域名.vercel.app/api/articles

# 或者本地测试
curl http://localhost:3000/api/articles
```

## 方法 3：通过前端页面检查

1. 访问 `/admin/articles` 页面
2. 打开浏览器控制台（F12）
3. 查看 Network 标签页
4. 刷新页面，查找 `/api/articles` 请求
5. 查看响应内容，应该包含你创建的文章

## 方法 4：创建测试页面（推荐）

在浏览器控制台执行以下代码，创建一个快速检查工具：

```javascript
// 检查文章数据库状态
async function checkArticles() {
  try {
    const response = await fetch('/api/articles');
    const data = await response.json();
    
    if (data.articles) {
      console.log('✅ 数据库连接正常');
      console.log(`📊 文章总数: ${data.articles.length}`);
      console.log('📝 文章列表:', data.articles.map(a => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        category: a.category,
        status: a.status,
        createdAt: a.createdAt
      })));
      
      // 按状态分组
      const byStatus = data.articles.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {});
      console.log('📈 按状态统计:', byStatus);
      
      return data.articles;
    } else {
      console.error('❌ API 返回格式错误:', data);
      return null;
    }
  } catch (error) {
    console.error('❌ 检查失败:', error);
    return null;
  }
}

// 执行检查
checkArticles();
```

## 方法 5：检查 localStorage vs 数据库

```javascript
// 比较 localStorage 和数据库中的文章
async function compareArticles() {
  // 从数据库获取
  const dbResponse = await fetch('/api/articles');
  const dbData = await dbResponse.json();
  const dbArticles = dbData.articles || [];
  
  // 从 localStorage 获取
  const localRaw = localStorage.getItem('articles');
  const localArticles = localRaw ? JSON.parse(localRaw) : [];
  
  console.log('📊 数据库文章数:', dbArticles.length);
  console.log('💾 localStorage 文章数:', localArticles.length);
  
  if (dbArticles.length > 0) {
    console.log('✅ 文章已保存到数据库');
    console.log('数据库文章:', dbArticles.map(a => a.title));
  } else {
    console.warn('⚠️ 数据库中暂无文章');
  }
  
  if (localArticles.length > 0) {
    console.log('💾 localStorage 文章:', localArticles.map(a => a.title));
  }
  
  // 检查是否有差异
  const dbSlugs = new Set(dbArticles.map(a => a.slug));
  const localSlugs = new Set(localArticles.map(a => a.slug));
  
  const onlyInDB = dbArticles.filter(a => !localSlugs.has(a.slug));
  const onlyInLocal = localArticles.filter(a => !dbSlugs.has(a.slug));
  
  if (onlyInDB.length > 0) {
    console.log('📌 仅在数据库中的文章:', onlyInDB.map(a => a.title));
  }
  if (onlyInLocal.length > 0) {
    console.log('💾 仅在 localStorage 中的文章:', onlyInLocal.map(a => a.title));
  }
}

compareArticles();
```

## 常见问题排查

### 问题 1：API 返回 500 错误

**可能原因**：数据库表未创建

**解决**：执行 migration SQL（`005_create_articles_table.sql`）

### 问题 2：API 返回空数组 `[]`

**可能原因**：
- 文章确实未保存
- 文章状态不是 'active'（前端可能只显示 active 状态）

**检查**：
```sql
-- 查看所有状态的文章
SELECT status, COUNT(*) FROM articles GROUP BY status;
```

### 问题 3：localStorage 有数据但数据库没有

**可能原因**：
- API 调用失败，使用了 fallback
- 文章创建时 API 出错

**解决**：
1. 检查浏览器控制台的错误信息
2. 确认数据库表已创建
3. 重新创建文章

## 快速检查清单

- [ ] 数据库表 `articles` 已创建（通过 Vercel Dashboard 查询）
- [ ] API `/api/articles` 返回 200 状态码
- [ ] API 返回的文章数组包含你创建的文章
- [ ] 前端页面 `/admin/articles` 显示文章列表
- [ ] 其他浏览器也能看到相同的文章
