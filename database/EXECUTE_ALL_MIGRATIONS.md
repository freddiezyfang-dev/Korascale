# 🚀 执行所有数据库迁移指南

## 📋 需要执行的迁移脚本

按顺序执行以下迁移脚本：

1. **004_update_classification_names.sql** - 更新现有数据的分类名称（如果有旧数据）
2. **003_create_tailor_made_china.sql** - 创建 Tailor-Made China 模块表

---

## ✅ 步骤一：更新分类名称（可选）

如果数据库中已有使用旧分类名称的数据，执行此脚本更新。

### 执行方法：

1. **在 Vercel Dashboard 中**
   - 进入 Storage → Postgres → SQL Editor
   - 打开文件：`database/migrations/004_update_classification_names.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 "Run" 执行

2. **验证结果**
   
   执行后，脚本会自动显示更新结果。你也可以手动查询：
   
   ```sql
   -- 查看分类分布
   SELECT journey_type, COUNT(*) 
   FROM journeys 
   WHERE journey_type IS NOT NULL
   GROUP BY journey_type;
   ```

### 预期结果：

- `Explore Together`: X 条记录
- `Deep Discovery`: X 条记录
- `Signature Journeys`: X 条记录
- 没有旧分类名称（Day Tour, Short Trips, Premium）

---

## ✅ 步骤二：创建 Tailor-Made China 表

### 执行方法：

1. **在 Vercel Dashboard 中**
   - 进入 Storage → Postgres → SQL Editor
   - 打开文件：`database/migrations/003_create_tailor_made_china.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 "Run" 执行

2. **验证结果**

   执行以下查询验证表是否创建成功：
   
   ```sql
   -- 检查表是否存在
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name IN ('tailor_made_requests', 'tailor_made_configs');
   
   -- 查看 tailor_made_requests 表结构
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns 
   WHERE table_name = 'tailor_made_requests'
   ORDER BY ordinal_position;
   
   -- 查看 tailor_made_configs 表结构
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns 
   WHERE table_name = 'tailor_made_configs'
   ORDER BY ordinal_position;
   ```

### 预期结果：

- 返回 2 行：`tailor_made_requests` 和 `tailor_made_configs`
- `tailor_made_requests` 表包含所有必要字段
- `tailor_made_configs` 表包含配置字段
- 默认配置数据已插入

---

## 🔍 完整验证查询

执行所有迁移后，运行以下完整验证：

```sql
-- 1. 验证分类名称更新
SELECT 
  '分类名称验证' as check_type,
  journey_type,
  COUNT(*) as count
FROM journeys 
WHERE journey_type IS NOT NULL
GROUP BY journey_type
ORDER BY journey_type;

-- 2. 验证 Tailor-Made China 表
SELECT 
  'Tailor-Made 表验证' as check_type,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('tailor_made_requests', 'tailor_made_configs');

-- 3. 验证索引
SELECT 
  '索引验证' as check_type,
  indexname,
  tablename
FROM pg_indexes 
WHERE tablename IN ('tailor_made_requests', 'tailor_made_configs')
ORDER BY tablename, indexname;

-- 4. 验证默认配置
SELECT 
  '默认配置验证' as check_type,
  config_type,
  config_key,
  is_active
FROM tailor_made_configs
ORDER BY config_type, config_key;
```

---

## ⚠️ 注意事项

1. **执行顺序**：先执行分类名称更新，再执行 Tailor-Made China 创建
2. **数据备份**：执行前建议先备份数据（Vercel 会自动备份）
3. **错误处理**：如果遇到错误，查看错误信息并检查：
   - 表是否已存在
   - 字段是否已存在
   - 权限是否足够

---

## 🎯 快速执行清单

- [ ] 执行 `004_update_classification_names.sql`（如果有旧数据）
- [ ] 验证分类名称更新结果
- [ ] 执行 `003_create_tailor_made_china.sql`
- [ ] 验证表创建成功
- [ ] 验证索引创建成功
- [ ] 验证默认配置已插入

---

## 📞 需要帮助？

如果遇到问题：
1. 检查错误信息
2. 查看 Vercel Dashboard 的数据库日志
3. 确认环境变量配置正确

执行完成后告诉我，我们继续下一步！


