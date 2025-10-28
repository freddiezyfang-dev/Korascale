# Journey URL 配置指南

## 🎯 URL 策略概述

按照方案1的URL结构，每个journey卡片可以通过两种URL访问：

### 📍 URL 类型

1. **Journey URL**: `/journeys/[slug]`
   - 直接访问特定的旅程页面
   - 例如：`/journeys/chengdu-city-one-day-deep-dive`

2. **Destination URL**: `/destinations/[region]`
   - 按地区访问旅程页面
   - 例如：`/destinations/sichuan`

## 🔧 后台配置步骤

### 1. 创建新旅程时

在 **Page Management** 部分：

1. **Journey Slug**：
   - 输入：`chengdu-city-one-day-deep-dive`
   - 生成URL：`/journeys/chengdu-city-one-day-deep-dive`

2. **Region for Destinations**：
   - 选择：`Sichuan`
   - 生成URL：`/destinations/sichuan`

### 2. 编辑现有旅程时

在 **Page Management** 部分：

1. 修改 **Journey Slug** 来更改journey URL
2. 修改 **Region** 来更改destination URL
3. 实时预览会显示两个URL

## 📋 配置示例

### 示例1：成都深度游
```
Journey Slug: chengdu-city-one-day-deep-dive
Region: Sichuan

生成的URL：
- /journeys/chengdu-city-one-day-deep-dive
- /destinations/sichuan
```

### 示例2：乐山大佛
```
Journey Slug: leshan-giant-buddha
Region: Sichuan

生成的URL：
- /journeys/leshan-giant-buddha
- /destinations/sichuan
```

### 示例3：张掖丹霞
```
Journey Slug: zhangye-danxia-geopark
Region: Gansu

生成的URL：
- /journeys/zhangye-danxia-geopark
- /destinations/gansu
```

## 🌐 支持的地区

- **Sichuan** → `/destinations/sichuan`
- **Gansu** → `/destinations/gansu`
- **Shaanxi** → `/destinations/shaanxi`
- **Xinjiang** → `/destinations/xinjiang`

## ✨ 功能特性

### 1. 实时URL预览
- 配置slug和region后立即显示URL预览
- 绿色✓标记表示URL已配置

### 2. 自动过滤
- `/destinations/[region]` 页面会自动显示该地区的所有旅程
- 基于journey的region字段进行过滤

### 3. 面包屑导航
- 自动生成面包屑：Home → Destinations → Region Name

### 4. SEO友好
- 每个URL都有独立的页面标题和meta描述
- 支持搜索引擎优化

## 🚀 使用建议

1. **Slug命名规范**：
   - 使用小写字母和连字符
   - 例如：`chengdu-city-one-day-deep-dive`

2. **地区选择**：
   - 确保选择正确的地区
   - 地区会影响destination页面的过滤

3. **URL一致性**：
   - 同一个journey的两个URL会显示相同内容
   - 用户可以通过任一URL访问

## 🔍 验证方法

1. 创建journey后，访问两个URL确认都能正常显示
2. 检查destination页面是否正确过滤了该地区的journey
3. 确认面包屑导航正确显示

## 📱 响应式支持

- 所有URL在移动端和桌面端都能正常工作
- 自动适配不同屏幕尺寸
- 触摸友好的交互设计
