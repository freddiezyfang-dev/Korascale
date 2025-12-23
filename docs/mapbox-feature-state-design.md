# Mapbox Feature-State 交互设计

## 1. Feature-State 结构设计

### 状态字段
```typescript
interface FeatureState {
  selected: boolean;  // 是否被选中（点击 sidebar 时设置）
  hover: boolean;     // 是否悬停（鼠标悬停时设置）
}
```

### 状态优先级
- `selected` > `hover`：如果省份已被选中，hover 状态不生效
- 同一时间只能有一个 region 被 selected
- hover 可以在多个未 selected 的省份上同时生效

## 2. Paint 表达式设计

### regions-fill 图层

```javascript
{
  'fill-color': [
    'case',
    // 优先级 1: selected 状态（最明显）
    ['==', ['coalesce', ['feature-state', 'selected'], false], true],
    [
      'case',
      // 根据省份 ID 显示不同颜色（高亮版本）
      ['==', ['id'], '500000'], '#A0522D',  // 重庆
      ['==', ['id'], '510000'], '#32CD32',  // 四川
      ['==', ['id'], '520000'], '#6495ED',  // 贵州
      ['==', ['id'], '530000'], '#FF7F50',  // 云南
      ['==', ['id'], '540000'], '#BA55D3',  // 西藏
      ['==', ['id'], '630000'], '#48D1CC',  // 青海
      '#c0a273'  // 默认
    ],
    // 优先级 2: hover 状态（中等明显）
    ['==', ['coalesce', ['feature-state', 'hover'], false], true],
    [
      'case',
      // 根据省份 ID 显示不同颜色（hover 版本，稍微亮一点）
      ['==', ['id'], '500000'], '#CD853F',  // 重庆
      ['==', ['id'], '510000'], '#3CB371',  // 四川
      ['==', ['id'], '520000'], '#7B68EE',  // 贵州
      ['==', ['id'], '530000'], '#FF8C69',  // 云南
      ['==', ['id'], '540000'], '#DA70D6',  // 西藏
      ['==', ['id'], '630000'], '#66CDAA',  // 青海
      '#c0a273'  // 默认
    ],
    // 默认状态：根据省份显示不同颜色（正常版本）
    [
      'case',
      ['==', ['id'], '500000'], '#8B4513',  // 重庆
      ['==', ['id'], '510000'], '#228B22',  // 四川
      ['==', ['id'], '520000'], '#4169E1',  // 贵州
      ['==', ['id'], '530000'], '#FF6347',  // 云南
      ['==', ['id'], '540000'], '#9370DB',  // 西藏
      ['==', ['id'], '630000'], '#20B2AA',  // 青海
      '#c0a273'  // 默认
    ]
  ],
  'fill-opacity': [
    'case',
    ['==', ['coalesce', ['feature-state', 'selected'], false], true],
    0.7,  // selected: 70% 不透明
    ['==', ['coalesce', ['feature-state', 'hover'], false], true],
    0.5,  // hover: 50% 不透明
    0.3   // 默认: 30% 不透明
  ]
}
```

### regions-border 图层

```javascript
{
  'line-color': [
    'case',
    // 优先级 1: selected 状态
    ['==', ['coalesce', ['feature-state', 'selected'], false], true],
    [
      'case',
      ['==', ['id'], '500000'], '#654321',  // 重庆
      ['==', ['id'], '510000'], '#006400',  // 四川
      ['==', ['id'], '520000'], '#0000CD',  // 贵州
      ['==', ['id'], '530000'], '#DC143C',  // 云南
      ['==', ['id'], '540000'], '#663399',  // 西藏
      ['==', ['id'], '630000'], '#008B8B',  // 青海
      '#c0a273'
    ],
    // 优先级 2: hover 状态
    ['==', ['coalesce', ['feature-state', 'hover'], false], true],
    [
      'case',
      ['==', ['id'], '500000'], '#8B4513',  // 重庆
      ['==', ['id'], '510000'], '#228B22',  // 四川
      ['==', ['id'], '520000'], '#4169E1',  // 贵州
      ['==', ['id'], '530000'], '#FF6347',  // 云南
      ['==', ['id'], '540000'], '#9370DB',  // 西藏
      ['==', ['id'], '630000'], '#20B2AA',  // 青海
      '#c0a273'
    ],
    // 默认状态
    [
      'case',
      ['==', ['id'], '500000'], '#654321',  // 重庆
      ['==', ['id'], '510000'], '#006400',  // 四川
      ['==', ['id'], '520000'], '#0000CD',  // 贵州
      ['==', ['id'], '530000'], '#DC143C',  // 云南
      ['==', ['id'], '540000'], '#663399',  // 西藏
      ['==', ['id'], '630000'], '#008B8B',  // 青海
      '#c0a273'
    ]
  ],
  'line-width': [
    'case',
    ['==', ['coalesce', ['feature-state', 'selected'], false], true],
    3.5,   // selected: 3.5px
    ['==', ['coalesce', ['feature-state', 'hover'], false], true],
    2.5,   // hover: 2.5px
    1.5    // 默认: 1.5px
  ],
  'line-opacity': [
    'case',
    ['==', ['coalesce', ['feature-state', 'selected'], false], true],
    1.0,   // selected: 完全不透明
    ['==', ['coalesce', ['feature-state', 'hover'], false], true],
    0.9,   // hover: 90% 不透明
    0.8    // 默认: 80% 不透明
  ]
}
```

