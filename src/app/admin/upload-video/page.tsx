'use client';

import { useState, useRef } from 'react';
import { uploadAPI } from '@/lib/databaseClient';
import { Button, Card, Heading, Text } from '@/components/common';

export default function UploadVideoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.startsWith('video/')) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('请选择视频文件');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('请先选择视频文件');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadedUrl(null);

    // 创建 AbortController 用于取消上传
    abortControllerRef.current = new AbortController();

    try {
      const url = await uploadAPI.uploadFile(file, 'videos', abortControllerRef.current.signal);
      setUploadedUrl(url);
      console.log('视频上传成功:', url);
    } catch (err) {
      // 如果是用户取消，不显示错误（已经在 handleCancel 中处理）
      if (err instanceof Error && err.name === 'AbortError') {
        // 取消上传是用户主动操作，不需要显示错误
        // 错误信息已经在 handleCancel 中设置
        return;
      } else {
        const errorMessage = err instanceof Error ? err.message : '上传失败';
        setError(errorMessage);
        console.error('上传失败:', err);
      }
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current && uploading) {
      abortControllerRef.current.abort();
      setUploading(false);
      setError('上传已取消');
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Heading level={1} className="mb-8">上传视频到 Vercel Blob</Heading>
        
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择视频文件
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100"
                disabled={uploading}
              />
              {file && (
                <Text size="sm" className="mt-2 text-gray-600">
                  已选择: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </Text>
              )}
            </div>

            {error && (
              <div className={`p-4 border rounded-lg ${
                error === '上传已取消' 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <Text className={error === '上传已取消' ? 'text-blue-700' : 'text-red-700'}>
                  {error}
                </Text>
              </div>
            )}

            {uploadedUrl && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <Text className="text-green-700 mb-2 font-semibold">上传成功！</Text>
                <Text size="sm" className="text-green-600 mb-2">视频 URL:</Text>
                <div className="bg-white p-3 rounded border border-green-200">
                  <code className="text-sm break-all">{uploadedUrl}</code>
                </div>
                <div className="mt-4">
                  <Text size="sm" className="text-gray-600 mb-2">
                    请复制上面的 URL，然后在 <code className="bg-gray-100 px-2 py-1 rounded">src/app/page.tsx</code> 中更新 HeroCarousel 的 videoSrc 属性：
                  </Text>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    {'<HeroCarousel videoSrc="' + uploadedUrl + '" ... />'}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                variant="primary"
                className="flex-1"
              >
                {uploading ? '上传中...' : '上传视频'}
              </Button>
              {uploading && (
                <Button
                  onClick={handleCancel}
                  variant="secondary"
                  className="flex-1"
                >
                  取消上传
                </Button>
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Text size="sm" className="text-blue-800">
                <strong>提示：</strong>
                <br />
                • 支持 MP4、WebM 等视频格式
                <br />
                • 最大文件大小：100MB
                <br />
                • 上传后请更新 <code className="bg-blue-100 px-1 rounded">src/app/page.tsx</code> 中的视频路径
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

