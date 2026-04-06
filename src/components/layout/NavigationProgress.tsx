'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * 点击站内链接时顶部细条动画，提供「导航已触发」的即时反馈（无额外依赖）。
 * pathname 更新后自动收起。
 */
export default function NavigationProgress() {
	const pathname = usePathname();
	const [pending, setPending] = useState(false);

	useEffect(() => {
		setPending(false);
	}, [pathname]);

	useEffect(() => {
		const onPointerDown = (e: PointerEvent) => {
			if (e.button !== 0) return;
			const a = (e.target as HTMLElement | null)?.closest('a');
			if (!a) return;
			const href = a.getAttribute('href');
			if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
				return;
			}
			if (a.target === '_blank' || a.hasAttribute('download')) return;
			let url: URL;
			try {
				url = new URL(href, window.location.origin);
			} catch {
				return;
			}
			if (url.origin !== window.location.origin) return;
			if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			setPending(true);
		};

		document.addEventListener('pointerdown', onPointerDown, true);
		return () => document.removeEventListener('pointerdown', onPointerDown, true);
	}, []);

	return (
		<div
			className={`pointer-events-none fixed top-0 left-0 right-0 z-[12000] h-[2px] overflow-hidden transition-opacity duration-200 ${
				pending ? 'opacity-100' : 'opacity-0'
			}`}
			aria-hidden
		>
			<div className="navigation-progress-strip h-full w-[36%] bg-[#1e3b32] shadow-[0_0_6px_rgba(30,59,50,0.35)]" />
		</div>
	);
}
