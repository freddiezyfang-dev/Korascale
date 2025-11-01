'use client';

import React, { useState } from 'react';
import { Text, Card, Button } from '@/components/common';
import { Journey } from '@/types';
import { generateJourneyPageFields } from '@/lib/journeyPageGenerator';
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
    if (!journey.slug) {
      alert('请先设置 Journey Slug 才能预览页面');
      return;
    }
    // 在新标签页中打开预览
    window.open(`/journeys/${journey.slug}`, '_blank');
  };

  const handleCopyUrl = () => {
    if (journey.slug) {
      navigator.clipboard.writeText(`${window.location.origin}/journeys/${journey.slug}`);
    }
  };

  const handleConfirmGeneration = async () => {
    if (!journey.slug) {
      alert('请先设置 Journey Slug 才能生成页面');
      return;
    }
    
    setIsGenerating(true);
    try {
      // 生成页面所需的所有字段
      const generatedFields = generateJourneyPageFields(journey, allJourneys);
      
      // 保存生成的字段到数据库
      await onUpdateJourney(journey.id, generatedFields);
      
      alert('页面生成成功！字段已自动保存。');
    } catch (error) {
      console.error('Error generating page:', error);
      alert(`页面生成失败：${error instanceof Error ? error.message : '未知错误'}`);
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
