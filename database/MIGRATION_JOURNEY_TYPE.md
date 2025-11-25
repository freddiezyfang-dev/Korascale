# 🗄️ Journey Type 字段迁移指南

## 📋 概述

本次迁移为 `journeys` 表添加 `journey_type` 字段，用于版面分类：
- **Explore Together**（一起探索）
- **Deep Discovery**（深度发现）
- **Signature Journeys**（标志性旅程）

---

## ✅ 已完成的更改

### 1. 类型定义更新
- ✅ 文件：`src/types/index.ts`
- ✅ 添加了 `JourneyType` 类型
- ✅ 在 `Journey` 接口中添加了 `journeyType?: JourneyType` 字段

### 2. 数据库迁移脚本
- ✅ 创建了 `database/migrations/002_add_journey_type.sql`
- ✅ 更新了 `database/migrations/001_create_tables.sql`（新表创建时包含该字段）
- ✅ 更新了 `database/QUICK_SETUP.sql`（快速设置脚本）

---

## 🚀 执行迁移

### 方法一：使用迁移脚本（推荐，适用于已有数据库）

如果你已经有现有的数据库，执行迁移脚本：

```bash
# 连接到你的数据库（Vercel Postgres 或其他 PostgreSQL）
# 然后执行迁移脚本
psql $POSTGRES_URL -f database/migrations/002_add_journey_type.sql
```

**或者通过 Vercel Dashboard**：
1. 登录 Vercel Dashboard
2. 进入你的项目 → Storage → Postgres
3. 打开 SQL Editor
4. 复制 `database/migrations/002_add_journey_type.sql` 的内容
5. 粘贴并执行

### 方法二：新数据库（自动包含）

如果你是新创建的数据库，直接执行：
```bash
psql $POSTGRES_URL -f database/migrations/001_create_tables.sql
```

新表会自动包含 `journey_type` 字段。

---

## 📝 迁移脚本功能

迁移脚本 `002_add_journey_type.sql` 会：

1. ✅ 添加 `journey_type VARCHAR(50)` 字段
2. ✅ 创建索引 `idx_journeys_journey_type` 提高查询性能
3. ✅ 更新全文搜索函数，包含 `journey_type` 字段
4. ✅ 可选：根据 `duration` 自动为现有数据分类
   - `1 Day` → `Explore Together`
   - `2-4 Days` → `Deep Discovery`
   - 其他建议手动设置

---

## 🔍 验证迁移

执行迁移后，可以验证：

```sql
-- 检查字段是否存在
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'journeys' 
  AND column_name = 'journey_type';

-- 检查索引是否存在
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'journeys' 
  AND indexname = 'idx_journeys_journey_type';

-- 查看现有数据的 journey_type 分布
SELECT journey_type, COUNT(*) 
FROM journeys 
GROUP BY journey_type;
```

---

## ⚠️ 注意事项

1. **现有数据**：迁移脚本会尝试根据 `duration` 自动分类，但建议在后台手动检查和调整
2. **可选字段**：`journey_type` 是可选的（允许 NULL），所以不会影响现有数据
3. **向后兼容**：如果某个 journey 没有设置 `journey_type`，系统仍可正常工作

---

## 🎯 下一步

迁移完成后，继续执行：
- **第二阶段**：更新后端 API
- **第三阶段**：更新前端显示页面
- **第四阶段**：更新管理后台

---

## 📞 需要帮助？

如果遇到问题：
1. 检查数据库连接是否正常
2. 确认 PostgreSQL 版本支持（需要 9.5+）
3. 查看数据库日志中的错误信息

