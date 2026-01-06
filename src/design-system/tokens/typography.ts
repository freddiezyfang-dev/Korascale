// 字体设计令牌
export const typography = {
  // 字体族
  fontFamily: {
    // 标题字体 - 优雅的衬线字体
    heading: ['Montaga', 'serif'],
    // 副标题字体 - 古典衬线字体
    subheading: ['Inknut Antiqua', 'serif'],
    // 正文字体 - 现代无衬线字体
    body: ['Monda', 'sans-serif'],
    // 代码字体
    mono: ['Geist Mono', 'monospace'],
    // 特殊字体
    montserrat: ['Montserrat', 'sans-serif'],
    dancingScript: ['Dancing Script', 'cursive'],
    montaguSlab: ['Montagu Slab', 'serif'],
  },
  
  // 字体大小
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
    '8xl': '6rem',    // 96px
    '9xl': '8rem',    // 128px
  },
  
  // 行高
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  
  // 字重
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  // 字间距
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// 文本样式预设
export const textStyles = {
  // 标题样式
  h1: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['8xl'], // 96px
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  
  h2: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['5xl'], // 48px
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  
  h3: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['4xl'], // 36px
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.snug,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  h4: {
    fontFamily: typography.fontFamily.subheading,
    fontSize: typography.fontSize['2xl'], // 24px
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.snug,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  h5: {
    fontFamily: typography.fontFamily.subheading,
    fontSize: typography.fontSize.xl, // 20px
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  h6: {
    fontFamily: typography.fontFamily.subheading,
    fontSize: typography.fontSize.lg, // 18px
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  // 正文样式
  body: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base, // 16px
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  bodyLarge: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.lg, // 18px
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  bodySmall: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm, // 14px
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  // 标签样式
  label: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm, // 14px
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  // 按钮样式
  button: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base, // 16px
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.none,
    letterSpacing: typography.letterSpacing.wide,
  },
  
  // 链接样式
  link: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.base, // 16px
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  // 面包屑样式
  breadcrumb: {
    fontFamily: typography.fontFamily.heading,
    fontSize: typography.fontSize['2xl'], // 24px
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
} as const;