## 3. selectRegion 函数实现

```typescript
/**
 * 选中一个 region（清除所有其他 selected，设置新的 selected）
 * @param regionId - 区域 ID（如 'tibetan-plateau'）
 */
function selectRegion(regionId: string) {
  if (!map.current || !mapReadyRef.current) return;

  // 1. 获取该 region 对应的省份 adcode 列表
  const mapping = getRegionMapping(regionId);
  if (!mapping) {
    console.warn(`[RegionMap] No mapping found for region: ${regionId}`);
    return;
  }

  const targetAdcodes = mapping.geojsonIds; // 如 ['540000', '630000']
  
  // 2. 获取所有省份的 adcode（从 regionsDataRef 或已知列表）
  const allAdcodes = [
    '500000', // 重庆
    '510000', // 四川
    '520000', // 贵州
    '530000', // 云南
    '540000', // 西藏
    '630000'  // 青海
  ];

  // 3. 清除所有省份的 selected 状态
  allAdcodes.forEach(adcode => {
    try {
      map.current.setFeatureState(
        { source: 'regions', id: adcode },
        { selected: false }
      );
    } catch (error) {
      console.warn(`[RegionMap] Error clearing selected state for ${adcode}:`, error);
    }
  });

  // 4. 设置目标省份的 selected 状态
  targetAdcodes.forEach(adcode => {
    try {
      map.current.setFeatureState(
        { source: 'regions', id: adcode },
        { selected: true }
      );
    } catch (error) {
      console.warn(`[RegionMap] Error setting selected state for ${adcode}:`, error);
    }
  });

  // 5. 清除所有 hover 状态（因为 selected 优先级更高）
  allAdcodes.forEach(adcode => {
    try {
      map.current.setFeatureState(
        { source: 'regions', id: adcode },
        { hover: false }
      );
    } catch (error) {
      // 忽略错误
    }
  });

  // 6. 计算合并后的 bounds 并执行 fitBounds 动画
  if (mapping.bounds) {
    try {
      map.current.fitBounds(mapping.bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        duration: 1500,
        easing: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
        maxZoom: 10
      });
    } catch (error) {
      console.warn('[RegionMap] Error in fitBounds:', error);
    }
  }

  console.log(`[RegionMap] Selected region: ${regionId} -> provinces: ${targetAdcodes.join(', ')}`);
}
```

## 4. Hover 处理（只在未 selected 的省份上生效）

```typescript
/**
 * 设置 hover 状态（只在未 selected 的省份上生效）
 */
function setHoverState(adcode: string, hover: boolean) {
  if (!map.current || !mapReadyRef.current) return;

  try {
    // 先检查当前 selected 状态
    const source = map.current.getSource('regions') as any;
    if (source && source._data) {
      const feature = source._data.features.find((f: any) => String(f.id) === adcode);
      if (feature) {
        // 获取当前 feature-state（需要通过其他方式，或直接设置）
        // 注意：Mapbox 不提供直接读取 feature-state 的 API
        // 我们需要自己维护一个 selected 状态的 ref
      }
    }

    // 设置 hover 状态（如果该省份未被 selected，hover 会生效）
    map.current.setFeatureState(
      { source: 'regions', id: adcode },
      { hover }
    );
  } catch (error) {
    console.warn(`[RegionMap] Error setting hover state for ${adcode}:`, error);
  }
}
```

## 5. Sidebar 和 Map 解耦设计

### 5.1 React State 层

```typescript
// 在页面组件中
const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
const mapRef = useRef<RegionMapHandle>(null);

// Sidebar 点击处理
const handleRegionClick = (regionId: string) => {
  setSelectedRegionId(regionId);
  mapRef.current?.selectRegion(regionId);
};

// Sidebar hover 处理
const handleRegionHover = (regionId: string, isEntering: boolean) => {
  const mapping = getRegionMapping(regionId);
  if (mapping) {
    if (isEntering) {
      // 只在未 selected 时设置 hover
      if (selectedRegionId !== regionId) {
        mapping.geojsonIds.forEach(adcode => {
          mapRef.current?.setHoverState(adcode, true);
        });
      }
    } else {
      // 清除 hover
      mapping.geojsonIds.forEach(adcode => {
        mapRef.current?.setHoverState(adcode, false);
      });
    }
  }
};
```

### 5.2 Map 组件接口

```typescript
export interface RegionMapHandle {
  selectRegion: (regionId: string) => void;
  setHoverState: (adcode: string, hover: boolean) => void;
  clearAllStates: () => void;
  flyToRegion: (bounds: [[number, number], [number, number]]) => void;
}
```

### 5.3 解耦原则

1. **Sidebar 不直接操作 Mapbox**：通过 `mapRef.current` 调用方法
2. **Map 不依赖 Sidebar 状态**：通过 imperative handle 暴露方法
3. **状态同步**：React state (`selectedRegionId`) 用于 UI 反馈，Mapbox feature-state 用于地图渲染
4. **单向数据流**：Sidebar → React State → Map Methods → Mapbox Feature-State

## 6. 完整实现示例

见 `src/components/map/RegionMap.tsx` 和 `src/app/destinations/[region]/page.tsx`





