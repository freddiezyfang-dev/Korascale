# 品牌哲学模块素材添加指南

本文档说明如何为首页的两个品牌哲学模块添加图片和视频素材。

## 📁 文件目录结构

### 1. 图片素材位置

将图片文件放在以下目录：

```
/public/images/brand-philosophy/
├── our-perspective.jpg          # Our Perspective 模块的图片
└── the-lens-behind-korascale.jpg # The Lens Behind Korascale 模块的背景图
```

### 2. 视频素材位置

将视频文件放在以下目录：

```
/public/videos/brand-philosophy/
├── our-perspective.mp4          # Our Perspective 模块的视频（可选）
└── the-lens-behind-korascale.mp4 # The Lens Behind Korascale 模块的背景视频（可选）
```

## 🖼️ 素材要求

### Our Perspective 模块

**图片选项：**
- **推荐尺寸**：1920x1080 或更高（16:9 比例）
- **格式**：JPG, PNG, WebP
- **文件大小**：建议压缩到 500KB - 2MB
- **内容建议**：展现中国变迁、过渡、文化融合的抽象或具象画面

**视频选项（可选）：**
- **推荐尺寸**：1920x1080 或更高（16:9 比例）
- **格式**：MP4（H.264 编码）
- **时长**：建议 10-30 秒（会自动循环播放）
- **文件大小**：建议压缩到 5-20MB
- **内容建议**：展现中国变迁、过渡、文化融合的动态画面

### The Lens Behind Korascale 模块

**图片选项：**
- **推荐尺寸**：2560x1440 或更高（16:9 比例，需要足够宽以覆盖全屏）
- **格式**：JPG, PNG, WebP
- **文件大小**：建议压缩到 1-3MB
- **内容建议**：沙漠、变化景观、中国大地等沉浸式场景

**视频选项（可选）：**
- **推荐尺寸**：2560x1440 或更高（16:9 比例）
- **格式**：MP4（H.264 编码）
- **时长**：建议 15-60 秒（会自动循环播放）
- **文件大小**：建议压缩到 10-30MB
- **内容建议**：沙漠、变化景观、中国大地的动态画面

## 📝 如何添加素材

### 方法一：使用默认路径（推荐）

1. **添加图片文件**：
   ```bash
   # 在项目根目录执行
   mkdir -p public/images/brand-philosophy
   # 然后将你的图片文件复制到这个目录
   # 文件名必须是：
   # - our-perspective.jpg
   # - the-lens-behind-korascale.jpg
   ```

2. **添加视频文件（可选）**：
   ```bash
   # 在项目根目录执行
   mkdir -p public/videos/brand-philosophy
   # 然后将你的视频文件复制到这个目录
   # 文件名必须是：
   # - our-perspective.mp4
   # - the-lens-behind-korascale.mp4
   ```

3. **组件会自动使用这些文件**，无需修改代码！

### 方法二：自定义路径

如果你想使用不同的文件名或路径，可以在 `src/app/page.tsx` 中修改：

```tsx
// 在 page.tsx 中
<OurPerspectiveSection 
  imageSrc="/images/your-custom-path/image.jpg"
  videoSrc="/videos/your-custom-path/video.mp4"  // 可选
  videoPoster="/images/your-custom-path/poster.jpg"  // 可选，视频封面
/>

<TheLensBehindKorascaleSection 
  backgroundImage="/images/your-custom-path/background.jpg"
  backgroundVideo="/videos/your-custom-path/background.mp4"  // 可选
/>
```

## 🎬 视频 vs 图片的选择

### 使用图片的优势：
- ✅ 加载速度快
- ✅ 文件体积小
- ✅ 兼容性好

### 使用视频的优势：
- ✅ 更具动态感和沉浸感
- ✅ 更好的视觉冲击力
- ✅ 更符合高端品牌形象

**建议**：
- **Our Perspective 模块**：优先使用高质量图片，视频作为可选增强
- **The Lens Behind Korascale 模块**：推荐使用视频，营造沉浸式体验

## 🔧 视频优化建议

如果使用视频，建议进行以下优化：

1. **压缩视频**：
   - 使用工具如 [HandBrake](https://handbrake.fr/) 或 [FFmpeg](https://ffmpeg.org/)
   - 目标码率：2-5 Mbps
   - 分辨率：1920x1080 或 2560x1440

2. **FFmpeg 压缩命令示例**：
   ```bash
   # 压缩 Our Perspective 视频
   ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart our-perspective.mp4
   
   # 压缩 The Lens Behind Korascale 视频
   ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k -movflags +faststart the-lens-behind-korascale.mp4
   ```

3. **创建视频封面**：
   - 从视频中提取一帧作为封面图
   - 使用 FFmpeg：`ffmpeg -i video.mp4 -ss 00:00:01 -vframes 1 poster.jpg`

## 📋 检查清单

添加素材后，请确认：

- [ ] 图片文件已放在 `public/images/brand-philosophy/` 目录
- [ ] 图片文件名正确（`our-perspective.jpg` 和 `the-lens-behind-korascale.jpg`）
- [ ] 如果使用视频，视频文件已放在 `public/videos/brand-philosophy/` 目录
- [ ] 视频文件名正确（`our-perspective.mp4` 和 `the-lens-behind-korascale.mp4`）
- [ ] 文件大小合理（图片 < 3MB，视频 < 30MB）
- [ ] 在浏览器中测试，确认图片/视频正常显示

## 🐛 故障排除

### 图片/视频不显示？

1. **检查文件路径**：
   - 确保文件在 `public/` 目录下
   - 路径以 `/` 开头（如 `/images/...`）

2. **检查文件名**：
   - 确保文件名与代码中的路径匹配
   - 注意大小写（Linux/Mac 系统区分大小写）

3. **清除浏览器缓存**：
   - 按 `Cmd+Shift+R` (Mac) 或 `Ctrl+Shift+R` (Windows) 强制刷新

4. **检查控制台错误**：
   - 打开浏览器开发者工具（F12）
   - 查看 Console 和 Network 标签页，检查是否有 404 错误

### 视频不自动播放？

- 确保视频有 `muted` 属性（代码中已包含）
- 某些浏览器需要用户交互后才能自动播放视频
- 如果仍有问题，可以添加 `poster` 属性作为视频封面

## 📞 需要帮助？

如果遇到问题，请检查：
1. 文件路径是否正确
2. 文件格式是否支持
3. 浏览器控制台是否有错误信息

