const { colors, typography, spacing, shadows, borders } = require('./src/design-system/tokens');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/design-system/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 使用设计令牌中的颜色
      colors: {
        // 主色调
        primary: colors.primary,
        // 中性色
        neutral: colors.neutral,
        // 背景色
        background: colors.background,
        // 文本色
        text: colors.text,
        // 状态色
        status: colors.status,
        // 边框色
        border: colors.border,
        // 阴影色
        shadow: colors.shadow,
      },
      
      // 使用设计令牌中的字体
      fontFamily: {
        heading: typography.fontFamily.heading,
        subheading: typography.fontFamily.subheading,
        body: typography.fontFamily.body,
        mono: typography.fontFamily.mono,
        montserrat: typography.fontFamily.montserrat,
        dancingScript: typography.fontFamily.dancingScript,
        montaguSlab: typography.fontFamily.montaguSlab,
        serif: ['"Playfair Display"', 'serif'],
      },
      
      // 使用设计令牌中的字体大小
      fontSize: typography.fontSize,
      
      // 使用设计令牌中的行高
      lineHeight: typography.lineHeight,
      
      // 使用设计令牌中的字重
      fontWeight: typography.fontWeight,
      
      // 使用设计令牌中的字间距
      letterSpacing: typography.letterSpacing,
      
      // 使用设计令牌中的间距
      spacing: spacing,
      
      // 使用设计令牌中的阴影
      boxShadow: {
        'light': `0 1px 3px 0 ${shadows.light}, 0 1px 2px 0 ${shadows.light}`,
        'medium': `0 4px 6px -1px ${shadows.medium}, 0 2px 4px -1px ${shadows.medium}`,
        'dark': `0 10px 15px -3px ${shadows.dark}, 0 4px 6px -2px ${shadows.dark}`,
        'card': `0 4px 6px -1px ${shadows.light}, 0 2px 4px -1px ${shadows.light}`,
        'elevated': `0 20px 25px -5px ${shadows.medium}, 0 10px 10px -5px ${shadows.medium}`,
      },
      
      // 使用设计令牌中的边框半径
      borderRadius: {
        'none': '0',
        'sm': borders.radius.sm,
        'md': borders.radius.md,
        'lg': borders.radius.lg,
        'xl': borders.radius.xl,
        '2xl': borders.radius['2xl'],
        'full': '9999px',
      },
      
      // 使用设计令牌中的边框宽度
      borderWidth: {
        '0': '0',
        '1': borders.width.thin,
        '2': borders.width.medium,
        '4': borders.width.thick,
        '8': borders.width.extraThick,
      },
    },
  },
  plugins: [],
};



















