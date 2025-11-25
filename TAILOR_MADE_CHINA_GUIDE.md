# 🎨 Tailor-Made China 全流程定制业务指南

## 📋 概述

Tailor-Made China 是一个全流程定制服务模块，允许客户提交个性化旅行需求，由专业顾问提供一对一的定制服务。

---

## 🗄️ 数据库结构

### 已创建的表

1. **tailor_made_requests** - 定制服务请求表
   - 存储客户的定制需求
   - 跟踪服务状态和工作流程
   - 记录报价和沟通历史

2. **tailor_made_configs** - 配置表
   - 存储工作流程模板
   - 定价配置
   - 状态转换规则

---

## 🚀 执行数据库迁移

### 步骤：

1. **在 Vercel Dashboard 执行迁移**
   - 进入 Storage → Postgres → SQL Editor
   - 打开文件：`database/migrations/003_create_tailor_made_china.sql`
   - 复制全部内容并执行

2. **验证迁移**
   ```sql
   -- 检查表是否存在
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name IN ('tailor_made_requests', 'tailor_made_configs');
   
   -- 查看表结构
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'tailor_made_requests'
   ORDER BY ordinal_position;
   ```

---

## 📝 数据流程

### 1. 客户提交定制需求

```
客户填写表单
  ↓
创建 tailor_made_request
  ↓
状态: pending
  ↓
通知顾问
```

### 2. 顾问处理流程

```
顾问查看需求 (pending)
  ↓
开始咨询 (in_progress)
  ↓
准备报价 (quoted)
  ↓
客户确认 (confirmed)
  ↓
执行服务 (completed)
```

---

## 🎯 功能模块

### 前端功能

1. **定制需求表单**
   - 客户信息收集
   - 旅行偏好选择
   - 特殊需求输入
   - 预算范围选择

2. **需求提交页面**
   - 表单验证
   - 提交确认
   - 提交成功提示

3. **需求跟踪页面**（可选）
   - 查看提交状态
   - 查看沟通记录
   - 查看报价详情

### 后台管理功能

1. **需求管理**
   - 查看所有定制请求
   - 筛选和搜索
   - 状态管理
   - 分配顾问

2. **报价管理**
   - 创建报价
   - 发送报价
   - 报价跟踪

3. **沟通管理**
   - 记录沟通历史
   - 发送消息
   - 通知客户

---

## 🔧 实现步骤

### 阶段一：数据库和类型定义 ✅

- [x] 创建数据库表结构
- [x] 定义 TypeScript 类型
- [x] 创建迁移脚本

### 阶段二：API 开发

- [ ] 创建定制请求 API (`/api/tailor-made`)
  - POST: 创建新请求
  - GET: 获取请求列表
  - GET /[id]: 获取单个请求
  - PUT /[id]: 更新请求
  - PUT /[id]/status: 更新状态
  - PUT /[id]/quote: 创建/更新报价

### 阶段三：前端表单

- [ ] 创建定制需求表单页面 (`/tailor-made-china`)
- [ ] 表单验证
- [ ] 提交处理
- [ ] 成功页面

### 阶段四：后台管理

- [ ] 定制请求列表页面 (`/admin/tailor-made`)
- [ ] 请求详情页面
- [ ] 状态管理
- [ ] 报价管理
- [ ] 沟通记录

---

## 📊 数据字段说明

### tailor_made_requests 表主要字段

| 字段 | 类型 | 说明 |
|------|------|------|
| customer_name | VARCHAR | 客户姓名 |
| customer_email | VARCHAR | 客户邮箱 |
| travel_dates | JSONB | 旅行日期 {start_date, end_date, flexible} |
| number_of_travelers | INTEGER | 旅行人数 |
| preferred_destinations | TEXT[] | 偏好目的地 |
| interests | TEXT[] | 兴趣标签 |
| budget_range | VARCHAR | 预算范围 |
| status | VARCHAR | 状态：pending, in_progress, quoted, confirmed, completed, cancelled |
| quote_amount | DECIMAL | 报价金额 |
| communication_log | JSONB | 沟通记录数组 |

---

## 🎨 UI/UX 建议

### 定制表单页面

1. **分步骤表单**
   - 步骤1：基本信息（姓名、邮箱、电话）
   - 步骤2：旅行信息（日期、人数、目的地）
   - 步骤3：偏好选择（兴趣、住宿、交通）
   - 步骤4：特殊需求（饮食、无障碍等）
   - 步骤5：确认提交

2. **交互设计**
   - 进度指示器
   - 表单验证提示
   - 保存草稿功能
   - 实时预览

---

## 🔄 下一步

1. **执行数据库迁移**
   - 运行 `003_create_tailor_made_china.sql`

2. **开发 API 路由**
   - 创建 `/api/tailor-made` 相关路由

3. **创建前端页面**
   - 定制需求表单页面
   - 后台管理页面

---

## 📞 需要帮助？

如有问题，请查看：
- 数据库迁移指南：`database/EXECUTE_MIGRATION.md`
- API 开发指南：参考现有的 `/api/journeys` 路由


