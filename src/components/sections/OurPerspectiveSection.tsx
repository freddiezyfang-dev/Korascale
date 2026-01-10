'use client';

import React from 'react';

interface OurPerspectiveSectionProps {
  // 图片路径（优先级高于视频）
  imageSrc?: string;
  // 视频路径（如果提供视频，将使用视频而不是图片）
  videoSrc?: string;
  // 视频封面图（视频加载前的占位图）
  videoPoster?: string;
}

const OurPerspectiveSection: React.FC<OurPerspectiveSectionProps> = ({
  imageSrc = '/images/brand-philosophy/our-perspective.jpg', // 默认图片路径
  videoSrc, // 可选：如果提供视频，将使用视频
  videoPoster // 可选：视频封面图
}) => {
  return (
    <section className="w-full flex flex-col md:flex-row min-h-[70vh]">
      {/* 左侧文字区 - 暖米色背景 */}
      <div className="md:w-[40%] bg-[#FAF9F6] flex items-center justify-center p-8 md:p-16 lg:p-24">
        <div className="max-w-xl">
          <p className="text-sm font-body tracking-[0.2em] uppercase text-gray-700 mb-4">OUR PERSPECTIVE</p>
          <h2 className="text-4xl md:text-5xl font-heading text-[#111] leading-tight mb-8">
            Built on Judgment, Not Just Destinations
          </h2>
          <p className="text-base md:text-lg font-body font-light leading-relaxed text-[#4A4A4A] mb-6">
            We design journeys across China by asking one constant question: <i className="font-medium">is this place still worth entering — culturally, socially, and humanly?</i>
          </p>
          <p className="text-base md:text-lg font-body font-light leading-relaxed text-[#4A4A4A]">
            Some regions stay on our map for years. Others disappear. Not because they lose beauty, but because daily life gives way to performance. We work within China&apos;s transitions — where identities shift, economies change, and traditions adapt rather than freeze.
          </p>
        </div>
      </div>

      {/* 右侧视频/图片区 */}
      <div className="md:w-[60%] relative bg-gray-300 overflow-hidden">
        {videoSrc ? (
          // 如果提供了视频，使用视频
          <video
            src={videoSrc}
            poster={videoPoster || imageSrc} // 使用封面图或图片作为视频封面
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          // 否则使用图片
          <img 
            src={imageSrc}
            alt="Abstract background representing transition"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>
    </section>
  );
};

export default OurPerspectiveSection;

