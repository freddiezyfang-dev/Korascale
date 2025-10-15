// 设计令牌统一导出
export { colors, colorUsage } from './colors';
export { typography, textStyles } from './typography';
export { spacing, spacingSemantic } from './spacing';
export { shadows, shadowUsage } from './shadows';
export { borders, borderPresets, radiusPresets, borderUsage } from './borders';

// 设计令牌类型定义
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { shadows } from './shadows';
import { borders } from './borders';

export type ColorToken = keyof typeof colors;
export type TypographyToken = keyof typeof typography;
export type SpacingToken = keyof typeof spacing;
export type ShadowToken = keyof typeof shadows;
export type BorderToken = keyof typeof borders;

// 设计令牌配置
import { colorUsage } from './colors';
import { textStyles } from './typography';
import { spacingSemantic } from './spacing';
import { shadowUsage } from './shadows';
import { borderPresets, radiusPresets, borderUsage } from './borders';

export const designTokens = {
  colors,
  colorUsage,
  typography,
  textStyles,
  spacing,
  spacingSemantic,
  shadows,
  shadowUsage,
  borders,
  borderPresets,
  radiusPresets,
  borderUsage,
} as const;

// 导出类型
export type DesignTokens = typeof designTokens;

