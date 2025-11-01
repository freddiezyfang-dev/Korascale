# Korascale 设计系统

这是一个为 Korascale 旅游网站项目构建的标准化设计系统，提供一致的设计语言和可复用的组件。

## 🎨 设计原则

### 品牌特色
- **优雅传统**: 使用衬线字体体现中国文化的优雅传统
- **现代简洁**: 采用现代无衬线字体和简洁布局
- **自然色彩**: 以绿色为主色调，体现自然和旅行的主题
- **温暖质感**: 使用米色和暖色调营造温馨感

### 设计理念
- **一致性**: 所有组件遵循统一的设计规范
- **可访问性**: 确保良好的对比度和可读性
- **响应式**: 适配各种设备和屏幕尺寸
- **可扩展性**: 易于添加新组件和修改现有组件

## 📦 设计令牌

### 颜色系统
```typescript
import { colors, colorUsage } from '@/design-system/tokens';

// 主色调
colors.primary[500] // #1e3b32 - 主要品牌色
colors.background.secondary // #f5f1e6 - 米色背景
colors.background.accent // #fff6da - 浅黄背景

// 语义化颜色
colorUsage.brand.primary // 品牌主色
colorUsage.surface.cream // 奶油色表面
colorUsage.content.primary // 主要文本色
```

### 字体系统
```typescript
import { typography, textStyles } from '@/design-system/tokens';

// 字体族
typography.fontFamily.heading // ['Montaga', 'serif'] - 标题字体
typography.fontFamily.subheading // ['Inknut_Antiqua', 'serif'] - 副标题字体
typography.fontFamily.body // ['Monda', 'sans-serif'] - 正文字体

// 预设文本样式
textStyles.h1 // H1 标题样式
textStyles.body // 正文样式
textStyles.button // 按钮文本样式
```

### 间距系统
```typescript
import { spacing, spacingSemantic } from '@/design-system/tokens';

// 基础间距 (基于4px网格)
spacing[4] // 16px
spacing[8] // 32px
spacing[16] // 64px

// 语义化间距
spacingSemantic.padding.md // 16px 内边距
spacingSemantic.margin.lg // 24px 外边距
spacingSemantic.component.cardPadding.md // 24px 卡片内边距
```

## 🧩 组件库

### 基础组件

#### Button 按钮
```tsx
import { Button } from '@/design-system';

// 基础用法
<Button variant="primary" size="md">
  点击我
</Button>

// 带图标
<Button 
  variant="secondary" 
  leftIcon={<Icon />}
  rightIcon={<ArrowIcon />}
>
  带图标按钮
</Button>

// 加载状态
<Button loading={true}>
  加载中...
</Button>
```

**变体:**
- `primary`: 主要按钮 (绿色背景)
- `secondary`: 次要按钮 (米色背景)
- `outline`: 轮廓按钮
- `ghost`: 幽灵按钮
- `link`: 链接按钮
- `destructive`: 危险按钮

**尺寸:**
- `sm`: 小尺寸 (32px)
- `md`: 中等尺寸 (40px)
- `lg`: 大尺寸 (48px)
- `xl`: 超大尺寸 (56px)

#### Card 卡片
```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/design-system';

<Card variant="elevated" padding="md">
  <CardHeader>
    <CardTitle>卡片标题</CardTitle>
  </CardHeader>
  <CardContent>
    卡片内容
  </CardContent>
  <CardFooter>
    卡片底部
  </CardFooter>
</Card>
```

#### Typography 文本
```tsx
import { Typography } from '@/design-system';

// 标题
<Typography variant="h1">主标题</Typography>
<Typography variant="h2">副标题</Typography>

// 正文
<Typography variant="body">正文内容</Typography>
<Typography variant="bodyLarge">大号正文</Typography>

// 带颜色和对齐
<Typography 
  variant="h3" 
  color="accent" 
  align="center"
>
  居中的强调色标题
</Typography>
```

### 复合组件

#### HeroBanner 英雄横幅
```tsx
import { HeroBanner } from '@/design-system';

<HeroBanner
  variant="large"
  backgroundImage="/images/hero-bg.jpg"
  title="Stay Extraordinary"
  subtitle="Discover Amazing Places"
  description="Explore the world with our curated travel experiences"
  primaryAction={{
    label: "View All Stays",
    href: "/accommodations"
  }}
  secondaryAction={{
    label: "Learn More",
    href: "/about"
  }}
  breadcrumb={{
    items: [
      { label: "Home", href: "/" },
      { label: "Accommodation" }
    ]
  }}
/>
```

#### AccommodationCard 住宿卡片
```tsx
import { AccommodationCard } from '@/design-system';

<AccommodationCard
  variant="horizontal"
  image="/images/hotel.jpg"
  title="Chengdu City: One-Day Food & Culture Deep Dive"
  description="Designed for food and culture enthusiasts..."
  price={{ amount: "$299", period: "per night" }}
  tags={["Luxury", "City Center"]}
  rating={4.8}
  location="Chengdu, Sichuan"
  actions={{
    primary: {
      label: "Book Now",
      href: "/book"
    },
    secondary: {
      label: "View Details",
      href: "/details"
    }
  }}
/>
```

## 🛠️ 使用方法

### 安装依赖
```bash
npm install clsx tailwind-merge class-variance-authority
```

### 导入组件
```tsx
// 导入整个设计系统
import { Button, Card, Typography } from '@/design-system';

// 或者按需导入
import { Button } from '@/design-system/components/Button';
import { colors } from '@/design-system/tokens';
```

### 自定义样式
```tsx
import { cn } from '@/design-system/utils/cn';

<Button 
  className={cn(
    "custom-class",
    "hover:custom-hover"
  )}
>
  自定义按钮
</Button>
```

## 📱 响应式设计

所有组件都内置了响应式设计：

```tsx
// 响应式文本
<Typography 
  variant="h1"
  className="text-4xl md:text-6xl lg:text-8xl"
>
  响应式标题
</Typography>

// 响应式按钮
<Button 
  size="md"
  className="w-full sm:w-auto"
>
  响应式按钮
</Button>
```

## 🎯 最佳实践

### 1. 使用设计令牌
```tsx
// ✅ 推荐：使用设计令牌
<div style={{ backgroundColor: colors.primary[500] }}>

// ❌ 避免：硬编码颜色
<div style={{ backgroundColor: '#1e3b32' }}>
```

### 2. 保持一致性
```tsx
// ✅ 推荐：使用预设变体
<Button variant="primary" size="md">

// ❌ 避免：自定义样式
<Button className="bg-green-500 px-4 py-2">
```

### 3. 语义化使用
```tsx
// ✅ 推荐：使用语义化组件
<Typography variant="h1">页面标题</Typography>

// ❌ 避免：使用通用 div
<div className="text-4xl font-bold">页面标题</div>
```

## 🔧 扩展组件

### 创建新组件
```tsx
// src/design-system/components/MyComponent/MyComponent.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/design-system/utils/cn';

const myComponentVariants = cva(
  'base-styles',
  {
    variants: {
      variant: {
        default: 'default-styles',
        custom: 'custom-styles',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {
  // 组件属性
}

export const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(myComponentVariants({ variant, className }))}
        {...props}
      />
    );
  }
);
```

## 📚 更多资源

- [设计令牌文档](./tokens/README.md)
- [组件 API 文档](./components/README.md)
- [设计指南](./guidelines/README.md)
- [更新日志](./CHANGELOG.md)

## 🤝 贡献

1. 遵循现有的代码风格
2. 添加适当的类型定义
3. 包含使用示例
4. 更新相关文档

## 📄 许可证

MIT License






























