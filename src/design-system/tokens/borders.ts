// 边框设计令牌
export const borders = {
  // 边框宽度
  width: {
    0: '0',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
  },
  
  // 边框样式
  style: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
    double: 'double',
    none: 'none',
  },
  
  // 圆角半径
  radius: {
    none: '0',
    sm: '0.125rem',  // 2px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  // 边框颜色 (引用颜色令牌)
  color: {
    light: 'rgba(229, 229, 229, 1)',     // neutral-200
    medium: 'rgba(212, 212, 212, 1)',    // neutral-300
    dark: 'rgba(64, 64, 64, 1)',         // neutral-700
    primary: 'rgba(30, 59, 50, 1)',      // primary-500
    accent: 'rgba(255, 246, 218, 1)',    // background-accent
  },
} as const;

// 边框预设
export const borderPresets = {
  // 基础边框
  base: {
    width: borders.width[1],
    style: borders.style.solid,
    color: borders.color.light,
  },
  
  // 强调边框
  emphasis: {
    width: borders.width[2],
    style: borders.style.solid,
    color: borders.color.medium,
  },
  
  // 主色调边框
  primary: {
    width: borders.width[1],
    style: borders.style.solid,
    color: borders.color.primary,
  },
  
  // 无边框
  none: {
    width: borders.width[0],
    style: borders.style.none,
    color: 'transparent',
  },
} as const;

// 圆角预设
export const radiusPresets = {
  // 无圆角
  none: borders.radius.none,
  
  // 小圆角
  sm: borders.radius.sm,
  
  // 中等圆角
  md: borders.radius.md,
  
  // 大圆角
  lg: borders.radius.lg,
  
  // 超大圆角
  xl: borders.radius.xl,
  
  // 完全圆角
  full: borders.radius.full,
  
  // 组件特定圆角
  component: {
    button: borders.radius.md,
    card: borders.radius.lg,
    input: borders.radius.md,
    modal: borders.radius.xl,
    badge: borders.radius.full,
  },
} as const;

// 边框使用指南
export const borderUsage = {
  // 组件边框
  components: {
    card: {
      ...borderPresets.base,
      borderRadius: radiusPresets.component.card,
    },
    button: {
      ...borderPresets.none,
      borderRadius: radiusPresets.component.button,
    },
    input: {
      ...borderPresets.base,
      borderRadius: radiusPresets.component.input,
    },
    modal: {
      ...borderPresets.none,
      borderRadius: radiusPresets.component.modal,
    },
  },
  
  // 状态边框
  states: {
    default: borderPresets.base,
    hover: borderPresets.emphasis,
    focus: borderPresets.primary,
    error: {
      width: borders.width[1],
      style: borders.style.solid,
      color: 'rgba(239, 68, 68, 1)', // error color
    },
    success: {
      width: borders.width[1],
      style: borders.style.solid,
      color: 'rgba(16, 185, 129, 1)', // success color
    },
  },
} as const;

