# 中国行政区边界 GeoJSON 数据获取指南

## 问题诊断

当前使用的数据存在以下问题：
1. **矩形 + 折线拼接**：大段完全水平/垂直的边界
2. **Bounding Box 数据**：明显是 extent/bounds 被当成 geometry
3. **硬切边界**：四川、云南、西藏被"硬切"，不符合真实行政区边界
4. **低精度演示数据**：可能是手动拼接的 region 范围

## 高质量数据源推荐

### 1. **阿里云 DataV.GeoAtlas**（推荐）
- **URL**: https://datav.aliyun.com/portal/school/atlas/area_selector
- **特点**：
  - 官方权威数据
  - 支持省/市/县三级
  - 提供 GeoJSON 格式下载
  - 精度较高，边界自然
- **使用方法**：
  1. 访问网站
  2. 选择需要的省份
  3. 下载 GeoJSON 格式
  4. 合并多个省份文件

### 2. **高德地图行政区划数据**
- **API**: https://lbs.amap.com/api/javascript-api/guide/abc/prepare
- **特点**：
  - 官方数据源
  - 需要 API Key
  - 可通过 API 获取边界数据
- **注意**：需要注册开发者账号

### 3. **GitHub 开源数据**
- **推荐仓库**：
  - `lzxue/geoChina`：https://github.com/lzxue/geoChina
  - `lyhmyd1211/GeoMapData_CN`：https://github.com/lyhmyd1211/GeoMapData_CN
  - `wandergis/coordtransform`：相关资源
- **特点**：
  - 免费开源
  - 社区维护
  - 精度参差不齐，需要验证

### 4. **国家基础地理信息中心**
- **官方权威数据**
- **注意**：可能需要申请或付费

## 数据要求

### GeoJSON 格式规范
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "510000",  // 必须：稳定的字符串 ID（建议使用 adcode）
      "properties": {
        "name": "四川省",
        "adcode": "510000",
        "level": "province"
      },
      "geometry": {
        "type": "Polygon" | "MultiPolygon",  // 必须是 Polygon 或 MultiPolygon
        "coordinates": [[[lng, lat], ...]]   // 坐标数组
      }
    }
  ]
}
```

### 关键要求
1. **feature.id**：必须是字符串，且唯一
2. **geometry.type**：必须是 `Polygon` 或 `MultiPolygon`
3. **坐标精度**：建议至少保留 6 位小数
4. **边界自然**：不应出现大量水平/垂直直线

## 数据预处理步骤

### 1. 验证数据质量
```bash
node scripts/validate-geojson.js /path/to/china-provinces.geojson
```

### 2. 修复缺失的 feature.id
```bash
node scripts/fix-missing-id-batch.js /path/to/geojson-directory ./data/processed
```

### 3. 合并多个省份文件
使用 `scripts/merge-geojson.js`（需要创建）合并多个省份的 GeoJSON 文件。

### 4. 简化几何（可选）
如果文件过大，可以使用 `mapshaper` 或 `turf.js` 简化：
```bash
# 使用 mapshaper
mapshaper input.geojson -simplify 10% -o output.geojson
```

## 项目集成

### 方式 1：使用 geojsonUrl（推荐）
```tsx
<RegionMap
  geojsonUrl="/data/china-provinces.geojson"
  defaultCenter={[104.1954, 35.8617]}
  defaultZoom={5}
/>
```

### 方式 2：使用 regions prop（小数据量）
```tsx
<RegionMap
  regions={REGIONS_DATA}
  defaultCenter={[104.1954, 35.8617]}
  defaultZoom={5}
/>
```

## 区域 ID 映射

确保 GeoJSON 中的 `feature.id` 与页面中的区域 ID 匹配：

| 页面区域 ID | 建议 GeoJSON feature.id | 省份名称 |
|------------|------------------------|---------|
| `tibetan-plateau` | `540000` (西藏) + `630000` (青海) | 青藏高原 |
| `yunnan-guizhou` | `530000` (云南) + `520000` (贵州) | 云贵高原 |
| `sichuan-basin` | `510000` | 四川盆地 |
| `chongqing-gorges` | `500000` | 重庆 |

**注意**：如果使用多个省份合并，需要创建自定义区域映射逻辑。

## 下一步行动

1. ✅ 从推荐数据源下载高质量 GeoJSON
2. ✅ 验证数据格式和精度
3. ✅ 修复 feature.id 问题
4. ✅ 合并需要的省份数据
5. ✅ 将文件放入 `public/data/` 目录
6. ✅ 更新页面代码使用 `geojsonUrl`
7. ✅ 测试地图交互和边界显示

## 常见问题

### Q: 数据文件太大怎么办？
A: 使用 `mapshaper` 简化几何，或使用 Mapbox 的 `simplify` 选项。

### Q: 如何匹配区域 ID？
A: 可以在 GeoJSON 的 `properties` 中添加自定义字段，或在代码中建立映射表。

### Q: 边界仍然不够精确？
A: 确保下载的是"完整边界"数据，而不是"简化边界"或"演示数据"。





