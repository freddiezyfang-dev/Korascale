'use client';

import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { useOrderManagement } from '@/context/OrderManagementContext';
import Dropdown from '@/components/ui/Dropdown';
import { UserDropdown } from '@/components/ui/UserDropdown';

// 使用本地图片资源 - 你的logo图片
const imgLogo = "/logo.png"; // 使用logo文件
const imgMail = "/icons/mail.svg";
const imgInstagram = "/icons/instagram.svg";
const imgTiktok = "/icons/tiktok.svg";
const imgGlobe = "/globe.svg";
const imgSearchOutlined = "/icons/search.svg";
const imgUser = "/icons/user.svg";

function HeaderLeft() {
	return (
		<Link href="/" className="flex items-center gap-3 lg:gap-4 h-[85px] overflow-hidden px-px shrink-0 hover:opacity-80 transition-opacity" data-name="Logo" data-node-id="770:178">
			{/* Logo 图片 - 响应式尺寸，移动端较小 */}
			<div className="shrink-0 h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 flex items-center justify-center" data-name="Logo" data-node-id="770:179">
				<img 
					src={imgLogo} 
					alt="Korascale Logo" 
					className="w-full h-full object-contain"
					style={{ 
						width: '100%', 
						height: '100%', 
						objectFit: 'contain',
						filter: 'brightness(0) invert(1)'
					}}
				/>
			</div>
			{/* 品牌名称 - 使用 Playfair Display 字体 */}
			<div className="shrink-0" data-node-id="770:180">
				<p 
					className="text-xl font-serif font-bold tracking-widest leading-none"
					style={{ 
						color: '#F5F2E9',
						fontFamily: 'Playfair Display, serif',
						letterSpacing: '0.1em'
					}}
				>
					KORASCALE
				</p>
			</div>
		</Link>
	);
}

function UserSection() {
  const { user, logout } = useUser();
  const { addLoginRecord, updateLogoutRecord } = useOrderManagement();

  const handleLogout = () => {
    if (user) {
      updateLogoutRecord(user.id);
    }
    logout();
  };

	return (
		<div className="flex items-center gap-4">
			{user ? (
				<div className="flex items-center gap-3">
					<Dropdown
						trigger={
							<div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
								<img 
									src={imgUser} 
									alt="User" 
									className="w-5 h-5"
								/>
								<span className="text-white text-sm hidden lg:block">
									{user.name}
								</span>
							</div>
						}
						className="right-0"
					>
						<UserDropdown />
					</Dropdown>
					{user.email === 'admin@korascale.com' && (
						<Link 
							href="/admin"
							className="text-white text-sm hover:text-gray-300 transition-colors bg-white bg-opacity-20 px-3 py-1 rounded"
						>
							Admin
						</Link>
					)}
				</div>
			) : null}
		</div>
	);
}

function SocialAndSearch() {
	return (
		<div className="flex items-center justify-center gap-2 sm:gap-4 lg:gap-[35px] overflow-hidden px-2 sm:px-4 lg:px-16 py-3 sm:py-4 lg:py-[25px] shrink-0" data-name="Scial Media" data-node-id="770:181">
			{/* Social Media Icons - Hidden on mobile, visible on desktop */}
			<div className="hidden lg:flex items-center gap-6">
				{/* 邮件图标 */}
				<a 
					href="mailto:customer-service@korascale.com" 
					className="shrink-0 size-6 hover:opacity-80 transition-opacity cursor-pointer" 
					data-name="mail" 
					data-node-id="770:182"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img aria-hidden className="block size-full" src={imgMail} alt="Email" />
				</a>
				{/* Instagram图标 */}
				<a 
					href="https://www.instagram.com/korascaletravel/" 
					className="shrink-0 size-6 hover:opacity-80 transition-opacity cursor-pointer" 
					data-name="instagram" 
					data-node-id="770:187"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img aria-hidden className="block size-full" src={imgInstagram} alt="Instagram" />
				</a>
				{/* TikTok图标 */}
				<a 
					href="https://www.tiktok.com/@korascale_" 
					className="shrink-0 size-6 hover:opacity-80 transition-opacity cursor-pointer" 
					data-name="tiktok" 
					target="_blank"
					rel="noopener noreferrer"
				>
					<img aria-hidden className="block size-full" src={imgTiktok} alt="TikTok" />
				</a>
				{/* 语言图标 */}
				<Link 
					href="/language" 
					className="shrink-0 size-6 hover:opacity-80 transition-opacity cursor-pointer" 
					data-name="globe" 
					data-node-id="770:193"
				>
					<img aria-hidden className="block size-full" src={imgGlobe} alt="Language" />
				</Link>
			</div>
			{/* Search Section */}
			<Link 
				href="/journeys" 
				className="bg-[#1e3b32] flex items-center justify-center gap-1 sm:gap-2 overflow-hidden px-2 sm:px-4 lg:px-[51px] py-2 sm:py-3 lg:py-[14px] shrink-0 hover:opacity-80 transition-opacity cursor-pointer rounded touch-manipulation" 
				data-name="Language" 
				data-node-id="770:192"
			>
				<div className="shrink-0 size-4 sm:size-5 lg:size-6" data-name="SearchOutlined" data-node-id="771:244">
					<img aria-hidden className="block size-full" src={imgSearchOutlined} alt="Search" />
				</div>
				<span className="text-white text-xs sm:text-sm lg:text-base whitespace-nowrap hidden sm:inline">find your journey</span>
			</Link>
		</div>
	);
}

export default function Header() {
	return (
		<header className="w-full bg-[#1e3b32] text-white relative z-50" data-name="Header/Main" data-node-id="771:249">
			<div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 md:px-6 lg:px-[50px] py-0">
				<HeaderLeft />
				<div className="flex items-center gap-2 sm:gap-4">
					<SocialAndSearch />
					<UserSection />
				</div>
			</div>
		</header>
	);
}
