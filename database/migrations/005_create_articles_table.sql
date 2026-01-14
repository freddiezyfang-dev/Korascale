-- 创建文章表 (Articles)
-- 用于存储灵感文章数据

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基础字段
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  author VARCHAR(255) NOT NULL,
  
  -- 图片
  cover_image VARCHAR(500),
  hero_image VARCHAR(500),
  
  -- 内容
  reading_time VARCHAR(50),
  category VARCHAR(100) NOT NULL, -- Food Journey, Great Outdoors, etc.
  
  -- 内容存储（支持两种方式）
  content TEXT, -- Legacy HTML/Markdown 字符串
  content_blocks JSONB DEFAULT '[]'::jsonb, -- 新的内容块结构
  
  -- SEO
  excerpt TEXT,
  page_title VARCHAR(255),
  meta_description TEXT,
  
  -- 关联
  related_journey_ids JSONB DEFAULT '[]'::jsonb, -- 关联的 Journey IDs 数组
  tags JSONB DEFAULT '[]'::jsonb, -- 标签数组
  
  -- 状态
  status VARCHAR(20) DEFAULT 'draft', -- draft, active, inactive
  
  -- 时间戳
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
