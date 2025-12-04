 'use client';

import Link from 'next/link';
import { DestinationsDropdown, InspirationsDropdown, JourneysDropdown } from '@/components/ui/Dropdown';
import { useEffect, useState } from 'react';

interface NavSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavSidebar({ isOpen, onClose }: NavSidebarProps) {
  const [scrolled, setScrolled] = useState(false);

  // 防止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 根据滚动位置动态调整侧边栏起始位置：
  // - 在页面顶部：从 Header + Nav 底部开始（原来的 135/141/147px）
  // - 向下滚动后：从粘性 Nav 底部开始（50/56/62px）
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const overlayTopClass = scrolled
    ? 'top-[50px] sm:top-[56px] lg:top-[62px]'
    : 'top-[135px] sm:top-[141px] lg:top-[147px]';

  const sidebarTopClass = overlayTopClass;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className={`fixed inset-x-0 bottom-0 ${overlayTopClass} z-[9998] bg-black/20 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* 侧边栏：顶部与主导航下边线对齐 */}
      <aside
        className={`fixed left-0 bottom-0 w-[80%] max-w-sm bg-white z-[9999] shadow-xl flex flex-col ${sidebarTopClass} transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 内容区域：四个主类目及子类目，字体与 nav 一致 */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 text-sm sm:text-base text-black font-subheading font-semibold">
          {/* Destinations */}
          <div>
            <Link href="/destinations" onClick={onClose} className="block py-2">
              Destinations
            </Link>
            <div className="mt-1 pl-3 border-l border-gray-200 text-[14px] font-normal space-y-1">
              {/* 复用下拉菜单中的项目结构 */}
              <DestinationsDropdown />
            </div>
          </div>

          {/* Journeys */}
          <div>
            <Link href="/journeys" onClick={onClose} className="block py-2">
              Journeys
            </Link>
            <div className="mt-1 pl-3 border-l border-gray-200 text-[14px] font-normal space-y-1">
              <JourneysDropdown />
            </div>
          </div>

          {/* Inspirations */}
          <div>
            <Link href="/inspirations" onClick={onClose} className="block py-2">
              Inspirations
            </Link>
            <div className="mt-1 pl-3 border-l border-gray-200 text-[14px] font-normal space-y-1">
              <InspirationsDropdown />
            </div>
          </div>

          {/* Accommodations */}
          <div>
            <Link href="/accommodations" onClick={onClose} className="block py-2">
              Accommodations
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}


