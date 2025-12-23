/**
 * 省份颜色配置
 * 为每个省份定义不同的颜色，用于地图显示
 */

export interface ProvinceColor {
  /** 省份 adcode */
  adcode: string;
  /** 省份名称 */
  name: string;
  /** 填充颜色（RGB 或十六进制） */
  fillColor: string;
  /** 边界颜色 */
  borderColor: string;
}

/**
 * 省份颜色映射表
 */
export const PROVINCE_COLORS: ProvinceColor[] = [
  {
    adcode: '500000',
    name: '重庆市',
    fillColor: '#8B4513',  // 棕色
    borderColor: '#654321'
  },
  {
    adcode: '510000',
    name: '四川省',
    fillColor: '#228B22',  // 森林绿
    borderColor: '#006400'
  },
  {
    adcode: '520000',
    name: '贵州省',
    fillColor: '#4169E1',  // 皇家蓝
    borderColor: '#0000CD'
  },
  {
    adcode: '530000',
    name: '云南省',
    fillColor: '#FF6347',  // 番茄红
    borderColor: '#DC143C'
  },
  {
    adcode: '540000',
    name: '西藏自治区',
    fillColor: '#9370DB',  // 中紫色
    borderColor: '#663399'
  },
  {
    adcode: '630000',
    name: '青海省',
    fillColor: '#20B2AA',  // 浅海绿
    borderColor: '#008B8B'
  }
];

/**
 * 根据 adcode 获取省份颜色
 */
export function getProvinceColor(adcode: string): ProvinceColor | undefined {
  return PROVINCE_COLORS.find(p => p.adcode === adcode);
}

/**
 * 获取所有省份的 adcode 列表
 */
export function getAllProvinceAdcodes(): string[] {
  return PROVINCE_COLORS.map(p => p.adcode);
}

/**
 * 生成 Mapbox 颜色表达式
 * 根据 feature.id 返回对应的颜色
 */
export function getProvinceColorExpression(): any[] {
  // 构建 case 表达式：根据 feature.id 返回不同颜色
  const cases: any[] = [];
  
  PROVINCE_COLORS.forEach((province, index) => {
    cases.push(['==', ['get', 'id'], province.adcode]);
    cases.push(province.fillColor);
  });
  
  // 默认颜色（如果 id 不匹配）
  cases.push('#c0a273'); // 默认金色
  
  return ['case', ...cases];
}

/**
 * 生成边界颜色表达式
 */
export function getProvinceBorderColorExpression(): any[] {
  const cases: any[] = [];
  
  PROVINCE_COLORS.forEach((province) => {
    cases.push(['==', ['get', 'id'], province.adcode]);
    cases.push(province.borderColor);
  });
  
  cases.push('#c0a273'); // 默认颜色
  
  return ['case', ...cases];
}





