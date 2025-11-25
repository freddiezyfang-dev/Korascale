# 设计系统迁移指南

本指南将帮助您将现有的 Korascale 项目代码迁移到新的设计系统。

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install clsx tailwind-merge class-variance-authority
```

### 2. 导入设计系统
```tsx
// 导入整个设计系统
import { Button, Card, Typography, HeroBanner, AccommodationCard } from '@/design-system';

// 或者按需导入
import { Button } from '@/design-system/components/Button';
import { colors } from '@/design-system/tokens';
```

## 📝 迁移步骤

### 步骤 1: 替换现有按钮

**之前:**
```tsx
// 旧的按钮实现
<button className="bg-[#1e3b32] text-white px-4 py-2 rounded hover:bg-[#1a342c]">
  Click me
</button>
```

**之后:**
```tsx
// 使用设计系统按钮
import { Button } from '@/design-system';

<Button variant="primary" size="md">
  Click me
</Button>
```

### 步骤 2: 替换文本样式

**之前:**
```tsx
// 旧的文本样式
<h1 className="text-[96px] font-[Montaga] text-white leading-tight">
  Stay Extraordinary
</h1>
<p className="text-[24px] font-[Montaga] text-black leading-relaxed">
  Description text
</p>
```

**之后:**
```tsx
// 使用设计系统文本
import { Typography } from '@/design-system';

<Typography variant="h1" color="inverse">
  Stay Extraordinary
</Typography>
<Typography variant="bodyLarge">
  Description text
</Typography>
```

### 步骤 3: 替换卡片组件

**之前:**
```tsx
// 旧的卡片实现
<div className="bg-white h-[400px] w-[1200px] rounded-lg overflow-hidden shadow-lg">
  <div className="flex h-full">
    <div className="w-[600px] h-[400px] bg-cover bg-center" style={{backgroundImage: `url('${image}')`}} />
    <div className="flex-1 p-8 flex flex-col justify-center">
      <h3 className="text-[24px] font-[Montaga] text-black mb-4">{title}</h3>
      <p className="text-[16px] font-[Monda] text-gray-700 mb-8">{description}</p>
      <a href="#" className="text-[24px] font-[Monda] text-black underline">View Details</a>
    </div>
  </div>
</div>
```

**之后:**
```tsx
// 使用设计系统卡片
import { AccommodationCard } from '@/design-system';

<AccommodationCard
  variant="horizontal"
  image={image}
  title={title}
  description={description}
  actions={{
    primary: { label: "View Details", href: "#" }
  }}
/>
```

### 步骤 4: 替换 Hero Banner

**之前:**
```tsx
// 旧的 Hero Banner 实现
<section className="flex h-[800px] w-full">
  <div className="w-[728px] h-[800px] bg-cover bg-center relative" style={{backgroundImage: `url('${imgHeroBanner}')`}}>
    <div className="absolute left-[66px] top-[220px]">
      <h1 className="text-[96px] font-[Montaga] text-white leading-tight">Stay Extraordinary</h1>
    </div>
    <div className="absolute left-[252px] top-[527px]">
      <a href="#accommodations" className="text-[24px] font-[Monda] text-white hover:opacity-80">View All Stays</a>
    </div>
  </div>
  <div className="w-[712px] h-[800px] bg-[#f5f1e6] flex flex-col">
    {/* 内容 */}
  </div>
</section>
```

**之后:**
```tsx
// 使用设计系统 Hero Banner
import { HeroBanner } from '@/design-system';

<HeroBanner
  variant="large"
  backgroundImage={imgHeroBanner}
  title="Stay Extraordinary"
  description="Nestled in the heart of western China, Sichuan is a land of breathtaking landscapes..."
  primaryAction={{
    label: "View All Stays",
    href: "#accommodations"
  }}
  breadcrumb={{
    items: [
      { label: "Home", href: "/" },
      { label: "Accommodation" }
    ]
  }}
/>
```

## 🔄 逐步迁移策略

### 阶段 1: 基础组件迁移
1. 替换所有按钮为 `Button` 组件
2. 替换所有文本为 `Typography` 组件
3. 替换基础卡片为 `Card` 组件

### 阶段 2: 复合组件迁移
1. 替换 Hero Banner 为 `HeroBanner` 组件
2. 替换住宿卡片为 `AccommodationCard` 组件
3. 更新页面布局使用设计系统组件

### 阶段 3: 样式优化
1. 移除硬编码的样式类
2. 使用设计令牌替换颜色和间距
3. 优化响应式设计

## 📋 迁移检查清单

### 按钮迁移
- [ ] 替换所有 `<button>` 为 `<Button>`
- [ ] 使用正确的 `variant` 属性
- [ ] 使用正确的 `size` 属性
- [ ] 移除自定义 CSS 类

### 文本迁移
- [ ] 替换所有标题为 `Typography` 组件
- [ ] 替换所有段落为 `Typography` 组件
- [ ] 使用正确的 `variant` 属性
- [ ] 使用正确的 `color` 属性

### 卡片迁移
- [ ] 替换基础卡片为 `Card` 组件
- [ ] 替换住宿卡片为 `AccommodationCard` 组件
- [ ] 使用正确的 `variant` 属性
- [ ] 使用正确的 `size` 属性

### 布局迁移
- [ ] 替换 Hero Banner 为 `HeroBanner` 组件
- [ ] 更新页面结构使用设计系统组件
- [ ] 优化响应式设计

## 🎨 设计令牌使用

### 颜色
```tsx
// 使用设计令牌
import { colors } from '@/design-system/tokens';

<div style={{ backgroundColor: colors.primary[500] }}>
// 而不是
<div style={{ backgroundColor: '#1e3b32' }}>
```

### 间距
```tsx
// 使用设计令牌
import { spacing } from '@/design-system/tokens';

<div style={{ padding: spacing[4] }}>
// 而不是
<div style={{ padding: '16px' }}>
```

### 字体
```tsx
// 使用设计令牌
import { textStyles } from '@/design-system/tokens';

<div style={textStyles.h1}>
// 而不是
<div className="text-6xl font-[Montaga]">
```

## 🐛 常见问题

### Q: 如何处理自定义样式？
A: 使用 `className` 属性添加自定义样式，但优先使用设计系统的变体。

```tsx
<Button 
  variant="primary" 
  className="custom-class"
>
  Custom Button
</Button>
```

### Q: 如何处理响应式设计？
A: 使用 Tailwind 的响应式类名。

```tsx
<Typography 
  variant="h1"
  className="text-4xl md:text-6xl lg:text-8xl"
>
  Responsive Title
</Typography>
```

### Q: 如何扩展组件？
A: 创建新的变体或使用 `className` 属性。

```tsx
// 创建新变体
const customButtonVariants = cva(
  buttonVariants.base,
  {
    variants: {
      variant: {
        ...buttonVariants.variants.variant,
        custom: 'bg-purple-500 text-white hover:bg-purple-600',
      },
    },
  }
);
```

## 📚 更多资源

- [设计系统文档](./README.md)
- [组件 API 文档](./components/README.md)
- [设计令牌文档](./tokens/README.md)
- [Storybook 组件展示](http://localhost:6006)

## 🤝 需要帮助？

如果您在迁移过程中遇到问题，请：

1. 查看设计系统文档
2. 参考 Storybook 中的示例
3. 检查组件 API 文档
4. 联系开发团队

---

**注意**: 迁移是一个渐进的过程，不需要一次性完成所有更改。建议按页面或组件逐步迁移，确保每个步骤都经过充分测试。

































