 'use client';

import Link from 'next/link';
import {
  DestinationsDropdown,
  InspirationsDropdown,
  JourneysDropdown,
  SolutionsDropdown,
} from '@/components/ui/Dropdown';
import { useEffect, useState } from 'react';

interface NavSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavSidebar({ isOpen, onClose }: NavSidebarProps) {
  const [scrolled, setScrolled] = useState(false);

  // 锁定主页面滚动：不要用 body position:fixed + top:-scrollY，否则整页内容上移，
  // 视口只会看到「滚动后的区域」，吸顶 Navbar 会被移到视口上方而「消失」。
  useEffect(() => {
    if (!isOpen) return;

    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevBodyOverscroll = body.style.overscrollBehavior;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      html.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overscrollBehavior = prevBodyOverscroll;
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

  // 侧栏打开时顶栏改为 fixed（见 NavMenu + globals），遮罩/侧栏须始终从「绿 Header + 米 Nav」之下开始，避免盖住可点击的导航条
  const overlayTopClass = isOpen
    ? 'top-[135px] sm:top-[141px] lg:top-[147px]'
    : scrolled
      ? 'top-[50px] sm:top-[56px] lg:top-[62px]'
      : 'top-[135px] sm:top-[141px] lg:top-[147px]';

  const sidebarTopClass = overlayTopClass;
  const sidebarHeightClass = isOpen
    ? 'h-[calc(100vh-135px)] sm:h-[calc(100vh-141px)] lg:h-[calc(100vh-147px)]'
    : scrolled
      ? 'h-[calc(100vh-50px)] sm:h-[calc(100vh-56px)] lg:h-[calc(100vh-62px)]'
      : 'h-[calc(100vh-135px)] sm:h-[calc(100vh-141px)] lg:h-[calc(100vh-147px)]';

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className={`fixed inset-x-0 bottom-0 ${overlayTopClass} z-[9998] bg-black/20 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto touch-none' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* 侧边栏：顶部与主导航下边线对齐 */}
      <aside
        className={`fixed left-0 w-[80%] max-w-sm bg-white z-[9999] shadow-xl flex flex-col min-h-0 ${sidebarTopClass} ${sidebarHeightClass} transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 顶部固定 Heading：显式背景 + 提高层级，避免滚动时“标题消失” */}
        <div className="shrink-0 sticky top-0 z-20 bg-[#F5F2ED] border-b border-gray-200 px-4 py-3">
          <h2 className="text-[16px] sm:text-[17px] font-subheading font-semibold text-black">Menu</h2>
        </div>

        {/* 下方滚动区：限制滚动发生在列表区域，而不是整个侧边栏 */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-20 space-y-6 text-sm sm:text-base text-black font-subheading font-semibold">
          {/* Destinations */}
          <div>
            <Link prefetch={true} href="/destinations" onClick={onClose} className="block py-2">
              Destinations
            </Link>
            <div className="mt-1 pl-3 border-l border-gray-200 text-[14px] font-normal space-y-1">
              {/* 复用下拉菜单中的项目结构 */}
              <DestinationsDropdown />
            </div>
          </div>

          {/* Journeys */}
          <div>
            <Link prefetch={true} href="/journeys" onClick={onClose} className="block py-2">
              Journeys
            </Link>
            <div className="mt-1 pl-3 border-l border-gray-200 text-[14px] font-normal space-y-1">
              <JourneysDropdown />
            </div>
          </div>

          {/* Inspirations */}
          <div>
            <Link prefetch={true} href="/inspirations" onClick={onClose} className="block py-2">
              Inspirations
            </Link>
            <div className="mt-1 pl-3 border-l border-gray-200 text-[14px] font-normal space-y-1">
              <InspirationsDropdown />
            </div>
          </div>

          {/* Solutions */}
          <div>
            <Link prefetch={true} href="/solutions" onClick={onClose} className="block py-2">
              Solutions
            </Link>
            <div className="mt-1 pl-3 border-l border-gray-200 text-[14px] font-normal space-y-1">
              <SolutionsDropdown />
            </div>
          </div>

          {/* Accommodations */}
          <div>
            <Link prefetch={true} href="/accommodations" onClick={onClose} className="block py-2">
              Accommodations
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}


