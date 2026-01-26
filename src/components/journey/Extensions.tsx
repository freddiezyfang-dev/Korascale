'use client';

import React, { useMemo } from 'react';
import JourneyMap from '@/components/map/JourneyMap';
import { ArrowRight } from 'lucide-react';
import { Extension } from '@/types';

interface ExtensionsProps {
  extensions: Extension[];
}

export default function Extensions({ extensions }: ExtensionsProps) {
  // 从 extensions 中提取位置信息用于地图（使用 coordinates 字段）
  const extensionLocations = useMemo(() => {
    return extensions
      .filter(ext => ext.longitude && ext.latitude)
      .map((ext, index) => ({
        id: ext.id || `ext-${index}`,
        lng: ext.longitude!,
        lat: ext.latitude!,
      }));
  }, [extensions]);

  return (
    <section className="w-full bg-white">
      <div className="w-full flex flex-col lg:flex-row items-stretch min-h-[600px]">
        {/* 左侧：Mapbox 地图预览 */}
        <div className="w-full lg:w-[40%] h-[400px] lg:h-auto relative">
          {extensionLocations.length > 0 ? (
            <JourneyMap
              mode={extensionLocations.length === 1 ? 'single-location' : 'multi-stop-route'}
              locations={extensionLocations}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <p className="text-gray-500 prose-force-wrap">地图预览</p>
            </div>
          )}
        </div>

        {/* 右侧：扩展项目列表 */}
        <div className="w-full lg:w-[60%] bg-[#F5F2E9] py-12 px-6 lg:px-16">
          <div className="max-w-4xl mx-auto">
            <h2 
              className="text-gray-900 text-3xl mb-12 prose-force-wrap"
              style={{ fontFamily: 'Montaga, serif', fontWeight: 400 }}
            >
              Extensions
            </h2>

            <div className="space-y-6">
              {extensions.map((extension, index) => (
                <div
                  key={extension.id || index}
                  className="bg-[#F5F2E9] rounded-lg p-6 flex flex-col md:flex-row gap-6 items-start hover:shadow-md transition-shadow border border-gray-200"
                >
                  {/* 左侧：文字内容 */}
                  <div className="flex-1 min-w-0">
                    {/* "+4 DAYS" 标签 */}
                    {extension.days && (
                      <span className="inline-block px-3 py-1 text-xs font-bold text-black mb-3 tracking-wider uppercase">
                        {extension.days}
                      </span>
                    )}

                    {/* 标题 - Serif */}
                    <h3
                      className="text-2xl text-gray-900 mb-4 prose-force-wrap"
                      style={{ fontFamily: 'Montaga, serif', fontWeight: 400 }}
                    >
                      {extension.title}
                    </h3>

                    {/* 简介 */}
                    <p className="text-gray-700 leading-relaxed text-base mb-4 prose-force-wrap">
                      {extension.description}
                    </p>

                    {/* "VIEW DETAILS" 箭头链接 */}
                    {extension.link && (
                      <a
                        href={extension.link}
                        className="inline-flex items-center gap-2 text-gray-900 font-medium hover:gap-3 transition-all group prose-force-wrap"
                      >
                        <span>VIEW DETAILS</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    )}
                  </div>

                  {/* 右侧：图片 */}
                  {extension.image && (
                    <div className="w-full md:w-[200px] flex-shrink-0">
                      <img
                        src={extension.image}
                        alt={extension.title}
                        className="w-full aspect-square md:aspect-[4/3] rounded-sm object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
