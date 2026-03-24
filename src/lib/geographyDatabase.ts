/**
 * 与 JourneyMap 共用的地理坐标词库 + 目的地 sidebar pageId 映射。
 * 用于 Destination 列表悬停时 flyTo / Marker 定位。
 */

export const GEOGRAPHY_DATABASE: Record<string, [number, number]> = {
  "xi'an": [108.9401, 34.3416],
  xian: [108.9401, 34.3416],
  dali: [100.2676, 25.6065],
  xining: [101.7782, 36.6171],
  zhangjiajie: [110.4792, 29.1171],
  fenghuang: [109.6019, 27.9482],
  suzhou: [120.5853, 31.299],
  huangshan: [118.3375, 29.7147],
  'yellow mountain': [118.3375, 29.7147],
  hangzhou: [120.1551, 30.2741],
  huashan: [110.0861, 34.4768],
  datong: [113.3001, 40.0768],
  pingyao: [112.1812, 37.189],
  jiuzhaigou: [103.9214, 33.2631],
  huanglong: [103.7846, 32.7388],
  chengdu: [104.0668, 30.5728],
  chongqing: [106.5516, 29.563],
  wuhan: [114.3055, 30.5928],
  lanzhou: [103.8343, 36.0611],
  urumqi: [87.6168, 43.8256],
  hohhot: [111.6708, 40.8183],
  taiyuan: [112.5489, 37.8706],
  harbin: [126.5358, 45.8023],
  guangzhou: [113.2644, 23.1291],
  fuzhou: [119.2965, 26.0745],

  lhasa: [91.1322, 29.6604],
  everest: [86.925, 27.9881],
  shanghai: [121.4737, 31.2304],
  beijing: [116.4074, 39.9042],
  kunming: [102.7122, 25.0406],
  lijiang: [100.222, 26.8708],
  'shangri-la': [99.7065, 27.8231],
  guilin: [110.2902, 25.2736],
  yangshuo: [110.4791, 24.7777],
  namtso: [90.6226, 30.7303],
  yamdrok: [90.4126, 28.9897],
};

/** REGION_MAPPING 中每个 pageId 的代表点（用于列表悬停 flyTo） */
export const PAGE_ID_TO_COORDS: Record<string, [number, number]> = {
  'tibetan-plateau': [91.1322, 29.6604],
  'yunnan-guizhou-highlands': [102.7122, 25.0406],
  'sichuan-basin': [104.0668, 30.5728],
  'chongqing-gorges': [106.5516, 29.563],
  'silk-road-corridor': [103.8343, 36.0611],
  'qinghai-tibet-plateau': [101.7782, 36.6171],
  'xinjiang-oases-deserts': [87.6168, 43.8256],
  xian: [108.9401, 34.3416],
  'inner-mongolian-grasslands': [111.6708, 40.8183],
  beijing: [116.4074, 39.9042],
  'loess-shanxi-heritage': [112.5489, 37.8706],
  'northeastern-forests': [126.5358, 45.8023],
  canton: [113.2644, 23.1291],
  zhangjiajie: [110.4792, 29.1171],
  guilin: [110.2902, 25.2736],
  'hakka-fujian': [119.2965, 26.0745],
  wuhan: [114.3055, 30.5928],
  shanghai: [121.4737, 31.2304],
  hangzhou: [120.1551, 30.2741],
  'water-towns': [120.5853, 31.299],
  'yellow-mountain-southern-anhui': [118.3375, 29.7147],
};

/**
 * 根据 sidebar 的 id（pageId）解析 [lng, lat]，优先 PAGE_ID_TO_COORDS，再匹配 GEOGRAPHY_DATABASE。
 */
export function getCoordsForPlacePageId(pageId: string): [number, number] | null {
  const key = pageId.trim().toLowerCase();
  if (PAGE_ID_TO_COORDS[key]) return PAGE_ID_TO_COORDS[key];

  const tokens = key.split(/[-_\s]+/).filter(Boolean);
  for (const token of tokens) {
    const t = token.toLowerCase();
    if (GEOGRAPHY_DATABASE[t]) return GEOGRAPHY_DATABASE[t];
  }

  const haystack = key.replace(/-/g, ' ');
  const match = Object.entries(GEOGRAPHY_DATABASE).find(([kw]) => haystack.includes(kw));
  return match?.[1] ?? null;
}
