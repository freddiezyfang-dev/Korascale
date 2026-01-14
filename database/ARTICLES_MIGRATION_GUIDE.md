# 文章数据迁移指南

## 问题说明

之前文章数据只存储在浏览器的 `localStorage` 中，这导致：
- ✅ 本地浏览器可以看到新添加的文章
- ❌ 其他浏览器/Vercel 部署看不到新文章（因为每个浏览器有独立的 localStorage）

## 解决方案

现在文章数据会：
1. **优先从数据库加载**（通过 `/api/articles` API）
2. **自动保存到数据库**（创建/更新/删除时）
3. **localStorage 作为备份**（API 失败时使用）

## 迁移步骤

### 1. 执行数据库迁移

在 Vercel Dashboard 或本地数据库执行以下 SQL：

```sql
-- 文件位置：database/migrations/005_create_articles_table.sql
```

或者直接执行：

```sql
-- 创建文章表
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  author VARCHAR(255) NOT NULL,
  cover_image VARCHAR(500),
  hero_image VARCHAR(500),
  reading_time VARCHAR(50),
  category VARCHAR(100) NOT NULL,
  content TEXT,
  content_blocks JSONB DEFAULT '[]'::jsonb,
  excerpt TEXT,
  page_title VARCHAR(255),
  meta_description TEXT,
  related_journey_ids JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_content_blocks ON articles USING GIN(content_blocks);
CREATE INDEX IF NOT EXISTS idx_articles_related_journey_ids ON articles USING GIN(related_journey_ids);

-- 创建更新时间触发器
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. 迁移现有数据（可选）

如果你在本地浏览器中有文章数据，可以：

1. **在浏览器控制台执行**（导出数据）：
```javascript
const articles = JSON.parse(localStorage.getItem('articles') || '[]');
console.log(JSON.stringify(articles, null, 2));
```

2. **通过 API 导入**（在后台管理页面创建文章，或直接调用 API）

### 3. 验证

1. 访问 `/admin/articles` 页面
2. 创建一篇新文章
3. 检查：
   - ✅ 文章出现在列表中
   - ✅ 在其他浏览器/Vercel 部署中也能看到
   - ✅ 浏览器控制台没有错误

## API 端点

- `GET /api/articles` - 获取所有文章
- `POST /api/articles` - 创建新文章
- `GET /api/articles/[id]` - 获取单个文章
- `PUT /api/articles/[id]` - 更新文章
- `DELETE /api/articles/[id]` - 删除文章
- `GET /api/articles/slug/[slug]` - 根据 slug 获取文章

## Fallback 机制

如果 API 失败（网络错误、数据库未配置等），系统会自动：
1. 尝试从 localStorage 加载数据
2. 继续使用 localStorage 进行 CRUD 操作
3. 在控制台显示警告信息

这样确保即使数据库未配置，应用也能正常工作。
