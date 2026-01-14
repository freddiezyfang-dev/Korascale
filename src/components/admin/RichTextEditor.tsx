'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
// CSS 已在 layout.tsx 中全局导入

// 动态导入 react-quill-new（React 19 兼容版本），避免 SSR 问题
// react-quill-new 是 react-quill 的 fork，修复了 findDOMNode 问题
const ReactQuill = dynamic(
  () => import('react-quill-new'),
  { ssr: false }
) as any; // 临时类型断言，react-quill-new 的类型定义可能不完整

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = '输入内容...',
  className = ''
}: RichTextEditorProps) {
  // 自定义工具栏配置
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }], // H1, H2, H3
        ['bold', 'italic', 'underline'], // 格式化
        [{ 'size': ['small', false, 'large', 'huge'] }], // 字体大小
        [{ 'list': 'ordered'}, { 'list': 'bullet' }], // 列表
        ['link'], // 链接
        ['clean'] // 清除格式
      ],
    },
  }), []);

  // 确保 onChange 传递的是 HTML 字符串
  const handleChange = (content: string) => {
    onChange(content);
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'size',
    'list', // 'list' 格式同时支持有序和无序列表
    'link'
  ];

  return (
    <div className={`rich-text-editor-wrapper ${className}`} style={{ position: 'relative', zIndex: 1 }}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white"
        style={{
          minHeight: '300px',
        }}
      />
      <style jsx global>{`
        .rich-text-editor-wrapper .ql-container {
          font-family: 'Montserrat', sans-serif;
          font-size: 14px;
          min-height: 300px;
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
        }
        
        .rich-text-editor-wrapper .ql-toolbar {
          position: relative;
          z-index: 10;
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          border: 1px solid #d1d5db;
          background-color: #f9fafb;
          padding: 8px;
        }
        
        .rich-text-editor-wrapper .ql-container {
          border: 1px solid #d1d5db;
          border-top: none;
        }
        
        .rich-text-editor-wrapper .ql-editor {
          min-height: 300px;
          padding: 12px;
        }
        
        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        
        .rich-text-editor-wrapper .ql-snow .ql-stroke {
          stroke: #374151;
        }
        
        .rich-text-editor-wrapper .ql-snow .ql-fill {
          fill: #374151;
        }
        
        .rich-text-editor-wrapper .ql-snow .ql-picker-label {
          color: #374151;
        }
        
        .rich-text-editor-wrapper .ql-snow .ql-picker-options {
          background-color: white;
          border: 1px solid #d1d5db;
        }
        
        .rich-text-editor-wrapper .ql-snow .ql-picker-item:hover {
          background-color: #f3f4f6;
        }
        
        .rich-text-editor-wrapper .ql-snow .ql-picker-item.ql-selected {
          background-color: #e5e7eb;
        }
        
        /* 确保编辑器内容区域有合适的行高 */
        .rich-text-editor-wrapper .ql-editor {
          line-height: 1.6;
        }
        
        /* 标题样式 */
        .rich-text-editor-wrapper .ql-editor h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          font-family: 'Playfair Display', serif;
        }
        
        .rich-text-editor-wrapper .ql-editor h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 0.875rem;
          margin-bottom: 0.5rem;
          font-family: 'Playfair Display', serif;
        }
        
        .rich-text-editor-wrapper .ql-editor h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          font-family: 'Playfair Display', serif;
        }
        
        /* 段落样式 */
        .rich-text-editor-wrapper .ql-editor p {
          margin-bottom: 0.75rem;
          font-family: 'Montserrat', sans-serif;
        }
        
        /* 列表样式 */
        .rich-text-editor-wrapper .ql-editor ul,
        .rich-text-editor-wrapper .ql-editor ol {
          margin-bottom: 0.75rem;
          padding-left: 1.5rem;
        }
        
        .rich-text-editor-wrapper .ql-editor li {
          margin-bottom: 0.25rem;
        }
        
        /* 链接样式 */
        .rich-text-editor-wrapper .ql-editor a {
          color: #1e3b32;
          text-decoration: underline;
        }
        
        .rich-text-editor-wrapper .ql-editor a:hover {
          color: #1a342c;
        }
      `}</style>
    </div>
  );
}
