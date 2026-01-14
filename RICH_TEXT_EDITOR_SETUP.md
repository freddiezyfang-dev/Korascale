# 📝 富文本编辑器集成指南

## ✅ 功能说明

已在文章管理后台页面集成了富文本编辑器（react-quill），用于编辑文章内容块中的文本内容。

## 🚀 安装依赖

在项目根目录运行以下命令安装必要的依赖：

**注意**：由于项目使用 React 19，而 react-quill 的 peer dependency 要求是 React 16-18，需要使用 `--legacy-peer-deps` 标志：

```bash
npm install react-quill quill --legacy-peer-deps
```

或者使用 yarn：

```bash
yarn add react-quill quill
```

**说明**：虽然 react-quill 的 peer dependency 检查显示不兼容 React 19，但实际使用中功能正常。使用 `--legacy-peer-deps` 可以绕过这个检查。

## 📋 功能特性

### 工具栏功能

富文本编辑器包含以下工具栏选项：

1. **标题（H1, H2, H3）**
   - 用于创建文章标题，匹配 Jacada 风格的内容结构
   - 支持 H1、H2、H3 三个级别

2. **格式化**
   - **粗体（Bold）**：加粗文本
   - **斜体（Italic）**：斜体文本
   - **下划线（Underline）**：为文本添加下划线

3. **字体大小**
   - 支持选择不同字体大小（small, normal, large, huge）
   - 对应设计规范中的字体大小

4. **列表**
   - **有序列表**：创建编号列表
   - **无序列表**：创建项目符号列表
   - 用于创建"目录"导航

5. **链接**
   - 插入和编辑超链接
   - 支持内部和外部链接

6. **清除格式**
   - 一键清除所有格式

### 数据输出

- 编辑器输出 **HTML 字符串**
- HTML 字符串自动保存到数据库的 `contentBlocks` 字段中
- 前端页面使用 `dangerouslySetInnerHTML` 渲染 HTML 内容

### 样式设计

- 编辑器容器样式符合管理后台 UI 设计
- 工具栏使用浅灰色背景（#f9fafb）
- 编辑区域使用白色背景
- 边框颜色与表单输入框一致（#d1d5db）
- 标题使用 Playfair Display 字体
- 正文使用 Montserrat 字体

## 📍 使用位置

富文本编辑器已集成在以下位置：

1. **新建文章页面** (`/admin/articles/new`)
   - 用于编辑 `paragraph` 类型的内容块
   - 用于编辑 `callout` 类型的内容块

2. **编辑文章页面** (`/admin/articles/edit/[id]`)
   - 用于编辑 `paragraph` 类型的内容块
   - 用于编辑 `callout` 类型的内容块

## 🎨 编辑器样式

编辑器已配置以下样式：

- **最小高度**：200px
- **工具栏**：浅灰色背景，圆角顶部
- **编辑区域**：白色背景，圆角底部
- **字体**：
  - 标题：Playfair Display（serif）
  - 正文：Montserrat（sans-serif）
- **行高**：1.6（提高可读性）

## 💡 使用说明

### 添加段落内容块

1. 在文章编辑页面，点击"添加段落"按钮
2. 在内容块编辑区域，会显示富文本编辑器
3. 使用工具栏格式化文本：
   - 选择标题级别（H1, H2, H3）
   - 应用格式化（粗体、斜体、下划线）
   - 调整字体大小
   - 添加列表
   - 插入链接
4. 编辑完成后，内容会自动保存为 HTML 格式

### 添加高亮框内容块

1. 点击"添加高亮框"按钮
2. 填写月份标签和强调色（可选）
3. 在富文本编辑器中输入内容
4. 使用工具栏格式化文本

## 🔧 技术实现

### 组件位置

- **组件文件**：`src/components/admin/RichTextEditor.tsx`
- **使用动态导入**：避免 SSR 问题（react-quill 是客户端组件）

### 工具栏配置

```typescript
toolbar: {
  container: [
    [{ 'header': [1, 2, 3, false] }], // H1, H2, H3
    ['bold', 'italic', 'underline'], // 格式化
    [{ 'size': ['small', false, 'large', 'huge'] }], // 字体大小
    [{ 'list': 'ordered'}, { 'list': 'bullet' }], // 列表
    ['link'], // 链接
    ['clean'] // 清除格式
  ],
}
```

### 数据流

1. 用户在编辑器中输入内容
2. `onChange` 回调函数被触发
3. HTML 字符串更新到 `contentBlocks` 数组中
4. 保存文章时，HTML 字符串保存到数据库
5. 前端页面渲染时，使用 `dangerouslySetInnerHTML` 显示 HTML 内容

## ⚠️ 注意事项

1. **安装依赖**：确保已安装 `react-quill` 和 `quill` 依赖
2. **SSR 兼容**：组件使用动态导入，避免服务端渲染问题
3. **HTML 安全**：前端渲染时使用 `dangerouslySetInnerHTML`，确保内容来源可信
4. **样式隔离**：编辑器样式使用 `styled-jsx` 进行隔离，不会影响其他组件

## 🐛 故障排除

### 问题：编辑器不显示

**可能原因**：
- 未安装依赖
- SSR 问题

**解决方法**：
1. 运行 `npm install react-quill quill`
2. 确保组件使用动态导入（已实现）

### 问题：样式不正确

**可能原因**：
- CSS 文件未正确导入

**解决方法**：
- 确保 `react-quill/dist/quill.snow.css` 已导入（已在组件中导入）

### 问题：工具栏功能不完整

**可能原因**：
- 工具栏配置不正确

**解决方法**：
- 检查 `RichTextEditor.tsx` 中的 `modules` 配置

## 📝 总结

富文本编辑器已成功集成到文章管理后台，支持：
- ✅ 标题（H1, H2, H3）
- ✅ 格式化（粗体、斜体、下划线）
- ✅ 字体大小选择
- ✅ 列表（有序、无序）
- ✅ 链接插入
- ✅ HTML 输出
- ✅ 符合管理后台 UI 的样式设计

**开始使用前，请确保已安装依赖！** 🎉
