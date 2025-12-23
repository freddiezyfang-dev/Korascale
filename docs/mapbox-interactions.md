# Mapbox 交互文档

## 概述

本项目使用 Mapbox GL JS 来实现区域地图的交互功能。主要组件位于 `src/components/map/RegionMap.tsx`。

## 配置

### 环境变量

需要在 `.env.local` 或 `.env` 文件中配置 Mapbox Access Token：

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

### 获取 Mapbox Token

1. 访问 [Mapbox 官网](https://www.mapbox.com/)
2. 注册/登录账号
3. 在 Account 页面获取 Access Token
4. 将 Token 添加到环境变量中

## 功能特性

### 1. 地图初始化

- **默认中心点**: `[104.1954, 35.8617]` (中国中心坐标)
- **默认缩放级别**: `5`
- **地图样式**: `mapbox://styles/mapbox/light-v11`
- **导航控件**: 右上角显示缩放和旋转控件

### 2. 区域高亮

支持以下区域的高亮显示：

- `tibetan-plateau`: 西藏高原和康巴地区
- `yunnan-guizhou`: 云南-贵州高原
- `sichuan-basin`: 四川盆地和山区
- `chongqing-gorges`: 重庆和三峡

**高亮效果**:
- 填充透明度: `0.3`
- 边界线宽度: `2px`
- 边界线透明度: `0.8`
- 颜色: `#c0a273`

### 3. 标记点交互

- 每个旅程可以在地图上显示为标记点
- 标记点颜色：
  - 默认: `#c0a273`
  - 选中: `#000`
- 点击标记点会：
  1. 选中对应的旅程
  2. 自动滚动到对应的旅程卡片

### 4. 弹出窗口 (Popup)

- 显示旅程标题
- 显示城市信息（如果有）
- 自动定位在标记点上方

## 代码结构

### 主要状态

```typescript
const [mapLoaded, setMapLoaded] = useState(false);
const [selectedJourney, setSelectedJourney] = useState<string | null>(null);
```

### 主要引用

```typescript
const map = useRef<any>(null);
const markersRef = useRef<any[]>([]);
const layersRef = useRef<string[]>([]);
const mapReadyRef = useRef(false);
```

### 区域边界定义

区域边界以多边形坐标形式定义，格式为 `[经度, 纬度]`：

```typescript
const regionBoundaries: { [key: string]: number[][] } = {
  'tibetan-plateau': [
    [88, 28], [105, 28], [105, 36], [88, 36], [88, 28]
  ],
  // ... 其他区域
};
```

## 使用示例

### 基本用法

```tsx
import RegionMap from '@/components/map/RegionMap';

<RegionMap
  journeys={journeys}
  regionName="tibetan-plateau"
  defaultCenter={[104.1954, 35.8617]}
  defaultZoom={5}
  highlightedRegion={selectedRegionId}
/>
```

### Props 说明

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `journeys` | `Array<Journey>` | 是 | - | 旅程数组，包含坐标信息 |
| `regionName` | `string` | 是 | - | 区域名称 |
| `defaultCenter` | `[number, number]` | 否 | `[104.1954, 35.8617]` | 地图中心坐标 |
| `defaultZoom` | `number` | 否 | `5` | 默认缩放级别 |
| `highlightedRegion` | `string \| null` | 否 | `null` | 当前高亮的区域 ID |

### Journey 对象结构

```typescript
interface Journey {
  id: string;
  title: string;
  image?: string;
  region?: string;
  city?: string;
  location?: string;
  coordinates?: [number, number]; // [经度, 纬度]
}
```

## 交互流程

1. **地图加载**
   - 动态加载 Mapbox GL JS 脚本
   - 设置 Access Token
   - 初始化地图实例

2. **图层添加**
   - 地图加载完成后，为每个区域添加 GeoJSON 图层
   - 包括填充图层和边界线图层

3. **标记点渲染**
   - 根据旅程坐标创建标记点
   - 绑定点击事件处理

4. **高亮更新**
   - 响应 `highlightedRegion` 变化
   - 动态更新图层样式

## 常见问题

### 1. 地图不显示

**可能原因**:
- `NEXT_PUBLIC_MAPBOX_TOKEN` 未设置
- Token 无效或过期
- 网络问题导致脚本加载失败

**解决方案**:
- 检查环境变量配置
- 验证 Token 是否有效
- 检查浏览器控制台错误信息

### 2. 标记点不显示

**可能原因**:
- 旅程数据中缺少 `coordinates` 字段
- 坐标格式不正确（应为 `[经度, 纬度]`）

**解决方案**:
- 确保旅程数据包含有效的坐标信息
- 验证坐标格式是否正确

### 3. 区域高亮不工作

**可能原因**:
- 地图未完全加载
- 区域 ID 不匹配
- 图层未正确添加

**解决方案**:
- 检查 `mapReadyRef.current` 状态
- 验证区域 ID 是否在 `regionBoundaries` 中定义
- 查看浏览器控制台的日志信息

## 版本信息

- **Mapbox GL JS**: `v3.17.0`
- **Mapbox GL CSS**: `v3.17.0`

## 相关文件

- `src/components/map/RegionMap.tsx` - 主要组件实现
- `src/app/destinations/[region]/page.tsx` - 使用示例

## 交互规则与开发规范

### API 使用规则

- ✅ **始终使用** `map.addInteraction()` 进行要素级别的交互
- ❌ **禁止使用** `map.on('mouseenter', layerId)` 处理标准底图要素

### 光标处理

- **重要**: Interactions API **不会**自动管理光标
- 光标需要通过 `map.getCanvas().style.cursor` 手动处理
- 光标变化**仅**在悬停时发生（`mouseenter` / `mouseleave`）
- ❌ **禁止**在点击处理器中改变光标状态

### 悬停模式 (Hover Pattern)

#### mouseenter 事件

```typescript
map.on('mouseenter', 'layer-id', (e) => {
  // 1. 设置光标为指针
  map.getCanvas().style.cursor = 'pointer';
  
  // 2. 可选：设置要素状态高亮
  if (e.features && e.features.length > 0) {
    map.setFeatureState(
      { source: 'source-id', id: e.features[0].id },
      { highlight: true }
    );
  }
});
```

#### mouseleave 事件

```typescript
map.on('mouseleave', 'layer-id', (e) => {
  // 1. 重置光标
  map.getCanvas().style.cursor = '';
  
  // 2. 重置要素状态
  if (e.features && e.features.length > 0) {
    map.setFeatureState(
      { source: 'source-id', id: e.features[0].id },
      { highlight: false }
    );
  }
});
```

### 点击模式 (Click Pattern)

```typescript
map.on('click', 'layer-id', (e) => {
  // 点击触发以下操作之一：
  // 1. 飞行到目标位置
  map.flyTo({
    center: e.lngLat,
    zoom: 12
  });
  
  // 2. 显示弹出窗口
  new mapboxgl.Popup()
    .setLngLat(e.lngLat)
    .setHTML('<div>内容</div>')
    .addTo(map);
  
  // 3. 选择路线/区域
  // ... 业务逻辑
  
  // ⚠️ 注意：不要在此处改变光标状态
});
```

### 设计意图

- **平静、高级、非 GIS 风格的交互**
- 适合旅游品牌网站的用户体验
- 避免过于技术化的交互方式
- 保持简洁优雅的视觉反馈

### 完整示例

```typescript
// 添加交互
map.addInteraction({
  id: 'region-hover',
  type: 'hover',
  layer: 'region-layer',
  onEnter: (e) => {
    map.getCanvas().style.cursor = 'pointer';
    map.setFeatureState(
      { source: 'regions', id: e.features[0].id },
      { highlight: true }
    );
  },
  onLeave: (e) => {
    map.getCanvas().style.cursor = '';
    map.setFeatureState(
      { source: 'regions', id: e.features[0].id },
      { highlight: false }
    );
  }
});

// 点击交互
map.on('click', 'region-layer', (e) => {
  // 飞行到区域中心
  const bounds = e.features[0].geometry.coordinates[0];
  map.flyTo({
    center: calculateCenter(bounds),
    zoom: 8
  });
  
  // 不改变光标
});
```

## 注意事项

1. Mapbox 有使用配额限制，注意控制 API 调用频率
2. 坐标格式为 `[经度, 纬度]`，注意顺序
3. 地图实例需要在组件卸载时正确清理
4. 图层和标记点需要在地图加载完成后才能添加
5. **严格遵循交互规则**，确保一致的用户体验
6. 光标状态管理是手动操作，需要正确实现 `mouseenter` 和 `mouseleave` 事件

