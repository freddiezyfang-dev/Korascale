'use client';

import React, { useState } from 'react';
import { Text, Card, Button } from '@/components/common';
import { Journey } from '@/types';
import { 
  Eye,
  Copy,
  CheckCircle
} from 'lucide-react';

interface PageGenerationHelperProps {
  journey: Journey;
  onUpdateJourney: (journeyId: string, updates: Partial<Journey>) => void;
  allJourneys: Journey[];
}

export function PageGenerationHelper({ journey, onUpdateJourney, allJourneys }: PageGenerationHelperProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePreviewPage = () => {
    if (journey.slug) {
      // 使用当前窗口打开，而不是新窗口
      window.location.href = `/journeys/${journey.slug}`;
    }
  };

  const handleCopyUrl = () => {
    if (journey.slug) {
      navigator.clipboard.writeText(`${window.location.origin}/journeys/${journey.slug}`);
    }
  };

  const handleConfirmGeneration = async () => {
    if (!journey.slug) return;
    
    setIsGenerating(true);
    try {
      // 这里可以添加页面生成逻辑
      // 比如生成页面内容、更新状态等
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟生成过程
      
      // 可以在这里添加成功提示
      alert('页面生成成功！');
    } catch (error) {
      console.error('Error generating page:', error);
      alert('页面生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-6">
      <Text className="text-lg font-semibold mb-4">Page Management</Text>
      
      {/* Page URL Display */}
      {journey.slug ? (
        <div className="p-4 bg-blue-50 rounded-lg">
          <Text className="text-blue-800 font-medium mb-2">Page URL</Text>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Text className="text-sm text-blue-700">URL:</Text>
              <Text className="text-sm font-mono text-blue-900">/journeys/{journey.slug}</Text>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <Button
              onClick={handlePreviewPage}
              variant="secondary"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button
              onClick={handleConfirmGeneration}
              disabled={isGenerating}
              variant="primary"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              {isGenerating ? 'Generating...' : 'Confirm'}
            </Button>
            <Button
              onClick={handleCopyUrl}
              variant="secondary"
              size="sm"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy URL
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg">
          <Text className="text-gray-800 font-medium mb-2">No Page URL Set</Text>
          <Text className="text-sm text-gray-600">
            Set a slug in the journey details to generate a page URL.
          </Text>
        </div>
      )}
    </Card>
  );
}
