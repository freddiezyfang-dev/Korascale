/**
 * Journey 详情页 Hotel / Experience 板块统一布局常量
 * 确保两处使用完全相同的对齐与卡片尺寸标准
 */

/** 标准间距：移动端 24px (gap-6)，桌面端 40px (gap-10)，同时用于 padding 与 gap 以保持垂直对齐线 */
export const DYNAMIC_GAP = 'gap-6 md:gap-10';
export const DYNAMIC_PADDING = 'px-6 md:px-10';

/** @deprecated 标题与滚动区已改用 DYNAMIC_PADDING，不再使用 max-w 限制 */
export const CONTAINER_CLASS = 'max-w-7xl mx-auto px-6 md:px-8';

/** 强制锁定卡片宽度：大屏黄金比例 */
export const CARD_WIDTH_DESKTOP = '360px';
/** 移动端卡片宽度 */
export const CARD_WIDTH_MOBILE = '300px';

/** @deprecated 已改用 DYNAMIC_GAP + DYNAMIC_PADDING，不再使用 -mx breakout */
export const SCROLL_PX = 'px-6 md:px-8';
export const SCROLL_NEGATIVE_MX = '-mx-6 md:-mx-8';
