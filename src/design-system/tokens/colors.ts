// 颜色设计令牌
export const colors = {
  // 主色调
  primary: {
    50: '#f0f9f4',
    100: '#dcf2e4',
    200: '#bce5d0',
    300: '#8dd1b3',
    400: '#56b590',
    500: '#1e3b32', // 主要品牌色
    600: '#1a342c',
    700: '#162d26',
    800: '#122620',
    900: '#0e1f1a',
  },
  
  // 中性色
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // 背景色
  background: {
    primary: '#ffffff',
    secondary: '#f5f1e6', // 米色背景
    tertiary: '#1e3b32', // 深绿背景
    accent: '#fff6da', // 浅黄背景
  },
  
  // 文本色
  text: {
    primary: '#000000',
    secondary: '#525252',
    tertiary: '#737373',
    inverse: '#ffffff',
    accent: '#1e3b32',
  },
  
  // 状态色
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // 边框色
  border: {
    light: '#e5e5e5',
    medium: '#d4d4d4',
    dark: '#404040',
  },
  
  // 阴影色
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.2)',
    dark: 'rgba(0, 0, 0, 0.3)',
  }
} as const;

// 颜色使用指南
export const colorUsage = {
  // 品牌色使用
  brand: {
    primary: colors.primary[500],
    primaryHover: colors.primary[600],
    primaryLight: colors.primary[100],
  },
  
  // 背景色使用
  surface: {
    white: colors.background.primary,
    cream: colors.background.secondary,
    dark: colors.background.tertiary,
    accent: colors.background.accent,
  },
  
  // 文本色使用
  content: {
    primary: colors.text.primary,
    secondary: colors.text.secondary,
    tertiary: colors.text.tertiary,
    inverse: colors.text.inverse,
    accent: colors.text.accent,
  },
  
  // 交互色使用
  interactive: {
    hover: colors.neutral[100],
    active: colors.neutral[200],
    focus: colors.primary[100],
    disabled: colors.neutral[300],
  }
} as const;

