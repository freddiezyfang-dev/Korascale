-- 创建所有必要的表结构

-- 启用生成 UUID 所需扩展
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. 旅行卡片表 (Journeys)
CREATE TABLE IF NOT EXISTS journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基础字段（结构化数据）
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10, 2),
  original_price DECIMAL(10, 2),
  
  category VARCHAR(50),
  region VARCHAR(100),
  city VARCHAR(100),
  location VARCHAR(255),
  
  duration VARCHAR(50),
  difficulty VARCHAR(20),
  max_participants INTEGER DEFAULT 12,
  min_participants INTEGER DEFAULT 2,
  
  image VARCHAR(500),
  
  -- 状态和元数据
  status VARCHAR(20) DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  rating DECIMAL(3, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- JSONB字段（半结构化数据）
  data JSONB DEFAULT '{}'::jsonb,
  
  -- 全文搜索向量
  search_vector TSVECTOR,
  
  -- 地理位置（使用经纬度以兼容 Vercel Postgres/Neon，无需 PostGIS）
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_journeys_slug ON journeys(slug);
CREATE INDEX IF NOT EXISTS idx_journeys_status ON journeys(status);
CREATE INDEX IF NOT EXISTS idx_journeys_category ON journeys(category);
CREATE INDEX IF NOT EXISTS idx_journeys_region ON journeys(region);
CREATE INDEX IF NOT EXISTS idx_journeys_featured ON journeys(featured);
CREATE INDEX IF NOT EXISTS idx_journeys_data ON journeys USING GIN(data);
CREATE INDEX IF NOT EXISTS idx_journeys_search ON journeys USING GIN(search_vector);

-- 创建全文搜索触发器函数
CREATE OR REPLACE FUNCTION journeys_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    to_tsvector('english', 
      COALESCE(NEW.title, '') || ' ' || 
      COALESCE(NEW.description, '') || ' ' || 
      COALESCE(NEW.short_description, '') || ' ' ||
      COALESCE(NEW.category, '') || ' ' ||
      COALESCE(NEW.region, '') || ' ' ||
      COALESCE(NEW.city, '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS update_journeys_search_vector ON journeys;
CREATE TRIGGER update_journeys_search_vector
  BEFORE INSERT OR UPDATE ON journeys
  FOR EACH ROW
  EXECUTE FUNCTION journeys_search_vector_update();

-- 3. 体验表 (Experiences)
CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基础字段
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10, 2),
  original_price DECIMAL(10, 2),
  
  type VARCHAR(50),
  difficulty VARCHAR(20),
  duration VARCHAR(50),
  
  location VARCHAR(255),
  city VARCHAR(100),
  region VARCHAR(100),
  
  image VARCHAR(500),
  
  -- 状态
  status VARCHAR(20) DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  rating DECIMAL(3, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- JSONB字段
  data JSONB DEFAULT '{}'::jsonb,
  
  -- 全文搜索
  search_vector TSVECTOR,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_experiences_slug ON experiences(slug);
CREATE INDEX IF NOT EXISTS idx_experiences_status ON experiences(status);
CREATE INDEX IF NOT EXISTS idx_experiences_type ON experiences(type);
CREATE INDEX IF NOT EXISTS idx_experiences_data ON experiences USING GIN(data);
CREATE INDEX IF NOT EXISTS idx_experiences_search ON experiences USING GIN(search_vector);

-- 4. 酒店/住宿表 (Hotels/Accommodations)
CREATE TABLE IF NOT EXISTS accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基础字段
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10, 2),
  original_price DECIMAL(10, 2),
  
  location VARCHAR(255),
  city VARCHAR(100),
  region VARCHAR(100),
  
  image VARCHAR(500),
  
  -- 状态
  status VARCHAR(20) DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  rating DECIMAL(3, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- JSONB字段
  data JSONB DEFAULT '{}'::jsonb,
  
  -- 全文搜索
  search_vector TSVECTOR,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_accommodations_slug ON accommodations(slug);
CREATE INDEX IF NOT EXISTS idx_accommodations_status ON accommodations(status);
CREATE INDEX IF NOT EXISTS idx_accommodations_data ON accommodations USING GIN(data);

-- 5. 订单表
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  
  -- 订单项（JSONB存储）
  order_items JSONB DEFAULT '[]'::jsonb,
  
  -- 订单详情
  stay_details JSONB DEFAULT '{}'::jsonb,
  guest_info JSONB DEFAULT '{}'::jsonb,
  
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  
  -- 时间戳
  payment_confirmed_at TIMESTAMP,
  staff_confirmed_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 6. 用户登录记录表
CREATE TABLE IF NOT EXISTS user_login_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  login_time TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_login_records_user_id ON user_login_records(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_records_login_time ON user_login_records(login_time);

-- 7. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表添加更新时间触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journeys_updated_at ON journeys;
CREATE TRIGGER update_journeys_updated_at
  BEFORE UPDATE ON journeys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_experiences_updated_at ON experiences;
CREATE TRIGGER update_experiences_updated_at
  BEFORE UPDATE ON experiences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_accommodations_updated_at ON accommodations;
CREATE TRIGGER update_accommodations_updated_at
  BEFORE UPDATE ON accommodations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '数据库表创建完成！';
END $$;



