# React 19 兼容性修复 - react-quill-new

## 问题

`react-quill` 在 React 19 中不兼容，因为它使用了已移除的 `ReactDOM.findDOMNode` API，导致运行时错误：

```
TypeError: react_dom_1.default.findDOMNode is not a function
```

## 解决方案

使用 `react-quill-new` 替代 `react-quill`，这是一个修复了 React 19 兼容性问题的 fork。

### 安装

```bash
npm uninstall react-quill
npm install react-quill-new --legacy-peer-deps
```

### 更新代码

1. **更新 CSS 导入** (`src/app/layout.tsx`):
   ```typescript
   import "react-quill-new/dist/quill.snow.css";
   ```

2. **更新组件导入** (`src/components/admin/RichTextEditor.tsx`):
   ```typescript
   const ReactQuill = dynamic(
     () => import('react-quill-new'),
     { ssr: false }
   ) as any;
   ```

### 功能保持不变

- ✅ 所有工具栏功能保持不变
- ✅ API 完全兼容（drop-in replacement）
- ✅ 样式和配置无需修改
- ✅ 支持 React 19

## 验证

修复后，富文本编辑器应该：
1. ✅ 正常加载，无运行时错误
2. ✅ 工具栏完整显示
3. ✅ 所有功能正常工作
4. ✅ 内容正确保存和渲染

## 参考

- [react-quill-new GitHub](https://github.com/zenoamaro/react-quill-new)
- [React 19 升级指南](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
