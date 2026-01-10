'use client';

import React from 'react';

interface TheLensBehindKorascaleSectionProps {
  // 背景图片路径
  backgroundImage?: string;
  // 背景视频路径（可选，如果提供视频，将使用视频作为背景）
  backgroundVideo?: string;
}

const TheLensBehindKorascaleSection: React.FC<TheLensBehindKorascaleSectionProps> = ({
  backgroundImage = '/images/brand-philosophy/the-lens-behind-korascale.jpg', // 默认图片路径
  backgroundVideo // 可选：如果提供视频，将使用视频作为背景
}) => {
  return (
    <section className="relative w-full min-h-[70vh] flex items-end justify-center py-20 px-8 overflow-hidden">
      {/* 背景视频或图片 */}
      {backgroundVideo ? (
        // 如果提供了视频，使用视频作为背景
        <video
          src={backgroundVideo}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        // 否则使用图片作为背景
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${backgroundImage}')` }}
        />
      )}
      {/* 沉浸式背景遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

      <div className="relative z-20 w-full max-w-7xl mx-auto text-white">
        {/* 顶部标题区 */}
        <div className="mb-20 text-center">
          <p className="text-xs font-body tracking-[0.2em] uppercase !text-white mb-2">LIFE, WELL-TRAVELLED THROUGH TRANSITIONS</p>
          <h2 className="text-4xl md:text-6xl font-heading !text-white leading-tight">The Lens Behind Korascale</h2>
        </div>

        {/* 底部四列文案 - 增加 !text-white 确保优先级 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 mt-10">
          {/* Column 1 */}
          <div>
            <h3 className="text-sm font-body tracking-[0.2em] uppercase !text-white mb-3 opacity-80">
              01. HOW WE WORK
            </h3>
            <p className="text-base font-body font-light leading-relaxed !text-white">
              We travel without guests across seasons to listen to local changes. We only design journeys where meaningful encounters still breathe.
            </p>
          </div>
          {/* Column 2 */}
          <div>
            <h3 className="text-sm font-body tracking-[0.2em] uppercase !text-white mb-3 opacity-80">
              02. CONSISTENT LENS
            </h3>
            <p className="text-base font-body font-light leading-relaxed !text-white">
              Shaped by founder Freddie&apos;s years of observing China&apos;s patterns, our decisions are driven by understanding, not market trends.
            </p>
          </div>
          {/* Column 3 */}
          <div>
            <h3 className="text-sm font-body tracking-[0.2em] uppercase !text-white mb-3 opacity-80">
              03. PURPOSEFUL EXCLUSION
            </h3>
            <p className="text-base font-body font-light leading-relaxed !text-white">
              Our work depends on exclusion. We leave out the landmarks-turned-spectacles to ensure what remains stays deeply meaningful.
            </p>
          </div>
          {/* Column 4 */}
          <div>
            <h3 className="text-sm font-body tracking-[0.2em] uppercase !text-white mb-3 opacity-80">
              04. AUTHENTIC ENCOUNTERS
            </h3>
            <p className="text-base font-body font-light leading-relaxed !text-white">
              You are not consuming a version of China; you are temporarily borrowing a way of seeing a nation in motion.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TheLensBehindKorascaleSection;

