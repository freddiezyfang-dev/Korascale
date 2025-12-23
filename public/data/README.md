# GeoJSON 数据目录

此目录用于存放中国行政区边界 GeoJSON 文件。

## 文件要求

### 文件名
建议使用描述性文件名，例如：
- `china-provinces.geojson` - 所有省份
- `southwest-china.geojson` - 西南地区省份
- `china-all-levels.geojson` - 包含省/市/县三级数据

### 数据格式要求

1. **Feature ID**：每个 feature 必须有唯一的字符串 `id`
   - 建议使用省份 adcode（如 `510000` 代表四川省）
   - 必须稳定且唯一

2. **Geometry 类型**：必须是 `Polygon` 或 `MultiPolygon`

3. **坐标精度**：建议至少保留 6 位小数

4. **边界质量**：
   - ✅ 自然曲线边界
   - ✅ 符合真实行政区划
   - ❌ 避免 bounding box 数据
   - ❌ 避免大量水平/垂直直线

### 示例 GeoJSON 结构

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "510000",
      "properties": {
        "name": "四川省",
        "adcode": "510000",
        "level": "province"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], [lng, lat], ...]]
      }
    }
  ]
}
```

## 数据准备步骤

### 1. 下载高质量数据

参考 `/docs/china-administrative-boundaries-guide.md` 获取数据源。

### 2. 验证数据

```bash
node scripts/validate-geojson.js public/data/your-file.geojson
```

### 3. 修复缺失的 ID

```bash
node scripts/fix-missing-id.js public/data/your-file.geojson public/data/your-file-fixed.geojson
```

### 4. 合并多个文件（如需要）

```bash
node scripts/merge-geojson.js --dir /path/to/province-files public/data/china-provinces.geojson
```

### 5. 放置文件

将处理好的 GeoJSON 文件放入 `public/data/` 目录。

## 区域 ID 映射

页面中的区域 ID 与 GeoJSON feature.id 的映射关系在 `/src/lib/regionMapping.ts` 中配置。

当前映射：
- `tibetan-plateau` → `['540000', '630000']` (西藏 + 青海)
- `yunnan-guizhou` → `['530000', '520000']` (云南 + 贵州)
- `sichuan-basin` → `['510000']` (四川)
- `chongqing-gorges` → `['500000']` (重庆)

## 使用方式

在页面中使用 `geojsonUrl` prop：

```tsx
<RegionMap
  geojsonUrl="/data/china-provinces.geojson"
  defaultCenter={[104.1954, 35.8617]}
  defaultZoom={5}
/>
```

## 注意事项

1. **文件大小**：如果文件过大（> 10MB），考虑使用简化工具（如 `mapshaper`）简化几何
2. **CORS**：如果从外部 URL 加载，确保服务器支持 CORS
3. **缓存**：Next.js 会自动缓存 `public/` 目录下的文件，更新后可能需要清除缓存





