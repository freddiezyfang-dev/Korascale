# Korascale 设计系统使用指南

## 🎯 概述

这个设计系统为 Korascale 旅游网站项目提供了统一的设计语言，包括颜色、字体、间距和可复用组件。

## 🚀 快速开始

### 1. 导入组件

```tsx
import { Container, Section, Heading, Text, Button, Card } from '@/components/common';
```

### 2. 使用设计令牌

```tsx
// 使用 Tailwind 类名（推荐）
<div className="bg-primary-500 text-white font-heading text-2xl">

// 使用 CSS 变量
<div style={{ 
  backgroundColor: 'var(--color-primary-500)', 
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-heading)'
}}>
```

## 🎨 颜色系统

### 主色调
- `bg-primary-500` - 主要品牌色 (#1e3b32)
- `bg-primary-400` - 浅绿色 (#56b590)
- `bg-primary-600` - 深绿色 (#1a342c)

### 背景色
- `bg-white` - 白色背景
- `bg-secondary` - 米色背景 (#f5f1e6)
- `bg-tertiary` - 深绿背景 (#1e3b32)
- `bg-accent` - 浅黄背景 (#fff6da)

### 文本色
- `text-black` - 主要文本
- `text-neutral-600` - 次要文本
- `text-white` - 白色文本
- `text-primary-500` - 品牌色文本

## 🔤 字体系统

### 字体族
- `font-heading` - 标题字体 (Montaga)
- `font-subheading` - 副标题字体 (Inknut Antiqua)
- `font-body` - 正文字体 (Monda)

### 字体大小
- `text-xs` - 12px
- `text-sm` - 14px
- `text-base` - 16px
- `text-lg` - 18px
- `text-xl` - 20px
- `text-2xl` - 24px
- `text-3xl` - 30px
- `text-4xl` - 36px
- `text-5xl` - 48px
- `text-6xl` - 60px

## 📏 间距系统

### 基础间距（基于4px网格）
- `p-1` - 4px
- `p-2` - 8px
- `p-3` - 12px
- `p-4` - 16px
- `p-6` - 24px
- `p-8` - 32px
- `p-12` - 48px
- `p-16` - 64px

## 🧩 组件使用

### Container 容器

```tsx
<Container size="lg" padding="md">
  <p>内容</p>
</Container>
```

**属性：**
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `padding`: 'none' | 'sm' | 'md' | 'lg'

### Section 区域

```tsx
<Section background="secondary" padding="lg" id="about">
  <p>内容</p>
</Section>
```

**属性：**
- `background`: 'primary' | 'secondary' | 'tertiary' | 'accent'
- `padding`: 'none' | 'sm' | 'md' | 'lg' | 'xl'

### Heading 标题

```tsx
<Heading level={2} color="primary" align="center">
  标题内容
</Heading>
```

**属性：**
- `level`: 1 | 2 | 3 | 4 | 5 | 6
- `color`: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'accent'
- `align`: 'left' | 'center' | 'right'

### Text 文本

```tsx
<Text size="lg" weight="medium" color="secondary">
  文本内容
</Text>
```

**属性：**
- `size`: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
- `weight`: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
- `color`: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'accent'
- `align`: 'left' | 'center' | 'right'
- `as`: 'p' | 'span' | 'div'

### Button 按钮

```tsx
<Button variant="primary" size="md" href="/destinations">
  点击按钮
</Button>
```

**属性：**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link'
- `size`: 'sm' | 'md' | 'lg'
- `href`: 可选，如果提供则渲染为链接

### Card 卡片

```tsx
<Card padding="md" shadow="medium" background="primary">
  <p>卡片内容</p>
</Card>
```

**属性：**
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `shadow`: 'none' | 'light' | 'medium' | 'dark'
- `background`: 'primary' | 'secondary' | 'accent'
- `rounded`: 'none' | 'sm' | 'md' | 'lg' | 'xl'

## 📱 响应式设计

所有组件都支持响应式设计，使用 Tailwind 的响应式前缀：

```tsx
<Heading 
  level={1} 
  className="text-4xl lg:text-6xl md:text-5xl"
>
  响应式标题
</Heading>
```

## 🎯 最佳实践

### 1. 使用语义化组件
```tsx
// ✅ 推荐
<Heading level={2}>页面标题</Heading>
<Text>段落内容</Text>

// ❌ 不推荐
<h2 className="text-2xl font-heading">页面标题</h2>
<p className="text-base font-body">段落内容</p>
```

### 2. 保持一致性
```tsx
// ✅ 推荐 - 使用设计令牌
<div className="bg-secondary text-primary-500 font-heading">

// ❌ 不推荐 - 硬编码值
<div style={{ backgroundColor: '#f5f1e6', color: '#1e3b32' }}>
```

### 3. 响应式设计
```tsx
// ✅ 推荐 - 移动优先
<Text className="text-sm md:text-base lg:text-lg">

// ❌ 不推荐 - 桌面优先
<Text className="text-lg md:text-sm">
```

## 🔧 自定义样式

如果需要自定义样式，可以：

1. 使用 `className` 属性添加额外的 Tailwind 类
2. 使用 CSS 变量进行深度自定义
3. 扩展设计令牌（在 `src/design-system/tokens/` 中）

## 📚 更多资源

- [设计令牌文档](./tokens/)
- [组件 API 文档](./components/)
- [迁移指南](./MIGRATION_GUIDE.md)






























