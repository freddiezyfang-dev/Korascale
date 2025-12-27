# 🗺️ 地图功能调试指南

## 快速检查清单

### 1. 环境变量检查
- [ ] `NEXT_PUBLIC_MAPBOX_TOKEN` 是否已配置？
- [ ] 在浏览器控制台运行：`console.log(process.env.NEXT_PUBLIC_MAPBOX_TOKEN)`
- [ ] 如果显示 `undefined`，说明环境变量未正确配置

### 2. 浏览器控制台检查
打开浏览器开发者工具（F12），查看 Console 标签，应该看到以下日志：

#### ✅ 正常情况应该看到的日志：
```
[RegionMap] Render with activeRegionId: ...
[RegionMap] Script Loaded
[RegionMap] init effect fired
[RegionMap] mapContainer.current = <div>...</div>
[RegionMap] window.mapboxgl = [object Object]
[RegionMap] Initializing Mapbox...
[RegionMap] map created [object Object]
[RegionMap] Map instance exposed to window.__MAP__
[Mapbox] style.load fired
[RegionMap] style.load
[RegionMap] Source "regions" added
[RegionMap] Layer "regions-fill" added
[RegionMap] Layer "regions-border" added
[RegionMap] Source "regions" loaded
[RegionMap] Map fully ready
```

#### ❌ 常见错误：

**错误 1: "Mapbox token not configured"**
- **原因**: `NEXT_PUBLIC_MAPBOX_TOKEN` 未设置
- **解决**: 
  - 本地：创建 `.env.local` 文件，添加 `NEXT_PUBLIC_MAPBOX_TOKEN=your_token`
  - Vercel：在 Dashboard → Settings → Environment Variables 中添加

**错误 2: "mapboxgl not loaded" 或 "mapboxgl script loaded but window object missing"**
- **原因**: Script 加载失败或时机不对
- **解决**: 检查网络连接，确认可以访问 `https://api.mapbox.com`

**错误 3: "GeoJSON data not loaded yet"**
- **原因**: GeoJSON 文件未加载或路径错误
- **解决**: 
  - 检查文件是否存在：`public/data/china-provinces.geojson`
  - 检查网络请求：在 Network 标签查看是否有 404 错误

**错误 4: "The source 'regions' does not exist"**
- **原因**: Source 添加时机不对
- **解决**: 确保在 `style.load` 事件后再添加 source

**错误 5: 地图显示为空白或灰色**
- **原因**: 
  - CSS 未加载（检查 Network 标签，确认 `mapbox-gl.css` 已加载）
  - 容器高度为 0（检查 CSS，确保父容器有高度）
- **解决**: 
  - 检查 `layout.tsx` 中的 CSS link 是否正确
  - 检查地图容器的 CSS 类名和高度设置

### 3. 网络请求检查
在浏览器 Network 标签中检查：

- [ ] `mapbox-gl.js` 是否成功加载（状态码 200）
- [ ] `mapbox-gl.css` 是否成功加载（状态码 200）
- [ ] `china-provinces.geojson` 是否成功加载（状态码 200）
- [ ] Mapbox API 请求是否成功（检查是否有 401/403 错误，说明 token 无效）

### 4. 地图实例检查
在浏览器控制台运行：

```javascript
// 检查地图实例是否存在
window.__MAP__

// 检查地图是否已加载
window.__MAP__?.loaded()

// 检查 source 是否存在
window.__MAP__?.getSource('regions')

// 检查 layer 是否存在
window.__MAP__?.getLayer('regions-fill')
```

### 5. 常见问题修复

#### 问题 A: 环境变量在本地不生效
**解决**:
1. 创建 `.env.local` 文件（如果不存在）
2. 添加：`NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoi...`
3. 重启开发服务器：`npm run dev`

#### 问题 B: 地图容器高度为 0
**解决**:
检查父组件的 CSS，确保有明确的高度：
```tsx
// 父容器必须有高度
<div style={{ height: '600px' }}>  // 或使用 Tailwind: h-[600px]
  <RegionMap ... />
</div>
```

#### 问题 C: GeoJSON 文件 404
**解决**:
1. 确认文件路径：`public/data/china-provinces.geojson`
2. 确认文件存在且可访问
3. 检查文件大小（如果太大可能加载慢）

#### 问题 D: Mapbox token 无效
**解决**:
1. 访问 https://account.mapbox.com/
2. 检查 token 是否有效
3. 确认 token 有正确的权限（需要 `styles:read` 和 `fonts:read`）

### 6. 调试步骤

1. **打开浏览器控制台**（F12）
2. **清除控制台**（点击清除按钮）
3. **刷新页面**
4. **查看日志**，按照上面的清单检查
5. **检查 Network 标签**，确认资源加载情况
6. **运行调试命令**（见第 4 节）

### 7. 获取帮助

如果问题仍未解决，请提供以下信息：

1. 浏览器控制台的完整错误信息
2. Network 标签中的失败请求（截图）
3. 环境变量配置情况（不包含实际 token）
4. 地图容器的 HTML 结构（检查元素）

---

## 快速修复命令

```bash
# 检查 GeoJSON 文件
ls -lh public/data/china-provinces.geojson

# 检查环境变量文件
cat .env.local | grep MAPBOX

# 重启开发服务器
npm run dev
```



