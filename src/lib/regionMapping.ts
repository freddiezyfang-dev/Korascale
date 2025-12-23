/**
 * 区域 ID 映射配置
 * 
 * 将页面中的区域 ID 映射到 GeoJSON feature.id
 * 用于匹配 sidebar 区域和地图上的行政区
 */

export interface RegionMapping {
  /** 页面中的区域 ID（用于 sidebar 和 URL） */
  pageId: string;
  /** GeoJSON 中的 feature.id（通常是省份 adcode） */
  geojsonIds: string[];
  /** 区域显示名称 */
  name: string;
}

/**
 * 区域映射配置表
 * 
 * 注意：
 * - pageId 必须与 sidebar 中的 id 匹配
 * - geojsonIds 是数组，因为一个区域可能包含多个省份
 * - 如果 GeoJSON 中只有一个 feature，可以直接使用单个 ID
 */
export const REGION_MAPPING: RegionMapping[] = [
  {
    pageId: 'tibetan-plateau',
    geojsonIds: ['540000', '630000'],
    name: 'Tibetan Plateau & Kham Region',
  },
  {
    pageId: 'yunnan-guizhou-highlands',
    geojsonIds: ['530000', '520000'],
    name: 'Yunnan–Guizhou Highlands',
  },
  {
    pageId: 'sichuan-basin',
    geojsonIds: ['510000'],
    name: 'Sichuan Basin & Mountains',
  },
  {
    pageId: 'chongqing-gorges',
    geojsonIds: ['500000'],
    name: 'Chongqing & Three Gorges',
  }
];

/**
 * 根据 pageId 查找映射配置
 */
export function getRegionMapping(pageId: string): RegionMapping | undefined {
  return REGION_MAPPING.find(mapping => mapping.pageId === pageId);
}

/**
 * 根据 geojsonId 查找对应的 pageId
 */
export function getPageIdByGeoJsonId(geojsonId: string): string | undefined {
  const mapping = REGION_MAPPING.find(m => m.geojsonIds.includes(geojsonId));
  return mapping?.pageId;
}

/**
 * 检查 geojsonId 是否属于某个区域
 */
export function isGeoJsonIdInRegion(geojsonId: string, pageId: string): boolean {
  const mapping = getRegionMapping(pageId);
  return mapping ? mapping.geojsonIds.includes(geojsonId) : false;
}





