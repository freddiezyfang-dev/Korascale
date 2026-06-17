'use client';

import { Instagram, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { Text } from '@/components/common';

export function ArticleShareButtons() {
	return (
		<div className="flex items-center gap-4 min-w-0">
			<Text className="text-xs text-gray-500 uppercase tracking-widest font-sans">Share</Text>
			<div className="flex gap-3">
				<button
					type="button"
					onClick={() => window.open('https://www.instagram.com/', '_blank')}
					className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
					aria-label="Share on Instagram"
				>
					<Instagram className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={() =>
						window.open(
							`https://wa.me/?text=${encodeURIComponent(window.location.href)}`,
							'_blank'
						)
					}
					className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
					aria-label="Share on WhatsApp"
				>
					<MessageCircle className="w-4 h-4" />
				</button>
				<button
					type="button"
					onClick={() => {
						navigator.clipboard.writeText(window.location.href);
						alert('链接已复制');
					}}
					className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
					aria-label="Copy link"
				>
					<LinkIcon className="w-4 h-4" />
				</button>
			</div>
		</div>
	);
}

export {
	ArticleDesktopSidebar,
	ArticleMobileSidebar,
} from '@/components/articles/ArticleRelatedSidebar';
