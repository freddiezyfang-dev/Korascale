// 阴影设计令牌
export const shadows = {
  // 基础阴影
  none: 'none',
  
  // 小阴影
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  
  // 中等阴影
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  
  // 大阴影
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  
  // 超大阴影
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  // 2xl阴影
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // 内阴影
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // 特殊阴影
  special: {
    // 卡片阴影
    card: '0 2px 4px 0px rgba(0, 0, 0, 0)',
    // 按钮阴影
    button: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    // 模态框阴影
    modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    // 下拉菜单阴影
    dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    // 工具提示阴影
    tooltip: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  
  // 彩色阴影
  colored: {
    primary: '0 4px 14px 0 rgba(30, 59, 50, 0.15)',
    success: '0 4px 14px 0 rgba(16, 185, 129, 0.15)',
    warning: '0 4px 14px 0 rgba(245, 158, 11, 0.15)',
    error: '0 4px 14px 0 rgba(239, 68, 68, 0.15)',
  },
} as const;

// 阴影使用指南
export const shadowUsage = {
  // 层级阴影
  elevation: {
    0: shadows.none,
    1: shadows.sm,
    2: shadows.md,
    3: shadows.lg,
    4: shadows.xl,
    5: shadows['2xl'],
  },
  
  // 组件阴影
  components: {
    card: shadows.special.card,
    button: shadows.special.button,
    modal: shadows.special.modal,
    dropdown: shadows.special.dropdown,
    tooltip: shadows.special.tooltip,
  },
  
  // 交互状态阴影
  interactive: {
    default: shadows.sm,
    hover: shadows.md,
    active: shadows.inner,
    focus: shadows.lg,
  },
} as const;

