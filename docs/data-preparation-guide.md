# 中国行政区边界数据准备指南

## ⚠️ 当前数据问题

当前 `public/data/geoBoundaries-CHN-ADM3.geojson` 是**县级数据**，存在以下问题：
- ❌ 只有县名，没有省份信息
- ❌ 无法准确映射到所需的省份（四川、重庆、云南、贵州、西藏、青海）
- ❌ 缺少标准的 `adcode` 字段

**验证结果**：只识别出 2/6 个所需省份

## ✅ 推荐数据源

### 1. 阿里云 DataV.GeoAtlas（最推荐）

**网址**：https://datav.aliyun.com/portal/school/atlas/area_selector

**步骤**：
1. 访问网站
2. 选择"省级"数据（不是市级或县级）
3. 选择需要的省份：
   - 四川省（510000）
   - 重庆市（500000）
   - 云南省（530000）
   - 贵州省（520000）
   - 西藏自治区（540000）
   - 青海省（630000）
4. 下载 GeoJSON 格式
5. 确保文件包含 `adcode` 字段

**优点**：
- ✅ 官方权威数据
- ✅ 包含标准的 adcode
- ✅ 边界精度高
- ✅ 免费使用

### 2. GitHub 开源数据

**推荐仓库**：
- `lzxue/geoChina`：https://github.com/lzxue/geoChina
- `lyhmyd1211/GeoMapData_CN`：https://github.com/lyhmyd1211/GeoMapData_CN

**注意**：需要验证数据格式和 adcode 字段

## 📋 数据要求清单

### 必需字段

1. **feature.id**：必须是 6 位数字的 adcode
   ```json
   {
     "id": "510000"  // 四川省
   }
   ```

2. **properties.adcode**：省份代码
   ```json
   {
     "properties": {
       "adcode": "510000",
       "name": "四川省"
     }
   }
   ```

3. **geometry.type**：必须是 `Polygon` 或 `MultiPolygon`

### 必需的省份 ID

根据 `src/lib/regionMapping.ts` 配置，需要以下省份：

| 省份 | adcode | 区域映射 |
|------|--------|---------|
| 四川省 | 510000 | `sichuan-basin` |
| 重庆市 | 500000 | `chongqing-gorges` |
| 云南省 | 530000 | `yunnan-guizhou` |
| 贵州省 | 520000 | `yunnan-guizhou` |
| 西藏自治区 | 540000 | `tibetan-plateau` |
| 青海省 | 630000 | `tibetan-plateau` |

## 🔧 数据处理步骤

### 步骤 1：下载数据

从推荐数据源下载省级 GeoJSON 文件。

### 步骤 2：验证数据

```bash
node scripts/validate-province-ids.js public/data/your-file.geojson
```

### 步骤 3：修复 feature.id（如需要）

如果数据中 `feature.id` 缺失或格式不正确：

```bash
node scripts/fix-missing-id.js public/data/your-file.geojson public/data/china-provinces.geojson
```

### 步骤 4：合并多个省份文件（如需要）

如果下载的是单个省份文件：

```bash
node scripts/merge-geojson.js \
  public/data/sichuan.geojson \
  public/data/chongqing.geojson \
  public/data/yunnan.geojson \
  public/data/guizhou.geojson \
  public/data/tibet.geojson \
  public/data/qinghai.geojson \
  public/data/china-provinces.geojson
```

或使用目录模式：

```bash
node scripts/merge-geojson.js --dir public/data/provinces public/data/china-provinces.geojson
```

### 步骤 5：最终验证

```bash
node scripts/validate-province-ids.js public/data/china-provinces.geojson
```

应该看到：
```
✅ All checks passed! GeoJSON is ready to use.
```

## 📁 文件放置

将处理好的文件放入：
```
public/data/china-provinces.geojson
```

页面代码会自动加载这个文件。

## 🚨 常见问题

### Q: 数据文件太大怎么办？
A: 使用 `mapshaper` 简化几何：
```bash
mapshaper public/data/china-provinces.geojson -simplify 10% -o public/data/china-provinces-simplified.geojson
```

### Q: feature.id 格式不对怎么办？
A: 使用 `scripts/fix-missing-id.js` 脚本，它会：
- 从 `properties.adcode` 提升为 `feature.id`
- 或生成基于索引的 ID

### Q: 如何检查数据是否包含所有需要的省份？
A: 运行验证脚本：
```bash
node scripts/validate-province-ids.js public/data/china-provinces.geojson
```

### Q: 数据源没有 adcode 怎么办？
A: 需要手动添加或使用其他数据源。adcode 是必需的，用于匹配 `regionMapping.ts` 中的配置。

## 📝 下一步

1. ✅ 从推荐数据源下载省级 GeoJSON
2. ✅ 验证数据格式
3. ✅ 修复 feature.id
4. ✅ 合并多个省份（如需要）
5. ✅ 放置到 `public/data/china-provinces.geojson`
6. ✅ 刷新页面测试

## 🔗 相关文件

- `src/lib/regionMapping.ts` - 区域 ID 映射配置
- `src/components/map/RegionMap.tsx` - 地图组件
- `src/app/destinations/[region]/page.tsx` - 使用地图的页面
- `scripts/validate-province-ids.js` - 验证脚本
- `scripts/fix-missing-id.js` - 修复 ID 脚本
- `scripts/merge-geojson.js` - 合并脚本





